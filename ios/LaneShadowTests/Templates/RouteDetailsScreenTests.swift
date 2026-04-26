import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import XCTest
@testable import LaneShadow

@MainActor
@Suite("RouteDetailsScreen Template Tests")
struct RouteDetailsScreenTests {
    // MARK: - AC-1: RouteDetails composition renders

    @Test("TC-1: Default snapshot matches baseline")
    func defaultSnapshotMatchesBaseline() {
        let screen = RouteDetailsScreen(provider: RouteDetailsMockProvider.self)

        assertSnapshot(
            matching: screen,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    // MARK: - AC-2: Save/Ride callbacks

    @Test("TC-2: Screen accepts onSave and onRide callbacks")
    func screenAcceptsSaveRideCallbacks() {
        var saveCount = 0
        var rideCount = 0

        let screen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            onSave: { saveCount += 1 },
            onRide: { rideCount += 1 },
            onDismiss: {}
        )

        // Verify screen renders with callbacks wired
        #expect(!TypeReflection.isEmptyView(screen))
    }

    // MARK: - AC-3: Detent drag + dismiss

    @Test("TC-3: Screen accepts onDismiss callback")
    func screenAcceptsDismissCallback() {
        var dismissCount = 0

        let screen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            onDismiss: { dismissCount += 1 }
        )

        // Verify screen renders with dismiss callback wired
        #expect(!TypeReflection.isEmptyView(screen))
    }

    // MARK: - AC-4: Weather variants exist

    @Test("TC-4: Mixed weather variant exists in story registry")
    func mixedWeatherVariantExists() {
        let allStories = TemplateStories.all
        let mixedWeatherStory = allStories.first { $0.id == "templates.routeDetails.mixedWeather" }

        #expect(mixedWeatherStory != nil)
    }

    @Test("TC-4: Default weather variant exists in story registry")
    func defaultWeatherVariantExists() {
        let allStories = TemplateStories.all
        let defaultStory = allStories.first { $0.id == "templates.routeDetails.default" }

        #expect(defaultStory != nil)
    }

    // MARK: - AC-5: Light/dark token re-resolution

    @Test("TC-5: Dark snapshot matches baseline")
    func darkSnapshotMatchesBaseline() {
        let screen = RouteDetailsScreen(provider: RouteDetailsMockProvider.self)

        assertSnapshot(
            matching: screen,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .dark),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    // MARK: - AC-6: No data fetching in template

    @Test("TC-6: No Convex imports in RouteDetailsScreen")
    func noConvexImports() throws {
        let sourceCode = try String(contentsOfFile: "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift", encoding: .utf8)

        let hasConvex = sourceCode.contains("Convex")
        #expect(!hasConvex)
    }

    @Test("TC-6: No URLSession in RouteDetailsScreen")
    func noURLSession() throws {
        let sourceCode = try String(contentsOfFile: "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift", encoding: .utf8)

        let hasURLSession = sourceCode.contains("URLSession")
        #expect(!hasURLSession)
    }

    @Test("TC-6: No .task modifier in RouteDetailsScreen")
    func noTaskModifier() throws {
        let sourceCode = try String(contentsOfFile: "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift", encoding: .utf8)

        let hasTask = sourceCode.contains(".task(")
        #expect(!hasTask)
    }
}

// MARK: - Test Helpers

enum TypeReflection {
    static func isEmptyView(_ view: some View) -> Bool {
        String(reflecting: view).contains("EmptyView")
    }
}
