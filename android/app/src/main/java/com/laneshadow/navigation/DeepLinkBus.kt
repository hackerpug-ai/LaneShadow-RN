package com.laneshadow.navigation

import android.net.Uri
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

object DeepLinkBus {
    private val _callbacks = MutableSharedFlow<Uri>(
        replay = 1,
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )
    val callbacks: SharedFlow<Uri> = _callbacks.asSharedFlow()
    var latestCallbackUri: Uri? = null
        private set

    fun publish(callbackUri: Uri) {
        latestCallbackUri = callbackUri
        _callbacks.tryEmit(callbackUri)
    }

    fun consumeLatest() {
        latestCallbackUri = null
        _callbacks.resetReplayCache()
    }
}
