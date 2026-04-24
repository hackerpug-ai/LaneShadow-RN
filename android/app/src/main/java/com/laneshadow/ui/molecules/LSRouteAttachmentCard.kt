package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isContainer
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSBestBadge
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.atoms.TypographyVariant

const val LSRouteAttachmentCardTag = "ls-route-attachment-card"
const val LSRouteAttachmentCardStripeTag = "ls-route-attachment-card-stripe"
const val LSRouteAttachmentCardBestBadgeTag = "ls-route-attachment-card-best-badge"
const val LSRouteAttachmentCardWeatherBadgeTag = "ls-route-attachment-card-weather-badge"
const val LSRouteAttachmentCardFavoriteTag = "ls-route-attachment-card-favorite-row"

val LSRouteAttachmentCardBackgroundColorKey = SemanticsPropertyKey<Color>("LSRouteAttachmentCardBackgroundColor")
val LSRouteAttachmentCardBorderColorKey = SemanticsPropertyKey<Color>("LSRouteAttachmentCardBorderColor")
val LSRouteAttachmentCardStripeColorKey = SemanticsPropertyKey<Color>("LSRouteAttachmentCardStripeColor")
val LSRouteAttachmentCardStripeWidthKey = SemanticsPropertyKey<Dp>("LSRouteAttachmentCardStripeWidth")
val LSRouteAttachmentCardHorizontalPaddingKey = SemanticsPropertyKey<Dp>("LSRouteAttachmentCardHorizontalPadding")
val LSRouteAttachmentCardVerticalPaddingKey = SemanticsPropertyKey<Dp>("LSRouteAttachmentCardVerticalPadding")
val LSRouteAttachmentCardScenicFilledDotsKey = SemanticsPropertyKey<Int>("LSRouteAttachmentCardScenicFilledDots")

private var SemanticsPropertyReceiver.lsRouteAttachmentCardBackgroundColor by LSRouteAttachmentCardBackgroundColorKey
private var SemanticsPropertyReceiver.lsRouteAttachmentCardBorderColor by LSRouteAttachmentCardBorderColorKey
private var SemanticsPropertyReceiver.lsRouteAttachmentCardStripeColor by LSRouteAttachmentCardStripeColorKey
private var SemanticsPropertyReceiver.lsRouteAttachmentCardStripeWidth by LSRouteAttachmentCardStripeWidthKey
private var SemanticsPropertyReceiver.lsRouteAttachmentCardHorizontalPadding by LSRouteAttachmentCardHorizontalPaddingKey
private var SemanticsPropertyReceiver.lsRouteAttachmentCardVerticalPadding by LSRouteAttachmentCardVerticalPaddingKey
private var SemanticsPropertyReceiver.lsRouteAttachmentCardScenicFilledDots by LSRouteAttachmentCardScenicFilledDotsKey

private val RouteStripeWidth = 3.dp
private val CompactHorizontalPadding = 12.dp
private val CompactVerticalPadding = 10.dp
private val ScenicDotSize = 6.dp
private val ScenicDotBorderWidth = 1.dp
private const val ScenicDotCount = 5

data class RouteAttachmentWeather(
    val condition: WeatherCondition,
    val label: String,
)

data class RouteAttachment(
    val id: String,
    val title: String,
    val via: String,
    val distance: String,
    val duration: String,
    val scenicScore: Int,
    val variant: RouteVariant,
    val weatherBadge: RouteAttachmentWeather? = null,
    val isBest: Boolean = false,
    val includesFavorite: Boolean = false,
    val favoriteLabel: String = "INCLUDES SUNSET CLIMB",
)

@Composable
fun LSRouteAttachmentCard(
    route: RouteAttachment,
    selected: Boolean = false,
    compact: Boolean = false,
    onTap: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val stripeColor = resolveRouteAttachmentStripeColor(route.variant)
    val borderColor = if (selected) GeneratedTokens.color.Signal.default else theme.colors.border.default
    val horizontalPadding = if (compact) CompactHorizontalPadding else theme.space.lg
    val verticalPadding = if (compact) CompactVerticalPadding else theme.space.md
    val scenicFilledDots = resolveRouteAttachmentScenicDots(route.scenicScore)
    val shape = RoundedCornerShape(theme.radius.md)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .semantics {
                isContainer = true
                lsRouteAttachmentCardBackgroundColor = theme.colors.card.default
                lsRouteAttachmentCardBorderColor = borderColor
                lsRouteAttachmentCardStripeColor = stripeColor
                lsRouteAttachmentCardStripeWidth = RouteStripeWidth
                lsRouteAttachmentCardHorizontalPadding = horizontalPadding
                lsRouteAttachmentCardVerticalPadding = verticalPadding
                lsRouteAttachmentCardScenicFilledDots = scenicFilledDots
                if (onTap != null) {
                    role = Role.Button
                    contentDescription = "${route.title} route card"
                }
            }
            .then(
                if (onTap != null) {
                    Modifier.clickable(onClick = onTap)
                } else {
                    Modifier
                },
            ),
        color = theme.colors.card.default,
        shape = shape,
        border = BorderStroke(1.dp, borderColor),
        shadowElevation = theme.elevation.light.level2,
    ) {
        Row {
            Box(
                modifier = Modifier
                    .width(RouteStripeWidth)
                    .fillMaxHeight()
                    .background(stripeColor)
                    .testTag(LSRouteAttachmentCardStripeTag),
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(
                        horizontal = horizontalPadding,
                        vertical = verticalPadding,
                    ),
                verticalArrangement = Arrangement.spacedBy(theme.space.sm),
            ) {
                if (!compact && (route.isBest || route.weatherBadge != null)) {
                    Box(modifier = Modifier.fillMaxWidth()) {
                        if (route.isBest) {
                            LSBestBadge(
                                modifier = Modifier
                                    .align(Alignment.CenterStart)
                                    .testTag(LSRouteAttachmentCardBestBadgeTag),
                            )
                        }

                        route.weatherBadge?.let { weather ->
                            LSWeatherBadge(
                                condition = weather.condition,
                                label = weather.label,
                                modifier = Modifier
                                    .align(Alignment.CenterEnd)
                                    .testTag(LSRouteAttachmentCardWeatherBadgeTag),
                            )
                        }
                    }
                }

                LSText(
                    text = route.title,
                    variant = TypographyVariant.Ui.Title.Md,
                )

                LSText(
                    text = route.via,
                    variant = TypographyVariant.Ui.Body.Sm,
                    color = ContentColor.Secondary,
                )

                Row(
                    horizontalArrangement = Arrangement.spacedBy(theme.space.md),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    MetricLabel(text = route.distance)
                    MetricLabel(text = route.duration)
                    ScenicMeter(filledDots = scenicFilledDots)
                }

                if (route.includesFavorite) {
                    Row(
                        modifier = Modifier.testTag(LSRouteAttachmentCardFavoriteTag),
                        horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        LSIcon(
                            name = GeneratedTokens.IconName.HeartFill,
                            size = IconSize.Xs,
                            color = IconColor.Signal,
                        )
                        LSText(
                            text = route.favoriteLabel,
                            variant = TypographyVariant.Ui.Label.Sm,
                            color = ContentColor.Signal,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MetricLabel(text: String) {
    LSText(
        text = text,
        variant = TypographyVariant.Instrument.Sm,
    )
}

@Composable
private fun ScenicMeter(filledDots: Int) {
    val theme = LocalLaneShadowTheme.current

    Row(
        horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(ScenicDotCount) { index ->
            val isFilled = index < filledDots
            Box(
                modifier = Modifier
                    .size(ScenicDotSize)
                    .then(
                        if (isFilled) {
                            Modifier.background(GeneratedTokens.color.Signal.default, CircleShape)
                        } else {
                            Modifier.border(
                                ScenicDotBorderWidth,
                                GeneratedTokens.color.Border.strong,
                                CircleShape,
                            )
                        },
                    ),
            )
        }

        LSText(
            text = "SCENIC",
            variant = TypographyVariant.Ui.Label.Sm,
            color = ContentColor.Tertiary,
        )
    }
}

fun resolveRouteAttachmentStripeColor(variant: RouteVariant): Color =
    when (variant) {
        RouteVariant.Best -> GeneratedTokens.color.Route.best
        RouteVariant.Alt1 -> GeneratedTokens.color.Route.alt1
        RouteVariant.Alt2 -> GeneratedTokens.color.Route.alt2
        is RouteVariant.Custom -> GeneratedTokens.color.Route.best
    }

fun resolveRouteAttachmentScenicDots(scenicScore: Int): Int = scenicScore.coerceIn(0, ScenicDotCount)
