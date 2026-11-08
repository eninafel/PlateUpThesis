package com.plateup.app.data

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * The app's own database file (plateup.db), created automatically the first time the app runs.
 * Same tables as the old MySQL schema (database/schema.sql), written for SQLite.
 */
class PlateUpDb(context: Context) : SQLiteOpenHelper(context, "plateup.db", null, 1) {

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        db.setForeignKeyConstraintsEnabled(true)
    }

    override fun onCreate(db: SQLiteDatabase) {
        SCHEMA.forEach { db.execSQL(it) }
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Version 1 is the first release, nothing to migrate yet.
    }

    private companion object {
        val SCHEMA = listOf(
            """CREATE TABLE users (
                 id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                 name                TEXT NOT NULL,
                 email               TEXT NOT NULL UNIQUE,
                 password_hash       TEXT NOT NULL,
                 daily_calorie_goal  INTEGER NOT NULL DEFAULT 2000,
                 dietary_preference  TEXT NOT NULL DEFAULT 'Balanced',
                 allergies           TEXT NOT NULL DEFAULT '',
                 created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
               )""",
            """CREATE TABLE pantry_items (
                 id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                 user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                 name               TEXT NOT NULL,
                 category           TEXT NOT NULL DEFAULT 'Produce',
                 quantity           TEXT NOT NULL DEFAULT '1 item',
                 estimated_calories INTEGER,
                 expiry_date        TEXT,
                 added_at           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
               )""",
            "CREATE INDEX idx_pantry_user ON pantry_items(user_id)",
            """CREATE TABLE meals (
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
               )""",
            "CREATE INDEX idx_meals_user_date ON meals(user_id, eaten_on)",
            """CREATE TABLE chat_messages (
                 id          INTEGER PRIMARY KEY AUTOINCREMENT,
                 user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                 role        TEXT NOT NULL,
                 content     TEXT NOT NULL,
                 created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
               )""",
            "CREATE INDEX idx_chat_user ON chat_messages(user_id, id)",
            """CREATE TABLE ai_usage (
                 user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                 day      TEXT NOT NULL,
                 calls    INTEGER NOT NULL DEFAULT 0,
                 PRIMARY KEY (user_id, day)
               )""",
        )
    }
}
