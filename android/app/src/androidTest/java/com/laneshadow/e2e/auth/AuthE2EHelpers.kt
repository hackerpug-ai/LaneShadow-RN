package com.laneshadow.e2e.auth

import android.graphics.Bitmap
import android.os.Bundle
import android.util.Base64
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.UUID
import org.json.JSONObject

internal data class LiveAuthConfig(
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

internal class MailosaurClient(
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
        if (items.length() == 0) return null
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

internal fun Bundle.requiredString(key: String): String =
    getString(key)?.takeIf { it.isNotBlank() } ?: error("Missing instrumentation argument: $key")

internal fun String.urlEncoded(): String =
    URLEncoder.encode(this, StandardCharsets.UTF_8.name())

internal fun captureScreenshot(dir: File, name: String) {
    val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot() ?: return
    val file = File(dir, "$name.png")
    FileOutputStream(file).use { output ->
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
    }
    bitmap.recycle()
}
