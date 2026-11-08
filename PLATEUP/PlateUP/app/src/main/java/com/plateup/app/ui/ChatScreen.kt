package com.plateup.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.plateup.app.data.ChatMessage

private val SUGGESTIONS = listOf(
    "What can I cook with my pantry?",
    "Suggest a quick dinner under 500 kcal",
    "What can I use instead of butter?",
)

@Composable
fun ChatScreen(vm: PlateUpViewModel) {
    var input by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    // Keep the newest message in view.
    LaunchedEffect(vm.chat.size, vm.chatSending) {
        val last = vm.chat.size + (if (vm.chatSending) 1 else 0) - 1
        if (last >= 0) listState.animateScrollToItem(last)
    }

    fun send(text: String) {
        vm.sendChat(text)
        input = ""
    }

    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column {
                Text("AI Chatbot", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text(
                    "Cooking help, substitutions and calorie estimates",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (vm.chat.isNotEmpty()) {
                IconButton(onClick = { vm.clearChat() }) {
                    Icon(Icons.Filled.Delete, contentDescription = "Clear chat")
                }
            }
        }

        Box(Modifier.weight(1f).fillMaxWidth()) {
            if (vm.chat.isEmpty() && !vm.chatSending) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Ask me anything about cooking. Try:", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    SUGGESTIONS.forEach { s ->
                        AssistChip(onClick = { send(s) }, label = { Text(s) })
                    }
                }
            } else {
                LazyColumn(state = listState, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(vm.chat) { Bubble(it) }
                    if (vm.chatSending) {
                        item { Bubble(ChatMessage("assistant", "Thinking...")) }
                    }
                }
            }
        }

        Row(
            Modifier.fillMaxWidth().padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                placeholder = { Text("Ask the AI Chatbot...") },
                modifier = Modifier.weight(1f),
                maxLines = 4,
            )
            FilledIconButton(
                onClick = { send(input) },
                enabled = input.isNotBlank() && !vm.chatSending,
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send")
            }
        }
    }
}

@Composable
private fun Bubble(m: ChatMessage) {
    val mine = m.role == "user"
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start) {
        Box(
            Modifier
                .widthIn(max = 300.dp)
                .background(
                    if (mine) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                    RoundedCornerShape(16.dp),
                )
                .padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
            Text(
                m.content,
                color = if (mine) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
            )
        }
    }
}
