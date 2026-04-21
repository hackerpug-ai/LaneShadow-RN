// native-sandbox: configured
package com.laneshadow.sandbox.launch

import android.content.Intent
import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.LaneShadowSandbox
import com.laneshadow.sandbox.SandboxRoute
import com.laneshadow.sandbox.stories.AppStories
import com.nativesandbox.launch.SandboxLaunch

/**
 * Determines whether the sandbox should launch based on the provided intent.
 * Supports launch via:
 * - Intent extra: com.laneshadow.extra.OPEN_SANDBOX=true
 * - Deep link: app-sandbox://sandbox?id=<storyId>
 * - Story ID extra: com.laneshadow.extra.SANDBOX_STORY_ID=<storyId>
 */
object SandboxEntryPoint {
    private const val OPEN_SANDBOX_EXTRA = "com.laneshadow.extra.OPEN_SANDBOX"
    private const val STORY_ID_EXTRA = "com.laneshadow.extra.SANDBOX_STORY_ID"

    fun shouldOpen(intent: Intent?): Boolean =
        SandboxLaunch.shouldOpen(intent, extraKey = OPEN_SANDBOX_EXTRA)

    fun resolve(intent: Intent?): SandboxRoute {
        val openSandbox = shouldOpen(intent)
        val storyIdExtra = intent?.getStringExtra(STORY_ID_EXTRA)?.takeIf { it.isNotEmpty() }
        val requestedStoryId =
            storyIdExtra?.takeIf { requestedId ->
                AppStories.all.any { story -> story.id == requestedId }
            }

        return SandboxRoute(
            shouldOpenSandbox = openSandbox,
            storyId = requestedStoryId,
        )
    }

    @Composable
    fun Content(intent: Intent?) {
        LaneShadowSandbox(route = resolve(intent))
    }
}
