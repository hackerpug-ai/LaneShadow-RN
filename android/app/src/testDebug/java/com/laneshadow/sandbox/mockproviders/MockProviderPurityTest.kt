package com.laneshadow.sandbox.mockproviders

import org.junit.Test
import org.junit.Assert.fail
import java.io.File

/**
 * TDD Phase: RED
 * AC-5: No I/O in providers
 *
 * This test enforces purity by scanning provider source files for banned I/O imports.
 * Mock providers must be pure functions — no network, disk, or async I/O.
 */
class MockProviderPurityTest {

    private val mockProvidersDir = File("src/debug/java/com/laneshadow/sandbox/mockproviders")

    // Banned imports that indicate I/O operations
    private val bannedImports = setOf(
        // Java I/O
        "java.io.",
        "java.nio.",
        // Kotlinx Coroutines Flow (indicates async I/O pattern)
        "kotlinx.coroutines.flow.Flow",
        "kotlinx.coroutines.flow.FlowCollector",
        // OkHttp networking
        "okhttp3.",
        // Convex client (if present)
        "convex.",
        "Convex",
        // Kotlin runBlocking (indicates async I/O)
        "kotlinx.coroutines.runBlocking",
        "runBlocking",
        // File operations
        "java.io.File",
        "java.io.FileInputStream",
        "java.io.FileOutputStream",
        // Network
        "java.net.",
        "java.net.URL",
        "java.net.HttpURLConnection",
    )

    @Test
    fun test_no_banned_imports_in_providers() {
        val providerFiles = mockProvidersDir.listFiles()?.filter { it.extension == "kt" } ?: emptyList()

        if (providerFiles.isEmpty()) {
            fail("No provider files found in ${mockProvidersDir.absolutePath}")
        }

        val violations = mutableListOf<String>()

        providerFiles.forEach { file ->
            val content = file.readText()
            // Remove comments to avoid false positives
            val codeWithoutComments = content
                .replace(Regex("""//.*"""), "")
                .replace(Regex("""/\*.*?\*/""", RegexOption.DOT_MATCHES_ALL), "")

            bannedImports.forEach { banned ->
                if (codeWithoutComments.contains(banned)) {
                    violations.add("${file.name} contains banned import/reference: $banned")
                }
            }
        }

        if (violations.isNotEmpty()) {
            fail("Provider purity violations found:\n${violations.joinToString("\n")}")
        }
    }

    @Test
    fun test_providers_dont_perform_file_operations() {
        val providerFiles = mockProvidersDir.listFiles()?.filter { it.extension == "kt" } ?: emptyList()

        val violations = mutableListOf<String>()

        // Check for file operation patterns
        val filePatterns = listOf(
            "File(",
            "FileInputStream",
            "FileOutputStream",
            "BufferedReader",
            "FileReader",
            "FileWriter",
        )

        providerFiles.forEach { file ->
            val content = file.readText()
            filePatterns.forEach { pattern ->
                if (content.contains(pattern)) {
                    violations.add("${file.name} contains file operation: $pattern")
                }
            }
        }

        if (violations.isNotEmpty()) {
            fail("Providers must not perform file I/O:\n${violations.joinToString("\n")}")
        }
    }

    @Test
    fun test_providers_dont_use_async_coroutines() {
        val providerFiles = mockProvidersDir.listFiles()?.filter { it.extension == "kt" } ?: emptyList()

        val violations = mutableListOf<String>()

        // Check for async patterns - but exclude comments
        val asyncPatterns = listOf(
            Regex("""suspend\s+fun\s+\w+"""),  // actual suspend fun declarations (not in comments)
            Regex("""\b(GlobalScope|lifecycleScope|viewModelScope)\s*\."""),
            Regex("""\b(async\s*\{|launch\s*\{)\s*"""),
        )

        providerFiles.forEach { file ->
            val content = file.readText()
            // Remove comments to avoid false positives
            val codeWithoutComments = content
                .replace(Regex("""//.*"""), "")
                .replace(Regex("""/\*.*?\*/""", RegexOption.DOT_MATCHES_ALL), "")

            asyncPatterns.forEach { pattern ->
                if (pattern.containsMatchIn(codeWithoutComments)) {
                    violations.add("${file.name} contains async pattern: ${pattern.pattern}")
                }
            }
        }

        if (violations.isNotEmpty()) {
            fail("Providers must not use async/coroutines:\n${violations.joinToString("\n")}")
        }
    }
}
