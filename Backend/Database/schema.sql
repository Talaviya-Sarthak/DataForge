-- =========================================
-- DATAFORGE - CORRECTED PRODUCTION SCHEMA
-- =========================================
-- Improvements:
-- 1. Added proper indexes for performance
-- 2. Added ENUM constraints for data integrity
-- 3. Improved foreign key relationships
-- 4. Added created_at indexes for time-based queries
-- =========================================

-- Use existing database
USE dataforge;

-- =========================================
-- USERS (Improved)
-- =========================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- USER ONBOARDING (Improved)
-- =========================================
CREATE TABLE IF NOT EXISTS user_onboarding (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  company VARCHAR(150),
  profession VARCHAR(150),
  experience VARCHAR(100),
  industry VARCHAR(100),
  data_experience ENUM('beginner','intermediate','advanced','expert'),
  primary_goal VARCHAR(100),
  additional_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- USER TOOLS (Improved)
-- =========================================
CREATE TABLE IF NOT EXISTS user_tools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_tool (user_id, tool_name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- USER PROJECT TYPES (Improved)
-- =========================================
CREATE TABLE IF NOT EXISTS user_project_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_type VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_project (user_id, project_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- USER PREFERENCES (Improved)
-- =========================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  preference_type ENUM('DATA_TYPE','FEATURE') NOT NULL,
  preference_value VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_pref (user_id, preference_type, preference_value),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_preference_type (preference_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- DATASETS (Improved)
-- =========================================
CREATE TABLE IF NOT EXISTS datasets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  column_names JSON NOT NULL,
  total_rows INT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  status ENUM('new','in_progress','completed') DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- PIPELINES (Improved)
-- =========================================
CREATE TABLE IF NOT EXISTS pipelines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  dataset_id INT NOT NULL,
  pipeline_type ENUM('manual','auto') DEFAULT 'manual',
  status ENUM('draft','running','completed','failed','paused') DEFAULT 'draft',
  current_step_index INT DEFAULT 0,
  total_steps INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_dataset_id (dataset_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- PIPELINE STEPS (Improved)
-- =========================================
CREATE TABLE IF NOT EXISTS pipeline_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pipeline_id INT NOT NULL,
  step_index INT NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  step_params JSON NOT NULL,
  status ENUM('pending','running','completed','failed','skipped') DEFAULT 'pending',
  execution_time_ms INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_pipeline_step (pipeline_id, step_index),
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
  INDEX idx_pipeline_id (pipeline_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TRAINING JOBS (Improved with ENUM)
-- =========================================
CREATE TABLE IF NOT EXISTS training_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pipeline_id VARCHAR(255) NOT NULL,
  dataset_id INT,
  user_id INT NOT NULL,
  task_type ENUM('classification', 'regression') NOT NULL,
  target_column VARCHAR(255) NOT NULL,
  status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE SET NULL,
  INDEX idx_pipeline_id (pipeline_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_task_type (task_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TRAINED MODELS (Improved with ENUM)
-- =========================================
CREATE TABLE IF NOT EXISTS trained_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  experiment_id VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  target_column VARCHAR(255) DEFAULT NULL,
  model_name VARCHAR(255) NOT NULL,
  model_type ENUM('classification', 'regression') NOT NULL,
  model_path VARCHAR(512) NOT NULL,

  -- Classification metrics
  accuracy DOUBLE DEFAULT NULL,
  `precision` DOUBLE DEFAULT NULL,
  recall DOUBLE DEFAULT NULL,
  f1_score DOUBLE DEFAULT NULL,
  roc_auc DOUBLE DEFAULT NULL,

  -- Regression metrics
  r2_score DOUBLE DEFAULT NULL,
  mse DOUBLE DEFAULT NULL,
  rmse DOUBLE DEFAULT NULL,
  mae DOUBLE DEFAULT NULL,

  training_time_ms INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_experiment_id (experiment_id),
  INDEX idx_user_id (user_id),
  INDEX idx_model_type (model_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- MODEL PLOTS (Improved)
-- =========================================
CREATE TABLE IF NOT EXISTS model_plots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_id INT NOT NULL,

  -- Classification
  confusion_matrix       JSON DEFAULT NULL,
  roc_curve              JSON DEFAULT NULL,
  precision_recall_curve JSON DEFAULT NULL,

  -- Regression
  predicted_vs_actual    JSON DEFAULT NULL,
  error_distribution     JSON DEFAULT NULL,

  -- Both task types
  residuals              JSON DEFAULT NULL,
  feature_importance     JSON DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (model_id) REFERENCES trained_models(id) ON DELETE CASCADE,
  INDEX idx_model_id (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- DATASET STATISTICS (Improved)
-- =========================================
CREATE TABLE IF NOT EXISTS dataset_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  experiment_id VARCHAR(255) NOT NULL UNIQUE,
  num_rows INT NOT NULL,
  num_columns INT NOT NULL,
  missing_values JSON DEFAULT NULL,
  correlation_matrix JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_experiment_id (experiment_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- VERIFICATION
-- =========================================
SELECT 'Corrected schema applied successfully!' AS status;
