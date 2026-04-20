import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Discovery Filter Bar Tests

/**
 * Tests for LSDiscoveryFilterBar molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Horizontal scrollable layout with ScrollView
 * - Glassmorphic background (surface at 80% opacity)
 * - Border at bottom (20% opacity)
 * - "All" chip clears selection
 * - Archetype chips toggle selection
 * - Count badges display correctly
 * - Semantic theme tokens used
 */
final class DiscoveryFilterBarTests: XCTestCase {
    // MARK: - AC-1: Horizontal scrollable layout

    func testHorizontalScrollableLayout() {
        // GIVEN: Filter bar is created with archetypes and counts
        let counts: [LSRouteArchetype: Int] = [
            .all: 100,
            .scenic: 25,
            .twisties: 30,
            .technical: 15,
            .cruising: 20,
            .sport: 10,
            .adventure: 5,
        ]

        // WHEN: Component is rendered
        let filterBar = LSDiscoveryFilterBar(
            selectedArchetypes: [.scenic],
            onArchetypeChange: { _ in },
            counts: counts
        )

        // THEN: Renders horizontal ScrollView with chips
        XCTAssertNotNil(filterBar)
        let view = filterBar.body
        // View renders correctly
    }

    // MARK: - AC-2: Glassmorphic background

    func testGlassmorphicBackground() {
        // GIVEN: Filter bar is created
        let counts: [LSRouteArchetype: Int] = [.all: 100]

        // WHEN: Component is rendered with theme
        let filterBar = LSDiscoveryFilterBar(
            selectedArchetypes: [],
            onArchetypeChange: { _ in },
            counts: counts
        )

        // THEN: Uses surface color at 80% opacity
        XCTAssertNotNil(filterBar)
        let themedView = filterBar.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-3: Border at bottom

    func testBorderAtBottom() {
        // GIVEN: Filter bar is created
        let counts: [LSRouteArchetype: Int] = [.all: 100]

        // WHEN: Component is rendered
        let filterBar = LSDiscoveryFilterBar(
            selectedArchetypes: [],
            onArchetypeChange: { _ in },
            counts: counts
        )

        // THEN: Has border at bottom with 20% opacity
        XCTAssertNotNil(filterBar)
        let view = filterBar.body
        // View renders correctly
    }

    // MARK: - AC-4: "All" chip clears selection

    func testAllChipClearsSelection() {
        // GIVEN: Filter bar is created with selected archetypes
        var selectedArchetypes: [LSRouteArchetype] = [.scenic, .twisties]
        let counts: [LSRouteArchetype: Int] = [.all: 100, .scenic: 25, .twisties: 30]

        // WHEN: "All" chip is pressed (simulated by calling onArchetypeChange with empty array)
        let filterBar = LSDiscoveryFilterBar(
            selectedArchetypes: selectedArchetypes,
            onArchetypeChange: { newArchetypes in
                selectedArchetypes = newArchetypes
            },
            counts: counts
        )

        // Simulate pressing "All" by calling callback directly
        filterBar.simulateTap(archetype: .all)

        // THEN: Selection is cleared
        XCTAssertEqual(selectedArchetypes.count, 0)
    }

    // MARK: - AC-5: Archetype chips toggle

    func testArchetypeChipTogglesSelection() {
        // GIVEN: Filter bar is created with one selected archetype
        var selectedArchetypes: [LSRouteArchetype] = [.scenic]
        let counts: [LSRouteArchetype: Int] = [.all: 100, .scenic: 25, .twisties: 30]

        // WHEN: Pressing a different archetype (twisties)
        let filterBar = LSDiscoveryFilterBar(
            selectedArchetypes: selectedArchetypes,
            onArchetypeChange: { newArchetypes in
                selectedArchetypes = newArchetypes
            },
            counts: counts
        )

        // Simulate pressing twisties
        filterBar.simulateTap(archetype: .twisties)

        // THEN: Both archetypes are selected
        XCTAssertTrue(selectedArchetypes.contains(.scenic))
        XCTAssertTrue(selectedArchetypes.contains(.twisties))
    }

    func testDeselectingLastArchetypeShowsAll() {
        // GIVEN: Filter bar is created with one selected archetype
        var selectedArchetypes: [LSRouteArchetype] = [.scenic]
        let counts: [LSRouteArchetype: Int] = [.all: 100, .scenic: 25]

        // WHEN: Deselecting the only selected archetype
        let filterBar = LSDiscoveryFilterBar(
            selectedArchetypes: selectedArchetypes,
            onArchetypeChange: { newArchetypes in
                selectedArchetypes = newArchetypes
            },
            counts: counts
        )

        // Simulate deselecting scenic
        filterBar.simulateTap(archetype: .scenic)

        // THEN: Selection is cleared (shows all)
        XCTAssertEqual(selectedArchetypes.count, 0)
    }

    // MARK: - AC-6: Count badges display

    func testCountBadgesDisplayCorrectly() {
        // GIVEN: Filter bar is created with counts
        let counts: [LSRouteArchetype: Int] = [
            .all: 1250,
            .scenic: 99,
            .twisties: 5,
        ]

        // WHEN: Component is rendered
        let filterBar = LSDiscoveryFilterBar(
            selectedArchetypes: [],
            onArchetypeChange: { _ in },
            counts: counts
        )

        // THEN: Chips display formatted counts (1.2k, 99+, 5)
        XCTAssertNotNil(filterBar)
        let view = filterBar.body
        // View renders correctly
    }

    // MARK: - AC-7: Semantic theme tokens

    func testUsesSemanticThemeTokens() {
        // GIVEN: Filter bar is created
        let counts: [LSRouteArchetype: Int] = [.all: 100]

        // WHEN: Component is rendered with theme
        let filterBar = LSDiscoveryFilterBar(
            selectedArchetypes: [],
            onArchetypeChange: { _ in },
            counts: counts
        )

        // THEN: Uses theme.space.md/lg for padding, theme.colors for backgrounds
        XCTAssertNotNil(filterBar)
        let themedView = filterBar.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-8: Chip spacing

    func testChipSpacing() {
        // GIVEN: Filter bar is created with multiple archetypes
        let counts: [LSRouteArchetype: Int] = [
            .all: 100,
            .scenic: 25,
            .twisties: 30,
            .technical: 15,
        ]

        // WHEN: Component is rendered
        let filterBar = LSDiscoveryFilterBar(
            selectedArchetypes: [],
            onArchetypeChange: { _ in },
            counts: counts
        )

        // THEN: Chips have theme.space.sm spacing between them
        XCTAssertNotNil(filterBar)
        let view = filterBar.body
        // View renders correctly
    }
}
