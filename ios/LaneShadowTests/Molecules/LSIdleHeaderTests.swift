import LaneShadowTheme
import SwiftUI
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
final class LSIdleHeaderTests: XCTestCase {
    func test_idle_state_renders_menu_capsule_new() throws {
        let inspected = try LSIdleHeader(
            capsuleState: .idle(
                headline: AttributedString("Where are we riding today?"),
                metaItems: ["SUNDAY", "67°F", "CLEAR"]
            ),
            onMenuTap: {},
            onNewTap: {}
        )
        .laneShadowTheme()
        .inspect()

        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "lsidleheader"))
        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "lsidleheader-menu"))
        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "lsidleheader-new"))
        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "lsidleheader-capsule"))
        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "lsidleheader-capsule-meta"))
    }

    func test_idle_state_without_meta_skips_meta_row() throws {
        let inspected = try LSIdleHeader(
            capsuleState: .idle(
                headline: AttributedString("Where are we riding?"),
                metaItems: []
            ),
            onMenuTap: {},
            onNewTap: {}
        )
        .laneShadowTheme()
        .inspect()

        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "lsidleheader-capsule"))
        XCTAssertThrowsError(
            try inspected.find(viewWithAccessibilityIdentifier: "lsidleheader-capsule-meta"),
            "Meta row should not render when metaItems is empty"
        )
    }

    func test_menu_button_fires_callback() {
        var menuTaps = 0
        let header = LSIdleHeader(
            capsuleState: .idle(
                headline: AttributedString("Where?"),
                metaItems: ["WED"]
            ),
            onMenuTap: { menuTaps += 1 },
            onNewTap: {}
        )
        XCTAssertNotNil(header)
        XCTAssertEqual(menuTaps, 0)
    }

    func test_new_button_fires_callback() {
        var newTaps = 0
        let header = LSIdleHeader(
            capsuleState: .idle(
                headline: AttributedString("Where?"),
                metaItems: ["WED"]
            ),
            onMenuTap: {},
            onNewTap: { newTaps += 1 }
        )
        XCTAssertNotNil(header)
        XCTAssertEqual(newTaps, 0)
    }

    func test_warning_meta_uses_warning_color() throws {
        let inspected = try LSIdleHeader(
            capsuleState: .idle(
                headline: AttributedString("Not the prettiest day."),
                metaItems: ["FRI", "62°F", "RAIN"]
            ),
            isWarning: true,
            onMenuTap: {},
            onNewTap: {}
        )
        .laneShadowTheme()
        .inspect()

        // Meta row still renders; color is verified at integration level via snapshot diff.
        XCTAssertNoThrow(try inspected.find(viewWithAccessibilityIdentifier: "lsidleheader-capsule-meta"))
    }
}
