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
}
