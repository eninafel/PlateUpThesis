package com.plateup.backend

import com.google.gson.annotations.SerializedName

// These classes mirror the JSON that the PHP backend sends and receives.

data class RegisterRequest(val name: String, val email: String, val password: String)
data class LoginRequest(val email: String, val password: String)

data class User(
    val id: Int,
    val name: String,
    val email: String,
    @SerializedName("daily_calorie_goal") val dailyCalorieGoal: Int,
    @SerializedName("dietary_preference") val dietaryPreference: String,
    val allergies: String,
)

data class AuthResponse(val token: String, val user: User)
data class UserResponse(val user: User)

data class ProfileUpdate(
    val name: String,
    @SerializedName("daily_calorie_goal") val dailyCalorieGoal: Int,
    @SerializedName("dietary_preference") val dietaryPreference: String,
    val allergies: String,
)

data class ItemsResponse<T>(val items: List<T>)
data class OkResponse(val ok: Boolean = true, val id: Int? = null)
data class ErrorBody(val error: String?)

data class PantryItem(
    val id: Int,
    val name: String,
    val category: String,
    val quantity: String,
    @SerializedName("estimated_calories") val estimatedCalories: Int?,
    @SerializedName("expiry_date") val expiryDate: String?,
    @SerializedName("days_left") val daysLeft: Int?,
)

data class NewPantryItem(
    val name: String,
    val category: String,
    val quantity: String,
    @SerializedName("estimated_calories") val estimatedCalories: Int?,
    @SerializedName("expiry_days") val expiryDays: Int?,
)

data class Meal(
    val id: Int,
    val name: String,
    @SerializedName("meal_type") val mealType: String,
    val calories: Int,
    @SerializedName("protein_g") val proteinG: Double,
    @SerializedName("carbs_g") val carbsG: Double,
    @SerializedName("fat_g") val fatG: Double,
    @SerializedName("eaten_on") val eatenOn: String,
)

data class MealsResponse(
    val items: List<Meal>,
    @SerializedName("total_calories") val totalCalories: Int,
    val goal: Int,
    val date: String,
)

data class NewMeal(
    val name: String,
    @SerializedName("meal_type") val mealType: String,
    val calories: Int,
    @SerializedName("protein_g") val proteinG: Double,
    @SerializedName("carbs_g") val carbsG: Double,
    @SerializedName("fat_g") val fatG: Double,
)

data class ChatRequest(val message: String)
data class ChatReply(val reply: String)
data class ChatMessage(val role: String, val content: String)

data class RecipeRequest(
    @SerializedName("calorie_target") val calorieTarget: Int,
    /** When set, recipes use these ingredients (for example from a scan) instead of the saved pantry. */
    val ingredients: List<String>? = null,
)

data class ScanRequest(
    @SerializedName("image_base64") val imageBase64: String,
    @SerializedName("mime_type") val mimeType: String = "image/jpeg",
)

data class ScannedIngredient(
    val name: String,
    val category: String,
    val quantity: String,
    @SerializedName("estimated_calories") val estimatedCalories: Int,
    @SerializedName("calories_basis") val caloriesBasis: String,
    @SerializedName("health_benefits") val healthBenefits: List<String>,
    @SerializedName("health_concerns") val healthConcerns: List<String>,
    @SerializedName("storage_tip") val storageTip: String,
    @SerializedName("expiry_days") val expiryDays: Int?,
)

/** A dish recommended from the scanned ingredients. */
data class Dish(
    val title: String,
    val why: String,
    @SerializedName("estimated_calories") val estimatedCalories: Int,
    @SerializedName("prep_time_minutes") val prepTimeMinutes: Int,
    /** Names of scanned ingredients this dish uses. */
    val uses: List<String>,
    /** Things you'd still need that are not in the photo. */
    @SerializedName("extra_needed") val extraNeeded: List<String>,
    @SerializedName("health_note") val healthNote: String,
    val steps: List<String>,
    /** Share of the scanned ingredients this dish uses, 0 to 100. */
    @SerializedName("match_percent") val matchPercent: Int,
)

data class ScanResponse(
    val summary: String,
    val ingredients: List<ScannedIngredient>,
    @SerializedName("total_calories") val totalCalories: Int,
    val dishes: List<Dish>,
)

data class Recipe(
    val title: String,
    val description: String,
    @SerializedName("prep_time_minutes") val prepTimeMinutes: Int,
    @SerializedName("cook_time_minutes") val cookTimeMinutes: Int,
    val difficulty: String,
    val servings: Int,
    @SerializedName("calories_per_serving") val caloriesPerServing: Int,
    @SerializedName("matched_ingredients") val matchedIngredients: List<String>,
    @SerializedName("missing_ingredients") val missingIngredients: List<String>,
    val instructions: List<String>,
)

data class RecipesResponse(val recipes: List<Recipe>)
