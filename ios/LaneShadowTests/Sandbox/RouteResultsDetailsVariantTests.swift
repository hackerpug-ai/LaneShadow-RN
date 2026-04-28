import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
@testable import LaneShadow

/// RouteDetails Variant Tests
///
/// TDD tests for FID-S02-T05 acceptance criteria:
/// - AC-1: RouteDetails S02 mixed-weather
/// - AC-2: RouteDetails S03 dark mode
/// - AC-3: RouteDetails S04 medium detent
/// - AC-4: RouteDetails S05 dismissing
/// - AC-5: RouteDetails V01 saved state
/// - AC-6: RouteDetails default state
/// - AC-7: Weather timeline rendering
/// - AC-8: Route details completeness
@Suite("RouteDetails Variant Tests")
@MainActor
struct RouteResultsDetailsVariantTests {
    // MARK: - AC-1: RouteDetails S02 mixed-weather

    @Test("AC-1: RouteDetails S02 mixed-weather renders weather condition changes")
    func routeDetailsS02MixedWeather() {
        // GIVEN: RouteDetailsScreen S02 mixed-weather story is rendered
        let provider = RouteDetailsMockProvider.self
        let state = provider.value(variant: "mixedWeather")

        // THEN: Weather timeline should show condition changes (clear → wind → rain)
        #expect(state.weatherTimeline.count >= 5, "Should have at least 5 weather entries")
        let hasClear = state.weatherTimeline.contains { $0.condition == .clear }
        let hasWind = state.weatherTimeline.contains { $0.condition == .wind }
        let hasRain = state.weatherTimeline.contains { $0.condition == .rain }
        #expect(hasClear, "Mixed weather should include clear conditions")
        #expect(hasWind, "Mixed weather should include wind conditions")
        #expect(hasRain, "Mixed weather should include rain conditions")

        // Verify UI renders correctly with mixed weather indicators
        let routeDetailsScreen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            variant: "mixedWeather"
        )
        let themedView = routeDetailsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        #expect(hostingController.view != nil, "RouteDetailsScreen S02 should render successfully")

        // Verify via snapshot that weather timeline shows condition changes
        assertSnapshot(
            matching: themedView,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    // MARK: - AC-2: RouteDetails S03 dark mode

    @Test("AC-2: RouteDetails S03 dark mode renders with dark theme")
    func routeDetailsS03Dark() {
        // GIVEN: RouteDetailsScreen S03 dark story is rendered
        let provider = RouteDetailsMockProvider.self
        let state = provider.value(variant: "s03-dark")

        // THEN: Route data should be present
        #expect(!state.route.id.isEmpty, "Should have route ID")
        #expect(!state.route.title.isEmpty, "Should have route title")

        // Verify UI renders correctly in dark mode
        let routeDetailsScreen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            variant: "s03-dark"
        )
        let themedView = routeDetailsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        #expect(hostingController.view != nil, "RouteDetailsScreen S03 should render successfully")

        // Verify via snapshot that dark mode is applied correctly
        assertSnapshot(
            matching: themedView,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .dark),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    // MARK: - AC-3: RouteDetails S04 medium detent

    @Test("AC-3: RouteDetails S04 medium detent renders with medium presentation detent")
    func routeDetailsS04Medium() {
        // GIVEN: RouteDetailsScreen S04 medium detent story is rendered
        let provider = RouteDetailsMockProvider.self
        let state = provider.value(variant: "s04-medium")

        // THEN: Route data should be present
        #expect(!state.route.id.isEmpty, "Should have route ID")
        #expect(state.route.isBest, "Route should be marked as best")

        // Verify UI renders correctly with medium detent
        let routeDetailsScreen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            variant: "s04-medium"
        )
        let themedView = routeDetailsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        #expect(hostingController.view != nil, "RouteDetailsScreen S04 should render successfully")

        // Verify via snapshot that medium detent presentation is correct
        assertSnapshot(
            matching: themedView,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    // MARK: - AC-4: RouteDetails S05 dismissing

    @Test("AC-4: RouteDetails S05 dismissing renders with dismiss drag indicator")
    func routeDetailsS05Dismissing() {
        // GIVEN: RouteDetailsScreen S05 dismissing story is rendered
        let provider = RouteDetailsMockProvider.self
        let state = provider.value(variant: "s05-dismissing")

        // THEN: Route data should be present
        #expect(!state.route.id.isEmpty, "Should have route ID")
        #expect(state.route.isBest, "Route should be marked as best")

        // Verify UI renders correctly with dismiss drag indicator
        let routeDetailsScreen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            variant: "s05-dismissing"
        )
        let themedView = routeDetailsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        #expect(hostingController.view != nil, "RouteDetailsScreen S05 should render successfully")

        // Verify via snapshot that dismiss drag indicator is present
        assertSnapshot(
            matching: themedView,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    // MARK: - AC-5: RouteDetails V01 saved state

    @Test("AC-5: RouteDetails V01 saved state renders with saved pill")
    func routeDetailsV01Saved() {
        // GIVEN: RouteDetailsScreen V01 saved story is rendered
        let provider = RouteDetailsMockProvider.self
        let state = provider.value(variant: "v01-saved")

        // THEN: Route data should be present
        #expect(!state.route.id.isEmpty, "Should have route ID")
        #expect(state.route.isBest, "Route should be marked as best")

        // Verify UI renders correctly with saved pill indicator
        let routeDetailsScreen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            variant: "v01-saved"
        )
        let themedView = routeDetailsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        #expect(hostingController.view != nil, "RouteDetailsScreen V01 should render successfully")

        // Verify via snapshot that saved pill is present
        assertSnapshot(
            matching: themedView,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    // MARK: - AC-6: RouteDetails default state

    @Test("AC-6: RouteDetails default state renders all route information")
    func routeDetailsDefault() {
        // GIVEN: RouteDetailsScreen default story is rendered
        let provider = RouteDetailsMockProvider.self
        let state = provider.value(variant: "default")

        // THEN: All route details should be present
        #expect(!state.route.id.isEmpty, "Should have route ID")
        #expect(!state.route.title.isEmpty, "Should have route title")
        #expect(!state.route.subtitle.isEmpty, "Should have route subtitle")
        #expect(!state.route.distance.isEmpty, "Should have route distance")
        #expect(!state.route.time.isEmpty, "Should have route time")
        #expect(!state.route.climb.isEmpty, "Should have route climb")
        #expect(!state.route.scenic.isEmpty, "Should have route scenic rating")

        // Verify UI renders correctly with all route information
        let routeDetailsScreen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            variant: "default"
        )
        let themedView = routeDetailsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        #expect(hostingController.view != nil, "RouteDetailsScreen default should render successfully")

        // Verify via snapshot that all route details are rendered
        assertSnapshot(
            matching: themedView,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    // MARK: - AC-7: Weather timeline rendering

    @Test("AC-7: Weather timeline renders with hourly conditions and temperatures")
    func routeDetailsWeatherTimeline() {
        // GIVEN: RouteDetailsScreen with weather timeline
        let provider = RouteDetailsMockProvider.self
        let state = provider.value(variant: "default")

        // THEN: Weather timeline should be present with hourly data
        #expect(!state.weatherTimeline.isEmpty, "Should have weather timeline")
        #expect(state.weatherTimeline.count >= 5, "Should have at least 5 weather entries")

        // Verify each weather entry has required fields
        for entry in state.weatherTimeline {
            #expect(!entry.hour.isEmpty, "Weather entry should have hour")
            #expect(!entry.temp.isEmpty, "Weather entry should have temperature")
        }

        // Verify UI renders weather timeline correctly
        let routeDetailsScreen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            variant: "default"
        )
        let themedView = routeDetailsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        #expect(hostingController.view != nil, "RouteDetailsScreen should render weather timeline")

        // Verify via snapshot that weather timeline is rendered
        assertSnapshot(
            matching: themedView,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    // MARK: - AC-8: Route details completeness

    @Test("AC-8: Route details include all required metadata fields")
    func routeDetailsCompleteness() {
        // GIVEN: RouteDetailsScreen with complete route data
        let provider = RouteDetailsMockProvider.self
        let state = provider.value(variant: "default")

        // THEN: Route should have all metadata fields populated
        #expect(!state.route.id.isEmpty, "Route ID is required")
        #expect(!state.route.title.isEmpty, "Route title is required")
        #expect(!state.route.subtitle.isEmpty, "Route subtitle is required")
        #expect(!state.route.distance.isEmpty, "Route distance is required")
        #expect(!state.route.time.isEmpty, "Route time is required")
        #expect(!state.route.climb.isEmpty, "Route climb is required")
        #expect(!state.route.scenic.isEmpty, "Route scenic rating is required")

        // Verify time range is present
        #expect(!state.timeRange.0.isEmpty, "Time range start is required")
        #expect(!state.timeRange.1.isEmpty, "Time range end is required")

        // Verify coordinates are present
        #expect(!state.coordinates.isEmpty, "Route coordinates are required")
        #expect(state.coordinates.count >= 2, "Route should have at least 2 coordinates")

        // Verify UI renders complete route details
        let routeDetailsScreen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            variant: "default"
        )
        let themedView = routeDetailsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        #expect(hostingController.view != nil, "RouteDetailsScreen should render complete details")

        // Verify via snapshot that all metadata fields are displayed
        assertSnapshot(
            matching: themedView,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }
}
