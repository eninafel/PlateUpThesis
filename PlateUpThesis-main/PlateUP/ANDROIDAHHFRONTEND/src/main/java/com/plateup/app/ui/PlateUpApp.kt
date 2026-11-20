package com.plateup.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Kitchen
import androidx.compose.material.icons.filled.LocalDining
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.viewmodel.compose.viewModel

private enum class Tab(val label: String, val icon: ImageVector) {
    Scan("Scan", Icons.Filled.CameraAlt),
    Pantry("Pantry", Icons.Filled.Kitchen),
    Chat("Chatbot", Icons.AutoMirrored.Filled.Chat),
    Recipes("Recipes", Icons.Filled.LocalDining),
    Profile("Profile", Icons.Filled.Person),
}

@Composable
fun PlateUpApp(vm: PlateUpViewModel = viewModel()) {
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(vm.message) {
        vm.message?.let {
            snackbar.showSnackbar(it)
            vm.message = null
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            if (vm.loggedIn) MainTabs(vm) else AuthScreen(vm)
        }
    }
}

@Composable
private fun MainTabs(vm: PlateUpViewModel) {
    var selected by rememberSaveable { mutableStateOf(Tab.Scan) }

    // The Pantry tab only exists once the user has added or scanned at least one ingredient.
    val tabs = Tab.entries.filter { it != Tab.Pantry || vm.pantry.isNotEmpty() }
    val tab = if (selected in tabs) selected else Tab.Scan

    Column(Modifier.fillMaxSize().imePadding()) {
        Box(Modifier.weight(1f).statusBarsPadding()) {
            when (tab) {
                Tab.Scan -> ScanScreen(vm, onShowRecipes = { selected = Tab.Recipes })
                Tab.Pantry -> PantryScreen(vm)
                Tab.Chat -> ChatScreen(vm)
                Tab.Recipes -> RecipesScreen(vm)
                Tab.Profile -> ProfileScreen(vm)
            }
        }
        NavigationBar {
            tabs.forEach { t ->
                NavigationBarItem(
                    selected = tab == t,
                    onClick = { selected = t },
                    icon = { Icon(t.icon, contentDescription = t.label) },
                    label = { Text(t.label, maxLines = 1) },
                )
            }
        }
    }
}
