package com.laneshadow.ui.components.chat.cards

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.IconSymbol
import com.laneshadow.ui.components.molecules.ChatMessage
import com.laneshadow.ui.components.molecules.ChatMessageStatus
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * ReasoningCard component
 *
 * Surfaces the agent's internal thinking inline in the chat transcript
 * as a subtle, muted, collapsible "thought bubble". Reasoning is secondary
 * content — the user's conversation and the agent's answers remain the
 * primary focus.
 *
 * Visual states:
 *   collapsed  → single-row chip: "Thought for 3s", chevron down
 *   streaming  → "Thinking…" with pulsing primary dot
 *   expanded   → header + divider + body reasoning text
 *   completed  → same as collapsed with final duration
 *   error      → "Thought briefly", not expandable if body empty
 *
 * Following React Native wrapper from react-native/components/chat/cards/reasoning-card.tsx
 *
 * @param message The chat message containing reasoning content
 * @param modifier Modifier for the card component
 */
@Composable
fun ReasoningCard(
    message: ChatMessage,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Track expanded/collapsed state
    var expanded by remember { mutableStateOf(false) }

    // Track completion timestamp for duration calculation
    var completedAt by remember { mutableLongStateOf(0L) }
    var hasCapturedCompletion by remember { mutableStateOf(false) }

    // Track reduce motion preference
    var reduceMotion by remember { mutableStateOf(false) }

    // Capture completion timestamp on streaming -> complete transition
    val isStreaming = message.status == ChatMessageStatus.STREAMING ||
                      message.status == ChatMessageStatus.RUNNING

    LaunchedEffect(isStreaming) {
        if (!isStreaming && !hasCapturedCompletion && message.status == ChatMessageStatus.COMPLETE) {
            completedAt = System.currentTimeMillis()
            hasCapturedCompletion = true
        }
    }

    // Determine if card can be expanded (has body content)
    val hasBody = message.content.trim().isNotEmpty()
    val canExpand = hasBody

    // Handle toggle
    val handleToggle = {
        if (canExpand) {
            expanded = !expanded
        }
    }

    // Calculate duration label
    val durationLabel = when (message.status) {
        ChatMessageStatus.STREAMING, ChatMessageStatus.RUNNING -> "Thinking…"
        ChatMessageStatus.FAILED -> "Thought briefly"
        ChatMessageStatus.COMPLETE -> {
            val elapsedMs = if (completedAt > 0) completedAt - message.timestamp else 0
            if (elapsedMs < 1000) {
                "Thought briefly"
            } else {
                val seconds = (elapsedMs / 1000).toInt()
                "Thought for ${seconds}s"
            }
        }
    }

    // Colors
    val mutedColor = theme.colors.onSurface.default.copy(alpha = 0.6f)
    val surfaceColor = theme.colors.surfaceVariant.default

    // Accessibility label
    val accessibilityLabel = when (message.status) {
        ChatMessageStatus.STREAMING, ChatMessageStatus.RUNNING -> "Agent is thinking"
        else -> "Agent reasoning, thought briefly"
    }

    val accessibilityHint = if (!canExpand) {
        null
    } else if (expanded) {
        "Double tap to collapse"
    } else {
        "Double tap to expand"
    }

    // Build base modifier
    val baseModifier = modifier
        .semantics {
            role = Role.Button
            contentDescription = accessibilityLabel
        }
        .testTag(
            when (message.status) {
                ChatMessageStatus.STREAMING, ChatMessageStatus.RUNNING -> "reasoning-card-streaming"
                ChatMessageStatus.FAILED -> "reasoning-card-error"
                else -> if (expanded) "reasoning-card-expanded" else "reasoning-card-collapsed"
            }
        )

    // Build clickable modifier if expandable
    val clickableModifier = if (canExpand) {
        baseModifier.clickable(onClick = handleToggle)
    } else {
        baseModifier
    }

    // Streaming overlay color
    val streamingOverlayColor = theme.colors.primary.default.copy(alpha = 0.08f)

    // Surface
    Surface(
        modifier = clickableModifier,
        shape = RoundedCornerShape(theme.radius.md),
        color = surfaceColor,
        border = if (isStreaming) {
            BorderStroke(1.dp, theme.colors.primary.default.copy(alpha = 0.2f))
        } else {
            BorderStroke(1.dp, theme.colors.border.default)
        },
    ) {
        Box {
            // Streaming tint overlay
            if (isStreaming) {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(
                            color = streamingOverlayColor,
                            shape = RoundedCornerShape(theme.radius.md),
                        ),
                )
            }

            Column(
                modifier = Modifier.padding(
                    horizontal = theme.space.md,
                    vertical = theme.space.sm,
                ),
            ) {
                // Header row: icon | label | pulsing dot? | chevron
                Row(
                    modifier = Modifier
                        .testTag("reasoning-card-header"),
                    horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    // Lightbulb icon
                    IconSymbol(
                        name = "info", // Using info icon as fallback for lightbulb
                        size = 16.dp,
                        color = mutedColor,
                        modifier = Modifier.testTag("reasoning-card-glyph"),
                    )

                    // Duration label
                    Text(
                        text = durationLabel,
                        style = theme.type.label.md,
                        color = mutedColor,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier
                            .weight(1f)
                            .testTag("reasoning-card-label"),
                    )

                    // Pulsing dot for streaming
                    if (isStreaming) {
                        PulsingDot(
                            reduceMotion = reduceMotion,
                            color = theme.colors.primary.default,
                        )
                    }

                    // Chevron icon (if expandable)
                    if (canExpand) {
                        IconSymbol(
                            name = "arrow-left", // Will rotate to point down/up
                            size = 16.dp,
                            color = mutedColor,
                            modifier = Modifier
                                .rotate(if (expanded) 90f else 0f)
                                .testTag("reasoning-card-chevron"),
                        )
                    }
                }

                // Body content (expanded only)
                if (expanded && hasBody) {
                    Column(
                        modifier = Modifier
                            .padding(top = theme.space.sm)
                            .testTag("reasoning-card-body"),
                    ) {
                        // Divider
                        Box(
                            modifier = Modifier
                                .padding(bottom = theme.space.sm)
                                .size(
                                    width = 1000.dp, // Very wide to act as full-width divider
                                    height = 1.dp,
                                )
                                .background(mutedColor.copy(alpha = 0.2f)),
                        )

                        // Content text
                        Text(
                            text = message.content,
                            style = theme.type.body.sm,
                            color = mutedColor,
                        )
                    }
                }
            }
        }
    }
}

/**
 * PulsingDot component
 *
 * Animated dot that pulses in opacity when streaming.
 *
 * @param reduceMotion Whether to reduce motion (accessibility)
 * @param color Color of the dot
 * @param modifier Modifier for the dot
 */
@Composable
private fun PulsingDot(
    reduceMotion: Boolean,
    color: Color,
    modifier: Modifier = Modifier,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulsing_dot")

    val opacity by if (reduceMotion) {
        androidx.compose.runtime.derivedStateOf { 0.7f }
    } else {
        infiniteTransition.animateFloat(
            initialValue = 0.4f,
            targetValue = 1.0f,
            animationSpec = infiniteRepeatable(
                animation = tween(durationMillis = 600, delayMillis = 0),
                repeatMode = RepeatMode.Reverse,
            ),
            label = "pulsing_dot_opacity",
        )
    }

    Box(
        modifier = modifier
            .size(6.dp)
            .alpha(opacity)
            .background(
                color = color,
                shape = CircleShape,
            )
            .testTag("reasoning-card-pulsing-dot"),
    )
}
