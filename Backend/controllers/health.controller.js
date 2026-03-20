const { connection } = require('../config/redis.config');
const jobService = require('../services/job.service');

/**
 * Health check endpoint
 * Checks Redis connection and queue status
 */
exports.healthCheck = async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {},
  };

  try {
    // Check Redis connection
    const redisPing = await connection.ping();
    health.services.redis = {
      status: redisPing === 'PONG' ? 'up' : 'down',
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || '6379',
    };

    // Check queue metrics
    const metrics = await jobService.getQueueMetrics();
    health.services.queue = {
      status: 'up',
      metrics,
    };

    // Overall status
    const allUp = Object.values(health.services).every(s => s.status === 'up');
    health.status = allUp ? 'healthy' : 'degraded';

    return res.status(allUp ? 200 : 503).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    return res.status(503).json(health);
  }
};
