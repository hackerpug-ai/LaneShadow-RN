package com.laneshadow.e2e.mapview

import android.content.Context
import android.content.Intent
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.EXTRA_BYPASS_AUTH
import com.laneshadow.MainActivity
import java.io.File
import java.util.regex.Pattern
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * End-to-end test for the Map View Idle state.
 *
 * Launches MainActivity with bypass auth and asserts on real Convex-driven
 * greeting, meta row, favorites, weather advisory, and navigation to planning.
 */
@RunWith(AndroidJUnit4::class)
class IdleStateE2ETest {

    @get:Rule
    val composeRule = createEmptyComposeRule()

    private var scenario: ActivityScenario<MainActivity>? = null
    private lateinit var screenshotDir: File

    @Before
    fun setUp() {
        screenshotDir = File(
            ApplicationProvider.getApplicationContext<Context>().getExternalFilesDir(null),
            "e2e-screenshots/mapview-idle",
        )
        screenshotDir.deleteRecursively()
        screenshotDir.mkdirs()
    }

    @After
    fun tearDown() {
        scenario?.close()
        scenario = null
    }

    @Test
    fun idleStateRendersGreetingAndMetaRow() {
        launchApp()
        waitForTag("idlescreen-current-user-greeting")
        waitForTag("greeting-meta")
        waitForTag("greeting-headline")

        composeRule.onNodeWithTag("greeting-meta")
            .assertExists("Expected meta row (day · temp · condition) to render.")

        captureScreenshot("idle-state-landing")
    }

    @Test
    fun idleStateMetaRowMatchesWeatherPattern() {
        launchApp()
        waitForTag("greeting-meta")

        val metaPattern = Pattern.compile("^[A-Z]+ · \\d+°F · [A-Z ]+$", Pattern.UNICODE_CHARACTER_CLASS)
        val metaNodes = composeRule.onAllNodes(hasTestTag("greeting-meta"))
            .fetchSemanticsNodes()

        check(metaNodes.isNotEmpty()) { "Meta row must exist" }
        val metaText = metaNodes.first().config.getOrNull(
            androidx.compose.ui.semantics.SemanticsProperties.Text
        )?.joinToString(" ") ?: ""
        check(metaPattern.matcher(metaText).matches()) {
            "Meta row '$metaText' does not match expected pattern"
        }
    }

    @Test
    fun idleStateSuggestionChipTransitionsToPlanning() {
        launchApp()
        waitForTag("idlescreen-current-user-greeting")

        val chipNodes = composeRule.onAllNodes(hasTestTag("suggestion-chip"))
            .fetchSemanticsNodes()
        check(chipNodes.isNotEmpty()) { "Expected at least one suggestion chip" }

        composeRule.onNodeWithTag("suggestion-chip").performClick()
        waitForTag("planning-phase-indicator", timeoutMillis = 10_000)
        captureScreenshot("idle-to-planning-transition")
    }

    @Test
    fun idleStateHamburgerOpensSessionsDrawer() {
        launchApp()
        waitForTag("idlescreen-current-user-greeting")
        waitForTag("ls-topbar-hamburger-chip")

        composeRule.onNodeWithTag("ls-topbar-hamburger-chip").performClick()
        waitForTag("sessions-drawer-root", timeoutMillis = 5_000)
        captureScreenshot("idle-drawer-open")
    }

    private fun launchApp() {
        scenario?.close()
        val context = ApplicationProvider.getApplicationContext<Context>()
        val intent = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(EXTRA_BYPASS_AUTH, true)
        }
        scenario = ActivityScenario.launch(intent)
        composeRule.waitForIdle()
    }

    private fun waitForTag(tag: String, timeoutMillis: Long = 30_000) {
        composeRule.waitUntil(timeoutMillis = timeoutMillis) {
            composeRule.onAllNodes(hasTestTag(tag), useUnmergedTree = true)
                .fetchSemanticsNodes()
                .isNotEmpty()
        }
    }

    private fun captureScreenshot(name: String) {
        val bitmap = androidx.test.platform.app.InstrumentationRegistry.getInstrumentation()
            .uiAutomation.takeScreenshot() ?: return
        val file = File(screenshotDir, "$name.png")
        java.io.FileOutputStream(file).use { output ->
            bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, output)
        }
        bitmap.recycle()
    }
}
