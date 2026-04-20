package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.ParagraphStyle
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextIndent
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Data class representing a parsed markdown block element
 */
private sealed class MarkdownBlock {
    data class Heading(val level: Int, val content: String) : MarkdownBlock()
    data class Paragraph(val content: AnnotatedString) : MarkdownBlock()
    data class CodeBlock(val content: String) : MarkdownBlock()
    data class Blockquote(val content: AnnotatedString) : MarkdownBlock()
    data class ListItem(val content: AnnotatedString, val ordered: Boolean, val number: Int?) : MarkdownBlock()
    data class HorizontalRule(val content: String) : MarkdownBlock()
}

/**
 * Parse markdown content into a list of block elements
 */
private fun parseMarkdownBlocks(markdown: String, theme: com.laneshadow.theme.LaneShadowThemeValues): List<MarkdownBlock> {
    val blocks = mutableListOf<MarkdownBlock>()
    val lines = markdown.split('\n')
    var i = 0

    while (i < lines.size) {
        val line = lines[i].trimEnd()
        val trimmedLine = line.trim()

        when {
            // Code block
            trimmedLine.startsWith("```") -> {
                val codeLines = mutableListOf<String>()
                i++ // Skip opening ```
                while (i < lines.size && !lines[i].trim().startsWith("```")) {
                    codeLines.add(lines[i])
                    i++
                }
                i++ // Skip closing ```
                blocks.add(MarkdownBlock.CodeBlock(codeLines.joinToString("\n")))
            }

            // Headings
            trimmedLine.startsWith("#") -> {
                val level = trimmedLine.takeWhile { it == '#' }.length
                val content = trimmedLine.drop(level).trim()
                blocks.add(MarkdownBlock.Heading(level.coerceIn(1, 6), content))
                i++
            }

            // Blockquote
            trimmedLine.startsWith(">") -> {
                val quoteLines = mutableListOf<String>()
                while (i < lines.size && lines[i].trim().startsWith(">")) {
                    quoteLines.add(lines[i].trim().drop(1).trim())
                    i++
                }
                val quoteContent = parseInlineMarkdown(quoteLines.joinToString(" "), theme)
                blocks.add(MarkdownBlock.Blockquote(quoteContent))
            }

            // Horizontal rule
            trimmedLine.matches(Regex("^[-*_]{3,}$")) -> {
                blocks.add(MarkdownBlock.HorizontalRule(trimmedLine))
                i++
            }

            // List items (unordered)
            trimmedLine.matches(Regex("^[-*]\\s+.*")) -> {
                val listItems = mutableListOf<String>()
                while (i < lines.size && lines[i].trim().matches(Regex("^[-*]\\s+.*"))) {
                    listItems.add(lines[i].trim().drop(2).trim())
                    i++
                }
                listItems.forEachIndexed { index, item ->
                    val annotatedItem = parseInlineMarkdown(item, theme)
                    blocks.add(MarkdownBlock.ListItem(annotatedItem, ordered = false, number = null))
                }
            }

            // List items (ordered)
            trimmedLine.matches(Regex("^\\d+\\.\\s+.*")) -> {
                val listItems = mutableListOf<Pair<Int, String>>()
                while (i < lines.size && lines[i].trim().matches(Regex("^\\d+\\.\\s+.*"))) {
                    val match = Regex("^(\\d+)\\.\\s+(.*)").find(lines[i].trim())
                    if (match != null) {
                        val number = match.groupValues[1].toInt()
                        val content = match.groupValues[2]
                        listItems.add(number to content)
                    }
                    i++
                }
                listItems.forEach { (number, item) ->
                    val annotatedItem = parseInlineMarkdown(item, theme)
                    blocks.add(MarkdownBlock.ListItem(annotatedItem, ordered = true, number = number))
                }
            }

            // Empty line - skip
            trimmedLine.isEmpty() -> {
                i++
            }

            // Regular paragraph
            else -> {
                val paraLines = mutableListOf<String>()
                while (i < lines.size && lines[i].trim().isNotEmpty() &&
                    !lines[i].trim().startsWith("#") &&
                    !lines[i].trim().startsWith(">") &&
                    !lines[i].trim().startsWith("```") &&
                    !lines[i].trim().matches(Regex("^[-*]\\s+.*")) &&
                    !lines[i].trim().matches(Regex("^\\d+\\.\\s+.*")) &&
                    !lines[i].trim().matches(Regex("^[-*_]{3,}$"))) {
                    paraLines.add(lines[i].trimEnd())
                    i++
                    if (i < lines.size && lines[i].trim().isEmpty()) break
                }
                if (paraLines.isNotEmpty()) {
                    val paraContent = parseInlineMarkdown(paraLines.joinToString(" "), theme)
                    blocks.add(MarkdownBlock.Paragraph(paraContent))
                }
            }
        }
    }

    return blocks
}

/**
 * Parse inline markdown (bold, italic, inline code, links)
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
        val range = match.range
        if (processedRanges.any { range.first in it || range.last in it || it.first in range || it.last in range }) {
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
                        fontSize = theme.type.body.sm.fontSize,
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

        processedRanges.add(range)
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
 * Supports: headings (H1-H6), bold, italic, inline code, code blocks, links,
 * blockquotes, ordered/unordered lists, horizontal rules
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

    val blocks = parseMarkdownBlocks(markdown, theme)

    Column(modifier = modifier) {
        for (block in blocks) {
            when (block) {
                is MarkdownBlock.Heading -> {
                    val (textStyle, topMargin, bottomMargin) = when (block.level) {
                        1 -> Triple(theme.type.heading.lg, theme.space.md, theme.space.sm)
                        2 -> Triple(theme.type.heading.md, theme.space.md, theme.space.sm)
                        3 -> Triple(theme.type.heading.sm, theme.space.sm, theme.space.xs)
                        4 -> Triple(theme.type.title.lg, theme.space.sm, theme.space.xs)
                        5 -> Triple(theme.type.title.md, theme.space.sm, theme.space.xs)
                        else -> Triple(theme.type.title.sm, theme.space.sm, theme.space.xs)
                    }

                    Text(
                        text = block.content,
                        style = textStyle,
                        color = theme.colors.onSurface.default,
                        modifier = Modifier
                            .padding(top = topMargin, bottom = bottomMargin)
                    )
                }

                is MarkdownBlock.Paragraph -> {
                    Text(
                        text = block.content,
                        style = theme.type.body.lg,
                        color = theme.colors.onSurface.default,
                        modifier = Modifier.padding(bottom = theme.space.sm)
                    )
                }

                is MarkdownBlock.CodeBlock -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                color = theme.colors.surfaceVariant.default,
                                shape = RoundedCornerShape(theme.radius.md)
                            )
                            .padding(theme.space.md)
                    ) {
                        Text(
                            text = block.content,
                            style = theme.type.body.sm,
                            color = theme.colors.onSurface.default,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                is MarkdownBlock.Blockquote -> {
                    val quoteColor = theme.colors.primary.default
                    val bgColor = theme.colors.surfaceVariant.default.copy(alpha = 0.2f)

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(color = bgColor, shape = RoundedCornerShape(theme.radius.sm))
                            .drawBehind {
                                drawRoundRect(
                                    color = quoteColor,
                                    topLeft = androidx.compose.ui.geometry.Offset(0f, 0f),
                                    size = androidx.compose.ui.geometry.Size(4.dp.toPx(), size.height),
                                    cornerRadius = CornerRadius(0f, 0f)
                                )
                            }
                            .padding(start = theme.space.md, top = theme.space.xs, bottom = theme.space.xs)
                    ) {
                        Text(
                            text = block.content,
                            style = theme.type.body.lg,
                            color = theme.colors.onSurface.default,
                        )
                    }
                }

                is MarkdownBlock.ListItem -> {
                    val prefix = if (block.ordered) {
                        "${block.number ?: 1}. "
                    } else {
                        "• "
                    }

                    Text(
                        text = AnnotatedString.Builder().apply {
                            append(prefix)
                            append(block.content)
                        }.toAnnotatedString(),
                        style = theme.type.body.lg,
                        color = theme.colors.onSurface.default,
                        modifier = Modifier
                            .padding(start = theme.space.md, bottom = theme.space.xs)
                    )
                }

                is MarkdownBlock.HorizontalRule -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = theme.space.md)
                            .drawBehind {
                                drawLine(
                                    color = theme.colors.border.default,
                                    start = androidx.compose.ui.geometry.Offset(0f, size.height / 2),
                                    end = androidx.compose.ui.geometry.Offset(size.width, size.height / 2),
                                    strokeWidth = 1.dp.toPx()
                                )
                            }
                    )
                }
            }
        }
    }
}
