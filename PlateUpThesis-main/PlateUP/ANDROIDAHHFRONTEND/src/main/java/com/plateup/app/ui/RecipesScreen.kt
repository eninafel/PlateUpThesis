package com.plateup.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.plateup.backend.Recipe
import com.plateup.backend.RecipeIngredient

@Composable
fun RecipesScreen(vm: PlateUpViewModel) {
    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Text(
            "Recipes",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(vertical = 12.dp),
        )

        Button(
            onClick = { vm.findRecipes() },
            enabled = !vm.recipesLoading && vm.pantry.isNotEmpty(),
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (vm.recipesLoading) {
                CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                Spacer(Modifier.width(8.dp))
                Text("Asking the AI...")
            } else {
                Text("Find recipes from my pantry")
            }
        }
        if (vm.pantry.isEmpty()) {
            Text(
                "Scan a photo or add ingredients first.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 8.dp),
            )
        }
        Spacer(Modifier.height(12.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(bottom = 16.dp)) {
            items(vm.recipes) { RecipeCard(it) }
            if (vm.recipes.isNotEmpty()) {
                item {
                    Text(
                        "Calories and recipes are AI estimates. Double-check them, and check ingredients against your allergies.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun RecipeCard(r: Recipe) {
    var open by remember { mutableStateOf(false) }
    Card(onClick = { open = !open }, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp)) {
            Text(r.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Text(
                "${r.prepTimeMinutes + r.cookTimeMinutes} min • ${r.difficulty} • ${r.caloriesPerServing} kcal per serving • serves ${r.servings}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (r.description.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(r.description, style = MaterialTheme.typography.bodyMedium)
            }
            IngredientList(r.ingredients, r.caloriesPerServing, r.servings)
            if (open) {
                Spacer(Modifier.height(8.dp))
                if (r.matchedIngredients.isNotEmpty()) {
                    Text("You have: ${r.matchedIngredients.joinToString(", ")}", color = MaterialTheme.colorScheme.primary)
                }
                if (r.missingIngredients.isNotEmpty()) {
                    Text("You need: ${r.missingIngredients.joinToString(", ")}", color = MaterialTheme.colorScheme.error)
                }
                Spacer(Modifier.height(8.dp))
                r.instructions.forEachIndexed { i, step ->
                    Row(Modifier.padding(vertical = 2.dp), verticalAlignment = Alignment.Top) {
                        Text("${i + 1}. ", fontWeight = FontWeight.SemiBold)
                        Text(step)
                    }
                }
            } else {
                Text("Tap for steps", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}

/** Calories per serving plus every ingredient with its amount and calories. Shared by recipe and dish cards. */
@Composable
fun IngredientList(ingredients: List<RecipeIngredient>, kcalPerServing: Int, servings: Int? = null) {
    Spacer(Modifier.height(8.dp))
    Text(
        "$kcalPerServing kcal per serving" + (servings?.let { " (serves $it)" } ?: ""),
        fontWeight = FontWeight.SemiBold,
        color = MaterialTheme.colorScheme.primary,
    )
    if (ingredients.isNotEmpty()) {
        Spacer(Modifier.height(4.dp))
        Text("Ingredients", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        ingredients.forEach {
            Row(Modifier.fillMaxWidth().padding(vertical = 1.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(
                    buildString {
                        append("• ")
                        if (it.amount.isNotBlank()) append(it.amount).append(" ")
                        append(it.name)
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.weight(1f),
                )
                if (it.calories > 0) {
                    Text("${it.calories} kcal", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}
