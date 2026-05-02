package com.laneshadow.services

import com.laneshadow.data.chat.SessionMessage
import kotlin.math.abs

private const val RECONCILIATION_TOLERANCE_MS = 5_000L

fun reconcile(
    pendingMessages: List<PendingMessage>,
    confirmedMessages: List<SessionMessage>,
): List<DisplayMessage> {
    val unmatchedPending = pendingMessages
        .sortedBy { it.sentAt }
        .toMutableList()
    val displayMessages = mutableListOf<TimedDisplayMessage>()

    confirmedMessages
        .sortedBy { it.createdAt }
        .forEach { confirmed ->
            val displayMessage = confirmed.toDisplayMessage()
            if (isUserOriginated(confirmed.role)) {
                unmatchedPending.removeFirstMatch(confirmed)?.let {
                    displayMessages += TimedDisplayMessage(confirmed.createdAt, displayMessage)
                    return@forEach
                }
            }

            displayMessages += TimedDisplayMessage(confirmed.createdAt, displayMessage)
        }

    unmatchedPending.forEach { pending ->
        displayMessages += TimedDisplayMessage(
            timestamp = pending.sentAt,
            message = DisplayMessage.Pending(
                tempId = pending.tempId,
                content = pending.content,
                sentAt = pending.sentAt,
            ),
        )
    }

    return displayMessages
        .sortedBy { it.timestamp }
        .map { it.message }
}

internal fun matchesPendingMessage(
    pending: PendingMessage,
    confirmed: SessionMessage,
): Boolean =
    isUserOriginated(confirmed.role) &&
        pending.sessionId == confirmed.sessionId &&
        pending.content == confirmed.content &&
        abs(pending.sentAt - confirmed.createdAt) <= RECONCILIATION_TOLERANCE_MS

private fun MutableList<PendingMessage>.removeFirstMatch(
    confirmed: SessionMessage,
): PendingMessage? {
    val matchIndex = indexOfFirst { pending ->
        matchesPendingMessage(pending, confirmed)
    }

    if (matchIndex == -1) {
        return null
    }

    return removeAt(matchIndex)
}

private fun SessionMessage.toDisplayMessage(): DisplayMessage =
    if (isStreamingStatus(status)) {
        DisplayMessage.Streaming(
            serverId = id,
            content = content,
            status = status.orEmpty(),
        )
    } else {
        DisplayMessage.Complete(
            serverId = id,
            content = content,
        )
    }

internal fun isUserOriginated(role: String): Boolean =
    role == "user" || role == "rider"

private fun isStreamingStatus(status: String?): Boolean =
    status != null && status != "complete" && status != "failed"

private data class TimedDisplayMessage(
    val timestamp: Long,
    val message: DisplayMessage,
)
