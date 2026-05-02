package com.laneshadow.services

import dev.convex.android.ClientException
import java.io.IOException

fun toLaneShadowError(throwable: Throwable): LaneShadowError {
    throwable.message?.toKnownErrorCode()?.let(::laneShadowErrorForCode)?.let { return it }

    throwable.convexExceptionMessages()
        .firstOrNull { it.toKnownErrorCode() != null }
        ?.toKnownErrorCode()
        ?.let(::laneShadowErrorForCode)
        ?.let { return it }

    if (throwable is IOException) {
        return LaneShadowError.NetworkTimeout(throwable)
    }

    return LaneShadowError.Unknown(
        originalMessage = throwable.firstUsefulMessage(),
    )
}

internal fun laneShadowErrorForCode(code: String): LaneShadowError? =
    when (code) {
        "UNAUTHENTICATED" -> LaneShadowError.Unauthenticated
        "AUTH_REQUIRED" -> LaneShadowError.AuthRequired
        "SESSION_NOT_FOUND" -> LaneShadowError.SessionNotFound
        "RATE_LIMIT_EXCEEDED" -> LaneShadowError.RateLimitExceeded
        "PLAN_LIMIT_EXCEEDED" -> LaneShadowError.PlanLimitExceeded
        "PLAN_ALREADY_ACTIVE" -> LaneShadowError.PlanAlreadyActive
        "AGENT_TIMEOUT" -> LaneShadowError.AgentTimeout
        "NOT_FOUND" -> LaneShadowError.NotFound
        "INVALID_INPUT" -> LaneShadowError.InvalidInput
        else -> null
    }

private fun Throwable.convexExceptionMessages(): List<String> =
    when (this) {
        is ClientException.ConvexException -> listOfNotNull(message, data)
        is ClientException.ServerException -> listOfNotNull(message, msg)
        is ClientException.InternalException -> listOfNotNull(message, msg)
        else -> listOfNotNull(message)
    }

private fun Throwable.firstUsefulMessage(): String? =
    convexExceptionMessages()
        .firstOrNull { it.isNotBlank() }
        ?.trim()
        ?.takeIf { it.isNotBlank() }
        ?: message?.trim()?.takeIf { it.isNotBlank() }

private fun String.toKnownErrorCode(): String? {
    val trimmed = trim()
    if (trimmed.isEmpty()) {
        return null
    }

    val candidates = listOf(
        trimmed,
        trimmed.substringBefore(':').trim(),
        trimmed.substringBefore(' ').trim(),
    )

    return candidates.firstOrNull { it in KnownErrorCodes }
}

private val KnownErrorCodes = setOf(
    "UNAUTHENTICATED",
    "AUTH_REQUIRED",
    "SESSION_NOT_FOUND",
    "RATE_LIMIT_EXCEEDED",
    "PLAN_LIMIT_EXCEEDED",
    "PLAN_ALREADY_ACTIVE",
    "AGENT_TIMEOUT",
    "NOT_FOUND",
    "INVALID_INPUT",
)
