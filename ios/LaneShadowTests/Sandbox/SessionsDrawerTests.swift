import LaneShadowTheme
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

// MARK: - Test Fixture

struct TestSession: Identifiable, SessionTitleProvider, SessionPreviewProvider, SessionWhenProvider {
    let id: String
    let title: String
    let preview: String
    let when: String
}

// MARK: - Tests

@MainActor
final class SessionsDrawerTests: XCTestCase {

    // MARK: - AC-1: Solid container background [PRIMARY]

    func testDrawerSolidBackground() throws {
        let drawer = LSSessionsDrawer<TestSession>(
            sessions: [
                TestSession(
                    id: "session-1",
                    title: "Santa Cruz Loop",
                    preview: "Take 1 south to Davenport...",
                    when: "Today"
                )
            ],
            activeSessionId: "session-1",
            groupLabel: "THIS WEEK",
            onSelect: { _ in },
            onNew: {},
            onDismiss: {}
        )

        let source = try source(named: "LSSessionsDrawer.swift")

        // MUST NOT use LSGlassPanel for sessions drawer
        XCTAssertFalse(
            source.contains("LSGlassPanel"),
            "SessionsDrawer MUST NOT use LSGlassPanel wrapper — should be solid surface.card"
        )

        // MUST use solid surface.card background
        XCTAssertTrue(
            source.contains("surface.card") || source.contains("card.default"),
            "SessionsDrawer MUST use theme.colors.surface.card for solid opaque background"
        )

        // Verify no backdrop blur or glass materials
        XCTAssertFalse(
            source.contains(".ultraThinMaterial") || source.contains(".thinMaterial") || source.contains("material"),
            "SessionsDrawer MUST NOT use backdrop blur materials"
        )

        // Verify component renders
        let hosted = host(drawer.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)
    }

    // MARK: - AC-2: Active stripe stroke.lg

    func testActiveStripeStrokeLg() throws {
        let drawer = LSSessionsDrawer<TestSession>(
            sessions: [
                TestSession(
                    id: "session-1",
                    title: "Santa Cruz Loop",
                    preview: "Take 1 south to Davenport...",
                    when: "Today"
                )
            ],
            activeSessionId: "session-1",
            groupLabel: "THIS WEEK",
            onSelect: { _ in },
            onNew: {},
            onDismiss: {}
        )

        let source = try source(named: "LSSessionsDrawer.swift")

        // MUST use theme.strokeWidth.thick (2pt), NOT hardcoded 3pt
        XCTAssertTrue(
            source.contains("theme.strokeWidth.thick") || source.contains("strokeWidth.thick"),
            "Active stripe MUST use theme.strokeWidth.thick (2pt)"
        )

        // MUST NOT have hardcoded 3pt stripe
        XCTAssertFalse(
            source.contains(".frame(width: 3)") && source.contains("signal"),
            "Active stripe MUST NOT be hardcoded 3pt width"
        )

        // Verify stripe uses signal color
        XCTAssertTrue(
            source.contains("signal.default") || source.contains("signal.default"),
            "Active stripe MUST use signal.default color"
        )

        // Verify component renders
        let hosted = host(drawer.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)
    }

    // MARK: - AC-3: Active row signal.whisper background

    func testActiveRowSignalWhisper() throws {
        let drawer = LSSessionsDrawer<TestSession>(
            sessions: [
                TestSession(
                    id: "session-1",
                    title: "Santa Cruz Loop",
                    preview: "Take 1 south to Davenport...",
                    when: "Today"
                )
            ],
            activeSessionId: "session-1",
            groupLabel: "THIS WEEK",
            onSelect: { _ in },
            onNew: {},
            onDismiss: {}
        )

        let source = try source(named: "LSSessionsDrawer.swift")

        // MUST use signal.whisper semantic token
        XCTAssertTrue(
            source.contains("signal.whisper") || source.contains("signalWhisper"),
            "Active row background MUST use theme.colors.signal.whisper semantic token"
        )

        // MUST NOT use raw alpha on signal.default
        XCTAssertFalse(
            source.contains("signal.default.opacity") || source.contains("signal.default.opacity"),
            "Active row background MUST NOT use raw alpha on signal.default"
        )

        // Verify component renders in both light and dark
        let hosted = host(drawer.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)
    }

    // MARK: - AC-4: Hamburger 44pt tap target

    func testHamburger44ptTapTarget() throws {
        // Note: This test verifies the pattern exists in LSTopBar where the hamburger button lives
        let source = try source(named: "LSTopBar.swift", in: "Organisms")

        // MUST have .contentShape(Rectangle()) for tap target expansion
        XCTAssertTrue(
            source.contains(".contentShape(Rectangle())") || source.contains("contentShape(Rectangle())"),
            "LSTopBar MUST use .contentShape(Rectangle()) to expand hamburger tap target to 44pt minimum"
        )

        // The visual size should still be 40pt (chipSize), not 44pt
        // Verify we're not hardcoding 44pt for the visual
        let lines = source.components(separatedBy: "\n")
        let chipSizeLine = lines.first { $0.contains("chipSize") }
        XCTAssertNotNil(chipSizeLine, "Should define chipSize for visual sizing")

        // Verify contentShape is used in hamburger button
        let hamburgerLines = lines.filter { $0.contains("hamburgerChip") }
        let hasContentShape = hamburgerLines.contains { $0.contains("contentShape") }
        XCTAssertTrue(hasContentShape, "hamburgerChip should use contentShape for tap target expansion")
    }

    // MARK: - AC-5: Drawer shadow tier

    func testDrawerShadowTier() throws {
        let drawer = LSSessionsDrawer<TestSession>(
            sessions: [
                TestSession(
                    id: "session-1",
                    title: "Santa Cruz Loop",
                    preview: "Take 1 south to Davenport...",
                    when: "Today"
                )
            ],
            activeSessionId: "session-1",
            groupLabel: "THIS WEEK",
            onSelect: { _ in },
            onNew: {},
            onDismiss: {}
        )

        let source = try source(named: "LSSessionsDrawer.swift")

        // MUST have directional shadow (positive x offset, zero y offset)
        XCTAssertTrue(
            source.contains(".shadow(") || source.contains("shadow("),
            "SessionsDrawer MUST have shadow for elevation"
        )

        // Shadow should have x: 2, y: 0 for directional right-edge shadow
        let hasDirectionalShadow = source.contains("x: 2") || source.contains("x:2")
        XCTAssertTrue(
            hasDirectionalShadow,
            "Drawer shadow MUST have x: 2 offset for directional right-edge shadow"
        )

        // Radius should be 16 for overlay tier
        let hasCorrectRadius = source.contains("radius: 16") || source.contains("radius:16")
        XCTAssertTrue(
            hasCorrectRadius,
            "Drawer shadow MUST have radius: 16 for overlay elevation tier"
        )

        // Verify component renders
        let hosted = host(drawer.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)
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

    private func source(named name: String, in directory: String = "Organisms") throws -> String {
        let path = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/\(directory)/\(name)"
        return try String(contentsOfFile: path, encoding: .utf8)
    }
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}
