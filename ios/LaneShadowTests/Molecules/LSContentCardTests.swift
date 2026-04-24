import LaneShadowTheme
import NativeSandbox
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

@MainActor
final class LSContentCardTests: XCTestCase {
    func test_default_render_uses_surface_card_tokens() throws {
        let hosted = host(
            LSContentCard(
                title: "Route X",
                subtitle: "42 mi · 1h 12m"
            )
            .laneShadowTheme()
        )
        let source = try moleculeSource(named: "LSContentCard.swift")
        let cardLayer = try XCTUnwrap(renderedCardLayer(in: hosted.window.layer))
        let textLayers = drawingLayers(in: cardLayer).sorted { $0.frame.minY < $1.frame.minY }
        let titleLayer = try XCTUnwrap(textLayers.first)
        let subtitleLayer = try XCTUnwrap(textLayers.last)

        XCTAssertTrue(source.contains("LSCard(padding: .spacing4)"))
        XCTAssertTrue(source.contains("LSText(title, variant: .title.md)"))
        XCTAssertTrue(source.contains("LSText(subtitle, variant: .body.md, color: .secondary)"))
        XCTAssertEqual(
            cardLayer.shadowRadius,
            Theme.shared.elevation.level2.radius,
            accuracy: 0.5
        )
        XCTAssertEqual(
            titleLayer.frame.minX,
            Theme.shared.space.lg,
            accuracy: 1
        )
        XCTAssertGreaterThan(titleLayer.frame.height, subtitleLayer.frame.height)
        XCTAssertGreaterThan(
            subtitleLayer.frame.minY,
            titleLayer.frame.minY
        )
        XCTAssertEqual(
            titleLayer.frame.minX,
            subtitleLayer.frame.minX,
            accuracy: 0.5
        )
        XCTAssertEqual(
            cardLayer.shadowOffset.height,
            Theme.shared.elevation.level2.offsetY,
            accuracy: 0.5
        )
        XCTAssertEqual(
            cardLayer.frame.height - subtitleLayer.frame.maxY,
            Theme.shared.space.lg,
            accuracy: 1
        )
    }

    func test_action_footer_slot_renders_below_metadata() throws {
        let withActions = host(
            LSContentCard(
                title: "Route X",
                subtitle: "42 mi · 1h 12m",
                metadata: ["3,400 ft gain"]
            ) {
                HStack(spacing: Theme.shared.space.sm) {
                    LSButton("Ride This", variant: .primary, action: {})
                    LSButton("Save", variant: .outline, action: {})
                }
            }
            .laneShadowTheme()
        )
        let withoutActions = host(
            LSContentCard(
                title: "Route Y",
                subtitle: "30 mi · 58m",
                metadata: ["2,100 ft gain"]
            )
            .laneShadowTheme()
        )
        let source = try moleculeSource(named: "LSContentCard.swift")
        let withActionsCard = try XCTUnwrap(renderedCardLayer(in: withActions.window.layer))
        let withoutActionsCard = try XCTUnwrap(renderedCardLayer(in: withoutActions.window.layer))
        let withActionsTextLayers = drawingLayers(in: withActionsCard).sorted {
            if abs($0.frame.minY - $1.frame.minY) > 0.5 {
                return $0.frame.minY < $1.frame.minY
            }
            return $0.frame.minX < $1.frame.minX
        }
        let withoutActionsTextLayers = drawingLayers(in: withoutActionsCard).sorted { $0.frame.minY < $1.frame.minY }
        let metadataLayer = try XCTUnwrap(withActionsTextLayers[safe: 2])
        let actionTitleLayers = Array(withActionsTextLayers.dropFirst(3))
        let dividerLayer = try XCTUnwrap(descendantLayers(in: withActionsCard)
            .first(where: { abs($0.frame.height - 1) < 0.5 }))

        XCTAssertTrue(source.contains("LSDivider()"))
        XCTAssertTrue(source.contains("actions"))
        XCTAssertEqual(actionTitleLayers.count, 2)
        XCTAssertGreaterThan(
            withActions.controller.sizeThatFits(in: CGSize(width: 390, height: 844)).height,
            withoutActions.controller.sizeThatFits(in: CGSize(width: 390, height: 844)).height
        )
        XCTAssertGreaterThan(dividerLayer.frame.minY, metadataLayer.frame.maxY)
        XCTAssertTrue(actionTitleLayers.allSatisfy { $0.frame.minY > dividerLayer.frame.maxY })
        XCTAssertEqual(withoutActionsTextLayers.count, 3)
        XCTAssertNil(descendantLayers(in: withoutActionsCard).first(where: { abs($0.frame.height - 1) < 0.5 }))
        XCTAssertTrue(
            descendantLayers(in: withoutActionsCard)
                .filter {
                    $0.frame.height >= Theme.shared.touchTarget.minTouchTarget && $0.frame.width < withoutActionsCard
                        .frame.width
                }
                .isEmpty
        )
    }

    func test_all_ten_stories_registered() {
        let storyIDs = MoleculesStories.all.map(\.id)
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

    private func renderedCardLayer(in root: CALayer) -> CALayer? {
        descendantLayers(in: root)
            .filter {
                $0.frame.height < root.frame.height && $0.shadowRadius >= Theme.shared.elevation.level2.radius - 0.5
            }
            .max { $0.frame.height < $1.frame.height }
    }

    private func drawingLayers(in root: CALayer) -> [CALayer] {
        descendantLayers(in: root).filter {
            String(describing: type(of: $0)).contains("CGDrawingLayer")
        }
    }

    private func descendantLayers(in root: CALayer) -> [CALayer] {
        let children = root.sublayers ?? []
        return children + children.flatMap(descendantLayers)
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

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
