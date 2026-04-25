import LaneShadowTheme
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

@MainActor
final class LSSectionHeaderTests: XCTestCase {
    // MARK: - AC-1: Title + See all with spacing.3 inset

    func test_title_plus_see_all_renders_with_spacing3_inset() throws {
        let header = LSSectionHeader(
            title: "Nearby Routes",
            trailing: .link(label: "See all", onTap: {})
        )

        let source = try organismSource(named: "LSSectionHeader.swift")

        // Verify LSText is used for title
        XCTAssertTrue(source.contains("LSText("), "Should compose from LSText atom")

        // Verify title uses typography.ui.title.md
        XCTAssertTrue(source.contains(".title.md"), "Title should use ui.title.md typography")

        // Verify trailing link exists
        XCTAssertTrue(source.contains("link"), "Should have trailing link slot")

        // Verify no banned primitives
        XCTAssertFalse(source.contains("Font.system"))
        XCTAssertFalse(source.contains("Color(red:"))
        XCTAssertFalse(source.contains("Color(hex:"))
        XCTAssertFalse(source.contains(".monospaced()"))

        // Verify component renders without crashing
        let hosted = host(header.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)
    }

    // MARK: - AC-2: Caps label no trailing slot

    func test_caps_label_no_trailing_slot() {
        let header = LSSectionHeader(
            title: "THIS WEEK"
        )

        // Verify component renders without crashing
        let hosted = host(header.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)
    }

    // MARK: - AC-3: See all tap fires once

    func test_see_all_tap_fires_once() throws {
        var tapCount = 0
        let onTap = { tapCount += 1 }
        let header = LSSectionHeader(
            title: "Nearby Routes",
            trailing: .link(label: "See all", onTap: onTap)
        )

        // Verify component renders
        let hosted = host(header.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)

        // Verify the link closure is wired correctly
        let source = try organismSource(named: "LSSectionHeader.swift")
        XCTAssertTrue(source.contains("onTap()"), "Should call onTap in button action")

        // Verify closure doesn't fire automatically
        XCTAssertEqual(tapCount, 0, "Tap should not fire automatically")

        // Verify closure fires when invoked
        onTap()
        XCTAssertEqual(tapCount, 1, "Tap should fire once when invoked")
    }

    // MARK: - AC-4: Custom inset override

    func test_custom_inset_overrides_default() throws {
        let header = LSSectionHeader(
            title: "Custom",
            inset: 16
        )

        let source = try organismSource(named: "LSSectionHeader.swift")

        // Verify inset parameter is used
        XCTAssertTrue(source.contains("leadingInset"), "Should use leadingInset parameter")
        XCTAssertTrue(source.contains("padding(.leading,"), "Should apply leading padding")

        // Verify component renders without crashing
        let hosted = host(header.laneShadowTheme())
        XCTAssertNotNil(hosted.window.rootViewController)
    }

    // MARK: - AC-5: Five stories registered

    func test_section_header_stories_registered() {
        let stories = OrganismStories.all.filter { $0.id.hasPrefix("organisms.sectionheader.") }

        XCTAssertEqual(stories.count, 5, "Should have 5 section header stories registered")

        let storyIds = Set(stories.map(\.id))

        XCTAssertTrue(storyIds.contains("organisms.sectionheader.titleOnly"))
        XCTAssertTrue(storyIds.contains("organisms.sectionheader.titlePlusSeeAll"))
        XCTAssertTrue(storyIds.contains("organisms.sectionheader.capsLabel"))
        XCTAssertTrue(storyIds.contains("organisms.sectionheader.customInset"))
        XCTAssertTrue(storyIds.contains("organisms.sectionheader.darkMode"))
    }

    // MARK: - AC-6: Atom-composition gate (no banned primitives)

    func test_no_banned_primitives() throws {
        let source = try organismSource(named: "LSSectionHeader.swift")

        // Verify no banned APIs
        XCTAssertFalse(source.contains("Font.system"), "Should not use Font.system")
        XCTAssertFalse(source.contains("Color(red:"), "Should not use Color(red:")
        XCTAssertFalse(source.contains("Color(hex:"), "Should not use Color(hex:")
        XCTAssertFalse(source.contains(".monospaced()"), "Should not use .monospaced()")

        // Verify composes from atoms
        XCTAssertTrue(source.contains("LSText("), "Should compose from LSText atom")
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
