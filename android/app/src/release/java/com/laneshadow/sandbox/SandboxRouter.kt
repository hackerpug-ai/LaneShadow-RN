package com.laneshadow.sandbox

import android.content.Intent
import androidx.compose.runtime.Composable

object SandboxRouter {
    fun shouldOpen(intent: Intent?): Boolean = false

    @Composable
    fun Content(intent: Intent?) {
    }
}
