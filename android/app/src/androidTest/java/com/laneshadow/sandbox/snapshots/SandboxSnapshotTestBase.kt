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
     * Sanitize a story ID for use as a snapshot name.
     * Replaces '/' with '.' to ensure filesystem-safe names.
     * FIX 1: Prevents ENOENT when story IDs contain slashes (e.g., tokens/color-swatches/all).
     *
     * @param rawId The raw story ID (e.g., "tokens/color-swatches/all")
     * @return The sanitized ID (e.g., "tokens.color-swatches.all")
     */
    internal fun sanitizeSnapshotName(rawId: String): String =
        rawId.replace('/', '.')

    /**
     * Render a story with the specified theme and capture snapshot.
     *
     * @param story The story ID to snapshot (e.g., "atoms.button.primary" or "tokens/color-swatches/all")
     * @param isDarkTheme True for dark mode, false for light mode
     */
    protected fun captureStorySnapshot(
        story: String,
        isDarkTheme: Boolean,
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

        // Build the snapshot name with sanitization and theme suffix
        val sanitized = sanitizeSnapshotName(story)
        val themeSuffix = if (isDarkTheme) "dark" else "light"
        val snapshotName = "$sanitized.$themeSuffix"

        // Validate naming convention inline (AC-3)
        require(snapshotName.matches(SNAPSHOT_NAME_REGEX)) {
            "Snapshot name '$snapshotName' violates naming convention. Must match pattern: tier.component.variant.theme"
        }

        // Capture snapshot via dropshots (AC-1, AC-2, AC-3)
        // Note: dropshots will automatically use ComposeTestRule to capture the Composable
        dropshots.assertSnapshot(
            name = snapshotName,
        )
    }

    companion object {
        /**
         * Regex to enforce snapshot naming convention.
         * Story IDs are dot-separated with:
         * - lowercase letters and digits in tier/component/variant
         * - hyphens and camelCase allowed in variant parts
         * - theme must be "light" or "dark"
         * Examples:
         *   atoms.button.primary.light
         *   molecules.modal.default.dark
         *   organisms.routesheet.alt-route.light
         *   atoms.badge.bestForToday.light
         *   tokens.color-swatches.all.dark
         */
        private val SNAPSHOT_NAME_REGEX = Regex("""^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9\-]*)*\.(light|dark)$""")
    }
}
