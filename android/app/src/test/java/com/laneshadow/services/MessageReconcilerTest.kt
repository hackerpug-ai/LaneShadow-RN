package com.laneshadow.services

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.SessionMessage
import org.junit.Test

class MessageReconcilerTest {
    @Test
    fun reconcile_matchingUserOriginatedMessageWithinTolerance_replacesPendingWithComplete() {
        val pending = pendingMessage(
            tempId = "temp-1000",
            sessionId = "sess-1",
            content = "plan a ride",
            sentAt = 1000L,
        )
        val confirmed = confirmedMessage(
            id = "msg-99",
            sessionId = "sess-1",
            role = "rider",
            content = "plan a ride",
            createdAt = 1200L,
        )

        val result = reconcile(
            pendingMessages = listOf(pending),
            confirmedMessages = listOf(confirmed),
        )

        assertThat(result).containsExactly(
            DisplayMessage.Complete(
                serverId = "msg-99",
                content = "plan a ride",
            ),
        )
    }

    @Test
    fun reconcile_contentMismatch_keepsPendingAndConfirmedSeparate() {
        val pending = pendingMessage(
            tempId = "temp-1000",
            sessionId = "sess-1",
            content = "plan a ride",
            sentAt = 1000L,
        )
        val confirmed = confirmedMessage(
            id = "msg-99",
            sessionId = "sess-1",
            role = "rider",
            content = "different message",
            createdAt = 1200L,
        )

        val result = reconcile(
            pendingMessages = listOf(pending),
            confirmedMessages = listOf(confirmed),
        )

        assertThat(result).containsExactly(
            DisplayMessage.Pending(
                tempId = "temp-1000",
                content = "plan a ride",
                sentAt = 1000L,
            ),
            DisplayMessage.Complete(
                serverId = "msg-99",
                content = "different message",
            ),
        )
    }

    @Test
    fun reconcile_timestampOutsideTolerance_keepsPendingAndConfirmedSeparate() {
        val pending = pendingMessage(
            tempId = "temp-1000",
            sessionId = "sess-1",
            content = "plan a ride",
            sentAt = 1000L,
        )
        val confirmed = confirmedMessage(
            id = "msg-99",
            sessionId = "sess-1",
            role = "rider",
            content = "plan a ride",
            createdAt = 7001L,
        )

        val result = reconcile(
            pendingMessages = listOf(pending),
            confirmedMessages = listOf(confirmed),
        )

        assertThat(result).containsExactly(
            DisplayMessage.Pending(
                tempId = "temp-1000",
                content = "plan a ride",
                sentAt = 1000L,
            ),
            DisplayMessage.Complete(
                serverId = "msg-99",
                content = "plan a ride",
            ),
        )
    }

    private fun pendingMessage(
        tempId: String,
        sessionId: String,
        content: String,
        sentAt: Long,
    ): PendingMessage =
        PendingMessage(
            tempId = tempId,
            sessionId = sessionId,
            content = content,
            sentAt = sentAt,
        )

    private fun confirmedMessage(
        id: String,
        sessionId: String,
        role: String,
        content: String,
        createdAt: Long,
    ): SessionMessage =
        SessionMessage(
            id = id,
            sessionId = sessionId,
            role = role,
            content = content,
            createdAt = createdAt,
        )
}
