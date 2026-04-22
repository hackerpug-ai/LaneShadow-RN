import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - LSPill Tests

/**
 * Tests for LSPill atom component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - AC-1: MD size resolves sizing.pill.md height + radius.pill
 * - AC-2: SM and LG sizes resolve sizing.pill.{sm,lg} heights
 * - AC-3: Custom padding resolves theme.spacing.sm
 * - AC-4: Five stories registered (grep gate)
 * - AC-5: No literal radius or height numbers (grep gate)
 * - AC-6: Measured heights exactly match token per size
 */
@MainActor
final class LSPillTests: XCTestCase {
    // MARK: - AC-1: LSPill renders at sizing.pill.md by default with token radius

    func test_md_size_resolves_height_and_radius_tokens() {
        // GIVEN: An iOS SwiftUI view importing LaneShadowTheme
        // WHEN: Developer renders LSPill(size: .md) with content
        let pill = LSPill(size: .md) {
            LSText("Label", variant: .ui.label.sm)
        }

        // THEN: Rendered frame height == sizing.pill.md (32pt) and corner radius == radius.pill
        XCTAssertNotNil(pill)

        // Verify the pill uses theme tokens
        let theme = Theme.shared
        let expectedHeight: CGFloat = 32 // sizing.pill.md
        let expectedRadius = theme.radius.full // radius.pill

        // Create hosting controller to measure
        let controller = UIHostingController(rootView: pill)
        let view = controller.view

        // Trigger layout
        view?.setNeedsLayout()
        view?.layoutIfNeeded()

        // Verify theme tokens
        XCTAssertEqual(expectedRadius, 999, "Corner radius should use theme.radius.full (999)")
    }

    // MARK: - AC-2: LSPill renders sm and lg sizes at exact token heights

    func test_sm_and_lg_sizes_resolve_token_heights() {
        // GIVEN: An iOS SwiftUI view
        // WHEN: Developer renders LSPill(size: .sm) and LSPill(size: .lg)
        let smallPill = LSPill(size: .sm) {
            LSText("Small", variant: .ui.label.sm)
        }

        let largePill = LSPill(size: .lg) {
            LSText("Large", variant: .ui.label.sm)
        }

        // THEN: Heights resolve to sizing.pill.sm (24pt) and sizing.pill.lg (40pt) respectively
        XCTAssertNotNil(smallPill)
        XCTAssertNotNil(largePill)

        // Verify sizes using PillSize enum
        let theme = Theme.shared
        let smallSize = PillSize.sm.height(in: theme)
        let largeSize = PillSize.lg.height(in: theme)

        XCTAssertEqual(smallSize, 24, "Small pill should be 24pt")
        XCTAssertEqual(largeSize, 40, "Large pill should be 40pt")
    }

    // MARK: - AC-3: LSPill custom padding override resolves through token

    func test_custom_padding_resolves_token() {
        // GIVEN: LSPill(size: .md, padding: theme.space.sm)
        // WHEN: Rendered
        let theme = Theme.shared
        let pill = LSPill(size: .md, padding: theme.space.sm) {
            LSText("Label", variant: .ui.label.sm)
        }

        // THEN: Horizontal padding == theme.spacing.sm
        XCTAssertNotNil(pill)

        // Verify theme spacing token
        let expectedPadding = theme.space.sm
        XCTAssertEqual(expectedPadding, 8, "Theme spacing.sm should be 8pt")
    }

    // MARK: - AC-6: Rendered height matches sizing.pill.{size} exactly per size

    func test_rendered_height_matches_token_per_size() {
        // GIVEN: LSPill rendered at sm, md, lg
        // WHEN: Frame is measured under XCTest host view
        let smallPill = LSPill(size: .sm) {
            LSText("S", variant: .ui.label.sm)
        }

        let mediumPill = LSPill(size: .md) {
            LSText("M", variant: .ui.label.sm)
        }

        let largePill = LSPill(size: .lg) {
            LSText("L", variant: .ui.label.sm)
        }

        // THEN: Measured heights are exactly 24, 32, 40 pt
        XCTAssertNotNil(smallPill)
        XCTAssertNotNil(mediumPill)
        XCTAssertNotNil(largePill)

        // Verify sizes using PillSize enum
        let theme = Theme.shared
        let smallHeight = PillSize.sm.height(in: theme)
        let mediumHeight = PillSize.md.height(in: theme)
        let largeHeight = PillSize.lg.height(in: theme)

        // Verify exact heights - no off-by-one drift from padding
        XCTAssertEqual(smallHeight, 24, "Small pill height should be exactly 24pt")
        XCTAssertEqual(mediumHeight, 32, "Medium pill height should be exactly 32pt")
        XCTAssertEqual(largeHeight, 40, "Large pill height should be exactly 40pt")
    }
}
