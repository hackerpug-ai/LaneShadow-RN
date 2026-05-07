package com.laneshadow.ui.molecules

import android.os.Build
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.BlurEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.GlassBlurStrategy
import com.laneshadow.ui.atoms.resolveGlassBlurStrategy
import java.util.UUID

const val LS_CONTEXT_CAPSULE_TAG = "ls-context-capsule"
const val LS_CONTEXT_CAPSULE_HEADLINE_TAG = "ls-context-capsule-headline"
const val LS_CONTEXT_CAPSULE_META_ROW_TAG = "ls-context-capsule-meta-row"
const val LS_CONTEXT_CAPSULE_SPINNER_TAG = "ls-context-capsule-spinner"

val LSContextCapsuleBackgroundColorKey = SemanticsPropertyKey<Color>("LSContextCapsuleBackgroundColor")
val LSContextCapsuleBorderColorKey = SemanticsPropertyKey<Color>("LSContextCapsuleBorderColor")
val LSContextCapsuleSavedBorderColorKey = SemanticsPropertyKey<Color>("LSContextCapsuleSavedBorderColor")
val LSContextCapsuleBlurRadiusKey = SemanticsPropertyKey<Dp>("LSContextCapsuleBlurRadius")
val LSContextCapsuleCornerRadiusKey = SemanticsPropertyKey<Dp>("LSContextCapsuleCornerRadius")
val LSContextCapsuleHeadlineAccentColorKey = SemanticsPropertyKey<Color>("LSContextCapsuleHeadlineAccentColor")
val LSContextCapsuleHeadlineAccentTextKey = SemanticsPropertyKey<String>("LSContextCapsuleHeadlineAccentText")
val LSContextCapsuleMetaColorKey = SemanticsPropertyKey<Color>("LSContextCapsuleMetaColor")
val LSContextCapsuleMetaTextStyleKey = SemanticsPropertyKey<String>("LSContextCapsuleMetaTextStyle")
val LSContextCapsuleSpinnerAlphaKey = SemanticsPropertyKey<Float>("LSContextCapsuleSpinnerAlpha")
val LSContextCapsuleReduceMotionKey = SemanticsPropertyKey<Boolean>("LSContextCapsuleReduceMotion")
val LSContextCapsuleSavedKey = SemanticsPropertyKey<Boolean>("LSContextCapsuleSaved")
val LSContextCapsuleInstanceIdKey = SemanticsPropertyKey<String>("LSContextCapsuleInstanceId")

private var SemanticsPropertyReceiver.lsContextCapsuleBackgroundColor by LSContextCapsuleBackgroundColorKey
private var SemanticsPropertyReceiver.lsContextCapsuleBorderColor by LSContextCapsuleBorderColorKey
private var SemanticsPropertyReceiver.lsContextCapsuleSavedBorderColor by LSContextCapsuleSavedBorderColorKey
private var SemanticsPropertyReceiver.lsContextCapsuleBlurRadius by LSContextCapsuleBlurRadiusKey
private var SemanticsPropertyReceiver.lsContextCapsuleCornerRadius by LSContextCapsuleCornerRadiusKey
private var SemanticsPropertyReceiver.lsContextCapsuleHeadlineAccentColor by LSContextCapsuleHeadlineAccentColorKey
private var SemanticsPropertyReceiver.lsContextCapsuleHeadlineAccentText by LSContextCapsuleHeadlineAccentTextKey
private var SemanticsPropertyReceiver.lsContextCapsuleMetaColor by LSContextCapsuleMetaColorKey
private var SemanticsPropertyReceiver.lsContextCapsuleMetaTextStyle by LSContextCapsuleMetaTextStyleKey
private var SemanticsPropertyReceiver.lsContextCapsuleSpinnerAlpha by LSContextCapsuleSpinnerAlphaKey
private var SemanticsPropertyReceiver.lsContextCapsuleReduceMotion by LSContextCapsuleReduceMotionKey
private var SemanticsPropertyReceiver.lsContextCapsuleSaved by LSContextCapsuleSavedKey
private var SemanticsPropertyReceiver.lsContextCapsuleInstanceId by LSContextCapsuleInstanceIdKey

private val CapsuleBlurRadius = 14.dp
private val CapsuleMinWidth = 220.dp
private val CapsuleMaxWidth = 340.dp

@Composable
fun LSContextCapsule(
    state: CapsuleState,
    modifier: Modifier = Modifier,
    reduceMotionOverride: Boolean? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val shape = remember(theme.radius.lg) { RoundedCornerShape(theme.radius.lg) }
    val instanceId = remember { UUID.randomUUID().toString() }
    val backgroundColor = theme.colors.card.default.copy(alpha = 0.72f)
    val borderColor = theme.colors.border.default
    val savedBorderColor = GeneratedTokens.color.Signal.default
    val headlineAccentColor = when (state) {
        is CapsuleState.Route -> theme.content.primary
        is CapsuleState.Idle, is CapsuleState.Planning -> GeneratedTokens.color.Signal.default
    }
    val metaColor = when {
        state.isWarning -> theme.colors.warning.default
        state is CapsuleState.Route -> theme.content.tertiary
        else -> theme.content.secondary
    }
    val metaTextStyleName = if (state is CapsuleState.Route) "Instrument.Sm" else "Ui.Label.Sm"

    ContextCapsuleSurface(
        modifier = modifier
            .testTag(LS_CONTEXT_CAPSULE_TAG)
            .widthIn(min = CapsuleMinWidth, max = CapsuleMaxWidth)
            .defaultMinSize(minHeight = theme.sizing.icon.lg)
            .semantics {
                contentDescription = "Context capsule"
                lsContextCapsuleBackgroundColor = backgroundColor
                lsContextCapsuleBorderColor = borderColor
                lsContextCapsuleSavedBorderColor =
                    if (state.isSaved) savedBorderColor else Color.Transparent
                lsContextCapsuleBlurRadius = CapsuleBlurRadius
                lsContextCapsuleCornerRadius = theme.radius.lg
                lsContextCapsuleHeadlineAccentColor = headlineAccentColor
                lsContextCapsuleHeadlineAccentText = state.emphasizedWord
                lsContextCapsuleMetaColor = metaColor
                lsContextCapsuleMetaTextStyle = metaTextStyleName
                lsContextCapsuleSaved = state.isSaved
                lsContextCapsuleInstanceId = instanceId
            },
        shape = shape,
        backgroundColor = backgroundColor,
        borderColor = borderColor,
        savedBorderColor = if (state.isSaved) savedBorderColor else null,
    ) {
        when (state) {
            is CapsuleState.Idle -> {
                IdleCapsule(
                    state = state,
                    headlineAccentColor = headlineAccentColor,
                    metaColor = metaColor,
                )
            }

            is CapsuleState.Planning -> {
                PlanningCapsule(
                    state = state,
                    headlineAccentColor = headlineAccentColor,
                    reduceMotion = reduceMotionOverride ?: false,
                )
            }

            is CapsuleState.Route -> {
                RouteCapsule(
                    state = state,
                    headlineAccentColor = headlineAccentColor,
                    metaColor = metaColor,
                )
            }
        }
    }
}

@Composable
private fun ContextCapsuleSurface(
    modifier: Modifier,
    shape: RoundedCornerShape,
    backgroundColor: Color,
    borderColor: Color,
    savedBorderColor: Color?,
    content: @Composable () -> Unit,
) {
    val density = LocalDensity.current
    val blurStrategy = remember { resolveGlassBlurStrategy(Build.VERSION.SDK_INT) }
    val blurModifier =
        when (blurStrategy) {
            GlassBlurStrategy.HazeBackdrop -> Modifier
            GlassBlurStrategy.RenderEffect ->
                Modifier.graphicsLayer {
                    val blurRadiusPx = with(density) { CapsuleBlurRadius.toPx() }
                    renderEffect = BlurEffect(
                        radiusX = blurRadiusPx,
                        radiusY = blurRadiusPx,
                        edgeTreatment = TileMode.Decal,
                    )
                }

            GlassBlurStrategy.ModifierBlur -> Modifier.blur(CapsuleBlurRadius)
        }

    Surface(
        modifier = modifier,
        color = Color.Transparent,
        shape = shape,
        shadowElevation = LocalLaneShadowTheme.current.elevation.light.level8,
    ) {
        Box(
            modifier = Modifier
                .clip(shape)
                .then(blurModifier)
                .background(backgroundColor)
                .border(
                    width = GeneratedTokens.sizing.stroke.sm,
                    color = borderColor,
                    shape = shape,
                )
                .then(
                    if (savedBorderColor != null) {
                        Modifier.border(
                            width = GeneratedTokens.sizing.stroke.sm,
                            color = savedBorderColor,
                            shape = shape,
                        )
                    } else {
                        Modifier
                    }
                )
                .fillMaxWidth(),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(
                        horizontal = LocalLaneShadowTheme.current.space.md,
                        vertical = LocalLaneShadowTheme.current.space.sm,
                    ),
            ) {
                content()
            }
        }
    }
}

@Composable
private fun IdleCapsule(
    state: CapsuleState.Idle,
    headlineAccentColor: Color,
    metaColor: Color,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        HeadlineText(
            text = rememberIdleHeadline(state, headlineAccentColor),
            style = theme.typography.opinion.md,
        )
        MetaRow(
            items = state.metaItems,
            color = metaColor,
            textStyle = theme.typography.ui.label.sm,
        )
    }
}

@Composable
private fun PlanningCapsule(
    state: CapsuleState.Planning,
    headlineAccentColor: Color,
    reduceMotion: Boolean,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(theme.space.md),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CapsuleSpinner(
            color = headlineAccentColor,
            reduceMotion = reduceMotion,
        )
        Text(
            text = state.headline,
            style = theme.typography.opinion.sm,
            color = theme.content.primary,
            fontStyle = FontStyle.Italic,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier
                .weight(1f)
                .testTag(LS_CONTEXT_CAPSULE_HEADLINE_TAG),
        )
    }
}

@Composable
private fun RouteCapsule(
    state: CapsuleState.Route,
    headlineAccentColor: Color,
    metaColor: Color,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        HeadlineText(
            text = rememberRouteHeadline(state, headlineAccentColor),
            style = theme.typography.opinion.md,
        )
        MetaRow(
            items = state.metrics,
            color = metaColor,
            textStyle = theme.typography.instrument.sm,
        )
    }
}

@Composable
private fun HeadlineText(
    text: AnnotatedString,
    style: TextStyle,
) {
    val theme = LocalLaneShadowTheme.current

    Text(
        text = text,
        style = style,
        color = theme.content.primary,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = Modifier.testTag(LS_CONTEXT_CAPSULE_HEADLINE_TAG),
    )
}

@Composable
private fun MetaRow(
    items: List<String>,
    color: Color,
    textStyle: TextStyle,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = Modifier.testTag(LS_CONTEXT_CAPSULE_META_ROW_TAG),
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        items.forEachIndexed { index, item ->
            Text(
                text = item,
                style = textStyle,
                color = color,
                maxLines = 1,
            )

            if (index < items.lastIndex) {
                Box(
                    modifier = Modifier
                        .size(theme.space.xs)
                        .background(color.copy(alpha = 0.45f), CircleShape),
                )
            }
        }
    }
}

@Composable
private fun CapsuleSpinner(
    color: Color,
    reduceMotion: Boolean,
) {
    val theme = LocalLaneShadowTheme.current
    val infiniteTransition = rememberInfiniteTransition(label = "ls-context-capsule-spinner")
    val animatedAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1400),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "ls-context-capsule-spinner-alpha",
    )
    val resolvedAlpha = if (reduceMotion) 0.7f else animatedAlpha

    Box(
        modifier = Modifier
            .testTag(LS_CONTEXT_CAPSULE_SPINNER_TAG)
            .size(theme.space.sm)
            .alpha(resolvedAlpha)
            .background(color, CircleShape)
            .semantics {
                lsContextCapsuleSpinnerAlpha = resolvedAlpha
                lsContextCapsuleReduceMotion = reduceMotion
            },
    )
}

@Composable
private fun rememberIdleHeadline(
    state: CapsuleState.Idle,
    headlineAccentColor: Color,
): AnnotatedString =
    remember(state, headlineAccentColor) {
        buildHeadline(
            fullText = state.headline,
            emphasizedText = state.emphasizedWord,
            emphasisColor = headlineAccentColor,
        )
    }

@Composable
private fun rememberRouteHeadline(
    state: CapsuleState.Route,
    headlineAccentColor: Color,
): AnnotatedString =
    remember(state, headlineAccentColor) {
        buildHeadline(
            fullText = state.name,
            emphasizedText = state.emphasizedWord,
            emphasisColor = headlineAccentColor,
        )
    }

private fun buildHeadline(
    fullText: String,
    emphasizedText: String,
    emphasisColor: Color,
): AnnotatedString =
    buildAnnotatedString {
        val startIndex = fullText.indexOf(emphasizedText)
        if (startIndex < 0) {
            append(fullText)
            return@buildAnnotatedString
        }

        append(fullText.substring(0, startIndex))
        withStyle(
            SpanStyle(
                color = emphasisColor,
                fontStyle = FontStyle.Italic,
            ),
        ) {
            append(emphasizedText)
        }
        append(fullText.substring(startIndex + emphasizedText.length))
    }
