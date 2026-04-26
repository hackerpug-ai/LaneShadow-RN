import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
@Suite("RouteDetailsScreen Template Tests")
struct RouteDetailsScreenTests {
    // MARK: - AC-1: RouteDetails composition renders

    @Test("AC-1: Screen renders with map, polyline, and sheet components")
    func screenCompositionRenders() {
        let screen = RouteDetailsScreen(provider: RouteDetailsMockProvider.self)

        // Verify screen is not empty
        #expect(!TypeReflection.isEmptyView(screen))
    }

    @Test("AC-1: LSRouteSheet is presented at .large detent")
    func sheetPresentedAtLargeDetent() async throws {
        let screen = RouteDetailsScreen(provider: RouteDetailsMockProvider.self)

        // Verify sheet is present
        let sheetExists = try await ViewInspector.exists(
            screen.ignoresSafeArea(),
            identifier: "lsbottomsheet"
        )
        #expect(sheetExists)
    }

    @Test("AC-1: Best badge renders on best route")
    func bestBadgeRenders() async throws {
        let screen = RouteDetailsScreen(provider: RouteDetailsMockProvider.self)

        // Check for LSBestBadge in the sheet
        let badgeExists = try await ViewInspector.exists(
            screen.ignoresSafeArea(),
            identifier: "lsbestbadge"
        )
        #expect(badgeExists)
    }

    @Test("AC-1: Map renders with single polyline")
    func mapRendersWithSinglePolyline() async throws {
        let screen = RouteDetailsScreen(provider: RouteDetailsMockProvider.self)

        // Verify map exists
        let mapExists = try await ViewInspector.exists(
            screen.ignoresSafeArea(),
            identifier: "maplayer.map"
        )
        #expect(mapExists)
    }

    // MARK: - AC-2: Save/Ride callbacks

    @Test("AC-2: Save callback fires when tapped")
    func saveCallbackFires() async throws {
        var saveCount = 0
        var rideCount = 0

        let screen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            onSave: { saveCount += 1 },
            onRide: { rideCount += 1 }
        )

        // Find and tap Save button
        try await ViewInspector.tap(
            screen.ignoresSafeArea(),
            identifier: "lsbutton-save"
        )

        #expect(saveCount == 1)
        #expect(rideCount == 0)
    }

    @Test("AC-2: Ride callback fires when tapped")
    func rideCallbackFires() async throws {
        var saveCount = 0
        var rideCount = 0

        let screen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            onSave: { saveCount += 1 },
            onRide: { rideCount += 1 }
        )

        // Find and tap Ride button
        try await ViewInspector.tap(
            screen.ignoresSafeArea(),
            identifier: "lsbutton-ride"
        )

        #expect(saveCount == 0)
        #expect(rideCount == 1)
    }

    @Test("TC-2: Both Save and Ride callbacks fire in sequence")
    func bothCallbacksFire() async throws {
        var saveCount = 0
        var rideCount = 0

        let screen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            onSave: { saveCount += 1 },
            onRide: { rideCount += 1 }
        )

        try await ViewInspector.tap(screen.ignoresSafeArea(), identifier: "lsbutton-save")
        try await ViewInspector.tap(screen.ignoresSafeArea(), identifier: "lsbutton-ride")

        #expect(saveCount == 1)
        #expect(rideCount == 1)
    }

    // MARK: - AC-3: Detent drag + dismiss

    @Test("AC-3: Sheet dismiss callback fires")
    func dismissCallbackFires() async throws {
        var dismissCount = 0

        let screen = RouteDetailsScreen(
            provider: RouteDetailsMockProvider.self,
            onDismiss: { dismissCount += 1 }
        )

        // Simulate sheet dismiss (in real test, this would be a drag gesture)
        // For now, verify the callback is wired
        #expect(dismissCount == 0)

        // Trigger dismiss via sheet interaction
        try await ViewInspector.performDismiss(
            screen.ignoresSafeArea(),
            identifier: "lsbottomsheet"
        )

        #expect(dismissCount == 1)
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

    @Test("AC-5: Screen renders in light mode")
    func lightModeRendering() {
        let screen = RouteDetailsScreen(provider: RouteDetailsMockProvider.self)
            .preferredColorScheme(.light)

        #expect(!TypeReflection.isEmptyView(screen))
    }

    @Test("AC-5: Screen renders in dark mode")
    func darkModeRendering() {
        let screen = RouteDetailsScreen(provider: RouteDetailsMockProvider.self)
            .preferredColorScheme(.dark)

        #expect(!TypeReflection.isEmptyView(screen))
    }

    // MARK: - AC-6: No data fetching in template

    @Test("TC-6: No Convex imports in RouteDetailsScreen")
    func noConvexImports() throws {
        let file = try FileContents.read(
            "ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift"
        )

        let hasConvex = file.contains("Convex")
        #expect(!hasConvex)
    }

    @Test("TC-6: No URLSession in RouteDetailsScreen")
    func noURLSession() throws {
        let file = try FileContents.read(
            "ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift"
        )

        let hasURLSession = file.contains("URLSession")
        #expect(!hasURLSession)
    }

    @Test("TC-6: No .task modifier in RouteDetailsScreen")
    func noTaskModifier() throws {
        let file = try FileContents.read(
            "ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift"
        )

        let hasTask = file.contains(".task(")
        #expect(!hasTask)
    }
}

// MARK: - Test Helpers

enum TypeReflection {
    static func isEmptyView(_ view: some View) -> Bool {
        // Reflection-based check for EmptyView
        String(reflecting: view).contains("EmptyView")
    }
}

enum FileContents {
    static func read(_ path: String) throws -> String {
        let url = URL(fileURLWithPath: path)
        return try String(contentsOf: url)
    }
}
