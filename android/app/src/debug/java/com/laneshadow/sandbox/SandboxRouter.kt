package com.laneshadow.sandbox

import android.content.Intent
import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.stories.AppStories

data class SandboxRoute(
    val shouldOpenSandbox: Boolean,
    val storyId: String?,
)

object SandboxRouter {
    fun resolve(intent: Intent?): SandboxRoute {
        val request = SandboxIntentParser.parse(intent)
        val storyId =
            request.requestedStoryId?.takeIf { requestedId ->
                AppStories.all.any { story -> story.id == requestedId }
            }

        return SandboxRoute(
            shouldOpenSandbox = request.shouldOpenSandbox,
            storyId = storyId,
        )
    }

    fun shouldOpen(intent: Intent?): Boolean = resolve(intent).shouldOpenSandbox

    @Composable
    fun Content(intent: Intent?) {
        AppSandbox(route = resolve(intent))
    }
}
