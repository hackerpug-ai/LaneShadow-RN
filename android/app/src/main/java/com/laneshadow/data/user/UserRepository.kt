package com.laneshadow.data.user

import dev.convex.android.ConvexClient
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

data class CurrentUser(
    val id: String = "",
    val displayName: String,
    val email: String = "",
)

interface UserRepository {
    fun subscribeToCurrentUser(): Flow<CurrentUser?>
}

@Singleton
class UserRepositoryImpl @Inject constructor(
    private val convexClient: ConvexClient,
) : UserRepository {
    override fun subscribeToCurrentUser(): Flow<CurrentUser?> =
        convexClient.subscribe<CurrentUserDto?>(
            name = "db/users:getCurrentUser",
        ).map { result ->
            result.getOrNull()?.toDomain()
        }.catch {
            emit(null)
        }
}

@Serializable
private data class CurrentUserDto(
    @SerialName("_id") val id: String = "",
    val name: String = "",
    val email: String = "",
) {
    fun toDomain(): CurrentUser {
        val displayName = name.ifBlank {
            email.substringBefore("@").takeIf { it.isNotBlank() } ?: "Rider"
        }
        return CurrentUser(
            id = id,
            displayName = displayName,
            email = email,
        )
    }
}
