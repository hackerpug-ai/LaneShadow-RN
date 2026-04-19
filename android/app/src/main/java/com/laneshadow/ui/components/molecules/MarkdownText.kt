package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Simple markdown parser for chat messages
 *
 * Supports: bold, italic, inline code, code blocks, links
 * Based on react-native-markdown-display styling from baseline
 */
private fun parseMarkdown(markdown: String, theme: com.laneshadow.theme.LaneShadowThemeValues): AnnotatedString {
    val result = AnnotatedString.Builder()
    var remaining = markdown

    // Regex patterns for markdown elements
    val codeBlockPattern = Regex("""```([\s\S]*?)```""")
    val inlineCodePattern = Regex("""`([^`]+)`""")
    val boldPattern = Regex("""\*\*([^*]+)\*\*""")
    val italicPattern = Regex("""\*([^*]+)\*""")
    val linkPattern = Regex("""\[([^\]]+)\]\(([^)]+)\)""")

    // First, handle code blocks (they take precedence)
    val codeBlockMatches = codeBlockPattern.findAll(remaining).toList()
    var lastEnd = 0

    for (match in codeBlockMatches) {
        // Add text before the code block
        if (match.range.first > lastEnd) {
            result.append(parseInlineMarkdown(remaining.substring(lastEnd, match.range.first), theme))
        }

        // Add code block
        val codeContent = match.groupValues[1].trim()
        result.withStyle(
            SpanStyle(
                background = theme.colors.surfaceVariant.default,
                color = theme.colors.primary.default,
                fontFamily = FontFamily.Monospace,
                fontSize = 14.sp,
            )
        ) {
            append(codeContent)
        }

        lastEnd = match.range.last + 1
    }

    // Add remaining text after last code block
    if (lastEnd < remaining.length) {
        result.append(parseInlineMarkdown(remaining.substring(lastEnd), theme))
    }

    return result.toAnnotatedString()
}

/**
 * Parse inline markdown (bold, italic, inline code, links)
 * This doesn't handle code blocks (those are handled at the top level)
 */
private fun parseInlineMarkdown(text: String, theme: com.laneshadow.theme.LaneShadowThemeValues): AnnotatedString {
    val result = AnnotatedString.Builder()
    var remaining = text

    // Process inline elements in order: inline code, bold, italic, links
    val inlineCodePattern = Regex("""`([^`]+)`""")
    val boldPattern = Regex("""\*\*([^*]+)\*\*""")
    val italicPattern = Regex("""\*([^*]+)\*""")
    val linkPattern = Regex("""\[([^\]]+)\]\(([^)]+)\)""")

    // Find all matches and sort by position
    val matches = mutableListOf<Pair<MatchResult, Int>>()

    inlineCodePattern.findAll(remaining).forEach { matches.add(it to 0) }
    boldPattern.findAll(remaining).forEach { matches.add(it to 1) }
    italicPattern.findAll(remaining).forEach { matches.add(it to 2) }
    linkPattern.findAll(remaining).forEach { matches.add(it to 3) }

    matches.sortBy { it.first.range.first }

    var lastEnd = 0
    val processedRanges = mutableSetOf<IntRange>()

    for ((match, type) in matches) {
        // Skip if this range overlaps with already processed content
        if (match.range.any { it in processedRanges.flatten() }) {
            continue
        }

        // Add text before this match
        if (match.range.first > lastEnd) {
            result.append(remaining.substring(lastEnd, match.range.first))
        }

        when (type) {
            0 -> { // Inline code
                val codeContent = match.groupValues[1]
                result.withStyle(
                    SpanStyle(
                        background = theme.colors.surfaceVariant.default,
                        color = theme.colors.primary.default,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 14.sp,
                    )
                ) {
                    append(codeContent)
                }
            }
            1 -> { // Bold
                val boldContent = match.groupValues[1]
                result.withStyle(
                    SpanStyle(
                        fontWeight = FontWeight.Bold,
                        color = theme.colors.onSurface.default,
                    )
                ) {
                    append(boldContent)
                }
            }
            2 -> { // Italic
                val italicContent = match.groupValues[1]
                result.withStyle(
                    SpanStyle(
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                        color = theme.colors.onSurface.default,
                    )
                ) {
                    append(italicContent)
                }
            }
            3 -> { // Link
                val linkText = match.groupValues[1]
                result.withStyle(
                    SpanStyle(
                        color = theme.colors.primary.default,
                        textDecoration = TextDecoration.Underline,
                    )
                ) {
                    append(linkText)
                }
            }
        }

        processedRanges.add(match.range)
        lastEnd = match.range.last + 1
    }

    // Add remaining text
    if (lastEnd < remaining.length) {
        result.append(remaining.substring(lastEnd))
    }

    return result.toAnnotatedString()
}

/**
 * MarkdownText molecule component
 *
 * Renders markdown content with semantic theme styling.
 * Supports: bold, italic, inline code, code blocks, links
 *
 * Based on react-native/components/ui/markdown-text.tsx
 *
 * @param markdown Markdown content to render
 * @param modifier Modifier for the component
 */
@Composable
fun MarkdownText(
    markdown: String,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Text(
        text = parseMarkdown(markdown, theme),
        modifier = modifier,
        style = theme.type.body.lg,
        color = theme.colors.onSurface.default,
    )
}
