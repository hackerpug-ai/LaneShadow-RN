package com.laneshadow.services

import androidx.annotation.StringRes
import com.laneshadow.R
import java.io.IOException

sealed class LaneShadowError(
    @get:StringRes val messageResId: Int,
    open val originalCode: String,
) {
    // Server library errors
    data object AuthRequired : LaneShadowError(
        messageResId = R.string.error_auth_required,
        originalCode = "AUTH_REQUIRED",
    )

    data object SessionRequired : LaneShadowError(
        messageResId = R.string.error_session_required,
        originalCode = "SESSION_REQUIRED",
    )

    data object UserNotFound : LaneShadowError(
        messageResId = R.string.error_user_not_found,
        originalCode = "USER_NOT_FOUND",
    )

    data object NoFieldsToUpdate : LaneShadowError(
        messageResId = R.string.error_no_fields_to_update,
        originalCode = "NO_FIELDS_TO_UPDATE",
    )

    data object NotFound : LaneShadowError(
        messageResId = R.string.error_not_found,
        originalCode = "NOT_FOUND",
    )

    data object InvalidInput : LaneShadowError(
        messageResId = R.string.error_invalid_input,
        originalCode = "INVALID_INPUT",
    )

    data object LlmSketchInvalid : LaneShadowError(
        messageResId = R.string.error_llm_sketch_invalid,
        originalCode = "LLM_SKETCH_INVALID",
    )

    data object LlmSketchAmbiguous : LaneShadowError(
        messageResId = R.string.error_llm_sketch_ambiguous,
        originalCode = "LLM_SKETCH_AMBIGUOUS",
    )

    data object RoutingCompileFailed : LaneShadowError(
        messageResId = R.string.error_routing_compile_failed,
        originalCode = "ROUTING_COMPILE_FAILED",
    )

    data object ConditionsLookupFailed : LaneShadowError(
        messageResId = R.string.error_conditions_lookup_failed,
        originalCode = "CONDITIONS_LOOKUP_FAILED",
    )

    // Convex planning errors
    data object AgentResponseInvalid : LaneShadowError(
        messageResId = R.string.error_agent_response_invalid,
        originalCode = "AGENT_RESPONSE_INVALID",
    )

    data object NoRoutesGenerated : LaneShadowError(
        messageResId = R.string.error_no_routes_generated,
        originalCode = "NO_ROUTES_GENERATED",
    )

    data object AgentTimeout : LaneShadowError(
        messageResId = R.string.error_agent_timeout,
        originalCode = "AGENT_TIMEOUT",
    )

    data object InvalidAgentResponseStructure : LaneShadowError(
        messageResId = R.string.error_invalid_agent_response_structure,
        originalCode = "INVALID_AGENT_RESPONSE_STRUCTURE",
    )

    data object PlanAlreadyActive : LaneShadowError(
        messageResId = R.string.error_plan_already_active,
        originalCode = "PLAN_ALREADY_ACTIVE",
    )

    data object PlanNotFound : LaneShadowError(
        messageResId = R.string.error_plan_not_found,
        originalCode = "PLAN_NOT_FOUND",
    )

    data object RateLimitExceeded : LaneShadowError(
        messageResId = R.string.error_rate_limit_exceeded,
        originalCode = "RATE_LIMIT_EXCEEDED",
    )

    data object LowConfidenceParse : LaneShadowError(
        messageResId = R.string.error_low_confidence_parse,
        originalCode = "LOW_CONFIDENCE_PARSE",
    )

    data object GenerationFailed : LaneShadowError(
        messageResId = R.string.error_generation_failed,
        originalCode = "GENERATION_FAILED",
    )

    data object AgenticParseFailed : LaneShadowError(
        messageResId = R.string.error_agentic_parse_failed,
        originalCode = "AGENTIC_PARSE_FAILED",
    )

    data object PlanLimitExceeded : LaneShadowError(
        messageResId = R.string.error_plan_limit_exceeded,
        originalCode = "PLAN_LIMIT_EXCEEDED",
    )

    data object SessionNotFound : LaneShadowError(
        messageResId = R.string.error_session_not_found,
        originalCode = "SESSION_NOT_FOUND",
    )

    data object InvalidContent : LaneShadowError(
        messageResId = R.string.error_invalid_content,
        originalCode = "INVALID_CONTENT",
    )

    data object AgentBudgetExceeded : LaneShadowError(
        messageResId = R.string.error_agent_budget_exceeded,
        originalCode = "AGENT_BUDGET_EXCEEDED",
    )

    data object AgentLoopDetected : LaneShadowError(
        messageResId = R.string.error_agent_loop_detected,
        originalCode = "AGENT_LOOP_DETECTED",
    )

    data object WeatherUnavailable : LaneShadowError(
        messageResId = R.string.error_weather_unavailable,
        originalCode = "WEATHER_UNAVAILABLE",
    )

    // Network-level error
    data class NetworkTimeout(
        val originalCause: IOException,
    ) : LaneShadowError(
        messageResId = R.string.error_network_timeout,
        originalCode = "NETWORK_TIMEOUT",
    )

    // Auth redirect (maps to SESSION_NOT_FOUND or timeout scenarios)
    data object Unauthenticated : LaneShadowError(
        messageResId = R.string.error_unauthenticated,
        originalCode = "UNAUTHENTICATED",
    )

    data object Forbidden : LaneShadowError(
        messageResId = R.string.error_forbidden,
        originalCode = "FORBIDDEN",
    )

    // Fallback for unmapped errors
    data class Unknown(
        val originalMessage: String?,
        override val originalCode: String = "UNKNOWN",
    ) : LaneShadowError(
        messageResId = R.string.error_unknown,
        originalCode = originalCode,
    )
}
