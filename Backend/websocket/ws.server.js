const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { trainingQueueEvents } = require('../queues/training.events');
const { trainingQueue } = require('../queues/training.queue');
const logger = require('../utils/logger');

/**
 * Initialize Socket.io server and bridge BullMQ events to subscribed clients.
 * @param {import('http').Server} httpServer
 */
function initWebSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        },
        transports: ['websocket'],
    });

    // ── Auth middleware ──────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    // ── Connection handler ───────────────────────────────────
    io.on('connection', (socket) => {
        logger.info('[WS]', 'Client connected', { socketId: socket.id, userId: socket.userId });

        socket.on('subscribe:job', ({ experimentId }) => {
            socket.join(`job:${experimentId}`);
            logger.debug('[WS]', 'Subscribed to job', { experimentId, socketId: socket.id });
        });

        socket.on('unsubscribe:job', ({ experimentId }) => {
            socket.leave(`job:${experimentId}`);
        });

        socket.on('disconnect', () => {
            logger.info('[WS]', 'Client disconnected', { socketId: socket.id });
        });
    });

    // ── Bridge BullMQ events → WebSocket rooms ───────────────

    trainingQueueEvents.on('progress', async ({ jobId, data }) => {
        // Use the map populated at 'active' time — avoids getJob() call on hot path
        const experimentId = jobExperimentMap.get(jobId);
        if (!experimentId) return;

        logger.info('[WORKER]', 'Progress update', { experimentId, progress: data });
        io.to(`job:${experimentId}`).emit(`job:${experimentId}:progress`, {
            progress: typeof data === 'object' ? data.progress ?? data : data,
            models_completed: typeof data === 'object' ? data.models_completed : undefined,
        });
    });

    // NOTE: For 'completed' and 'failed', QueueEvents does NOT include job.data in the payload.
    // trainingQueue.getJob(jobId) may return null if removeOnComplete already cleaned it.
    // FIX: maintain an in-process jobId → experimentId map populated at 'active' time.
    const jobExperimentMap = new Map(); // jobId → experimentId

    trainingQueueEvents.on('active', async ({ jobId }) => {
        logger.info('[WORKER]', 'Job started', { jobId });
        try {
            const job = await trainingQueue.getJob(jobId);
            if (job?.data?.experiment_id) {
                jobExperimentMap.set(jobId, job.data.experiment_id);
            }
        } catch { /* non-critical */ }
    });

    trainingQueueEvents.on('completed', async ({ jobId, returnvalue }) => {
        const experimentId = jobExperimentMap.get(jobId);
        if (!experimentId) return;
        jobExperimentMap.delete(jobId);
        logger.info('[WORKER]', 'Completed', { experimentId, jobId });
        io.to(`job:${experimentId}`).emit(`job:${experimentId}:completed`, returnvalue);
    });

    trainingQueueEvents.on('failed', async ({ jobId, failedReason }) => {
        const experimentId = jobExperimentMap.get(jobId);
        if (!experimentId) return;
        jobExperimentMap.delete(jobId);
        logger.error('[WORKER]', 'Job failed', { experimentId, jobId, reason: failedReason });
        io.to(`job:${experimentId}`).emit(`job:${experimentId}:failed`, failedReason);
    });

    trainingQueueEvents.on('added', ({ jobId }) => {
        logger.info('[QUEUE]', 'Job added', { jobId });
    });

    trainingQueueEvents.on('retries-exhausted', ({ jobId }) => {
        logger.error('[QUEUE]', 'Retries exhausted', { jobId });
    });

    logger.info('[WS]', 'WebSocket server initialized');
    return io;
}

module.exports = { initWebSocket };
