package com.laneshadow.ui.molecules

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
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
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSGlassPanel
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TextColor
import com.laneshadow.ui.atoms.TypographyVariant
import kotlinx.coroutines.delay
import com.laneshadow.theme.generated.LaneShadowTheme.IconName

const val LSToastTag = "ls-toast"
internal const val ToastEnterRecipePath = "motion.recipe.chatOverlayEnter"
internal const val ToastDismissRecipePath = "motion.recipe.chatOverlayDismiss"
private val ToastProgressHeight = 2.dp

val LSToastBackgroundColorKey = SemanticsPropertyKey<Color>("LSToastBackgroundColor")
val LSToastProgressColorKey = SemanticsPropertyKey<Color>("LSToastProgressColor")
val LSToastDismissRecipeKey = SemanticsPropertyKey<String>("LSToastDismissRecipe")
val LSToastAutoDismissMillisKey = SemanticsPropertyKey<Int>("LSToastAutoDismissMillis")
val LSToastVariantKey = SemanticsPropertyKey<String>("LSToastVariant")
val LSToastRoleKey = SemanticsPropertyKey<String>("LSToastRole")

private var SemanticsPropertyReceiver.lsToastBackgroundColor by LSToastBackgroundColorKey
private var SemanticsPropertyReceiver.lsToastProgressColor by LSToastProgressColorKey
private var SemanticsPropertyReceiver.lsToastDismissRecipe by LSToastDismissRecipeKey
private var SemanticsPropertyReceiver.lsToastAutoDismissMillis by LSToastAutoDismissMillisKey
private var SemanticsPropertyReceiver.lsToastVariant by LSToastVariantKey
private var SemanticsPropertyReceiver.lsToastRole by LSToastRoleKey

enum class ToastVariant {
    Default,
    Success,
    Warning,
    Error,
}

@Immutable
data class LSToastVisuals(
    val message: String,
    val variant: ToastVariant = ToastVariant.Default,
    val detail: String? = null,
    val actionLabel: String? = null,
    val onAction: (() -> Unit)? = null,
)

@Immutable
internal data class LSToastStyle(
    val backgroundColor: Color,
    val progressColor: Color,
    val messageColor: TextColor,
    val iconColor: IconColor,
    val role: String,
)

@Stable
class LSToastState internal constructor(
    current: LSToastVisuals? = null,
) {
    var current by mutableStateOf(current)
        private set

    suspend fun show(
        message: String,
        variant: ToastVariant = ToastVariant.Default,
        detail: String? = null,
        actionLabel: String? = null,
        onAction: (() -> Unit)? = null,
    ) {
        current = LSToastVisuals(
            message = message,
            variant = variant,
            detail = detail,
            actionLabel = actionLabel,
            onAction = onAction,
        )
    }

    fun dismiss() {
        current = null
    }
}

@Composable
fun rememberLSToastState(): LSToastState =
    rememberSaveable(
        saver = listSaver(
            save = { state ->
                listOf(
                    state.current?.message,
                    state.current?.variant?.name,
                    state.current?.detail,
                    state.current?.actionLabel,
                )
            },
            restore = { restored ->
                val message = restored[0] as String?
                val variantName = restored[1] as String?
                val detail = restored[2] as String?
                val actionLabel = restored[3] as String?
                LSToastState(
                    current = message?.let {
                        LSToastVisuals(
                            message = it,
                            variant = variantName?.let(ToastVariant::valueOf) ?: ToastVariant.Default,
                            detail = detail,
                            actionLabel = actionLabel,
                        )
                    },
                )
            },
        ),
    ) {
        LSToastState()
    }

internal fun resolveLSToastStyle(variant: ToastVariant): LSToastStyle =
    when (variant) {
        ToastVariant.Default -> LSToastStyle(
            backgroundColor = GeneratedTokens.color.Surface.overlay,
            progressColor = GeneratedTokens.color.Border.strong,
            messageColor = TextColor.Content(ContentColor.Primary),
            iconColor = IconColor.Content(ContentColor.Secondary),
            role = "status",
        )
        ToastVariant.Success -> LSToastStyle(
            backgroundColor = GeneratedTokens.color.Status.Success.default,
            progressColor = GeneratedTokens.color.Status.Success.default,
            messageColor = TextColor.Content(ContentColor.OnSignal),
            iconColor = IconColor.Content(ContentColor.OnSignal),
            role = "status",
        )
        ToastVariant.Warning -> LSToastStyle(
            backgroundColor = GeneratedTokens.color.Status.Warning.default,
            progressColor = GeneratedTokens.color.Status.Warning.default,
            messageColor = TextColor.Content(ContentColor.OnSignal),
            iconColor = IconColor.Content(ContentColor.OnSignal),
            role = "alert",
        )
        ToastVariant.Error -> LSToastStyle(
            backgroundColor = GeneratedTokens.color.Status.Error.default,
            progressColor = GeneratedTokens.color.Status.Error.default,
            messageColor = TextColor.Content(ContentColor.OnSignal),
            iconColor = IconColor.Content(ContentColor.OnSignal),
            role = "alert",
        )
    }

internal fun toastEnterMotion(theme: LaneShadowThemeValues): OverlayMotionRecipe {
    return overlayEnterMotion(
        theme = theme,
        recipeName = ToastEnterRecipePath,
    )
}

internal data class ToastDismissContract(
    val visibleMillis: Int,
    val exitMotion: OverlayMotionRecipe,
)

internal fun toastDismissContract(theme: LaneShadowThemeValues): ToastDismissContract =
    ToastDismissContract(
        visibleMillis = ChatOverlayDismissVisibleMillis,
        exitMotion = overlayDismissMotion(
            theme = theme,
            recipeName = ToastDismissRecipePath,
        ),
    )

internal fun toastAutoDismissMillis(theme: LaneShadowThemeValues): Int = toastDismissContract(theme).visibleMillis

@Composable
fun LSToast(
    state: LSToastState,
    modifier: Modifier = Modifier,
    onDismissed: ((LSToastVisuals) -> Unit)? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val current = state.current ?: return
    val style = remember(current.variant) { resolveLSToastStyle(current.variant) }
    val enterMotion = remember(theme) { toastEnterMotion(theme) }
    val dismissContract = remember(theme) { toastDismissContract(theme) }
    val dismissMotion = dismissContract.exitMotion
    val dismissCallback by rememberUpdatedState(onDismissed)
    var isVisible by remember(current) { mutableStateOf(false) }
    var progressRunning by remember(current) { mutableStateOf(false) }
    val progress by animateFloatAsState(
        targetValue = if (progressRunning && isVisible) 0f else 1f,
        animationSpec = tween(
            durationMillis = dismissContract.visibleMillis,
            easing = dismissMotion.easing,
        ),
        label = "ls_toast_progress",
    )

    LaunchedEffect(current) {
        isVisible = true
        progressRunning = true
        delay(dismissContract.visibleMillis.toLong())
        isVisible = false
        delay(dismissMotion.durationMillis.toLong())
        if (state.current == current) {
            state.dismiss()
            dismissCallback?.invoke(current)
        }
    }

    AnimatedVisibility(
        visible = isVisible,
        enter = toastEnterTransition(enterMotion),
        exit = toastExitTransition(dismissMotion),
    ) {
        val toastShape = RoundedCornerShape(theme.radius.lg)

        Box(
            modifier = modifier
                .testTag(LSToastTag)
                .clip(toastShape)
                .background(style.backgroundColor, toastShape)
                .semantics {
                    lsToastBackgroundColor = style.backgroundColor
                    lsToastProgressColor = style.progressColor
                    lsToastDismissRecipe = dismissMotion.name
                    lsToastAutoDismissMillis = dismissContract.visibleMillis
                    lsToastVariant = current.variant.name
                    lsToastRole = style.role
                    contentDescription = current.detail?.let { "${current.message}. $it" } ?: current.message
                },
        ) {
            LSGlassPanel(
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(theme.space.sm),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                        verticalAlignment = Alignment.Top,
                    ) {
                        LSIcon(
                            name = toastLeadingIcon(current.variant),
                            size = IconSize.Sm,
                            color = style.iconColor,
                        )

                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(theme.space.xs),
                        ) {
                            LSText(
                                text = current.message,
                                variant = TypographyVariant.Ui.Body.Md,
                                color = style.messageColor,
                            )
                            current.detail?.let { detail ->
                                LSText(
                                    text = detail,
                                    variant = TypographyVariant.Ui.Body.Sm,
                                    color = style.messageColor,
                                )
                            }
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(theme.radius.full))
                                .clickable {
                                    isVisible = false
                                }
                                .padding(theme.space.xs),
                        ) {
                            LSIcon(
                                name = IconName.Close,
                                size = IconSize.Sm,
                                color = style.iconColor,
                            )
                        }
                    }

                    if (current.actionLabel != null && current.onAction != null) {
                        LSButton(
                            label = current.actionLabel,
                            variant = ButtonVariant.Ghost,
                            onClick = current.onAction,
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(ToastProgressHeight)
                            .clip(RoundedCornerShape(theme.radius.full))
                            .background(style.progressColor.copy(alpha = 0.18f)),
                    ) {
                        Box(
                            modifier = Modifier
                                .height(ToastProgressHeight)
                                .width((240.dp * progress).coerceAtLeast(0.dp))
                                .clip(RoundedCornerShape(theme.radius.full))
                                .background(style.progressColor),
                        )
                    }
                }
            }
        }
    }
}

private fun toastLeadingIcon(variant: ToastVariant): IconName =
    when (variant) {
        ToastVariant.Default -> IconName.Sparkle
        ToastVariant.Success -> IconName.CircleFill
        ToastVariant.Warning -> IconName.Therm
        ToastVariant.Error -> IconName.Close
    }

private fun toastEnterTransition(recipe: OverlayMotionRecipe): EnterTransition =
    fadeIn(animationSpec = tween(recipe.durationMillis, easing = recipe.easing)) +
        slideInVertically(
            animationSpec = tween(recipe.durationMillis, easing = recipe.easing),
            initialOffsetY = { fullHeight -> fullHeight / 2 },
        )

private fun toastExitTransition(recipe: OverlayMotionRecipe): ExitTransition =
    fadeOut(animationSpec = tween(recipe.durationMillis, easing = recipe.easing)) +
        slideOutVertically(
            animationSpec = tween(recipe.durationMillis, easing = recipe.easing),
            targetOffsetY = { fullHeight -> fullHeight },
        )
