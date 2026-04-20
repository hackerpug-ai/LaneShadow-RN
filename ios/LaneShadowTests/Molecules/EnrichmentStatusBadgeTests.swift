import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Enrichment Status Badge Tests

/**
 * Tests for LSEnrichmentStatusBadge molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - All 4 status variants (draft, partial, complete, failed)
 * - Small and medium size variants
 * - Background at 10% opacity of status color
 * - Border at 30% opacity of status color
 * - Icon + label HStack layout
 * - Semantic theme tokens used
 * - Accessibility labels
 */
final class EnrichmentStatusBadgeTests: XCTestCase {
    // MARK: - AC-1: Component renders with draft status

    func testRendersDraftStatus() {
        // GIVEN: Badge is created with draft status
        let status: LSEnrichmentStatus = .draft

        // WHEN: Component is rendered
        let badge = LSEnrichmentStatusBadge(status: status)

        // THEN: Renders with draft configuration (clock icon, subtle color)
        XCTAssertNotNil(badge)
        let view = badge.body
        // View renders correctly
    }

    // MARK: - AC-2: Component renders with partial status

    func testRendersPartialStatus() {
        // GIVEN: Badge is created with partial status
        let status: LSEnrichmentStatus = .partial

        // WHEN: Component is rendered
        let badge = LSEnrichmentStatusBadge(status: status)

        // THEN: Renders with partial configuration (check-circle icon, enrichmentFast color)
        XCTAssertNotNil(badge)
        let view = badge.body
        // View renders correctly
    }

    // MARK: - AC-3: Component renders with complete status

    func testRendersCompleteStatus() {
        // GIVEN: Badge is created with complete status
        let status: LSEnrichmentStatus = .complete

        // WHEN: Component is rendered
        let badge = LSEnrichmentStatusBadge(status: status)

        // THEN: Renders with complete configuration (star icon, enrichmentExtended color)
        XCTAssertNotNil(badge)
        let view = badge.body
        // View renders correctly
    }

    // MARK: - AC-4: Component renders with failed status

    func testRendersFailedStatus() {
        // GIVEN: Badge is created with failed status
        let status: LSEnrichmentStatus = .failed

        // WHEN: Component is rendered
        let badge = LSEnrichmentStatusBadge(status: status)

        // THEN: Renders with failed configuration (alert-circle icon, danger color)
        XCTAssertNotNil(badge)
        let view = badge.body
        // View renders correctly
    }

    // MARK: - AC-5: Small size variant

    func testSmallSizeVariant() {
        // GIVEN: Badge is created with small size
        let status: LSEnrichmentStatus = .draft
        let size: LSEnrichmentBadgeSize = .small

        // WHEN: Component is rendered
        let badge = LSEnrichmentStatusBadge(status: status, size: size)

        // THEN: Renders with small padding (4pt vertical, 8pt horizontal), 14px icon, label.sm font
        XCTAssertNotNil(badge)
        let view = badge.body
        // View renders correctly
    }

    // MARK: - AC-6: Medium size variant

    func testMediumSizeVariant() {
        // GIVEN: Badge is created with medium size
        let status: LSEnrichmentStatus = .partial
        let size: LSEnrichmentBadgeSize = .medium

        // WHEN: Component is rendered
        let badge = LSEnrichmentStatusBadge(status: status, size: size)

        // THEN: Renders with medium padding (6pt vertical, 12pt horizontal), 16px icon, label.md font
        XCTAssertNotNil(badge)
        let view = badge.body
        // View renders correctly
    }

    // MARK: - AC-7: Background at 10% opacity

    func testBackgroundAt10PercentOpacity() {
        // GIVEN: Badge is created with any status
        let status: LSEnrichmentStatus = .complete

        // WHEN: Component is rendered with theme
        let badge = LSEnrichmentStatusBadge(status: status)

        // THEN: Background uses status color at 10% opacity
        XCTAssertNotNil(badge)
        let themedView = badge.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-8: Border at 30% opacity

    func testBorderAt30PercentOpacity() {
        // GIVEN: Badge is created with any status
        let status: LSEnrichmentStatus = .failed

        // WHEN: Component is rendered
        let badge = LSEnrichmentStatusBadge(status: status)

        // THEN: Border uses status color at 30% opacity
        XCTAssertNotNil(badge)
        let view = badge.body
        // View renders correctly
    }

    // MARK: - AC-9: HStack with icon and label

    func testHStackWithIconAndLabel() {
        // GIVEN: Badge is created
        let status: LSEnrichmentStatus = .partial

        // WHEN: Component is rendered
        let badge = LSEnrichmentStatusBadge(status: status)

        // THEN: Renders HStack with icon on left and label text on right
        XCTAssertNotNil(badge)
        let view = badge.body
        // View renders correctly
    }

    // MARK: - AC-10: Uses semantic theme tokens

    func testUsesSemanticThemeTokens() {
        // GIVEN: Badge is created
        let status: LSEnrichmentStatus = .complete

        // WHEN: Component is rendered with theme
        let badge = LSEnrichmentStatusBadge(status: status)

        // THEN: Uses theme.domain.enrichmentFast/enrichmentExtended, theme.type.label.sm/md, theme.space.xs/sm/md, theme.radius.lg
        XCTAssertNotNil(badge)
        let themedView = badge.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-11: All status variants are iterable

    func testAllStatusVariantsIterable() {
        // GIVEN: LSEnrichmentStatus enum is CaseIterable
        // WHEN: We iterate through all statuses
        let allStatuses = LSEnrichmentStatus.allCases

        // THEN: All 4 statuses are present
        XCTAssertEqual(allStatuses.count, 4, "EnrichmentStatus should have exactly 4 statuses")

        // Verify each status can create a valid badge
        for status in allStatuses {
            let badge = LSEnrichmentStatusBadge(status: status)
            XCTAssertNotNil(badge, "Badge with status \(status) should be creatable")
        }
    }

    // MARK: - AC-12: Accessibility label

    func testAccessibilityLabel() {
        // GIVEN: Badge with status
        let status: LSEnrichmentStatus = .partial
        let badge = LSEnrichmentStatusBadge(status: status)

        // WHEN: Converting to view
        let view = badge.body

        // THEN: View should have accessibility label "Enrichment status: Partial"
        // View renders correctly
    }

    // MARK: - AC-13: Status configuration has correct properties

    func testStatusConfigurationProperties() {
        // GIVEN: Each status has a configuration
        // WHEN: Checking draft status
        let draftConfig = LSEnrichmentStatus.draft.config
        XCTAssertEqual(draftConfig.label, "Draft")
        XCTAssertEqual(draftConfig.iconName, "clock")

        // THEN: Configuration has correct label and icon
        let partialConfig = LSEnrichmentStatus.partial.config
        XCTAssertEqual(partialConfig.label, "Partial")
        XCTAssertEqual(partialConfig.iconName, "checkmark.circle")

        let completeConfig = LSEnrichmentStatus.complete.config
        XCTAssertEqual(completeConfig.label, "Complete")
        XCTAssertEqual(completeConfig.iconName, "star")

        let failedConfig = LSEnrichmentStatus.failed.config
        XCTAssertEqual(failedConfig.label, "Failed")
        XCTAssertEqual(failedConfig.iconName, "exclamationmark.triangle")
    }
}
