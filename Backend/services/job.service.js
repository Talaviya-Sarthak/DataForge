const { trainingQueue } = require('../queues/training.queue');
const pool = require('../Database/db');
const logger = require('../utils/logger');

/**
 * Get job status from Redis queue
 */
const getJobStatus = async (jobId) => {
  try {
    const job = await trainingQueue.getJob(jobId);
    
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress || 0;
    const failedReason = job.failedReason || null;

    return {
      job_id: jobId,
      status: state, // 'waiting', 'active', 'completed', 'failed', 'delayed'
      progress,
      error: failedReason,
      data: job.data,
      returnvalue: job.returnvalue,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  } catch (error) {
    logger.error('[QUEUE]', 'Error getting job status', { error: error.message });
    throw error;
  }
};

/**
 * Get experiment status — O(1) direct lookup since jobId === experimentId.
 */
const getExperimentStatus = async (experimentId) => {
  try {
    // Direct O(1) lookup — job was added with jobId: experiment_id
    const job = await trainingQueue.getJob(experimentId);
    if (!job) return null;

    const state = await job.getState();
    const statusMap = { active: 'running', waiting: 'queued', delayed: 'queued' };

    return {
      experiment_id: experimentId,
      status: statusMap[state] || state, // running | queued | completed | failed
      progress: job.progress || 0,
      job_id: job.id,
      error: job.failedReason || null,
      result: job.returnvalue || null,
    };
  } catch (error) {
    logger.error('[QUEUE]', 'Error getting experiment status', { error: error.message });
    throw error;
  }
};

/**
 * Cancel a job
 */
const cancelJob = async (jobId) => {
  try {
    const job = await trainingQueue.getJob(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }

    await job.remove();
    
    return { success: true, message: 'Job cancelled successfully' };
  } catch (error) {
    logger.error('[QUEUE]', 'Error cancelling job', { error: error.message });
    throw error;
  }
};

/**
 * Get queue metrics
 */
const getQueueMetrics = async () => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      trainingQueue.getWaitingCount(),
      trainingQueue.getActiveCount(),
      trainingQueue.getCompletedCount(),
      trainingQueue.getFailedCount(),
      trainingQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error('[QUEUE]', 'Error getting queue metrics', { error: error.message });
    throw error;
  }
};

/**
 * Clean old jobs from queue
 */
const cleanQueue = async (grace = 86400000) => {
  try {
    // Clean completed jobs older than grace period (default 24 hours)
    await trainingQueue.clean(grace, 100, 'completed');
    
    // Clean failed jobs older than 7 days
    await trainingQueue.clean(604800000, 100, 'failed');
    
    return { success: true, message: 'Queue cleaned successfully' };
  } catch (error) {
    logger.error('[QUEUE]', 'Error cleaning queue', { error: error.message });
    throw error;
  }
};

module.exports = {
  getJobStatus,
  getExperimentStatus,
  cancelJob,
  getQueueMetrics,
  cleanQueue,
};
