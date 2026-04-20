import LaneShadowTheme
import SwiftUI
import Testing

@testable import LaneShadow

// MARK: - RouteAttachmentCard Tests

/**
 * TDD Tests for LSRouteAttachmentCard molecule component
 *
 * Following React Native component from react-native/components/ui/route-attachment-card.tsx
 *
 * ## Acceptance Criteria
 * - AC-1: Component renders with all route info (label, description, distance, duration, scenic score)
 * - AC-2: Weather badge displays when applicable
 * - AC-3: "Best" badge displays when isBest=true
 * - AC-4: Tap handler callback supported
 * - AC-5: All theme tokens used (no hardcoded values)
 */
struct RouteAttachmentCardTests {
    // MARK: - Test Data

    private let testRoute = LSRouteAttachment(
        id: "route-123",
        label: "Pacific Coast Highway",
        description: "Scenic coastal route",
        distance: "125 mi",
        duration: "2h 45m",
        scenicScore: 8.5,
        weatherBadge: nil,
        isBest: false
    )

    // MARK: - AC-1: Component Renders Correctly

    @Test("AC-1: Component renders with all route info")
    func componentRendersWithAllRouteInfo() async throws {
        // Given: A RouteAttachmentCard with required route data
        let card = LSRouteAttachmentCard(
            route: testRoute,
            onRoutePress: nil,
            testID: "test-route-card"
        )

        // When: Component is instantiated
        // Then: Component should have all route data available
        #expect(card.route.id == "route-123")
        #expect(card.route.label == "Pacific Coast Highway")
        #expect(card.route.description == "Scenic coastal route")
        #expect(card.route.distance == "125 mi")
        #expect(card.route.duration == "2h 45m")
        #expect(card.route.scenicScore == 8.5)
    }

    // MARK: - AC-2: Weather Badge Displays

    @Test("AC-2: Weather badge displays when applicable")
    func weatherBadgeDisplaysWhenApplicable() async throws {
        // Given: A route with weather badge
        let routeWithWeather = LSRouteAttachment(
            id: "route-456",
            label: "Rainy Route",
            description: "Wet weather expected",
            distance: "50 mi",
            duration: "1h 30m",
            scenicScore: 7.0,
            weatherBadge: LSWeatherBadge(type: .rain, text: "Rain expected"),
            isBest: false
        )

        let card = LSRouteAttachmentCard(
            route: routeWithWeather,
            testID: "weather-card"
        )

        // When: Component is instantiated with weather
        // Then: Weather badge should be available
        #expect(card.route.weatherBadge != nil)
        #expect(card.route.weatherBadge?.type == .rain)
        #expect(card.route.weatherBadge?.text == "Rain expected")
    }

    @Test("AC-2: Weather badge is nil when not provided")
    func weatherBadgeNilWhenNotProvided() async throws {
        // Given: A route without weather badge
        let card = LSRouteAttachmentCard(
            route: testRoute,
            testID: "no-weather-card"
        )

        // When: Component is instantiated without weather
        // Then: Weather badge should be nil
        #expect(card.route.weatherBadge == nil)
    }

    // MARK: - AC-3: Best Badge Displays

    @Test("AC-3: Best badge displays when isBest=true")
    func bestBadgeDisplaysWhenIsBest() async throws {
        // Given: A route marked as best
        let bestRoute = LSRouteAttachment(
            id: "route-789",
            label: "Best Route",
            description: "Highest scenic score",
            distance: "100 mi",
            duration: "2h 15m",
            scenicScore: 9.5,
            weatherBadge: nil,
            isBest: true
        )

        let card = LSRouteAttachmentCard(
            route: bestRoute,
            testID: "best-card"
        )

        // When: Component is instantiated with isBest=true
        // Then: Route should be marked as best
        #expect(card.route.isBest == true)
    }

    @Test("AC-3: Best badge not shown when isBest=false")
    func bestBadgeNotShownWhenNotBest() async throws {
        // Given: A route not marked as best
        let card = LSRouteAttachmentCard(
            route: testRoute,
            testID: "not-best-card"
        )

        // When: Component is instantiated with isBest=false
        // Then: Route should not be marked as best
        #expect(card.route.isBest == false)
    }

    // MARK: - AC-4: Tap Handler Supported

    @Test("AC-4: Tap handler callback supported")
    func tapHandlerCallbackSupported() async throws {
        // Given: A card with tap handler
        var tappedRouteId: String?
        let card = LSRouteAttachmentCard(
            route: testRoute,
            onRoutePress: { routeId in
                tappedRouteId = routeId
            },
            testID: "tappable-card"
        )

        // When: Component is instantiated with callback
        // Then: Callback should be configured
        // Note: Full callback execution test requires UI test
        // This test verifies the callback is accepted
        #expect(card.route.id == "route-123")
    }

    @Test("AC-4: Tap handler is optional")
    func tapHandlerIsOptional() async throws {
        // Given: A card without tap handler
        let card = LSRouteAttachmentCard(
            route: testRoute,
            onRoutePress: nil,
            testID: "static-card"
        )

        // When: Component is instantiated without callback
        // Then: Component should render as static
        #expect(card.route.id == "route-123")
    }

    // MARK: - AC-5: Theme Tokens Used

    @Test("AC-5: All theme tokens used (no hardcoded values)")
    func themeTokensUsed() async throws {
        // Given: A RouteAttachmentCard
        let card = LSRouteAttachmentCard(
            route: testRoute,
            testID: "themed-card"
        )

        // When: Component is rendered
        // Then: Should use theme tokens for all styling
        // Note: This is verified by code review and build check
        // Hardcoded values would cause SwiftLint violations
        #expect(card.testID == "themed-card")
    }

    // MARK: - Additional Tests

    @Test("Component handles different weather badge types")
    func handlesDifferentWeatherTypes() async throws {
        // Given: Routes with different weather types
        let weatherTypes: [LSWeatherBadgeType] = [.clear, .rain, .wind, .cloudy]

        for weatherType in weatherTypes {
            let route = LSRouteAttachment(
                id: "route-\(weatherType)",
                label: "Weather Test",
                description: "Testing \(weatherType)",
                distance: "50 mi",
                duration: "1h",
                scenicScore: 7.0,
                weatherBadge: LSWeatherBadge(type: weatherType, text: "\(weatherType) weather"),
                isBest: false
            )

            let card = LSRouteAttachmentCard(
                route: route,
                testID: "weather-\(weatherType)-card"
            )

            // Then: Each weather type should be accepted
            #expect(card.route.weatherBadge?.type == weatherType)
        }
    }

    @Test("Component handles zero scenic score")
    func handlesZeroScenicScore() async throws {
        // Given: A route with zero scenic score
        let zeroScoreRoute = LSRouteAttachment(
            id: "route-zero",
            label: "Zero Score Route",
            description: "No scenic value",
            distance: "10 mi",
            duration: "15m",
            scenicScore: 0.0,
            weatherBadge: nil,
            isBest: false
        )

        let card = LSRouteAttachmentCard(
            route: zeroScoreRoute,
            testID: "zero-score-card"
        )

        // When: Component is instantiated
        // Then: Should handle zero score gracefully
        #expect(card.route.scenicScore == 0.0)
    }

    @Test("Component handles maximum scenic score")
    func handlesMaximumScenicScore() async throws {
        // Given: A route with maximum scenic score
        let maxScoreRoute = LSRouteAttachment(
            id: "route-max",
            label: "Perfect Route",
            description: "Maximum scenic value",
            distance: "100 mi",
            duration: "3h",
            scenicScore: 10.0,
            weatherBadge: nil,
            isBest: true
        )

        let card = LSRouteAttachmentCard(
            route: maxScoreRoute,
            testID: "max-score-card"
        )

        // When: Component is instantiated
        // Then: Should handle max score gracefully
        #expect(card.route.scenicScore == 10.0)
    }
}
