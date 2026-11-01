package com.plateup.app.data

import android.content.Context
import com.google.gson.Gson
import com.plateup.app.BuildConfig
import okhttp3.OkHttpClient
import retrofit2.HttpException
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.IOException
import java.util.concurrent.TimeUnit

/** Remembers the login token on the phone. */
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

/** One shared Retrofit client. Adds the login token to every request. */
object ApiClient {
    lateinit var tokens: TokenStore
        private set

    fun init(context: Context) {
        tokens = TokenStore(context.applicationContext)
    }

    val api: ApiService by lazy {
        val http = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val request = chain.request().newBuilder().header("Accept", "application/json")
                tokens.token?.let { request.header("Authorization", "Bearer $it") }
                chain.proceed(request.build())
            }
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS) // the AI Chatbot can take a while to answer
            .build()

        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(http)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}

/** Turns a network/server failure into a sentence the user can read. */
fun Throwable.friendlyMessage(): String = when (this) {
    is HttpException -> {
        val body = try { response()?.errorBody()?.string() } catch (e: Exception) { null }
        val serverMessage = try { Gson().fromJson(body, ErrorBody::class.java)?.error } catch (e: Exception) { null }
        serverMessage ?: "Server error (${code()})."
    }
    is IOException -> "Can't reach the server. Is the PHP backend running?"
    else -> message ?: "Something went wrong."
}
