package com.laneshadow.di

import com.google.common.truth.Truth.assertThat
import java.io.File
import org.junit.Test

class RepositoryModuleContractTest {
    @Test
    fun repositoryModuleDoesNotExposeRawConvexClientBinding() {
        val source = File("src/main/java/com/laneshadow/di/RepositoryModule.kt").readText()

        assertThat(source).doesNotContain("provideConvexClient")
        assertThat(source).doesNotContain("ConvexClientWithAuth")
        assertThat(source).doesNotContain("ConvexClient")
    }

    @Test
    fun convexClientProviderSendMessageUsesAgentActionEndpoint() {
        val source = File("src/main/java/com/laneshadow/services/ConvexClientProvider.kt").readText()

        assertThat(source).contains("actions/agent/sendMessage:sendMessage")
        assertThat(source).doesNotContain("db/sessionMessages:send")
    }
}
