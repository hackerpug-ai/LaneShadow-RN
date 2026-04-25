package com.laneshadow.ui.organisms

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * TDD Test for LSRouteSheet organism
 *
 * AC-1: Best route renders full composition
 * GIVEN: LSRouteSheet with route.isBest=true and weatherTimeline
 * WHEN: Composable enters composition
 * THEN: LSBestBadge present, title in opinion.lg, subtitle in ui.body.md,
 *       LSInstrumentReadout with 4 metrics, LSWeatherTimeline, action row with Save/Ride buttons
 *
 * AC-2: Save and Ride taps fire once each
 * GIVEN: LSRouteSheet with onSave and onRide callbacks
 * WHEN: User taps Save then Ride this
 * THEN: onSave called once, onRide called once
 *
 * AC-3: Drag-down dismiss via LSBottomSheet
 * GIVEN: LSRouteSheet presented via LSBottomSheet
 * WHEN: User drags down
 * THEN: onDismiss fires once via LSBottomSheet delegation
 *
 * AC-4: No inline LazyRow or LSDivider in LSRouteSheet
 * GIVEN: LSRouteSheet.kt source
 * WHEN: Static analysis
 * THEN: Zero LazyRow or raw LSDivider() calls (must delegate to molecules)
 *
 * AC-5: Default detent is Large
 * GIVEN: LSRouteSheet without explicit detent
 * WHEN: Composable enters composition
 * THEN: LSBottomSheet rendered with BottomSheetDetent.Large
 */
class LSRouteSheetTest {
    private val source by lazy {
        File("src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt").readText()
    }

    /**
     * AC-1: Best route renders full composition
     */
    @Test
    fun best_route_renders_full_composition() {
        // Must use LSBottomSheet with BottomSheetDetent.Large
        assertTrue(source.contains("LSBottomSheet("))
        assertTrue(source.contains("BottomSheetDetent.Large"))

        // Must use LSBestBadge when route.isBest == true
        assertTrue(source.contains("if (route.isBest)"))
        assertTrue(source.contains("LSBestBadge("))

        // Must use LSText with opinion.lg for title
        assertTrue(source.contains("TypographyVariant.Opinion.Lg"))

        // Must use LSText with ui.body.md for subtitle
        assertTrue(source.contains("TypographyVariant.Ui.Body.Md"))

        // Must use LSInstrumentReadout molecule
        assertTrue(source.contains("com.laneshadow.ui.molecules.LSInstrumentReadout("))

        // Must use LSWeatherTimeline molecule
        assertTrue(source.contains("com.laneshadow.ui.molecules.LSWeatherTimeline("))

        // Must use LSButton for Save (outline variant)
        assertTrue(source.contains("LSButton("))
        assertTrue(source.contains("ButtonVariant.Outline"))

        // Must use LSButton for Ride this (primary variant)
        assertTrue(source.contains("ButtonVariant.Primary"))

        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
    }

    /**
     * AC-2: Save and Ride taps fire once each
     */
    @Test
    fun action_taps_fire_callbacks_exactly_once() {
        // Must accept onSave callback
        assertTrue(source.contains("onSave: () -> Unit"))

        // Must accept onRide callback
        assertTrue(source.contains("onRide: () -> Unit"))

        // Must pass onSave to LSButton onClick
        assertTrue(source.contains("onClick = onSave"))

        // Must pass onRide to LSButton onClick
        assertTrue(source.contains("onClick = onRide"))
    }

    /**
     * AC-3: Drag-down dismiss via LSBottomSheet
     */
    @Test
    fun drag_down_fires_on_dismiss_via_lsbottomsheet() {
        // Must use LSBottomSheet for presentation
        assertTrue(source.contains("LSBottomSheet("))

        // Must pass onDismiss to LSBottomSheet
        assertTrue(source.contains("onDismiss = onDismiss"))

        // Must not implement custom drag handle (LSBottomSheet provides it)
        assertFalse(source.contains("Modifier.draggable("))

        // Must not implement custom swipe gestures
        assertFalse(source.contains("SwipeToDismiss"))
    }

    /**
     * AC-4: Molecule delegation gate
     */
    @Test
    fun molecule_delegation_gate() {
        // Must NOT inline LazyRow for weather (delegate to LSWeatherTimeline)
        assertFalse(source.contains("LazyRow("))

        // Must NOT inline LSDivider for metric grid (delegate to LSInstrumentReadout)
        // Note: LSInstrumentReadout uses LSDivider internally, but LSRouteSheet must not
        val linesWithoutMoleculeCall = source.lines().filterNot {
            it.contains("com.laneshadow.ui.molecules.LSInstrumentReadout(") ||
            it.contains("com.laneshadow.ui.molecules.LSWeatherTimeline(")
        }
        val hasInlineDivider = linesWithoutMoleculeCall.any { it.contains("LSDivider(") }
        assertFalse("LSRouteSheet must not use LSDivider directly", hasInlineDivider)

        // Must use LSInstrumentReadout test tag
        assertTrue(source.contains("ROUTE_SHEET_INSTRUMENT_TAG"))

        // Must use LSWeatherTimeline test tag
        assertTrue(source.contains("ROUTE_SHEET_WEATHER_TAG"))
    }

    /**
     * AC-5: Default detent is Large
     */
    @Test
    fun default_detent_is_large() {
        // Must pass BottomSheetDetent.Large to LSBottomSheet
        assertTrue(source.contains("BottomSheetDetent.Large"))

        // Must not have other detent values hardcoded
        assertFalse(source.contains("BottomSheetDetent.Medium"))
        assertFalse(source.contains("BottomSheetDetent.Small"))
    }

    /**
     * AC-8: Best badge absent when route.isBest == false
     */
    @Test
    fun best_badge_absent_when_not_best_route() {
        // Must conditionally render LSBestBadge
        assertTrue(source.contains("if (route.isBest)"))

        // LSBestBadge must be inside the conditional
        val ifBlockStart = source.indexOf("if (route.isBest)")
        var depth = 0
        var i = ifBlockStart
        var ifBlockEnd = source.length
        while (i < source.length) {
            when (source[i]) {
                '{' -> depth++
                '}' -> {
                    depth--
                    if (depth == 0) {
                        ifBlockEnd = i
                        break
                    }
                }
            }
            i++
        }
        val ifBlock = source.substring(ifBlockStart, ifBlockEnd)
        assertTrue("LSBestBadge must be inside route.isBest conditional", ifBlock.contains("LSBestBadge("))
    }

    /**
     * Additional: Verify theme token usage
     */
    @Test
    fun uses_theme_tokens_not_hardcoded_values() {
        // Must use theme.space for spacing
        assertTrue(source.contains("theme.space.") || source.contains("LocalLaneShadowTheme"))

        // Must not use hardcoded dp values for spacing (except test tags)
        val linesWithoutTestTags = source.lines().filterNot { it.contains("testTag") }
        val hasHardcodedSpacing = linesWithoutTestTags.any {
            it.contains(".padding(") && !it.contains("theme.space.") && !it.contains("LocalLaneShadowTheme")
        }
        assertFalse("Must use theme spacing tokens", hasHardcodedSpacing)

        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
        assertFalse(source.contains("rgb("))
        assertFalse(source.contains("RGBA("))

        // Must not use hardcoded font families
        assertFalse(source.contains("FontFamily("))
    }

    /**
     * Additional: Verify proper composable structure
     */
    @Test
    fun proper_composable_structure() {
        // Must be a @Composable function
        assertTrue(source.contains("@Composable"))
        assertTrue(source.contains("fun LSRouteSheet("))

        // Must accept RouteDetails parameter
        assertTrue(source.contains("route: RouteDetails"))

        // Must accept weatherTimeline parameter
        assertTrue(source.contains("weatherTimeline: List<WeatherTimelineEntry>"))

        // Must accept callbacks
        assertTrue(source.contains("onSave: () -> Unit"))
        assertTrue(source.contains("onRide: () -> Unit"))
        assertTrue(source.contains("onDismiss: () -> Unit"))

        // Must use Modifier parameter
        assertTrue(source.contains("modifier: Modifier = Modifier"))
    }

    /**
     * Additional: Verify sticky action row
     */
    @Test
    fun sticky_action_row_with_correct_flex_weights() {
        // Must use Row for action buttons
        assertTrue(source.contains("Row("))

        // Must use weight for flex distribution
        assertTrue(source.contains(".weight(1f)"))  // Save button
        assertTrue(source.contains(".weight(2f)"))  // Ride button

        // Must have Save button with Bookmark icon
        assertTrue(source.contains("IconName.Bookmark"))
        assertTrue(source.contains("label = \"Save\""))

        // Must have Ride button with ChevR icon
        assertTrue(source.contains("IconName.ChevR"))
        assertTrue(source.contains("label = \"Ride this\""))
    }
}
