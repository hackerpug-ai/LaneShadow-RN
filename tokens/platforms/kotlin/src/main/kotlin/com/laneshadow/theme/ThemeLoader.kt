package com.laneshadow.theme

import android.content.Context
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

// parseColorString is now provided by `dev.nativetheme.primitives.parseColorString`
// via the native-theme composite-built module. Import it where needed.
