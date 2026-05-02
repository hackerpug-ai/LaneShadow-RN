package com.laneshadow.data.user

import com.laneshadow.services.ConvexClientProvider
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

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
    private val convexClientProvider: ConvexClientProvider,
) : UserRepository {
    override fun subscribeToCurrentUser(): Flow<CurrentUser?> =
        convexClientProvider.observeCurrentUser().map { user ->
            user?.toDomain()
        }
}

private fun com.laneshadow.services.ConvexCurrentUser.toDomain(): CurrentUser =
    CurrentUser(
        id = id,
        displayName = displayName,
        email = email,
    )
