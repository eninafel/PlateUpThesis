package com.plateup.app.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val PlateUpColors = lightColorScheme(
    primary = Color(0xFF059669),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD1FAE5),
    onPrimaryContainer = Color(0xFF064E3B),
    secondary = Color(0xFF0D9488),
    background = Color(0xFFFAFAF9),
    surface = Color(0xFFFFFFFF),
    surfaceVariant = Color(0xFFF1F5F4),
    error = Color(0xFFB91C1C),
)

@Composable
fun PlateUpTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = PlateUpColors, content = content)
}
