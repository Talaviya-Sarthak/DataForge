# 🐛 Troubleshooting Guide

## ❓ Common Issues & Solutions

---

## 1️⃣ "Training in progress" Error (404 Even After Restart)

### ❌ Symptom
```
POST /api/training/experiment/train
Response: 409 Conflict
Message: "Training already in progress..."
```

### ✅ Solution
This issue should now be **completely fixed** because we removed the global lock. However, if you still see it:

1. **Check if code is updated:**
   ```bash
   grep -n "activeTrainingByUser.has" Backend/controllers/training.controller.js
   # Should return: (empty - no results)
   ```

2. **Restart services:**
   ```bash
   # Kill existing processes
   npm run dev &  # Terminal 1 - Backend server
   npm run worker &  # Terminal 2 - Worker
   ```

3. **Verify Redis doesn't have stale data:**
   ```bash
   redis-cli
   > KEYS *lock*
   > FLUSHDB  # Clear everything (dev only!)
   ```

---

## 2️⃣ Job Stuck in "Active" State

### ❌ Symptom
```
GET /api/training/queue/status
{
  "active": [
    { "id": "exp_123_...", "progress": 45 }
  ]
}

# Job stayed at 45% for 30 minutes - worker didn't crash, just slow?
```

### ✅ Solution

**Option A: Job is genuinely still processing (5-15 min ML jobs are normal)**
- Check worker logs: `npm run worker`
- Look for: `⏳ Polling ML...` messages
- ML models train for extended periods - this is expected!

**Option B: Worker actually crashed**
- QueueScheduler should auto-recover (every 5 seconds)
- Check logs for crashes: `Error`, `Uncaught`, `crashed`
- Manual fix:
  ```bash
  npm run worker  # Restart worker
  # Scheduler will move stalled jobs back to waiting
  ```

**Option C: Increase lock duration (ML job takes > 20 min)**
```javascript
// In training.worker.js
const trainingWorker = new Worker('training-queue', handler, {
  lockDuration: 30 * 60 * 1000,  // Increase from 20 to 30 min
});
```

---

## 3️⃣ Queue Scheduler Not Running

### ❌ Symptom
```bash
npm run worker
# Logs show: ✅ Worker and Scheduler ready
# But stalled jobs don't auto-recover
```

### ✅ Solution

1. **Check imports:**
   ```javascript
   // worker-start.js should have:
   const { queueScheduler } = require('./queues/training.queue');
   ```

2. **Verify both are started:**
   ```bash
   npm run worker  # Should log BOTH worker and scheduler
   ```

3. **Check Redis connection:**
   ```bash
   redis-cli ping
   # Should respond: PONG
   ```

4. **Manually close scheduler if hung:**
   ```javascript
   // Stop old process
   // In Redis CLI:
   redis-cli
   > KEYS *scheduler*
   > DEL [key]
   ```

---

## 4️⃣ Multiple Jobs from Same User Not Queueing

### ❌ Symptom
```javascript
// User A submits 3 training jobs
POST /api/training/experiment/train  // Job 1
POST /api/training/experiment/train  // Job 2
POST /api/training/experiment/train  // Job 3

// Server response for Job 2:
409 { message: "Training already in progress" }
```

### ✅ Solution

This happens because:
1. **Global lock still exists in your code** - update the files!
2. **Old controller code cached** - restart server
3. **Node cache issue** - clear and restart:

```bash
# Clear node_modules cache
rm -rf Backend/node_modules/.cache

# Restart
npm run start
npm run worker
```

Verify with:
```bash
# Submit 3 jobs
curl -X POST http://localhost:5000/api/training/experiment/train \
  -H "Authorization: Bearer TOKEN" \
  -d '{...}' -i

# Should get 202 for all 3 (not 409)

# Check status
curl http://localhost:5000/api/training/queue/status
# Should show: "waiting": 3
```

---

## 5️⃣ Worker Keeps Crashing

### ❌ Symptom
```bash
npm run worker
[WORKER] Error: Cannot find module...
[WORKER] SIGTERM received, closing worker...
Process exited with code 1
```

### ✅ Solution

1. **Check dependencies:**
   ```bash
   npm install
   npm install bullmq ioredis
   ```

2. **Verify file paths:**
   ```bash
   ls -la Backend/queues/training.queue.js
   ls -la Backend/workers/training.worker.js
   ```

3. **Check for syntax errors:**
   ```bash
   node -c Backend/workers/training.worker.js
   # No output = OK
   # SyntaxError = Fix it
   ```

4. **Check environment variables:**
   ```bash
   echo $REDIS_HOST
   echo $REDIS_PORT
   # Should output values, not empty
   ```

5. **Check Redis is running:**
   ```bash
   redis-cli ping
   # Should respond: PONG
   # If not, start Redis:
   # Windows: redis-server
   # Linux: redis-server &
   ```

---

## 6️⃣ WebSocket Events Not Received

### ❌ Symptom
```javascript
// Frontend connected to WebSocket
socket.on('training:progress', (data) => console.log(data));

// Job is training, but no events received
// After 5 min: training completes, still no events
```

### ✅ Solution

1. **Check WebSocket is initialized:**
   ```javascript
   // In Backend/server.js
   const { initWebSocket } = require('./websocket/ws.server');
   const io = initWebSocket(httpServer);
   ```

2. **Check training-events module:**
   ```bash
   ls -la Backend/websocket/training-events.js
   # Should exist
   ```

3. **Check worker imports events:**
   ```javascript
   // In Backend/workers/training.worker.js (top of file)
   const trainingEvents = require('../websocket/training-events');
   ```

4. **Check events are emitted:**
   ```javascript
   // In worker processor function
   trainingEvents.emitProgress(experiment_id, 10, { step: '...' });
   ```

5. **Frontend subscription:**
   ```javascript
   socket.emit('subscribe:training', experimentId);
   socket.on('training:progress', (data) => console.log(data));
   ```

6. **Check browser console:**
   - Open DevTools → Console
   - Look for errors
   - Verify socket.io connected: `✅ WebSocket connected`

---

## 7️⃣ Redis Connection Refused

### ❌ Symptom
```bash
npm run start
❌ Redis connection error: Connection refused at 127.0.0.1:6379
```

### ✅ Solution

1. **Check Redis is running:**
   ```bash
   redis-cli ping
   # PONG = Running
   # Error = Not running
   ```

2. **Start Redis:**
   ```bash
   # Windows (in WSL/Git Bash):
   wsl redis-server

   # Or with Docker:
   docker run -d -p 6379:6379 redis:latest
   ```

3. **Check connection settings:**
   ```bash
   # In .env
   REDIS_HOST=127.0.0.1  # or localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=       # empty if no password
   ```

4. **Check if Redis is listening:**
   ```bash
   netstat -an | grep 6379
   # Should show LISTENING
   ```

---

## 8️⃣ ML Service Timeout / "Not Reachable"

### ❌ Symptom
```
[WORKER] Experiment train error: ML service not reachable
Job failed after 3 attempts
```

### ✅ Solution

1. **Check ML Service is running:**
   ```bash
   # Terminal - ML Service
   cd MLService
   python run.py
   # Should start on port 5001
   ```

2. **Verify connectivity:**
   ```bash
   curl http://localhost:5001/api/health
   # Should return 200 OK
   ```

3. **Check ML Service URL in .env:**
   ```bash
   ML_SERVICE_URL=http://localhost:5001
   # NOT http://127.0.0.1:5001 (sometimes matters)
   ```

4. **Check if ports overlap:**
   ```bash
   # API: 5000
   # Worker: (same as API)
   # ML Service: 5001
   netstat -an | grep LISTEN
   ```

5. **Increase timeout for slow ML:**
   ```bash
   # In .env
   ML_SERVICE_TIMEOUT=900000  # 15 minutes
   ```

---

## 9️⃣ Database Connection Error

### ❌ Symptom
```
[WORKER] Failed to store in DB: connect ECONNREFUSED
Job failed after 3 attempts
```

### ✅ Solution

1. **Check MySQL is running:**
   ```bash
   mysql -h localhost -u dataforge_user -p
   # Enter password and check connection
   ```

2. **Verify credentials in .env:**
   ```bash
   DB_HOST=localhost
   DB_USER=dataforge_user
   DB_PASSWORD=password_here
   DB_NAME=dataforge
   ```

3. **Check database exists:**
   ```bash
   mysql -u dataforge_user -p
   > SHOW DATABASES;
   # Should show 'dataforge'
   ```

4. **Check tables exist:**
   ```bash
   mysql -u dataforge_user -p dataforge
   > SHOW TABLES;
   # Should show training_jobs, etc.
   ```

5. **Check user permissions:**
   ```bash
   mysql -u root -p
   > GRANT ALL PRIVILEGES ON dataforge.* TO 'dataforge_user'@'localhost';
   > FLUSH PRIVILEGES;
   ```

---

## 🔟 High Memory Usage / Redis Growing

### ❌ Symptom
```bash
# Redis memory keeps growing
# Jobs not being cleaned up
# Eventually OOM
```

### ✅ Solution

1. **Check job cleanup settings:**
   ```javascript
   // In training.queue.js
   removeOnComplete: {
     age: 86400,    // 24 hours
     count: 1000,   // Or 1000 jobs
   },
   removeOnFail: {
     age: 604800,   // 7 days
     count: 5000,   // Or 5000 jobs
   },
   ```

2. **Manually clean old jobs:**
   ```bash
   # API call
   curl -X POST http://localhost:5000/api/training/queue/clean
   ```

3. **Check Redis memory:**
   ```bash
   redis-cli
   > INFO memory
   # Look for used_memory_human
   ```

4. **Flush failed jobs (dev only):**
   ```bash
   redis-cli
   > KEYS *training-queue*failed*
   > DEL [key]
   ```

---

## 1️⃣1️⃣ Jobs Not Starting / Stuck Waiting

### ❌ Symptom
```
GET /api/training/queue/status
{
  "waiting": 5,
  "active": 0
  # Job has been waiting for 30 minutes!
}
```

### ✅ Solution

1. **Check worker is running:**
   ```bash
   npm run worker
   # Should show: ✅ Worker and Scheduler ready
   ```

2. **Check concurrency isn't maxed:**
   ```bash
   # In .env
   WORKER_CONCURRENCY=2  # How many can run?

   # If 2, and 10 jobs submitted:
   # 2 active, 8 waiting = EXPECTED
   ```

3. **Check job failures blocking queue:**
   ```bash
   GET /api/training/queue/status
   # Count: failed jobs
   # If stuck trying to retry, check error logs
   ```

4. **Force restart queue:**
   ```bash
   # Kill worker
   # Kill server
   # Clear Redis (dev only):
   redis-cli FLUSHDB
   # Restart both
   npm run start
   npm run worker
   ```

---

## 🆘 Still Stuck?

1. **Collect diagnostics:**
   ```bash
   npm run diagnostic
   # This should show current state
   ```

2. **Check logs:**
   ```bash
   # Server logs
   npm run start  # Look for errors

   # Worker logs
   npm run worker  # Look for errors

   # Redis logs
   redis-cli MONITOR  # See all commands
   ```

3. **Clean restart:**
   ```bash
   # Kill all Node processes
   pkill -f "node"

   # Stop Redis
   redis-cli SHUTDOWN
   redis-server &  # Restart

   # Start fresh
   npm run start
   npm run worker
   ```

4. **Ask for help:**
   - Share logs from all 3 terminals (server, worker, redis)
   - Share API request/response
   - Share queue status output
   - Share error message

---

## 📊 Health Check Endpoints

All of these should return 200:

```bash
# Server health
curl http://localhost:5000/api/health

# ML Service health
curl http://localhost:5001/api/health

# Queue status
curl http://localhost:5000/api/training/queue/status

# Job status
curl http://localhost:5000/api/training/job/{jobId}
```

---

Good luck! 🚀
