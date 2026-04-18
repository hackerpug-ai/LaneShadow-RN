package com.laneshadow.sandbox

import android.content.Intent
import androidx.compose.runtime.Composable
import com.nativesandbox.launch.SandboxLaunch

object SandboxRouter {
    fun shouldOpen(intent: Intent?): Boolean =
        SandboxLaunch.shouldOpen(intent, extraKey = "com.laneshadow.OPEN_SANDBOX")

    @Composable
    fun Content() {
        AppSandbox()
    }
}
