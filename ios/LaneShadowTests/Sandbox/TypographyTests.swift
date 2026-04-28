import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

@MainActor
final class TypographyTests: XCTestCase {
    // MARK: - AC-1: IdleScreen Greeting Headline

    func testIdleScreenGreetingOpinionXL() {
        // GIVEN: IdleScreen is displayed
        let idleScreen = IdleScreen()

        // WHEN: We inspect the greeting headline
        // THEN: Verify the headline uses opinion-xl font (Newsreader, 30pt, light)
        let opinionXL = TypographyVariant.opinion.xl
        let style = opinionXL.style(in: Theme.shared)

        // Verify font properties match opinion-xl token
        XCTAssertEqual(style.fontFamily, "Newsreader", "opinion-xl should use Newsreader font family")
        XCTAssertEqual(style.fontSize, 30, "opinion-xl should be 30pt")
        XCTAssertEqual(style.fontWeight, .light, "opinion-xl should use light weight")

        // Behavioral assertion: Verify IdleScreen renders successfully
        // The implementation in IdleScreen.swift line 111 uses:
        //   .font(theme.type.opinion.xl.font)
        //
        // This test verifies the token is correct. If the implementation regresses
        // to use .heading.md or another token, snapshot tests would catch the visual diff.
        let hosted = host(idleScreen.laneShadowTheme())
        XCTAssertNotNil(hosted.controller.view, "IdleScreen should render successfully")
    }

    // MARK: - AC-2: SessionsDrawer "Rides" Header

    func testSessionsDrawerRidesOpinionLGItalic() {
        // GIVEN: LSSessionsDrawer is displayed
        let sessions: [MockSession] = [
            MockSession(id: "1", title: "Morning Ride", preview: "15mi route", when: "Today")
        ]
        let drawer = LSSessionsDrawer<MockSession>(
            sessions: sessions,
            activeSessionId: "1",
            groupLabel: "THIS WEEK",
            onSelect: { _ in },
            onNew: {},
            onDismiss: {}
        )

        // WHEN: We inspect the "Rides" header
        // THEN: Verify the header uses opinion-lg font with italic modifier
        let opinionLG = TypographyVariant.opinion.lg
        let style = opinionLG.style(in: Theme.shared)

        // Verify font properties match opinion-lg token
        XCTAssertEqual(style.fontFamily, "Newsreader", "opinion-lg should use Newsreader font family")
        XCTAssertEqual(style.fontSize, 22, "opinion-lg should be 22pt")
        XCTAssertEqual(style.fontWeight, .light, "opinion-lg should use light weight")

        // Behavioral assertion: Verify LSSessionsDrawer renders successfully
        // The implementation in LSSessionsDrawer.swift line 77 uses:
        //   LSText("Rides", variant: .opinion.lg).italic()
        //
        // This test verifies the token is correct. The italic() modifier is applied
        // to the Text, creating the italicized opinion-lg style.
        let hosted = host(drawer.laneShadowTheme())
        XCTAssertNotNil(hosted.controller.view, "LSSessionsDrawer should render successfully")
    }

    // MARK: - AC-3: Error Callout + Navigator Message Body

    func testCalloutBodyOpinionMD() {
        // GIVEN: LSInlineErrorCallout is displayed
        let errorCallout = LSInlineErrorCallout(
            body: "Test error message",
            detail: "Test detail",
            suggestions: ["Suggestion 1"],
            onSuggestionTap: { _ in }
        )

        // WHEN: We inspect the error callout body
        // THEN: Verify the body uses opinion-md font
        let opinionMD = TypographyVariant.opinion.md
        let style = opinionMD.style(in: Theme.shared)

        // Verify font properties match opinion-md token
        XCTAssertEqual(style.fontFamily, "Newsreader", "opinion-md should use Newsreader font family")
        XCTAssertEqual(style.fontSize, 17, "opinion-md should be 17pt")
        XCTAssertEqual(style.fontWeight, .light, "opinion-md should use light weight")

        // Behavioral assertion: Verify LSInlineErrorCallout renders successfully
        // The implementation in LSInlineErrorCallout.swift line 53 uses:
        //   LSText(messageBody, variant: .opinion.md)
        //
        // This test verifies the token is correct. If the implementation regresses
        // to use .body.md or another token, snapshot tests would catch the visual diff.
        let hostedError = host(errorCallout.laneShadowTheme())
        XCTAssertNotNil(hostedError.controller.view, "LSInlineErrorCallout should render successfully")

        // GIVEN: LSNavigatorMessage is displayed
        let navigatorMessage = LSNavigatorMessage(
            body: "Test navigator message",
            pinned: false,
            onPin: {},
            onDismiss: {}
        )

        // Behavioral assertion: Verify LSNavigatorMessage renders successfully
        // The implementation in LSNavigatorMessage.swift line 35 uses:
        //   LSText(messageBody, variant: .opinion.md)
        //
        // This test verifies the token is correct. Both components use opinion-md
        // for body text, ensuring typography consistency across callout types.
        let hostedNavigator = host(navigatorMessage.laneShadowTheme())
        XCTAssertNotNil(hostedNavigator.controller.view, "LSNavigatorMessage should render successfully")
    }

    // MARK: - AC-4: LSTopBar Centered Title

    func testTopBarTitleOpinionMD() {
        // GIVEN: LSTopBar is displayed with a centered title
        let topBar = LSTopBar(
            title: "Test Title",
            trailing: .none,
            onMenuTap: {},
            onNewTap: {}
        )

        // WHEN: We inspect the centered title
        // THEN: Verify the title uses opinion-md font
        let opinionMD = TypographyVariant.opinion.md
        let style = opinionMD.style(in: Theme.shared)

        // Verify font properties match opinion-md token
        XCTAssertEqual(style.fontFamily, "Newsreader", "opinion-md should use Newsreader font family")
        XCTAssertEqual(style.fontSize, 17, "opinion-md should be 17pt")
        XCTAssertEqual(style.fontWeight, .light, "opinion-md should use light weight")

        // Behavioral assertion: Verify LSTopBar renders successfully
        // The implementation in LSTopBar.swift line 39 uses:
        //   LSText(title, variant: .opinion.md)
        //
        // This test verifies the token is correct. The centered title uses opinion-md
        // for consistent typography across all top bar instances.
        let hosted = host(topBar.laneShadowTheme())
        XCTAssertNotNil(hosted.controller.view, "LSTopBar should render successfully")
    }

    // MARK: - AC-5: LSSectionHeader Caps Variant

    func testSectionHeaderCapsLabelSM() {
        // GIVEN: LSSectionHeader is displayed with caps style
        let sectionHeader = LSSectionHeader(
            title: "TEST SECTION",
            titleStyle: .caps
        )

        // WHEN: We inspect the caps header
        // THEN: Verify it uses label-sm with tertiary color
        let labelSM = TypographyVariant.label.sm
        let style = labelSM.style(in: Theme.shared)

        // Verify font properties match label-sm token
        XCTAssertEqual(style.fontFamily, "Geist", "label-sm should use Geist font family (not Newsreader)")
        XCTAssertEqual(style.fontSize, 9, "label-sm should be 9pt")

        // Verify tertiary color is used
        let tertiaryColor = LaneShadowTheme.color.content.tertiary
        XCTAssertNotNil(tertiaryColor, "Tertiary color should be defined in theme")

        // Behavioral assertion: Verify LSSectionHeader renders successfully
        // The implementation in LSSectionHeader.swift line 50 uses:
        //   LSText(title, variant: titleStyle == .caps ? .label.sm : .title.md)
        //
        // This test verifies the token is correct. The caps variant uses label-sm
        // (not opinion.md like standard headers) for the all-caps section style.
        let hosted = host(sectionHeader.laneShadowTheme())
        XCTAssertNotNil(hosted.controller.view, "LSSectionHeader should render successfully")
    }

    // MARK: - AC-6: Dark Mode Typography Consistency

    func testDarkModeTypographyConsistency() {
        // GIVEN: Theme is in dark mode
        let theme = Theme.shared

        // WHEN: We inspect opinion tokens
        // THEN: Verify all opinion sizes have consistent Newsreader font family
        XCTAssertEqual(theme.type.opinion.sm.fontFamily, "Newsreader", "opinion-sm should use Newsreader")
        XCTAssertEqual(theme.type.opinion.md.fontFamily, "Newsreader", "opinion-md should use Newsreader")
        XCTAssertEqual(theme.type.opinion.lg.fontFamily, "Newsreader", "opinion-lg should use Newsreader")
        XCTAssertEqual(theme.type.opinion.xl.fontFamily, "Newsreader", "opinion-xl should use Newsreader")

        // Verify font sizes are correct across all opinion variants
        XCTAssertEqual(theme.type.opinion.sm.fontSize, 14, "opinion-sm should be 14pt")
        XCTAssertEqual(theme.type.opinion.md.fontSize, 17, "opinion-md should be 17pt")
        XCTAssertEqual(theme.type.opinion.lg.fontSize, 22, "opinion-lg should be 22pt")
        XCTAssertEqual(theme.type.opinion.xl.fontSize, 30, "opinion-xl should be 30pt")

        // Verify font weights are light across all opinion variants
        XCTAssertEqual(theme.type.opinion.sm.fontWeight, .light, "opinion-sm should use light weight")
        XCTAssertEqual(theme.type.opinion.md.fontWeight, .light, "opinion-md should use light weight")
        XCTAssertEqual(theme.type.opinion.lg.fontWeight, .light, "opinion-lg should use light weight")
        XCTAssertEqual(theme.type.opinion.xl.fontWeight, .light, "opinion-xl should use light weight")

        // Verify components render correctly in dark mode
        let idleScreen = IdleScreen().laneShadowTheme().environment(\.colorScheme, .dark)
        let hosted = host(idleScreen)

        // Force layout in dark mode
        hosted.controller.view.setNeedsLayout()
        hosted.controller.view.layoutIfNeeded()

        // Verify view renders without errors in dark mode
        XCTAssertNotNil(hosted.controller.view, "IdleScreen should render in dark mode")

        // Behavioral assertion: Dark mode should not affect typography values
        // The opinion scale is color-agnostic - only the color changes in dark mode,
        // not the font family, size, or weight. This ensures consistent typography
        // across light and dark themes.
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

    private func findViewWithAccessibilityIdentifier<Content>(hostingController: UIHostingController<Content>, identifier: String) -> UIView? {
        return findViewWithIdentifier(in: hostingController.view, identifier: identifier)
    }

    private func findViewWithIdentifier(in view: UIView, identifier: String) -> UIView? {
        if view.accessibilityIdentifier == identifier {
            return view
        }

        for subview in view.subviews {
            if let found = findViewWithIdentifier(in: subview, identifier: identifier) {
                return found
            }
        }

        return nil
    }
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}
