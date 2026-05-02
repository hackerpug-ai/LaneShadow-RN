package com.laneshadow.services

import com.google.common.truth.Truth.assertThat
import com.laneshadow.R
import java.io.IOException
import org.junit.Test

class LaneShadowErrorTest {
    @Test
    fun toLaneShadowError_knownServerCodes_mapToTypedVariants() {
        val cases = listOf(
            "AGENT_TIMEOUT" to LaneShadowError.AgentTimeout,
            "PLAN_LIMIT_EXCEEDED" to LaneShadowError.PlanLimitExceeded,
            "SESSION_NOT_FOUND" to LaneShadowError.SessionNotFound,
            "RATE_LIMIT_EXCEEDED" to LaneShadowError.RateLimitExceeded,
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
    fun messageResId_agentTimeout_returnsRStringErrorAgentTimeout() {
        assertThat(LaneShadowError.AgentTimeout.messageResId)
            .isEqualTo(R.string.error_agent_timeout)
    }
}
