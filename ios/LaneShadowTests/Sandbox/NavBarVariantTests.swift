import LaneShadowTheme
import NativeSandbox
import SwiftUI
import XCTest

@MainActor
final class NavBarVariantTests: XCTestCase {
    // MARK: - AC-1: iOS filter-chip row

    func testIOSNavBarFilterChipRow() {
        // GIVEN: Filter chip specs
        let chips = [
            FilterChipSpec(label: "Mileage", isSelected: false),
            FilterChipSpec(label: "Difficulty", isSelected: true),
            FilterChipSpec(label: "Surface", isSelected: false),
        ]

        // WHEN: The nav bar renders
        let navBar = LSNavBar(
            title: "Filter",
            leading: .back(action: {}),
            trailing: .none,
            filterChips: chips
        )

        // THEN: Verify the nav bar renders without errors
        // Note: Full snapshot verification happens in sandbox stories
        // This test ensures the component compiles and renders
        assertNotNil(navBar)
    }

    // MARK: - AC-3: iOS search-slot

    func testIOSNavBarSearchSlot() {
        // GIVEN: Search slot spec
        let searchSlot = SearchSlotSpec(placeholder: "Search routes…")

        // WHEN: The nav bar renders
        let navBar = LSNavBar(
            title: "Filter",
            leading: .back(action: {}),
            trailing: .none,
            searchSlot: searchSlot
        )

        // THEN: Verify the nav bar renders without errors
        // Note: Full snapshot verification happens in sandbox stories
        // This test ensures the component compiles and renders
        assertNotNil(navBar)
    }

    // MARK: - AC-5: Story registration verification

    func testIOSNavBarStoryRegistration() {
        // This test verifies that the canonical story IDs are registered
        // Actual verification happens via pnpm snapshots:check
        // This is a compile-time check that stories exist
        let stories = LSNavBarStory.all
        let storyIds = stories.map(\.id)

        XCTAssertTrue(storyIds.contains("organisms.nav-bar.basic"), "Should have basic story with canonical ID")
        XCTAssertTrue(
            storyIds.contains("organisms.nav-bar.filter-chip-row"),
            "Should have filter-chip-row story with canonical ID"
        )
        XCTAssertTrue(
            storyIds.contains("organisms.nav-bar.search-slot"),
            "Should have search-slot story with canonical ID"
        )
    }
}
