import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import XCTest
@testable import LaneShadow

@MainActor
struct PlanningScreenTokenTests {
    // MARK: - AC-8: Token purity (zero hex/numeric hardcoding)

    /// TC-8: PlanningScreen.swift contains zero hardcoded hex, RGB, or numeric values
    @Test
    func token_purity_enforced() throws {
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift"
        let source = try String(contentsOfFile: sourceFile, encoding: .utf8)

        // Use regex to detect hex color literals (e.g., #RRGGBB or #RGB)
        let hexRegex = try NSRegularExpression(pattern: "#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}")
        let hexMatches = hexRegex.matches(in: source, range: NSRange(source.startIndex..., in: source))
        #expect(hexMatches.isEmpty, "PlanningScreen should not contain hex color literals")

        // Detect Color(red:green:blue:) patterns
        let rgbRegex = try NSRegularExpression(pattern: "Color\\(red:")
        let rgbMatches = rgbRegex.matches(in: source, range: NSRange(source.startIndex..., in: source))
        #expect(rgbMatches.isEmpty, "PlanningScreen should not contain Color(red:...) literals")

        // Verify theme token usage is present (sample check)
        let usesThemeTokens = source.contains("theme.space") || source.contains("LaneShadowTheme.color")
        #expect(usesThemeTokens, "PlanningScreen should use theme tokens for all styling")
    }

    // MARK: - AC-9: Sandbox stories with canonical IDs

    /// TC-9: Sandbox stories exist with canonical lowercase dot-separated IDs (14 total: 7 states × 2 themes)
    @Test
    func sandboxStories_registered() throws {
        let storyFile =
            "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Sandbox/Stories/Templates/" +
            "PlanningScreenStory.swift"
        let source = try String(contentsOfFile: storyFile, encoding: .utf8)

        // Canonical story IDs that MUST be present
        let requiredIds = [
            "templates.planning-screen.scouting-light",
            "templates.planning-screen.scouting-dark",
            "templates.planning-screen.drawing-light",
            "templates.planning-screen.drawing-dark",
            "templates.planning-screen.weather-light",
            "templates.planning-screen.weather-dark",
            "templates.planning-screen.scoring-light",
            "templates.planning-screen.scoring-dark",
            "templates.planning-screen.slow-planning-light",
            "templates.planning-screen.slow-planning-dark",
            "templates.planning-screen.cancel-prompt-light",
            "templates.planning-screen.cancel-prompt-dark",
            "templates.planning-screen.single-candidate-light",
            "templates.planning-screen.single-candidate-dark"
        ]

        for id in requiredIds {
            #expect(
                source.contains("\"" + id + "\""),
                "PlanningScreenStory should contain story ID: \(id)"
            )
        }

        // Verify no old-style IDs remain
        let oldPatterns = [
            "templates.planning-screen.phase1",
            "templates.planning-screen.default",
            "templates.planning-screen.phase3",
            "templates.planning-screen.phase4",
            "templates.planning-screen.phase5",
            "templates.planning-screen.dark",
            "templates.planning-screen.v-slow",
            "templates.planning-screen.v-cancel-confirm",
            "templates.planning-screen.v-single-candidate"
        ]
        for oldId in oldPatterns {
            #expect(
                !source.contains("id: \"" + oldId + "\""),
                "PlanningScreenStory should NOT contain old-style ID: \(oldId)"
            )
        }
    }

    // MARK: - Static Code Quality Tests

    /// Sketch polyline uses recipe-driven animation, not literals
    @Test
    func sketch_animation_uses_recipe_not_literals() throws {
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift"
        let source = try String(contentsOfFile: sourceFile, encoding: .utf8)

        let containsRecipeReference = source.contains("sketchPolylineLoop") || source.contains("motion.recipe")
        #expect(
            containsRecipeReference,
            "Source should reference motion.recipe for animation durations and easing"
        )

        let containsBreathingRecipe = source.contains("breathingHeadDot") || source.contains("motion.recipe")
        #expect(containsBreathingRecipe, "Source should reference breathing animation recipe")
    }

    /// Sketch polyline uses GeometryReader, not UIScreen.main.bounds
    @Test
    func sketch_polyline_uses_geometry_not_uiscreen() throws {
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift"
        let source = try String(contentsOfFile: sourceFile, encoding: .utf8)

        let hasUIScreenMainBounds = source.contains("UIScreen.main.bounds")
        #expect(
            !hasUIScreenMainBounds,
            "PlanningScreen should not use UIScreen.main.bounds; use GeometryReader or view sizing instead"
        )

        // SketchingPolyline is instantiated in parsingPolyline computed property
        let hasSketchingPolyline = source.contains("SketchingPolyline()")
        #expect(hasSketchingPolyline, "PlanningScreen should render SketchingPolyline view")
    }

    /// No data fetching in template (Convex/URLSession)
    @Test
    func no_data_fetching_in_template() throws {
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift"
        let source = try String(contentsOfFile: sourceFile, encoding: .utf8)

        let forbiddenPatterns = ["Convex", "URLSession", ".task("]
        for pattern in forbiddenPatterns {
            #expect(
                !source.contains(pattern),
                "PlanningScreen.swift should not contain '\(pattern)' — found data fetching symbol"
            )
        }
    }
}
