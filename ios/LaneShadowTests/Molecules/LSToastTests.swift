import LaneShadowTheme
import XCTest
@testable import LaneShadow

@MainActor
final class LSToastTests: XCTestCase {
    func test_all_four_variants_resolve_status_tokens_and_motion_recipe() {
        let theme = Theme.shared
        let expectedTokens: [(LSToastVariant, String)] = [
            (.default, "color.surface.overlay"),
            (.success, "color.status.success.default"),
            (.warning, "color.status.warning.default"),
            (.error, "color.status.error.default"),
        ]

        for (variant, expectedBackgroundToken) in expectedTokens {
            XCTAssertEqual(
                variant.resolvedStyle(in: theme).backgroundToken,
                expectedBackgroundToken
            )
        }

        XCTAssertEqual(LSToast.enterRecipe(in: theme).name, "motion.recipe.chatOverlayEnter")
        XCTAssertEqual(LSToast.dismissRecipe(in: theme).name, "motion.recipe.chatOverlayDismiss")
    }

    func test_auto_dismiss_fires_after_motion_recipe_duration() throws {
        let source = try moleculeSource(named: "LSToast.swift")
        let recipe = LSToast.dismissRecipe(in: Theme.shared)
        let coordinator = LSToastDismissCoordinator()
        var dismissCount = 0

        coordinator.dispatch {
            dismissCount += 1
        }
        coordinator.dispatch {
            dismissCount += 1
        }

        XCTAssertEqual(recipe.visibleDurationMilliseconds, 5000)
        XCTAssertEqual(dismissCount, 1)
        XCTAssertTrue(source.contains("Task.sleep"))
        XCTAssertFalse(source.contains("DispatchQueue.main.asyncAfter"))
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
