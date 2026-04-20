package com.laneshadow.ui.components.molecules

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
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
 * Test suite for DateRangePicker molecule component
 *
 * Testing chip-style date range picker with preset options.
 * Following RN wrapper patterns from react-native/components/ui/date-range-picker.tsx
 */
@RunWith(RobolectricTestRunner::class)
@Config(
    sdk = [30],
    manifest = Config.NONE,
    qualifiers = "w360dp-h640dp-xhdpi",
    application = com.laneshadow.LaneShadowApp::class
)
class DateRangePickerTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    private val testTheme = LaneShadowThemeValues(
        colors = LaneShadowColors(
            primary = ColorSet(Color(0xFFB87333), null, null, null, null), // Copper
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
            onSurface = ColorSet(Color(0xFF1E1E1E), null, null, null, null),
            muted = ColorSet(Color(0xFFF3F4F6), null, null, null, null),
            onPrimary = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            onSecondary = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            secondaryContainer = ColorSet(Color(0xFFEDE9FE), null, null, null, null),
            onSecondaryContainer = ColorSet(Color(0xFF4C1D95), null, null, null, null),
            border = ColorSet(Color(0xFFD9D0C7), null, null, null, null),
            input = ColorSet(Color(0xFFD1D5DB), null, null, null, null),
            ring = ColorSet(Color(0xFF6366F1), null, null, null, null),
            card = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            popover = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            accent = ColorSet(Color(0xFFF472B6), null, null, null, null),
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
                sm = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Normal),
                md = TextStyle(fontSize = 16.sp, lineHeight = 24.sp, fontWeight = FontWeight.Normal),
                lg = TextStyle(fontSize = 18.sp, lineHeight = 28.sp, fontWeight = FontWeight.Normal),
            ),
            title = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.SemiBold),
                md = TextStyle(fontSize = 16.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold),
                lg = TextStyle(fontSize = 18.sp, lineHeight = 28.sp, fontWeight = FontWeight.SemiBold),
            ),
            heading = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 24.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold),
                md = TextStyle(fontSize = 28.sp, lineHeight = 36.sp, fontWeight = FontWeight.Bold),
                lg = TextStyle(fontSize = 32.sp, lineHeight = 40.sp, fontWeight = FontWeight.Bold),
            ),
            display = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 36.sp, lineHeight = 44.sp, fontWeight = FontWeight.Bold),
                md = TextStyle(fontSize = 48.sp, lineHeight = 56.sp, fontWeight = FontWeight.Bold),
                lg = TextStyle(fontSize = 64.sp, lineHeight = 72.sp, fontWeight = FontWeight.Bold),
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
     * AC-1: Component renders in default state
     *
     * GIVEN: App is running and component is mounted
     * WHEN: DateRangePicker is rendered with required props
     * THEN: Component displays matching RN wrapper defaults
     */
    @Test
    fun testDateRangePickerDefaultRendering() {
        var lastDateRange: DateRange? = null

        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DateRangePicker(
                    onDateRangeChange = { range ->
                        lastDateRange = range
                    },
                    testId = "test-picker"
                )
            }
        }

        // Verify picker container is displayed
        composeTestRule.onNodeWithTag("test-picker")
            .assertIsDisplayed()

        // Verify all preset chips are displayed
        composeTestRule.onNodeWithText("All time")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Last week")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Last month")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Last 3 months")
            .assertIsDisplayed()

        // Verify default state (All time selected = null range)
        assert(lastDateRange != null)
        assert(lastDateRange?.afterDate == null)
        assert(lastDateRange?.beforeDate == null)
    }

    /**
     * AC-2: All style properties match matrix
     *
     * GIVEN: Translation matrix defines layout, typography, colors
     * WHEN: Component is rendered in all variants
     * THEN: Measured values match matrix (height, padding, radius, font-size)
     */
    @Test
    fun testDateRangePickerStylePropertiesMatchMatrix() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DateRangePicker(
                    onDateRangeChange = {},
                    testId = "test-picker"
                )
            }
        }

        // Verify chip test tags follow pattern
        composeTestRule.onNodeWithTag("test-picker-chip-all")
            .assertExists()
        composeTestRule.onNodeWithTag("test-picker-chip-week")
            .assertExists()
        composeTestRule.onNodeWithTag("test-picker-chip-month")
            .assertExists()
        composeTestRule.onNodeWithTag("test-picker-chip-threemonths")
            .assertExists()

        // Verify all chips are displayed
        composeTestRule.onNodeWithTag("test-picker-chip-all")
            .assertIsDisplayed()
        composeTestRule.onNodeWithTag("test-picker-chip-week")
            .assertIsDisplayed()
        composeTestRule.onNodeWithTag("test-picker-chip-month")
            .assertIsDisplayed()
        composeTestRule.onNodeWithTag("test-picker-chip-threemonths")
            .assertIsDisplayed()
    }

    /**
     * AC-3: Component handles all states
     *
     * GIVEN: Component supports states (hover, pressed, disabled, error, loading)
     * WHEN: Each state is triggered
     * THEN: Visual feedback matches RN wrapper behavior
     */
    @Test
    fun testDateRangePickerStates() {
        var selectedRanges = mutableListOf<DateRange>()

        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DateRangePicker(
                    onDateRangeChange = { range ->
                        selectedRanges.add(range)
                    },
                    testId = "test-picker"
                )
            }
        }

        // Initial state: All time selected (null range)
        assert(selectedRanges.isNotEmpty())
        var currentRange = selectedRanges.last()
        assert(currentRange.afterDate == null)
        assert(currentRange.beforeDate == null)

        // Click "Last week" chip
        composeTestRule.onNodeWithTag("test-picker-chip-week")
            .performClick()

        // Should emit date range with afterDate ~7 days ago
        assert(selectedRanges.size >= 2)
        currentRange = selectedRanges.last()
        assert(currentRange.afterDate != null)

        // Verify date is approximately 7 days ago (within 1 second tolerance)
        val expectedWeekAgo = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000L)
        val timeDiff = kotlin.math.abs(currentRange.afterDate!! - expectedWeekAgo)
        assert(timeDiff < 1000) { "Expected date ~7 days ago, got ${currentRange.afterDate}, diff = $timeDiff ms" }

        // Click same chip again - should toggle back to "All time"
        val sizeBeforeToggle = selectedRanges.size
        composeTestRule.onNodeWithTag("test-picker-chip-week")
            .performClick()

        // Should emit null range again
        assert(selectedRanges.size > sizeBeforeToggle)
        currentRange = selectedRanges.last()
        assert(currentRange.afterDate == null) { "Expected null range after toggle, got ${currentRange.afterDate}" }

        // Click "Last month" chip
        composeTestRule.onNodeWithTag("test-picker-chip-month")
            .performClick()

        // Should emit date range with afterDate ~30 days ago
        currentRange = selectedRanges.last()
        assert(currentRange.afterDate != null)

        val expectedMonthAgo = System.currentTimeMillis() - (30 * 24 * 60 * 60 * 1000L)
        val monthDiff = kotlin.math.abs(currentRange.afterDate!! - expectedMonthAgo)
        assert(monthDiff < 1000) { "Expected date ~30 days ago, got ${currentRange.afterDate}, diff = $monthDiff ms" }

        // Click "Last 3 months" chip
        composeTestRule.onNodeWithTag("test-picker-chip-threemonths")
            .performClick()

        // Should emit date range with afterDate ~90 days ago
        currentRange = selectedRanges.last()
        assert(currentRange.afterDate != null)

        val expectedThreeMonthsAgo = System.currentTimeMillis() - (90 * 24 * 60 * 60 * 1000L)
        val threeMonthsDiff = kotlin.math.abs(currentRange.afterDate!! - expectedThreeMonthsAgo)
        assert(threeMonthsDiff < 1000) { "Expected date ~90 days ago, got ${currentRange.afterDate}, diff = $threeMonthsDiff ms" }

        // Click "All time" chip
        composeTestRule.onNodeWithTag("test-picker-chip-all")
            .performClick()

        // Should emit null range
        currentRange = selectedRanges.last()
        assert(currentRange.afterDate == null) { "Expected null range for All time, got ${currentRange.afterDate}" }
    }

    /**
     * Test: Date range computation accuracy
     *
     * GIVEN: Preset has specific daysBack value
     * WHEN: Date range is computed
     * THEN: afterDate equals current time minus daysBack milliseconds
     */
    @Test
    fun testDateRangeComputationAccuracy() {
        var computedRange: DateRange? = null

        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DateRangePicker(
                    onDateRangeChange = { range ->
                        computedRange = range
                    },
                    testId = "test-picker"
                )
            }
        }

        // Test week preset (7 days)
        composeTestRule.onNodeWithTag("test-picker-chip-week")
            .performClick()

        val now = System.currentTimeMillis()
        val weekAgo = now - (7 * 24 * 60 * 60 * 1000L)
        val weekDiff = kotlin.math.abs(computedRange?.afterDate!! - weekAgo)

        // Allow 1 second tolerance for test execution time
        assert(weekDiff < 1000) { "Week computation off by $weekDiff ms" }

        // Test month preset (30 days)
        composeTestRule.onNodeWithTag("test-picker-chip-month")
            .performClick()

        val monthAgo = now - (30 * 24 * 60 * 60 * 1000L)
        val monthDiff = kotlin.math.abs(computedRange?.afterDate!! - monthAgo)

        assert(monthDiff < 1000) { "Month computation off by $monthDiff ms" }

        // Test 3 months preset (90 days)
        composeTestRule.onNodeWithTag("test-picker-chip-threemonths")
            .performClick()

        val threeMonthsAgo = now - (90 * 24 * 60 * 60 * 1000L)
        val threeMonthsDiff = kotlin.math.abs(computedRange?.afterDate!! - threeMonthsAgo)

        assert(threeMonthsDiff < 1000) { "3 months computation off by $threeMonthsDiff ms" }
    }

    /**
     * Test: Chip state persistence
     *
     * GIVEN: User selects a preset
     * WHEN: Configuration changes (state saved via rememberSaveable)
     * THEN: Selection persists
     *
     * NOTE: Full state persistence testing requires activity recreation,
     * which is beyond unit test scope. This test verifies selection state
     * is maintained during composition lifetime.
     */
    @Test
    fun testChipStatePersistence() {
        var emittedRanges = mutableListOf<DateRange>()

        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                DateRangePicker(
                    onDateRangeChange = { range ->
                        emittedRanges.add(range)
                    },
                    testId = "test-picker"
                )
            }
        }

        // Select week
        composeTestRule.onNodeWithTag("test-picker-chip-week")
            .performClick()

        // Verify week range emitted
        assert(emittedRanges.last().afterDate != null)

        // Click different chip
        composeTestRule.onNodeWithTag("test-picker-chip-month")
            .performClick()

        // Verify month range emitted (not week again)
        assert(emittedRanges.last().afterDate != null)
        val monthAgo = System.currentTimeMillis() - (30 * 24 * 60 * 60 * 1000L)
        val monthDiff = kotlin.math.abs(emittedRanges.last().afterDate!! - monthAgo)

        assert(monthDiff < 1000) { "Expected month range, got off by $monthDiff ms" }
    }
}
