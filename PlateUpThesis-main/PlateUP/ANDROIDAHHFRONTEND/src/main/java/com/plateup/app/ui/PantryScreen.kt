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
import com.plateup.backend.NewPantryItem
import com.plateup.backend.PantryItem

private val CATEGORIES = listOf(
    "Produce", "Proteins", "Dairy & Eggs", "Grains & Bakery",
    "Spices & Condiments", "Canned & Pantry", "Beverages", "Snacks",
)

@Composable
fun PantryScreen(vm: PlateUpViewModel) {
    var showAdd by remember { mutableStateOf(false) }
    val useSoon = vm.pantry.count { (it.daysLeft ?: Int.MAX_VALUE) <= 3 }

    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("My Pantry", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            FilledIconButton(onClick = { showAdd = true }) {
                Icon(Icons.Filled.Add, contentDescription = "Add ingredient")
            }
        }

        // Waste prevention: highlights food that will spoil soon.
        Card(
            colors = CardDefaults.cardColors(
                containerColor = if (useSoon > 0) MaterialTheme.colorScheme.errorContainer
                else MaterialTheme.colorScheme.primaryContainer,
            ),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                text = when {
                    vm.pantry.isEmpty() -> "Add what you have at home to start tracking freshness."
                    useSoon > 0 -> "$useSoon item(s) expire within 3 days. Try the Recipes tab to use them first."
                    else -> "Nothing is close to expiring."
                },
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(12.dp),
            )
        }
        Spacer(Modifier.height(12.dp))

        if (vm.pantry.isEmpty()) {
            Text(
                "Your pantry is empty. Tap + to add an ingredient.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 24.dp),
            )
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(bottom = 16.dp)) {
                items(vm.pantry, key = { it.id }) { item ->
                    PantryRow(item, onDelete = { vm.deletePantry(item.id) })
                }
            }
        }
    }

    if (showAdd) {
        AddPantryDialog(
            onDismiss = { showAdd = false },
            onAdd = {
                vm.addPantry(it)
                showAdd = false
            },
        )
    }
}

@Composable
private fun PantryRow(item: PantryItem, onDelete: () -> Unit) {
    Card(Modifier.fillMaxWidth()) {
        Row(Modifier.padding(start = 12.dp, top = 8.dp, bottom = 8.dp, end = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(item.name, fontWeight = FontWeight.SemiBold)
                Text(
                    buildString {
                        append(item.category).append(" • ").append(item.quantity)
                        item.estimatedCalories?.let { append(" • ").append(it).append(" kcal") }
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                item.daysLeft?.let { d ->
                    val (text, color) = when {
                        d < 0 -> "Expired ${-d} day(s) ago" to MaterialTheme.colorScheme.error
                        d == 0 -> "Expires today" to MaterialTheme.colorScheme.error
                        d <= 3 -> "$d day(s) left" to MaterialTheme.colorScheme.error
                        else -> "$d days left" to MaterialTheme.colorScheme.primary
                    }
                    Text(text, style = MaterialTheme.typography.labelMedium, color = color)
                }
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Filled.Delete, contentDescription = "Remove ${item.name}")
            }
        }
    }
}

@Composable
fun AddPantryDialog(onDismiss: () -> Unit, onAdd: (NewPantryItem) -> Unit) {
    var name by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("1 item") }
    var category by remember { mutableStateOf(CATEGORIES.first()) }
    var calories by remember { mutableStateOf("") }
    var days by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add ingredient") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(name, { name = it }, label = { Text("Name") }, singleLine = true)
                OutlinedTextField(quantity, { quantity = it }, label = { Text("Quantity") }, singleLine = true)
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    CATEGORIES.forEach { c ->
                        FilterChip(selected = category == c, onClick = { category = c }, label = { Text(c) })
                    }
                }
                OutlinedTextField(
                    calories, { calories = it.filter(Char::isDigit) },
                    label = { Text("Calories (optional)") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                )
                OutlinedTextField(
                    days, { days = it.filter(Char::isDigit) },
                    label = { Text("Days until it expires (optional)") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = name.isNotBlank(),
                onClick = {
                    onAdd(
                        NewPantryItem(
                            name = name.trim(),
                            category = category,
                            quantity = quantity.trim().ifEmpty { "1 item" },
                            estimatedCalories = calories.toIntOrNull(),
                            expiryDays = days.toIntOrNull(),
                        ),
                    )
                },
            ) { Text("Add") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
