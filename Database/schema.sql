-- =========================================
-- DATABASE
-- =========================================
CREATE DATABASE IF NOT EXISTS dataforge;
USE dataforge;

-- =========================================
-- 1️⃣ USERS (ROOT TABLE)
-- =========================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure email uniqueness
ALTER TABLE users
ADD CONSTRAINT uq_users_email UNIQUE (email);

-- =========================================
-- 2️⃣ USER ONBOARDING (1–1 WITH USERS)
-- =========================================
CREATE TABLE IF NOT EXISTS user_onboarding (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company VARCHAR(150),
  profession VARCHAR(150),
  experience VARCHAR(100),
  industry VARCHAR(100),
  data_experience ENUM(
    'beginner',
    'intermediate',
    'advanced',
    'expert'
  ),
  primary_goal VARCHAR(100),
  additional_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enforce 1–1 relationship
ALTER TABLE user_onboarding
ADD CONSTRAINT uq_user_onboarding_user UNIQUE (user_id);

-- Foreign key
ALTER TABLE user_onboarding
ADD CONSTRAINT fk_onboarding_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- =========================================
-- 3️⃣ USER TOOLS (1–M)
-- =========================================
CREATE TABLE IF NOT EXISTS user_tools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tool_name VARCHAR(100) NOT NULL
);

-- Prevent duplicates
ALTER TABLE user_tools
ADD CONSTRAINT uq_user_tools UNIQUE (user_id, tool_name);

-- Foreign key
ALTER TABLE user_tools
ADD CONSTRAINT fk_tools_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- =========================================
-- 4️⃣ USER PROJECT TYPES (1–M)
-- =========================================
CREATE TABLE IF NOT EXISTS user_project_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_type VARCHAR(150) NOT NULL
);

-- Prevent duplicates
ALTER TABLE user_project_types
ADD CONSTRAINT uq_user_project_types UNIQUE (user_id, project_type);

-- Foreign key
ALTER TABLE user_project_types
ADD CONSTRAINT fk_project_types_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- =========================================
-- 5️⃣ USER PREFERENCES (FLEXIBLE 1–M)
-- =========================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  preference_type ENUM(
    'DATA_TYPE',
    'FEATURE'
  ) NOT NULL,
  preference_value VARCHAR(150) NOT NULL
);

-- Prevent duplicates
ALTER TABLE user_preferences
ADD CONSTRAINT uq_user_preferences
UNIQUE (user_id, preference_type, preference_value);

-- Foreign key
ALTER TABLE user_preferences
ADD CONSTRAINT fk_preferences_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- =========================================
-- 6️⃣ DATASETS (METADATA ONLY)
-- =========================================
CREATE TABLE IF NOT EXISTS datasets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_uuid CHAR(36) NOT NULL,
    user_id INT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    column_names JSON NOT NULL,
    total_rows INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_dataset_uuid (dataset_uuid)
);

-- Ensure dataset uniqueness per user
ALTER TABLE datasets
ADD CONSTRAINT uq_user_dataset UNIQUE (user_id, dataset_uuid);

-- =========================================
-- 7️⃣ PERFORMANCE INDEXES
-- =========================================
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id
ON user_onboarding(user_id);

CREATE INDEX IF NOT EXISTS idx_user_tools_user_id
ON user_tools(user_id);

CREATE INDEX IF NOT EXISTS idx_user_project_types_user_id
ON user_project_types(user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
ON user_preferences(user_id);
