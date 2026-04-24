import LaneShadowTheme
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

@MainActor
final class LSListRowTests: XCTestCase {
    func test_layout_tokens_and_minimum_touch_target() throws {
        let hosted = host(
            LSListRow(
                leading: .avatar(initials: "LS"),
                title: "Name",
                subtitle: "Detail",
                trailing: .chevron
            )
            .laneShadowTheme()
        )
        let source = try moleculeSource(named: "LSListRow.swift")
        let rowLayer = try XCTUnwrap(renderedRowLayer(in: hosted.window.layer))
        let titleLayer = try XCTUnwrap(primaryTextLayers(in: hosted.window.layer)[safe: 0])
        let subtitleLayer = try XCTUnwrap(primaryTextLayers(in: hosted.window.layer)[safe: 1])
        let leadingLayer = try XCTUnwrap(leadingContentLayer(in: hosted.window.layer))
        let chevronLayer = try XCTUnwrap(trailingIconLayer(in: hosted.window.layer))

        XCTAssertTrue(source.contains("LSAvatar(image: image, initials: initials, size: size)"))
        XCTAssertTrue(source.contains("LSIcon(name: .chevR, size: .sm, color: .subtle)"))
        XCTAssertGreaterThanOrEqual(rowLayer.frame.height, Theme.shared.touchTarget.minTouchTarget)
        XCTAssertEqual(titleLayer.frame.minX - leadingLayer.frame.maxX, Theme.shared.space.sm, accuracy: 2)
        XCTAssertGreaterThan(subtitleLayer.frame.minY, titleLayer.frame.minY)
        XCTAssertGreaterThan(chevronLayer.frame.minX, subtitleLayer.frame.maxX)
    }

    func test_ontap_fires_once_and_no_highlight_without_handler() throws {
        var tapCount = 0
        let hosted = host(
            VStack(spacing: Theme.shared.space.lg) {
                LSListRow(
                    leading: .icon(.pin),
                    title: "Notifications",
                    trailing: .chevron,
                    onTap: {
                        tapCount += 1
                    }
                )

                LSListRow(
                    leading: .icon(.pin),
                    title: "Static",
                    trailing: .none,
                    onTap: nil
                )
            }
            .laneShadowTheme()
        )
        let rowFrames = rowFrames(in: hosted.window.layer)
        let interactiveControl = try XCTUnwrap(
            findView(withIdentifier: "lslistrow-interactive", in: hosted.window) as? UIControl
        )
        let staticHitView = hosted.window.hitTest(
            CGPoint(x: 40, y: rowFrames[1].midY),
            with: nil
        )

        interactiveControl.sendActions(for: .touchUpInside)

        XCTAssertEqual(tapCount, 1)
        XCTAssertNil(nearestControlAncestor(from: staticHitView))
    }

    func test_no_forbidden_literal_style_or_deprecated_apis_in_list_row() throws {
        let source = try moleculeSource(named: "LSListRow.swift")

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

    private func findView(withIdentifier identifier: String, in view: UIView) -> UIView? {
        if view.accessibilityIdentifier == identifier {
            return view
        }

        for subview in view.subviews {
            if let match = findView(withIdentifier: identifier, in: subview) {
                return match
            }
        }

        return nil
    }

    private func nearestControlAncestor(from view: UIView?) -> UIControl? {
        var current = view?.superview

        while let candidate = current {
            if let control = candidate as? UIControl {
                return control
            }

            current = candidate.superview
        }

        return nil
    }

    private func frame(of view: UIView, in root: UIView) -> CGRect {
        view.convert(view.bounds, to: root)
    }

    private func renderedRowLayer(in root: CALayer) -> CALayer? {
        descendantLayers(in: root)
            .first {
                abs($0.frame.width - root.frame.width) < 0.5 && $0.frame.height >= Theme.shared.touchTarget
                    .minTouchTarget && $0.frame.height < 60
            }
    }

    private func primaryTextLayers(in root: CALayer) -> [CALayer] {
        descendantLayers(in: root)
            .filter { String(describing: type(of: $0)).contains("CGDrawingLayer") && $0.frame.minX > 30 }
            .sorted { $0.frame.minY < $1.frame.minY }
    }

    private func leadingContentLayer(in root: CALayer) -> CALayer? {
        descendantLayers(in: root)
            .first {
                $0.frame.minX < 20 && $0.frame.width <= Theme.shared.touchTarget.minTouchTarget && !$0.frame.isEmpty
            }
    }

    private func trailingIconLayer(in root: CALayer) -> CALayer? {
        descendantLayers(in: root)
            .first { String(describing: type(of: $0)).contains("RBDrawingLayer") }
    }

    private func rowFrames(in root: CALayer) -> [CGRect] {
        var frames: [CGRect] = []
        for layer in descendantLayers(in: root)
            where abs(layer.frame.width - root.frame.width) < 0.5 && layer.frame.height >= Theme.shared.touchTarget
            .minTouchTarget && layer.frame.height < 60
        {
            if frames
                .contains(where: { abs($0.minY - layer.frame.minY) < 0.5 && abs($0.height - layer.frame.height) < 0.5
                })
            {
                continue
            }
            frames.append(layer.frame)
        }
        return frames.sorted { $0.minY < $1.minY }
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
