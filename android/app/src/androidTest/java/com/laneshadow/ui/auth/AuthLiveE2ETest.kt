package com.laneshadow.ui.auth

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.util.Base64
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
import androidx.test.platform.app.InstrumentationRegistry
import com.laneshadow.EXTRA_RESET_AUTH
import com.laneshadow.MainActivity
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.time.format.DateTimeFormatter
import java.util.UUID
import org.json.JSONObject
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AuthLiveE2ETest {
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
            "e2e-screenshots",
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
    fun emailPasswordLoginAndRegistrationVerifyAndRestore() {
        runLoginFlow()
        runRegistrationFlow()
    }

    private fun runLoginFlow() {
        launchApp(resetAuth = true)
        waitForTag("auth_continue_with_email")
        clickTag("auth_continue_with_email")
        waitForTag("auth_email_field")
        captureScreenshot("android-login-start")

        enterText("auth_email_field", config.loginEmail)
        clickTag("auth_continue_button")
        waitForTag("auth_password_field")

        enterText("auth_password_field", config.loginPassword)
        clickTag("auth_sign_in_button")
        waitForAuthenticatedGreeting()
        captureScreenshot("android-login-authenticated")

        relaunch(resetAuth = false)
        waitForAuthenticatedGreeting()
        captureScreenshot("android-login-restored")
    }

    private fun runRegistrationFlow() {
        val receivedAfter = DateTimeFormatter.ISO_INSTANT.format(Instant.now().minusSeconds(5))
        launchApp(resetAuth = true)
        waitForTag("auth_continue_with_email")
        clickTag("auth_continue_with_email")
        waitForTag("auth_email_field")

        clickTag("auth_signup_entry")
        waitForTag("auth_signup_email_field")
        captureScreenshot("android-registration-start")

        enterText("auth_signup_email_field", config.signupEmail)
        clickTag("auth_signup_continue_button")
        waitForTag("auth_signup_display_name_field")

        enterText("auth_signup_display_name_field", "LaneShadow E2E")
        enterText("auth_signup_password_field", config.signupPassword)
        clickTag("auth_signup_create_account_button")
        waitForTag("auth_verify_root", timeoutMillis = 45_000)
        captureScreenshot("android-registration-verification")

        val code = config.mailosaur.pollVerificationCode(
            sentTo = config.signupEmail,
            receivedAfter = receivedAfter,
        )
        enterText("auth_verify_code_input", code)
        clickTag("auth_verify_submit")
        waitForAuthenticatedGreeting()
        captureScreenshot("android-registration-authenticated")

        relaunch(resetAuth = false)
        waitForAuthenticatedGreeting()
        captureScreenshot("android-registration-restored")
    }

    private fun launchApp(resetAuth: Boolean) {
        scenario?.close()
        val context = ApplicationProvider.getApplicationContext<Context>()
        val intent = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (resetAuth) {
                putExtra(EXTRA_RESET_AUTH, true)
            }
        }
        scenario = ActivityScenario.launch(intent)
        composeRule.waitForIdle()
    }

    private fun relaunch(resetAuth: Boolean) {
        launchApp(resetAuth = resetAuth)
    }

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
        composeRule.onNodeWithTag(tag)
            .performTextClearance()
        composeRule.onNodeWithTag(tag)
            .performTextInput(value)
    }

    private fun clickTag(tag: String) {
        composeRule.onNodeWithTag(tag, useUnmergedTree = true)
            .performClick()
    }

    private fun captureScreenshot(name: String) {
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot() ?: return
        val file = File(screenshotDir, "$name.png")
        FileOutputStream(file).use { output ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
        }
        bitmap.recycle()
    }
}

private data class LiveAuthConfig(
    val loginEmail: String,
    val loginPassword: String,
    val signupPassword: String,
    val signupEmail: String,
    val mailosaur: MailosaurClient,
) {
    companion object {
        fun fromInstrumentation(): LiveAuthConfig {
            val args = InstrumentationRegistry.getArguments()
            val mailosaurDomain = args.requiredString("mailosaurDomain")
            val signupEmail = args.getString("signupEmail")?.takeIf { it.isNotBlank() }
                ?: generatedEmail(mailosaurDomain)

            return LiveAuthConfig(
                loginEmail = args.requiredString("clerkTestEmail"),
                loginPassword = args.requiredString("clerkTestPassword"),
                signupPassword = args.getString("signupPassword")?.takeIf { it.isNotBlank() } ?: generatedPassword(),
                signupEmail = signupEmail,
                mailosaur = MailosaurClient(
                    apiKey = args.requiredString("mailosaurApiKey"),
                    serverID = args.requiredString("mailosaurServerId"),
                ),
            )
        }

        private fun generatedEmail(domain: String): String =
            "android-e2e-${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(8)}@$domain"

        private fun generatedPassword(): String =
            "LaneShadow1!${UUID.randomUUID().toString().replace("-", "").take(12)}"
    }
}

private class MailosaurClient(
    private val apiKey: String,
    private val serverID: String,
) {
    fun pollVerificationCode(sentTo: String, receivedAfter: String, timeoutMillis: Long = 90_000): String {
        val deadline = System.currentTimeMillis() + timeoutMillis
        var lastError: Throwable? = null

        while (System.currentTimeMillis() < deadline) {
            try {
                val messageID = searchMessageId(sentTo = sentTo, receivedAfter = receivedAfter)
                if (messageID != null) {
                    extractCode(retrieveMessageBody(messageID))?.let { return it }
                }
            } catch (error: Throwable) {
                lastError = error
            }

            Thread.sleep(3_000)
        }

        throw AssertionError("Timed out waiting for Mailosaur code for $sentTo", lastError)
    }

    private fun searchMessageId(sentTo: String, receivedAfter: String): String? {
        val url = URL(
            "https://mailosaur.com/api/messages/search" +
                "?server=${serverID.urlEncoded()}" +
                "&itemsPerPage=10" +
                "&receivedAfter=${receivedAfter.urlEncoded()}",
        )
        val response = request(url, method = "POST", body = JSONObject(mapOf("sentTo" to sentTo)).toString())
        val items = JSONObject(response).optJSONArray("items") ?: return null
        if (items.length() == 0) {
            return null
        }
        return items.getJSONObject(0).getString("id")
    }

    private fun retrieveMessageBody(messageID: String): String {
        val response = request(URL("https://mailosaur.com/api/messages/${messageID.urlEncoded()}"))
        val json = JSONObject(response)
        val subject = json.optString("subject")
        val text = json.optJSONObject("text")?.optString("body").orEmpty()
        val html = json.optJSONObject("html")?.optString("body").orEmpty()
        return listOf(subject, text, html).joinToString(separator = "\n")
    }

    private fun request(url: URL, method: String = "GET", body: String? = null): String {
        val connection = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15_000
            readTimeout = 15_000
            setRequestProperty("Authorization", authorizationHeader())
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
        }

        if (body != null) {
            connection.outputStream.use { output ->
                output.write(body.toByteArray(StandardCharsets.UTF_8))
            }
        }

        val status = connection.responseCode
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream ?: connection.inputStream
        val response = stream.bufferedReader().use { it.readText() }
        connection.disconnect()

        if (status !in 200..299) {
            throw IllegalStateException("Mailosaur request failed with HTTP $status: $response")
        }
        return response
    }

    private fun authorizationHeader(): String {
        val token = Base64.encodeToString("$apiKey:".toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP)
        return "Basic $token"
    }

    private fun extractCode(body: String): String? =
        Regex("\\b\\d{6}\\b").find(body)?.value
}

private fun android.os.Bundle.requiredString(key: String): String =
    getString(key)?.takeIf { it.isNotBlank() } ?: error("Missing instrumentation argument: $key")

private fun String.urlEncoded(): String =
    URLEncoder.encode(this, StandardCharsets.UTF_8.name())
