package com.plateup.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.plateup.backend.ApiClient
import com.plateup.app.ui.PlateUpApp
import com.plateup.app.ui.PlateUpTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ApiClient.init(applicationContext) // must run before any screen asks for the login token
        enableEdgeToEdge()
        setContent {
            PlateUpTheme {
                PlateUpApp()
            }
        }
    }
}
