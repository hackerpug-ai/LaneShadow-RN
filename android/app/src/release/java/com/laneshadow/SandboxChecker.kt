// Release build: sandbox disabled
package com.laneshadow

import androidx.compose.runtime.Composable

/**
 * Release implementation of SandboxChecker. Sandbox is disabled in release builds.
 */
object SandboxChecker {
    fun shouldOpen(intent: android.content.Intent?): Boolean = false

    @Composable
    fun Content(intent: android.content.Intent?) {
        // Release builds: sandbox disabled
    }
}
