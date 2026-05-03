package com.laneshadow.services

import com.laneshadow.navigation.Route
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.withContext

sealed interface NavEvent {
    data class Navigate(val route: Route) : NavEvent
}

@Singleton
class SignOutFlow @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
    private val ioDispatcher: CoroutineDispatcher,
) {
    private val _events = MutableSharedFlow<NavEvent>(
        replay = 0,
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )

    val events: SharedFlow<NavEvent> = _events.asSharedFlow()

    suspend fun signOut() {
        withContext(ioDispatcher) {
            convexClientProvider.signOut()
        }

        _events.emit(NavEvent.Navigate(Route.SignIn))
    }
}
