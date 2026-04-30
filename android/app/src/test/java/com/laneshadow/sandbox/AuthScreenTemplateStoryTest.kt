package com.laneshadow.sandbox

import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Test

class AuthScreenTemplateStoryTest {
    @Test
    fun auth_screen_template_story_ids_are_registered() {
        val templateStories = File("../app/src/debug/java/com/laneshadow/sandbox/stories/templates/TemplateStories.kt").readText()
        val authStory = File("../app/src/debug/java/com/laneshadow/sandbox/stories/templates/AuthScreenStory.kt").readText()

        assertTrue(templateStories.contains("AuthScreenStory.all"))
        listOf(
            "templates.auth-screen.email-entry",
            "templates.auth-screen.existing-user",
            "templates.auth-screen.new-user",
            "templates.auth-screen.invalid-email",
            "templates.auth-screen.submitting",
            "templates.auth-screen.dark",
        ).forEach { id ->
            assertTrue("Missing auth template story id: $id", authStory.contains(id))
        }
        assertTrue(authStory.contains("auth-screen.html"))
    }
}
