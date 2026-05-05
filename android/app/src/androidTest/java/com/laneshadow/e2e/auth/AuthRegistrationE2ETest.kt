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
import java.time.Instant
import java.time.format.DateTimeFormatter
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AuthRegistrationE2ETest {

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
            "e2e-screenshots/auth-registration",
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
    fun emailPasswordRegistrationVerifyAndRestore() {
        val receivedAfter = DateTimeFormatter.ISO_INSTANT.format(Instant.now().minusSeconds(5))

        launchApp(resetAuth = true)
        waitForTag("auth_continue_with_email")
        clickTag("auth_continue_with_email")
        waitForTag("auth_email_field")

        clickTag("auth_signup_entry")
        waitForTag("auth_signup_email_field")
        captureScreenshot(screenshotDir, "android-registration-start")

        enterText("auth_signup_email_field", config.signupEmail)
        clickTag("auth_signup_continue_button")
        waitForTag("auth_signup_display_name_field")

        enterText("auth_signup_display_name_field", "LaneShadow E2E")
        enterText("auth_signup_password_field", config.signupPassword)
        clickTag("auth_signup_create_account_button")
        waitForTag("auth_verify_root", timeoutMillis = 45_000)
        captureScreenshot(screenshotDir, "android-registration-verification")

        val code = config.mailosaur.pollVerificationCode(
            sentTo = config.signupEmail,
            receivedAfter = receivedAfter,
        )
        enterText("auth_verify_code_input", code)
        clickTag("auth_verify_submit")
        waitForAuthenticatedGreeting()
        captureScreenshot(screenshotDir, "android-registration-authenticated")

        relaunch(resetAuth = false)
        waitForAuthenticatedGreeting()
        captureScreenshot(screenshotDir, "android-registration-restored")
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
