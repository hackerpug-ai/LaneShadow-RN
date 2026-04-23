package com.laneshadow.sandbox

import android.content.Intent
import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

data class SandboxLaunchRequest(
    val shouldOpenSandbox: Boolean,
    val requestedStoryId: String?,
)

object SandboxIntentParser {
    const val openSandboxExtraKey: String = "com.laneshadow.extra.OPEN_SANDBOX"
    const val storyIdExtraKey: String = "com.laneshadow.extra.SANDBOX_STORY_ID"
    private const val sandboxScheme: String = "app-sandbox"
    private const val sandboxHost: String = "sandbox"

    fun parse(intent: Intent?): SandboxLaunchRequest {
        val openSandbox = intent?.getBooleanExtra(openSandboxExtraKey, false) == true
        val storyIdExtra = intent?.getStringExtra(storyIdExtraKey)
        val deepLink = intent?.dataString

        return parse(
            openSandbox = openSandbox,
            storyIdExtra = storyIdExtra,
            deepLink = deepLink,
        )
    }

    fun parse(
        openSandbox: Boolean,
        storyIdExtra: String?,
        deepLink: String?,
    ): SandboxLaunchRequest {
        val requestedStoryId =
            storyIdExtra
                ?.trim()
                ?.takeIf(String::isNotEmpty)
                ?: parseStoryId(deepLink)

        val shouldOpenSandbox =
            openSandbox ||
                isSandboxDeepLink(deepLink) ||
                requestedStoryId != null

        return SandboxLaunchRequest(
            shouldOpenSandbox = shouldOpenSandbox,
            requestedStoryId = requestedStoryId,
        )
    }

    fun isSandboxDeepLink(deepLink: String?): Boolean {
        val uri = deepLink?.toUri() ?: return false
        return uri.scheme == sandboxScheme && uri.host == sandboxHost
    }

    fun parseStoryId(deepLink: String?): String? =
        if (isSandboxDeepLink(deepLink)) {
            deepLink
                ?.toUri()
                ?.rawQuery
                ?.split("&")
                ?.firstOrNull { it.substringBefore("=") == "id" }
                ?.substringAfter("=", "")
                ?.let { URLDecoder.decode(it, StandardCharsets.UTF_8.name()) }
                ?.trim()
                ?.takeIf(String::isNotEmpty)
        } else {
            null
        }

    private fun String.toUri(): URI? =
        runCatching { URI(this) }.getOrNull()
}
