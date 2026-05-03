package com.laneshadow.ui.sandbox

import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.sandbox.stories.AppStories
import com.google.common.truth.Truth.assertThat
import org.junit.Test
import java.util.regex.Pattern

/**
 * Test AppStories naming conventions match iOS canonical IDs.
 *
 * AC: All story IDs match canonical regex:
 * ^templates\.(idle|planning|route-results|route-details|error|sessions)-screen\.[a-z0-9]+(-[a-z0-9]+)*$
 *
 * Cross-platform parity requirement: iOS and Android MUST share exact story IDs.
 */
class AppStoriesNamingTest {

    companion object {
        /**
         * Canonical story ID pattern from iOS R07 normalization.
         *
         * Format: templates.{screen-name}.{variant}
         * - screen-name: lowercase, hyphenated (e.g., "idle-screen", "route-results-screen")
         * - variant: lowercase, hyphenated, can include sprint prefix (e.g., "s02-typing-send", "v-first-ride")
         */
        val CANONICAL_PATTERN: Pattern = Pattern.compile(
            "^templates\\.(idle|planning|route-results|route-details|error|sessions)-screen\\.[a-z0-9]+(-[a-z0-9]+)*$"
        )

        /**
         * Valid screen names for sprint-04 templates.
         */
        val VALID_SCREEN_NAMES = setOf(
            "idle-screen",
            "planning-screen",
            "route-results-screen",
            "route-details-screen",
            "error-screen",
            "sessions-screen"
        )
    }

    @Test
    fun `All template story IDs match canonical pattern`() {
        val allStories = AppStories.all
        val templateStories = allStories.filter { it.tier == SandboxTier.Template }

        templateStories.forEach { story ->
            val matcher = CANONICAL_PATTERN.matcher(story.id)
            assertThat(matcher.matches()).isTrue()
        }
    }

    @Test
    fun `All template story IDs use valid screen names`() {
        val allStories = AppStories.all
        val templateStories = allStories.filter { it.tier == SandboxTier.Template }

        templateStories.forEach { story ->
            val screenName = extractScreenName(story.id)
            assertThat(VALID_SCREEN_NAMES).contains(screenName)
        }
    }

    @Test
    fun `All template story IDs use lowercase only`() {
        val allStories = AppStories.all
        val templateStories = allStories.filter { it.tier == SandboxTier.Template }

        templateStories.forEach { story ->
            assertThat(story.id).doesNotContainMatch("[A-Z]")
        }
    }

    @Test
    fun `All template story IDs use hyphens not underscores`() {
        val allStories = AppStories.all
        val templateStories = allStories.filter { it.tier == SandboxTier.Template }

        templateStories.forEach { story ->
            assertThat(story.id).doesNotContain("_")
        }
    }

    @Test
    fun `No duplicate story IDs exist`() {
        val allStories = AppStories.all
        val templateStories = allStories.filter { it.tier == SandboxTier.Template }

        val ids = templateStories.map { it.id }
        val uniqueIds = ids.toSet()

        assertThat(uniqueIds).hasSize(ids.size)
    }

    @Test
    fun `All story IDs start with templates prefix`() {
        val allStories = AppStories.all
        val templateStories = allStories.filter { it.tier == SandboxTier.Template }

        templateStories.forEach { story ->
            assertThat(story.id).startsWith("templates.")
        }
    }

    @Test
    fun `All story IDs have screen suffix`() {
        val allStories = AppStories.all
        val templateStories = allStories.filter { it.tier == SandboxTier.Template }

        templateStories.forEach { story ->
            assertThat(story.id).contains("-screen.")
        }
    }

    @Test
    fun `All story IDs have variant after screen`() {
        val allStories = AppStories.all
        val templateStories = allStories.filter { it.tier == SandboxTier.Template }

        templateStories.forEach { story ->
            val parts = story.id.split(".")
            assertThat(parts).hasSize(3) // templates, screen-name, variant

            val variant = parts[2]
            assertThat(variant).isNotEmpty()
        }
    }

    /**
     * Extract screen name from story ID.
     * Example: "templates.idle-screen.default" → "idle-screen"
     */
    private fun extractScreenName(storyId: String): String {
        val parts = storyId.split(".")
        return if (parts.size >= 2) {
            parts[1]
        } else {
            ""
        }
    }
}
