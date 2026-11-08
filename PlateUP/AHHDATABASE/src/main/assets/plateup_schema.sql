-- PlateUP database (SQLite). This file is the real schema: the app runs it the first time it starts.
-- Statements are separated by semicolons. Keep comments on their own lines starting with two dashes.

-- One row per registered person. Only a salted hash of the password is stored.
CREATE TABLE users (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  password_hash       TEXT NOT NULL,
  daily_calorie_goal  INTEGER NOT NULL DEFAULT 2000,
  dietary_preference  TEXT NOT NULL DEFAULT 'Balanced',
  allergies           TEXT NOT NULL DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ingredients the user has at home.
CREATE TABLE pantry_items (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  category           TEXT NOT NULL DEFAULT 'Produce',
  quantity           TEXT NOT NULL DEFAULT '1 item',
  estimated_calories INTEGER,
  expiry_date        TEXT,
  added_at           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_pantry_user ON pantry_items(user_id);

-- Meals the user ate or cooked (calorie tracking).
CREATE TABLE meals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  meal_type   TEXT NOT NULL DEFAULT 'Dinner',
  calories    INTEGER NOT NULL,
  protein_g   REAL NOT NULL DEFAULT 0,
  carbs_g     REAL NOT NULL DEFAULT 0,
  fat_g       REAL NOT NULL DEFAULT 0,
  eaten_on    TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_meals_user_date ON meals(user_id, eaten_on);

-- AI Chatbot conversation history.
CREATE TABLE chat_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_user ON chat_messages(user_id, id);

-- Counts AI calls per user per day so one account cannot make unlimited requests.
CREATE TABLE ai_usage (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day      TEXT NOT NULL,
  calls    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
