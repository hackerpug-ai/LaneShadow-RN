import Foundation
import LaneShadowTheme
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@Suite("RouteDetails Screen Wiring Tests")
@MainActor
struct RouteDetailsWiringTests {
    @Test("Instrument readout binds selected option")
    func routeDetails_instrumentReadout_bindsSelectedOption() async throws {
        // GIVEN: ChatStore in .routeDetails(sessionId=X, selectedRouteId=opt-1)
        // and a stub plan whose option opt-1 has distanceMeters=42000, durationSeconds=4500,
        // elevationGainMeters=850, scenicScore=0.86
        let stubConvexClient = StubLaneShadowConvexClient()
        let chatStore = ChatStore(
            flowState: .routeDetails(
                RouteDetailsState(
                    sessionId: "session-123",
                    routeOptions: PlannedRouteOptionsView(
                        planId: "plan-123",
                        options: [
                            PlannedRouteOptionView(
                                routeOptionId: "opt-1",
                                label: "Best Route",
                                rationale: "Most scenic",
                                stats: PlannedRouteOptionStats(
                                    distanceMeters: 42000,
                                    durationSeconds: 4500,
                                    legsCount: 1
                                ),
                                map: PlannedRouteOptionMap(
                                    bounds: PlannedRouteOptionBounds(
                                        north: 37.8,
                                        south: 37.7,
                                        east: -122.3,
                                        west: -122.4
                                    ),
                                    overviewGeometry: PlannedRouteOptionGeometry(
                                        format: "polyline",
                                        encoding: "polyline6",
                                        precision: 1e-6,
                                        value: "test_polyline"
                                    ),
                                    legs: []
                                ),
                                overlaysPreview: PlannedRouteOptionOverlaysPreview(
                                    windSummary: "light",
                                    rainSummary: "clear",
                                    temperatureSummary: "70F",
                                    maxTemperatureF: 72.0,
                                    conditionsStatus: "good"
                                ),
                                favorites: nil,
                                enrichment: "enrichments-123"
                            ),
                        ]
                    ),
                    selectedRouteId: "opt-1"
                )
            ),
            sessionStore: SessionStore(),
            dependencies: .live,
            transcript: ChatTranscript()
        )

        let viewModel = RouteDetailsViewModel(
            chatStore: chatStore,
            convexClient: stubConvexClient
        )

        // Stub the enrichments and fingerprint to return empty/nil for this test
        stubConvexClient.sendRouteEnrichments([], routePlanId: "plan-123")
        stubConvexClient.sendRouteIndexFingerprint(nil, routeIndex: "test-fingerprint")

        // WHEN: RouteDetailsScreenContainer mounts
        let viewState = viewModel.viewState

        // THEN: LSInstrumentReadout displays "42 km", "1h 15m", "850 m", and "86"
        #expect(viewState.routeTitle == "Best Route")
        #expect(viewState.distanceKm == "42")
        #expect(viewState.durationFormatted == "1h 15m")
        #expect(viewState.elevationM == "850")
        #expect(viewState.scenicScore == "86")
    }
}
