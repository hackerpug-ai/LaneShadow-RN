import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

@MainActor
final class LSScrimTests: XCTestCase {
    func test_default_passes_touches_through() throws {
        var probeTapCount = 0
        let harness = ScrimHarness(
            blocking: false,
            onProbeTap: { probeTapCount += 1 },
            onScrimTap: nil
        )

        let controller = host(harness)
        let hitTarget = try XCTUnwrap(nearestIdentifiedView(from: controller.window.hitTest(hitPoint, with: nil)))

        XCTAssertEqual(hitTarget.accessibilityIdentifier, ProbeTapControl.accessibilityIdentifier)

        let probeControl = try XCTUnwrap(findView(
            withIdentifier: ProbeTapControl.accessibilityIdentifier,
            in: controller.window
        ) as? UIControl)
        probeControl.sendActions(for: .touchUpInside)

        XCTAssertEqual(probeTapCount, 1)
    }

    func test_blocking_captures_touch_and_fires_onTap_once() throws {
        var probeTapCount = 0
        var scrimTapCount = 0
        let harness = ScrimHarness(
            blocking: true,
            onProbeTap: { probeTapCount += 1 },
            onScrimTap: { scrimTapCount += 1 }
        )

        let controller = host(harness)
        let hitTarget = try XCTUnwrap(nearestIdentifiedView(from: controller.window.hitTest(hitPoint, with: nil)))
        let scrimControl = try XCTUnwrap(findView(
            withIdentifier: LSScrim.tapCaptureAccessibilityIdentifier,
            in: controller.window
        ) as? UIControl)

        XCTAssertEqual(hitTarget.accessibilityIdentifier, LSScrim.tapCaptureAccessibilityIdentifier)

        scrimControl.sendActions(for: .touchUpInside)

        XCTAssertEqual(scrimTapCount, 1)
        XCTAssertEqual(probeTapCount, 0)
    }

    private let hitPoint = CGPoint(x: 80, y: 80)

    private func host(_ rootView: some View) -> HostedHarness {
        let controller = UIHostingController(rootView: AnyView(rootView))
        controller.loadViewIfNeeded()
        controller.view.frame = CGRect(x: 0, y: 0, width: 160, height: 160)
        controller.view.backgroundColor = .white
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

    private func nearestIdentifiedView(from view: UIView?) -> UIView? {
        var current = view

        while let candidate = current {
            if candidate.accessibilityIdentifier != nil {
                return candidate
            }

            current = candidate.superview
        }

        return nil
    }
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}

private struct ScrimHarness: View {
    let blocking: Bool
    let onProbeTap: () -> Void
    let onScrimTap: (() -> Void)?

    var body: some View {
        ZStack {
            ProbeTapView(onTap: onProbeTap)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            LSScrim(
                opacity: LSScrim.defaultOpacity,
                blocking: blocking,
                onTap: onScrimTap
            )
        }
        .frame(width: 160, height: 160)
        .laneShadowTheme()
    }
}

private struct ProbeTapView: UIViewRepresentable {
    let onTap: () -> Void

    func makeUIView(context: Context) -> ProbeTapControl {
        let control = ProbeTapControl()
        control.onTap = onTap
        return control
    }

    func updateUIView(_ uiView: ProbeTapControl, context _: Context) {
        uiView.onTap = onTap
    }
}

private final class ProbeTapControl: UIControl {
    static let accessibilityIdentifier = "LSScrimTests.probe"

    var onTap: (() -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        accessibilityIdentifier = Self.accessibilityIdentifier
        addAction(UIAction { [weak self] _ in
            self?.onTap?()
        }, for: .touchUpInside)
    }

    @available(*, unavailable)
    required init?(coder _: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
