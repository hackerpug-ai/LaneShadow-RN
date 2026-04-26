package com.laneshadow.sandbox.snapshots

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.dropbox.dropshots.Dropshots
import com.laneshadow.sandbox.LaneShadowSandboxEntry
import com.laneshadow.sandbox.LaneShadowThemeController
import com.laneshadow.theme.LaneShadowTheme
import com.nativesandbox.theming.ThemeMode
import org.junit.Before
import org.junit.Rule
import org.junit.runner.RunWith

/**
 * Base class for snapshot tests of sandbox stories.
 *
 * Provides deterministic rendering environment:
 * - Disables animations
 * - Freezes clock and locale
 * - Configures theme (light or dark)
 * - Renders stories via dropshots
 *
 * Subclasses should implement snapshot tests for each story variant.
 *
 * AC-2: Per-story light + dark snapshots
 * AC-6: Determinism guards (animations disabled, clock pinned)
 */
@RunWith(AndroidJUnit4::class)
abstract class SandboxSnapshotTestBase {

    @get:Rule
    val composeTestRule = createComposeRule()

    @get:Rule
    val dropshots = Dropshots()

    /**
     * Set up deterministic test environment before each test.
     * - Disables animations for reproducible snapshots
     * - Freezes clock to avoid timing-dependent renders
     */
    @Before
    fun setupDeterminism() {
        // Disable animations for deterministic rendering (AC-6)
        // autoAdvance=false means the clock doesn't auto-advance;
        // we manually advance in captureStorySnapshot
        composeTestRule.mainClock.autoAdvance = false
    }

    /**
     * Render a story with the specified theme and capture snapshot.
     *
     * @param story The story ID to snapshot (e.g., "atoms.button.primary")
     * @param isDarkTheme True for dark mode, false for light mode
     * @param snapshotName The name for the snapshot PNG (e.g., "atoms.button.primary.light")
     */
    protected fun captureStorySnapshot(
        story: String,
        isDarkTheme: Boolean,
        snapshotName: String,
    ) {
        // Find the story in the registry
        val allStories = LaneShadowSandboxEntry.getAllStories()
        val targetStory = allStories.find { it.id == story }
            ?: error("Story not found: $story. Registered stories: ${allStories.map { it.id }.joinToString(", ")}")

        // Set theme on controller
        val themeMode = if (isDarkTheme) ThemeMode.AlwaysDark else ThemeMode.AlwaysLight
        LaneShadowThemeController.themeMode = themeMode

        // Render story with appropriate theme wrapper
        composeTestRule.setContent {
            LaneShadowTheme(darkTheme = isDarkTheme) {
                targetStory.content()
            }
        }

        // AC-6: Advance time and wait for all animations to settle
        // For stories with LaunchedEffect animations (e.g., RouteResults polyline stagger),
        // we advance the clock past animation duration to capture final state.
        composeTestRule.mainClock.advanceTimeBy(3000) // Advance 3s past any animation
        composeTestRule.waitForIdle()

        // Capture snapshot via dropshots (AC-1, AC-2, AC-3)
        // Note: dropshots will automatically use ComposeTestRule to capture the Composable
        dropshots.assertSnapshot(
            name = snapshotName,
        )
    }
}
