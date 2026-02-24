-- =========================================
-- DATABASE
-- =========================================
CREATE DATABASE IF NOT EXISTS dataforge;
USE dataforge;

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- USER ONBOARDING (1–1)
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
);

-- =========================================
-- USER TOOLS
-- =========================================
CREATE TABLE user_tools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  UNIQUE (user_id, tool_name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- USER PROJECT TYPES
-- =========================================
CREATE TABLE user_project_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_type VARCHAR(150) NOT NULL,
  UNIQUE (user_id, project_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

-- =========================================
-- DATASETS (METADATA ONLY)
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

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
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
);