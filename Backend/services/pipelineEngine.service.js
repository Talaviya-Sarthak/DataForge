const db = require('../Database/db');

/**
 * PipelineEngine – manages dataset_pipeline_steps (metadata only).
 *
 * Rules:
 *  - Steps are linked directly to a dataset_id.
 *  - Only metadata is stored – never dataset content.
 *  - Undo = delete last step + rebuild.
 *  - Resume = re-upload file + replay all steps from DB.
 */
class PipelineEngine {
  // ─────────────────────────────────────────────
  // ADD STEP
  // ─────────────────────────────────────────────
  async addStep(datasetId, operationType, columnName, parameters) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get next step_order
      const [rows] = await connection.execute(
        'SELECT COALESCE(MAX(step_order), -1) + 1 AS next_order FROM dataset_pipeline_steps WHERE dataset_id = ?',
        [datasetId]
      );
      const stepOrder = rows[0].next_order;

      await connection.execute(
        `INSERT INTO dataset_pipeline_steps (dataset_id, step_order, operation_type, column_name, parameters)
         VALUES (?, ?, ?, ?, ?)`,
        [
          datasetId,
          stepOrder,
          operationType,
          columnName || null,
          typeof parameters === 'string' ? parameters : JSON.stringify(parameters),
        ]
      );

      // Mark dataset as in_progress
      await connection.execute(
        "UPDATE datasets SET status = 'in_progress', is_active = TRUE WHERE id = ?",
        [datasetId]
      );

      await connection.commit();
      return stepOrder;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ─────────────────────────────────────────────
  // REMOVE LAST STEP (undo)
  // ─────────────────────────────────────────────
  async removeLastStep(datasetId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        'SELECT id, step_order FROM dataset_pipeline_steps WHERE dataset_id = ? ORDER BY step_order DESC LIMIT 1',
        [datasetId]
      );

      if (!rows.length) {
        await connection.commit();
        return { removed: false, remainingSteps: 0 };
      }

      await connection.execute(
        'DELETE FROM dataset_pipeline_steps WHERE id = ?',
        [rows[0].id]
      );

      const [countRows] = await connection.execute(
        'SELECT COUNT(*) AS cnt FROM dataset_pipeline_steps WHERE dataset_id = ?',
        [datasetId]
      );

      await connection.commit();
      return { removed: true, removedStepOrder: rows[0].step_order, remainingSteps: countRows[0].cnt };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ─────────────────────────────────────────────
  // GET ALL STEPS FOR A DATASET (ordered)
  // ─────────────────────────────────────────────
  async getStepsForDataset(datasetId) {
    const [rows] = await db.execute(
      'SELECT * FROM dataset_pipeline_steps WHERE dataset_id = ? ORDER BY step_order ASC',
      [datasetId]
    );
    return rows.map(row => ({
      ...row,
      parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters,
    }));
  }

  // ─────────────────────────────────────────────
  // BUILD ML-SERVICE PAYLOAD from stored steps
  // ─────────────────────────────────────────────
  buildRebuildPayload(steps, previewRows = 100) {
    return {
      steps: steps.map(step => ({
        step_index: step.step_order,
        type: step.operation_type,
        params: step.parameters,
      })),
      start_index: 0,
      stop_index: steps.length > 0 ? steps[steps.length - 1].step_order : null,
      preview_rows: previewRows,
      rebuild_from_raw: true,
    };
  }

  // ─────────────────────────────────────────────
  // COUNT STEPS
  // ─────────────────────────────────────────────
  async getStepCount(datasetId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM dataset_pipeline_steps WHERE dataset_id = ?',
      [datasetId]
    );
    return rows[0].cnt;
  }
}

module.exports = new PipelineEngine();
