# 🏗️ BullMQ Architecture - Production-Ready ML Training System

## 🎯 Overview

This document explains the NEW architecture that **FIXES the "training in progress" blocking issue** and makes the system production-ready.

---

## ❌ WHAT WAS BROKEN

### **The Global Lock Problem**

```javascript
// OLD CODE (BROKEN)
if (activeTrainingByUser.has(userId)) {
  return res.status(409).json({
    message: "Training already in progress..."
  });
}
```

**Why this broke:**
- ❌ Once a user starts a training job, they're completely blocked
- ❌ If the worker crashed, the lock was never cleared
- ❌ If the job got stuck in "active", the lock was never cleared
- ❌ User had only ONE option: **restart the entire server**
- ❌ Multiple jobs per user were impossible
- ❌ Multi-user training required workarounds

---

## ✅ WHAT WAS FIXED

### **1. Removed Global Lock**
- ✅ No `activeTrainingByUser` map blocking users
- ✅ Multiple users can train simultaneously
- ✅ Same user can submit multiple jobs
- ✅ Jobs queue naturally based on concurrency

### **2. Added QueueScheduler**
```javascript
// NEW CODE (FIXED)
const queueScheduler = new QueueScheduler('training-queue', {
  connection,
  stalledInterval: 5000,  // Check every 5s
  maxStalledCount: 2,     // Auto-recover stalled jobs
});
```

**What this does:**
- ✅ Automatically detects crashed workers
- ✅ Moves stalled jobs back to "waiting"
- ✅ Another worker can immediately pick them up
- ✅ No manual restart needed

### **3. Extended Lock Duration**
```javascript
// OLD: Default 30s (too short for ML jobs)
// NEW: 20 minutes (matches ML training duration)
lockDuration: 20 * 60 * 1000,
```

**Why:**
- ✅ ML training can take 5-15 minutes
- ✅ Job won't be marked "stalled" during normal execution
- ✅ Only marked stalled if worker truly crashes

### **4. Proper Job Lifecycle**
```
Waiting → Active → Completed/Failed
        ↓
      (Worker picks up)
        ↓
      (Worker processes)
        ↓
      (Worker updates progress)
        ↓
      (Worker completes)
        ↓
      Removed (auto cleanup)
```

---

## 📊 Architecture Diagram

```
┌─────────────────┐
│   API Request   │
│  POST /train    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  training.controller.js          │
│  - Validate input               │
│  - Create DB record             │
│  - Add job to queue (NO LOCK)   │
│  - Return 202 immediately       │
└────────┬────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────────┐
    │         REDIS (Queue Storage)            │
    │  Queue: training-queue                   │
    │  - Job 1: waiting                        │
    │  - Job 2: waiting                        │
    │  - Job 3: active (being processed)       │
    │  - Job 4: completed                      │
    └──────────────────────────────────────────┘
         ▲              ▲
         │              │
         │ Monitor       │ Scheduler
         │              │ (every 5s)
         │              │
    ┌────┴──────────────┴──────────┐
    │   Queue Scheduler            │
    │  - Detect stalled jobs       │
    │  - Move to "waiting"         │
    │  - Auto-recovery             │
    └──────────────────────────────┘

         ▲
         │ Pick up next job
         │
    ┌────┴────────────────────────────────┐
    │   Training Worker                   │
    │  - Concurrency: 2 (configurable)    │
    │  - Lock Duration: 20 min            │
    │  - Processes ML training            │
    │  - Updates progress                 │
    │  - Handles retries                  │
    └─────────────────────────────────────┘
         │
         ├─→ ML Service (Python)
         │
         ├─→ Database (MySQL)
         │
         └─→ WebSocket Events (Real-time)
```

---

## 🔄 Job Lifecycle States

### **Quick Reference**

| State | Meaning | Next State |
|-------|---------|-----------|
| `waiting` | Job queued, waiting for available worker | `active` |
| `active` | Worker is processing the job | `completed` or `failed` |
| `completed` | Job finished successfully | Removed (auto) |
| `failed` | Job failed | `waiting` (retry) or `failed` (final) |
| `stalled` | Worker crashed, not responding | `waiting` (auto-recovery) |
| `delayed` | Job scheduled for later | `waiting` |

### **State Transitions**

```
1. User submits training request
   ↓
   Job added to queue with state: WAITING

2. Worker becomes available (concurrency < limit)
   ↓
   Job moves to: ACTIVE

3. Worker processes ML training
   ↓
   Job progress updates: 10%, 20%, ... 100%

4a. SUCCESS Path:
    Job completes normally
    ↓
    State: COMPLETED
    ↓
    Auto-removed after 24h

4b. FAILURE Path:
    Job throws error
    ↓
    State: FAILED
    ↓
    Retry? (if attempts < 3)
    ↓
    Back to WAITING (exponential backoff)
    ↓
    Or FAILED (permanent)
    ↓
    Kept for 7 days (debugging)

4c. CRASH Path (NEW - AUTOMATIC RECOVERY):
    Worker crashes while job ACTIVE
    ↓
    Scheduler detects (every 5s)
    ↓
    Job marked: STALLED
    ↓
    Scheduler moves to: WAITING
    ↓
    Another worker picks it up
    ↓
    No manual restart needed!
```

---

## 🚀 Key Improvements

### **1. No More Blocking**
```javascript
// BEFORE
if (activeTrainingByUser.has(userId)) {
  return 409; // BLOCKED
}

// AFTER
// Queue handles everything naturally
// User can submit as many jobs as they want
return 202; // Immediately accepted
```

### **2. Automatic Recovery**
```javascript
// BEFORE: Worker crashes
// Result: Job stuck FOREVER in "active"
// User must restart server

// AFTER: Worker crashes
// Result: Scheduler detects (5s later)
// Moves to: "waiting"
// Another worker picks it up
// User doesn't need to do ANYTHING
```

### **3. Multi-User Concurrency**
```javascript
// BEFORE: User A training
// User B: "Training in progress" error
// User B: Blocked completely

// AFTER: User A training
// User B: Job queued
// If Worker Concurrency = 2:
//   User A and User B train IN PARALLEL
```

### **4. Multiple Jobs Per User**
```javascript
// BEFORE: Can't train two datasets as same user

// AFTER:
User A trains Dataset 1 → Job 1 (waiting)
User A trains Dataset 2 → Job 2 (waiting)
User A trains Dataset 3 → Job 3 (waiting)
// All queued naturally, processed based on concurrency
```

---

## ⚙️ Configuration

### **Environment Variables**

```env
# Worker Concurrency
# How many jobs to process simultaneously
# Increase if you have more server resources
WORKER_CONCURRENCY=2

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ML Service URL
ML_SERVICE_URL=http://localhost:5001

# Database
DB_HOST=localhost
DB_USER=...
DB_PASSWORD=...
DB_NAME=dataforge
```

### **Advanced Tuning**

```javascript
// In training.queue.js
const trainingQueue = new Queue('training-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,           // Max retries
    backoff: {
      type: 'exponential',
      delay: 5000,         // Start delay (5s)
      // Then: 10s, 20s, etc
    },
    removeOnComplete: {
      age: 86400,          // Keep for 24h
      count: 1000,         // Or up to 1000 jobs
    },
    removeOnFail: {
      age: 604800,         // Keep for 7 days
      count: 5000,         // Or up to 5000 jobs
    },
  },
});

// In training.worker.js
const trainingWorker = new Worker('training-queue', handler, {
  connection,
  concurrency: 2,          // Adjust based on server resources
  lockDuration: 20*60*1000,// 20 min (must be > max job duration)
  limiter: {
    max: 10,               // Max 10 jobs
    duration: 60000,       // Per minute
  },
});

// In training.queue.js - Scheduler
const queueScheduler = new QueueScheduler('training-queue', {
  connection,
  stalledInterval: 5000,   // Check every 5s
  maxStalledCount: 2,      // Retry 2 times before marking failed
});
```

---

## 🔍 Monitoring & Debugging

### **Check Queue Status**

```bash
# Via API
curl http://localhost:5000/api/training/queue/status

# Response:
{
  "status": "success",
  "queue_name": "training-queue",
  "metrics": {
    "waiting": 3,
    "active": 1,
    "completed": 45,
    "failed": 2,
    "delayed": 0,
    "total": 51
  },
  "recent_jobs": {
    "waiting": [
      { "id": "exp_123_1234567890", "experiment_id": "..." }
    ],
    "active": [
      { "id": "...", "progress": 45 }
    ]
  }
}
```

### **Check Job Status**

```bash
# Get status of specific job
curl http://localhost:5000/api/training/job/{jobId}

# Response:
{
  "job_id": "exp_123_1234567890",
  "status": "active",      // waiting | active | completed | failed
  "progress": 45,          // 0-100
  "error": null,
  "attemptsMade": 0,
  "finishedOn": null
}
```

### **View Logs**

```bash
# Server logs
npm run start   # Port 5000

# Worker logs
npm run worker  # Listen for jobs

# Both show real-time events:
[QUEUE] 📬 Job added to Redis queue
[WORKER] ⚡ Job picked up by worker
[WORKER] 📊 Job progress 45%
[WORKER] ✅ TRAINING SESSION COMPLETE
```

---

## 🛡️ Fault Tolerance

### **Scenario 1: Worker Crashes**
```
Time 0:00  - Job starts (state: ACTIVE)
Time 0:30  - Worker process crashes
Time 0:35  - Scheduler detects (stalledInterval: 5s)
Time 0:36  - Job moved back to WAITING
Time 0:37  - Another worker picks it up
Time 5:00  - Job completes successfully
Result: ✅ AUTOMATIC RECOVERY (no restart needed)
```

### **Scenario 2: ML Service Timeout**
```
Job fails with timeout error
→ BullMQ retries (up to 3 times)
→ Exponential backoff: 5s, 10s, 20s delays
→ If all retries fail:
  → Job marked FAILED
  → Error logged
  → User notified via API
Result: ✅ GRACEFUL FAILURE (no cascading issues)
```

### **Scenario 3: Database Connection Error**
```
ML training completes
→ Storing results in DB fails
→ Job fails with DB error
→ BullMQ retries
→ On success: Job completed
Result: ✅ RETRY LOGIC (handles transient failures)
```

### **Scenario 4: Multiple Users**
```
User A: Submits job 1 (waiting)
User B: Submits job 2 (waiting)
User C: Submits job 3 (waiting)

Worker 1: Picks job 1 (active)
Worker 2: Picks job 2 (active)
Job 3: Waits for availability

User A completes
Worker 1: Picks job 3 (active)

Result: ✅ NO BLOCKING (everyone queued fairly)
```

---

## 🎯 Common Issues & Solutions

### **Issue: "Training in progress" Error**
**Before:**
❌ User blocked, must restart server

**After:**
✅ Already fixed! User can submit multiple jobs

### **Issue: Job Stuck in Active**
**Before:**
❌ Manual restart required

**After:**
✅ Scheduler auto-recovers in 5 seconds

### **Issue: Worker Process Died**
**Before:**
❌ Jobs orphaned forever

**After:**
✅ Scheduler detects, moves to waiting, another worker picks up

### **Issue: Long ML Training (15+ min)**
**Before:**
❌ Job marked "stalled" prematurely

**After:**
✅ lockDuration: 20min ensures no false stalls

---

## 📈 Production Checklist

- [x] Remove global locks (`activeTrainingByUser`)
- [x] Add QueueScheduler
- [x] Increase lockDuration (20 min)
- [x] Configure proper retries (3 attempts)
- [x] Setup logging
- [x] Add WebSocket real-time updates
- [x] Monitor queue health
- [x] Test multi-user scenarios
- [x] Test worker crash recovery
- [x] Test long-running jobs

---

## 📞 Support

For issues:
1. Check logs: `npm run start` + `npm run worker`
2. Monitor queue: `/api/training/queue/status`
3. Check job: `/api/training/job/{jobId}`
4. Review this guide

---

## 🔗 References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/documentation)
- Job States: waiting | active | completed | failed | stalled | delayed
