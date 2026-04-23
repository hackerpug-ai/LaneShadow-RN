import LaneShadowTheme
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

@MainActor
final class LSAvatarTests: XCTestCase {
    func test_image_variant_renders_at_sizing_icon_md_default() throws {
        let theme = Theme.shared
        let sampleImage = try XCTUnwrap(UIImage(systemName: "person.fill"))
        let avatar = LSAvatar(image: sampleImage)

        XCTAssertNotNil(avatar)
        XCTAssertEqual(LSAvatar.resolvedSize(.md, in: theme), theme.iconSize.medium)
        XCTAssertEqual(
            hostedSize(of: avatar.laneShadowTheme()),
            CGSize(width: theme.iconSize.medium, height: theme.iconSize.medium)
        )

        let source = try sourceFileContents()
        XCTAssertTrue(source.contains(".scaledToFill()"))
        XCTAssertTrue(source.contains(".clipShape(Circle())"))
    }

    func test_initials_fallback_uses_label_md_on_surface_card() throws {
        let theme = Theme.shared
        let avatar = LSAvatar(initials: "JR", size: .md)

        XCTAssertNotNil(avatar)
        XCTAssertEqual(LSAvatar.initialsVariant(for: .md), .label.md)
        XCTAssertEqual(LSAvatar.surfaceFill(in: theme), theme.colors.card.default)
        XCTAssertEqual(LSAvatar.contentFill(in: theme), theme.colors.onSurface.default)
        XCTAssertEqual(
            hostedSize(of: avatar.laneShadowTheme()),
            CGSize(width: theme.iconSize.medium, height: theme.iconSize.medium)
        )

        let source = try sourceFileContents()
        XCTAssertTrue(source.contains("LSText("))
    }

    private func hostedSize(of view: some View) -> CGSize {
        let controller = UIHostingController(rootView: view)
        controller.loadViewIfNeeded()
        return controller.sizeThatFits(in: CGSize(width: 200, height: 200))
    }

    private func sourceFileContents() throws -> String {
        let testsURL = URL(fileURLWithPath: #filePath)
        let sourceURL = testsURL
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LaneShadow/Views/Atoms/LSAvatar.swift")
        return try String(contentsOf: sourceURL, encoding: .utf8)
    }
}
