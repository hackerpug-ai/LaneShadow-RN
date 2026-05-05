package com.laneshadow.e2e.auth

import android.content.Context
import android.content.Intent
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextClearance
import androidx.compose.ui.test.performTextInput
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.EXTRA_RESET_AUTH
import com.laneshadow.MainActivity
import java.io.File
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AuthSignInE2ETest {

    @get:Rule
    val composeRule = createEmptyComposeRule()

    private var scenario: ActivityScenario<MainActivity>? = null
    private lateinit var config: LiveAuthConfig
    private lateinit var screenshotDir: File

    @Before
    fun setUp() {
        config = LiveAuthConfig.fromInstrumentation()
        screenshotDir = File(
            ApplicationProvider.getApplicationContext<Context>().getExternalFilesDir(null),
            "e2e-screenshots/auth-signin",
        )
        screenshotDir.deleteRecursively()
        screenshotDir.mkdirs()
    }

    @After
    fun tearDown() {
        scenario?.close()
        scenario = null
    }

    @Test
    fun emailPasswordSignInAndRestoresSession() {
        launchApp(resetAuth = true)
        waitForTag("auth_continue_with_email")
        clickTag("auth_continue_with_email")
        waitForTag("auth_email_field")
        captureScreenshot(screenshotDir, "android-login-start")

        enterText("auth_email_field", config.loginEmail)
        clickTag("auth_continue_button")
        waitForTag("auth_password_field")

        enterText("auth_password_field", config.loginPassword)
        clickTag("auth_sign_in_button")
        waitForAuthenticatedGreeting()
        captureScreenshot(screenshotDir, "android-login-authenticated")

        relaunch(resetAuth = false)
        waitForAuthenticatedGreeting()
        captureScreenshot(screenshotDir, "android-login-restored")
    }

    private fun launchApp(resetAuth: Boolean) {
        scenario?.close()
        val context = ApplicationProvider.getApplicationContext<Context>()
        val intent = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (resetAuth) putExtra(EXTRA_RESET_AUTH, true)
        }
        scenario = ActivityScenario.launch(intent)
        composeRule.waitForIdle()
    }

    private fun relaunch(resetAuth: Boolean) = launchApp(resetAuth)

    private fun waitForTag(tag: String, timeoutMillis: Long = 30_000) {
        composeRule.waitUntil(timeoutMillis = timeoutMillis) {
            composeRule.onAllNodes(hasTestTag(tag), useUnmergedTree = true)
                .fetchSemanticsNodes()
                .isNotEmpty()
        }
    }

    private fun waitForAuthenticatedGreeting(timeoutMillis: Long = 90_000) {
        composeRule.waitUntil(timeoutMillis = timeoutMillis) {
            composeRule.onAllNodesWithText("Where are we riding today", substring = true)
                .fetchSemanticsNodes()
                .isNotEmpty()
        }
        waitForTag("auth_landing_logout")
    }

    private fun enterText(tag: String, value: String) {
        composeRule.onNodeWithTag(tag).performTextClearance()
        composeRule.onNodeWithTag(tag).performTextInput(value)
    }

    private fun clickTag(tag: String) {
        composeRule.onNodeWithTag(tag, useUnmergedTree = true).performClick()
    }
}
