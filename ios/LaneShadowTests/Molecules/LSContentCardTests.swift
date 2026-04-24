import LaneShadowTheme
import NativeSandbox
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

@MainActor
final class LSContentCardTests: XCTestCase {
    func test_default_render_uses_surface_card_tokens() {
        let card = LSContentCard(
            title: "Route X",
            subtitle: "42 mi · 1h 12m"
        )

        XCTAssertEqual(card.title, "Route X")
        XCTAssertEqual(card.subtitle, "42 mi · 1h 12m")
        XCTAssertEqual(LSCard<EmptyView>.cornerRadius(in: Theme.shared), Theme.shared.radius.lg)
        XCTAssertEqual(LSCard<EmptyView>.elevation(in: Theme.shared).radius, Theme.shared.elevation.level2.radius)
        XCTAssertEqual(LSCard<EmptyView>.elevation(in: Theme.shared).offsetY, Theme.shared.elevation.level2.offsetY)
        XCTAssertEqual(LSContentCard.bodyVerticalSpacing(in: Theme.shared), Theme.shared.space.xs)
        XCTAssertEqual(LSContentCard.titleTypographyVariant(), .title.md)
        XCTAssertEqual(LSContentCard.subtitleTypographyVariant(), .body.md)
    }

    func test_action_footer_slot_renders_below_metadata() {
        let card = LSContentCard(
            title: "Route X",
            subtitle: "42 mi · 1h 12m",
            metadata: ["3,400 ft gain"]
        ) {
            HStack(spacing: Theme.shared.space.sm) {
                LSButton("Ride This", variant: .primary, action: {})
                LSButton("Save", variant: .outline, action: {})
            }
        }

        XCTAssertEqual(LSContentCard.footerTopPadding(in: Theme.shared), Theme.shared.space.xs)

        XCTAssertEqual(card.metadata.count, 1)
        XCTAssertTrue(card.hasActionsFooter)
        XCTAssertFalse(card.bodyBottomPaddingWhenFooterMissing > 0)
    }

    func test_all_ten_stories_registered() {
        let storyIDs = MoleculesStories.all.map(\ .id)
        let expectedIDs = [
            "molecules.contentCard.withImageHeader",
            "molecules.contentCard.titleOnly",
            "molecules.contentCard.titleSubtitleChips",
            "molecules.contentCard.withActions",
            "molecules.listRow.leadingIcon",
            "molecules.listRow.leadingAvatar",
            "molecules.listRow.withSubtitle",
            "molecules.listRow.withToggle",
            "molecules.listRow.withChevron",
            "molecules.listRow.withTrailingButton",
        ]

        for id in expectedIDs {
            XCTAssertTrue(storyIDs.contains(id), "Missing story id: \(id)")
        }

        let moleculeStories = MoleculesStories.all.filter {
            $0.id.hasPrefix("molecules.contentCard.") || $0.id.hasPrefix("molecules.listRow.")
        }
        XCTAssertEqual(moleculeStories.count, 10)

        for story in moleculeStories {
            _ = host(story.render(story.initialArgs).laneShadowTheme().preferredColorScheme(.light))
            _ = host(story.render(story.initialArgs).laneShadowTheme().preferredColorScheme(.dark))
        }
    }

    func test_no_forbidden_literal_style_or_deprecated_apis_in_content_card() throws {
        let source = try moleculeSource(named: "LSContentCard.swift")

        XCTAssertFalse(source.contains("Color(red:"))
        XCTAssertFalse(source.contains("Color(hex:"))
        XCTAssertFalse(source.contains("Font.system"))
        XCTAssertFalse(source.contains("foregroundColor("))
    }

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

    private func moleculeSource(named fileName: String) throws -> String {
        let root = repoRoot()
        let url = root
            .appendingPathComponent("ios/LaneShadow/Views/Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }

    private func repoRoot() -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
    }
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}
