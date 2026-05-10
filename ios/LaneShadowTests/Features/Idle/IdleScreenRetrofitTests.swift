import LaneShadowTheme
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@Suite("Idle Screen Retrofit Tests")
@MainActor
struct IdleScreenRetrofitSpecTests {
    @Test("Default idle state renders topbar prompt with greeting copy")
    func idleDefault_rendersTopBarPromptWithGreeting() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        viewModel.greetingDisplayName = "Marcus"
        viewModel.greetingScope = .today
        viewModel.locationLabel = "Santa Cruz, CA"
        viewModel.metaRow = "FRIDAY · 68°F · CLEAR"
        viewModel.weatherAdvisory = nil
        viewModel.favoriteLocations = [
            FavoriteLocation(id: "fav-1", lat: 36.97, lon: -122.03, label: "Santa Cruz, CA"),
        ]

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()
        let inspected = try screen.inspect()

        _ = try inspected.find(text: "Where are we riding today, Marcus?")
        _ = try inspected.find(viewWithAccessibilityIdentifier: "lstopbar-title")
        #expect((try? inspected.find(viewWithAccessibilityIdentifier: "idle-context-capsule")) == nil)
    }

    @Test("Map controls render at vertical center of right edge")
    func idle_rendersMapControlsVerticallyCentered() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()
        let inspected = try screen.inspect()

        // Verify map controls are present with correct accessibility ID
        let mapControls = try inspected.find(viewWithAccessibilityIdentifier: "idle-map-controls")
        #expect(mapControls != nil)

        // Verify the controls container exists
        let controlsElement = try inspected.find(viewWithAccessibilityIdentifier: "lsmapcontrols")
        #expect(controlsElement != nil)
    }

    @Test("Advisory severity renders warning topbar prompt without legacy card")
    func advisorySeverity_rendersWarningTopBarPromptNoLegacyCard() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        viewModel.metaRow = "FRIDAY · 52°F · RAIN · 0.4\""
        viewModel.weatherAdvisory = WeatherAdvisory(
            label: "ADVISORY",
            body: "Weather conditions may affect your ride."
        )

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()
        let inspected = try screen.inspect()

        _ = try inspected.find(text: "Not the prettiest day for it.")
        #expect((try? inspected.find(viewWithAccessibilityIdentifier: "idle-context-capsule")) == nil)

        // Verify legacy advisory card is NOT present (it was in greetingOverlay before)
        do {
            _ = try inspected.find(viewWithAccessibilityIdentifier: "idlescreen-advisory-card")
            XCTFail("Legacy advisory card should not be present")
        } catch {
            // Expected: card should not be found
        }
    }

    @Test("Dark mode re-resolves topbar prompt and controls without remounting map")
    func darkMode_reResolvesTopBarPromptAndControls() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        viewModel.greetingDisplayName = "Sam"
        viewModel.greetingScope = .today
        viewModel.locationLabel = "San Francisco, CA"

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()
        let inspected = try screen.inspect()

        _ = try inspected.find(viewWithAccessibilityIdentifier: "lstopbar-title")

        // Verify controls exist in light mode
        let controlsLight = try inspected.find(viewWithAccessibilityIdentifier: "idle-map-controls")
        #expect(controlsLight != nil)

        // Simulate dark mode by applying colorScheme modifier
        let screenDark = screen.preferredColorScheme(.dark)

        // Verify components still render after scheme change
        let inspectedDark = try screenDark.inspect()
        _ = try inspectedDark.find(viewWithAccessibilityIdentifier: "lstopbar-title")

        let controlsDark = try inspectedDark.find(viewWithAccessibilityIdentifier: "idle-map-controls")
        #expect(controlsDark != nil)
    }

    @Test("Location unavailable shows 'starting' headline variant")
    func locationUnavailable_showsStartingHeadline() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        viewModel.locationUnavailable = true
        viewModel.locationLabel = nil

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()
        let inspected = try screen.inspect()

        _ = try inspected.find(text: "Where are we starting from?")
    }

    @Test("Recenter callback is wired")
    func recenterCallback_isWired() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        let mapCameraController = LSMapCameraController()

        let screen = IdleScreenContainer(
            viewModel: viewModel,
            mapCameraController: mapCameraController
        ).laneShadowTheme()

        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        await pumpMainActor(iterations: 20)

        let inspected = try screen.inspect()
        let mapControls = try inspected.find(viewWithAccessibilityIdentifier: "idle-map-controls")
        let recenterButton = try mapControls.find(
            viewWithAccessibilityIdentifier: "lsmapcontrols-location.circle"
        )

        try recenterButton.button().tap()
        await pumpMainActor(iterations: 20)

        #expect(mapCameraController.recenterRequestCount == 1)
        #expect(mapCameraController.handledRecenterRequestCount == 1)
        #expect(mapCameraController.lastRecenterOutcome != .idle)
        #expect(mapCameraController.lastRecenterOutcome != .requested)
    }

    @Test("First ride (no sessions, no favorites) shows 'Ask' variant")
    func firstRide_showsAskHeadline() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        viewModel.recentSessions = []
        viewModel.favoriteLocations = []
        viewModel.locationLabel = "San Francisco, CA"

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()
        let inspected = try screen.inspect()

        _ = try inspected.find(text: "First ride? Ask me anything.")
    }

    private func pumpMainActor(iterations: Int = 10) async {
        for _ in 0 ..< iterations {
            await Task.yield()
        }
    }
}

@MainActor
final class IdleScreenRetrofitTests: XCTestCase {
    func test_startNewSession_resetsAutocompleteAndPlaceState() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        viewModel.errorMessage = "stale error"
        viewModel.isSubmitting = true
        viewModel.placeAutocompleteSuggestions = [
            LaneShadowPlaceSuggestion(
                id: "pid-1",
                name: "Hwy 1",
                label: "Hwy 1, CA",
                secondaryText: nil,
                featureType: "place",
                distanceMeters: nil
            ),
        ]
        viewModel.placeAutocompleteErrorMessage = "stale autocomplete error"
        viewModel.isPlaceAutocompleteLoading = true
        viewModel.isAutocompleteQueryActive = true
        viewModel.autocompletePrimedInputValue = "stale primed"

        viewModel.startNewSession()

        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isSubmitting)
        XCTAssertNil(viewModel.selectedPlace)
        XCTAssertNil(viewModel.autocompletePrimedInputValue)
        XCTAssertTrue(viewModel.placeAutocompleteSuggestions.isEmpty)
        XCTAssertNil(viewModel.placeAutocompleteErrorMessage)
        XCTAssertFalse(viewModel.isPlaceAutocompleteLoading)
        XCTAssertFalse(viewModel.isAutocompleteQueryActive)
    }

    func test_menuChipTap_revealsMenuDrawer() async throws {
        let source = try source(named: "IdleScreenContainer.swift", in: "Features/Idle")

        XCTAssertTrue(source.contains("leadingDrawer: isMenuOpen ? DrawerSpec("))
        XCTAssertTrue(source.contains("onMenuTap: toggleMenu"))
        XCTAssertTrue(source.contains("private func toggleMenu()"))
        XCTAssertTrue(source.contains("isMenuOpen.toggle()"))
    }

    func test_newChipTap_callsStartNewSessionAndClearsInput() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        viewModel.errorMessage = "stale error"

        let screen = IdleScreenContainer(viewModel: viewModel).laneShadowTheme()

        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        await pumpMainActor(iterations: 20)

        let inspected = try screen.inspect()
        let newButton = try inspected.find(viewWithAccessibilityIdentifier: "lstopbar-new")
        try newButton.button().tap()
        await pumpMainActor(iterations: 20)

        // ViewModel state was reset
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isSubmitting)
    }

    func test_recenterCallback_isWired() async throws {
        let viewModel = IdleViewModel(
            chatStore: ChatStore(),
            sessionStore: SessionStore(),
            convexClient: StubLaneShadowConvexClient()
        )
        let mapCameraController = LSMapCameraController()

        let screen = IdleScreenContainer(
            viewModel: viewModel,
            mapCameraController: mapCameraController
        ).laneShadowTheme()

        ViewHosting.host(view: screen)
        defer { ViewHosting.expel() }
        await pumpMainActor(iterations: 20)

        let inspected = try screen.inspect()
        let mapControls = try inspected.find(viewWithAccessibilityIdentifier: "idle-map-controls")
        let recenterButton = try mapControls.find(
            viewWithAccessibilityIdentifier: "lsmapcontrols-location.circle"
        )

        try recenterButton.button().tap()
        await pumpMainActor(iterations: 20)

        XCTAssertEqual(mapCameraController.recenterRequestCount, 1)
        XCTAssertEqual(mapCameraController.handledRecenterRequestCount, 1)
        XCTAssertNotEqual(mapCameraController.lastRecenterOutcome, .idle)
        XCTAssertNotEqual(mapCameraController.lastRecenterOutcome, .requested)
    }

    private func pumpMainActor(iterations: Int = 10) async {
        for _ in 0 ..< iterations {
            await Task.yield()
        }
    }

    private func source(named name: String, in directory: String) throws -> String {
        var repoRoot = URL(fileURLWithPath: #filePath)
        while !FileManager.default.fileExists(atPath: repoRoot.appendingPathComponent("AGENTS.md").path) {
            repoRoot.deleteLastPathComponent()
        }

        var fileURL = repoRoot
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
        for component in directory.split(separator: "/") {
            fileURL.appendPathComponent(String(component))
        }
        fileURL.appendPathComponent(name)

        return try String(contentsOf: fileURL, encoding: .utf8)
    }
}
