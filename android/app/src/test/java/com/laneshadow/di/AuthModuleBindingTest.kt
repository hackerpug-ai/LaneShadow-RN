package com.laneshadow.di

import com.google.common.truth.Truth.assertThat
import org.junit.Test

class AuthModuleBindingTest {
    @Test
    fun authBindingsModule_exposesPrimaryAndFallbackRepositoryBindings() {
        val methodNames = AuthBindingsModule::class.java.declaredMethods.map { it.name }

        assertThat(methodNames).contains("bindPrimaryAuthRepository")
        assertThat(methodNames).contains("bindFallbackAuthRepository")
    }
}
