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
  status ENUM('new','in_progress','completed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_datasets_user (user_id),
  INDEX idx_datasets_active (user_id, is_active),
  INDEX idx_datasets_status (user_id, status),

  CONSTRAINT fk_datasets_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- 🚫 IMPORTANT:
-- ❌ NO UNIQUE (user_id, is_active)
-- ❌ NO uq_user_active_dataset
-- ✅ "One active dataset" is enforced in backend logic

-- =========================================
-- 6.5 DATASET PIPELINE STEPS (rebuild-based)
-- =========================================
CREATE TABLE IF NOT EXISTS dataset_pipeline_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dataset_id INT NOT NULL,
  step_order INT NOT NULL,
  operation_type VARCHAR(100) NOT NULL,
  column_name VARCHAR(255) DEFAULT NULL,
  parameters JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_dps_dataset (dataset_id),
  INDEX idx_dps_order (dataset_id, step_order),

  CONSTRAINT fk_dps_dataset FOREIGN KEY (dataset_id)
    REFERENCES datasets(id) ON DELETE CASCADE
);

-- =========================================
-- QUICK SELECTS (debug helpers)
-- =========================================
SELECT * FROM users;
SELECT * FROM user_onboarding;
SELECT * FROM user_tools;
SELECT * FROM user_project_types;
SELECT * FROM user_preferences;
SELECT * FROM datasets;
SELECT * FROM dataset_pipeline_steps;