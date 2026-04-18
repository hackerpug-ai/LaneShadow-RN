package com.laneshadow.theme

import android.content.Context
import androidx.compose.ui.graphics.Color
import java.io.InputStream
import kotlinx.serialization.json.Json

object ThemeLoader {
    private val json = Json { ignoreUnknownKeys = true }

    /** Load semantic tokens from the bundled Android asset. */
    fun fromAssets(context: Context): SemanticTokens =
        context.assets.open(ASSET_NAME).use(::decode)

    /** Load semantic tokens from a raw stream (useful for JVM unit tests). */
    fun fromStream(stream: InputStream): SemanticTokens = stream.use(::decode)

    private fun decode(stream: InputStream): SemanticTokens {
        val text = stream.bufferedReader().readText()
        return json.decodeFromString<ThemeTokensFileDto>(text).semantic
    }

    internal const val ASSET_NAME = "semantic.tokens.json"
}

/**
 * Parse a JSON color string (hex, rgba, transparent) into a Compose Color.
 * Mirrors Swift's parseColorString so all platforms render the same values.
 */
internal fun parseColorString(raw: String): Color {
    val trimmed = raw.trim()
    if (trimmed == "transparent" || trimmed == "clear") return Color.Transparent
    if (trimmed.startsWith("#")) {
        val hex = trimmed.drop(1)
        val norm = if (hex.length == 3) hex.map { "$it$it" }.joinToString("") else hex
        if (norm.length == 6) {
            val rgb = norm.toLong(16)
            return Color((0xFF000000L or rgb).toULong().toLong())
        }
        if (norm.length == 8) {
            // JSON only uses 6-char hex + rgba() for alpha; this branch is defensive.
            val argb = norm.toLong(16)
            return Color(argb)
        }
    }
    if (trimmed.startsWith("rgb")) {
        var s = trimmed
        when {
            s.startsWith("rgba(") -> s = s.drop(5)
            s.startsWith("rgb(") -> s = s.drop(4)
        }
        if (s.endsWith(")")) s = s.dropLast(1)
        val parts = s.split(",").map { it.trim() }
        if (parts.size >= 3) {
            val r = parts[0].toDoubleOrNull() ?: return Color.Black
            val g = parts[1].toDoubleOrNull() ?: return Color.Black
            val b = parts[2].toDoubleOrNull() ?: return Color.Black
            val a = if (parts.size >= 4) parts[3].toDoubleOrNull() ?: 1.0 else 1.0
            return Color(
                red = (r / 255).toFloat(),
                green = (g / 255).toFloat(),
                blue = (b / 255).toFloat(),
                alpha = a.toFloat(),
            )
        }
    }
    return Color.Black
}
