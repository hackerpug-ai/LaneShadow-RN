package com.laneshadow.ui.molecules

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.LSGlassPanel
import com.laneshadow.ui.atoms.resolvedScrimColor

const val LSBottomSheetTag = "ls-bottom-sheet"
const val LSBottomSheetSurfaceTag = "ls-bottom-sheet-surface"
const val LSBottomSheetHandleTag = "ls-bottom-sheet-handle"
internal const val BottomSheetEnterRecipePath = "motion.recipe.chatOverlayEnter"
internal const val BottomSheetDetentSmallFraction = 0.25f
internal const val BottomSheetDetentMediumFraction = 0.5f
internal const val BottomSheetDetentLargeFraction = 0.9f
private val BottomSheetHandleWidth = 36.dp
private val BottomSheetHandleHeight = 4.dp

val LSBottomSheetSurfaceColorKey = SemanticsPropertyKey<Color>("LSBottomSheetSurfaceColor")
val LSBottomSheetDetentHeightKey = SemanticsPropertyKey<Dp>("LSBottomSheetDetentHeight")
val LSBottomSheetDetentFractionKey = SemanticsPropertyKey<Float>("LSBottomSheetDetentFraction")
val LSBottomSheetHandleWidthKey = SemanticsPropertyKey<Dp>("LSBottomSheetHandleWidth")
val LSBottomSheetHandleColorKey = SemanticsPropertyKey<Color>("LSBottomSheetHandleColor")
val LSBottomSheetEnterRecipeKey = SemanticsPropertyKey<String>("LSBottomSheetEnterRecipe")

private var SemanticsPropertyReceiver.lsBottomSheetSurfaceColor by LSBottomSheetSurfaceColorKey
private var SemanticsPropertyReceiver.lsBottomSheetDetentHeight by LSBottomSheetDetentHeightKey
private var SemanticsPropertyReceiver.lsBottomSheetDetentFraction by LSBottomSheetDetentFractionKey
private var SemanticsPropertyReceiver.lsBottomSheetHandleWidth by LSBottomSheetHandleWidthKey
private var SemanticsPropertyReceiver.lsBottomSheetHandleColor by LSBottomSheetHandleColorKey
private var SemanticsPropertyReceiver.lsBottomSheetEnterRecipe by LSBottomSheetEnterRecipeKey

enum class BottomSheetDetent {
    Small,
    Medium,
    Large,
}

internal data class OverlayMotionRecipe(
    val name: String,
    val durationMillis: Int,
    val easing: Easing,
)

internal fun resolveBottomSheetDetentFraction(detent: BottomSheetDetent): Float =
    when (detent) {
        BottomSheetDetent.Small -> BottomSheetDetentSmallFraction
        BottomSheetDetent.Medium -> BottomSheetDetentMediumFraction
        BottomSheetDetent.Large -> BottomSheetDetentLargeFraction
    }

internal fun resolveBottomSheetDetentHeight(
    screenHeight: Dp,
    detent: BottomSheetDetent,
): Dp = screenHeight * resolveBottomSheetDetentFraction(detent)

internal fun bottomSheetEnterMotion(theme: LaneShadowThemeValues): OverlayMotionRecipe {
    val durationMillis = theme.motion.duration["standard"] ?: 240
    val easingPoints = theme.motion.easing["decelerated"] ?: listOf(0.0, 0.0, 0.2, 1.0)

    return OverlayMotionRecipe(
        name = BottomSheetEnterRecipePath,
        durationMillis = durationMillis,
        easing = CubicBezierEasing(
            easingPoints[0].toFloat(),
            easingPoints[1].toFloat(),
            easingPoints[2].toFloat(),
            easingPoints[3].toFloat(),
        ),
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LSBottomSheet(
    detent: BottomSheetDetent,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val configuration = LocalConfiguration.current
    val detentHeight = remember(configuration.screenHeightDp, detent) {
        resolveBottomSheetDetentHeight(configuration.screenHeightDp.dp, detent)
    }
    val detentFraction = remember(detent) { resolveBottomSheetDetentFraction(detent) }
    val enterMotion = remember(theme) { bottomSheetEnterMotion(theme) }
    val sheetShape = remember(theme.radius.lg) {
        RoundedCornerShape(
            topStart = theme.radius.lg,
            topEnd = theme.radius.lg,
        )
    }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)
    val scrollState = rememberScrollState()
    var entered by remember { mutableStateOf(false) }
    val alpha by animateFloatAsState(
        targetValue = if (entered) 1f else 0f,
        animationSpec = tween(
            durationMillis = enterMotion.durationMillis,
            easing = enterMotion.easing,
        ),
        label = "ls_bottom_sheet_alpha",
    )

    LaunchedEffect(Unit) {
        entered = true
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        dragHandle = null,
        containerColor = Color.Transparent,
        scrimColor = resolvedScrimColor(theme, 0.35f),
        modifier = modifier
            .testTag(LSBottomSheetTag)
            .semantics {
                lsBottomSheetSurfaceColor = GeneratedTokens.color.Surface.overlay
                lsBottomSheetDetentHeight = detentHeight
                lsBottomSheetDetentFraction = detentFraction
                lsBottomSheetHandleWidth = BottomSheetHandleWidth
                lsBottomSheetHandleColor = GeneratedTokens.color.Border.subtle
                lsBottomSheetEnterRecipe = enterMotion.name
                contentDescription = "LaneShadow bottom sheet"
            },
    ) {
        Box(
            modifier = Modifier
                .testTag(LSBottomSheetSurfaceTag)
                .fillMaxWidth()
                .height(detentHeight)
                .alpha(alpha)
                .clip(sheetShape)
                .background(GeneratedTokens.color.Surface.overlay, sheetShape),
        ) {
            LSGlassPanel(
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(scrollState),
                    verticalArrangement = Arrangement.spacedBy(theme.space.md),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = theme.space.xs),
                        contentAlignment = Alignment.Center,
                    ) {
                        Box(
                            modifier = Modifier
                                .testTag(LSBottomSheetHandleTag)
                                .width(BottomSheetHandleWidth)
                                .height(BottomSheetHandleHeight)
                                .clip(RoundedCornerShape(theme.radius.full))
                                .background(GeneratedTokens.color.Border.subtle)
                                .semantics {
                                    contentDescription = "Drag to resize"
                                },
                        )
                    }

                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(theme.space.md),
                        content = content,
                    )

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(
                                WindowInsets.statusBars.asPaddingValues().calculateTopPadding().coerceAtLeast(theme.space.md),
                            ),
                    )
                }
            }
        }
    }
}
