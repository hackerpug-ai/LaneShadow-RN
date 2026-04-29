package com.laneshadow.di

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.repository.ClerkGateway
import com.laneshadow.data.repository.OAuthGateway
import org.junit.Test

class AuthModuleProviderTest {
    @Test
    fun providers_resolvePrimaryTypes_withoutReflectionStubs() {
        val gateway: ClerkGateway = AuthModule.provideClerkGateway()
        val oauthGateway: OAuthGateway = AuthModule.provideOAuthGateway()

        assertThat(gateway::class.java.simpleName).isEqualTo("ClerkSdkGateway")
        assertThat(oauthGateway::class.java.simpleName).isEqualTo("ClerkSdkOAuthGateway")
    }
}
