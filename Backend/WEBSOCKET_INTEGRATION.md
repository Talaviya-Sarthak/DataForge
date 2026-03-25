# 🔌 WebSocket Integration for Real-Time Training Updates

## 📡 Overview

This guide shows how to integrate **real-time WebSocket updates** into your ML training system so users see live progress without polling.

---

## 🎯 What You Get

```javascript
// Frontend receives LIVE updates:
{
  event: 'training:started',
  experiment_id: 'exp_123_1234567890',
  timestamp: 1698765432000
}

// ... 10s later
{
  event: 'training:progress',
  experiment_id: 'exp_123_1234567890',
  progress: 15,
  step: 'Preprocessing data...',
  timestamp: 1698765432000
}

// ... eventually
{
  event: 'training:completed',
  experiment_id: 'exp_123_1234567890',
  results: { ... },
  duration_ms: 300000,
  timestamp: 1698765432000
}

// Or failure
{
  event: 'training:failed',
  experiment_id: 'exp_123_1234567890',
  error: 'ML training failed: out of memory',
  attempt: 2,
  timestamp: 1698765432000
}
```

---

## 📂 Implementation Files

### **File 1: WebSocket Event Emitter**

Create: `Backend/websocket/training-events.js`

```javascript
/**
 * Central event emitter for training progress
 * Decouples worker from WebSocket server
 */

const EventEmitter = require('events');

class TrainingEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.maxListeners = 100;
  }

  // Called from worker
  emitProgress(experimentId, progress, data = {}) {
    this.emit(`training:progress:${experimentId}`, {
      event: 'training:progress',
      experiment_id: experimentId,
      progress,
      timestamp: Date.now(),
      ...data,
    });
  }

  emitStarted(experimentId, jobId, data = {}) {
    this.emit(`training:started:${experimentId}`, {
      event: 'training:started',
      experiment_id: experimentId,
      job_id: jobId,
      timestamp: Date.now(),
      ...data,
    });
  }

  emitCompleted(experimentId, results, duration, data = {}) {
    this.emit(`training:completed:${experimentId}`, {
      event: 'training:completed',
      experiment_id: experimentId,
      results,
      duration_ms: duration,
      timestamp: Date.now(),
      ...data,
    });
  }

  emitFailed(experimentId, error, attempt, data = {}) {
    this.emit(`training:failed:${experimentId}`, {
      event: 'training:failed',
      experiment_id: experimentId,
      error,
      attempt,
      timestamp: Date.now(),
      ...data,
    });
  }
}

module.exports = new TrainingEventEmitter();
```

---

### **File 2: WebSocket Server Integration**

Update: `Backend/websocket/ws.server.js`

```javascript
const { Server } = require('socket.io');
const trainingEvents = require('./training-events');
const logger = require('../utils/logger');

let io = null;

function initWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CONNECTION HANDLER
  // ─────────────────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId || 'anonymous';
    logger.info('[WS]', 'Client connected', {
      socket_id: socket.id,
      user_id: userId,
    });

    // ─────────────────────────────────────────────────────────────────────
    // SUBSCRIBE TO TRAINING UPDATES
    // ─────────────────────────────────────────────────────────────────────
    socket.on('subscribe:training', (experimentId) => {
      logger.info('[WS]', 'Client subscribed to training', {
        socket_id: socket.id,
        experiment_id: experimentId,
      });

      // Join room for this experiment
      socket.join(`training:${experimentId}`);

      // Set up event listeners for this experiment
      const handlers = {
        progress: (data) => {
          socket.emit('training:progress', data);
        },
        started: (data) => {
          socket.emit('training:started', data);
        },
        completed: (data) => {
          socket.emit('training:completed', data);
        },
        failed: (data) => {
          socket.emit('training:failed', data);
        },
      };

      // Store handlers for cleanup
      socket.handlers = handlers;
      socket.experimentId = experimentId;

      // Attach listeners
      trainingEvents.on(`training:progress:${experimentId}`, handlers.progress);
      trainingEvents.on(`training:started:${experimentId}`, handlers.started);
      trainingEvents.on(`training:completed:${experimentId}`, handlers.completed);
      trainingEvents.on(`training:failed:${experimentId}`, handlers.failed);
    });

    // ─────────────────────────────────────────────────────────────────────
    // UNSUBSCRIBE FROM TRAINING UPDATES
    // ─────────────────────────────────────────────────────────────────────
    socket.on('unsubscribe:training', (experimentId) => {
      logger.info('[WS]', 'Client unsubscribed from training', {
        socket_id: socket.id,
        experiment_id: experimentId,
      });

      // Clean up event listeners
      if (socket.handlers) {
        trainingEvents.removeListener(
          `training:progress:${experimentId}`,
          socket.handlers.progress
        );
        trainingEvents.removeListener(
          `training:started:${experimentId}`,
          socket.handlers.started
        );
        trainingEvents.removeListener(
          `training:completed:${experimentId}`,
          socket.handlers.completed
        );
        trainingEvents.removeListener(
          `training:failed:${experimentId}`,
          socket.handlers.failed
        );
      }

      socket.leave(`training:${experimentId}`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // DISCONNECT
    // ─────────────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      logger.info('[WS]', 'Client disconnected', {
        socket_id: socket.id,
        user_id: userId,
      });

      // Clean up all listeners
      if (socket.handlers && socket.experimentId) {
        trainingEvents.removeListener(
          `training:progress:${socket.experimentId}`,
          socket.handlers.progress
        );
        trainingEvents.removeListener(
          `training:started:${socket.experimentId}`,
          socket.handlers.started
        );
        trainingEvents.removeListener(
          `training:completed:${socket.experimentId}`,
          socket.handlers.completed
        );
        trainingEvents.removeListener(
          `training:failed:${socket.experimentId}`,
          socket.handlers.failed
        );
      }
    });
  });

  return io;
}

// Global broadcaster (use carefully)
function broadcastTrainingProgress(experimentId, progress, data = {}) {
  if (!io) return;

  io.to(`training:${experimentId}`).emit('training:progress', {
    event: 'training:progress',
    experiment_id: experimentId,
    progress,
    timestamp: Date.now(),
    ...data,
  });
}

function broadcastTrainingCompleted(experimentId, results, duration) {
  if (!io) return;

  io.to(`training:${experimentId}`).emit('training:completed', {
    event: 'training:completed',
    experiment_id: experimentId,
    results,
    duration_ms: duration,
    timestamp: Date.now(),
  });
}

function broadcastTrainingFailed(experimentId, error, attempt) {
  if (!io) return;

  io.to(`training:${experimentId}`).emit('training:failed', {
    event: 'training:failed',
    experiment_id: experimentId,
    error,
    attempt,
    timestamp: Date.now(),
  });
}

module.exports = {
  initWebSocket,
  broadcastTrainingProgress,
  broadcastTrainingCompleted,
  broadcastTrainingFailed,
};
```

---

### **File 3: Update Worker to Emit Events**

In: `Backend/workers/training.worker.js` (in the job handler function)

```javascript
const trainingEvents = require('../websocket/training-events');

async (job) => {
  const { experiment_id, user_id } = job.data;
  const jobStart = Date.now();

  // Emit: Training started
  trainingEvents.emitStarted(experiment_id, job.id, {
    user_id,
    models: job.data.selected_models.length,
  });

  try {
    // ... existing code ...

    // Step 1
    if (job_db_id) {
      await trainingService.updateTrainingJobStatus(job_db_id, 'running');
    }

    // Emit step 1 progress
    await job.updateProgress(10);
    trainingEvents.emitProgress(experiment_id, 10, {
      step: 'Initializing training database...',
    });

    // Step 2
    let steps = preprocessing_steps || [];
    if (pipeline_id && !preprocessing_steps?.length) {
      const dbSteps = await datasetService.getPipelineSteps(pipeline_id);
      steps = dbSteps.map((s) => ({...}));
    }

    // Emit step 2 progress
    await job.updateProgress(20);
    trainingEvents.emitProgress(experiment_id, 20, {
      step: `Loaded ${steps.length} preprocessing steps`,
    });

    // Step 3 - ML Training with polling
    const mlStart = Date.now();
    const accepted = await mlService.experimentTrain({...});

    // ... polling loop ...
    while (Date.now() - pollStart < POLL_TIMEOUT_MS) {
      // ... existing poll code ...

      // Update progress
      const pollProgress = Math.min(
        30 + Math.floor((Date.now() - pollStart) / POLL_TIMEOUT_MS * 60),
        89
      );
      await job.updateProgress(pollProgress);

      // Emit progress
      trainingEvents.emitProgress(experiment_id, pollProgress, {
        step: `Training in progress... ${pollProgress}%`,
        elapsed_seconds: Math.round((Date.now() - pollStart) / 1000),
      });
    }

    // Step 4 - Store results
    await job.updateProgress(90);
    trainingEvents.emitProgress(experiment_id, 90, {
      step: 'Storing model results in database...',
    });

    // ... existing code ...

    // Step 5 - Complete
    if (job_db_id) {
      await trainingService.updateTrainingJobStatus(job_db_id, 'completed');
    }
    await job.updateProgress(100);

    const totalDuration = Date.now() - jobStart;

    // Emit: Training completed
    trainingEvents.emitCompleted(experiment_id, result, totalDuration, {
      user_id,
      success_count: successful.length,
      failed_count: failed.length,
    });

    return result;

  } catch (error) {
    const totalDuration = Date.now() - jobStart;

    // Emit: Training failed
    trainingEvents.emitFailed(experiment_id, error.message, job.attemptsMade + 1, {
      user_id,
      will_retry: job.attemptsMade + 1 < 3,
    });

    if (job_db_id) {
      await trainingService.updateTrainingJobStatus(job_db_id, 'failed', error.message);
    }
    throw error;
  }
}
```

---

## 🎨 Frontend Usage Example

### **React Component**

```typescript
import { useEffect, useState } from 'react';
import { useSocket } from './hooks/useSocket';

export function TrainingMonitor({ experimentId, userId }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !experimentId) return;

    // Subscribe to training updates
    socket.emit('subscribe:training', experimentId);

    // Listen for events
    socket.on('training:started', (data) => {
      console.log('🚀 Training started', data);
      setStatus('running');
      setProgress(0);
      setError(null);
    });

    socket.on('training:progress', (data) => {
      console.log('📊 Progress:', data.progress, '%');
      setProgress(data.progress);
      setStep(data.step || '');
    });

    socket.on('training:completed', (data) => {
      console.log('✅ Training completed', data);
      setStatus('completed');
      setProgress(100);
      setResult(data.results);
      socket.emit('unsubscribe:training', experimentId);
    });

    socket.on('training:failed', (data) => {
      console.log('❌ Training failed', data);
      setStatus('failed');
      setError({
        message: data.error,
        attempt: data.attempt,
        willRetry: data.will_retry,
      });
    });

    return () => {
      socket.emit('unsubscribe:training', experimentId);
      socket.off('training:started');
      socket.off('training:progress');
      socket.off('training:completed');
      socket.off('training:failed');
    };
  }, [socket, experimentId]);

  return (
    <div>
      <h2>Training Progress</h2>
      <p>Status: {status}</p>
      <progress value={progress} max={100} />
      <p>{step}</p>

      {error && (
        <div style={{ color: 'red' }}>
          ❌ {error.message}
          {error.willRetry && ' (will retry)'}
        </div>
      )}

      {result && (
        <div>
          <h3>Results</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

---

### **Custom Hook**

```typescript
// Frontend/src/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        userId: localStorage.getItem('userId'),
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    newSocket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return socket;
}
```

---

## 🧪 Testing

### **Test Real-Time Updates**

```bash
# Terminal 1: Start server
npm run start

# Terminal 2: Start worker
npm run worker

# Terminal 3: Submit training job
curl -X POST http://localhost:5000/api/training/experiment/train \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pipeline_id": "123",
    "task_type": "classification",
    "target_column": "target",
    "selected_models": ["DecisionTree", "RandomForest"]
  }'

# Response includes experiment_id, e.g., "exp_456_1698765432"

# Terminal 4: Listen via WebSocket (optional)
# Open DevTools Console in browser and run:
const socket = io('http://localhost:5000');
socket.emit('subscribe:training', 'exp_456_1698765432');
socket.on('training:progress', (data) => console.log('Progress:', data));
socket.on('training:completed', (data) => console.log('Done!', data));
```

---

## 🔒 Security

```javascript
// In ws.server.js - Add authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Also verify user owns the experiment
socket.on('subscribe:training', async (experimentId) => {
  const isOwner = await checkExperimentOwnership(socket.userId, experimentId);

  if (!isOwner) {
    socket.emit('error', 'Unauthorized');
    return;
  }

  socket.join(`training:${experimentId}`);
});
```

---

## 📊 Event Reference

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `subscribe:training` | Client → Server | `{ experimentId }` | Subscribe to updates |
| `unsubscribe:training` | Client → Server | `{ experimentId }` | Unsubscribe |
| `training:started` | Server → Client | `{ experiment_id, job_id, ... }` | Training begun |
| `training:progress` | Server → Client | `{ progress, step, ... }` | Progress update |
| `training:completed` | Server → Client | `{ results, duration_ms, ... }` | Training finished |
| `training:failed` | Server → Client | `{ error, attempt, ... }` | Training failed |

---

## 🚀 Production Deployment

1. ✅ Add environment variable: `FRONTEND_URL`
2. ✅ Enable CORS for your frontend domain
3. ✅ Use WSS (WebSocket Secure) with HTTPS
4. ✅ Implement proper authentication
5. ✅ Monitor WebSocket connections
6. ✅ Set reasonable timeouts (e.g., 30s idle)

---

That's it! Your frontend now gets **real-time updates** without polling! 🎉
