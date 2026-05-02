package com.laneshadow.services

sealed interface DisplayMessage {
    data class Pending(
        val tempId: String,
        val content: String,
        val sentAt: Long,
    ) : DisplayMessage

    data class Streaming(
        val serverId: String,
        val content: String,
        val status: String,
    ) : DisplayMessage

    data class Complete(
        val serverId: String,
        val content: String,
    ) : DisplayMessage
}
