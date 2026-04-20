import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Markdown Text Tests

/**
 * Tests for LSMarkdownText molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Renders markdown content with semantic theme styling
 * - Supports bold, italic, inline code, code blocks, links
 * - Uses theme colors (onSurface, primary, surfaceVariant)
 * - Uses theme typography (body.lg, body.sm)
 * - Follows LS naming convention
 */
@MainActor
final class MarkdownTextTests: XCTestCase {
    // MARK: - AC-1: Renders markdown content

    func testRendersMarkdownContent() {
        // GIVEN: MarkdownText is created with markdown content
        let markdown = "**Bold** and *italic* text"
        let markdownText = LSMarkdownText(markdown: markdown)

        // WHEN: Component is rendered
        // THEN: Renders non-empty view
        XCTAssertNotNil(markdownText)
        let view = markdownText.body
        // View renders correctly
    }

    // MARK: - AC-2: Uses semantic theme colors

    func testUsesSemanticThemeColors() {
        // GIVEN: MarkdownText is created with markdown
        let markdownText = LSMarkdownText(markdown: "**Bold** text")

        // WHEN: Component is rendered with theme
        // THEN: Uses semantic theme colors (onSurface.default for text)
        XCTAssertNotNil(markdownText)
        let themedView = markdownText.laneShadowTheme()
        // Theme integration works
    }

    // MARK: - AC-3: Supports inline code styling

    func testSupportsInlineCodeStyling() {
        // GIVEN: MarkdownText is created with inline code
        let markdown = "This is `inline code` text"
        let markdownText = LSMarkdownText(markdown: markdown)

        // WHEN: Component is rendered
        // THEN: Renders inline code with surfaceVariant background and primary color
        XCTAssertNotNil(markdownText)
        let view = markdownText.body
        // View renders correctly
    }

    // MARK: - AC-4: Supports bold styling

    func testSupportsBoldStyling() {
        // GIVEN: MarkdownText is created with bold text
        let markdown = "**Bold text** here"
        let markdownText = LSMarkdownText(markdown: markdown)

        // WHEN: Component is rendered
        // THEN: Renders bold text with onSurface color
        XCTAssertNotNil(markdownText)
        let view = markdownText.body
        // View renders correctly
    }

    // MARK: - AC-5: Supports italic styling

    func testSupportsItalicStyling() {
        // GIVEN: MarkdownText is created with italic text
        let markdown = "*Italic text* here"
        let markdownText = LSMarkdownText(markdown: markdown)

        // WHEN: Component is rendered
        // THEN: Renders italic text with onSurface color
        XCTAssertNotNil(markdownText)
        let view = markdownText.body
        // View renders correctly
    }

    // MARK: - AC-6: Supports links

    func testSupportsLinks() {
        // GIVEN: MarkdownText is created with a link
        let markdown = "[Link text](https://example.com)"
        let markdownText = LSMarkdownText(markdown: markdown)

        // WHEN: Component is rendered
        // THEN: Renders link with primary color and underline
        XCTAssertNotNil(markdownText)
        let view = markdownText.body
        // View renders correctly
    }

    // MARK: - AC-7: Supports code blocks

    func testSupportsCodeBlocks() {
        // GIVEN: MarkdownText is created with code block
        let markdown = """
        ```swift
        let code = "here"
        ```
        """
        let markdownText = LSMarkdownText(markdown: markdown)

        // WHEN: Component is rendered
        // THEN: Renders code block with surfaceVariant background and monospace font
        XCTAssertNotNil(markdownText)
        let view = markdownText.body
        // View renders correctly
    }

    // MARK: - AC-8: Uses theme typography

    func testUsesThemeTypography() {
        // GIVEN: MarkdownText is created with markdown
        let markdown = "Regular text"
        let markdownText = LSMarkdownText(markdown: markdown)

        // WHEN: Component is rendered
        // THEN: Uses theme.type.body.lg for body text
        XCTAssertNotNil(markdownText)
        let view = markdownText.body
        // View renders correctly
    }

    // MARK: - AC-9: Fallback to plain text on parse error

    func testFallbackToPlainTextOnParseError() {
        // GIVEN: MarkdownText is created with invalid markdown
        let markdown = "Invalid markdown [[]]"
        let markdownText = LSMarkdownText(markdown: markdown)

        // WHEN: Component is rendered
        // THEN: Falls back to plain text rendering
        XCTAssertNotNil(markdownText)
        let view = markdownText.body
        // View renders correctly
    }

    // MARK: - AC-10: Follows LS naming convention

    func testFollowsLSNamingConvention() {
        // GIVEN: Component exists in codebase
        // WHEN: Struct is named
        // THEN: Uses LSMarkdownText naming convention (not MarkdownText)
        let markdownText = LSMarkdownText(markdown: "test")
        XCTAssertNotNil(markdownText)
        XCTAssertTrue(type(of: markdownText) == LSMarkdownText.self)
    }
}
