package com.plateup.app.data

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/** Every call here is one PHP endpoint (routes are listed in backend/public/index.php). */
interface ApiService {
    @POST("api/auth/register") suspend fun register(@Body body: RegisterRequest): AuthResponse
    @POST("api/auth/login") suspend fun login(@Body body: LoginRequest): AuthResponse

    @GET("api/profile") suspend fun profile(): UserResponse
    @PUT("api/profile") suspend fun updateProfile(@Body body: ProfileUpdate): UserResponse

    @GET("api/pantry") suspend fun pantry(): ItemsResponse<PantryItem>
    @POST("api/pantry") suspend fun addPantry(@Body body: NewPantryItem): OkResponse
    @DELETE("api/pantry/{id}") suspend fun deletePantry(@Path("id") id: Int): OkResponse

    @GET("api/meals") suspend fun meals(@Query("date") date: String): MealsResponse
    @POST("api/meals") suspend fun addMeal(@Body body: NewMeal): OkResponse
    @DELETE("api/meals/{id}") suspend fun deleteMeal(@Path("id") id: Int): OkResponse

    @GET("api/chat/history") suspend fun chatHistory(): ItemsResponse<ChatMessage>
    @DELETE("api/chat/history") suspend fun clearChat(): OkResponse
    @POST("api/chat") suspend fun chat(@Body body: ChatRequest): ChatReply

    @POST("api/scan") suspend fun scan(@Body body: ScanRequest): ScanResponse

    @POST("api/recipes/recommend") suspend fun recommend(@Body body: RecipeRequest): RecipesResponse
}
