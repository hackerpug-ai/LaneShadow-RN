package com.laneshadow.ui.atoms

import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.BlurEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.isContainer
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
val LSGlassPanelBackgroundColorKey = SemanticsPropertyKey<Color>("LSGlassPanelBackgroundColor")
val LSGlassPanelCornerRadiusKey = SemanticsPropertyKey<Dp>("LSGlassPanelCornerRadius")
val LSGlassPanelShadowElevationKey = SemanticsPropertyKey<Dp>("LSGlassPanelShadowElevation")
val LSGlassPanelContentPaddingKey = SemanticsPropertyKey<Dp>("LSGlassPanelContentPadding")
val LSGlassPanelBlurRadiusKey = SemanticsPropertyKey<Dp>("LSGlassPanelBlurRadius")
val LSGlassPanelBlurStrategyKey = SemanticsPropertyKey<String>("LSGlassPanelBlurStrategy")
val LSGlassPanelLeadingStripeWidthKey = SemanticsPropertyKey<Dp>("LSGlassPanelLeadingStripeWidth")
val LSGlassPanelLeadingStripeColorKey = SemanticsPropertyKey<Color>("LSGlassPanelLeadingStripeColor")

private var SemanticsPropertyReceiver.lsGlassPanelBackgroundColor by LSGlassPanelBackgroundColorKey
private var SemanticsPropertyReceiver.lsGlassPanelCornerRadius by LSGlassPanelCornerRadiusKey
private var SemanticsPropertyReceiver.lsGlassPanelShadowElevation by LSGlassPanelShadowElevationKey
private var SemanticsPropertyReceiver.lsGlassPanelContentPadding by LSGlassPanelContentPaddingKey
private var SemanticsPropertyReceiver.lsGlassPanelBlurRadius by LSGlassPanelBlurRadiusKey
private var SemanticsPropertyReceiver.lsGlassPanelBlurStrategy by LSGlassPanelBlurStrategyKey
private var SemanticsPropertyReceiver.lsGlassPanelLeadingStripeWidth by LSGlassPanelLeadingStripeWidthKey
private var SemanticsPropertyReceiver.lsGlassPanelLeadingStripeColor by LSGlassPanelLeadingStripeColorKey

enum class GlassBlurStrategy {
    RenderEffect,
    ModifierBlur,
}

data class LSGlassPanelStyle(
    val backgroundColor: Color,
    val cornerRadius: Dp,
    val shadowElevation: Dp,
    val contentPadding: Dp,
    val blurRadius: Dp,
    val blurStrategy: GlassBlurStrategy,
    val leadingStripeWidth: Dp,
    val leadingStripeColor: Color,
)

fun resolveGlassBlurStrategy(sdkInt: Int): GlassBlurStrategy =
    if (sdkInt >= Build.VERSION_CODES.S) {
        GlassBlurStrategy.RenderEffect
    } else {
        GlassBlurStrategy.ModifierBlur
    }

fun resolveLSGlassPanelStyle(
    theme: LaneShadowThemeValues,
    variant: GlassVariant,
    sdkInt: Int = Build.VERSION.SDK_INT,
): LSGlassPanelStyle {
    val stripeWidth = if (variant is GlassVariant.Callout) 3.dp else 0.dp
    val stripeColor = if (variant is GlassVariant.Callout) resolveAccentColor(theme, variant.accent) else Color.Transparent

    return LSGlassPanelStyle(
        backgroundColor = theme.colors.card.default.copy(alpha = 0.72f),
        cornerRadius = theme.radius.xl,
        shadowElevation = theme.elevation.light.level8,
        contentPadding = theme.space.lg,
        blurRadius = 13.dp,
        blurStrategy = resolveGlassBlurStrategy(sdkInt),
        leadingStripeWidth = stripeWidth,
        leadingStripeColor = stripeColor,
    )
}

@Composable
fun LSGlassPanel(
    variant: GlassVariant = GlassVariant.Chrome,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val style = resolveLSGlassPanelStyle(theme, variant)
    val shape = RoundedCornerShape(style.cornerRadius)
    val density = LocalDensity.current

    Surface(
        modifier = modifier.semantics {
            isContainer = true
            lsGlassPanelBackgroundColor = style.backgroundColor
            lsGlassPanelCornerRadius = style.cornerRadius
            lsGlassPanelShadowElevation = style.shadowElevation
            lsGlassPanelContentPadding = style.contentPadding
            lsGlassPanelBlurRadius = style.blurRadius
            lsGlassPanelBlurStrategy = style.blurStrategy.name
            lsGlassPanelLeadingStripeWidth = style.leadingStripeWidth
            lsGlassPanelLeadingStripeColor = style.leadingStripeColor
        },
        color = Color.Transparent,
        shape = shape,
        shadowElevation = style.shadowElevation,
    ) {
        Box(modifier = Modifier.clip(shape)) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .then(
                        when (style.blurStrategy) {
                            GlassBlurStrategy.RenderEffect ->
                                Modifier.graphicsLayer {
                                    val blurRadiusPx = with(density) { style.blurRadius.toPx() }
                                    renderEffect = BlurEffect(
                                        radiusX = blurRadiusPx,
                                        radiusY = blurRadiusPx,
                                        edgeTreatment = TileMode.Decal,
                                    )
                                }

                            GlassBlurStrategy.ModifierBlur -> Modifier.blur(style.blurRadius)
                        },
                    )
                    .background(style.backgroundColor),
            )

            if (variant is GlassVariant.Callout) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .width(style.leadingStripeWidth)
                        .align(Alignment.CenterStart)
                        .background(style.leadingStripeColor),
                )
            }

            Box(
                modifier = Modifier.padding(
                    start = style.contentPadding + style.leadingStripeWidth,
                    top = style.contentPadding,
                    end = style.contentPadding,
                    bottom = style.contentPadding,
                ),
            ) {
                content()
            }
        }
    }
}
