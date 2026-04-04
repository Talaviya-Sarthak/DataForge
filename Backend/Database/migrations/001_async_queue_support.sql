-- ═══════════════════════════════════════════════════════════════════════════════
-- DATAFORGE ASYNC ML QUEUE MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════
-- Purpose: Enable full BullMQ/Redis + MySQL integration for async ML training
-- Status: Production-Ready
-- Date: 2025-04-04
-- ═══════════════════════════════════════════════════════════════════════════════

USE dataforge;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Extend training_jobs table for async tracking
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1.1 Add queue_job_id for BullMQ mapping
ALTER TABLE training_jobs
ADD COLUMN queue_job_id VARCHAR(255) UNIQUE NULL
COMMENT 'BullMQ Job ID for tracking in queue'
AFTER pipeline_id;

-- 1.2 Add progress tracking (0-100%)
ALTER TABLE training_jobs
ADD COLUMN progress INT DEFAULT 0
COMMENT 'Job progress 0-100%'
AFTER status;

-- 1.3 Add timing columns
ALTER TABLE training_jobs
ADD COLUMN started_at TIMESTAMP NULL
COMMENT 'When job actually started processing'
AFTER created_at;

ALTER TABLE training_jobs
ADD COLUMN completed_at TIMESTAMP NULL
COMMENT 'When job completed or failed'
AFTER started_at;

-- 1.4 Add result storage for leaderboard and metrics
ALTER TABLE training_jobs
ADD COLUMN result JSON NULL
COMMENT 'Training results: {leaderboard, metrics, best_model, summary}'
AFTER error_message;

-- 1.5 Add retry tracking
ALTER TABLE training_jobs
ADD COLUMN retry_count INT DEFAULT 0
COMMENT 'Number of retry attempts'
AFTER result;

ALTER TABLE training_jobs
ADD COLUMN max_retries INT DEFAULT 3
COMMENT 'Maximum retry attempts allowed'
AFTER retry_count;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Update status ENUM to support full queue lifecycle
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE training_jobs
MODIFY COLUMN status ENUM(
    'waiting',    -- In queue, not started
    'active',     -- Currently processing
    'completed',  -- Successfully finished
    'failed',     -- Failed after max retries
    'delayed'     -- Delayed retry pending
) DEFAULT 'waiting'
COMMENT 'Job status: waiting→active→completed/failed/delayed→waiting';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Add indexes for async queue operations
-- ═══════════════════════════════════════════════════════════════════════════════

-- 3.1 Fast BullMQ queue job lookup
ALTER TABLE training_jobs
ADD INDEX idx_queue_job_id (queue_job_id);

-- 3.2 Recent jobs by status (for queue status dashboard)
ALTER TABLE training_jobs
ADD INDEX idx_status_created (status, created_at DESC);

-- 3.3 Find jobs needing retry
ALTER TABLE training_jobs
ADD INDEX idx_retry_status (status, retry_count);

-- 3.4 User's active jobs
ALTER TABLE training_jobs
ADD INDEX idx_user_status (user_id, status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Verify final schema
-- ═══════════════════════════════════════════════════════════════════════════════

-- Final training_jobs structure matches:
-- ✅ PK: id (INT AUTO_INCREMENT)
-- ✅ Queue Mapping: queue_job_id (VARCHAR, UNIQUE)
-- ✅ Pipeline: pipeline_id (VARCHAR)
-- ✅ Dataset: dataset_id (INT, FK)
-- ✅ User: user_id (INT, FK)
-- ✅ Configuration: task_type (ENUM), target_column (VARCHAR)
-- ✅ Status: status (ENUM with full lifecycle), progress (INT)
-- ✅ Error Handling: error_message (TEXT), retry_count (INT), max_retries (INT)
-- ✅ Results: result (JSON - leaderboard + metrics)
-- ✅ Timestamps: created_at, started_at, completed_at, updated_at
-- ✅ Indexes: queue_job_id, status_created, retry_status, user_status, pipeline_id

-- Verification Query
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dataforge'
  AND TABLE_NAME = 'training_jobs'
ORDER BY ORDINAL_POSITION;

-- Index Verification Query
SELECT * FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'dataforge' AND TABLE_NAME = 'training_jobs'
ORDER BY SEQ_IN_INDEX;

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETED: All async queue support migrations applied
-- ═══════════════════════════════════════════════════════════════════════════════
