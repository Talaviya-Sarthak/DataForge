const db = require('../Database/db');
const mlService = require('./ml.service');
const { v4: uuidv4 } = require('uuid');

// Map frontend step types to ML service operation names
const STEP_TYPE_MAPPING = {
  'label_encode': 'encoding',
  'one_hot_encode': 'encoding', 
  'onehot': 'encoding',
  'ordinal_encode': 'encoding',
  'target_encode': 'encoding',
  'handle_missing': 'missing_values',
  'remove_outliers': 'outliers',
  'cap_outliers': 'outliers',
  'standardize': 'scaling',
  'normalize': 'scaling',
  'robust_scale': 'scaling',
  'log_transform': 'scaling',
  'select_features': 'feature_selection',
  'balance_data': 'imbalance',
  'value_standardization': 'value_standardization'
};

class PipelineService {
  // =========================================
  // 1. PIPELINE LIFECYCLE MANAGEMENT
  // =========================================

  async createPipeline(userId, datasetId, pipelineType = 'manual') {
    // FIX 1: Guard against undefined SQL binds
    if (!userId) {
      throw new Error('Authenticated user_id is required to create pipeline');
    }
    if (!datasetId) {
      throw new Error('dataset_id is required to create pipeline');
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Verify dataset exists and belongs to user
      const [datasetRows] = await connection.execute(
        'SELECT id, original_filename FROM datasets WHERE id = ? AND user_id = ?',
        [datasetId, userId]
      );
      if (!datasetRows.length) {
        throw new Error('Dataset not found or access denied');
      }

      // Create pipeline
      const [result] = await connection.execute(
        'INSERT INTO pipelines (user_id, dataset_id, pipeline_type) VALUES (?, ?, ?)',
        [userId, datasetId, pipelineType]
      );

      await this._logExecution(connection, result.insertId, null, 'info', 'Pipeline created');
      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getDatasetForPipeline(pipelineId) {
    const [rows] = await db.execute(`
      SELECT d.id, d.original_filename, d.user_id
      FROM datasets d
      JOIN pipelines p ON d.id = p.dataset_id
      WHERE p.id = ?
    `, [pipelineId]);
    return rows[0] || null;
  }

  async initializeSystem() {
    try {
      // Mark all running pipelines as paused on system restart
      const [result] = await db.execute(
        'UPDATE pipelines SET status = ? WHERE status = ?',
        ['paused', 'running']
      );
      
      if (result.affectedRows > 0) {
        console.log(`⚙️ Marked ${result.affectedRows} running pipelines as paused for recovery`);
        
        // Log recovery action
        await db.execute(
          'INSERT INTO pipeline_execution_logs (pipeline_id, log_level, message) SELECT id, "info", "Pipeline paused due to system restart" FROM pipelines WHERE status = "paused"'
        );
      }
    } catch (error) {
      console.error('System initialization error:', error.message);
      throw error;
    }
  }

  async getResumablePipelines(userId) {
    const [rows] = await db.execute(`
      SELECT p.*, d.original_filename 
      FROM pipelines p 
      JOIN datasets d ON p.dataset_id = d.id 
      WHERE p.user_id = ? AND p.status IN ('draft', 'paused', 'failed')
      ORDER BY p.updated_at DESC
    `, [userId]);
    return rows;
  }

  async getPipelineById(pipelineId) {
    const [rows] = await db.execute(`
      SELECT p.*, d.original_filename 
      FROM pipelines p 
      JOIN datasets d ON p.dataset_id = d.id 
      WHERE p.id = ?
    `, [pipelineId]);
    return rows[0] || null;
  }

  // =========================================
  // 2. STEP MANAGEMENT
  // =========================================

  async addStep(pipelineId, operation, params) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get next step index
      const [indexRows] = await connection.execute(
        'SELECT COALESCE(MAX(step_index), -1) + 1 as next_index FROM pipeline_steps WHERE pipeline_id = ?',
        [pipelineId]
      );
      const stepIndex = indexRows[0].next_index;

      // Ensure params is properly serialized
      const serializedParams = typeof params === 'object' ? JSON.stringify(params) : params;

      // Insert step
      await connection.execute(
        'INSERT INTO pipeline_steps (pipeline_id, step_index, step_type, step_params) VALUES (?, ?, ?, ?)',
        [pipelineId, stepIndex, operation, serializedParams]
      );

      // Update pipeline total steps
      await connection.execute(
        'UPDATE pipelines SET total_steps = total_steps + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [pipelineId]
      );

      await this._logExecution(connection, pipelineId, stepIndex, 'info', `Step added: ${operation}`);
      await connection.commit();
      return stepIndex;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async undoToStep(pipelineId, targetStep) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Delete steps after target
      await connection.execute(
        'DELETE FROM pipeline_steps WHERE pipeline_id = ? AND step_index > ?',
        [pipelineId, targetStep]
      );

      // Delete previews after target
      await connection.execute(
        'DELETE FROM pipeline_previews WHERE pipeline_id = ? AND step_index > ?',
        [pipelineId, targetStep]
      );

      // Update pipeline state
      const [countRows] = await connection.execute(
        'SELECT COUNT(*) as count FROM pipeline_steps WHERE pipeline_id = ?',
        [pipelineId]
      );
      
      await connection.execute(
        'UPDATE pipelines SET total_steps = ?, current_step_index = ?, status = "draft" WHERE id = ?',
        [countRows[0].count, targetStep, pipelineId]
      );

      await this._logExecution(connection, pipelineId, targetStep, 'info', `Undone to step ${targetStep}`);
      await connection.commit();

      // FIX 2: Remove auto-execution from undo - return state only
      return {
        pipelineId,
        current_step_index: targetStep,
        status: 'draft'
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getOrderedSteps(pipelineId) {
    const [rows] = await db.execute(
      'SELECT * FROM pipeline_steps WHERE pipeline_id = ? ORDER BY step_index',
      [pipelineId]
    );
    return rows.map(row => ({
      ...row,
      step_params: typeof row.step_params === 'string' ? JSON.parse(row.step_params) : row.step_params
    }));
  }

  // =========================================
  // 3. PIPELINE EXECUTION ORCHESTRATION
  // =========================================

  async executePipeline(pipelineId) {
    const pipeline = await this.getPipelineById(pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');

    // Step 2: State Transition Guards
    if (pipeline.status === 'completed') {
      throw new Error('Cannot execute completed pipeline');
    }
    if (pipeline.status === 'running') {
      throw new Error('Pipeline already running');
    }

    return await this.replayToStep(pipelineId, pipeline.total_steps - 1);
  }

  async replayToStep(pipelineId, targetStep) {
    const connection = await db.getConnection();
    const executionId = uuidv4();
    
    try {
      await connection.beginTransaction();

      // Update pipeline status
      await connection.execute(
        'UPDATE pipelines SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['running', pipelineId]
      );

      // Get steps up to target (deterministic replay)
      const steps = await this.getOrderedSteps(pipelineId);
      const replaySteps = steps.filter(step => step.step_index <= targetStep);

      // Step 4: Send only steps to ML service - no file handling
      const mlPayload = {
        steps: replaySteps.map(step => {
          // Map frontend step type to ML service operation name
          const mlStepType = STEP_TYPE_MAPPING[step.step_type] || step.step_type;
          
          // Parse step_params to JSON object for ML service
          let stepParams = step.step_params;
          if (typeof stepParams === 'string') {
            try {
              stepParams = JSON.parse(stepParams);
            } catch (e) {
              stepParams = {};
            }
          }
          
          return {
            step_index: step.step_index,
            type: mlStepType,
            params: stepParams || {}
          };
        }),
        start_index: 0,
        stop_index: targetStep,
        preview_rows: 20
      };



      const startTime = Date.now();
      
      try {
        const result = await mlService.preprocessDataset(mlPayload);
        const executionTime = Date.now() - startTime;

        // Store preview
        await this._storePreview(connection, pipelineId, targetStep, result);

        // Update pipeline status
        await connection.execute(
          'UPDATE pipelines SET status = ?, current_step_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['completed', targetStep, pipelineId]
        );

        // Mark steps as completed
        await connection.execute(
          'UPDATE pipeline_steps SET status = ?, execution_time_ms = ? WHERE pipeline_id = ? AND step_index <= ?',
          ['completed', executionTime, pipelineId, targetStep]
        );

        await this._logExecution(connection, pipelineId, targetStep, 'info', `Pipeline replayed to step ${targetStep}`, { executionId });
        await connection.commit();
        return result;

      } catch (mlError) {
        await connection.rollback();
        
        // Handle specific ML service errors
        if (mlError.response?.status === 400 && mlError.response?.data?.detail === "No dataset uploaded") {
          throw new Error("Please upload a dataset first before executing the pipeline");
        }
        
        if (mlError.code === 'ECONNREFUSED' || mlError.code === 'ENOTFOUND') {
          throw new Error("ML service unavailable");
        }
        
        // Forward other ML errors
        throw new Error(mlError.response?.data?.detail || mlError.message || "ML service error");
      }

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      
      // Mark pipeline as failed
      await db.execute(
        'UPDATE pipelines SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['failed', pipelineId]
      );

      // FIX 3: Safe execution logging - guard against undefined targetStep
      await this._logExecution(
        null,
        pipelineId,
        Number.isInteger(targetStep) ? targetStep : null,
        'error',
        error.message,
        { executionId, error: error.stack }
      );
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async resumePipeline(pipelineId) {
    const pipeline = await this.getPipelineById(pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');

    // Always replay from step 0 (deterministic)
    return await this.replayToStep(pipelineId, pipeline.current_step_index);
  }

  // =========================================
  // 4. PREVIEW PERSISTENCE
  // =========================================

  async getLatestPreview(pipelineId) {
    const [rows] = await db.execute(
      'SELECT * FROM pipeline_previews WHERE pipeline_id = ? ORDER BY step_index DESC LIMIT 1',
      [pipelineId]
    );
    
    if (!rows.length) return null;
    
    const preview = rows[0];
    return {
      data: JSON.parse(preview.preview_data),
      rows: preview.row_count,
      columns: JSON.parse(preview.column_names)
    };
  }

  async getPreviewAtStep(pipelineId, stepIndex) {
    const [rows] = await db.execute(
      'SELECT * FROM pipeline_previews WHERE pipeline_id = ? AND step_index = ?',
      [pipelineId, stepIndex]
    );
    
    if (!rows.length) return null;
    
    const preview = rows[0];
    return {
      data: JSON.parse(preview.preview_data),
      rows: preview.row_count,
      columns: JSON.parse(preview.column_names)
    };
  }

  // =========================================
  // 5. PRIVATE HELPER METHODS
  // =========================================

  async _storePreview(connection, pipelineId, stepIndex, previewData) {
    await connection.execute(`
      INSERT INTO pipeline_previews (pipeline_id, step_index, preview_data, row_count, column_names)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        preview_data = VALUES(preview_data),
        row_count = VALUES(row_count),
        column_names = VALUES(column_names)
    `, [
      pipelineId,
      stepIndex,
      JSON.stringify(previewData.data),
      previewData.rows,
      JSON.stringify(previewData.columns)
    ]);
  }

  async _logExecution(connection, pipelineId, stepIndex, level, message, metadata = null) {
    const query = 'INSERT INTO pipeline_execution_logs (pipeline_id, step_index, log_level, message, metadata) VALUES (?, ?, ?, ?, ?)';
    const params = [pipelineId, stepIndex, level, message, metadata ? JSON.stringify(metadata) : null];
    
    if (connection) {
      await connection.execute(query, params);
    } else {
      await db.execute(query, params);
    }
  }
}

module.exports = new PipelineService();