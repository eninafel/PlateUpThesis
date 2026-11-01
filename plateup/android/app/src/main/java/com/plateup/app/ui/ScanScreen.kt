package com.plateup.app.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import com.plateup.app.data.Dish
import com.plateup.app.data.ScannedIngredient
import java.io.File

@Composable
fun ScanScreen(vm: PlateUpViewModel, onShowRecipes: () -> Unit) {
    val context = LocalContext.current
    var photoUri by rememberSaveable { mutableStateOf<Uri?>(null) }
    var showManualAdd by remember { mutableStateOf(false) }

    val takePicture = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { saved ->
        if (saved) photoUri?.let { vm.scanPhoto(context, it) }
    }
    val pickPhoto = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) vm.scanPhoto(context, uri)
    }

    fun openCamera() {
        try {
            val dir = File(context.cacheDir, "scans").apply { mkdirs() }
            val file = File(dir, "scan_${System.currentTimeMillis()}.jpg")
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
            photoUri = uri
            takePicture.launch(uri)
        } catch (e: Exception) {
            vm.message = "Couldn't open the camera. Try choosing a photo from your gallery."
        }
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp)) {
        Text(
            "Scan ingredients",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = 12.dp),
        )
        Text(
            "Photograph your ingredients. The AI lists what it sees with calories, health benefits and things to watch out for, then recommends dishes you can cook with them.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 2.dp, bottom = 12.dp),
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            Button(onClick = { openCamera() }, enabled = !vm.scanning, modifier = Modifier.weight(1f)) {
                Icon(Icons.Filled.CameraAlt, contentDescription = null)
                Spacer(Modifier.width(6.dp))
                Text("Take photo")
            }
            OutlinedButton(
                onClick = { pickPhoto.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                enabled = !vm.scanning,
                modifier = Modifier.weight(1f),
            ) {
                Icon(Icons.Filled.PhotoLibrary, contentDescription = null)
                Spacer(Modifier.width(6.dp))
                Text("Gallery")
            }
        }
        TextButton(onClick = { showManualAdd = true }) { Text("Or add an ingredient by typing") }

        if (vm.scanning) {
            Spacer(Modifier.height(16.dp))
            Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                Spacer(Modifier.width(10.dp))
                Text("Analyzing your photo...")
            }
        }

        vm.scanResult?.let { result ->
            if (result.ingredients.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer), modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text(result.summary, style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "About ${result.totalCalories} kcal in total (estimate)",
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))

                result.ingredients.forEach { IngredientCard(it) }

                if (result.dishes.isNotEmpty()) {
                    Text(
                        "Dishes you can make",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 4.dp, bottom = 6.dp),
                    )
                    result.dishes.forEachIndexed { index, dish -> DishCard(dish, best = index == 0) }
                }

                Button(
                    onClick = { vm.recipesFromScan(onShowRecipes) },
                    enabled = !vm.recipesLoading,
                    modifier = Modifier.fillMaxWidth(),
                ) { Text(if (vm.recipesLoading) "Finding recipes..." else "Get full recipes from these") }
                OutlinedButton(
                    onClick = { vm.addScannedToPantry(result.ingredients) },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Save to my pantry") }
                TextButton(onClick = { vm.clearScan() }, modifier = Modifier.fillMaxWidth()) { Text("Clear result") }

                Text(
                    "Estimates from a photo can be wrong, and health notes are general information, not medical advice. Check labels and your allergies.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Spacer(Modifier.height(16.dp))
    }

    if (showManualAdd) {
        AddPantryDialog(
            onDismiss = { showManualAdd = false },
            onAdd = {
                vm.addPantry(it)
                showManualAdd = false
            },
        )
    }
}

@Composable
private fun DishCard(dish: Dish, best: Boolean) {
    var open by rememberSaveable(dish.title) { mutableStateOf(false) }
    Card(
        onClick = { open = !open },
        modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (best) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface,
        ),
    ) {
        Column(Modifier.padding(12.dp)) {
            if (best) {
                Text("Best match", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            }
            Text(dish.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Text(
                "Uses ${dish.matchPercent}% of your ingredients • about ${dish.estimatedCalories} kcal per serving" +
                    (if (dish.prepTimeMinutes > 0) " • ${dish.prepTimeMinutes} min" else ""),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(4.dp))
            Text("From your photo: ${dish.uses.joinToString(", ")}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
            if (dish.extraNeeded.isNotEmpty()) {
                Text("You'll also need: ${dish.extraNeeded.joinToString(", ")}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
            }
            if (dish.why.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(dish.why, style = MaterialTheme.typography.bodySmall)
            }
            if (open) {
                if (dish.healthNote.isNotBlank()) {
                    Spacer(Modifier.height(6.dp))
                    Text("Health: ${dish.healthNote}", style = MaterialTheme.typography.bodySmall)
                }
                Spacer(Modifier.height(6.dp))
                dish.steps.forEachIndexed { i, step -> Text("${i + 1}. $step", style = MaterialTheme.typography.bodySmall) }
            } else {
                Text("Tap for steps", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}

@Composable
private fun IngredientCard(item: ScannedIngredient) {
    Card(Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
        Column(Modifier.padding(12.dp)) {
            Text(item.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Text(
                "${item.category} • ${item.quantity} • about ${item.estimatedCalories} kcal (${item.caloriesBasis})",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (item.healthBenefits.isNotEmpty()) {
                Spacer(Modifier.height(6.dp))
                Text("Good for you", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                item.healthBenefits.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
            }
            if (item.healthConcerns.isNotEmpty()) {
                Spacer(Modifier.height(6.dp))
                Text("Watch out for", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.error)
                item.healthConcerns.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
            }
            if (item.storageTip.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(
                    "Storage: ${item.storageTip}" + (item.expiryDays?.let { " (about $it days)" } ?: ""),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
