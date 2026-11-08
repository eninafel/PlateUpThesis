package com.plateup.app.data

/**
 * Everything the screens can ask for. In this version every call is answered
 * on the phone by [LocalApi] (SQLite database), so no server is needed.
 * Only the AI features (chat, photo scan, recipes) go online, straight to Google Gemini.
 */
interface ApiService {
    suspend fun register(body: RegisterRequest): AuthResponse
    suspend fun login(body: LoginRequest): AuthResponse

    suspend fun profile(): UserResponse
    suspend fun updateProfile(body: ProfileUpdate): UserResponse

    suspend fun pantry(): ItemsResponse<PantryItem>
    suspend fun addPantry(body: NewPantryItem): OkResponse
    suspend fun deletePantry(id: Int): OkResponse

    suspend fun meals(date: String): MealsResponse
    suspend fun addMeal(body: NewMeal): OkResponse
    suspend fun deleteMeal(id: Int): OkResponse

    suspend fun chatHistory(): ItemsResponse<ChatMessage>
    suspend fun clearChat(): OkResponse
    suspend fun chat(body: ChatRequest): ChatReply

    suspend fun scan(body: ScanRequest): ScanResponse

    suspend fun recommend(body: RecipeRequest): RecipesResponse
}
