package com.plateup.app.ui

import android.content.Context
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.plateup.app.data.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import java.time.LocalDate

/** Holds everything the screens show and talks to the PHP backend through ApiClient. */
class PlateUpViewModel : ViewModel() {

    private val api get() = ApiClient.api

    var loggedIn by mutableStateOf(ApiClient.tokens.token != null)
        private set
    var user by mutableStateOf<User?>(null)
        private set
    var busy by mutableStateOf(false)
        private set

    /** One-line message shown in a snackbar; the UI clears it after showing. */
    var message by mutableStateOf<String?>(null)

    var pantry by mutableStateOf<List<PantryItem>>(emptyList())
        private set
    var meals by mutableStateOf<List<Meal>>(emptyList())
        private set
    var todayCalories by mutableIntStateOf(0)
        private set
    var calorieGoal by mutableIntStateOf(2000)
        private set
    var chat by mutableStateOf<List<ChatMessage>>(emptyList())
        private set
    var chatSending by mutableStateOf(false)
        private set
    var recipes by mutableStateOf<List<Recipe>>(emptyList())
        private set
    var recipesLoading by mutableStateOf(false)
        private set
    var scanResult by mutableStateOf<ScanResponse?>(null)
        private set
    var scanning by mutableStateOf(false)
        private set

    init {
        if (loggedIn) {
            loadProfile()
            refreshAll()
        }
    }

    // ---------- helpers ----------

    private fun launchApi(onFinally: () -> Unit = {}, block: suspend () -> Unit) {
        viewModelScope.launch {
            try {
                block()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401 && loggedIn) {
                    endSession("Your session expired. Please log in again.")
                } else {
                    message = e.friendlyMessage()
                }
            } finally {
                onFinally()
            }
        }
    }

    private fun today(): String = LocalDate.now().toString()

    private fun startSession(response: AuthResponse) {
        ApiClient.tokens.token = response.token
        user = response.user
        calorieGoal = response.user.dailyCalorieGoal
        loggedIn = true
        refreshAll()
    }

    private fun endSession(note: String?) {
        ApiClient.tokens.token = null
        loggedIn = false
        user = null
        pantry = emptyList()
        meals = emptyList()
        chat = emptyList()
        recipes = emptyList()
        scanResult = null
        todayCalories = 0
        note?.let { message = it }
    }

    // ---------- account ----------

    fun login(email: String, password: String) = launchApi({ busy = false }) {
        busy = true
        startSession(api.login(LoginRequest(email.trim(), password)))
    }

    fun register(name: String, email: String, password: String) = launchApi({ busy = false }) {
        busy = true
        startSession(api.register(RegisterRequest(name.trim(), email.trim(), password)))
    }

    fun logout() = endSession(null)

    private fun loadProfile() = launchApi {
        val u = api.profile().user
        user = u
        calorieGoal = u.dailyCalorieGoal
    }

    fun saveProfile(name: String, goal: Int, diet: String, allergies: String) = launchApi({ busy = false }) {
        busy = true
        val u = api.updateProfile(ProfileUpdate(name.trim(), goal, diet.trim(), allergies.trim())).user
        user = u
        calorieGoal = u.dailyCalorieGoal
        message = "Profile saved"
    }

    // ---------- loading ----------

    fun refreshAll() {
        loadPantry()
        loadMeals()
        loadChat()
    }

    private fun loadPantry() = launchApi { pantry = api.pantry().items }

    private fun loadMeals() = launchApi {
        val r = api.meals(today())
        meals = r.items
        todayCalories = r.totalCalories
        calorieGoal = r.goal
    }

    private fun loadChat() = launchApi { chat = api.chatHistory().items }

    // ---------- pantry ----------

    fun addPantry(item: NewPantryItem) = launchApi {
        api.addPantry(item)
        loadPantry()
    }

    fun deletePantry(id: Int) = launchApi {
        api.deletePantry(id)
        loadPantry()
    }

    // ---------- meals ----------

    fun addMeal(meal: NewMeal) = launchApi {
        api.addMeal(meal)
        loadMeals()
    }

    fun deleteMeal(id: Int) = launchApi {
        api.deleteMeal(id)
        loadMeals()
    }

    // ---------- AI Chatbot ----------

    fun sendChat(text: String) {
        val clean = text.trim()
        if (clean.isEmpty() || chatSending) return
        val before = chat
        chat = chat + ChatMessage("user", clean)
        chatSending = true
        launchApi({ chatSending = false }) {
            try {
                chat = chat + ChatMessage("assistant", api.chat(ChatRequest(clean)).reply)
            } catch (e: Exception) {
                chat = before // the server did not save the message, so take it back off the screen
                throw e
            }
        }
    }

    fun clearChat() = launchApi {
        api.clearChat()
        chat = emptyList()
    }

    // ---------- photo scan ----------

    /** Shrinks the photo, sends it to the PHP backend, and shows what the AI found. */
    fun scanPhoto(context: Context, uri: Uri) {
        val appContext = context.applicationContext
        scanning = true
        scanResult = null
        launchApi({ scanning = false }) {
            val image = withContext(Dispatchers.IO) { ImageUtils.uriToBase64Jpeg(appContext, uri) }
            val result = api.scan(ScanRequest(image))
            scanResult = result
            if (result.ingredients.isEmpty()) {
                message = "No food found in that photo. Try a closer, brighter shot."
            }
        }
    }

    fun clearScan() {
        scanResult = null
    }

    fun addScannedToPantry(items: List<ScannedIngredient>) = launchApi {
        items.forEach {
            api.addPantry(NewPantryItem(it.name, it.category, it.quantity, it.estimatedCalories, it.expiryDays))
        }
        loadPantry()
        message = "Added ${items.size} item(s) to your pantry"
    }

    /** Recipes made from exactly what was in the photo. [onReady] runs when they arrive. */
    fun recipesFromScan(onReady: () -> Unit) {
        val names = scanResult?.ingredients?.map { it.name }.orEmpty()
        if (names.isEmpty()) return
        recipesLoading = true
        launchApi({ recipesLoading = false }) {
            recipes = api.recommend(RecipeRequest(500, names)).recipes
            onReady()
        }
    }

    // ---------- recipes ----------

    fun findRecipes(calorieTarget: Int = 500) {
        recipesLoading = true
        launchApi({ recipesLoading = false }) {
            recipes = api.recommend(RecipeRequest(calorieTarget)).recipes
            if (recipes.isEmpty()) message = "No recipes came back. Try again."
        }
    }
}
