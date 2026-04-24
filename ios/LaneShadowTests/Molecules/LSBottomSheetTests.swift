import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

@MainActor
final class LSBottomSheetTests: XCTestCase {
    func test_small_detent_uses_overlay_surface_tokens() throws {
        let source = try moleculeSource(named: "LSBottomSheet.swift")

        XCTAssertEqual(LSBottomSheetDetent.small.fraction, 0.25, accuracy: 0.000_1)
        XCTAssertEqual(LSBottomSheet<EmptyView>.surfaceTokenPath, "color.surface.overlay")
        XCTAssertEqual(LSBottomSheet<EmptyView>.dragHandleTokenPath, "color.border.subtle")
        XCTAssertEqual(LSBottomSheet<EmptyView>.dragHandleWidth, 36)
        XCTAssertEqual(LSBottomSheet<EmptyView>.enterRecipe(in: Theme.shared).name, "motion.recipe.chatOverlayEnter")
        XCTAssertTrue(source.contains(".presentationDetents("))
        XCTAssertTrue(source.contains(".fraction(0.25)"))
        XCTAssertTrue(source.contains(".fraction(0.5)"))
        XCTAssertTrue(source.contains(".fraction(0.9)"))
        XCTAssertTrue(source.contains("LaneShadowTheme.color.surface.overlay"))
    }

    func test_medium_and_large_detents_resolve_correct_fractions() {
        XCTAssertEqual(LSBottomSheetDetent.medium.fraction, 0.5, accuracy: 0.000_1)
        XCTAssertEqual(LSBottomSheetDetent.large.fraction, 0.9, accuracy: 0.000_1)
    }

    func test_drag_dismiss_fires_ondismiss_once() {
        let coordinator = LSBottomSheetDismissCoordinator()
        var dismissCount = 0

        coordinator.dispatch {
            dismissCount += 1
        }
        coordinator.dispatch {
            dismissCount += 1
        }

        XCTAssertEqual(dismissCount, 1)
    }

    func test_overlay_molecule_stories_registered() throws {
        let bottomSheetStories = try storySource(named: "LSBottomSheetStory.swift")
        let toastStories = try storySource(named: "LSToastStory.swift")
        let modalStories = try storySource(named: "LSModalStory.swift")
        let aggregator = try storySource(named: "MoleculesStories.swift")
        let expectedIDs = [
            "molecules.bottomSheet.small",
            "molecules.bottomSheet.medium",
            "molecules.bottomSheet.large",
            "molecules.toast.default",
            "molecules.toast.success",
            "molecules.toast.warning",
            "molecules.toast.error",
            "molecules.modal.destructive",
            "molecules.modal.primaryGhost",
            "molecules.modal.informational",
        ]

        XCTAssertTrue(aggregator.contains("LSBottomSheetStory.all"))
        XCTAssertTrue(aggregator.contains("LSToastStory.all"))
        XCTAssertTrue(aggregator.contains("LSModalStory.all"))

        for id in expectedIDs {
            XCTAssertTrue(
                bottomSheetStories.contains(id) ||
                    toastStories.contains(id) ||
                    modalStories.contains(id),
                "Missing story id: \(id)"
            )
        }
    }

    private func moleculeSource(named fileName: String) throws -> String {
        let root = repoRoot()
        let url = root
            .appendingPathComponent("ios/LaneShadow/Views/Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: url, encoding: .utf8)
    }

    private func storySource(named fileName: String) throws -> String {
        let root = repoRoot()
        let candidateURLs = [
            root.appendingPathComponent("ios/LaneShadow/Sandbox/Stories/Molecules/\(fileName)"),
            root.appendingPathComponent("ios/LaneShadow/Sandbox/Stories/\(fileName)"),
        ]

        for url in candidateURLs where FileManager.default.fileExists(atPath: url.path) {
            return try String(contentsOf: url, encoding: .utf8)
        }

        XCTFail("Missing story source: \(fileName)")
        return ""
    }

    private func repoRoot() -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
    }
}
