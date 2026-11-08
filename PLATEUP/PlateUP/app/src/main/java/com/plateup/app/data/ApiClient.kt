package com.plateup.app.data

import android.content.Context
import java.io.IOException

/** An error with a message that is safe to show to the user. [code] works like an HTTP status (401 = not logged in). */
class ApiException(val code: Int, message: String) : Exception(message)

/** Remembers who is logged in (the user id) on the phone. */
class TokenStore(context: Context) {
    private val prefs = context.getSharedPreferences("plateup", Context.MODE_PRIVATE)

    var token: String?
        get() = prefs.getString("token", null)
        set(value) {
            prefs.edit().apply {
                if (value == null) remove("token") else putString("token", value)
            }.apply()
        }
}

/** Creates the one shared [LocalApi] that stores everything in the phone's SQLite database. */
object ApiClient {
    lateinit var tokens: TokenStore
        private set
    lateinit var api: ApiService
        private set

    fun init(context: Context) {
        val app = context.applicationContext
        tokens = TokenStore(app)
        api = LocalApi(app, tokens)
    }
}

/** Turns a failure into a sentence the user can read. */
fun Throwable.friendlyMessage(): String = when (this) {
    is ApiException -> message ?: "Something went wrong."
    is IOException -> "Can't reach the AI service. Check your internet connection."
    else -> message ?: "Something went wrong."
}
