const pipelineService = require('../services/pipeline.service');
const db = require('../Database/db');

class PipelineController {
  async createPipeline(req, res) {
    try {
      let { datasetId, pipelineType } = req.body;
      const userId = req.user.id;
      
      // If no datasetId provided, get user's active dataset
      if (!datasetId) {
        const [rows] = await db.execute(
          'SELECT id FROM datasets WHERE user_id = ? AND is_active = TRUE',
          [userId]
        );
        if (!rows.length) {
          return res.status(400).json({ success: false, error: 'No active dataset found. Please upload a dataset first.' });
        }
        datasetId = rows[0].id;
      }
      
      const pipelineId = await pipelineService.createPipeline(userId, datasetId, pipelineType);
      res.json({ success: true, pipelineId });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async executePipeline(req, res) {
    try {
      const { pipelineId } = req.params;
      const result = await pipelineService.executePipeline(pipelineId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async undoToStep(req, res) {
    try {
      const { pipelineId } = req.params;
      const { stepIndex } = req.body || {};
      
      if (stepIndex === undefined || stepIndex === null) {
        return res.status(400).json({ success: false, error: 'stepIndex is required in request body' });
      }
      
      const pipeline = await pipelineService.getPipelineById(parseInt(pipelineId));
      if (!pipeline) {
        return res.status(404).json({ success: false, error: 'Pipeline not found' });
      }
      
      const result = await pipelineService.undoToStep(parseInt(pipelineId), stepIndex);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async resumePipeline(req, res) {
    try {
      const { pipelineId } = req.params;
      const result = await pipelineService.resumePipeline(pipelineId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getResumablePipelines(req, res) {
    try {
      const userId = req.user.id;
      const pipelines = await pipelineService.getResumablePipelines(userId);
      res.json({ success: true, data: pipelines });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async addStep(req, res) {
    try {
      const { pipelineId } = req.params;
      const { operation, params } = req.body;
      const stepIndex = await pipelineService.addStep(pipelineId, operation, params);
      res.json({ success: true, stepIndex });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new PipelineController();