// native-sandbox: configured
package com.laneshadow

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.launch.SandboxEntryPoint

/**
 * Debug implementation of SandboxChecker. Delegates to the sandbox entry point.
 */
object SandboxChecker {
    fun shouldOpen(intent: android.content.Intent?): Boolean =
        SandboxEntryPoint.shouldOpen(intent)

    @Composable
    fun Content(intent: android.content.Intent?) {
        SandboxEntryPoint.Content(intent)
    }
}
