package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.MotorcyclePlusIcon
import com.laneshadow.ui.components.atoms.TypingIndicator
import com.laneshadow.ui.components.molecules.MarkdownText
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Chat message role enum
 *
 * Defines who sent the message in the conversation.
 */
enum class ChatMessageRole {
    /** Message from the rider/user */
    RIDER,

    /** Message from the AI agent */
    AGENT,
}

/**
 * Chat message status enum
 *
 * Defines the lifecycle state of a message.
 */
enum class ChatMessageStatus {
    /** Message is currently streaming text */
    STREAMING,

    /** Message is being processed */
    RUNNING,

    /** Message is complete */
    COMPLETE,

    /** Message failed to send/process */
    FAILED,
}

/**
 * Chat message kind enum
 *
 * Defines the type of content in a message for card rendering.
 */
enum class ChatMessageKind {
    /** Plain text message */
    TEXT,

    /** Routing card showing route calculation status */
    ROUTING_CARD,

    /** Weather information card */
    WEATHER_CARD,

    /** Saved route card */
    SAVED_ROUTE_CARD,

    /** Reasoning card with expanded agent thinking */
    REASONING,

    /** Thinking card with step timeline */
    THINKING_CARD,

    /** Planning card for orchestration status */
    PLANNING,

    /** Location search results card */
    LOCATION_SEARCH_CARD,
}

/**
 * Route attachment data class
 *
 * Represents a route that can be attached to a chat message.
 */
data class RouteAttachment(
    val id: String,
    val label: String,
    val description: String,
    val distance: String,
    val duration: String,
    val scenicScore: Double,
    val weatherBadge: WeatherBadge? = null,
    val isBest: Boolean = false,
)

/**
 * Weather badge data class
 *
 * Represents weather information for a route.
 */
data class WeatherBadge(
    val type: WeatherBadgeType,
    val text: String,
)

/**
 * Weather badge type enum
 */
enum class WeatherBadgeType {
    CLEAR,
    RAIN,
    WIND,
    CLOUDY,
}

/**
 * Card attachment data class
 *
 * Base class for card attachments passed to card components.
 */
sealed class CardAttachment {
    abstract val id: String
    abstract val type: String
}

/**
 * Thinking step data class
 *
 * Represents a single step in agent thinking process.
 */
data class ThinkingStep(
    val type: ThinkingStepType,
    val toolName: String? = null,
    val summary: String,
    val detail: String? = null,
    val timestamp: Long,
)

/**
 * Thinking step type enum
 */
enum class ThinkingStepType {
    THINKING,
    TOOL_START,
    TOOL_FINISH,
}

/**
 * Chat message data class
 *
 * Represents a single message in the chat transcript.
 *
 * @property id Unique identifier for the message
 * @property role Who sent the message (RIDER or AGENT)
 * @property content Text content of the message
 * @property timestamp Unix timestamp in milliseconds
 * @property status Current status of the message (default: COMPLETE)
 * @property kind Type of content for card rendering (default: TEXT)
 * @property routeAttachments Optional list of routes attached to this message
 * @property attachments Optional card attachments for specialized rendering
 * @property thinkingSteps Optional thinking steps showing agent reasoning
 */
data class ChatMessage(
    val id: String,
    val role: ChatMessageRole,
    val content: String,
    val timestamp: Long,
    val status: ChatMessageStatus = ChatMessageStatus.COMPLETE,
    val kind: ChatMessageKind? = null,
    val routeAttachments: List<RouteAttachment>? = null,
    val attachments: List<CardAttachment>? = null,
    val thinkingSteps: List<ThinkingStep>? = null,
)

/**
 * ChatTranscript molecule component
 *
 * Renders a chat conversation as a series of right-aligned rider bubbles
 * and left-aligned agent messages, mirroring the ChatGPT/Claude conversation pattern.
 *
 * Design decisions:
 * - Rider messages: right-aligned speech bubble with primary color background
 *   and onPrimary text. Bottom-right corner is tight (4dp radius) to give the
 *   classic "sent" bubble shape.
 * - Agent messages: left-aligned, no bubble — plain text with a small motorbike
 *   avatar glyph to the left. This mirrors how LLM chat UIs render assistant replies.
 * - Timestamps: shown only on the first message of the day OR when >5 min has
 *   elapsed since the previous message. Styled small + subtle.
 * - Auto-scrolls to bottom on mount and whenever messages list changes.
 *
 * @param messages List of chat messages to display
 * @param isTyping Whether to show typing indicator at bottom (default: false)
 * @param modifier Modifier for the component
 * @param contentDescription Accessibility description for screen readers
 */
@Composable
fun ChatTranscript(
    messages: List<ChatMessage>,
    isTyping: Boolean = false,
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // Auto-scroll to bottom when messages change
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size)
        }
    }

    // Build accessibility description
    val transcriptModifier = modifier
        .semantics {
            this.contentDescription = contentDescription ?: "Chat transcript with ${messages.size} messages"
        }
        .testTag("chat-transcript")

    // Empty state
    if (messages.isEmpty()) {
        Box(
            modifier = transcriptModifier
                .fillMaxSize()
                .background(theme.colors.background.default),
            contentAlignment = Alignment.Center,
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                MotorcyclePlusIcon(
                    size = 40.dp,
                    baseColor = theme.colors.onSurface.default.copy(alpha = 0.6f),
                )
                Text(
                    text = "Start a conversation from the home screen",
                    style = theme.type.body.md,
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                    modifier = Modifier
                        .padding(top = theme.space.md)
                        .testTag("chat-transcript-empty"),
                )
            }
        }
        return
    }

    LazyColumn(
        modifier = transcriptModifier
            .fillMaxSize()
            .background(theme.colors.background.default),
        state = listState,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        items(
            items = messages,
            key = { message -> message.id },
        ) { message ->
            val index = messages.indexOf(message)
            val previousMessage = if (index > 0) messages[index - 1] else null

            // Show timestamp divider if needed
            if (shouldShowTimestamp(message, previousMessage)) {
                TimestampDivider(
                    message = message,
                    previousMessage = previousMessage,
                )
            }

            // Render message based on role
            when (message.role) {
                ChatMessageRole.RIDER -> RiderBubble(message = message)
                ChatMessageRole.AGENT -> AgentMessage(message = message)
            }
        }

        // Typing indicator at bottom
        if (isTyping) {
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = theme.space.lg)
                        .testTag("agent-message-typing-indicator-slot"),
                    horizontalArrangement = Arrangement.Start,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    MotorcyclePlusIcon(
                        size = 16.dp,
                        baseColor = theme.colors.onSurface.default.copy(alpha = 0.6f),
                    )
                    TypingIndicator(
                        size = com.laneshadow.ui.components.atoms.TypingIndicatorSize.Small,
                        modifier = Modifier.padding(start = theme.space.sm),
                    )
                }
            }
        }
    }
}

/**
 * Timestamp divider component
 *
 * Shows a centered timestamp label when there's a gap >5 min or new day.
 */
@Composable
private fun TimestampDivider(
    message: ChatMessage,
    previousMessage: ChatMessage?,
) {
    val theme = LocalLaneShadowTheme.current

    val currDate = Date(message.timestamp)
    val prevDate = previousMessage?.timestamp?.let { Date(it) }

    // Determine if this is a new day using Calendar to avoid deprecated Date properties
    val currCal = java.util.Calendar.getInstance().apply { time = currDate }
    val prevCal = prevDate?.let { java.util.Calendar.getInstance().apply { time = it } }

    val isNewDay = prevCal == null ||
        currCal.get(java.util.Calendar.DAY_OF_YEAR) != prevCal.get(java.util.Calendar.DAY_OF_YEAR) ||
        currCal.get(java.util.Calendar.YEAR) != prevCal.get(java.util.Calendar.YEAR)

    // Format label
    val label = if (isNewDay) {
        "${formatDayLabel(currDate)} · ${formatMessageTime(currDate)}"
    } else {
        formatMessageTime(currDate)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            style = theme.type.label.sm,
            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
            textAlign = TextAlign.Center,
            modifier = Modifier.testTag("timestamp-divider"),
        )
    }
}

/**
 * Rider message bubble component
 *
 * Right-aligned speech bubble with primary background and onPrimary text.
 * Bottom-right corner has tight radius (4dp) for "sent" bubble appearance.
 */
@Composable
private fun RiderBubble(message: ChatMessage) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("rider-message-row"),
        horizontalArrangement = Arrangement.End,
    ) {
        Box(
            modifier = Modifier
                .clip(
                    RoundedCornerShape(
                        topStart = theme.radius.lg,
                        topEnd = theme.radius.lg,
                        bottomStart = theme.radius.lg,
                        bottomEnd = 4.dp, // Tight corner for "sent" appearance
                    ),
                )
                .background(theme.colors.primary.default)
                .padding(theme.space.md)
                .testTag("rider-bubble"),
        ) {
            Text(
                text = message.content,
                style = theme.type.body.lg,
                color = theme.colors.onPrimary.default,
                modifier = Modifier.testTag("rider-message-content"),
            )
        }
    }
}

/**
 * Agent message component
 *
 * Left-aligned, no bubble — plain text with small motorbike avatar to the left.
 * Mirrors LLM chat UI assistant message pattern.
 */
@Composable
private fun AgentMessage(message: ChatMessage) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("agent-message-row"),
        horizontalArrangement = Arrangement.Start,
        verticalAlignment = Alignment.Top,
    ) {
        // Motorbike avatar
        MotorcyclePlusIcon(
            size = 16.dp,
            baseColor = theme.colors.onSurface.default.copy(alpha = 0.6f),
            modifier = Modifier.testTag("agent-avatar"),
        )

        // Message content
        Box(
            modifier = Modifier
                .padding(start = theme.space.sm)
                .testTag("agent-message-content"),
        ) {
            MarkdownText(
                markdown = message.content,
            )
        }

        // Streaming indicator
        if (message.status == ChatMessageStatus.STREAMING) {
            TypingIndicator(
                size = com.laneshadow.ui.components.atoms.TypingIndicatorSize.Small,
                modifier = Modifier
                    .padding(start = theme.space.xs)
                    .testTag("agent-message-typing-indicator"),
            )
        }
    }
}

/**
 * Format a Date as a friendly time string (e.g., "3:45 PM")
 */
private fun formatMessageTime(date: Date): String {
    val formatter = SimpleDateFormat("h:mm a", Locale.US)
    return formatter.format(date)
}

/**
 * Format a Date as a day label (Today / Yesterday / weekday / date)
 */
private fun formatDayLabel(date: Date): String {
    val now = Date()
    val currCal = java.util.Calendar.getInstance().apply { time = date }
    val nowCal = java.util.Calendar.getInstance().apply { time = now }

    val diffDays = ((nowCal.timeInMillis - currCal.timeInMillis) / (1000 * 60 * 60 * 24)).toInt()

    return when (diffDays) {
        0 -> "Today"
        1 -> "Yesterday"
        in 2..6 -> currCal.getDisplayName(java.util.Calendar.DAY_OF_WEEK, java.util.Calendar.LONG, Locale.US) ?: ""
        else -> {
            val formatter = SimpleDateFormat("MMM d", Locale.US)
            formatter.format(date)
        }
    }
}

/**
 * Returns true when a timestamp divider should be shown before this message
 *
 * Rules:
 * - Always show on the first message
 * - Show when it's a new calendar day
 * - Show when gap > 5 minutes
 */
private fun shouldShowTimestamp(
    current: ChatMessage,
    previous: ChatMessage?,
): Boolean {
    if (previous == null) return true // First message

    val currTime = current.timestamp
    val prevTime = previous.timestamp

    // Check for new day using Calendar to avoid deprecated Date properties
    val currCal = java.util.Calendar.getInstance().apply { timeInMillis = currTime }
    val prevCal = java.util.Calendar.getInstance().apply { timeInMillis = prevTime }

    if (currCal.get(java.util.Calendar.DAY_OF_YEAR) != prevCal.get(java.util.Calendar.DAY_OF_YEAR) ||
        currCal.get(java.util.Calendar.YEAR) != prevCal.get(java.util.Calendar.YEAR)
    ) {
        return true
    }

    // Check for gap > 5 minutes
    val gapMs = currTime - prevTime
    return gapMs > 5 * 60 * 1000
}
