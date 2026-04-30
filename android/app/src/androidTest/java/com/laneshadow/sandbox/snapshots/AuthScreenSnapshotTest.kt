package com.laneshadow.sandbox.snapshots

import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized

/**
 * Screenshot evidence for .spec/design/system/views/auth-screen/auth-screen.html.
 *
 * These focused cases keep the AuthScreen parity IDs visible even though
 * AllStoriesSnapshotTest also snapshots every registered sandbox story.
 */
@RunWith(Parameterized::class)
class AuthScreenSnapshotTest(
    private val storyId: String,
    private val isDarkTheme: Boolean,
) : SandboxSnapshotTestBase() {
    @Test
    fun snapshot() {
        captureStorySnapshot(storyId, isDarkTheme)
    }

    companion object {
        private val authScreenStoryIds = listOf(
            "templates.auth-screen.email-entry",
            "templates.auth-screen.existing-user",
            "templates.auth-screen.new-user",
            "templates.auth-screen.invalid-email",
            "templates.auth-screen.submitting",
            "templates.auth-screen.dark",
        )

        @JvmStatic
        @Parameterized.Parameters(name = "snapshot[{0}.{1}]")
        fun data(): Collection<Array<Any>> =
            authScreenStoryIds.flatMap { storyId ->
                listOf(
                    arrayOf<Any>(storyId, false),
                    arrayOf<Any>(storyId, true),
                )
            }
    }
}
