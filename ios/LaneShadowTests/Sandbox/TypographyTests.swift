import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

@MainActor
final class TypographyTests: XCTestCase {

    // MARK: - AC-1: IdleScreen Greeting Headline

    func testIdleScreenGreetingOpinionXL() throws {
        let idleScreen = IdleScreen()
        let hosted = host(idleScreen.laneShadowTheme())

        // Verify the greeting headline uses opinion-xl font
        let headlineVariant = TypographyVariant.opinion.xl
        let expectedStyle = headlineVariant.style(in: Theme.shared)

        // Check font family is Newsreader
        XCTAssertEqual(expectedStyle.fontFamily, "Newsreader")

        // Check font size is 30pt (opinion-xl)
        XCTAssertEqual(expectedStyle.fontSize, 30)

        // Check font weight is light
        XCTAssertEqual(expectedStyle.fontWeight, .light)
    }

    // MARK: - AC-2: SessionsDrawer "Rides" Header

    func testSessionsDrawerRidesOpinionLGItalic() throws {
        // Verify the "Rides" header uses opinion-lg font with italic
        let headerVariant = TypographyVariant.opinion.lg
        let expectedStyle = headerVariant.style(in: Theme.shared)

        // Check font family is Newsreader
        XCTAssertEqual(expectedStyle.fontFamily, "Newsreader")

        // Check font size is 22pt (opinion-lg)
        XCTAssertEqual(expectedStyle.fontSize, 22)

        // Check font weight is light
        XCTAssertEqual(expectedStyle.fontWeight, .light)
    }

    // MARK: - AC-3: Error Callout + Navigator Message Body

    func testCalloutBodyOpinionMD() throws {
        // Test LSInlineErrorCallout
        let errorCallout = LSInlineErrorCallout(
            body: "Test error message",
            detail: "Test detail",
            suggestions: ["Suggestion 1"],
            onSuggestionTap: { _ in }
        )
        let hostedError = host(errorCallout.laneShadowTheme())

        // Verify error callout body uses opinion-md font
        let opinionVariant = TypographyVariant.opinion.md
        let expectedStyle = opinionVariant.style(in: Theme.shared)

        XCTAssertEqual(expectedStyle.fontFamily, "Newsreader")
        XCTAssertEqual(expectedStyle.fontSize, 17)
        XCTAssertEqual(expectedStyle.fontWeight, .light)

        // Test LSNavigatorMessage
        let navigatorMessage = LSNavigatorMessage(
            body: "Test navigator message",
            pinned: false,
            onPin: {},
            onDismiss: {}
        )
        let hostedNavigator = host(navigatorMessage.laneShadowTheme())

        // Verify navigator message body uses opinion-md font
        XCTAssertEqual(expectedStyle.fontFamily, "Newsreader")
        XCTAssertEqual(expectedStyle.fontSize, 17)
        XCTAssertEqual(expectedStyle.fontWeight, .light)
    }

    // MARK: - AC-4: LSTopBar Centered Title

    func testTopBarTitleOpinionMD() throws {
        let topBar = LSTopBar(
            title: "Test Title",
            trailing: .none,
            onMenuTap: {},
            onNewTap: {}
        )
        let hosted = host(topBar.laneShadowTheme())

        // Verify the centered title uses opinion-md font
        let titleVariant = TypographyVariant.opinion.md
        let expectedStyle = titleVariant.style(in: Theme.shared)

        XCTAssertEqual(expectedStyle.fontFamily, "Newsreader")
        XCTAssertEqual(expectedStyle.fontSize, 17)
        XCTAssertEqual(expectedStyle.fontWeight, .light)
    }

    // MARK: - AC-5: LSSectionHeader Caps Variant

    func testSectionHeaderCapsLabelSM() throws {
        let sectionHeader = LSSectionHeader(
            title: "TEST SECTION",
            titleStyle: .caps
        )
        let hosted = host(sectionHeader.laneShadowTheme())

        // Verify caps variant uses label-sm with tertiary color
        let labelVariant = TypographyVariant.label.sm
        let expectedStyle = labelVariant.style(in: Theme.shared)

        // Check font family is Geist (not Newsreader for caps)
        XCTAssertEqual(expectedStyle.fontFamily, "Geist")

        // Check font size is label-sm (9pt)
        XCTAssertEqual(expectedStyle.fontSize, 9)

        // Verify tertiary color is used
        let tertiaryColor = LaneShadowTheme.color.content.tertiary
        XCTAssertNotNil(tertiaryColor)
    }

    // MARK: - AC-6: Dark Mode Typography Consistency

    func testDarkModeTypographyConsistency() throws {
        // Test all components in dark mode
        let theme = Theme.shared

        // Verify opinion tokens have Newsreader font family in all sizes
        XCTAssertEqual(theme.type.opinion.sm.fontFamily, "Newsreader")
        XCTAssertEqual(theme.type.opinion.md.fontFamily, "Newsreader")
        XCTAssertEqual(theme.type.opinion.lg.fontFamily, "Newsreader")
        XCTAssertEqual(theme.type.opinion.xl.fontFamily, "Newsreader")

        // Verify font sizes are correct
        XCTAssertEqual(theme.type.opinion.sm.fontSize, 14)
        XCTAssertEqual(theme.type.opinion.md.fontSize, 17)
        XCTAssertEqual(theme.type.opinion.lg.fontSize, 22)
        XCTAssertEqual(theme.type.opinion.xl.fontSize, 30)

        // Verify font weights are light
        XCTAssertEqual(theme.type.opinion.sm.fontWeight, .light)
        XCTAssertEqual(theme.type.opinion.md.fontWeight, .light)
        XCTAssertEqual(theme.type.opinion.lg.fontWeight, .light)
        XCTAssertEqual(theme.type.opinion.xl.fontWeight, .light)
    }

    // MARK: - Helper Methods

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
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}
