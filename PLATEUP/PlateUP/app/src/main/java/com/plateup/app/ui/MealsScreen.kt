package com.plateup.app.ui

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.plateup.app.data.Meal
import com.plateup.app.data.NewMeal

private val MEAL_TYPES = listOf("Breakfast", "Lunch", "Dinner", "Snack")

@Composable
fun MealsScreen(vm: PlateUpViewModel) {
    var showAdd by remember { mutableStateOf(false) }
    val goal = vm.calorieGoal.coerceAtLeast(1)
    val progress = (vm.todayCalories.toFloat() / goal).coerceIn(0f, 1f)

    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("Today's Meals", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            FilledIconButton(onClick = { showAdd = true }) {
                Icon(Icons.Filled.Add, contentDescription = "Log a meal")
            }
        }

        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(12.dp)) {
                Text("${vm.todayCalories} / ${vm.calorieGoal} kcal", fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(8.dp))
                LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(6.dp))
                val left = vm.calorieGoal - vm.todayCalories
                Text(
                    if (left >= 0) "$left kcal left today" else "${-left} kcal over today's goal",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Spacer(Modifier.height(12.dp))

        if (vm.meals.isEmpty()) {
            Text("No meals logged today. Tap + to add one.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(bottom = 16.dp)) {
                items(vm.meals, key = { it.id }) { meal -> MealRow(meal, onDelete = { vm.deleteMeal(meal.id) }) }
            }
        }
    }

    if (showAdd) {
        AddMealDialog(
            onDismiss = { showAdd = false },
            onAdd = {
                vm.addMeal(it)
                showAdd = false
            },
        )
    }
}

@Composable
private fun MealRow(meal: Meal, onDelete: () -> Unit) {
    Card(Modifier.fillMaxWidth()) {
        Row(Modifier.padding(start = 12.dp, top = 8.dp, bottom = 8.dp, end = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(meal.name, fontWeight = FontWeight.SemiBold)
                Text(
                    "${meal.mealType} • ${meal.calories} kcal • P ${meal.proteinG.toInt()}g  C ${meal.carbsG.toInt()}g  F ${meal.fatG.toInt()}g",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Filled.Delete, contentDescription = "Remove ${meal.name}")
            }
        }
    }
}

@Composable
private fun AddMealDialog(onDismiss: () -> Unit, onAdd: (NewMeal) -> Unit) {
    var name by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("Dinner") }
    var calories by remember { mutableStateOf("") }
    var protein by remember { mutableStateOf("") }
    var carbs by remember { mutableStateOf("") }
    var fat by remember { mutableStateOf("") }
    val number = KeyboardOptions(keyboardType = KeyboardType.Number)

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Log a meal") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(name, { name = it }, label = { Text("What did you eat?") }, singleLine = true)
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    MEAL_TYPES.forEach { t ->
                        FilterChip(selected = type == t, onClick = { type = t }, label = { Text(t, maxLines = 1) })
                    }
                }
                OutlinedTextField(
                    calories, { calories = it.filter(Char::isDigit) },
                    label = { Text("Calories (kcal)") }, singleLine = true, keyboardOptions = number,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        protein, { protein = it.filter(Char::isDigit) }, label = { Text("Protein g") },
                        singleLine = true, keyboardOptions = number, modifier = Modifier.weight(1f),
                    )
                    OutlinedTextField(
                        carbs, { carbs = it.filter(Char::isDigit) }, label = { Text("Carbs g") },
                        singleLine = true, keyboardOptions = number, modifier = Modifier.weight(1f),
                    )
                    OutlinedTextField(
                        fat, { fat = it.filter(Char::isDigit) }, label = { Text("Fat g") },
                        singleLine = true, keyboardOptions = number, modifier = Modifier.weight(1f),
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                enabled = name.isNotBlank() && calories.isNotEmpty(),
                onClick = {
                    onAdd(
                        NewMeal(
                            name = name.trim(),
                            mealType = type,
                            calories = calories.toIntOrNull() ?: 0,
                            proteinG = protein.toDoubleOrNull() ?: 0.0,
                            carbsG = carbs.toDoubleOrNull() ?: 0.0,
                            fatG = fat.toDoubleOrNull() ?: 0.0,
                        ),
                    )
                },
            ) { Text("Add") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
