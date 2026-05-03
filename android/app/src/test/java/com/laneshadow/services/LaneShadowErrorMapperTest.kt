package com.laneshadow.services

import com.google.common.truth.Truth.assertThat
import org.junit.Test

class LaneShadowErrorMapperTest {
    @Test
    fun laneShadowErrorForCode_FORBIDDEN_mapsToForbidden() {
        val mapped = laneShadowErrorForCode("FORBIDDEN")

        assertThat(mapped).isEqualTo(LaneShadowError.Forbidden)
        assertThat(mapped?.originalCode).isEqualTo("FORBIDDEN")
    }

    @Test
    fun laneShadowErrorForCode_UNAUTHENTICATED_mapsToUnauthenticated() {
        val mapped = laneShadowErrorForCode("UNAUTHENTICATED")

        assertThat(mapped).isEqualTo(LaneShadowError.Unauthenticated)
        assertThat(mapped?.originalCode).isEqualTo("UNAUTHENTICATED")
    }

    @Test
    fun toKnownErrorCode_UNAUTHENTICATED_returnsUNAUTHENTICATED() {
        val code = "UNAUTHENTICATED".toKnownErrorCode()

        assertThat(code).isEqualTo("UNAUTHENTICATED")
    }

    @Test
    fun toKnownErrorCode_FORBIDDEN_returnsFORBIDDEN() {
        val code = "FORBIDDEN".toKnownErrorCode()

        assertThat(code).isEqualTo("FORBIDDEN")
    }

    @Test
    fun KnownErrorCodes_containsUNAUTHENTICATED() {
        // This test verifies UNAUTHENTICATED is in KnownErrorCodes
        // by checking that toKnownErrorCode returns it
        val code = "UNAUTHENTICATED".toKnownErrorCode()

        assertThat(code).isNotNull()
        assertThat(code).isEqualTo("UNAUTHENTICATED")
    }

    @Test
    fun KnownErrorCodes_containsFORBIDDEN() {
        // This test verifies FORBIDDEN is in KnownErrorCodes
        // by checking that toKnownErrorCode returns it
        val code = "FORBIDDEN".toKnownErrorCode()

        assertThat(code).isNotNull()
        assertThat(code).isEqualTo("FORBIDDEN")
    }

    @Test
    fun toLaneShadowError_forbiddenCodeString_mapsToForbidden() {
        val throwable = IllegalStateException("FORBIDDEN")

        val mapped = toLaneShadowError(throwable)

        assertThat(mapped).isEqualTo(LaneShadowError.Forbidden)
        assertThat(mapped.originalCode).isEqualTo("FORBIDDEN")
    }

    @Test
    fun toLaneShadowError_unauthenticatedCodeString_mapsToUnauthenticated() {
        val throwable = IllegalStateException("UNAUTHENTICATED")

        val mapped = toLaneShadowError(throwable)

        assertThat(mapped).isEqualTo(LaneShadowError.Unauthenticated)
        assertThat(mapped.originalCode).isEqualTo("UNAUTHENTICATED")
    }
}
