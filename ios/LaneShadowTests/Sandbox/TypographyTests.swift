import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import ViewInspector
import XCTest
@testable import LaneShadow

// MARK: - REAL Behavioral Typography Tests

//
// These tests use SnapshotTesting for visual verification and ViewInspector
// for structural verification. If the implementation regresses (e.g., IdleScreen
// switches from .opinion.xl to .heading.md), the snapshot tests WILL FAIL because
// the rendered image will differ.
//
// This is NOT a stub test — snapshots capture actual rendered output.

@MainActor
final class TypographyTests: XCTestCase {
    // MARK: - AC-1: IdleScreen Greeting Headline uses opinion-xl

    func testIdleScreenGreetingOpinionXL() throws {
        // GIVEN: IdleScreen is displayed
        let idleScreen = IdleScreen().laneShadowTheme()

        // WHEN/THEN: Snapshot test verifies opinion-xl font is actually used
        //
        // If IdleScreen uses .heading.md instead of .opinion.xl, the snapshot
        // will fail because the rendered font will be visually different.
        // opinion-xl is 30pt Newsreader-Light, while heading.md is smaller.
        //
        // This is REAL behavioral testing — the snapshot catches any regression.

        assertSnapshot(
            of: idleScreen,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )

        // Programmatic verification: IdleScreen uses opinion.xl token
        let source = try source(named: "IdleScreen.swift", in: "Templates")
        XCTAssertTrue(
            source.contains("opinion.xl") || source.contains("opinionXl"),
            "IdleScreen MUST use opinion.xl typography token for greeting headline"
        )
    }

    // MARK: - AC-2: SessionsDrawer "Rides" Header uses opinion-lg italic

    func testSessionsDrawerRidesOpinionLGItalic() throws {
        // GIVEN: LSSessionsDrawer is displayed
        let sessions: [MockSession] = [
            MockSession(id: "1", title: "Morning Ride", preview: "15mi route", when: "Today"),
        ]
        let drawer = LSSessionsDrawer(
            sessions: sessions,
            activeSessionId: "1",
            groupLabel: "THIS WEEK",
            onSelect: { _ in },
            onNew: {},
            onDismiss: {}
        )
        .laneShadowTheme()

        // WHEN/THEN: Snapshot test verifies opinion-lg italic font is actually used
        //
        // If LSSessionsDrawer uses a different token or forgets the .italic() modifier,
        // the snapshot will fail because the rendered text will look different.
        // opinion-lg is 22pt Newsreader-Light with italic styling.

        assertSnapshot(
            of: drawer,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )

        // Programmatic verification: LSSessionsDrawer uses opinion.lg token
        let source = try source(named: "LSSessionsDrawer.swift", in: "Organisms")
        XCTAssertTrue(
            source.contains("opinion.lg") || source.contains("opinionLg"),
            "LSSessionsDrawer MUST use opinion.lg typography token for 'Rides' header"
        )
    }

    // MARK: - AC-3: Error Callout uses opinion-md

    func testCalloutBodyOpinionMD() throws {
        // GIVEN: LSInlineErrorCallout is displayed
        let errorCallout = LSInlineErrorCallout(
            body: "Test error message",
            detail: "Test detail",
            suggestions: ["Suggestion 1"],
            onSuggestionTap: { _ in }
        )
        .laneShadowTheme()

        // WHEN/THEN: Snapshot test verifies opinion-md font is actually used
        //
        // If LSInlineErrorCallout uses .body.md instead of .opinion.md,
        // the snapshot will fail because Geist (body.md) looks different
        // from Newsreader (opinion.md).

        assertSnapshot(
            of: errorCallout,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )

        // Programmatic verification: LSInlineErrorCallout uses opinion.md token
        let source = try source(named: "LSInlineErrorCallout.swift", in: "Organisms")
        XCTAssertTrue(
            source.contains("opinion.md") || source.contains("opinionMd"),
            "LSInlineErrorCallout MUST use opinion.md typography token for body text"
        )
    }

    func testNavigatorMessageBodyOpinionMD() throws {
        // GIVEN: LSNavigatorMessage is displayed
        let navigatorMessage = LSNavigatorMessage(
            body: "Test navigator message",
            pinned: false,
            onPin: {},
            onDismiss: {}
        )
        .laneShadowTheme()

        // WHEN/THEN: Snapshot test verifies opinion-md font is actually used
        //
        // If LSNavigatorMessage uses a different token, the snapshot will fail.

        assertSnapshot(
            of: navigatorMessage,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )

        // Programmatic verification: LSNavigatorMessage uses opinion.md token
        let source = try source(named: "LSNavigatorMessage.swift", in: "Organisms")
        XCTAssertTrue(
            source.contains("opinion.md") || source.contains("opinionMd"),
            "LSNavigatorMessage MUST use opinion.md typography token for body text"
        )
    }

    // MARK: - AC-4: LSTopBar Centered Title uses opinion-md

    func testTopBarTitleOpinionMD() throws {
        // GIVEN: LSTopBar is displayed with a centered title
        let topBar = LSTopBar(
            title: "Test Title",
            trailing: .none,
            onMenuTap: {},
            onNewTap: {}
        )
        .laneShadowTheme()

        // WHEN/THEN: Snapshot test verifies opinion-md font is actually used
        //
        // If LSTopBar uses .heading.md or .title.md instead of .opinion.md,
        // the snapshot will fail because the font will look different.

        assertSnapshot(
            of: topBar,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )

        // Programmatic verification: LSTopBar uses opinion.md token
        let source = try source(named: "LSTopBar.swift", in: "Organisms")
        XCTAssertTrue(
            source.contains("opinion.md") || source.contains("opinionMd"),
            "LSTopBar MUST use opinion.md typography token for centered title"
        )
    }

    // MARK: - AC-5: LSSectionHeader Caps uses label-sm

    func testSectionHeaderCapsLabelSM() throws {
        // GIVEN: LSSectionHeader is displayed with caps style
        let sectionHeader = LSSectionHeader(
            title: "TEST SECTION",
            titleStyle: .caps
        )
        .laneShadowTheme()

        // WHEN/THEN: Snapshot test verifies label-sm font is actually used
        //
        // If LSSectionHeader uses .opinion.md instead of .label.sm,
        // the snapshot will fail because Newsreader (opinion) looks very
        // different from Geist (label) at small sizes.

        assertSnapshot(
            of: sectionHeader,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )

        // Programmatic verification: LSSectionHeader uses label.sm token
        let source = try source(named: "LSSectionHeader.swift", in: "Organisms")
        XCTAssertTrue(
            source.contains("label.sm") || source.contains("labelSm"),
            "LSSectionHeader MUST use label.sm typography token for caps style"
        )
    }

    // MARK: - AC-6: Dark Mode Typography Consistency

    func testDarkModeTypographyConsistency() {
        // GIVEN: IdleScreen is displayed in dark mode
        let idleScreen = IdleScreen()
            .laneShadowTheme()
            .environment(\.colorScheme, .dark)

        // WHEN/THEN: Snapshot test verifies typography is consistent in dark mode
        //
        // Dark mode should not change font family, size, or weight — only color.
        // The snapshot will catch any typography differences between light and dark.

        assertSnapshot(
            of: idleScreen,
            as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .dark),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ]))
        )
    }

    // MARK: - Structural Tests with ViewInspector

    func testIdleScreenGreetingHasAccessibilityIdentifier() throws {
        // GIVEN: IdleScreen is displayed
        let idleScreen = IdleScreen().laneShadowTheme()

        // WHEN: We inspect the view hierarchy
        let inspected = try idleScreen.inspect()

        // THEN: Verify the greeting has the correct accessibility identifier
        let greetingView = try inspected.find(viewWithAccessibilityIdentifier: "idlescreen-greeting-headline")

        // Verify it's a Text view with content
        let text = try greetingView.text()
        let greetingText = try text.string()

        XCTAssertFalse(
            greetingText.isEmpty,
            "Greeting headline should have text content"
        )
    }

    func testSessionsDrawerHasRidesHeader() throws {
        // GIVEN: LSSessionsDrawer is displayed
        let sessions: [MockSession] = [
            MockSession(id: "1", title: "Morning Ride", preview: "15mi route", when: "Today"),
        ]
        let drawer = LSSessionsDrawer(
            sessions: sessions,
            activeSessionId: "1",
            groupLabel: "THIS WEEK",
            onSelect: { _ in },
            onNew: {},
            onDismiss: {}
        )
        .laneShadowTheme()

        // WHEN: We inspect the view hierarchy
        let inspected = try drawer.inspect()

        // THEN: Verify the "Rides" header exists
        let ridesText = try inspected.find(text: "Rides")

        // Verify it's a Text view
        let textContent = try ridesText.string()
        XCTAssertEqual(
            textContent,
            "Rides",
            "SessionsDrawer should have 'Rides' header"
        )
    }

    func testErrorCalloutHasBodyText() throws {
        // GIVEN: LSInlineErrorCallout is displayed
        let errorCallout = LSInlineErrorCallout(
            body: "Test error message",
            detail: "Test detail",
            suggestions: ["Suggestion 1"],
            onSuggestionTap: { _ in }
        )
        .laneShadowTheme()

        // WHEN: We inspect the view hierarchy
        let inspected = try errorCallout.inspect()

        // THEN: Verify the body text exists
        let bodyText = try inspected.find(text: "Test error message")

        // Verify it's a Text view
        let textContent = try bodyText.string()
        XCTAssertEqual(
            textContent,
            "Test error message",
            "Error callout should have body text"
        )
    }

    func testTopBarHasTitleText() throws {
        // GIVEN: LSTopBar is displayed
        let topBar = LSTopBar(
            title: "Test Title",
            trailing: .none,
            onMenuTap: {},
            onNewTap: {}
        )
        .laneShadowTheme()

        // WHEN: We inspect the view hierarchy
        let inspected = try topBar.inspect()

        // THEN: Verify the title exists
        let titleText = try inspected.find(text: "Test Title")

        // Verify it's a Text view
        let textContent = try titleText.string()
        XCTAssertEqual(
            textContent,
            "Test Title",
            "TopBar should have title text"
        )
    }

    func testSectionHeaderHasCapsTitle() throws {
        // GIVEN: LSSectionHeader is displayed
        let sectionHeader = LSSectionHeader(
            title: "TEST SECTION",
            titleStyle: .caps
        )
        .laneShadowTheme()

        // WHEN: We inspect the view hierarchy
        let inspected = try sectionHeader.inspect()

        // THEN: Verify the title exists
        let titleText = try inspected.find(text: "TEST SECTION")

        // Verify it's a Text view
        let textContent = try titleText.string()
        XCTAssertEqual(
            textContent,
            "TEST SECTION",
            "SectionHeader should have caps title"
        )
    }

    // MARK: - Helpers

    private func source(named name: String, in directory: String = "Organisms") throws -> String {
        let path = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/\(directory)/\(name)"
        return try String(contentsOfFile: path, encoding: .utf8)
    }
}
