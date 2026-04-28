package com.laneshadow.services

import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Test

class ConvexClientProviderContractTest {
    @Test
    fun ac1_gradleIncludesConvexMobileDependency() {
        val source = File("build.gradle.kts").readText()
        assertTrue(source.contains("dev.convex:android-convexmobile"))
    }

    @Test
    fun ac2_providerSingletonWrapperExists() {
        val source = File("src/main/java/com/laneshadow/services/ConvexClientProvider.kt").readText()
        assertTrue(source.contains("@Singleton"))
        assertTrue(source.contains("class ConvexClientProvider"))
    }

    @Test
    fun ac3_sessionsFlowExposed() {
        val source = File("src/main/java/com/laneshadow/services/ConvexClientProvider.kt").readText()
        assertTrue(source.contains("fun observeSessions(): Flow<List<Session>>"))
    }

    @Test
    fun ac4_suspendMutationsImplemented() {
        val source = File("src/main/java/com/laneshadow/services/ConvexClientProvider.kt").readText()
        assertTrue(source.contains("suspend fun sendMessage("))
        assertTrue(source.contains("suspend fun createSession("))
    }

    @Test
    fun ac5_authCallbackBindsJwt() {
        val source = File("src/main/java/com/laneshadow/services/ConvexClientProvider.kt").readText()
        assertTrue(source.contains("getJwtForConvex()"))
    }

    @Test
    fun ac6_hiltModuleProvidesSingleton() {
        val source = File("src/main/java/com/laneshadow/di/ConvexModule.kt").readText()
        assertTrue(source.contains("@Module"))
        assertTrue(source.contains("@InstallIn(SingletonComponent::class)"))
        assertTrue(source.contains("@Singleton"))
        assertTrue(source.contains("fun provideConvexClientProvider"))
    }
}
