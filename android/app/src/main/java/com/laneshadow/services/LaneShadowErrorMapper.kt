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

fun laneShadowErrorForCode(code: String): LaneShadowError? =
    when (code) {
        // Server library codes
        "AUTH_REQUIRED" -> LaneShadowError.AuthRequired
        "SESSION_REQUIRED" -> LaneShadowError.SessionRequired
        "USER_NOT_FOUND" -> LaneShadowError.UserNotFound
        "NO_FIELDS_TO_UPDATE" -> LaneShadowError.NoFieldsToUpdate
        "NOT_FOUND" -> LaneShadowError.NotFound
        "INVALID_INPUT" -> LaneShadowError.InvalidInput
        "LLM_SKETCH_INVALID" -> LaneShadowError.LlmSketchInvalid
        "LLM_SKETCH_AMBIGUOUS" -> LaneShadowError.LlmSketchAmbiguous
        "ROUTING_COMPILE_FAILED" -> LaneShadowError.RoutingCompileFailed
        "CONDITIONS_LOOKUP_FAILED" -> LaneShadowError.ConditionsLookupFailed

        // Convex planning codes
        "AGENT_RESPONSE_INVALID" -> LaneShadowError.AgentResponseInvalid
        "NO_ROUTES_GENERATED" -> LaneShadowError.NoRoutesGenerated
        "AGENT_TIMEOUT" -> LaneShadowError.AgentTimeout
        "INVALID_AGENT_RESPONSE_STRUCTURE" -> LaneShadowError.InvalidAgentResponseStructure
        "PLAN_ALREADY_ACTIVE" -> LaneShadowError.PlanAlreadyActive
        "PLAN_NOT_FOUND" -> LaneShadowError.PlanNotFound
        "RATE_LIMIT_EXCEEDED" -> LaneShadowError.RateLimitExceeded
        "LOW_CONFIDENCE_PARSE" -> LaneShadowError.LowConfidenceParse
        "GENERATION_FAILED" -> LaneShadowError.GenerationFailed
        "AGENTIC_PARSE_FAILED" -> LaneShadowError.AgenticParseFailed
        "PLAN_LIMIT_EXCEEDED" -> LaneShadowError.PlanLimitExceeded
        "SESSION_NOT_FOUND" -> LaneShadowError.SessionNotFound
        "INVALID_CONTENT" -> LaneShadowError.InvalidContent
        "AGENT_BUDGET_EXCEEDED" -> LaneShadowError.AgentBudgetExceeded
        "AGENT_LOOP_DETECTED" -> LaneShadowError.AgentLoopDetected
        "WEATHER_UNAVAILABLE" -> LaneShadowError.WeatherUnavailable

        // Auth redirect
        "UNAUTHENTICATED" -> LaneShadowError.Unauthenticated
        "FORBIDDEN" -> LaneShadowError.Forbidden

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

internal fun String.toKnownErrorCode(): String? {
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
    // Server library codes
    "AUTH_REQUIRED",
    "SESSION_REQUIRED",
    "USER_NOT_FOUND",
    "NO_FIELDS_TO_UPDATE",
    "NOT_FOUND",
    "INVALID_INPUT",
    "LLM_SKETCH_INVALID",
    "LLM_SKETCH_AMBIGUOUS",
    "ROUTING_COMPILE_FAILED",
    "CONDITIONS_LOOKUP_FAILED",

    // Convex planning codes
    "AGENT_RESPONSE_INVALID",
    "NO_ROUTES_GENERATED",
    "AGENT_TIMEOUT",
    "INVALID_AGENT_RESPONSE_STRUCTURE",
    "PLAN_ALREADY_ACTIVE",
    "PLAN_NOT_FOUND",
    "RATE_LIMIT_EXCEEDED",
    "LOW_CONFIDENCE_PARSE",
    "GENERATION_FAILED",
    "AGENTIC_PARSE_FAILED",
    "PLAN_LIMIT_EXCEEDED",
    "SESSION_NOT_FOUND",
    "INVALID_CONTENT",
    "AGENT_BUDGET_EXCEEDED",
    "AGENT_LOOP_DETECTED",
    "WEATHER_UNAVAILABLE",

    // Auth redirect
    "UNAUTHENTICATED",
    "FORBIDDEN",
)
