package com.laneshadow.sandbox.snapshots

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.sandbox.LaneShadowSandboxEntry
import com.nativesandbox.model.Story
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized

/**
 * Comprehensive snapshot tests for ALL sandbox stories.
 *
 * AC-2: Per-story light + dark snapshots
 * AC-3: Naming convention {tier}.{component}.{variant}.{theme}.png
 *
 * FIX 2: Converted to JUnit4 Parameterized runner to emit 2×N test cases
 * instead of a single loop. JUnit report now shows individual parameterized
 * test rows like: "snapshot[atoms.button.primary.light]", "snapshot[atoms.button.primary.dark]", etc.
 *
 * Test output directory: android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/
 * Reference PNGs: {sanitized_story_id}.{theme}.png
 * Example: atoms.button.primary.light.png, tokens.color-swatches.all.dark.png
 *
 * Run with: ./gradlew :app:connectedDebugAndroidTest
 * Record baseline: RECORD_DROPSHOTS=true ./gradlew :app:connectedDebugAndroidTest
 */
@RunWith(Parameterized::class)
class AllStoriesSnapshotTest(
    private val story: Story,
    private val isDarkTheme: Boolean,
) : SandboxSnapshotTestBase() {

    companion object {
        @JvmStatic
        @Parameterized.Parameters(name = "snapshot[{0}.{1}]")
        fun data(): Collection<Array<Any>> {
            val allStories = LaneShadowSandboxEntry.getAllStories()
            return allStories.flatMap { story ->
                listOf(
                    arrayOf<Any>(story, false), // light
                    arrayOf<Any>(story, true),  // dark
                )
            }
        }
    }

    /**
     * AC-2: Light + dark snapshots for each story variant.
     *
     * JUnit Parameterized runner invokes this test once for each (story, isDarkTheme) pair.
     * The test name in the report includes the story ID and theme, e.g.:
     * "snapshot[atoms.button.primary.false]" for light, "snapshot[atoms.button.primary.true]" for dark.
     */
    @Test
    fun snapshot() {
        captureStorySnapshot(
            story = story.id,
            isDarkTheme = isDarkTheme,
        )
    }
}
