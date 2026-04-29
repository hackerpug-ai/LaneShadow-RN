package com.laneshadow.navigation

import android.net.Uri
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.coroutines.withTimeout
import org.junit.Test
import org.mockito.Mockito.mock

class DeepLinkBusTest {
    @Test
    fun callbacks_whenPublishedBeforeCollector_stillDeliversToLateSubscriber() = runTest {
        val callbackUri = mock(Uri::class.java)

        DeepLinkBus.consumeLatest()
        DeepLinkBus.publish(callbackUri)

        val received = withTimeout<Uri>(500) {
            DeepLinkBus.callbacks.first()
        }

        assertThat(received).isEqualTo(callbackUri)
    }

    @Test
    fun callbacks_afterConsumeLatest_doNotReplayToNextSubscriber() = runTest {
        val callbackUri = mock(Uri::class.java)

        DeepLinkBus.consumeLatest()
        DeepLinkBus.publish(callbackUri)
        withTimeout<Uri>(500) { DeepLinkBus.callbacks.first() }
        DeepLinkBus.consumeLatest()

        val replayed = withTimeoutOrNull(250) { DeepLinkBus.callbacks.first() }
        assertThat(replayed).isNull()
    }
}
