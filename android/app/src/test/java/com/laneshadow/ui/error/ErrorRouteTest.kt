package com.laneshadow.ui.error

import com.google.common.truth.Truth.assertThat
import com.laneshadow.services.LaneShadowError
import java.io.IOException
import org.junit.Test

class ErrorRouteTest {
    @Test
    fun errorRoute_encodesCodeAndMessage() {
        val route = errorRoute(
            LaneShadowError.NetworkTimeout(
                IOException("offline & weak signal"),
            ),
        )

        assertThat(route).isEqualTo(
            "error?code=NETWORK_TIMEOUT&message=offline%20%26%20weak%20signal",
        )
    }
}
