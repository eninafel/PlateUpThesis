package com.plateup.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@Composable
fun ProfileScreen(vm: PlateUpViewModel) {
    val user = vm.user
    var name by remember(user) { mutableStateOf(user?.name ?: "") }
    var goal by remember(user) { mutableStateOf((user?.dailyCalorieGoal ?: 2000).toString()) }
    var diet by remember(user) { mutableStateOf(user?.dietaryPreference ?: "Balanced") }
    var allergies by remember(user) { mutableStateOf(user?.allergies ?: "") }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp)) {
        Text(
            "Profile",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(vertical = 12.dp),
        )
        Text(user?.email ?: "", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(12.dp))

        OutlinedTextField(name, { name = it }, label = { Text("Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            goal, { goal = it.filter(Char::isDigit) },
            label = { Text("Daily calorie goal (kcal)") }, singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            diet, { diet = it }, label = { Text("Diet (e.g. Balanced, Vegetarian, High Protein)") },
            singleLine = true, modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            allergies, { allergies = it }, label = { Text("Allergies (comma separated)") },
            singleLine = true, modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(16.dp))

        Button(
            onClick = { vm.saveProfile(name, goal.toIntOrNull() ?: 2000, diet, allergies) },
            enabled = !vm.busy && name.isNotBlank() && diet.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Save") }

        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = { vm.logout() }, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text("Log out")
        }
        Spacer(Modifier.height(16.dp))
    }
}
