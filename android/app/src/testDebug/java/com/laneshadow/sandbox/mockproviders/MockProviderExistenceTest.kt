package com.laneshadow.sandbox.mockproviders

import org.junit.Test
import org.junit.Assert.assertNotNull
import org.junit.Assert.fail
import java.io.File

/**
 * TDD Phase: RED
 * AC-1: Six named providers exist
 *
 * This test verifies that all six Navigator screen mock provider files exist
 * in the correct location with the correct naming convention.
 */
class MockProviderExistenceTest {

    private val mockProvidersDir = File("src/debug/java/com/laneshadow/sandbox/mockproviders")

    @Test
    fun test_idleMockProvider_exists() {
        val file = File(mockProvidersDir, "IdleMockProvider.kt")
        if (!file.exists()) {
            fail("IdleMockProvider.kt does not exist at ${file.absolutePath}")
        }
        assertNotNull("IdleMockProvider.kt should exist", file)
    }

    @Test
    fun test_planningMockProvider_exists() {
        val file = File(mockProvidersDir, "PlanningMockProvider.kt")
        if (!file.exists()) {
            fail("PlanningMockProvider.kt does not exist at ${file.absolutePath}")
        }
        assertNotNull("PlanningMockProvider.kt should exist", file)
    }

    @Test
    fun test_routeResultsMockProvider_exists() {
        val file = File(mockProvidersDir, "RouteResultsMockProvider.kt")
        if (!file.exists()) {
            fail("RouteResultsMockProvider.kt does not exist at ${file.absolutePath}")
        }
        assertNotNull("RouteResultsMockProvider.kt should exist", file)
    }

    @Test
    fun test_routeDetailsMockProvider_exists() {
        val file = File(mockProvidersDir, "RouteDetailsMockProvider.kt")
        if (!file.exists()) {
            fail("RouteDetailsMockProvider.kt does not exist at ${file.absolutePath}")
        }
        assertNotNull("RouteDetailsMockProvider.kt should exist", file)
    }

    @Test
    fun test_sessionsMockProvider_exists() {
        val file = File(mockProvidersDir, "SessionsMockProvider.kt")
        if (!file.exists()) {
            fail("SessionsMockProvider.kt does not exist at ${file.absolutePath}")
        }
        assertNotNull("SessionsMockProvider.kt should exist", file)
    }

    @Test
    fun test_errorMockProvider_exists() {
        val file = File(mockProvidersDir, "ErrorMockProvider.kt")
        if (!file.exists()) {
            fail("ErrorMockProvider.kt does not exist at ${file.absolutePath}")
        }
        assertNotNull("ErrorMockProvider.kt should exist", file)
    }

    @Test
    fun test_all_six_providers_exist() {
        val requiredProviders = listOf(
            "IdleMockProvider.kt",
            "PlanningMockProvider.kt",
            "RouteResultsMockProvider.kt",
            "RouteDetailsMockProvider.kt",
            "SessionsMockProvider.kt",
            "ErrorMockProvider.kt"
        )

        val existingFiles = mockProvidersDir.listFiles()?.map { it.name }?.toSet() ?: emptySet()
        val missingProviders = requiredProviders.filter { it !in existingFiles }

        if (missingProviders.isNotEmpty()) {
            fail("Missing mock providers: ${missingProviders.joinToString()}")
        }
    }
}
