-- =========================================
-- DATABASE: DataForge
-- =========================================

-- -------------------------
-- 1️⃣ USERS
-- -------------------------
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Unique email constraint
ALTER TABLE users
ADD CONSTRAINT uq_users_email UNIQUE (email);

-- -------------------------
-- 2️⃣ USER ONBOARDING
-- -------------------------
CREATE TABLE user_onboarding (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  company VARCHAR(150),
  profession VARCHAR(150),
  experience VARCHAR(100),
  industry VARCHAR(100),
  data_experience VARCHAR(50),
  primary_goal VARCHAR(100),
  additional_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- One onboarding per user
ALTER TABLE user_onboarding
ADD CONSTRAINT uq_user_onboarding UNIQUE (user_id);

-- Foreign key
ALTER TABLE user_onboarding
ADD CONSTRAINT fk_onboarding_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- -------------------------
-- 3️⃣ USER TOOLS
-- -------------------------
CREATE TABLE user_tools (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
);

-- Prevent duplicate tools per user
ALTER TABLE user_tools
ADD CONSTRAINT uq_user_tools UNIQUE (user_id, tool_name);

-- Foreign key
ALTER TABLE user_tools
ADD CONSTRAINT fk_tools_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- -------------------------
-- 4️⃣ USER PROJECT TYPES
-- -------------------------
CREATE TABLE user_project_types (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  project_type VARCHAR(150) NOT NULL,
  PRIMARY KEY (id)
);

-- Prevent duplicate project types per user
ALTER TABLE user_project_types
ADD CONSTRAINT uq_user_project_types UNIQUE (user_id, project_type);

-- Foreign key
ALTER TABLE user_project_types
ADD CONSTRAINT fk_project_types_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- -------------------------
-- 5️⃣ USER PREFERENCES
-- -------------------------
CREATE TABLE user_preferences (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  preference_type ENUM('DATA_TYPE', 'FEATURE') NOT NULL,
  preference_value VARCHAR(150) NOT NULL,
  PRIMARY KEY (id)
);

-- Prevent duplicate preferences per user
ALTER TABLE user_preferences
ADD CONSTRAINT uq_user_preferences UNIQUE (user_id, preference_type, preference_value);

-- Foreign key
ALTER TABLE user_preferences
ADD CONSTRAINT fk_preferences_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;
