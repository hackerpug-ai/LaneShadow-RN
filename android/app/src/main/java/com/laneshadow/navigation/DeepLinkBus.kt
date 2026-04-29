package com.laneshadow.navigation

import android.net.Uri
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

object DeepLinkBus {
    private val _callbacks = MutableSharedFlow<Uri>(extraBufferCapacity = 8)
    val callbacks: SharedFlow<Uri> = _callbacks.asSharedFlow()

    fun publish(callbackUri: Uri) {
        _callbacks.tryEmit(callbackUri)
    }
}
