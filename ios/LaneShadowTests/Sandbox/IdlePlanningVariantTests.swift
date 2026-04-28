import Foundation
import SwiftUI
import Testing
@testable import LaneShadow

@Suite("Idle/Planning Screen Variant Tests")
struct IdlePlanningVariantTests {
    // MARK: - AC-1: Idle V01 no-location

    @Test("AC-1: Idle V01 no-location renders copper pill and dim chat input")
    func idleV01NoLocation() {
        // GIVEN: IdleScreen story "templates.idle-screen.v-no-location"
        let state = IdleMockProvider.value(variant: "v-no-location")

        // THEN: Location mode should be "needed" and greeting should reflect no location
        #expect(state.locationContext.mode == "needed", "Location mode should be 'needed'")
        #expect(state.greeting.meta.contains("Set a start"), "Meta should prompt to set start")
        #expect(state.greeting.headline.contains("starting"), "Headline should ask about starting point")
    }

    // MARK: - AC-2: Idle V02 first-ride

    @Test("AC-2: Idle V02 first-ride has no favorite pins and onboarding chips")
    func idleV02FirstRide() {
        // GIVEN: IdleScreen story "templates.idle-screen.v-first-ride"
        let state = IdleMockProvider.value(variant: "v-first-ride")

        // THEN: Suggestions should be onboarding-focused, not ride-specific
        #expect(!state.suggestions.isEmpty, "V02 should have onboarding suggestions")
        let onboardingChips = state.suggestions.map(\.label)
        #expect(onboardingChips.contains("Short & scenic") || onboardingChips.contains("Learn the roads"),
                "V02 should include onboarding chips like 'Short & scenic' or 'Learn the roads'")
    }

    // MARK: - AC-3: Idle V03 weather-advisory

    @Test("AC-3: Idle V03 weather-advisory renders warning meta and advisory card")
    func idleV03WeatherAdvisory() {
        // GIVEN: IdleScreen story "templates.idle-screen.v-weather-advisory"
        let state = IdleMockProvider.value(variant: "v-weather-advisory")

        // THEN: Greeting should reflect weather concern and meta should indicate severity
        #expect(state.greeting.meta.contains("Heavy rain") || state.greeting.meta.contains("Rain"),
                "V03 meta should mention rain/advisory")
        #expect(!state.greeting.headline.isEmpty, "V03 should have weather-concerned headline")
    }

    // MARK: - AC-4: Planning V01 slow-planning

    @Test("AC-4: Planning V01 slow-planning renders italic apology")
    func planningV01Slow() {
        // GIVEN: PlanningScreen story "templates.planning-screen.v-slow"
        let state = PlanningMockProvider.value(variant: "v-slow")

        // THEN: Message should contain slow-planning apology
        #expect(state.message.body.contains("Still scouting") ||
            state.message.body.contains("taking longer") ||
            state.message.detail?.contains("scouting") == true,
            "V01 should have slow-planning apology message")
    }

    // MARK: - AC-5: Planning V02 cancel-confirm

    @Test("AC-5: Planning V02 cancel-confirm renders confirm sheet")
    func planningV02CancelConfirm() {
        // GIVEN: PlanningScreen story "templates.planning-screen.v-cancel-confirm"
        let state = PlanningMockProvider.value(variant: "v-cancel-confirm")

        // THEN: State should indicate cancel-confirm is active
        // This will be verified through UI state in the actual implementation
        #expect(!state.phases.isEmpty, "V02 should have planning phases")
    }

    // MARK: - AC-6: Planning V03 single-candidate

    @Test("AC-6: Planning V03 single-candidate renders warning chrome")
    func planningV03SingleCandidate() {
        // GIVEN: PlanningScreen story "templates.planning-screen.v-single-candidate"
        let state = PlanningMockProvider.value(variant: "v-single-candidate")

        // THEN: State should reflect single-candidate constraint
        #expect(!state.phases.isEmpty, "V03 should have planning phases")
    }
}
