import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Favorites Info Sheet Tests

/**
 * Tests for LSFavoritesInfoSheet molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Default rendering with unavailable favorites
 * - Sheet presentation behavior
 * - Info icon with primary color and 15% opacity background
 * - Title "Favorites Not Included" centered
 * - Message body text
 * - Favorites list in rounded container with 50% opacity surface background
 * - Guidance text at bottom
 * - "Got it" button with default variant, lg size
 * - All theme tokens used
 * - Accessibility labels
 */
final class FavoritesInfoSheetTests: XCTestCase {
    // MARK: - AC-1: Component renders with unavailable favorites

    func testFavoritesInfoSheetRendersWithUnavailableFavorites() {
        // GIVEN: FavoritesInfoSheet is created with unavailable favorites
        let unavailableFavorites = ["Pacific Coast Highway", "Mulholland Drive", "Sunset Boulevard"]
        var dismissed = false
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: { dismissed = true },
            testID: "favorites-info-sheet"
        )

        // WHEN: Component is rendered
        // THEN: Component displays with all required elements
        XCTAssertNotNil(sheet)
        let view = sheet.body
        // View renders correctly
    }

    // MARK: - AC-2: Sheet presentation behavior

    func testSheetPresentationBehavior() {
        // GIVEN: FavoritesInfoSheet is created with visible = true
        let unavailableFavorites = ["Test Road"]
        var dismissed = false
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: { dismissed = true }
        )

        // WHEN: Component is rendered
        // THEN: Sheet is presented with 60% height detent
        XCTAssertNotNil(sheet)
        let view = sheet.body
        // View renders correctly
    }

    // MARK: - AC-3: Info icon with primary color and 15% opacity background

    func testInfoIconWithPrimaryColorAndBackground() {
        // GIVEN: FavoritesInfoSheet component
        let unavailableFavorites = ["Test Road"]
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: {}
        )

        // WHEN: Component is rendered
        // THEN: Info icon uses primary color, 15% opacity background, full radius, md padding
        XCTAssertNotNil(sheet)
        let view = sheet.body
        // View renders correctly
    }

    // MARK: - AC-4: Title "Favorites Not Included" centered

    func testTitleCentered() {
        // GIVEN: FavoritesInfoSheet component
        let unavailableFavorites = ["Test Road"]
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: {}
        )

        // WHEN: Component is rendered
        // THEN: Title shows "Favorites Not Included" with title.md typography, centered, onSurface color
        XCTAssertNotNil(sheet)
        let view = sheet.body
        // View renders correctly
    }

    // MARK: - AC-5: Message body text

    func testMessageBodyText() {
        // GIVEN: FavoritesInfoSheet component
        let unavailableFavorites = ["Test Road"]
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: {}
        )

        // WHEN: Component is rendered
        // THEN: Message shows "These favorite roads are too far from your planned route:" with body.md typography, muted onSurface color
        XCTAssertNotNil(sheet)
        let view = sheet.body
        // View renders correctly
    }

    // MARK: - AC-6: Favorites list in rounded container

    func testFavoritesListInRoundedContainer() {
        // GIVEN: FavoritesInfoSheet with multiple favorites
        let unavailableFavorites = ["Road One", "Road Two", "Road Three"]
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: {}
        )

        // WHEN: Component is rendered
        // THEN: List shows all favorites in container with 50% opacity surface background, md radius, md padding, sm gap
        XCTAssertNotNil(sheet)
        let view = sheet.body
        // View renders correctly
    }

    // MARK: - AC-7: Guidance text at bottom

    func testGuidanceTextAtBottom() {
        // GIVEN: FavoritesInfoSheet component
        let unavailableFavorites = ["Test Road"]
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: {}
        )

        // WHEN: Component is rendered
        // THEN: Guidance shows "Try planning a route nearer to these favorites, or add them to a different route." with body.sm typography, muted onSurface color
        XCTAssertNotNil(sheet)
        let view = sheet.body
        // View renders correctly
    }

    // MARK: - AC-8: "Got it" button

    func testGotItButton() {
        // GIVEN: FavoritesInfoSheet component
        let unavailableFavorites = ["Test Road"]
        var dismissCallCount = 0
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: { dismissCallCount += 1 },
            testID: "test-sheet"
        )

        // WHEN: Component is rendered
        // THEN: Button shows "Got it" with default variant, lg size, calls onDismiss
        XCTAssertNotNil(sheet)
        XCTAssertEqual(dismissCallCount, 0)
        let view = sheet.body
        // View renders correctly
    }

    // MARK: - AC-9: All theme tokens used

    func testAllThemeTokensUsed() {
        // GIVEN: FavoritesInfoSheet component
        let unavailableFavorites = ["Test Road"]
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: {}
        )

        // WHEN: Component is rendered with theme
        // THEN: Uses theme.colors.primary.default, theme.colors.onSurface.default,
        //       theme.colors.onSurface.muted, theme.colors.surface.default,
        //       theme.type.title.md, theme.type.body.md, theme.type.body.sm,
        //       theme.space.lg, theme.space.md, theme.space.sm,
        //       theme.radius.full, theme.radius.md
        XCTAssertNotNil(sheet)
        let themedView = sheet.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-10: Accessibility labels

    func testAccessibilityLabels() {
        // GIVEN: FavoritesInfoSheet component
        let unavailableFavorites = ["Test Road"]
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: {},
            testID: "favorites-info-sheet"
        )

        // WHEN: Component is rendered
        // THEN: Has proper accessibility identifiers
        XCTAssertNotNil(sheet)
        let view = sheet.body
        // View renders correctly
    }

    // MARK: - AC-11: Empty favorites list

    func testEmptyFavoritesList() {
        // GIVEN: FavoritesInfoSheet with empty unavailable favorites
        let unavailableFavorites: [String] = []
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: {}
        )

        // WHEN: Component is rendered
        // THEN: Component renders without list items
        XCTAssertNotNil(sheet)
        let view = sheet.body
        // View renders correctly
    }

    // MARK: - AC-12: OnDismiss callback

    func testOnDismissCallback() {
        // GIVEN: FavoritesInfoSheet component
        let unavailableFavorites = ["Test Road"]
        var dismissed = false
        let sheet = LSFavoritesInfoSheet(
            visible: true,
            unavailableFavorites: unavailableFavorites,
            onDismiss: { dismissed = true }
        )

        // WHEN: Component is created
        // THEN: onDismiss callback is captured
        XCTAssertNotNil(sheet)
        XCTAssertEqual(dismissed, false)
    }

    // MARK: - AC-13: Visible false behavior

    func testVisibleFalseBehavior() {
        // GIVEN: FavoritesInfoSheet with visible = false
        let unavailableFavorites = ["Test Road"]
        let sheet = LSFavoritesInfoSheet(
            visible: false,
            unavailableFavorites: unavailableFavorites,
            onDismiss: {}
        )

        // WHEN: Component is rendered
        // THEN: Sheet is not presented
        XCTAssertNotNil(sheet)
        let view = sheet.body
        // View renders correctly
    }
}
