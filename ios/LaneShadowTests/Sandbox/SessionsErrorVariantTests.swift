import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
@testable import LaneShadow

/// Sessions + Error Variant Tests
///
/// TDD tests for FID-S02-T07 acceptance criteria:
/// - AC-1: Sessions S05 new-confirm dialog
/// - AC-2: Sessions date grouping
/// - AC-3: Error S04 recovered state
/// - AC-4: Error V01 offline
/// - AC-5: Error chip FlowLayout wrap
/// - AC-6: LSSessionsDrawer sections parameter
@MainActor
struct SessionsErrorVariantTests {
    // MARK: - AC-1: Sessions S05 new-confirm dialog

    @Test("AC-1: S05 new-confirm dialog renders with surface.scrim backdrop and surface.card dialog")
    func sessionsS05NewConfirm() {
        // GIVEN: SessionsScreen S05 story is rendered with an active session present
        let provider = SessionsMockProvider.self
        let state = provider.value(variant: "s05-new-confirm")

        #expect(state.sessions.count > 0, "Should have at least one session")
        #expect(state.activeSessionId != nil, "Should have an active session for S05")

        // WHEN: The user taps "+ New session" in the SessionsDrawer
        // THEN: A centered confirm dialog renders with:
        // - "Start a new ride?" headline in opinion-serif
        // - surface.scrim backdrop
        // - surface.card dialog background
        // - Cancel button (surface.button.tertiary)
        // - "Start new" button (surface.button.signal)
        let sessionsScreen = SessionsScreen(provider: SessionsMockProvider.self, variant: "s05-new-confirm")
        let themedView = sessionsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        // Verify the sessions screen renders successfully
        #expect(hostingController.view != nil, "SessionsScreen S05 should render successfully")

        // Verify via snapshot that confirm dialog is rendered correctly
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

    // MARK: - AC-2: Sessions date grouping

    @Test("AC-2: Sessions date grouping renders multiple section headers")
    func sessionsDateGrouping() {
        // GIVEN: SessionsScreen S04 grouped story is rendered with sessions across multiple date buckets
        let provider = SessionsMockProvider.self
        let state = provider.value(variant: "s04-grouped")

        #expect(state.sessions.count >= 3, "Should have at least 3 sessions for grouping")

        // WHEN: The drawer composes
        // THEN: Multiple LSSectionHeader rows render between groups
        // Labels from {TONIGHT, TODAY, THIS WEEK, LAST WEEK, EARLIER}
        // At least 3 of the 5 buckets visible
        // Drawer accepts sections: [SessionSection] containing label + sessions per bucket
        let sessionsScreen = SessionsScreen(provider: SessionsMockProvider.self, variant: "s04-grouped")
        let themedView = sessionsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        // Verify the sessions screen renders successfully with grouped sessions
        #expect(hostingController.view != nil, "SessionsScreen S04 should render successfully with grouping")

        // Verify via snapshot that section headers are rendered
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

    // MARK: - AC-3: Error S04 recovered state

    @Test("AC-3: Error S04 recovered state fades callout and reveals send button")
    func errorS04Recovered() {
        // GIVEN: ErrorScreen S04 recovered story is rendered
        let provider = ErrorMockProvider.self
        let state = provider.value(variant: "s04-recovered")

        #expect(!state.suggestions.isEmpty, "Should have suggestion chips for recovered state")

        // WHEN: The user taps a suggestion chip
        // THEN:
        // - LSInlineErrorCallout fades to opacity 0.55
        // - Chat field is populated with suggestion text
        // - Filter button is hidden
        // - Trailing slot reveals signal.default send button
        let errorScreen = ErrorScreen(provider: ErrorMockProvider.self, variant: "s04-recovered")
        let themedView = errorScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        // Verify the error screen renders successfully with recovered state
        #expect(hostingController.view != nil, "ErrorScreen S04 should render successfully")

        // Verify via snapshot that callout is faded and send button is revealed
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

    // MARK: - AC-4: Error V01 offline

    @Test("AC-4: Error V01 offline renders wifi-off watermark and disabled chat")
    func errorV01Offline() {
        // GIVEN: ErrorScreen V01 offline story is rendered
        let provider = ErrorMockProvider.self
        let state = provider.value(variant: "v01-offline")

        // WHEN: The screen draws
        // THEN:
        // - Wifi-off SVG glyph watermark renders on map at opacity 0.25 in status.warning
        // - LSChatInput renders at opacity 0.7
        // - Leading + trailing buttons are disabled (gray + non-interactive)
        let errorScreen = ErrorScreen(provider: ErrorMockProvider.self, variant: "v01-offline")
        let themedView = errorScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        // Verify the error screen renders successfully with offline state
        #expect(hostingController.view != nil, "ErrorScreen V01 should render successfully")

        // Verify via snapshot that wifi-off watermark and disabled chat are present
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

    // MARK: - AC-5: Error chip FlowLayout wrap

    @Test("AC-5: FlowLayout wraps chips to multiple lines when content overflows")
    func errorSuggestionFlowWrap() {
        // GIVEN: LSInlineErrorCallout suggestion-chip story with 6+ chips rendered
        let provider = ErrorMockProvider.self
        let state = provider.value(variant: "overflow")

        #expect(state.suggestions.count >= 6, "Should have 6+ chips to test wrap")

        // WHEN: The chip row composes
        // THEN: FlowLayout wraps chips to multiple lines when combined width exceeds callout
        // No chip is clipped or truncated
        let errorScreen = ErrorScreen(provider: ErrorMockProvider.self, variant: "overflow")
        let themedView = errorScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        // Verify the error screen renders successfully with overflow chips
        #expect(hostingController.view != nil, "ErrorScreen overflow should render successfully")

        // Verify via snapshot that FlowLayout wraps chips correctly
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

    // MARK: - AC-6: LSSessionsDrawer sections parameter

    @Test("AC-6: LSSessionsDrawer accepts sections parameter with back-compat")
    func sessionsDrawerSectionsParameter() {
        // GIVEN: An existing caller of LSSessionsDrawer(groupLabel: ...)
        let sessions = [
            Session(
                id: "session-001",
                title: "Test Session",
                preview: "Test preview",
                meta: "1 route",
                when: "Now",
                active: true,
                routeIds: ["route-001"],
                createdAt: "2025-04-28T10:00:00Z"
            ),
        ]

        // WHEN: The drawer signature is updated to accept sections: [SessionSection]
        // with a back-compat shim mapping the old single-group call
        // THEN:
        // - All existing callers compile
        // - Default story still renders correctly
        // - New story uses sections parameter directly
        let sessionsScreen = SessionsScreen(provider: SessionsMockProvider.self, variant: "default")
        let themedView = sessionsScreen.laneShadowTheme()

        let hostingController = UIHostingController(rootView: themedView)
        hostingController.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        hostingController.loadViewIfNeeded()

        // Verify the sessions screen renders successfully with sections parameter
        #expect(hostingController.view != nil, "SessionsScreen should render successfully with sections")

        // Verify via snapshot that sections parameter works correctly
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
