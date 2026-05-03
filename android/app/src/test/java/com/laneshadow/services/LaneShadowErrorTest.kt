package com.laneshadow.services

import com.google.common.truth.Truth.assertThat
import com.laneshadow.R
import java.io.IOException
import org.junit.Test

class LaneShadowErrorTest {
    @Test
    fun toLaneShadowError_currentServerAndPlanningCodes_mapToTypedVariants() {
        val cases = listOf(
            "AUTH_REQUIRED" to LaneShadowError.AuthRequired,
            "SESSION_REQUIRED" to LaneShadowError.SessionRequired,
            "USER_NOT_FOUND" to LaneShadowError.UserNotFound,
            "NO_FIELDS_TO_UPDATE" to LaneShadowError.NoFieldsToUpdate,
            "NOT_FOUND" to LaneShadowError.NotFound,
            "INVALID_INPUT" to LaneShadowError.InvalidInput,
            "LLM_SKETCH_INVALID" to LaneShadowError.LlmSketchInvalid,
            "LLM_SKETCH_AMBIGUOUS" to LaneShadowError.LlmSketchAmbiguous,
            "ROUTING_COMPILE_FAILED" to LaneShadowError.RoutingCompileFailed,
            "CONDITIONS_LOOKUP_FAILED" to LaneShadowError.ConditionsLookupFailed,
            "AGENT_RESPONSE_INVALID" to LaneShadowError.AgentResponseInvalid,
            "NO_ROUTES_GENERATED" to LaneShadowError.NoRoutesGenerated,
            "AGENT_TIMEOUT" to LaneShadowError.AgentTimeout,
            "INVALID_AGENT_RESPONSE_STRUCTURE" to LaneShadowError.InvalidAgentResponseStructure,
            "PLAN_ALREADY_ACTIVE" to LaneShadowError.PlanAlreadyActive,
            "PLAN_NOT_FOUND" to LaneShadowError.PlanNotFound,
            "RATE_LIMIT_EXCEEDED" to LaneShadowError.RateLimitExceeded,
            "LOW_CONFIDENCE_PARSE" to LaneShadowError.LowConfidenceParse,
            "GENERATION_FAILED" to LaneShadowError.GenerationFailed,
            "AGENTIC_PARSE_FAILED" to LaneShadowError.AgenticParseFailed,
            "PLAN_LIMIT_EXCEEDED" to LaneShadowError.PlanLimitExceeded,
            "SESSION_NOT_FOUND" to LaneShadowError.SessionNotFound,
            "INVALID_CONTENT" to LaneShadowError.InvalidContent,
            "AGENT_BUDGET_EXCEEDED" to LaneShadowError.AgentBudgetExceeded,
            "AGENT_LOOP_DETECTED" to LaneShadowError.AgentLoopDetected,
            "WEATHER_UNAVAILABLE" to LaneShadowError.WeatherUnavailable,
        )

        cases.forEach { (code, expected) ->
            val mapped = toLaneShadowError(IllegalStateException(code))

            assertThat(mapped).isEqualTo(expected)
            assertThat(mapped.originalCode).isEqualTo(code)
        }
    }

    @Test
    fun toLaneShadowError_ioException_mapsToNetworkTimeout() {
        val ioException = IOException("connection lost")

        val mapped = toLaneShadowError(ioException)

        assertThat(mapped).isInstanceOf(LaneShadowError.NetworkTimeout::class.java)
        assertThat(mapped.originalCode).isEqualTo("NETWORK_TIMEOUT")
        assertThat((mapped as LaneShadowError.NetworkTimeout).originalCause)
            .isSameInstanceAs(ioException)
    }

    @Test
    fun toLaneShadowError_unknownMessage_mapsToUnknownVariantPreservingMessage() {
        val throwable = RuntimeException("some unexpected internal error")

        val mapped = toLaneShadowError(throwable)

        assertThat(mapped).isEqualTo(
            LaneShadowError.Unknown(originalMessage = "some unexpected internal error"),
        )
        assertThat((mapped as LaneShadowError.Unknown).originalMessage)
            .isEqualTo("some unexpected internal error")
    }

    @Test
    fun messageResId_planLimitExceeded_returnsRStringErrorPlanLimitExceeded() {
        assertThat(LaneShadowError.PlanLimitExceeded.messageResId)
            .isEqualTo(R.string.error_plan_limit_exceeded)
    }

    @Test
    fun messageResId_agentTimeout_returnsRStringErrorAgentTimeout() {
        assertThat(LaneShadowError.AgentTimeout.messageResId)
            .isEqualTo(R.string.error_agent_timeout)
    }
}
