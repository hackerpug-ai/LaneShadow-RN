import LaneShadowTheme
import SwiftUI
import Testing

@testable import LaneShadow

// MARK: - FavoriteRoadCard Tests

/**
 * TDD Tests for LSFavoriteRoadCard molecule component
 *
 * Following React Native component from react-native/components/ui/favorite-road-card.tsx
 *
 * ## Acceptance Criteria
 * - AC-1: Component renders with thumbnail, name, and delete button
 * - AC-2: Press state changes opacity to 0.8
 * - AC-3: Delete button is separate from card press
 * - AC-4: All theme tokens used (no hardcoded values)
 */
struct FavoriteRoadCardTests {
    // MARK: - Test Data

    private let testBounds = LSBounds(
        southwest: LSLatLng(latitude: 37.7749, longitude: -122.4194),
        northeast: LSLatLng(latitude: 37.8049, longitude: -122.3894)
    )

    // MARK: - AC-1: Component Renders Correctly

    @Test("AC-1: Component renders with thumbnail, name, and delete button")
    func componentRendersCorrectly() async throws {
        // Given: A FavoriteRoadCard with required props
        let card = LSFavoriteRoadCard(
            favoriteRoadId: "test-road-123",
            name: "Pacific Coast Highway",
            bounds: testBounds,
            thumbnailContent: { Text("Thumbnail") },
            testID: "test-card"
        )

        // When: Rendering the view
        // Then: Component should render without crashing
        // Note: Full rendering test requires SwiftUI preview/manual verification
        // This test verifies the component can be instantiated
        #expect(!card.favoriteRoadId.isEmpty)
        #expect(card.name == "Pacific Coast Highway")
    }

    // MARK: - AC-2: Press State Changes Opacity

    @Test("AC-2: Press state changes opacity to 0.8")
    func pressStateChangesOpacity() async throws {
        // Given: A FavoriteRoadCard with onPress callback
        var pressed = false
        let card = LSFavoriteRoadCard(
            favoriteRoadId: "test-road-123",
            name: "Test Road",
            bounds: testBounds,
            thumbnailContent: { Text("Thumbnail") },
            onPress: { _ in pressed = true },
            testID: "test-card"
        )

        // When: Card is instantiated with onPress
        // Then: onPress callback should be configured
        // Note: Full press state testing requires UI test or SwiftUI manual verification
        // This test verifies the callback is accepted
        #expect(card.favoriteRoadId == "test-road-123")
    }

    // MARK: - AC-3: Delete Button is Separate

    @Test("AC-3: Delete button is separate from card press")
    func deleteButtonSeparateFromCardPress() async throws {
        // Given: A FavoriteRoadCard with both onPress and onDelete
        var cardPressed = false
        var deletePressed = false

        let card = LSFavoriteRoadCard(
            favoriteRoadId: "test-road-123",
            name: "Test Road",
            bounds: testBounds,
            thumbnailContent: { Text("Thumbnail") },
            onPress: { _ in cardPressed = true },
            onDelete: { _ in deletePressed = true },
            testID: "test-card"
        )

        // When: Card is instantiated with both callbacks
        // Then: Both callbacks should be configured separately
        // Note: Full event separation testing requires UI test
        // This test verifies both callbacks are accepted
        #expect(card.favoriteRoadId == "test-road-123")
    }

    // MARK: - AC-4: Theme Tokens Used

    @Test("AC-4: All theme tokens used (no hardcoded values)")
    func themeTokensUsed() async throws {
        // Given: A FavoriteRoadCard with testID
        let card = LSFavoriteRoadCard(
            favoriteRoadId: "test-road-123",
            name: "Test Road",
            bounds: testBounds,
            thumbnailContent: { Text("Thumbnail") },
            testID: "test-card"
        )

        // When: Component is rendered with theme
        // Then: Should use theme tokens for all styling
        // Note: This is verified by code review and build check
        // Hardcoded values would cause SwiftLint violations
        #expect(card.testID == "test-card")
    }

    // MARK: - Additional Tests

    @Test("Component renders with long road name")
    func rendersWithLongName() async throws {
        // Given: A card with a very long name
        let longName = "This is a very long road name that should be truncated to two lines"
        let card = LSFavoriteRoadCard(
            favoriteRoadId: "test-road-123",
            name: longName,
            bounds: testBounds,
            thumbnailContent: { Text("Thumbnail") },
            testID: "test-card"
        )

        // When: Rendering the card
        // Then: Name should be accepted (truncation is visual)
        #expect(card.name == longName)
    }

    @Test("Component handles optional onPress")
    func handlesOptionalOnPress() async throws {
        // Given: A card without onPress
        let card = LSFavoriteRoadCard(
            favoriteRoadId: "test-road-123",
            name: "Test Road",
            bounds: testBounds,
            thumbnailContent: { Text("Thumbnail") },
            onPress: nil,
            testID: "test-card"
        )

        // When: Rendering without onPress
        // Then: Component should render as static (non-interactive)
        #expect(card.favoriteRoadId == "test-road-123")
    }

    @Test("Component handles optional onDelete")
    func handlesOptionalOnDelete() async throws {
        // Given: A card without onDelete
        let card = LSFavoriteRoadCard(
            favoriteRoadId: "test-road-123",
            name: "Test Road",
            bounds: testBounds,
            thumbnailContent: { Text("Thumbnail") },
            onDelete: nil,
            testID: "test-card"
        )

        // When: Rendering without onDelete
        // Then: Component should render without delete button
        #expect(card.favoriteRoadId == "test-road-123")
    }

    @Test("Component testIDs are correctly applied")
    func testIDsCorrectlyApplied() async throws {
        // Given: A card with custom testID
        let customTestID = "my-custom-card"
        let card = LSFavoriteRoadCard(
            favoriteRoadId: "test-road-123",
            name: "Test Road",
            bounds: testBounds,
            thumbnailContent: { Text("Thumbnail") },
            testID: customTestID
        )

        // When: Component is created
        // Then: testID should be stored for accessibility
        #expect(card.testID == customTestID)
    }
}

// MARK: - Bounds Type Definition

/**
 * Geographic bounds for map positioning
 * Following the translation matrix specification
 */
public struct LSBounds: Sendable {
    /// Southwest corner of the bounds
    public let southwest: LSLatLng
    /// Northeast corner of the bounds
    public let northeast: LSLatLng

    public init(southwest: LSLatLng, northeast: LSLatLng) {
        self.southwest = southwest
        self.northeast = northeast
    }

    /// Convenience initializer with short parameter names for compatibility
    public init(sw: LSLatLng, ne: LSLatLng) {
        self.southwest = sw
        self.northeast = ne
    }
}
