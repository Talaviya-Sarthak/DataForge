# ✅ Production Deployment Checklist

## Pre-Deployment Testing

- [ ] **Queue works without freezing**
  Submit request, get 202 (not 409 error)

- [ ] **Multiple jobs queue correctly**
  Submit 5 jobs, all should queue (not blocked)

- [ ] **Worker processes jobs**
  Logs show job start, progress, completion

- [ ] **Stalled job recovery works**
  Kill worker mid-job, restart - job auto-recovers

- [ ] **WebSocket real-time updates** (if implemented)
  Submit job, receive training:progress events

- [ ] **Job retry logic**
  Failed jobs auto-retry up to 3 times

## Environment Configuration

- [ ] **.env file exists and configured**
- [ ] **All required variables set**
- [ ] **No hardcoded secrets**
- [ ] **Production values (not localhost)**

## Infrastructure Requirements

- [ ] **Redis running** - ping returns PONG
- [ ] **MySQL running** - database accessible
- [ ] **ML Service running** - health endpoint 200
- [ ] **All services can communicate**

## Code Changes Verified

- [ ] **Global lock removed from controller.js**
  ```bash
  grep -n "activeTrainingByUser" Backend/controllers/training.controller.js
  # Should be: (empty)
  ```

- [ ] **QueueScheduler enabled in queue.js**
  ```bash
  grep -n "QueueScheduler\|queueScheduler" Backend/queues/training.queue.js
  # Should have matches
  ```

- [ ] **lockDuration = 20 min in worker.js**
  ```bash
  grep -n "lockDuration: 20" Backend/workers/training.worker.js
  # Should have match
  ```

- [ ] **Scheduler imported in worker-start.js**

## Performance Tuning

- [ ] **WORKER_CONCURRENCY appropriate for server resources**
  - 4 cores: 2
  - 8 cores: 4
  - 16+ cores: 6-8

- [ ] **Job cleanup configured**
  - removeOnComplete: 24h or 1000 jobs
  - removeOnFail: 7d or 5000 jobs

- [ ] **Redis memory stable**
  - Monitor with: redis-cli INFO memory

## Monitoring & Observability

- [ ] **Logging enabled and checked**
  - Server logs: npm run start
  - Worker logs: npm run worker
  - Should see detailed events

- [ ] **Health endpoints working**
  - /api/health
  - /api/training/queue/status
  - /api/training/job/{id}

- [ ] **Error handling working**
  - Invalid requests get 400
  - Server errors get 500
  - Queue errors logged

## Security

- [ ] **JWT authentication enforced**
- [ ] **CORS configured for FRONTEND_URL**
- [ ] **Rate limiting enabled**
- [ ] **No secrets in code** (all from .env)

## Documentation

- [ ] BULLMQ_ARCHITECTURE.md exists
- [ ] TROUBLESHOOTING.md exists
- [ ] WEBSOCKET_INTEGRATION.md exists (if using)
- [ ] .env.example exists

## Deployment Steps

1. **Configure environment**
   - Copy .env.example to .env
   - Update with production values

2. **Install dependencies**
   ```bash
   npm install
   npm install bullmq ioredis
   ```

3. **Start services in order**
   - Terminal 1: npm run start (API)
   - Terminal 2: npm run worker (Worker + Scheduler)
   - Terminal 3: Monitor queue status

4. **Verify**
   - Submit test job
   - Check /api/training/queue/status
   - Confirm no 409 errors
   - Confirm multiple jobs queue

## Scaling Strategy

**Horizontal Scaling:**
- Deploy multiple worker pods
- Each with WORKER_CONCURRENCY=2
- Queue auto-distributes jobs
- QueueScheduler handles recovery across all workers

**Vertical Scaling:**
- Increase WORKER_CONCURRENCY (if resources available)
- Increase Redis memory
- Increase lockDuration (if ML jobs > 20min)

## Post-Deployment Monitoring

Monitor ongoing:
- Job metrics: waiting, active, completed, failed
- Worker health: crashes, stalls
- Redis memory: old jobs being cleaned
- User reports: real-time updates, no blocking

---

**When all items checked: READY FOR PRODUCTION** ✅
