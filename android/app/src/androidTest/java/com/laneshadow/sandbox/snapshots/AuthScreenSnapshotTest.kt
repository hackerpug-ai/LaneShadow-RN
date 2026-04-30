package com.laneshadow.sandbox.snapshots

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Screenshot evidence for .spec/design/system/views/auth-screen/auth-screen.html.
 *
 * These focused cases keep the AuthScreen parity IDs visible even though
 * AllStoriesSnapshotTest also snapshots every registered sandbox story.
 */
@RunWith(AndroidJUnit4::class)
class AuthScreenSnapshotTest : SandboxSnapshotTestBase() {
    @Test
    fun emailEntry_light() {
        captureStorySnapshot("templates.auth-screen.email-entry", isDarkTheme = false)
    }

    @Test
    fun existingUser_light() {
        captureStorySnapshot("templates.auth-screen.existing-user", isDarkTheme = false)
    }

    @Test
    fun newUser_light() {
        captureStorySnapshot("templates.auth-screen.new-user", isDarkTheme = false)
    }

    @Test
    fun invalidEmail_light() {
        captureStorySnapshot("templates.auth-screen.invalid-email", isDarkTheme = false)
    }

    @Test
    fun submitting_light() {
        captureStorySnapshot("templates.auth-screen.submitting", isDarkTheme = false)
    }

    @Test
    fun dark() {
        captureStorySnapshot("templates.auth-screen.dark", isDarkTheme = true)
    }
}
