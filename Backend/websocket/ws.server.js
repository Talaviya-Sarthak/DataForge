const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { trainingQueueEvents } = require('../queues/training.events');
const { trainingQueue } = require('../queues/training.queue');

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

        socket.on('subscribe:job', ({ experimentId }) => {
            socket.join(`job:${experimentId}`);
        });

        socket.on('unsubscribe:job', ({ experimentId }) => {
            socket.leave(`job:${experimentId}`);
        });

        socket.on('disconnect', () => {
        });
    });

    // ── Bridge BullMQ events → WebSocket rooms ───────────────

    trainingQueueEvents.on('progress', async ({ jobId, data }) => {
        // Use the map populated at 'active' time — avoids getJob() call on hot path
        const experimentId = jobExperimentMap.get(jobId);
        if (!experimentId) return;

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
        io.to(`job:${experimentId}`).emit(`job:${experimentId}:completed`, returnvalue);
    });

    trainingQueueEvents.on('failed', async ({ jobId, failedReason }) => {
        const experimentId = jobExperimentMap.get(jobId);
        if (!experimentId) return;
        jobExperimentMap.delete(jobId);
        io.to(`job:${experimentId}`).emit(`job:${experimentId}:failed`, failedReason);
    });

    trainingQueueEvents.on('added', ({ jobId }) => {
    });

    trainingQueueEvents.on('retries-exhausted', ({ jobId }) => {
    });

    return io;
}

module.exports = { initWebSocket };
