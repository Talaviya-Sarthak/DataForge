# DataForge - Post-Merge Testing Checklist

## ✅ Merge Conflicts Resolution Status
All merge conflicts have been resolved. Now verify the application works correctly.

---

## 🔧 Pre-Testing Setup

### 1. Environment Configuration
- [ ] Copy `Backend/.env.example` to `Backend/.env`
- [ ] Update database credentials in `Backend/.env`
- [ ] Set `JWT_SECRET` in `Backend/.env`
- [ ] Verify `ML_SERVICE_URL=http://localhost:5001` in `Backend/.env`
- [ ] Copy `Frontend/.env.example` to `Frontend/.env` (if exists)

### 2. Database Setup
```bash
# Run the schema to create database
mysql -u root -p < Backend/Database/schema.sql
```

### 3. Redis Setup
- [ ] Ensure Redis is installed and running
- [ ] Default: `localhost:6379`
- [ ] Test connection: `redis-cli ping` (should return PONG)

### 4. Install Dependencies

**Backend:**
```bash
cd Backend
npm install
```

**Frontend:**
```bash
cd Frontend
npm install
```

**MLService:**
```bash
cd MLService
pip install -r requirements.txt
```

---

## 🚀 Component Testing

### Phase 1: Backend Server

**Start Backend:**
```bash
cd Backend
npm start
```

**Expected Output:**
- ✅ `[SERVER] Running on port 5000`
- ✅ `[SERVER] Pipeline system initialized`
- ✅ No error messages

**Test Endpoints:**
```bash
# Health check
curl http://localhost:5000/

# Should return: 🚀 Backend Running
```

**Common Issues:**
- ❌ Database connection error → Check MySQL credentials in `.env`
- ❌ Redis connection error → Ensure Redis is running
- ❌ Port already in use → Change PORT in `.env`

---

### Phase 2: Worker Process

**Start Worker (in new terminal):**
```bash
cd Backend
npm run worker
```

**Expected Output:**
- ✅ `[WORKER] Starting training worker...`
- ✅ `[WORKER] Training worker ready`
- ✅ `[QUEUE] Queue initialized`

**Common Issues:**
- ❌ Redis connection failed → Check Redis is running
- ❌ Module not found → Run `npm install` again

---

### Phase 3: ML Service

**Start MLService (in new terminal):**
```bash
cd MLService
python run.py
```

**Expected Output:**
- ✅ `INFO:     Started server process`
- ✅ `INFO:     Uvicorn running on http://0.0.0.0:5001`
- ✅ No import errors

**Test Endpoint:**
```bash
curl http://localhost:5001/
```

**Common Issues:**
- ❌ Module not found → Install missing packages: `pip install <package>`
- ❌ Port 5001 in use → Change port in `run.py`

---

### Phase 4: Frontend

**Start Frontend (in new terminal):**
```bash
cd Frontend
npm run dev
```

**Expected Output:**
- ✅ `VITE v5.x.x ready in XXX ms`
- ✅ `Local: http://localhost:5173/`
- ✅ No compilation errors

**Common Issues:**
- ❌ Module not found → Run `npm install`
- ❌ TypeScript errors → Check `tsconfig.json`

---

## 🧪 Functional Testing

### Test 1: User Authentication
1. Open browser: `http://localhost:5173`
2. Click "Sign Up"
3. Create new account
4. Verify redirect to onboarding
5. Complete onboarding
6. Verify redirect to dataset page

**Expected:** ✅ No errors, smooth flow

---

### Test 2: Dataset Upload
1. Navigate to Dataset page
2. Click "Upload CSV"
3. Select a CSV file (test with small dataset first)
4. Wait for upload

**Expected:**
- ✅ File uploads successfully
- ✅ Preview table displays data
- ✅ Statistics shown (rows, columns, missing values)
- ✅ Column types detected (numerical/categorical)

**Check Backend Logs:**
- ✅ `[ML] → POST http://localhost:5001/api/data/upload`
- ✅ `[ML] ← POST ... [200]`

---

### Test 3: Data Cleaning
1. Select a cleaning action (e.g., "Handle Missing Values")
2. Choose strategy (e.g., "Mean")
3. Select columns
4. Click "Apply"

**Expected:**
- ✅ Data preview updates
- ✅ Step added to pipeline history
- ✅ No errors in console

**Check Backend Logs:**
- ✅ `[ML] → POST http://localhost:5001/api/data/preprocess`
- ✅ Step persisted to database

---

### Test 4: Undo Functionality
1. Click "Undo" button
2. Verify data reverts to previous state

**Expected:**
- ✅ Last step removed
- ✅ Data preview shows previous state
- ✅ Step count decreases

---

### Test 5: Dataset Finalization
1. Click "Finalize Dataset"
2. Wait for confirmation

**Expected:**
- ✅ Success message
- ✅ Dataset status = 'completed' in database
- ✅ Ready for training

---

### Test 6: Model Training (CRITICAL TEST)

**Setup:**
1. Navigate to Models page
2. Select task type (Classification or Regression)
3. Select target column
4. Select models to train (start with 2-3 models)

**Start Training:**
1. Click "Start Training"

**Expected Immediate Response:**
- ✅ Status: "Training job queued successfully"
- ✅ Experiment ID displayed
- ✅ Progress indicator appears

**Check Backend Logs:**
```
[API] 📥 Train request received
[API] 📋 DB training job created
[QUEUE] 📬 Job added to Redis queue
[API] 🔒 Per-user lock set
```

**Check Worker Logs:**
```
[WORKER] ⚡ Job picked up by worker
[WORKER] 🚀 TRAINING SESSION STARTED
[WORKER] 📋 Step 1/5 — DB job status → running
[WORKER] 📋 Step 2/5 — Resolved X preprocessing step(s)
[WORKER] 📋 Step 3/5 — Dispatching to ML Service
```

**Check MLService Logs:**
```
INFO: POST /api/experiment/train
Training started for experiment_id: exp_X_XXXXX
```

**Wait for Completion (2-5 minutes):**

**Expected Worker Logs:**
```
[WORKER] 📋 Step 3/5 — ML training complete
[WORKER] 📋 Step 4/5 — Results stored in DB
[ML] ✅ [1/3] RandomForest — accuracy=0.95XX
[ML] ✅ [2/3] XGBoost — accuracy=0.96XX
[ML] 🏆 Best model: XGBoost (accuracy=0.96XX)
[WORKER] ✅ TRAINING SESSION COMPLETE
[WORKER] 🔓 Lock released
```

**Frontend Updates:**
- ✅ Progress bar reaches 100%
- ✅ Leaderboard displays with trained models
- ✅ Models sorted by performance
- ✅ Metrics displayed correctly

---

### Test 7: Model Analysis
1. Click on a trained model in leaderboard
2. View detailed metrics
3. Check visualizations

**Expected:**
- ✅ Confusion matrix (classification) or residual plots (regression)
- ✅ ROC curve (classification) or predicted vs actual (regression)
- ✅ Feature importance chart
- ✅ All plots render correctly

---

### Test 8: Model Download
1. Click "Download" on best model
2. Wait for download

**Expected:**
- ✅ `.pkl` file downloads
- ✅ Model removed from database after download
- ✅ Success message displayed

---

## 🐛 Common Issues & Solutions

### Issue: "No dataset uploaded" error during training
**Solution:** Ensure dataset is finalized before training

### Issue: Training stuck at "queued"
**Solution:** 
- Check worker is running: `npm run worker`
- Check Redis connection
- Check worker logs for errors

### Issue: "ML Service not reachable"
**Solution:**
- Verify MLService is running on port 5001
- Check `ML_SERVICE_URL` in Backend `.env`
- Test: `curl http://localhost:5001/`

### Issue: Database errors
**Solution:**
- Verify MySQL is running
- Check credentials in `.env`
- Re-run schema: `mysql -u root -p < Backend/Database/schema.sql`

### Issue: Redis connection failed
**Solution:**
- Install Redis: `https://redis.io/download`
- Start Redis: `redis-server`
- Test: `redis-cli ping`

### Issue: Port already in use
**Solution:**
- Backend: Change `PORT` in `.env`
- Frontend: Change port in `vite.config.ts`
- MLService: Change port in `run.py`

---

## ✅ Final Verification Checklist

- [ ] All 4 services running without errors
- [ ] User can sign up and log in
- [ ] CSV upload works
- [ ] Data cleaning operations work
- [ ] Undo/redo works
- [ ] Dataset finalization works
- [ ] Model training completes successfully
- [ ] Leaderboard displays results
- [ ] Model visualizations render
- [ ] Model download works
- [ ] No console errors in browser
- [ ] No errors in any service logs

---

## 📊 Performance Benchmarks

**Expected Timings:**
- CSV Upload (1000 rows): < 2 seconds
- Cleaning operation: < 1 second
- Model training (3 models, 1000 rows): 2-5 minutes
- Model download: < 1 second

---

## 🎯 Success Criteria

✅ **Merge is successful if:**
1. All services start without errors
2. Complete workflow works: Upload → Clean → Train → Download
3. No functionality is broken
4. All features from both branches work

❌ **Merge needs fixes if:**
1. Any service fails to start
2. Critical features don't work
3. Database errors occur
4. Training fails consistently

---

## 📝 Notes

- Test with small datasets first (< 1000 rows)
- Monitor all service logs during testing
- Keep browser console open to catch frontend errors
- Use Postman/curl to test API endpoints directly if needed

---

## 🆘 Need Help?

If you encounter issues:
1. Check service logs for error messages
2. Verify all dependencies are installed
3. Ensure all environment variables are set
4. Check database and Redis are running
5. Review the error messages carefully

**Log Locations:**
- Backend: Terminal output
- Worker: Terminal output
- MLService: Terminal output
- Frontend: Browser console (F12)
- Database: MySQL error log
- Redis: Redis log

---

**Good luck with testing! 🚀**
