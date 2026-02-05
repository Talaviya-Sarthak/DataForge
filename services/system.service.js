const pipelineService = require('./pipeline.service');

class SystemService {
  async initialize() {
    try {
      // Initialize pipeline service (mark running pipelines as paused)
      await pipelineService.initializeSystem();
      console.log('System initialized: Running pipelines marked as paused');
    } catch (error) {
      console.error('System initialization failed:', error);
      throw error;
    }
  }
}

module.exports = new SystemService();