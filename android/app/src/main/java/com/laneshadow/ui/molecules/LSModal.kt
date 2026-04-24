package com.laneshadow.ui.molecules

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSCard
import com.laneshadow.ui.atoms.LSScrim
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant

internal const val ModalEnterRecipePath = "motion.recipe.chatOverlayEnter"
private val ModalMaxWidth = 288.dp

val LSModalBackgroundColorKey = SemanticsPropertyKey<Color>("LSModalBackgroundColor")
val LSModalMaxWidthKey = SemanticsPropertyKey<Dp>("LSModalMaxWidth")
val LSModalEnterRecipeKey = SemanticsPropertyKey<String>("LSModalEnterRecipe")

private var SemanticsPropertyReceiver.lsModalBackgroundColor by LSModalBackgroundColorKey
private var SemanticsPropertyReceiver.lsModalMaxWidth by LSModalMaxWidthKey
private var SemanticsPropertyReceiver.lsModalEnterRecipe by LSModalEnterRecipeKey

sealed class ModalAction(
    val label: String,
    val onClick: () -> Unit,
) {
    class Primary(label: String, onClick: () -> Unit) : ModalAction(label, onClick)

    class Ghost(label: String, onClick: () -> Unit) : ModalAction(label, onClick)

    class Destructive(label: String, onClick: () -> Unit) : ModalAction(label, onClick)
}

private fun ModalAction.asButtonVariant(): ButtonVariant =
    when (this) {
        is ModalAction.Primary -> ButtonVariant.Primary
        is ModalAction.Ghost -> ButtonVariant.Ghost
        is ModalAction.Destructive -> ButtonVariant.Destructive
    }

internal fun modalEnterMotion(theme: LaneShadowThemeValues): OverlayMotionRecipe {
    val durationMillis = theme.motion.duration["standard"] ?: 240
    val easingPoints = theme.motion.easing["decelerated"] ?: listOf(0.0, 0.0, 0.2, 1.0)

    return OverlayMotionRecipe(
        name = ModalEnterRecipePath,
        durationMillis = durationMillis,
        easing = CubicBezierEasing(
            easingPoints[0].toFloat(),
            easingPoints[1].toFloat(),
            easingPoints[2].toFloat(),
            easingPoints[3].toFloat(),
        ),
    )
}

@Composable
fun LSModal(
    title: String,
    body: String,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    primary: ModalAction? = null,
    secondary: ModalAction? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val enterMotion = remember(theme) { modalEnterMotion(theme) }
    val scrimDismissEnabled = primary !is ModalAction.Destructive

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            dismissOnClickOutside = false,
        ),
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            LSScrim(
                blocking = true,
                onTap = if (scrimDismissEnabled) onDismiss else null,
            )

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(theme.space.xl),
                contentAlignment = Alignment.Center,
            ) {
                AnimatedVisibility(
                    visible = true,
                    enter = fadeIn(
                        animationSpec = tween(
                            durationMillis = enterMotion.durationMillis,
                            easing = enterMotion.easing,
                        ),
                    ) + scaleIn(
                        animationSpec = tween(
                            durationMillis = enterMotion.durationMillis,
                            easing = enterMotion.easing,
                        ),
                        initialScale = 0.94f,
                    ),
                    exit = fadeOut(
                        animationSpec = tween(
                            durationMillis = enterMotion.durationMillis,
                            easing = enterMotion.easing,
                        ),
                    ) + scaleOut(
                        animationSpec = tween(
                            durationMillis = enterMotion.durationMillis,
                            easing = enterMotion.easing,
                        ),
                        targetScale = 0.94f,
                    ),
                ) {
                    LSCard(
                        modifier = modifier
                            .widthIn(max = ModalMaxWidth)
                            .semantics {
                                lsModalBackgroundColor = GeneratedTokens.color.Surface.card
                                lsModalMaxWidth = ModalMaxWidth
                                lsModalEnterRecipe = enterMotion.name
                                contentDescription = title
                            },
                        backgroundColor = GeneratedTokens.color.Surface.card,
                        cornerRadius = theme.radius.xl,
                        shadowElevation = theme.elevation.light.level8,
                        contentPadding = theme.space.xl,
                    ) {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(theme.space.lg),
                        ) {
                            Column(
                                verticalArrangement = Arrangement.spacedBy(theme.space.sm),
                            ) {
                                LSText(
                                    text = title,
                                    variant = TypographyVariant.Ui.Title.Md,
                                    color = ContentColor.Primary,
                                )
                                LSText(
                                    text = body,
                                    variant = TypographyVariant.Ui.Body.Md,
                                    color = ContentColor.Secondary,
                                )
                            }

                            if (primary != null || secondary != null) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                                ) {
                                    secondary?.let { action ->
                                        LSButton(
                                            label = action.label,
                                            variant = action.asButtonVariant(),
                                            onClick = action.onClick,
                                            modifier = Modifier.weight(1f),
                                        )
                                    }
                                    primary?.let { action ->
                                        LSButton(
                                            label = action.label,
                                            variant = action.asButtonVariant(),
                                            onClick = action.onClick,
                                            modifier = Modifier.weight(1f),
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
