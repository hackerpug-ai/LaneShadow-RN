package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.RouteVariant
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSRouteAttachmentCardTest {
    private val source by lazy {
        File("src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt").readText()
    }

    @Test
    fun full_best_selected_variant_keeps_atom_composition_contracts() {
        assertEquals(GeneratedTokens.color.Route.best, resolveRouteAttachmentStripeColor(RouteVariant.Best))
        assertEquals(5, resolveRouteAttachmentScenicDots(5))

        // Composition contract: molecule must compose required atoms, not raw primitives.
        assertTrue(source.contains("LSCard("))
        assertFalse(source.contains("Surface("))
        assertTrue(source.contains("LSBestBadge("))
        assertTrue(source.contains("LSWeatherBadge("))
        assertTrue(source.contains("ScenicDotIcon("))
        assertTrue(source.contains("ScenicDotSize = 6.dp"))
        assertTrue(source.contains("ScenicDotBorderWidth = 1.dp"))
        assertTrue(source.contains("CircleShape"))
        assertTrue(source.contains(".background(GeneratedTokens.color.Signal.default, CircleShape)"))
        assertTrue(source.contains("GeneratedTokens.color.Border.strong"))
    }

    @Test
    fun compact_mode_keeps_layout_contracts_and_badge_gate() {
        assertTrue(source.contains("CompactHorizontalPadding = 12.dp"))
        assertTrue(source.contains("CompactVerticalPadding = 10.dp"))
        assertTrue(source.contains("if (!compact && (route.isBest || route.weatherBadge != null))"))
        assertTrue(source.contains("text = route.via"))
        assertTrue(source.contains("horizontal = horizontalPadding"))
        assertTrue(source.contains("vertical = verticalPadding"))
    }

    @Test
    fun route_variant_stripe_resolves_correct_color() {
        val best = resolveRouteAttachmentStripeColor(RouteVariant.Best)
        val alt1 = resolveRouteAttachmentStripeColor(RouteVariant.Alt1)
        val alt2 = resolveRouteAttachmentStripeColor(RouteVariant.Alt2)

        assertEquals(GeneratedTokens.color.Route.best, best)
        assertEquals(GeneratedTokens.color.Route.alt1, alt1)
        assertEquals(GeneratedTokens.color.Route.alt2, alt2)
        assertNotEquals(best, alt1)
        assertNotEquals(best, alt2)
        assertNotEquals(alt1, alt2)
        assertEquals(5, resolveRouteAttachmentScenicDots(7))
        assertEquals(0, resolveRouteAttachmentScenicDots(-1))
    }
}
