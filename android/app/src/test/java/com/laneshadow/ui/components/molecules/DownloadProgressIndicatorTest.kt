package com.laneshadow.ui.components.molecules

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LaneShadowColors
import com.laneshadow.theme.LaneShadowElevation
import com.laneshadow.theme.LaneShadowElevationLevel
import com.laneshadow.theme.LaneShadowMotion
import com.laneshadow.theme.LaneShadowOpacity
import com.laneshadow.theme.LaneShadowRadius
import com.laneshadow.theme.LaneShadowSpace
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LaneShadowType
import com.laneshadow.theme.LaneShadowTypeScale
import com.laneshadow.theme.LocalLaneShadowTheme
import dev.nativetheme.primitives.ColorSet
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * TDD tests for DownloadProgressIndicator component
 *
 * Following RED -> GREEN -> REFACTOR cycle per acceptance criterion
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class DownloadProgressIndicatorTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    // Create a minimal test theme
    private val testTheme = LaneShadowThemeValues(
        colors = LaneShadowColors(
            primary = ColorSet(Color(0xFF6366F1), null, null, null, null),
            secondary = ColorSet(Color(0xFF8B5CF6), null, null, null, null),
            tertiary = ColorSet(Color(0xFFEC4899), null, null, null, null),
            success = ColorSet(Color(0xFF10B981), null, null, null, null),
            warning = ColorSet(Color(0xFFF59E0B), null, null, null, null),
            warningContainer = ColorSet(Color(0xFFFEF3C7), null, null, null, null),
            onWarningContainer = ColorSet(Color(0xFF92400E), null, null, null, null),
            danger = ColorSet(Color(0xFFEF4444), null, null, null, null),
            info = ColorSet(Color(0xFF3B82F6), null, null, null, null),
            surface = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            surfaceVariant = ColorSet(Color(0xFFF3F4F6), null, null, null, null),
            background = ColorSet(Color(0xFFFAFAFA), null, null, null, null),
            onSurface = ColorSet(Color(0xFF111827), null, null, null, null),
            onPrimary = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            onSecondary = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            secondaryContainer = ColorSet(Color(0xFFEDE9FE), null, null, null, null),
            onSecondaryContainer = ColorSet(Color(0xFF4C1D95), null, null, null, null),
            border = ColorSet(Color(0xFFE5E7EB), null, null, null, null),
            input = ColorSet(Color(0xFFD1D5DB), null, null, null, null),
            ring = ColorSet(Color(0xFF6366F1), null, null, null, null),
            card = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            popover = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            accent = ColorSet(Color(0xFFF472B6), null, null, null, null),
            muted = ColorSet(Color(0xFFF3F4F6), null, null, null, null),
            divider = ColorSet(Color(0xFFE5E7EB), null, null, null, null),
            scrim = ColorSet(Color(0xFF000000), null, null, null, null),
            routeSelected = ColorSet(Color(0xFF6366F1), null, null, null, null),
            routeAlternate = ColorSet(Color(0xFF9CA3AF), null, null, null, null),
        ),
        space = LaneShadowSpace(
            xs = 4.dp,
            sm = 8.dp,
            md = 16.dp,
            lg = 24.dp,
            xl = 32.dp,
            xxl = 48.dp,
            xxxl = 64.dp,
            xxxxl = 96.dp,
        ),
        radius = LaneShadowRadius(
            none = 0.dp,
            sm = 4.dp,
            md = 8.dp,
            lg = 12.dp,
            xl = 16.dp,
            xxl = 24.dp,
            full = 9999.dp,
        ),
        type = LaneShadowType(
            label = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 11.sp, lineHeight = 16.sp, fontWeight = FontWeight.Medium),
                md = TextStyle(fontSize = 12.sp, lineHeight = 20.sp, fontWeight = FontWeight.Medium),
                lg = TextStyle(fontSize = 14.sp, lineHeight = 24.sp, fontWeight = FontWeight.Medium),
            ),
            body = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 12.sp, lineHeight = 18.sp, fontWeight = FontWeight.Normal),
                md = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Normal),
                lg = TextStyle(fontSize = 16.sp, lineHeight = 24.sp, fontWeight = FontWeight.Normal),
            ),
            title = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 16.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold),
                md = TextStyle(fontSize = 18.sp, lineHeight = 28.sp, fontWeight = FontWeight.SemiBold),
                lg = TextStyle(fontSize = 20.sp, lineHeight = 32.sp, fontWeight = FontWeight.SemiBold),
            ),
            heading = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 24.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold),
                md = TextStyle(fontSize = 30.sp, lineHeight = 40.sp, fontWeight = FontWeight.Bold),
                lg = TextStyle(fontSize = 36.sp, lineHeight = 48.sp, fontWeight = FontWeight.Bold),
            ),
            display = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 48.sp, lineHeight = 56.sp, fontWeight = FontWeight.Bold),
                md = TextStyle(fontSize = 60.sp, lineHeight = 64.sp, fontWeight = FontWeight.Bold),
                lg = TextStyle(fontSize = 72.sp, lineHeight = 80.sp, fontWeight = FontWeight.Bold),
            ),
        ),
        elevation = LaneShadowElevation(
            light = LaneShadowElevationLevel(
                level0 = 0.dp,
                level1 = 4.dp,
                level2 = 8.dp,
                level3 = 12.dp,
                level4 = 16.dp,
                level5 = 20.dp,
                level8 = 32.dp,
            ),
            dark = LaneShadowElevationLevel(
                level0 = 0.dp,
                level1 = 4.dp,
                level2 = 8.dp,
                level3 = 12.dp,
                level4 = 16.dp,
                level5 = 20.dp,
                level8 = 32.dp,
            ),
        ),
        motion = LaneShadowMotion(
            duration = mapOf(
                "fast" to 150,
                "standard" to 300,
                "slow" to 500,
            ),
            delay = emptyMap(),
            scale = emptyMap(),
            easing = emptyMap(),
        ),
        opacity = LaneShadowOpacity(
            values = mapOf(
                "step00" to 0f,
                "step01" to 0.1f,
                "step02" to 0.2f,
                "step03" to 0.3f,
                "step04" to 0.4f,
                "step05" to 0.5f,
                "step06" to 0.6f,
                "step07" to 0.7f,
                "step08" to 0.8f,
                "step09" to 0.9f,
                "step10" to 1f,
                "step11" to 1f,
            ),
        ),
        domain = com.laneshadow.theme.DomainColors(
            waypointOnRoute = ColorSet(Color(0xFF10B981), null, null, null, null),
            waypointOffRoute = ColorSet(Color(0xFF9CA3AF), null, null, null, null),
            waypointMixed = ColorSet(Color(0xFF6366F1), null, null, null, null),
            enrichmentFast = ColorSet(Color(0xFF10B981), null, null, null, null),
            enrichmentExtended = ColorSet(Color(0xFFF59E0B), null, null, null, null),
            enrichmentCached = ColorSet(Color(0xFF6366F1), null, null, null, null),
            deviationOriginalRoute = ColorSet(Color(0xFF10B981), null, null, null, null),
            deviationDetourPath = ColorSet(Color(0xFFF59E0B), null, null, null, null),
            deviationReconnectPoint = ColorSet(Color(0xFF6366F1), null, null, null, null),
            locationPoiFill = ColorSet(Color(0xFF3B82F6), null, null, null, null),
            locationPoiRing = ColorSet(Color(0xFF6366F1), null, null, null, null),
            locationPoiMuted = ColorSet(Color(0xFFE5E7EB), null, null, null, null),
            locationPoiBg = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            orange = ColorSet(Color(0xFFF97316), null, null, null, null),
        ),
    )

    /**
     * AC-1: Component renders in downloading state
     * GIVEN: App is running and component is mounted
     * WHEN: DownloadProgressIndicator is rendered with downloading state
     * THEN: Component displays title, percentage, progress bar, download info, and cancel button
     */
    @Test
    fun testDownloadingStateRendering() {
        // GIVEN: DownloadProgressIndicator component with downloading state
        // WHEN: Rendered with download progress
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "San Francisco Downtown",
                    bytesDownloaded = 15 * 1024 * 1024, // 15 MB
                    totalBytes = 50 * 1024 * 1024, // 50 MB
                    percentage = 30,
                    eta = 120,
                    state = DownloadState.Downloading,
                    onCancel = {},
                )
            }
        }

        // THEN: Component displays with all expected elements
        composeTestRule.onNodeWithText("Downloading...").assertIsDisplayed()
        composeTestRule.onNodeWithText("30%").assertIsDisplayed()
        composeTestRule.onNodeWithText("15 MB / 50 MB").assertIsDisplayed()
        composeTestRule.onNodeWithText("2 min left").assertIsDisplayed()
        composeTestRule.onNodeWithText("Cancel Download").assertIsDisplayed()
    }

    /**
     * AC-2: Component renders in complete state
     * GIVEN: App is running and component is mounted
     * WHEN: DownloadProgressIndicator is rendered with complete state
     * THEN: Component displays "Complete" title, 100%, and completion status
     */
    @Test
    fun testCompleteStateRendering() {
        // GIVEN: DownloadProgressIndicator component with complete state
        // WHEN: Rendered with 100% progress
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "San Francisco Downtown",
                    bytesDownloaded = 50 * 1024 * 1024, // 50 MB
                    totalBytes = 50 * 1024 * 1024, // 50 MB
                    percentage = 100,
                    eta = null,
                    state = DownloadState.Complete,
                )
            }
        }

        // THEN: Component displays completion state without cancel button
        composeTestRule.onNodeWithText("Complete").assertIsDisplayed()
        composeTestRule.onNodeWithText("100%").assertIsDisplayed()
        composeTestRule.onNodeWithText("50 MB / 50 MB").assertIsDisplayed()
        composeTestRule.onNodeWithText("Download complete").assertIsDisplayed()
        // Cancel button should NOT be displayed
        composeTestRule.onNodeWithText("Cancel Download")
            .assertDoesNotExist()
    }

    /**
     * AC-3: Component renders in failed state
     * GIVEN: App is running and component is mounted
     * WHEN: DownloadProgressIndicator is rendered with failed state
     * THEN: Component displays "Downloading..." title and "Download failed" status
     */
    @Test
    fun testFailedStateRendering() {
        // GIVEN: DownloadProgressIndicator component with failed state
        // WHEN: Rendered with failed state
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "San Francisco Downtown",
                    bytesDownloaded = 25 * 1024 * 1024, // 25 MB
                    totalBytes = 50 * 1024 * 1024, // 50 MB
                    percentage = 50,
                    eta = null,
                    state = DownloadState.Failed,
                )
            }
        }

        // THEN: Component displays failure state
        composeTestRule.onNodeWithText("Downloading...").assertIsDisplayed()
        composeTestRule.onNodeWithText("50%").assertIsDisplayed()
        composeTestRule.onNodeWithText("25 MB / 50 MB").assertIsDisplayed()
        composeTestRule.onNodeWithText("Download failed").assertIsDisplayed()
        // Cancel button should NOT be displayed
        composeTestRule.onNodeWithText("Cancel Download")
            .assertDoesNotExist()
    }

    /**
     * AC-4: Component renders in paused state
     * GIVEN: App is running and component is mounted
     * WHEN: DownloadProgressIndicator is rendered with paused state
     * THEN: Component displays "Downloading..." title and "Paused" status
     */
    @Test
    fun testPausedStateRendering() {
        // GIVEN: DownloadProgressIndicator component with paused state
        // WHEN: Rendered with paused state
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "San Francisco Downtown",
                    bytesDownloaded = 20 * 1024 * 1024, // 20 MB
                    totalBytes = 50 * 1024 * 1024, // 50 MB
                    percentage = 40,
                    eta = null,
                    state = DownloadState.Paused,
                )
            }
        }

        // THEN: Component displays paused state
        composeTestRule.onNodeWithText("Downloading...").assertIsDisplayed()
        composeTestRule.onNodeWithText("40%").assertIsDisplayed()
        composeTestRule.onNodeWithText("20 MB / 50 MB").assertIsDisplayed()
        composeTestRule.onNodeWithText("Paused").assertIsDisplayed()
        // Cancel button should NOT be displayed
        composeTestRule.onNodeWithText("Cancel Download")
            .assertDoesNotExist()
    }

    /**
     * AC-5: Component formats bytes correctly (< 1 MB and >= 1 MB)
     * GIVEN: Component receives byte counts
     * WHEN: Bytes are less than 1 MB or greater than 1 MB
     * THEN: Display text matches expected format
     */
    @Test
    fun testByteFormatting() {
        // GIVEN: DownloadProgressIndicator with small byte count
        // WHEN: Rendered with < 1 MB downloaded
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "Small Pack",
                    bytesDownloaded = 500 * 1024, // 500 KB
                    totalBytes = 2 * 1024 * 1024, // 2 MB
                    percentage = 25,
                    eta = 30,
                    state = DownloadState.Downloading,
                )
            }
        }

        // THEN: Display shows "< 1 MB" for small values
        composeTestRule.onNodeWithText("< 1 MB / 2 MB").assertIsDisplayed()
    }

    /**
     * AC-6: Component formats ETA correctly (seconds and minutes)
     * GIVEN: Component receives ETA in seconds
     * WHEN: ETA is < 60 seconds or >= 60 seconds
     * THEN: Display text shows "X sec left" or "X min left"
     */
    @Test
    fun testETAFormatting() {
        // Test seconds (< 60)
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "Test Pack",
                    bytesDownloaded = 10 * 1024 * 1024,
                    totalBytes = 50 * 1024 * 1024,
                    percentage = 20,
                    eta = 45, // 45 seconds
                    state = DownloadState.Downloading,
                )
            }
        }
        composeTestRule.onNodeWithText("45 sec left").assertIsDisplayed()

        // Test minutes (>= 60)
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "Test Pack",
                    bytesDownloaded = 10 * 1024 * 1024,
                    totalBytes = 50 * 1024 * 1024,
                    percentage = 20,
                    eta = 180, // 3 minutes
                    state = DownloadState.Downloading,
                )
            }
        }
        composeTestRule.onNodeWithText("3 min left").assertIsDisplayed()
    }

    /**
     * AC-7: Progress bar has proper accessibility label
     * GIVEN: Component renders progress bar
     * WHEN: Progress bar is displayed
     * THEN: Progress bar has accessibility label describing percentage
     */
    @Test
    fun testProgressAccessibility() {
        // GIVEN: DownloadProgressIndicator with progress
        // WHEN: Rendered
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "Test Pack",
                    bytesDownloaded = 25 * 1024 * 1024,
                    totalBytes = 50 * 1024 * 1024,
                    percentage = 50,
                    eta = 60,
                    state = DownloadState.Downloading,
                )
            }
        }

        // THEN: Progress bar has accessibility label
        composeTestRule.onNodeWithContentDescription("Download progress: 50%")
            .assertIsDisplayed()
    }

    /**
     * AC-8: Cancel button only shows during downloading state
     * GIVEN: Component has onCancel callback
     * WHEN: State changes between downloading and other states
     * THEN: Cancel button only appears when state is downloading
     */
    @Test
    fun testCancelButtonVisibility() {
        // Test: Cancel button shows when downloading
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "Test Pack",
                    bytesDownloaded = 10 * 1024 * 1024,
                    totalBytes = 50 * 1024 * 1024,
                    percentage = 20,
                    eta = 120,
                    state = DownloadState.Downloading,
                    onCancel = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Cancel Download").assertIsDisplayed()

        // Test: Cancel button does not show when paused
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "Test Pack",
                    bytesDownloaded = 10 * 1024 * 1024,
                    totalBytes = 50 * 1024 * 1024,
                    percentage = 20,
                    eta = null,
                    state = DownloadState.Paused,
                    onCancel = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Cancel Download")
            .assertDoesNotExist()

        // Test: Cancel button does not show when complete
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "Test Pack",
                    bytesDownloaded = 50 * 1024 * 1024,
                    totalBytes = 50 * 1024 * 1024,
                    percentage = 100,
                    eta = null,
                    state = DownloadState.Complete,
                    onCancel = {},
                )
            }
        }
        composeTestRule.onNodeWithText("Cancel Download")
            .assertDoesNotExist()
    }

    /**
     * AC-9: Cancel button does not show when onCancel is null
     * GIVEN: Component is in downloading state but onCancel is null
     * WHEN: Component renders
     * THEN: Cancel button does not appear
     */
    @Test
    fun testCancelButtonWithoutCallback() {
        // GIVEN: DownloadProgressIndicator in downloading state without onCancel
        // WHEN: Rendered
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DownloadProgressIndicator(
                    packName = "Test Pack",
                    bytesDownloaded = 10 * 1024 * 1024,
                    totalBytes = 50 * 1024 * 1024,
                    percentage = 20,
                    eta = 120,
                    state = DownloadState.Downloading,
                    onCancel = null, // No callback
                )
            }
        }

        // THEN: Cancel button does not appear
        composeTestRule.onNodeWithText("Cancel Download")
            .assertDoesNotExist()
    }
}
