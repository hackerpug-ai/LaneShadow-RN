package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.RouteVariant
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LSRouteAttachmentCardTest {
    @Test
    fun full_best_selected_variant_renders_all_slots() {
        val source = File("src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt").readText()

        assertEquals(GeneratedTokens.color.Route.best, resolveRouteAttachmentStripeColor(RouteVariant.Best))
        assertEquals(5, resolveRouteAttachmentScenicDots(5))
        assertTrue(source.contains("RouteStripeWidth = 3.dp"))
        assertTrue(source.contains("GeneratedTokens.color.Signal.default"))
        assertTrue(source.contains("LSBestBadge("))
        assertTrue(source.contains("LSWeatherBadge("))
        assertTrue(source.contains("TypographyVariant.Ui.Title.Md"))
        assertTrue(source.contains("TypographyVariant.Ui.Body.Sm"))
        assertTrue(source.contains("TypographyVariant.Instrument.Sm"))
        assertTrue(source.contains("repeat(ScenicDotCount)"))
        assertTrue(source.contains("CircleShape"))
    }

    @Test
    fun compact_mode_suppresses_best_badge_and_weather_badge() {
        val source = File("src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt").readText()

        assertTrue(source.contains("CompactHorizontalPadding = 12.dp"))
        assertTrue(source.contains("CompactVerticalPadding = 10.dp"))
        assertTrue(source.contains("if (!compact && (route.isBest || route.weatherBadge != null))"))
        assertTrue(source.contains("text = route.via"))
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
