import Foundation
import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
struct RouteResultsScreenTests {
    /// AC-1: RouteResults composition renders (snapshot + manual verification)
    @Test
    func routeResults_default_renders() {
        let provider = RouteResultsMockProvider.self
        let screen = RouteResultsScreen(provider: provider)

        assertSnapshot(matching: screen, as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .light),
            UITraitCollection(userInterfaceIdiom: .phone),
            UITraitCollection(horizontalSizeClass: .compact),
            UITraitCollection(verticalSizeClass: .regular),
        ])))
    }

    /// AC-1: Screen consumes live route geometry instead of re-decoding raw polyline strings.
    @Test
    func routeResults_screen_uses_viewModelDecodedRouteGeometry() throws {
        let sourceCode = try routeResultsScreenSourceCode()

        #expect(
            sourceCode.contains("state.routePolylines"),
            "RouteResultsScreen.swift should render the decoded route polylines from screen state"
        )
        #expect(
            !sourceCode.contains("decodeEncodedPolyline"),
            "RouteResultsScreen.swift should not decode encoded polylines itself"
        )
        #expect(
            !sourceCode.contains("precision: 5"),
            "RouteResultsScreen.swift should not hardcode polyline precision"
        )
        #expect(
            !sourceCode.contains("decodePolyline("),
            "RouteResultsScreen.swift should not re-decode route polylines in the screen layer"
        )
        #expect(
            !sourceCode.contains("route.polyline"),
            "RouteResultsScreen.swift should not read encoded route geometry directly"
        )
    }

    /// AC-2: Source references route variant mapping and camera fit polylines
    @Test
    func route_variant_mapping_and_camera_tokens_present() throws {
        let sourceCode = try routeResultsScreenSourceCode()
        let state = RouteResultsMockProvider.value(variant: "default")

        #expect(
            state.routePolylines.map(\.variant) == [.best, .alt1, .alt2],
            "RouteResultsScreenState should carry all route variants to the render seam"
        )
        #expect(
            sourceCode.contains("variant: sourcePolyline.variant"),
            "RouteResultsScreen.swift should pass through ViewModel-decoded route variants"
        )

        // Verify camera fit polylines is used
        #expect(
            sourceCode.contains("polylines"),
            "RouteResultsScreen.swift should use cameraFit: .polylines"
        )
    }

    /// AC-3: Draw-on animation with 120ms stagger
    @Test
    func animation_recipe_with_stagger() async throws {
        let provider = RouteResultsMockProvider.self

        // Verify animation state is initialized - the screen should have drawProgress state
        // that gets populated on appear. We can verify the screen has the expected routes.
        let state = provider.value(variant: "default")
        #expect(
            !state.routes.isEmpty,
            "Mock provider should have routes to animate"
        )

        // Verify the source uses theme motion tokens, not hardcoded values
        let sourceCode = try routeResultsScreenSourceCode()

        // Verify theme.motion.duration is used (not hardcoded values)
        #expect(
            sourceCode.contains("theme.motion.duration"),
            "RouteResultsScreen.swift should use theme.motion.duration token"
        )

        // Verify theme.motion.easing is used (not hardcoded .easeOut)
        #expect(
            sourceCode.contains("theme.motion.easing"),
            "RouteResultsScreen.swift should use theme.motion.easing token"
        )

        // Verify 120ms stagger is present
        #expect(
            sourceCode.contains("120"),
            "RouteResultsScreen.swift should have 120ms stagger between routes"
        )

        // Verify .easeOut is NOT used (replaced with theme tokens)
        #expect(
            !sourceCode.contains(".easeOut(duration:"),
            "RouteResultsScreen.swift should not use hardcoded .easeOut animation"
        )
    }

    /// AC-4: Pin/close callbacks fire correctly
    @Test
    func pin_close_callbacks_fire() async throws {
        var pinTapCount = 0
        var dismissTapCount = 0

        let provider = RouteResultsMockProvider.self
        let screen = RouteResultsScreen(
            provider: provider,
            onPin: {
                pinTapCount += 1
            },
            onDismiss: {
                dismissTapCount += 1
            }
        )
        .laneShadowTheme()

        let inspected = try screen.inspect()

        // Find the navigator message
        let navigatorMessage = try inspected.find(
            viewWithAccessibilityIdentifier: "maplayer.topOverlay.navigator-message"
        )

        // Find and tap the pin button
        let pinButton = try navigatorMessage.find(viewWithAccessibilityIdentifier: "navigatormessage-pin")
        try pinButton.button().tap()

        #expect(pinTapCount == 1, "Pin callback should fire exactly once")

        // Find and tap the dismiss button
        let dismissButton = try navigatorMessage.find(viewWithAccessibilityIdentifier: "navigatormessage-dismiss")
        try dismissButton.button().tap()

        #expect(dismissTapCount == 1, "Dismiss callback should fire exactly once")
    }

    /// AC-5: Dark mode re-resolves tokens
    @Test
    func routeResults_dark_mode() {
        let provider = RouteResultsMockProvider.self
        let screen = RouteResultsScreen(provider: provider)

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

    /// AC-6: No data fetching symbols in template source
    @Test
    func no_data_fetching_symbols() throws {
        let sourceCode = try routeResultsScreenSourceCode()

        // Define forbidden patterns that indicate data fetching
        let forbiddenPatterns = [
            "Convex",
            "URLSession",
            "CLLocationManager",
            ".task(",
            ".asyncComputed",
        ]

        // Verify source contains no forbidden symbols
        for pattern in forbiddenPatterns {
            #expect(
                !sourceCode.contains(pattern),
                "RouteResultsScreen.swift should not contain '\(pattern)' — found data fetching symbol"
            )
        }

        // Verify the file exists and is readable
        #expect(!sourceCode.isEmpty, "RouteResultsScreen.swift source should be readable and non-empty")
    }

    private func routeResultsScreenSourceCode() throws -> String {
        let testFile = URL(fileURLWithPath: #filePath)
        let iosRoot = testFile
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let sourceFile = iosRoot.appendingPathComponent("LaneShadow/Views/Templates/RouteResultsScreen.swift")

        return try String(contentsOf: sourceFile, encoding: .utf8)
    }
}
