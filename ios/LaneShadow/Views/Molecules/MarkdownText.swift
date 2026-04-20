import LaneShadowTheme
import SwiftUI

// MARK: - Markdown Text Component

/**
 * Markdown text molecule component
 *
 * Renders markdown content with semantic theme styling.
 * Uses Swift's built-in AttributedString Markdown parsing.
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Text: `theme.colors.onSurface.default`
 *   - Inline code background: `theme.colors.surfaceVariant.default`
 *   - Inline code text: `theme.colors.primary.default`
 *   - Link text: `theme.colors.primary.default`
 * - Typography:
 *   - Body: `theme.type.body.lg`
 *   - Inline code: monospace family
 *
 * ## Supported Markdown
 * - Bold: **text**
 * - Italic: *text*
 * - Inline code: `text`
 * - Code blocks: ```text```
 * - Links: [text](url)
 *
 * ## Parameters
 * - markdown: Markdown content to render
 */
public struct LSMarkdownText: View {
    @Environment(\.theme) private var theme

    private let markdown: String

    public init(markdown: String) {
        self.markdown = markdown
    }

    public var body: some View {
        Text(attributedMarkdown)
            .font(theme.type.body.lg.font)
            .foregroundStyle(theme.colors.onSurface.default)
            .tint(theme.colors.primary.default)
    }

    /**
     * Convert markdown string to AttributedString with theme styling
     */
    private var attributedMarkdown: AttributedString {
        do {
            var attributedString = try AttributedString(markdown: markdown)
            applyThemeStyling(to: &attributedString)
            return attributedString
        } catch {
            // Fallback to plain text if markdown parsing fails
            return AttributedString(markdown)
        }
    }

    /**
     * Apply theme-specific styling to markdown attributes
     */
    private func applyThemeStyling(to attributedString: inout AttributedString) {
        for run in attributedString.runs {
            if let inlinePresentationIntent = run.inlinePresentationIntent {
                switch inlinePresentationIntent {
                case .code:
                    // Inline code styling
                    attributedString[run.range].backgroundColor = theme.colors.surfaceVariant.default
                    attributedString[run.range].font = Font.system(
                        size: theme.type.body.sm.fontSize,
                        design: .monospaced
                    )
                    attributedString[run.range].foregroundColor = theme.colors.primary.default

                case .stronglyEmphasized:
                    // Bold styling
                    attributedString[run.range].font = Font.system(
                        size: theme.type.body.lg.fontSize,
                        weight: .bold
                    )
                    attributedString[run.range].foregroundColor = theme.colors.onSurface.default

                case .emphasized:
                    // Italic styling
                    attributedString[run.range].font = Font.system(
                        size: theme.type.body.lg.fontSize,
                        weight: .regular
                    ).italic()
                    attributedString[run.range].foregroundColor = theme.colors.onSurface.default

                default:
                    break
                }
            } else if let link = run.link {
                // Link styling is handled by .tint() modifier on Text
                attributedString[run.range].underlineStyle = .single
            }
        }
    }
}

// MARK: - Preview

#Preview("MarkdownText - Basic") {
    LSMarkdownText(
        markdown: """
        **Bold text** and *italic text*

        This is `inline code`.

        [Link text](https://example.com)
        """
    )
    .laneShadowTheme()
    .padding()
}

#Preview("MarkdownText - Code Block") {
    LSMarkdownText(
        markdown: """
        Here's a code block:

        ```swift
        let greeting = "Hello, World!"
        print(greeting)
        ```

        And more text after.
        """
    )
    .laneShadowTheme()
    .padding()
}

#Preview("MarkdownText - Complex") {
    LSMarkdownText(
        markdown: """
        # Heading

        This is **bold** and *italic* with `code` and a [link](https://example.com).

        ## Subheading

        Regular text continues here.
        """
    )
    .laneShadowTheme()
    .padding()
}
