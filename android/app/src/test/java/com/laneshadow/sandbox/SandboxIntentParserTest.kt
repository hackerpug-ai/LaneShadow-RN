package com.laneshadow.sandbox

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SandboxIntentParserTest {
    @Test
    fun parse_prefersStoryExtraOverDeepLinkQuery() {
        val request =
            SandboxIntentParser.parse(
                openSandbox = false,
                storyIdExtra = "atoms/button/loading",
                deepLink = "app-sandbox://sandbox?id=atoms%2Fbutton%2Fdefault",
            )

        assertTrue(request.shouldOpenSandbox)
        assertEquals("atoms/button/loading", request.requestedStoryId)
    }

    @Test
    fun parse_opensSandboxForValidDeepLinkWithoutBooleanExtra() {
        val request =
            SandboxIntentParser.parse(
                openSandbox = false,
                storyIdExtra = null,
                deepLink = "app-sandbox://sandbox?id=atoms%2Fbutton%2Fdefault",
            )

        assertTrue(request.shouldOpenSandbox)
        assertEquals("atoms/button/default", request.requestedStoryId)
    }

    @Test
    fun parse_ignoresNonSandboxUrls() {
        val request =
            SandboxIntentParser.parse(
                openSandbox = false,
                storyIdExtra = null,
                deepLink = "app-sandbox://not-sandbox?id=atoms%2Fbutton%2Fdefault",
            )

        assertFalse(request.shouldOpenSandbox)
        assertNull(request.requestedStoryId)
    }

    @Test
    fun parse_opensCatalogWhenBooleanExtraPresentWithoutStory() {
        val request =
            SandboxIntentParser.parse(
                openSandbox = true,
                storyIdExtra = null,
                deepLink = null,
            )

        assertTrue(request.shouldOpenSandbox)
        assertNull(request.requestedStoryId)
    }
}
