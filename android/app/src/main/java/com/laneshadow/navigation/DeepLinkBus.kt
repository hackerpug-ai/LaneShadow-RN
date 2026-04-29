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

    fun publish(callbackUri: Uri) {
        _callbacks.tryEmit(callbackUri)
    }

    fun consumeLatest() {
        _callbacks.resetReplayCache()
    }
}
