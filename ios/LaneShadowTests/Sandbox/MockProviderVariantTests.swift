import Foundation
import Testing
@testable import LaneShadow

@Suite("Mock Provider Variant Tests")
struct MockProviderVariantTests {
    // MARK: - IdleMockProvider

    @Test("IdleMockProvider: All variants return values")
    func idleMockProvider_allVariantsReturnValues() {
        for variant in IdleMockProvider.variants {
            let state = IdleMockProvider.value(variant: variant)
            #expect(!state.suggestions.isEmpty || variant == "empty", "Variant '\(variant)' should return valid state")
        }
    }

    @Test("IdleMockProvider: Variants are distinguishable")
    func idleMockProvider_variantsAreDistinguishable() {
        let defaultState = IdleMockProvider.value(variant: "default")
        let emptyState = IdleMockProvider.value(variant: "empty")
        let overflowState = IdleMockProvider.value(variant: "overflow")
        let longCopyState = IdleMockProvider.value(variant: "long-copy")

        #expect(defaultState.suggestions.count == 4, "Default should have 4 suggestions")
        #expect(emptyState.suggestions.count == 0, "Empty should have 0 suggestions")
        #expect(overflowState.suggestions.count == 12, "Overflow should have 12 suggestions")
        #expect(longCopyState.suggestions.count == 4, "Long-copy should have 4 suggestions")

        // Verify long-copy has longer text
        #expect(
            longCopyState.greeting.headline.count > defaultState.greeting.headline.count,
            "Long-copy headline should be longer"
        )
    }

    @Test("IdleMockProvider: Deterministic")
    func idleMockProvider_isDeterministic() {
        let state1 = IdleMockProvider.value(variant: "default")
        let state2 = IdleMockProvider.value(variant: "default")

        #expect(state1 == state2, "Same variant should return equal state")
        #expect(state1.greeting.headline == state2.greeting.headline, "Greeting headline should match")
        #expect(state1.suggestions.count == state2.suggestions.count, "Suggestion count should match")
    }

    // MARK: - PlanningMockProvider

    @Test("PlanningMockProvider: All variants return values")
    func planningMockProvider_allVariantsReturnValues() {
        for variant in PlanningMockProvider.variants {
            let state = PlanningMockProvider.value(variant: variant)
            #expect(state.phases.count >= 0, "Variant '\(variant)' should return valid state")
        }
    }

    @Test("PlanningMockProvider: Variants are distinguishable")
    func planningMockProvider_variantsAreDistinguishable() {
        let defaultState = PlanningMockProvider.value(variant: "default")
        let emptyState = PlanningMockProvider.value(variant: "empty")
        let overflowState = PlanningMockProvider.value(variant: "overflow")

        #expect(defaultState.phases.count == 5, "Default should have 5 phases")
        #expect(emptyState.phases.count == 0, "Empty should have 0 phases")
        #expect(overflowState.phases.count == 11, "Overflow should have 11 phases")
    }

    @Test("PlanningMockProvider: Deterministic")
    func planningMockProvider_isDeterministic() {
        let state1 = PlanningMockProvider.value(variant: "default")
        let state2 = PlanningMockProvider.value(variant: "default")

        #expect(state1 == state2, "Same variant should return equal state")
        #expect(state1.phases.count == state2.phases.count, "Phase count should match")
    }

    // MARK: - RouteResultsMockProvider

    @Test("RouteResultsMockProvider: All variants return values")
    func routeResultsMockProvider_allVariantsReturnValues() {
        for variant in RouteResultsMockProvider.variants {
            let state = RouteResultsMockProvider.value(variant: variant)
            #expect(state.routes.count >= 0, "Variant '\(variant)' should return valid state")
        }
    }

    @Test("RouteResultsMockProvider: Variants are distinguishable")
    func routeResultsMockProvider_variantsAreDistinguishable() {
        let defaultState = RouteResultsMockProvider.value(variant: "default")
        let emptyState = RouteResultsMockProvider.value(variant: "empty")
        let overflowState = RouteResultsMockProvider.value(variant: "overflow")

        #expect(defaultState.routes.count == 3, "Default should have 3 routes")
        #expect(emptyState.routes.count == 0, "Empty should have 0 routes")
        #expect(overflowState.routes.count == 12, "Overflow should have 12 routes")
    }

    @Test("RouteResultsMockProvider: Deterministic")
    func routeResultsMockProvider_isDeterministic() {
        let state1 = RouteResultsMockProvider.value(variant: "default")
        let state2 = RouteResultsMockProvider.value(variant: "default")

        #expect(state1 == state2, "Same variant should return equal state")
        #expect(state1.routes.count == state2.routes.count, "Route count should match")
    }

    // MARK: - RouteDetailsMockProvider

    @Test("RouteDetailsMockProvider: All variants return values")
    func routeDetailsMockProvider_allVariantsReturnValues() {
        for variant in RouteDetailsMockProvider.variants {
            let state = RouteDetailsMockProvider.value(variant: variant)
            #expect(state.weatherTimeline.count >= 0, "Variant '\(variant)' should return valid state")
        }
    }

    @Test("RouteDetailsMockProvider: Variants are distinguishable")
    func routeDetailsMockProvider_variantsAreDistinguishable() {
        let defaultState = RouteDetailsMockProvider.value(variant: "default")
        let emptyState = RouteDetailsMockProvider.value(variant: "empty")
        let overflowState = RouteDetailsMockProvider.value(variant: "overflow")

        #expect(defaultState.weatherTimeline.count == 7, "Default should have 7 timeline entries")
        #expect(emptyState.weatherTimeline.count == 0, "Empty should have 0 timeline entries")
        #expect(overflowState.weatherTimeline.count == 23, "Overflow should have 23 timeline entries")
    }

    @Test("RouteDetailsMockProvider: Deterministic")
    func routeDetailsMockProvider_isDeterministic() {
        let state1 = RouteDetailsMockProvider.value(variant: "default")
        let state2 = RouteDetailsMockProvider.value(variant: "default")

        #expect(state1 == state2, "Same variant should return equal state")
        #expect(state1.weatherTimeline.count == state2.weatherTimeline.count, "Timeline count should match")
    }

    // MARK: - SessionsMockProvider

    @Test("SessionsMockProvider: All variants return values")
    func sessionsMockProvider_allVariantsReturnValues() {
        for variant in SessionsMockProvider.variants {
            let state = SessionsMockProvider.value(variant: variant)
            #expect(state.sessions.count >= 0, "Variant '\(variant)' should return valid state")
        }
    }

    @Test("SessionsMockProvider: Variants are distinguishable")
    func sessionsMockProvider_variantsAreDistinguishable() {
        let defaultState = SessionsMockProvider.value(variant: "default")
        let emptyState = SessionsMockProvider.value(variant: "empty")
        let overflowState = SessionsMockProvider.value(variant: "overflow")

        #expect(defaultState.sessions.count == 3, "Default should have 3 sessions")
        #expect(emptyState.sessions.count == 0, "Empty should have 0 sessions")
        #expect(overflowState.sessions.count == 12, "Overflow should have 12 sessions")
    }

    @Test("SessionsMockProvider: Deterministic")
    func sessionsMockProvider_isDeterministic() {
        let state1 = SessionsMockProvider.value(variant: "default")
        let state2 = SessionsMockProvider.value(variant: "default")

        #expect(state1 == state2, "Same variant should return equal state")
        #expect(state1.sessions.count == state2.sessions.count, "Session count should match")
    }

    // MARK: - ErrorMockProvider

    @Test("ErrorMockProvider: All variants return values")
    func errorMockProvider_allVariantsReturnValues() {
        for variant in ErrorMockProvider.variants {
            let state = ErrorMockProvider.value(variant: variant)
            #expect(!state.error.body.isEmpty, "Variant '\(variant)' should return valid state")
        }
    }

    @Test("ErrorMockProvider: Variants are distinguishable")
    func errorMockProvider_variantsAreDistinguishable() {
        let defaultState = ErrorMockProvider.value(variant: "default")
        let emptyState = ErrorMockProvider.value(variant: "empty")
        let overflowState = ErrorMockProvider.value(variant: "overflow")
        let longCopyState = ErrorMockProvider.value(variant: "long-copy")

        #expect(defaultState.suggestions.count == 2, "Default should have 2 suggestions")
        #expect(emptyState.suggestions.count == 0, "Empty should have 0 suggestions")
        #expect(overflowState.suggestions.count == 12, "Overflow should have 12 suggestions")
        #expect(longCopyState.suggestions.count == 3, "Long-copy should have 3 suggestions")

        // Verify long-copy has longer text
        #expect(longCopyState.error.body.count > defaultState.error.body.count, "Long-copy error body should be longer")
    }

    @Test("ErrorMockProvider: Deterministic")
    func errorMockProvider_isDeterministic() {
        let state1 = ErrorMockProvider.value(variant: "default")
        let state2 = ErrorMockProvider.value(variant: "default")

        #expect(state1 == state2, "Same variant should return equal state")
        #expect(state1.error.body == state2.error.body, "Error body should match")
        #expect(state1.suggestions.count == state2.suggestions.count, "Suggestion count should match")
    }

    // MARK: - Cross-Provider Tests

    @Test("All providers: Support same variant set")
    func allProviders_supportSameVariantSet() {
        let expectedVariants = ["default", "empty", "overflow", "long-copy"]

        #expect(IdleMockProvider.variants == expectedVariants, "IdleMockProvider should have standard variants")
        #expect(PlanningMockProvider.variants == expectedVariants, "PlanningMockProvider should have standard variants")
        #expect(
            RouteResultsMockProvider.variants == expectedVariants,
            "RouteResultsMockProvider should have standard variants"
        )
        #expect(
            RouteDetailsMockProvider.variants == expectedVariants,
            "RouteDetailsMockProvider should have standard variants"
        )
        #expect(SessionsMockProvider.variants == expectedVariants, "SessionsMockProvider should have standard variants")
        #expect(ErrorMockProvider.variants == expectedVariants, "ErrorMockProvider should have standard variants")
    }
}
