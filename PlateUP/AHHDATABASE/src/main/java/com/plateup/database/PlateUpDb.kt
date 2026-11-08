package com.plateup.database

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * Opens (and the first time creates) the app's database file, plateup.db.
 * The tables are defined in src/main/assets/plateup_schema.sql.
 */
class PlateUpDb(private val appContext: Context) : SQLiteOpenHelper(appContext, "plateup.db", null, 1) {

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        db.setForeignKeyConstraintsEnabled(true)
    }

    override fun onCreate(db: SQLiteDatabase) {
        schemaStatements().forEach { db.execSQL(it) }
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Version 1 is the first release, nothing to migrate yet.
    }

    /** Reads plateup_schema.sql and splits it into single statements. */
    private fun schemaStatements(): List<String> {
        val sql = appContext.assets.open("plateup_schema.sql").bufferedReader().use { it.readText() }
        return sql.lineSequence()
            .filterNot { it.trimStart().startsWith("--") }
            .joinToString("\n")
            .split(";")
            .map { it.trim() }
            .filter { it.isNotEmpty() }
    }
}
