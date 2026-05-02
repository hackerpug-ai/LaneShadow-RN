package com.laneshadow.services

data class PendingMessage(
    val tempId: String,
    val sessionId: String,
    val content: String,
    val sentAt: Long,
)
