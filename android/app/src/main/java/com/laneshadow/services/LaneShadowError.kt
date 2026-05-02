package com.laneshadow.services

import androidx.annotation.StringRes
import com.laneshadow.R
import java.io.IOException

sealed class LaneShadowError(
    @get:StringRes val messageResId: Int,
    open val originalCode: String? = null,
) {
    data object Unauthenticated : LaneShadowError(
        messageResId = R.string.error_unauthenticated,
        originalCode = "UNAUTHENTICATED",
    )

    data object AuthRequired : LaneShadowError(
        messageResId = R.string.error_auth_required,
        originalCode = "AUTH_REQUIRED",
    )

    data object SessionNotFound : LaneShadowError(
        messageResId = R.string.error_session_not_found,
        originalCode = "SESSION_NOT_FOUND",
    )

    data object RateLimitExceeded : LaneShadowError(
        messageResId = R.string.error_rate_limit_exceeded,
        originalCode = "RATE_LIMIT_EXCEEDED",
    )

    data object PlanLimitExceeded : LaneShadowError(
        messageResId = R.string.error_plan_limit_exceeded,
        originalCode = "PLAN_LIMIT_EXCEEDED",
    )

    data object PlanAlreadyActive : LaneShadowError(
        messageResId = R.string.error_plan_already_active,
        originalCode = "PLAN_ALREADY_ACTIVE",
    )

    data object AgentTimeout : LaneShadowError(
        messageResId = R.string.error_agent_timeout,
        originalCode = "AGENT_TIMEOUT",
    )

    data class NetworkTimeout(
        val originalCause: IOException,
    ) : LaneShadowError(
        messageResId = R.string.error_network_timeout,
        originalCode = "NETWORK_TIMEOUT",
    )

    data object NotFound : LaneShadowError(
        messageResId = R.string.error_not_found,
        originalCode = "NOT_FOUND",
    )

    data object InvalidInput : LaneShadowError(
        messageResId = R.string.error_invalid_input,
        originalCode = "INVALID_INPUT",
    )

    data class Unknown(
        val originalMessage: String?,
        override val originalCode: String? = null,
    ) : LaneShadowError(
        messageResId = R.string.error_unknown,
        originalCode = originalCode,
    )
}
