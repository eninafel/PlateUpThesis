package com.plateup.backend

import com.google.gson.Gson
import com.google.gson.JsonParser
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Calls Google's Gemini API directly from the phone (chat, photo scan, recipes).
 * The key comes from local.properties (GEMINI_API_KEY) and is built into the app by Gradle.
 * Fine for a thesis demo; a published app should keep the key on a server instead.
 */
object Gemini {
    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()
    private val gson = Gson()

    /** Throws a readable error when no key was configured. Everything except AI works without one. */
    fun requireKey() {
        if (BuildConfig.GEMINI_API_KEY.isBlank()) {
            throw ApiException(
                503,
                "AI features are off: add GEMINI_API_KEY=... to local.properties, then rebuild the app."
            )
        }
    }

    /** One text turn in Gemini's format. */
    fun turn(role: String, text: String): Map<String, Any> =
        mapOf("role" to role, "parts" to listOf(mapOf("text" to text)))

    /** Blocking call: run it off the main thread. Returns the model's text answer. */
    fun generate(
        contents: List<Map<String, Any>>,
        system: String,
        json: Boolean = false,
        temperature: Double = 0.7,
    ): String {
        requireKey()

        val config = mutableMapOf<String, Any>("temperature" to temperature)
        if (json) config["responseMimeType"] = "application/json"
        val body = mapOf(
            "systemInstruction" to mapOf("parts" to listOf(mapOf("text" to system))),
            "contents" to contents,
            "generationConfig" to config,
        )

        val url = "https://generativelanguage.googleapis.com/v1beta/models/${BuildConfig.GEMINI_MODEL}:generateContent"
        val request = Request.Builder()
            .url(url)
            .header("x-goog-api-key", BuildConfig.GEMINI_API_KEY)
            .post(gson.toJson(body).toRequestBody("application/json".toMediaType()))
            .build()

        http.newCall(request).execute().use { response ->
            val raw = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw ApiException(
                    502,
                    "The AI service returned an error (${response.code}). Check GEMINI_API_KEY and GEMINI_MODEL in local.properties."
                )
            }
            val text = StringBuilder()
            try {
                val parts = JsonParser.parseString(raw).asJsonObject
                    .getAsJsonArray("candidates")?.firstOrNull()?.asJsonObject
                    ?.getAsJsonObject("content")?.getAsJsonArray("parts")
                parts?.forEach { part ->
                    val t = part.asJsonObject.get("text")
                    if (t != null && t.isJsonPrimitive) text.append(t.asString)
                }
            } catch (e: Exception) {
                throw ApiException(502, "The AI service sent an answer the app could not read. Please try again.")
            }
            if (text.isBlank()) throw ApiException(502, "The AI service did not return an answer. Please try again.")
            return text.toString()
        }
    }
}
