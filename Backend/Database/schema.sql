-- =========================================
-- DATAFORGE - FRESH DATABASE SCHEMA
-- =========================================
DROP DATABASE IF EXISTS dataforge;
CREATE DATABASE dataforge;
USE dataforge;

-- =========================================
-- USERS TABLE
-- =========================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- USER ONBOARDING
-- =========================================
CREATE TABLE user_onboarding (
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- USER TOOLS
-- =========================================
CREATE TABLE user_tools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  UNIQUE (user_id, tool_name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- USER PROJECT TYPES
-- =========================================
CREATE TABLE user_project_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_type VARCHAR(150) NOT NULL,
  UNIQUE (user_id, project_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- USER PREFERENCES
-- =========================================
CREATE TABLE user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  preference_type ENUM('DATA_TYPE','FEATURE') NOT NULL,
  preference_value VARCHAR(150) NOT NULL,
  UNIQUE (user_id, preference_type, preference_value),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- DATASETS
-- =========================================
CREATE TABLE datasets (
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
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- PIPELINES
-- =========================================
CREATE TABLE pipelines (
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
  INDEX idx_dataset_id (dataset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- PIPELINE STEPS
-- =========================================
CREATE TABLE pipeline_steps (
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
  UNIQUE (pipeline_id, step_index),
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
  INDEX idx_pipeline_id (pipeline_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TRAINING JOBS
-- =========================================
CREATE TABLE training_jobs (
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
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- TRAINED MODELS
-- =========================================
CREATE TABLE trained_models (
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
<<<<<<< Updated upstream
  `rank` INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trained_pipeline_id (pipeline_id),
  INDEX idx_trained_rank (`rank`)
);
=======
  
  -- Training info
  training_time_ms INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_experiment_id (experiment_id),
  INDEX idx_user_id (user_id),
  INDEX idx_model_type (model_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- MODEL PLOTS
-- =========================================
CREATE TABLE model_plots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_id INT NOT NULL,
  
  -- Classification plots
  confusion_matrix JSON DEFAULT NULL,
  roc_curve JSON DEFAULT NULL,
  precision_recall_curve JSON DEFAULT NULL,
  class_labels JSON DEFAULT NULL,
  
  -- Regression plots
  residuals JSON DEFAULT NULL,
  predicted_vs_actual JSON DEFAULT NULL,
  error_distribution JSON DEFAULT NULL,
  residual_vs_predicted JSON DEFAULT NULL,
  regression_line JSON DEFAULT NULL,
  
  -- Common plots
  feature_importance JSON DEFAULT NULL,
  learning_curve JSON DEFAULT NULL,
  class_distribution JSON DEFAULT NULL,
  feature_vs_target JSON DEFAULT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (model_id) REFERENCES trained_models(id) ON DELETE CASCADE,
  INDEX idx_model_id (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- DATASET STATISTICS
-- =========================================
CREATE TABLE dataset_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  experiment_id VARCHAR(255) NOT NULL UNIQUE,
  num_rows INT NOT NULL,
  num_columns INT NOT NULL,
  missing_values JSON DEFAULT NULL,
  correlation_matrix JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_experiment_id (experiment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- VERIFICATION
-- =========================================
SELECT 'Database created successfully!' AS status;

-- Show all tables
SHOW TABLES;

-- Show trained_models structure
SELECT '=== TRAINED_MODELS STRUCTURE ===' AS info;
DESCRIBE trained_models;

-- Show model_plots structure
SELECT '=== MODEL_PLOTS STRUCTURE ===' AS info;
DESCRIBE model_plots;

SELECT 'Schema is ready to use!' AS status;
>>>>>>> Stashed changes
