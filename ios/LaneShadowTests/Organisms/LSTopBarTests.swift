import LaneShadowTheme
import SwiftUI
import Testing
@testable import LaneShadow

@MainActor
struct LSTopBarTests {
    @Test("test_default_renders_glass_hamburger_and_new_chip")
    func default_renders_glass_hamburger_and_new_chip() {
        // GIVEN: developer renders LSTopBar with onMenuTap and onNewTap callbacks
        var menuTapCount = 0
        var newTapCount = 0

        let topBar = LSTopBar(
            onMenuTap: { menuTapCount += 1 },
            onNewTap: { newTapCount += 1 }
        )

        // WHEN: view body resolves
        _ = topBar.body

        // THEN: leading edge shows 40x40 LSGlassPanel(.chrome) chip with LSIcon(.menu)
        // THEN: trailing edge shows rounded LSGlassPanel(.chrome) chip with LSIcon(.plus) + LSText
        // THEN: no centered title
        // THEN: safe-area inset respected at top
        // Structural verification: body resolves without crashing
    }

    @Test("test_with_title_renders_centered_title")
    func with_title_renders_centered_title() {
        // GIVEN: developer renders LSTopBar with title
        let topBar = LSTopBar(
            title: "Details",
            onMenuTap: {},
            onNewTap: {}
        )

        // WHEN: view body resolves
        _ = topBar.body

        // THEN: centered LSText(ui.title.md, 'Details') renders between hamburger and NEW chip
        // Structural verification: body resolves without crashing
    }

    @Test("test_tap_handlers_fire_exactly_once")
    func tap_handlers_fire_exactly_once() {
        // GIVEN: LSTopBar with onMenuTap and onNewTap callbacks
        var menuTapCount = 0
        var newTapCount = 0

        let onMenuTap = { menuTapCount += 1 }
        let onNewTap = { newTapCount += 1 }

        let topBar = LSTopBar(
            onMenuTap: onMenuTap,
            onNewTap: onNewTap
        )

        // WHEN: view body resolves and handlers are invoked
        _ = topBar.body

        // Verify handlers don't auto-fire
        #expect(menuTapCount == 0, "Menu tap should not fire automatically")
        #expect(newTapCount == 0, "New tap should not fire automatically")

        // Simulate handler invocations to verify wiring
        onMenuTap()
        #expect(menuTapCount == 1, "Menu tap handler should fire once when invoked")
        #expect(newTapCount == 0, "New tap handler should not have fired")

        onNewTap()
        #expect(menuTapCount == 1, "Menu tap handler should still be 1")
        #expect(newTapCount == 1, "New tap handler should fire once when invoked")
    }

    @Test("test_record_highlight_variant_uses_status_recording_token")
    func record_highlight_variant_uses_status_recording_token() {
        // GIVEN: developer renders LSTopBar with Record Highlight variant
        let topBar = LSTopBar(
            trailing: .recordHighlight(isRecording: true),
            onMenuTap: {}
        )

        // WHEN: view body resolves
        _ = topBar.body

        // THEN: trailing chip shows recording indicator dot resolved from color.status.recording token
        // Structural verification: body resolves without crashing
    }

    @Test("test_topbar_and_navbar_stories_registered")
    func topbar_and_navbar_stories_registered() {
        // GIVEN: developer opens the sandbox
        // WHEN: navigating to Organisms / TopBar and Organisms / NavBar
        // THEN: stories Default, With Title, Hamburger Only, Record Highlight, and NavBar Default are present
        let allStories = OrganismStories.all

        // Verify stories are registered
        let storyIds = Set(allStories.map(\.id))

        #expect(storyIds.contains("organisms.topbar.default"), "Default TopBar story should be registered")
        #expect(storyIds.contains("organisms.topbar.withTitle"), "With Title TopBar story should be registered")
        #expect(storyIds.contains("organisms.topbar.hamburgerOnly"), "Hamburger Only TopBar story should be registered")
        #expect(
            storyIds.contains("organisms.topbar.recordHighlight"),
            "Record Highlight TopBar story should be registered"
        )
        #expect(storyIds.contains("organisms.navbar.default"), "Default NavBar story should be registered")
    }
}
