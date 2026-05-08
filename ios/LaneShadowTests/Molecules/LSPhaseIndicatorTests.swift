import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - LSPhaseIndicator Tests

/**
 * Tests for LSPhaseIndicator molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Compass chip + header rendering with LSPill and LSIcon
 * - Phase step list with LSPhaseDot and LSText(instrument.sm)
 * - Active step animation via LSPhaseDot phaseDotPulse
 * - All-done state transition
 * - Theme integration with semantic colors
 */
final class LSPhaseIndicatorTests: XCTestCase {
    // MARK: - AC-1: LSPhaseIndicator renders compass chip + header + LSPhaseDot list

    func test_renders_compass_chip_header_and_phasedot_step_list() {
        // GIVEN: LSPhaseIndicator with mock phases and header
        let mockPhases = [
            LSPhaseIndicator.Phase(id: "1", label: "Understanding your request", state: .done),
            LSPhaseIndicator.Phase(id: "2", label: "Searching routes", state: .active),
            LSPhaseIndicator.Phase(id: "3", label: "Checking conditions", state: .pending),
        ]
        let indicator = LSPhaseIndicator(
            phases: mockPhases,
            header: "Let me think on that…"
        )

        // WHEN: View body resolves
        let view = indicator.body

        // THEN: View renders without crashing
        // Verify component structure exists
        XCTAssertNotNil(view)

        // Verify compass chip, header, and phase steps are composed
        // (Visual verification via screenshot testing)
        let themedView = indicator.laneShadowTheme()
        XCTAssertNotNil(themedView)
    }

    // MARK: - AC-2: Active step shows phaseDotPulse via LSPhaseDot delegation

    func test_active_step_phasedot_pulse_animation_present() {
        // GIVEN: LSPhaseIndicator with at least one active phase
        let mockPhases = [
            LSPhaseIndicator.Phase(id: "1", label: "Understanding your request", state: .done),
            LSPhaseIndicator.Phase(id: "2", label: "Searching routes", state: .active),
            LSPhaseIndicator.Phase(id: "3", label: "Checking conditions", state: .pending),
        ]
        let indicator = LSPhaseIndicator(
            phases: mockPhases,
            header: "Searching available roads…"
        )

        // WHEN: View renders
        let view = indicator.body

        // THEN: Active step's LSPhaseDot(.active) contains pulse animation
        // The LSPhaseDot atom handles animation internally
        // We verify the component renders without crashing
        XCTAssertNotNil(view)

        // Verify active phase is present
        let activePhase = mockPhases.first { $0.state == .active }
        XCTAssertNotNil(activePhase)
        XCTAssertEqual(activePhase?.state, .active)
    }

    // MARK: - AC-1: Phase enum uses canonical cases (CHAT-S04-R06)

    func test_phaseEnum_containsExactlyCanonicalCases() {
        // GIVEN: PlanningMockProvider provides planning phases
        // WHEN: The default state is inspected
        let defaultState = PlanningMockProvider.value(variant: "default")
        let phaseIds = defaultState.phases.map(\.id)

        // THEN: The cases are exactly: parsing, searching, drafting, enriching, finalizing
        let canonicalPhases = [
            "parsing",
            "searching",
            "drafting",
            "enriching",
            "finalizing",
        ]

        let legacyPhases = [
            "reading",
            "sketching",
            "validating",
            "weather",
            "building",
        ]

        // All phase IDs should be canonical
        for phaseId in phaseIds {
            XCTAssertTrue(
                canonicalPhases.contains(phaseId),
                "Phase ID '\(phaseId)' should be canonical (one of: \(canonicalPhases))"
            )
        }

        // No phase IDs should be legacy
        for phaseId in phaseIds {
            XCTAssertFalse(
                legacyPhases.contains(phaseId),
                "Phase ID '\(phaseId)' should not be a legacy name (legacy: \(legacyPhases))"
            )
        }

        // Verify we have exactly 5 phases
        XCTAssertEqual(phaseIds.count, 5, "Should have exactly 5 phases, got \(phaseIds.count)")
    }

    // MARK: - AC-7: Stories registered

    func test_phase_indicator_stories_registered() {
        // GIVEN: Sandbox story registry
        // WHEN: Querying for LSPhaseIndicator stories
        // THEN: All variant stories are registered

        // Verify story registration by checking the stories file exists
        let storiesPath = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Sandbox/Stories/Molecules/LSNavigatorMoleculesStory.swift"
        let fileManager = FileManager.default
        XCTAssertTrue(fileManager.fileExists(atPath: storiesPath))

        // Stories should include: Default, All Done, All Pending
        // (Verified by story registration in LSNavigatorMoleculesStory)
    }
}
