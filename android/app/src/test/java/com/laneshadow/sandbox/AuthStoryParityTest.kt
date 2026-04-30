package com.laneshadow.sandbox

import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Test

class AuthStoryParityTest {
    @Test
    fun auth_story_ids_are_registered_with_canonical_parity_keys() {
        val moleculesStories = File("../app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt").readText()
        val formFieldStory = File("../app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSFormFieldStory.kt").readText()
        val authProviderStory = File("../app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSAuthProviderButtonStory.kt").readText()

        assertTrue(moleculesStories.contains("LSAuthProviderButtonStory") || authProviderStory.contains("molecules.auth-provider-button.apple"))
        assertTrue(moleculesStories.contains("LSAuthProviderButtonStory") || authProviderStory.contains("molecules.auth-provider-button.google"))
        assertTrue(moleculesStories.contains("molecules.formfield.auth") || formFieldStory.contains("molecules.formfield.auth"))
    }

    @Test
    fun auth_snapshots_exist_for_light_and_dark_themes() {
        val screenshotDir = File("../app/src/androidTest/screenshots/AllStoriesSnapshotTest")
        val required = listOf(
            "molecules.auth-provider-button.apple.light.png",
            "molecules.auth-provider-button.apple.dark.png",
            "molecules.auth-provider-button.google.light.png",
            "molecules.auth-provider-button.google.dark.png",
            "molecules.formfield.auth.light.png",
            "molecules.formfield.auth.dark.png",
        )

        required.forEach { snapshot ->
            assertTrue("Missing snapshot baseline: $snapshot", File(screenshotDir, snapshot).exists())
        }
    }
}
