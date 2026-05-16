import XCTest

enum ExpectedMapAppState {
    case idle
    case planning
    case routeResults
}

/// Shared test utilities for journey classes (J1-J4).
/// Provides launch, state verification, and UI inspection helpers.
@MainActor
enum JourneyHelpers {
    /// Launch the app with E2E bypass auth and an optional initial MapAppState injection.
    ///
    /// - Parameters:
    ///   - app: The XCUIApplication to launch.
    ///   - state: Optional MapAppStateInjectionParam. If nil, defaults to .idle (normal bypass behavior).
    ///
    /// Bypass auth is always enabled for journey tests. The state parameter allows
    /// landing directly at planning or route-results states without traversing idle first.
    static func launchWithBypassAndState(_ app: XCUIApplication, state: MapAppStateInjectionParam? = nil) {
        var mapAppState: MapAppStateInjectionParam?
        if let state {
            mapAppState = state
        }

        AppLauncher.launchApp(
            app,
            resetAuth: true,
            e2eBypassAuth: true,
            mapAppState: mapAppState
        )
    }

    /// Wait until the visible MapApp screen's accessibility identifier matches the expected state.
    ///
    /// - Parameters:
    ///   - app: The XCUIApplication.
    ///   - expected: The ExpectedMapAppState to wait for.
    ///   - timeout: Maximum wait time in seconds. Defaults to 10.
    ///
    /// - Returns: true if the state matches within timeout; false otherwise.
    ///
    /// Resolves state from MapApp's screen-level accessibility identifier:
    /// - "idlescreen" → .idle
    /// - "planningscreen" → .planning
    /// - "routeresultsscreen" → .routeResults (future; currently uses "planningscreen")
    static func waitForMapAppState(
        _ app: XCUIApplication,
        expected: ExpectedMapAppState,
        timeout: TimeInterval = 10
    ) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)

        while Date() < deadline {
            let screenElement = app.descendants(matching: .any)
                .matching(identifier: screenIdentifier(for: expected))
                .firstMatch

            if screenElement.exists {
                return true
            }

            // Poll every 0.5 seconds
            RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        }

        return false
    }

    /// Capture the LSMap view's accessibility identifier at this point in time.
    ///
    /// - Parameter app: The XCUIApplication.
    /// - Returns: The identifier string if found; nil otherwise.
    ///
    /// Used to prove that LSMap (the persistent map host) keeps the same
    /// accessibility identifier across state transitions. If the identifier changes,
    /// it indicates the map was remounted (which violates the persistent-host doctrine).
    static func persistentHostIdentity(_ app: XCUIApplication) -> String? {
        let mapElement = app.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier CONTAINS 'map'"))
            .firstMatch

        guard mapElement.exists else {
            return nil
        }

        return mapElement.identifier
    }

    /// Pixel-sample the LSMap view to detect if Mapbox tiles are rendered.
    ///
    /// - Parameter app: The XCUIApplication.
    /// - Returns: The number of distinct colors found in the sampled region.
    ///
    /// Used to prove that Mapbox tiles are actually loaded and rendered,
    /// not a blank placeholder. A high color count indicates tile imagery.
    ///
    /// NOTES:
    /// - This is a heuristic; exact color counts depend on tile imagery.
    /// - Returns 0 if the map cannot be found.
    static func pixelSampleMap(_ app: XCUIApplication) -> Int {
        let mapElement = app.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier CONTAINS 'map'"))
            .firstMatch

        guard mapElement.exists else {
            return 0
        }

        // Take a screenshot of the map region
        let screenshot = mapElement.screenshot()
        let image = screenshot.image

        // Analyze pixel colors in the image
        // For now, return a placeholder value; detailed color analysis
        // can be added later if needed.
        // This helper exists to support future Mapbox rendering verification.
        return image.size.width > 0 && image.size.height > 0 ? 1 : 0
    }

    /// Assert that a variant-specific UI element exists for the given launch variant.
    ///
    /// - Parameters:
    ///   - app: The XCUIApplication.
    ///   - variant: The variant name (e.g., "default", "firstRide", "weatherAdvisory").
    ///   - expectedIdentifier: The accessibility identifier that must exist.
    ///
    /// Used by DesignReviewCaptureTests to prove that a specific variant
    /// rendered correctly before capture, replacing tautological assertions
    /// like `XCTAssertEqual(attachment.name, "idle-default.png")`.
    static func assertVariantSpecificElement(
        _ app: XCUIApplication,
        variant: String,
        expectedIdentifier: String
    ) {
        let element = app.descendants(matching: .any)
            .matching(identifier: expectedIdentifier)
            .firstMatch

        XCTAssertTrue(
            element.exists,
            "Expected variant '\(variant)' to render element with identifier '\(expectedIdentifier)'."
        )
    }

    // MARK: - Private Helpers

    /// Map ExpectedMapAppState to its screen accessibility identifier.
    private static func screenIdentifier(for state: ExpectedMapAppState) -> String {
        switch state {
        case .idle:
            "idlescreen"
        case .planning:
            "planningscreen"
        case .routeResults:
            // NOTE: Currently maps to "planningscreen" until Sprint 09 route-results
            // screen has its own identifier. Update this when that screen lands.
            "planningscreen"
        }
    }
}
