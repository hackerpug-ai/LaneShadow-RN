package com.laneshadow.data.savedroutes

import android.net.Uri
import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Test

class SavedRouteRepositoryTest {
    @Test
    fun matchesFingerprint_readsPastFirstCappedSavedRoutesPage() = runTest {
        val repository = PagingSavedRouteRepository(
            pagesByBeforeDate = mapOf(
                null to savedRoutesPage(
                    createdAtRange = 1_000L downTo 951L,
                    matchingFingerprint = null,
                ),
                950L to savedRoutesPage(
                    createdAtRange = 950L downTo 949L,
                    matchingFingerprint = TargetFingerprint,
                ),
            ),
        )

        val matches = repository.matchesFingerprint(TargetFingerprint).first()

        assertThat(matches).isTrue()
        assertThat(repository.requestedBeforeDates).containsExactly(null, 950L).inOrder()
    }

    private class PagingSavedRouteRepository(
        private val pagesByBeforeDate: Map<Long?, JsonElement>,
    ) : SavedRouteRepository(NoopAuthRepository) {
        val requestedBeforeDates = mutableListOf<Long?>()

        override suspend fun authenticateSavedRoutesClient() = Unit

        override fun observeSavedRoutesPage(beforeDate: Long?): Flow<Result<JsonElement>> {
            requestedBeforeDates += beforeDate
            return flowOf(Result.success(requireNotNull(pagesByBeforeDate[beforeDate])))
        }
    }

    private object NoopAuthRepository : AuthRepository {
        private val authState = MutableStateFlow<AuthState>(AuthState.SignedOut)

        override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
            unsupported()

        override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
            unsupported()

        override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> =
            unsupported()

        override suspend fun signOut(): Result<Unit> = Result.success(Unit)

        override suspend fun handleUnauthenticated(message: String): Result<Unit> =
            Result.success(Unit)

        override suspend fun signInWithGoogle(): Result<ClerkUser> = unsupported()

        override suspend fun signInWithApple(): Result<ClerkUser> = unsupported()

        override suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser> = unsupported()

        override suspend fun getJwtForConvex(): String = "test-token"

        override suspend fun bypassForTesting(): Result<ClerkUser> = unsupported()

        override suspend fun e2eBypassWithCredentials(email: String, password: String): Result<ClerkUser> = unsupported()

        override fun observeAuthState(): kotlinx.coroutines.flow.StateFlow<AuthState> = authState

        private fun <T> unsupported(): Result<T> =
            Result.failure(UnsupportedOperationException("Not used in SavedRouteRepositoryTest"))
    }

    private companion object {
        const val TargetFingerprint = "fnv1a:target"

        fun savedRoutesPage(
            createdAtRange: LongProgression,
            matchingFingerprint: String?,
        ): JsonObject =
            buildJsonObject {
                put(
                    "routes",
                    buildJsonArray {
                        createdAtRange.forEachIndexed { index, createdAt ->
                            add(
                                savedRouteJson(
                                    savedRouteId = "saved-$createdAt",
                                    createdAt = createdAt,
                                    routeFingerprint = matchingFingerprint.takeIf { index == createdAtRange.count() - 1 }
                                        ?: "fnv1a:$createdAt",
                                ),
                            )
                        }
                    },
                )
            }

        fun savedRouteJson(
            savedRouteId: String,
            createdAt: Long,
            routeFingerprint: String,
        ): JsonObject =
            buildJsonObject {
                put("savedRouteId", JsonPrimitive(savedRouteId))
                put("createdAt", JsonPrimitive(createdAt))
                put(
                    "routeIndex",
                    buildJsonObject {
                        put("routeFingerprint", JsonPrimitive(routeFingerprint))
                    },
                )
            }
    }
}
