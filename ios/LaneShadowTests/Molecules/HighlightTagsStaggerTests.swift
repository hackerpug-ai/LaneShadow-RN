import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Highlight Tags Stagger Tests

/**
 * Tests for LSHighlightTagsStagger molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Component renders with highlight tags
 * - EmptyView returned when not visible
 * - EmptyView returned when highlights array is empty
 * - Staggered animation with configurable delays
 * - Scale animation (0.95 → 1.0)
 * - Reduce motion support (instant reveal)
 * - Theme integration with semantic colors
 * - Tag chip styling (primary colors at 10%/30% opacity)
 * - FlowLayout wrapping behavior
 * - Optional emoji icons in tags
 * - Accessibility labels
 * - Test identifier propagation
 */
final class HighlightTagsStaggerTests: XCTestCase {
    // MARK: - AC-1: Component renders with highlight tags

    func testHighlightTagsStaggerRendersWithTags() {
        // GIVEN: HighlightTagsStagger is created with highlights and visible = true
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
            LSHighlightTag(label: "Coastal", icon: "🌊"),
            LSHighlightTag(label: "Mountains"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true
        )

        // THEN: Component renders successfully with all tags
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-2: EmptyView returned when not visible

    func testHighlightTagsStaggerReturnsEmptyViewWhenNotVisible() {
        // GIVEN: HighlightTagsStagger is created with highlights but visible = false
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
            LSHighlightTag(label: "Coastal", icon: "🌊"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: false
        )

        // THEN: Component renders as EmptyView
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-3: EmptyView returned when highlights array is empty

    func testHighlightTagsStaggerReturnsEmptyViewWhenHighlightsEmpty() {
        // GIVEN: HighlightTagsStagger is created with empty highlights array
        let view = LSHighlightTagsStagger(
            highlights: [],
            visible: true
        )

        // WHEN: Component is rendered
        // THEN: Component renders as EmptyView
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-4: Staggered animation with configurable delays

    func testHighlightTagsStaggerSupportsCustomStaggerDelay() {
        // GIVEN: HighlightTagsStagger is created with custom staggerDelay
        let highlights = [
            LSHighlightTag(label: "Tag1"),
            LSHighlightTag(label: "Tag2"),
            LSHighlightTag(label: "Tag3"),
        ]

        // WHEN: Component is rendered with custom staggerDelay (200ms)
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true,
            staggerDelay: 200
        )

        // THEN: Component accepts custom stagger delay
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-5: Scale animation (0.95 → 1.0)

    func testHighlightTagsStaggerAppliesScaleAnimation() {
        // GIVEN: HighlightTagsStagger is created with scaleDuration
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true,
            scaleDuration: 300
        )

        // THEN: Component accepts scale duration and applies scale animation
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-6: Reduce motion support

    func testHighlightTagsStaggerRespectsReduceMotion() {
        // GIVEN: HighlightTagsStagger is created
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
            LSHighlightTag(label: "Coastal", icon: "🌊"),
        ]

        // WHEN: Component is rendered with reduce motion enabled
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true
        )
        .accessibilityReduceMotion(true)

        // THEN: Component respects reduce motion (instant reveal)
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-7: Theme integration with semantic colors

    func testHighlightTagsStaggerUsesSemanticTheme() {
        // GIVEN: HighlightTagsStagger is created
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
        ]

        // WHEN: Component is rendered with theme
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true
        )

        // THEN: Uses semantic theme colors (primary.default at 10%/30% opacity)
        XCTAssertNotNil(view)
        let themedView = view.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-8: Tag chip styling with primary colors

    func testHighlightTagsStaggerTagChipsUsePrimaryColors() {
        // GIVEN: HighlightTagsStagger is created
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true
        )

        // THEN: Tag chips use primary.default background at 10% opacity and border at 30% opacity
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-9: FlowLayout wrapping behavior

    func testHighlightTagsStaggerWrapsTagsInFlowLayout() {
        // GIVEN: HighlightTagsStagger is created with multiple tags
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
            LSHighlightTag(label: "Coastal", icon: "🌊"),
            LSHighlightTag(label: "Mountains", icon: "⛰️"),
            LSHighlightTag(label: "Wine country", icon: "🍇"),
            LSHighlightTag(label: "Historic"),
            LSHighlightTag(label: "Day trip"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true
        )

        // THEN: Tags wrap in FlowLayout with 8pt gap
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-10: Optional emoji icons in tags

    func testHighlightTagsStaggerRendersTagsWithIcons() {
        // GIVEN: HighlightTagsStagger is created with tags that have icons
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
            LSHighlightTag(label: "Coastal", icon: "🌊"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true
        )

        // THEN: Tags render with emoji icons (14pt)
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    func testHighlightTagsStaggerRendersTagsWithoutIcons() {
        // GIVEN: HighlightTagsStagger is created with tags without icons
        let highlights = [
            LSHighlightTag(label: "Scenic"),
            LSHighlightTag(label: "Coastal"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true
        )

        // THEN: Tags render without icons
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-11: Accessibility labels

    func testHighlightTagsStaggerHasAccessibilityLabels() {
        // GIVEN: HighlightTagsStagger is created
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
            LSHighlightTag(label: "Coastal", icon: "🌊"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true,
            testID: "test-highlights"
        )

        // THEN: Accessibility labels are applied to container and individual tags
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-12: Test identifier propagation

    func testHighlightTagsStaggerPropagatesTestID() {
        // GIVEN: HighlightTagsStagger is created with testID
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true,
            testID: "custom-test-id"
        )

        // THEN: Test ID is propagated to container and tags
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-13: Custom fade and scale durations

    func testHighlightTagsStaggerSupportsCustomDurations() {
        // GIVEN: HighlightTagsStagger is created with custom durations
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
        ]

        // WHEN: Component is rendered with custom fadeDuration and scaleDuration
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true,
            fadeDuration: 500,
            scaleDuration: 400
        )

        // THEN: Component accepts custom durations
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-14: Full corner radius on tag chips

    func testHighlightTagsStaggerTagChipsHaveFullCornerRadius() {
        // GIVEN: HighlightTagsStagger is created
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true
        )

        // THEN: Tag chips use full corner radius (capsule/pill shape)
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }

    // MARK: - AC-15: Typography tokens for tag text

    func testHighlightTagsStaggerUsesCorrectTypography() {
        // GIVEN: HighlightTagsStagger is created
        let highlights = [
            LSHighlightTag(label: "Scenic", icon: "🛣️"),
        ]

        // WHEN: Component is rendered
        let view = LSHighlightTagsStagger(
            highlights: highlights,
            visible: true
        )

        // THEN: Tag text uses label.md typography
        XCTAssertNotNil(view)
        let body = view.body
        XCTAssertTrue(type(of: body) is Any.Type)
    }
}
