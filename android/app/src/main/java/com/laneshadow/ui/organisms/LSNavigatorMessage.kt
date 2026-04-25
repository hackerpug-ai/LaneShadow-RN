package com.laneshadow.ui.organisms

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.AccentColor
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.GlassVariant
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSGlassPanel
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize
import com.laneshadow.ui.atoms.TextColor
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.molecules.LSRouteAttachmentCard
import com.laneshadow.ui.molecules.RouteAttachment
import com.laneshadow.ui.molecules.overlayDismissMotion
import com.laneshadow.ui.molecules.overlayEnterMotion
import kotlinx.coroutines.delay

// Test tags
const val LS_NAVIGATOR_MESSAGE_TAG = "ls-navigator-message"
const val NAVIGATOR_COMPASS_CHIP_TAG = "navigator-compass-chip"
const val NAVIGATOR_BODY_TAG = "navigator-body"
const val NAVIGATOR_PIN_ICON_TAG = "navigator-pin-icon"
const val NAVIGATOR_CLOSE_ICON_TAG = "navigator-close-icon"
const val NAVIGATOR_ATTACHMENTS_TAG = "navigator-attachments"
const val NAVIGATOR_PINNED_INDICATOR_TAG = "navigator-pinned-indicator"

// Motion recipe paths
private const val ChatOverlayEnterRecipePath = "motion.recipe.chatOverlayEnter"
private const val ChatOverlayDismissRecipePath = "motion.recipe.chatOverlayDismiss"

// Semantics keys
val LSNavigatorMessageVisibleKey = SemanticsPropertyKey<Boolean>("LSNavigatorMessageVisible")
val LSNavigatorMessagePinnedKey = SemanticsPropertyKey<Boolean>("LSNavigatorMessagePinned")
val LSNavigatorMessageAutoDismissMillisKey = SemanticsPropertyKey<Int>("LSNavigatorMessageAutoDismissMillis")

private var SemanticsPropertyReceiver.lsNavigatorMessageVisible by LSNavigatorMessageVisibleKey
private var SemanticsPropertyReceiver.lsNavigatorMessagePinned by LSNavigatorMessagePinnedKey
private var SemanticsPropertyReceiver.lsNavigatorMessageAutoDismissMillis by LSNavigatorMessageAutoDismissMillisKey

/**
 * LSNavigatorMessage - Glass callout with signal-stripe accent, compass chip,
 * "THE NAVIGATOR" label, opinion-serif body, and attached route card stack.
 *
 * @param body Navigator message body text in opinion typography
 * @param attachments Optional list of route attachment cards
 * @param pinned Whether the message is pinned (pinned messages don't auto-dismiss)
 * @param onPin Callback when pin icon is tapped
 * @param onDismiss Callback when close icon is tapped or auto-dismiss triggers
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSNavigatorMessage(
    body: String,
    attachments: List<RouteAttachment> = emptyList(),
    pinned: Boolean = false,
    onPin: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    var visible by remember { mutableStateOf(true) }

    // Auto-dismiss after 5000ms when not pinned
    LaunchedEffect(pinned) {
        if (!pinned) {
            delay(5000)
            onDismiss()
        }
    }

    AnimatedVisibility(
        visible = visible,
        enter = rememberEnterTransition(),
        exit = rememberExitTransition(),
        modifier = modifier.semantics {
            lsNavigatorMessageVisible = visible
            lsNavigatorMessagePinned = pinned
            lsNavigatorMessageAutoDismissMillis = 5000
        },
    ) {
        LSGlassPanel(
            variant = GlassVariant.Callout(accent = AccentColor.Signal),
            modifier = Modifier.testTag(LS_NAVIGATOR_MESSAGE_TAG),
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(theme.space.sm),
            ) {
                // Header row: compass chip, label/body, actions
                Row(
                    horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                    verticalAlignment = Alignment.Top,
                ) {
                    NavigatorCompassChip(
                        modifier = Modifier.testTag(NAVIGATOR_COMPASS_CHIP_TAG),
                    )

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .testTag(NAVIGATOR_BODY_TAG),
                        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
                    ) {
                        LSText(
                            text = "THE NAVIGATOR",
                            variant = TypographyVariant.Ui.Label.Sm,
                            color = TextColor.Signal,
                        )

                        LSText(
                            text = body,
                            variant = TypographyVariant.Opinion.Md,
                            color = ContentColor.Primary,
                        )
                    }

                    // Action icons
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
                    ) {
                        // Pin icon
                        LSIcon(
                            name = if (pinned) IconName.BookmarkFill else IconName.Bookmark,
                            size = IconSize.Sm,
                            color = if (pinned) IconColor.Signal else IconColor.Content(ContentColor.Tertiary),
                            modifier = Modifier
                                .testTag(NAVIGATOR_PIN_ICON_TAG)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null,
                                    onClick = onPin,
                                )
                                .semantics { contentDescription = if (pinned) "Unpin message" else "Pin message" },
                        )

                        // Close icon
                        LSIcon(
                            name = IconName.Close,
                            size = IconSize.Xs,
                            color = IconColor.Content(ContentColor.Tertiary),
                            modifier = Modifier
                                .testTag(NAVIGATOR_CLOSE_ICON_TAG)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null,
                                    onClick = onDismiss,
                                )
                                .semantics { contentDescription = "Dismiss message" },
                        )
                    }
                }

                // Pinned indicator
                if (pinned) {
                    PinnedIndicator(
                        modifier = Modifier.testTag(NAVIGATOR_PINNED_INDICATOR_TAG),
                    )
                }

                // Route attachments
                if (attachments.isNotEmpty()) {
                    Column(
                        modifier = Modifier.testTag(NAVIGATOR_ATTACHMENTS_TAG),
                        verticalArrangement = Arrangement.spacedBy(6.dp), // spacing.2 (6dp) between rows
                    ) {
                        attachments.forEachIndexed { index, attachment ->
                            LSRouteAttachmentCard(
                                route = attachment,
                                selected = index == 0, // First card selected
                                compact = true,
                                onTap = null,
                                modifier = Modifier.fillMaxWidth(),
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Navigator compass chip - circular pill with compass icon and signal tint.
 */
@Composable
private fun NavigatorCompassChip(
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    LSPill(
        size = PillSize.Sm,
        modifier = modifier,
    ) {
        LSIcon(
            name = IconName.Compass,
            size = IconSize.Xs,
            color = IconColor.Signal,
        )
    }
}

/**
 * Pinned indicator - dot + "Pinned" label.
 */
@Composable
private fun PinnedIndicator(
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(5.dp)
                .background(theme.colors.primary.default.copy(alpha = 0.22f), CircleShape),
        )

        LSText(
            text = "Pinned — will not auto-dismiss",
            variant = TypographyVariant.Ui.Label.Sm,
            color = TextColor.Signal,
        )
    }
}

/**
 * Enter transition - slide down from y:-20 + fade in.
 */
@Composable
private fun rememberEnterTransition(): EnterTransition {
    val theme = LocalLaneShadowTheme.current
    val recipe = overlayEnterMotion(theme, ChatOverlayEnterRecipePath)

    return slideInVertically(
        initialOffsetY = { -20 },
        animationSpec = tween(recipe.durationMillis, easing = recipe.easing),
    ) + fadeIn(animationSpec = tween(recipe.durationMillis, easing = recipe.easing))
}

/**
 * Exit transition - slide up to y:-16 + fade out.
 */
@Composable
private fun rememberExitTransition(): ExitTransition {
    val theme = LocalLaneShadowTheme.current
    val recipe = overlayDismissMotion(theme, ChatOverlayDismissRecipePath)

    return slideOutVertically(
        targetOffsetY = { -16 },
        animationSpec = tween(recipe.durationMillis, easing = recipe.easing),
    ) + fadeOut(animationSpec = tween(recipe.durationMillis, easing = recipe.easing))
}
