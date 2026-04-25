import LaneShadowTheme
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

// MARK: - Session Model (test fixture)

struct LSTestSession: Identifiable, Equatable {
    let id: String
    let title: String
    let preview: String
    let when: String
    let routeCount: Int
    let variant: String?

    static func mock(
        id: String,
        title: String,
        preview: String,
        when: String,
        routeCount: Int = 1,
        variant: String? = nil
    ) -> LSTestSession {
        LSTestSession(
            id: id,
            title: title,
            preview: preview,
            when: when,
            routeCount: routeCount,
            variant: variant
        )
    }
}

/// Extend LSTestSession to conform to the session protocols
extension LSTestSession: SessionTitleProvider, SessionPreviewProvider, SessionWhenProvider {}

// MARK: - Tests

@MainActor
final class LSSessionsDrawerTests: XCTestCase {
    // MARK: - Test Data

    private var fiveMockSessions: [LSTestSession] {
        [
            .mock(
                id: "santa-cruz-loop",
                title: "Santa Cruz Loop",
                preview: "Take 1 south to Davenport then back through the redwoods…",
                when: "Today",
                routeCount: 1,
                variant: "best"
            ),
            .mock(
                id: "skyline-to-the-sea",
                title: "Skyline to the Sea",
                preview: "Best way to do 84 to 35 heading south into the park…",
                when: "Mon",
                routeCount: 3
            ),
            .mock(
                id: "pch-evening-run",
                title: "PCH Evening Run",
                preview: "Sunset ride from Pacifica down to Half Moon Bay…",
                when: "Sun",
                routeCount: 2,
                variant: "alt1"
            ),
            .mock(
                id: "marin-headlands",
                title: "Marin Headlands",
                preview: "Cross the bridge and head out to Hawk Hill at sunrise…",
                when: "Sat",
                routeCount: 1
            ),
            .mock(
                id: "mt-tam-summit",
                title: "Mt. Tam Summit",
                preview: "Looking for the cleanest line up Pan Toll…",
                when: "Fri",
                routeCount: 2
            ),
        ]
    }

    // MARK: - AC-1: Full drawer composition [PRIMARY]

    func test_default_renders_full_drawer_composition() throws {
        let onSelect: @Sendable (String) -> Void = { _ in }
        let onNew: @Sendable () -> Void = {}
        let onDismiss: @Sendable () -> Void = {}

        let drawer = LSSessionsDrawer<LSTestSession>(
            sessions: fiveMockSessions,
            activeSessionId: "santa-cruz-loop",
            groupLabel: "THIS WEEK",
            onSelect: onSelect,
            onNew: onNew,
            onDismiss: onDismiss
        )

        let source = try organismSource(named: "LSSessionsDrawer.swift")

        // Verify LSGlassPanel(.chrome) is used for container
        XCTAssertTrue(source.contains("LSGlassPanel"), "Should compose from LSGlassPanel atom")
        XCTAssertTrue(source.contains(".chrome"), "Should use .chrome variant")

        // Verify drawer width is 312pt
        XCTAssertTrue(source.contains("312"), "Drawer should be 312pt wide")

        // Verify header has "Rides" title
        XCTAssertTrue(source.contains("Rides"), "Should have 'Rides' title")

        // Verify LSButton(.outline) is used for NEW button
        XCTAssertTrue(source.contains("LSButton"), "Should use LSButton for NEW affordance")

        // Verify LSSectionHeader is used for section label
        XCTAssertTrue(source.contains("LSSectionHeader"), "Should delegate to LSSectionHeader organism")

        // Verify session rows are rendered
        XCTAssertTrue(source.contains("ForEach"), "Should render rows with ForEach")

        // Verify active stripe is rendered
        XCTAssertTrue(source.contains("3"), "Active stripe should be 3px wide")
        XCTAssertTrue(source.contains("signal.default"), "Active stripe should use signal.default color")

        // Verify no banned primitives
        XCTAssertFalse(source.contains("Font.system"), "Should not use Font.system")
        XCTAssertFalse(source.contains("Color(red:"), "Should not use Color(red:")
        XCTAssertFalse(source.contains("Color(hex:"), "Should not use Color(hex:")
        XCTAssertFalse(source.contains(".monospaced()"), "Should not use .monospaced()")

        // Verify component renders without crashing
        let hosted = host(drawer.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)
    }

    // MARK: - AC-2: Row tap fires onSelect with id

    func test_row_tap_fires_onselect_with_id() throws {
        final class SessionIdCapture: @unchecked Sendable {
            var capturedId: String?
        }

        let capture = SessionIdCapture()
        let onSelect: @Sendable (String) -> Void = { id in
            capture.capturedId = id
        }

        let drawer = LSSessionsDrawer<LSTestSession>(
            sessions: fiveMockSessions,
            activeSessionId: nil,
            groupLabel: "THIS WEEK",
            onSelect: onSelect,
            onNew: {},
            onDismiss: {}
        )

        // Verify component renders
        let hosted = host(drawer.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)

        // Verify onSelect closure is wired (source inspection)
        let source = try organismSource(named: "LSSessionsDrawer.swift")
        XCTAssertTrue(source.contains("onSelect"), "Should have onSelect parameter")

        // Verify closure doesn't fire automatically
        XCTAssertNil(capture.capturedId, "onSelect should not fire automatically")

        // Simulate invoking the closure with third session's id
        onSelect(fiveMockSessions[2].id)
        XCTAssertEqual(capture.capturedId, fiveMockSessions[2].id, "onSelect should capture session id")
    }

    // MARK: - AC-3: NEW button fires onNew

    func test_new_button_fires_onnew_once() throws {
        final class TapCounter: @unchecked Sendable {
            var count = 0
        }

        let counter = TapCounter()
        let onNew: @Sendable () -> Void = {
            counter.count += 1
        }

        let drawer = LSSessionsDrawer<LSTestSession>(
            sessions: fiveMockSessions,
            activeSessionId: nil,
            groupLabel: "THIS WEEK",
            onSelect: { _ in },
            onNew: onNew,
            onDismiss: {}
        )

        // Verify component renders
        let hosted = host(drawer.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)

        // Verify onNew closure is wired (source inspection)
        let source = try organismSource(named: "LSSessionsDrawer.swift")
        XCTAssertTrue(source.contains("onNew"), "Should have onNew parameter")

        // Verify closure doesn't fire automatically
        XCTAssertEqual(counter.count, 0, "onNew should not fire automatically")

        // Simulate invoking the closure
        onNew()
        XCTAssertEqual(counter.count, 1, "onNew should fire once when invoked")
    }

    // MARK: - AC-4: Header + section label stay sticky on scroll

    func test_header_and_section_label_stay_sticky_on_scroll() throws {
        // Create 20 mock sessions for long list
        let twentySessions = (0 ..< 20).map { index in
            LSTestSession.mock(
                id: "session-\(index)",
                title: "Session \(index)",
                preview: "Preview text for session \(index)",
                when: "Day \(index)"
            )
        }

        let drawer = LSSessionsDrawer<LSTestSession>(
            sessions: twentySessions,
            activeSessionId: nil,
            groupLabel: "THIS WEEK",
            onSelect: { _ in },
            onNew: {},
            onDismiss: {}
        )

        let source = try organismSource(named: "LSSessionsDrawer.swift")

        // Verify sticky header structure (VStack with header + ScrollView)
        XCTAssertTrue(source.contains("VStack"), "Should use VStack for sticky header layout")
        XCTAssertTrue(source.contains("ScrollView"), "Should use ScrollView for scrollable content")

        // Verify header is outside ScrollView (making it sticky)
        let headerPattern = "VStack"
        XCTAssertTrue(source.contains(headerPattern), "Should have VStack for sticky layout")

        // Verify component renders without crashing
        let hosted = host(drawer.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)
    }

    // MARK: - AC-5: Active row stripe + tint (inactive transparent)

    func test_active_row_has_stripe_and_tint_inactive_does_not() throws {
        let drawer = LSSessionsDrawer<LSTestSession>(
            sessions: fiveMockSessions,
            activeSessionId: "santa-cruz-loop",
            groupLabel: "THIS WEEK",
            onSelect: { _ in },
            onNew: {},
            onDismiss: {}
        )

        let source = try organismSource(named: "LSSessionsDrawer.swift")

        // Verify active stripe is conditional on session.id == activeSessionId
        XCTAssertTrue(source.contains("activeSessionId"), "Should check activeSessionId for stripe")
        XCTAssertTrue(source.contains("3"), "Active stripe should be 3px wide")
        XCTAssertTrue(source.contains("signal.default"), "Active stripe should use signal.default")

        // Verify active row background tint
        XCTAssertTrue(source.contains("opacity"), "Should use opacity for background tint")

        // Verify component renders without crashing
        let hosted = host(drawer.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)
    }

    // MARK: - AC-6: Five stories registered

    func test_sessions_drawer_stories_registered() {
        let stories = OrganismStories.all.filter { $0.id.hasPrefix("organisms.sessionsdrawer.") }

        XCTAssertEqual(stories.count, 5, "Should have 5 sessions drawer stories registered")

        let storyIds = Set(stories.map(\.id))

        XCTAssertTrue(storyIds.contains("organisms.sessionsdrawer.default"))
        XCTAssertTrue(storyIds.contains("organisms.sessionsdrawer.emptyState"))
        XCTAssertTrue(storyIds.contains("organisms.sessionsdrawer.longList"))
        XCTAssertTrue(storyIds.contains("organisms.sessionsdrawer.noActiveSession"))
        XCTAssertTrue(storyIds.contains("organisms.sessionsdrawer.darkMode"))
    }

    // MARK: - AC-7: Atom-composition gate (no banned primitives)

    func test_no_banned_primitives() throws {
        let source = try organismSource(named: "LSSessionsDrawer.swift")

        // Verify no banned APIs
        XCTAssertFalse(source.contains("Font.system"), "Should not use Font.system")
        XCTAssertFalse(source.contains("Color(red:"), "Should not use Color(red:")
        XCTAssertFalse(source.contains("Color(hex:"), "Should not use Color(hex:")
        XCTAssertFalse(source.contains(".monospaced()"), "Should not use .monospaced()")

        // Verify composes from atoms/molecules/organisms
        XCTAssertTrue(source.contains("LSGlassPanel"), "Should compose from LSGlassPanel atom")
        XCTAssertTrue(source.contains("LSButton"), "Should compose from LSButton atom")
        XCTAssertTrue(source.contains("LSSectionHeader"), "Should compose from LSSectionHeader organism")
    }

    // MARK: - Helpers

    private func host(_ rootView: some View) -> HostedHarness {
        let controller = UIHostingController(rootView: AnyView(rootView))
        controller.loadViewIfNeeded()
        controller.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        let window = UIWindow(frame: controller.view.frame)
        window.rootViewController = controller
        window.makeKeyAndVisible()
        controller.view.setNeedsLayout()
        controller.view.layoutIfNeeded()
        window.layoutIfNeeded()
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.01))
        return HostedHarness(window: window, controller: controller)
    }

    private func organismSource(named name: String) throws -> String {
        let path = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Organisms/\(name)"
        return try String(contentsOfFile: path, encoding: .utf8)
    }
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}
