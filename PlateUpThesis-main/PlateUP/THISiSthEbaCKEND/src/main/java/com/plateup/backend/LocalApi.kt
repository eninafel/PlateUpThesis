package com.plateup.backend

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Base64
import android.util.Patterns
import com.google.gson.JsonElement
import com.plateup.database.PlateUpDb
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

private fun fail(code: Int, message: String): Nothing = throw ApiException(code, message)

private val CATEGORIES = listOf(
    "Produce", "Proteins", "Dairy & Eggs", "Grains & Bakery",
    "Spices & Condiments", "Canned & Pantry", "Beverages", "Snacks",
)

/** Stops one account from making unlimited AI calls per day. */
private const val AI_DAILY_LIMIT = 60

/**
 * Replaces the old PHP + MySQL backend. Every function here does what the matching
 * PHP endpoint did, but against the SQLite database on the phone.
 */
class LocalApi(context: Context, private val tokens: TokenStore) : ApiService {

    private val helper = PlateUpDb(context.applicationContext)
    private val db: SQLiteDatabase get() = helper.writableDatabase

    private suspend fun <T> io(block: () -> T): T = withContext(Dispatchers.IO) { block() }

    // ---------- helpers ----------

    private fun today(): String = LocalDate.now().toString()

    private fun userId(): Int = tokens.token?.toIntOrNull() ?: fail(401, "Please log in.")

    private fun loadUser(id: Int): User =
        db.rawQuery(
            "SELECT id, name, email, dietary_preference, allergies FROM users WHERE id = ?",
            arrayOf(id.toString())
        ).use { c ->
            if (!c.moveToFirst()) fail(401, "Your account was not found. Please log in again.")
            User(c.getInt(0), c.getString(1), c.getString(2), c.getString(3), c.getString(4))
        }

    private fun currentUser(): User = loadUser(userId())

    private fun text(value: String?, field: String, max: Int, required: Boolean = true, default: String = ""): String {
        val v = value?.trim().orEmpty()
        if (v.isEmpty()) {
            if (required) fail(422, "$field is required.")
            return default
        }
        if (v.length > max) fail(422, "$field must be at most $max characters.")
        return v
    }

    private fun allergyText(user: User) = if (user.allergies.isNotBlank()) user.allergies else "none"

    // ---------- passwords (salted PBKDF2, never stored in plain text) ----------

    private fun b64(bytes: ByteArray): String = Base64.encodeToString(bytes, Base64.NO_WRAP)

    private fun pbkdf2(password: String, salt: ByteArray): ByteArray =
        SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            .generateSecret(PBEKeySpec(password.toCharArray(), salt, 100_000, 256))
            .encoded

    private fun hashPassword(password: String): String {
        val salt = ByteArray(16).also { SecureRandom().nextBytes(it) }
        return b64(salt) + ":" + b64(pbkdf2(password, salt))
    }

    private fun passwordMatches(password: String, stored: String): Boolean {
        val parts = stored.split(":")
        if (parts.size != 2) return false
        val salt = Base64.decode(parts[0], Base64.NO_WRAP)
        val expected = Base64.decode(parts[1], Base64.NO_WRAP)
        return MessageDigest.isEqual(expected, pbkdf2(password, salt))
    }

    // ---------- auth ----------

    override suspend fun register(body: RegisterRequest): AuthResponse = io {
        val name = text(body.name, "Name", 100)
        val email = text(body.email, "Email", 190).lowercase()
        val pass = text(body.password, "Password", 200)
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) fail(422, "Please enter a valid email address.")
        if (pass.length < 8) fail(422, "Password must be at least 8 characters.")

        db.rawQuery("SELECT id FROM users WHERE email = ?", arrayOf(email)).use {
            if (it.moveToFirst()) fail(409, "That email is already registered.")
        }
        val values = ContentValues().apply {
            put("name", name)
            put("email", email)
            put("password_hash", hashPassword(pass))
        }
        val id = db.insertOrThrow("users", null, values).toInt()
        AuthResponse(id.toString(), loadUser(id))
    }

    override suspend fun login(body: LoginRequest): AuthResponse = io {
        val email = text(body.email, "Email", 190).lowercase()
        val pass = text(body.password, "Password", 200)

        var id = -1
        var hash = ""
        db.rawQuery("SELECT id, password_hash FROM users WHERE email = ?", arrayOf(email)).use {
            if (it.moveToFirst()) {
                id = it.getInt(0)
                hash = it.getString(1)
            }
        }
        // Same message for "no such email" and "wrong password".
        if (id < 0 || !passwordMatches(pass, hash)) fail(401, "Wrong email or password.")
        AuthResponse(id.toString(), loadUser(id))
    }

    // ---------- profile ----------

    override suspend fun profile(): UserResponse = io { UserResponse(currentUser()) }

    override suspend fun updateProfile(body: ProfileUpdate): UserResponse = io {
        val user = currentUser()
        val name = text(body.name, "Name", 100)
        val diet = text(body.dietaryPreference, "Dietary preference", 50, required = false, default = "Balanced")
        val allergies = text(body.allergies, "Allergies", 255, required = false)

        val values = ContentValues().apply {
            put("name", name)
            put("dietary_preference", diet)
            put("allergies", allergies)
        }
        db.update("users", values, "id = ?", arrayOf(user.id.toString()))
        UserResponse(loadUser(user.id))
    }

    // ---------- pantry ----------

    override suspend fun pantry(): ItemsResponse<PantryItem> = io {
        val uid = userId()
        val now = LocalDate.now()
        val items = ArrayList<PantryItem>()
        db.rawQuery(
            "SELECT id, name, category, quantity, estimated_calories, expiry_date FROM pantry_items " +
                "WHERE user_id = ? ORDER BY expiry_date IS NULL, expiry_date ASC, id DESC",
            arrayOf(uid.toString())
        ).use { c ->
            while (c.moveToNext()) {
                val expiry = if (c.isNull(5)) null else c.getString(5)
                val daysLeft = expiry?.let { ChronoUnit.DAYS.between(now, LocalDate.parse(it)).toInt() }
                items.add(
                    PantryItem(
                        id = c.getInt(0),
                        name = c.getString(1),
                        category = c.getString(2),
                        quantity = c.getString(3),
                        estimatedCalories = if (c.isNull(4)) null else c.getInt(4),
                        expiryDate = expiry,
                        daysLeft = daysLeft,
                    )
                )
            }
        }
        ItemsResponse(items)
    }

    override suspend fun addPantry(body: NewPantryItem): OkResponse = io {
        val uid = userId()
        val name = text(body.name, "Name", 120)
        val category = if (body.category in CATEGORIES) body.category else "Produce"
        val quantity = text(body.quantity, "Quantity", 50, required = false, default = "1 item")
        val calories = body.estimatedCalories?.coerceIn(0, 5000)
        val expiry = body.expiryDays?.coerceIn(0, 365)?.let { LocalDate.now().plusDays(it.toLong()).toString() }

        val values = ContentValues().apply {
            put("user_id", uid)
            put("name", name)
            put("category", category)
            put("quantity", quantity)
            if (calories == null) putNull("estimated_calories") else put("estimated_calories", calories)
            if (expiry == null) putNull("expiry_date") else put("expiry_date", expiry)
        }
        OkResponse(true, db.insertOrThrow("pantry_items", null, values).toInt())
    }

    override suspend fun deletePantry(id: Int): OkResponse = io {
        val uid = userId()
        val removed = db.delete("pantry_items", "id = ? AND user_id = ?", arrayOf(id.toString(), uid.toString()))
        if (removed == 0) fail(404, "Pantry item not found.")
        OkResponse(true)
    }

    // ---------- AI Chatbot ----------

    private fun recentMessages(uid: Int, limit: Int): List<ChatMessage> {
        val list = ArrayList<ChatMessage>()
        db.rawQuery(
            "SELECT role, content FROM (SELECT id, role, content FROM chat_messages " +
                "WHERE user_id = ? ORDER BY id DESC LIMIT $limit) ORDER BY id ASC",
            arrayOf(uid.toString())
        ).use { c ->
            while (c.moveToNext()) list.add(ChatMessage(c.getString(0), c.getString(1)))
        }
        return list
    }

    override suspend fun chatHistory(): ItemsResponse<ChatMessage> = io {
        ItemsResponse(recentMessages(userId(), 50))
    }

    override suspend fun clearChat(): OkResponse = io {
        db.delete("chat_messages", "user_id = ?", arrayOf(userId().toString()))
        OkResponse(true)
    }

    /** Counts AI calls per user per day. */
    private fun aiGuard(uid: Int) {
        val day = today()
        db.execSQL("INSERT OR IGNORE INTO ai_usage (user_id, day, calls) VALUES (?, ?, 0)", arrayOf<Any>(uid, day))
        db.execSQL("UPDATE ai_usage SET calls = calls + 1 WHERE user_id = ? AND day = ?", arrayOf<Any>(uid, day))
        var calls = 0
        db.rawQuery("SELECT calls FROM ai_usage WHERE user_id = ? AND day = ?", arrayOf(uid.toString(), day)).use {
            if (it.moveToFirst()) calls = it.getInt(0)
        }
        if (calls > AI_DAILY_LIMIT) {
            fail(429, "You've reached today's limit of $AI_DAILY_LIMIT AI requests. Try again tomorrow.")
        }
    }

    private fun pantryNames(uid: Int, orderByExpiry: Boolean, limit: Int): List<String> {
        val order = if (orderByExpiry) "expiry_date IS NULL, expiry_date ASC" else "id DESC"
        val names = ArrayList<String>()
        db.rawQuery(
            "SELECT name FROM pantry_items WHERE user_id = ? ORDER BY $order LIMIT $limit",
            arrayOf(uid.toString())
        ).use { while (it.moveToNext()) names.add(it.getString(0)) }
        return names
    }

    override suspend fun chat(body: ChatRequest): ChatReply = io {
        val user = currentUser()
        val message = text(body.message, "Message", 2000)
        Gemini.requireKey()
        aiGuard(user.id)

        val pantry = pantryNames(user.id, orderByExpiry = false, limit = 40).joinToString(", ")
            .ifEmpty { "nothing recorded yet" }
        val system = "You are the AI Chatbot inside PlateUP, a recipe finder and meal planner app.\n" +
            "Help with cooking steps, ingredient substitutions, calorie estimates and reducing food waste.\n" +
            "The user's pantry: $pantry.\n" +
            "Diet preference: ${user.dietaryPreference}. Allergies: ${allergyText(user)}.\n" +
            "Whenever you recommend a food, dish or recipe, ALWAYS include (1) its estimated calories per serving in kcal and " +
            "(2) its ingredients with rough amounts. Use this layout for each recommendation:\n" +
            "Name (about X kcal per serving)\nIngredients: amount + ingredient, one per line.\n" +
            "Then a short method if it helps. Prefer ingredients from the pantry and mark the ones the user would need to buy.\n" +
            "Calorie numbers are estimates, so say so. Never give medical advice. Keep answers short, warm and practical."

        // Conversation so far, then the new message. Gemini wants the first turn to be from the user.
        val contents = ArrayList<Map<String, Any>>()
        recentMessages(user.id, 20).forEach {
            contents.add(Gemini.turn(if (it.role == "assistant") "model" else "user", it.content))
        }
        while (contents.isNotEmpty() && contents[0]["role"] != "user") contents.removeAt(0)
        contents.add(Gemini.turn("user", message))

        val reply = Gemini.generate(contents, system).trim()

        db.beginTransaction()
        try {
            for ((role, content) in listOf("user" to message, "assistant" to reply)) {
                db.insertOrThrow("chat_messages", null, ContentValues().apply {
                    put("user_id", user.id)
                    put("role", role)
                    put("content", content)
                })
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
        ChatReply(reply)
    }

    // ---------- JSON helpers for the AI answers ----------

    private fun parseJsonObject(raw: String): JsonObject {
        val clean = raw.trim().removePrefix("```json").removePrefix("```").removeSuffix("```").trim()
        return try {
            JsonParser.parseString(clean).asJsonObject
        } catch (e: Exception) {
            fail(502, "The AI returned an answer in an unexpected format. Please try again.")
        }
    }

    private fun JsonElement?.strOr(default: String = ""): String {
        val e = this ?: return default
        return if (e.isJsonPrimitive) e.asString else default
    }

    private fun JsonElement?.intOr(default: Int = 0): Int {
        val e = this ?: return default
        return try {
            if (e.isJsonPrimitive) e.asDouble.toInt() else default
        } catch (ex: Exception) {
            default
        }
    }

    private fun JsonElement?.strList(max: Int): List<String> {
        val e = this ?: return emptyList()
        if (!e.isJsonArray) return emptyList()
        return e.asJsonArray
            .mapNotNull { if (it.isJsonPrimitive) it.asString.trim().take(160).takeIf { s -> s.isNotEmpty() } else null }
            .take(max)
    }

    private fun JsonElement?.ingredientList(max: Int): List<RecipeIngredient> =
        objList(max).mapNotNull { o ->
            val name = o.get("name").strOr().trim().take(120)
            if (name.isEmpty()) null
            else RecipeIngredient(
                name = name,
                amount = o.get("amount").strOr().trim().take(60),
                calories = o.get("calories").intOr().coerceIn(0, 5000),
            )
        }

    private fun JsonElement?.objList(max: Int): List<JsonObject> {
        val e = this ?: return emptyList()
        if (!e.isJsonArray) return emptyList()
        return e.asJsonArray.filter { it.isJsonObject }.map { it.asJsonObject }.take(max)
    }

    // ---------- recipes ----------

    override suspend fun recommend(body: RecipeRequest): RecipesResponse = io {
        val user = currentUser()
        val target = body.calorieTarget.coerceIn(100, 2000)

        // Use the ingredients sent by the app (for example from a photo scan), otherwise the saved pantry.
        var names: List<String> = body.ingredients.orEmpty()
            .map { it.trim().take(120) }
            .filter { it.isNotEmpty() }
            .take(30)
        if (names.isEmpty()) names = pantryNames(user.id, orderByExpiry = true, limit = 40)
        if (names.isEmpty()) fail(400, "Scan or add some ingredients first.")
        Gemini.requireKey()
        aiGuard(user.id)

        val system = "You are the recipe engine of PlateUP. Reply with JSON only."
        val prompt = "Ingredients at home (soonest to expire first): ${names.joinToString(", ")}.\n" +
            "Diet: ${user.dietaryPreference}. Allergies to avoid: ${allergyText(user)}.\n" +
            "Target about $target kcal per serving.\n" +
            "Suggest 3 practical recipes that use as many of these ingredients as possible.\n" +
            "For every recipe, list ALL ingredients in \"ingredients\" with a realistic amount (for the whole recipe) and the estimated " +
            "calories (integer kcal) that ingredient contributes. calories_per_serving must be the total of those calories divided by servings.\n" +
            "Return exactly: {\"recipes\":[{\"title\":\"\",\"description\":\"\",\"prep_time_minutes\":0,\"cook_time_minutes\":0," +
            "\"difficulty\":\"Easy\",\"servings\":1,\"calories_per_serving\":0,\"ingredients\":[{\"name\":\"\",\"amount\":\"\",\"calories\":0}],\"matched_ingredients\":[\"\"]," +
            "\"missing_ingredients\":[\"\"],\"instructions\":[\"\"]}]}"

        val data = parseJsonObject(Gemini.generate(listOf(Gemini.turn("user", prompt)), system, json = true, temperature = 0.6))
        if (!data.has("recipes") || !data.get("recipes").isJsonArray) {
            fail(502, "The AI returned recipes in an unexpected format. Please try again.")
        }

        val recipes = data.get("recipes").objList(5).filter { it.get("title").strOr().isNotBlank() }.map { r ->
            Recipe(
                title = r.get("title").strOr(),
                description = r.get("description").strOr(),
                prepTimeMinutes = r.get("prep_time_minutes").intOr(),
                cookTimeMinutes = r.get("cook_time_minutes").intOr(),
                difficulty = r.get("difficulty").strOr("Easy"),
                servings = maxOf(1, r.get("servings").intOr(1)),
                caloriesPerServing = r.get("calories_per_serving").intOr(),
                ingredients = r.get("ingredients").ingredientList(40),
                matchedIngredients = r.get("matched_ingredients").strList(30),
                missingIngredients = r.get("missing_ingredients").strList(30),
                instructions = r.get("instructions").strList(20),
            )
        }
        RecipesResponse(recipes)
    }

    // ---------- photo scan ----------

    override suspend fun scan(body: ScanRequest): ScanResponse = io {
        val user = currentUser()
        val b64 = body.imageBase64.trim().replace(Regex("^data:image/[a-zA-Z+.-]+;base64,"), "")
        if (b64.isEmpty()) fail(422, "Please choose a photo first.")
        if (b64.length > 7_000_000) fail(413, "That photo is too large. Try a smaller one.")
        val mime = body.mimeType.ifBlank { "image/jpeg" }
        Gemini.requireKey()
        aiGuard(user.id)

        val categories = CATEGORIES.joinToString(", ")
        val system = "You are the food recognition engine of PlateUP. Reply with JSON only. " +
            "List only food and drink you can actually see. Never guess items that are hidden. " +
            "Calories are rough estimates. Health notes are general nutrition facts, not medical advice."
        val prompt = "Look at this photo.\n" +
            "The user's diet: ${user.dietaryPreference}. Allergies: ${allergyText(user)}.\n" +
            "For each distinct food or ingredient return: name, category (one of: $categories), " +
            "quantity (the amount visible, e.g. \"3 pieces\"), estimated_calories (integer kcal for the amount shown), " +
            "calories_basis (short, e.g. \"for the amount shown\"), health_benefits (2 to 3 short strings), " +
            "health_concerns (0 to 3 short strings, such as high sodium, sugar or saturated fat, or a warning if it matches the user's allergies), " +
            "storage_tip (one short sentence) and expiry_days (typical days it stays fresh when stored well, integer or null).\n" +
            "Also return summary (one sentence) and dishes: up to 3 dishes the user can cook that are built from the ingredients you listed, " +
            "best match first. Each dish has: title, why (one short sentence), estimated_calories (per serving), prep_time_minutes, " +
            "uses (names copied exactly from your ingredients list; use as many of them as makes sense), " +
            "extra_needed (0 to 4 common items that are NOT in the photo, such as oil or salt), " +
            "ingredients (EVERY ingredient of the dish, each with name, amount for one serving and calories in kcal), " +
            "health_note (one short sentence) and steps (3 to 5 short steps). " +
            "Never suggest a dish that contains the user's allergens.\n" +
            "If no food is visible, return an empty ingredients list and an empty dishes list and say so in the summary.\n" +
            "Return exactly: {\"summary\":\"\",\"ingredients\":[{\"name\":\"\",\"category\":\"\",\"quantity\":\"\",\"estimated_calories\":0," +
            "\"calories_basis\":\"\",\"health_benefits\":[\"\"],\"health_concerns\":[\"\"],\"storage_tip\":\"\",\"expiry_days\":0}]," +
            "\"dishes\":[{\"title\":\"\",\"why\":\"\",\"estimated_calories\":0,\"prep_time_minutes\":0,\"uses\":[\"\"],\"extra_needed\":[\"\"],\"ingredients\":[{\"name\":\"\",\"amount\":\"\",\"calories\":0}]," +
            "\"health_note\":\"\",\"steps\":[\"\"]}]}"

        val contents = listOf<Map<String, Any>>(
            mapOf(
                "role" to "user",
                "parts" to listOf(
                    mapOf("text" to prompt),
                    mapOf("inlineData" to mapOf("mimeType" to mime, "data" to b64)),
                ),
            )
        )
        val data = parseJsonObject(Gemini.generate(contents, system, json = true, temperature = 0.3))

        val ingredients = data.get("ingredients").objList(20)
            .filter { it.get("name").strOr().isNotBlank() }
            .map { i ->
                val days = i.get("expiry_days")
                ScannedIngredient(
                    name = i.get("name").strOr().trim().take(120),
                    category = i.get("category").strOr().let { if (it in CATEGORIES) it else "Produce" },
                    quantity = i.get("quantity").strOr("1 item").trim().ifEmpty { "1 item" }.take(50),
                    estimatedCalories = i.get("estimated_calories").intOr().coerceIn(0, 5000),
                    caloriesBasis = i.get("calories_basis").strOr("for the amount shown").trim().take(80),
                    healthBenefits = i.get("health_benefits").strList(3),
                    healthConcerns = i.get("health_concerns").strList(3),
                    storageTip = i.get("storage_tip").strOr().trim().take(200),
                    expiryDays = if (days != null && days.isJsonPrimitive && days.asString.toDoubleOrNull() != null)
                        days.intOr().coerceIn(0, 365) else null,
                )
            }
        // The total is recomputed from the items; the model's own total is ignored.
        val total = ingredients.sumOf { it.estimatedCalories }

        // Keep only dishes that really use scanned ingredients, drop any that mention an allergen,
        // and rank them by how much of the photo they use.
        val scannedByLower = ingredients.associateBy { it.name.lowercase() }
        val allergens = user.allergies.split(",").map { it.trim().lowercase() }.filter { it.isNotEmpty() }

        val dishes = ArrayList<Dish>()
        for (d in data.get("dishes").objList(5)) {
            val title = d.get("title").strOr().trim().take(120)
            if (title.isEmpty()) continue
            val uses = d.get("uses").strList(20)
                .mapNotNull { scannedByLower[it.lowercase()]?.name }
                .distinct()
            if (uses.isEmpty()) continue
            val extra = d.get("extra_needed").strList(4)

            val haystack = (title + " " + uses.joinToString(" ") + " " + extra.joinToString(" ")).lowercase()
            if (allergens.any { haystack.contains(it) }) continue

            dishes.add(
                Dish(
                    title = title,
                    why = d.get("why").strOr().trim().take(200),
                    estimatedCalories = d.get("estimated_calories").intOr().coerceIn(0, 5000),
                    prepTimeMinutes = d.get("prep_time_minutes").intOr().coerceIn(0, 600),
                    uses = uses,
                    extraNeeded = extra,
                    healthNote = d.get("health_note").strOr().trim().take(200),
                    steps = d.get("steps").strList(6),
                    ingredients = d.get("ingredients").ingredientList(30),
                    matchPercent = Math.round(100.0 * uses.size / maxOf(1, ingredients.size)).toInt(),
                )
            )
        }
        val ranked = dishes.sortedWith(compareByDescending<Dish> { it.matchPercent }.thenBy { it.extraNeeded.size })

        ScanResponse(
            summary = data.get("summary").strOr().trim().take(300),
            ingredients = ingredients,
            totalCalories = total,
            dishes = ranked,
        )
    }
}
