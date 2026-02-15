-- =========================================
-- DATABASE
-- =========================================
CREATE DATABASE IF NOT EXISTS dataforge;
USE dataforge;

-- =========================================
-- 1️⃣ USERS
-- =========================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email)
);

-- =========================================
-- 2️⃣ USER ONBOARDING (1–1)
-- =========================================
CREATE TABLE IF NOT EXISTS user_onboarding (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company VARCHAR(150),
  profession VARCHAR(150),
  experience VARCHAR(100),
  industry VARCHAR(100),
  data_experience ENUM('beginner','intermediate','advanced','expert'),
  primary_goal VARCHAR(100),
  additional_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_onboarding_user UNIQUE (user_id),
  CONSTRAINT fk_onboarding_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- 3️⃣ USER TOOLS (1–M)
-- =========================================
CREATE TABLE IF NOT EXISTS user_tools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  CONSTRAINT uq_user_tools UNIQUE (user_id, tool_name),
  CONSTRAINT fk_tools_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- 4️⃣ USER PROJECT TYPES (1–M)
-- =========================================
CREATE TABLE IF NOT EXISTS user_project_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_type VARCHAR(150) NOT NULL,
  CONSTRAINT uq_user_project_types UNIQUE (user_id, project_type),
  CONSTRAINT fk_project_types_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- 5️⃣ USER PREFERENCES
-- =========================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  preference_type ENUM('DATA_TYPE','FEATURE') NOT NULL,
  preference_value VARCHAR(150) NOT NULL,
  CONSTRAINT uq_user_preferences UNIQUE (user_id, preference_type, preference_value),
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- 6️⃣ DATASETS (METADATA ONLY)
-- =========================================
CREATE TABLE IF NOT EXISTS datasets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  column_names JSON NOT NULL,
  total_rows INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_datasets_user (user_id),
  INDEX idx_datasets_active (user_id, is_active),

  CONSTRAINT fk_datasets_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- 🚫 IMPORTANT:
-- ❌ NO UNIQUE (user_id, is_active)
-- ❌ NO uq_user_active_dataset
-- ✅ "One active dataset" is enforced in backend logic

-- =========================================
-- 7️⃣ PIPELINES
-- =========================================
CREATE TABLE IF NOT EXISTS pipelines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  dataset_id INT NOT NULL,
  pipeline_type ENUM('manual','auto') NOT NULL DEFAULT 'manual',
  status ENUM('draft','running','completed','failed','paused') NOT NULL DEFAULT 'draft',
  current_step_index INT DEFAULT 0,
  total_steps INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_pipeline_user (user_id),
  INDEX idx_pipeline_dataset (dataset_id),
  INDEX idx_pipeline_status (status),

  CONSTRAINT fk_pipeline_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_pipeline_dataset FOREIGN KEY (dataset_id)
    REFERENCES datasets(id) ON DELETE CASCADE
);

-- =========================================
-- 8️⃣ PIPELINE STEPS
-- =========================================
CREATE TABLE IF NOT EXISTS pipeline_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pipeline_id INT NOT NULL,
  step_index INT NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  step_params JSON NOT NULL,
  status ENUM('pending','running','completed','failed','skipped') DEFAULT 'pending',
  execution_time_ms INT DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_pipeline_steps (pipeline_id, step_index),
  INDEX idx_step_status (status),

  CONSTRAINT uq_pipeline_step UNIQUE (pipeline_id, step_index),
  CONSTRAINT fk_step_pipeline FOREIGN KEY (pipeline_id)
    REFERENCES pipelines(id) ON DELETE CASCADE
);

-- =========================================
-- 9️⃣ PIPELINE PREVIEWS
-- =========================================
CREATE TABLE IF NOT EXISTS pipeline_previews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pipeline_id INT NOT NULL,
  step_index INT NOT NULL,
  preview_data JSON NOT NULL,
  row_count INT NOT NULL,
  column_names JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_pipeline_preview (pipeline_id, step_index),

  CONSTRAINT uq_pipeline_preview UNIQUE (pipeline_id, step_index),
  CONSTRAINT fk_preview_pipeline FOREIGN KEY (pipeline_id)
    REFERENCES pipelines(id) ON DELETE CASCADE
);

-- =========================================
-- 🔟 PIPELINE EXECUTION LOGS
-- =========================================
CREATE TABLE IF NOT EXISTS pipeline_execution_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pipeline_id INT NOT NULL,
  step_index INT DEFAULT NULL,
  log_level ENUM('info','warning','error','debug') NOT NULL,
  message TEXT NOT NULL,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_pipeline_logs (pipeline_id, created_at),
  INDEX idx_log_level (log_level),

  CONSTRAINT fk_log_pipeline FOREIGN KEY (pipeline_id)
    REFERENCES pipelines(id) ON DELETE CASCADE
);
