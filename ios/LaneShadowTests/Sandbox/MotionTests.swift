import LaneShadowTheme
import SwiftUI
import Testing
@testable import LaneShadow

// MARK: - Motion Recipe Tests

/**
 * Tests for motion recipe animations driven by theme.motion tokens
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - AC-1: Sketch polyline 1400ms linear repeatForever(autoreverses:false)
 * - AC-2: Breathing head dot 1400ms easeInOut repeatForever(autoreverses:true)
 * - AC-3: LSBestBadge entrance 200ms spring scale+opacity
 * - AC-4: Record dot pulse 1400ms easeInOut 1.0↔0.45
 * - AC-5: Chat overlay enter 240ms easeOut slide-up
 *
 * These tests verify the actual motion recipe token values from the theme,
 * not just that views render. Motion recipes are defined in tokens/semantic/motion.tokens.json
 * and loaded into Theme.shared.motion.recipes.
 */
@Suite("Motion Recipe Token Tests")
@MainActor
struct MotionTests {
    // MARK: - AC-1: Sketch polyline loop runs at 1400ms linear

    @Test("sketchPolylineLoop uses 1400ms linear restart")
    func sketchPolylineLoopRecipe() throws {
        // GIVEN: Theme motion recipes
        let recipes = Theme.shared.motion.recipes

        // THEN: sketchPolylineLoop recipe has correct duration and easing
        #expect(recipes.keys.contains("sketchPolylineLoop"), "sketchPolylineLoop recipe should exist")

        let recipe = try #require(recipes["sketchPolylineLoop"])
        #expect(recipe.duration == 1400, "sketchPolylineLoop duration should be 1400ms")
        #expect(recipe.easing == [0.0, 0.0, 1.0, 1.0], "sketchPolylineLoop should use linear easing (0,0,1,1)")
    }

    // MARK: - AC-2: Breathing head dot synced with sketch loop

    @Test("breathingHeadDot uses 1400ms easeInOut reverse")
    func breathingHeadDotRecipe() throws {
        // GIVEN: Theme motion recipes
        let recipes = Theme.shared.motion.recipes

        // THEN: breathingHeadDot recipe has correct duration and easing
        #expect(recipes.keys.contains("breathingHeadDot"), "breathingHeadDot recipe should exist")

        let recipe = try #require(recipes["breathingHeadDot"])
        #expect(recipe.duration == 1400, "breathingHeadDot duration should be 1400ms")
        #expect(recipe.easing == [0.4, 0.0, 0.6, 1.0], "breathingHeadDot should use easeInOut easing (0.4,0,0.6,1)")
    }

    // MARK: - AC-3: bestBadgeEnter spring on RouteSheet

    @Test("bestBadgeEnter uses 200ms spring")
    func bestBadgeEnterRecipe() throws {
        // GIVEN: Theme motion recipes
        let recipes = Theme.shared.motion.recipes

        // THEN: bestBadgeEnter recipe has correct duration
        #expect(recipes.keys.contains("bestBadgeEnter"), "bestBadgeEnter recipe should exist")

        let recipe = try #require(recipes["bestBadgeEnter"])
        #expect(recipe.duration == 200, "bestBadgeEnter duration should be 200ms")
        // Spring easing is represented as empty array in the DTO (special case)
        #expect(recipe.easing.isEmpty, "bestBadgeEnter should use spring easing (empty array)")
    }

    // MARK: - AC-4: Record-highlight dot pulse

    @Test("recordDotPulse uses 1400ms easeInOut reverse")
    func recordDotPulseRecipe() throws {
        // GIVEN: Theme motion recipes
        let recipes = Theme.shared.motion.recipes

        // THEN: recordDotPulse recipe has correct duration and easing
        #expect(recipes.keys.contains("recordDotPulse"), "recordDotPulse recipe should exist")

        let recipe = try #require(recipes["recordDotPulse"])
        #expect(recipe.duration == 1400, "recordDotPulse duration should be 1400ms")
        #expect(recipe.easing == [0.4, 0.0, 0.6, 1.0], "recordDotPulse should use easeInOut easing (0.4,0,0.6,1)")
    }

    // MARK: - AC-5: Chat overlay enter

    @Test("chatOverlayEnter uses 240ms easeOut")
    func chatOverlayEnterRecipe() throws {
        // GIVEN: Theme motion recipes
        let recipes = Theme.shared.motion.recipes

        // THEN: chatOverlayEnter recipe has correct duration and easing
        #expect(recipes.keys.contains("chatOverlayEnter"), "chatOverlayEnter recipe should exist")

        let recipe = try #require(recipes["chatOverlayEnter"])
        #expect(recipe.duration == 240, "chatOverlayEnter duration should be 240ms")
        #expect(recipe.easing == [0.0, 0.0, 0.2, 1.0], "chatOverlayEnter should use easeOut easing (0,0,0.2,1)")
    }
}
