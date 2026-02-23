-- =========================================
-- MIGRATION: Deterministic Pipeline System
-- Run this after the base schema.sql
-- =========================================

USE dataforge;

-- =========================================
-- 1. Add status column to datasets table
-- =========================================
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS status ENUM('new','in_progress','completed') NOT NULL DEFAULT 'in_progress'
  AFTER is_active;

-- =========================================
-- 2. Dataset Pipeline Steps (direct dataset→steps)
--    Stores only transformation metadata.
--    No dataset content stored here.
-- =========================================
CREATE TABLE IF NOT EXISTS dataset_pipeline_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dataset_id INT NOT NULL,
  step_order INT NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  column_name TEXT DEFAULT NULL,
  parameters JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_ds_steps_dataset (dataset_id, step_order),

  CONSTRAINT uq_ds_step_order UNIQUE (dataset_id, step_order),
  CONSTRAINT fk_ds_step_dataset FOREIGN KEY (dataset_id)
    REFERENCES datasets(id) ON DELETE CASCADE
);
