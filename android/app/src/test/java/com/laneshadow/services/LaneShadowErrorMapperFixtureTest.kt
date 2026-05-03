package com.laneshadow.services

import com.google.common.truth.Truth.assertThat
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import org.junit.Test

class LaneShadowErrorMapperFixtureTest {
    private val gson = Gson()

    data class FixtureEntry(
        val code: String,
        val description: String,
        val mobile_mapping_target: String,
    )

    @Test
    fun fixtureRoundTrip_everyCodeMapsToItsMobileMappingTarget() {
        val fixtureJson = loadFixture()
        val entries: List<FixtureEntry> = gson.fromJson(
            fixtureJson,
            object : TypeToken<List<FixtureEntry>>() {}.type,
        )

        val failures = mutableListOf<String>()

        entries.forEach { entry ->
            val mapped = laneShadowErrorForCode(entry.code)

            if (mapped == null) {
                failures.add("Code '${entry.code}' has no mapping in laneShadowErrorForCode")
            } else {
                // Map mobile_mapping_target string to actual LaneShadowError object
                val expectedClassName = when (entry.mobile_mapping_target) {
                    "Unauthenticated" -> "Unauthenticated"
                    "Forbidden" -> "Forbidden"
                    "AgentResponseInvalid" -> "AgentResponseInvalid"
                    "NoRoutesGenerated" -> "NoRoutesGenerated"
                    "AgentTimeout" -> "AgentTimeout"
                    "InvalidAgentResponseStructure" -> "InvalidAgentResponseStructure"
                    "PlanAlreadyActive" -> "PlanAlreadyActive"
                    "PlanNotFound" -> "PlanNotFound"
                    "RateLimitExceeded" -> "RateLimitExceeded"
                    "LowConfidenceParse" -> "LowConfidenceParse"
                    "NetworkTimeout" -> "NetworkTimeout"
                    "WeatherUnavailable" -> "WeatherUnavailable"
                    "GenerationFailed" -> "GenerationFailed"
                    "AgenticParseFailed" -> "AgenticParseFailed"
                    "PlanLimitExceeded" -> "PlanLimitExceeded"
                    "SessionNotFound" -> "SessionNotFound"
                    "InvalidContent" -> "InvalidContent"
                    "AgentBudgetExceeded" -> "AgentBudgetExceeded"
                    "AgentLoopDetected" -> "AgentLoopDetected"
                    else -> {
                        failures.add("Unknown mobile_mapping_target: ${entry.mobile_mapping_target}")
                        return@forEach
                    }
                }

                // Compare the error types by simple class name
                if (mapped.javaClass.simpleName != expectedClassName) {
                    failures.add(
                        "Code '${entry.code}' maps to ${mapped.javaClass.simpleName} " +
                            "but fixture expects ${entry.mobile_mapping_target} ($expectedClassName)",
                    )
                }
            }
        }

        if (failures.isNotEmpty()) {
            throw AssertionError(
                "Fixture round-trip failed:\n" + failures.joinToString("\n") { "- $it" },
            )
        }
    }

    @Test
    fun fixtureEntryCount_matchesExpected() {
        val fixtureJson = loadFixture()
        val entries: List<FixtureEntry> = gson.fromJson(
            fixtureJson,
            object : TypeToken<List<FixtureEntry>>() {}.type,
        )

        // Fixture has 19 entries (from spec)
        assertThat(entries).hasSize(19)
    }

    @Test
    fun fixture_containsUNAUTHENTICATED_entry() {
        val fixtureJson = loadFixture()
        val entries: List<FixtureEntry> = gson.fromJson(
            fixtureJson,
            object : TypeToken<List<FixtureEntry>>() {}.type,
        )

        val unauthenticated = entries.find { it.code == "UNAUTHENTICATED" }
        assertThat(unauthenticated).isNotNull()
        assertThat(unauthenticated?.mobile_mapping_target).isEqualTo("Unauthenticated")
    }

    @Test
    fun fixture_containsFORBIDDEN_entry() {
        val fixtureJson = loadFixture()
        val entries: List<FixtureEntry> = gson.fromJson(
            fixtureJson,
            object : TypeToken<List<FixtureEntry>>() {}.type,
        )

        val forbidden = entries.find { it.code == "FORBIDDEN" }
        assertThat(forbidden).isNotNull()
        assertThat(forbidden?.mobile_mapping_target).isEqualTo("Forbidden")
    }

    private fun loadFixture(): String {
        val inputStream = javaClass.classLoader
            .getResourceAsStream("auth-error-taxonomy.json")
            ?: throw AssertionError("Fixture file not found: auth-error-taxonomy.json")

        return inputStream.bufferedReader().use { it.readText() }
    }
}
