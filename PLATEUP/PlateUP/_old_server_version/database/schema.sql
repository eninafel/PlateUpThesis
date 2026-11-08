-- PlateUP database (MySQL 8 / MariaDB 10.5+)
-- Import:  mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS plateup
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE plateup;

-- One row per registered person.
CREATE TABLE IF NOT EXISTS users (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                VARCHAR(100)  NOT NULL,
  email               VARCHAR(190)  NOT NULL,
  password_hash       VARCHAR(255)  NOT NULL,            -- PHP password_hash(), never the plain password
  daily_calorie_goal  SMALLINT UNSIGNED NOT NULL DEFAULT 2000,
  dietary_preference  VARCHAR(50)   NOT NULL DEFAULT 'Balanced',
  allergies           VARCHAR(255)  NOT NULL DEFAULT '',
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- Login sessions for the mobile app. Only the SHA-256 hash of the token is stored.
CREATE TABLE IF NOT EXISTS api_tokens (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  CHAR(64)     NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tokens_hash (token_hash),
  KEY idx_tokens_user (user_id),
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Ingredients the user has at home.
CREATE TABLE IF NOT EXISTS pantry_items (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id            INT UNSIGNED NOT NULL,
  name               VARCHAR(120) NOT NULL,
  category           ENUM('Produce','Proteins','Dairy & Eggs','Grains & Bakery',
                          'Spices & Condiments','Canned & Pantry','Beverages','Snacks')
                     NOT NULL DEFAULT 'Produce',
  quantity           VARCHAR(50)  NOT NULL DEFAULT '1 item',
  estimated_calories SMALLINT UNSIGNED NULL,
  expiry_date        DATE NULL,                           -- used by the waste-prevention list
  added_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pantry_user (user_id),
  CONSTRAINT fk_pantry_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Meals the user ate or cooked (calorie tracking).
CREATE TABLE IF NOT EXISTS meals (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  name        VARCHAR(160) NOT NULL,
  meal_type   ENUM('Breakfast','Lunch','Dinner','Snack') NOT NULL DEFAULT 'Dinner',
  calories    SMALLINT UNSIGNED NOT NULL,
  protein_g   DECIMAL(6,1) NOT NULL DEFAULT 0,
  carbs_g     DECIMAL(6,1) NOT NULL DEFAULT 0,
  fat_g       DECIMAL(6,1) NOT NULL DEFAULT 0,
  eaten_on    DATE NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_meals_user_date (user_id, eaten_on),
  CONSTRAINT fk_meals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- AI Chatbot conversation history (so the chat survives closing the app).
CREATE TABLE IF NOT EXISTS chat_messages (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  role        ENUM('user','assistant') NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_chat_user (user_id, id),
  CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Counts AI calls (chat, photo scan, recipes) per user per day so one account can't run up the Gemini bill.
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id  INT UNSIGNED NOT NULL,
  day      DATE NOT NULL,
  calls    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day),
  CONSTRAINT fk_usage_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Create a least-privilege account for the PHP backend (change the password!):
-- CREATE USER 'plateup_app'@'localhost' IDENTIFIED BY 'change-this-password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON plateup.* TO 'plateup_app'@'localhost';
-- FLUSH PRIVILEGES;
