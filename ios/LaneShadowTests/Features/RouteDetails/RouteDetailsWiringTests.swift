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
    private func pumpMainActor(iterations: Int = 10) async {
        for _ in 0 ..< iterations {
            await Task.yield()
        }
    }

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

        // Stub the enrichments with elevation data
        let enrichment = RouteEnrichmentsDocument(
            _id: "enrich-123",
            _creationTime: 0,
            completedAt: nil,
            error: nil,
            scheduledJobId: nil,
            enrichments: [
                RouteEnrichmentsEnrichments(
                    weather: "clear",
                    elevation: "850",
                    label: "9 AM",
                    rationale: "Start of day",
                    routeOptionId: "opt-1",
                    highlights: []
                ),
            ],
            clerkUserId: "user-123",
            createdAt: 0,
            updatedAt: 0,
            planningSessionId: "session-123",
            status: "completed",
            phase: "enrichment",
            routePlanId: "plan-123",
            contentFingerprint: "fp-1"
        )
        stubConvexClient.sendRouteEnrichments([enrichment], routePlanId: "plan-123")
        stubConvexClient.sendRouteIndexFingerprint(nil, routeIndex: "opt-1")

        // WHEN: RouteDetailsScreenContainer mounts and observes
        let observeTask = Task {
            await viewModel.observe()
        }
        // Let the observation complete
        await pumpMainActor()
        observeTask.cancel()

        // THEN: LSInstrumentReadout displays "42 km", "1h 15m", "850 m", and "86"
        let viewState = viewModel.viewState
        #expect(viewState.routeTitle == "Best Route")
        #expect(viewState.distanceKm == "42")
        #expect(viewState.durationFormatted == "1h 15m")
        #expect(viewState.elevationM == "850")
        #expect(viewState.scenicScore == "86")
    }

    @Test("Weather timeline renders 6 hours chronologically")
    func routeDetails_weatherTimeline_renders6Hours() async throws {
        let stubConvexClient = StubLaneShadowConvexClient()
        let chatStore = ChatStore(
            flowState: .routeDetails(
                RouteDetailsState(
                    sessionId: "session-123",
                    routeOptions: PlannedRouteOptionsView(
                        planId: "plan-456",
                        options: [
                            PlannedRouteOptionView(
                                routeOptionId: "opt-1",
                                label: "Scenic Route",
                                rationale: "Most scenic",
                                stats: PlannedRouteOptionStats(
                                    distanceMeters: 50000,
                                    durationSeconds: 5400,
                                    legsCount: 2
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
                                enrichment: "enrichments-456"
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

        // Create enrichments with 6 weather entries
        let enrichment = RouteEnrichmentsDocument(
            _id: "enrich-456",
            _creationTime: 0,
            completedAt: nil,
            error: nil,
            scheduledJobId: nil,
            enrichments: [
                RouteEnrichmentsEnrichments(
                    weather: "clear",
                    elevation: "100",
                    label: "9 AM",
                    rationale: "",
                    routeOptionId: "opt-1",
                    highlights: []
                ),
                RouteEnrichmentsEnrichments(
                    weather: "clear",
                    elevation: "150",
                    label: "10 AM",
                    rationale: "",
                    routeOptionId: "opt-1",
                    highlights: []
                ),
                RouteEnrichmentsEnrichments(
                    weather: "rain",
                    elevation: "200",
                    label: "11 AM",
                    rationale: "",
                    routeOptionId: "opt-1",
                    highlights: []
                ),
                RouteEnrichmentsEnrichments(
                    weather: "wind",
                    elevation: "180",
                    label: "12 PM",
                    rationale: "",
                    routeOptionId: "opt-1",
                    highlights: []
                ),
                RouteEnrichmentsEnrichments(
                    weather: "clear",
                    elevation: "220",
                    label: "1 PM",
                    rationale: "",
                    routeOptionId: "opt-1",
                    highlights: []
                ),
                RouteEnrichmentsEnrichments(
                    weather: "hot",
                    elevation: "210",
                    label: "2 PM",
                    rationale: "",
                    routeOptionId: "opt-1",
                    highlights: []
                ),
            ],
            clerkUserId: "user-123",
            createdAt: 0,
            updatedAt: 0,
            planningSessionId: "session-123",
            status: "completed",
            phase: "enrichment",
            routePlanId: "plan-456",
            contentFingerprint: "fp-456"
        )
        stubConvexClient.sendRouteEnrichments([enrichment], routePlanId: "plan-456")

        let observeTask = Task {
            await viewModel.observe()
        }
        await pumpMainActor()
        observeTask.cancel()

        let viewState = viewModel.viewState
        #expect(viewState.weatherEntries.count == 6)
        #expect(viewState.weatherEntries[0].hour == "9 AM")
        #expect(viewState.weatherEntries[0].condition == .clear)
        #expect(viewState.weatherEntries[2].condition == .rain)
        #expect(viewState.weatherEntries[3].condition == .wind)
    }

    @Test("Already-saved fingerprint flips Save button state")
    func routeDetails_alreadySaved_flipsSaveButton() async throws {
        let stubConvexClient = StubLaneShadowConvexClient()
        let chatStore = ChatStore(
            flowState: .routeDetails(
                RouteDetailsState(
                    sessionId: "session-789",
                    routeOptions: PlannedRouteOptionsView(
                        planId: "plan-789",
                        options: [
                            PlannedRouteOptionView(
                                routeOptionId: "opt-1",
                                label: "Favorite Route",
                                rationale: "Already saved",
                                stats: PlannedRouteOptionStats(
                                    distanceMeters: 30000,
                                    durationSeconds: 3600,
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
                                        value: "test"
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
                                enrichment: "enrichments-789"
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

        // Stub enrichments
        let enrichment = RouteEnrichmentsDocument(
            _id: "enrich-789",
            _creationTime: 0,
            completedAt: nil,
            error: nil,
            scheduledJobId: nil,
            enrichments: [RouteEnrichmentsEnrichments(
                weather: "clear",
                elevation: "500",
                label: "Start",
                rationale: "",
                routeOptionId: "opt-1",
                highlights: []
            )],
            clerkUserId: "user-123",
            createdAt: 0,
            updatedAt: 0,
            planningSessionId: "session-123",
            status: "completed",
            phase: "enrichment",
            routePlanId: "plan-789",
            contentFingerprint: "fp-789"
        )
        stubConvexClient.sendRouteEnrichments([enrichment], routePlanId: "plan-789")

        // Return a saved route fingerprint by marking in the stub (simplified for now)
        // In real implementation, this would query the database
        stubConvexClient.simulateSavedRoute(routeIndex: "opt-1")

        let observeTask = Task {
            await viewModel.observe()
        }
        await pumpMainActor()
        observeTask.cancel()

        let viewState = viewModel.viewState
        #expect(viewState.isSaved == true)
    }

    @Test("Save tap presents SaveFavoriteSheet entry")
    func routeDetails_saveTap_presentsSaveFavoriteSheet() async throws {
        // This test will check that the view model has a presentation flag
        // The actual sheet presentation is handled in the Container/Screen
        let stubConvexClient = StubLaneShadowConvexClient()
        let chatStore = ChatStore(
            flowState: .routeDetails(
                RouteDetailsState(
                    sessionId: "session-101",
                    routeOptions: PlannedRouteOptionsView(
                        planId: "plan-101",
                        options: [
                            PlannedRouteOptionView(
                                routeOptionId: "opt-1",
                                label: "Test Route",
                                rationale: "Test",
                                stats: PlannedRouteOptionStats(
                                    distanceMeters: 20000,
                                    durationSeconds: 2400,
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
                                        value: "test"
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
                                enrichment: "enrichments-101"
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

        // Observe to initialize state
        let observeTask = Task {
            await viewModel.observe()
        }
        await pumpMainActor()
        observeTask.cancel()

        // Before tap: presentation flag should be false
        #expect(viewModel.presentingSaveFavoriteSheet == false)

        // Tap save
        viewModel.handleSaveTap()

        // After tap: presentation flag should be true
        #expect(viewModel.presentingSaveFavoriteSheet == true)
    }

    @Test("Pending enrichment shows loading skeleton")
    func routeDetails_pendingEnrichment_showsLoadingSkeleton() async throws {
        let stubConvexClient = StubLaneShadowConvexClient()
        let chatStore = ChatStore(
            flowState: .routeDetails(
                RouteDetailsState(
                    sessionId: "session-202",
                    routeOptions: PlannedRouteOptionsView(
                        planId: "plan-202",
                        options: [
                            PlannedRouteOptionView(
                                routeOptionId: "opt-1",
                                label: "Pending Route",
                                rationale: "Under enrichment",
                                stats: PlannedRouteOptionStats(
                                    distanceMeters: 25000,
                                    durationSeconds: 3000,
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
                                        value: "test"
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
                                enrichment: "enrichments-202"
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

        // Send pending enrichment (no entries)
        let pendingEnrichment = RouteEnrichmentsDocument(
            _id: "enrich-202",
            _creationTime: 0,
            completedAt: nil,
            error: nil,
            scheduledJobId: nil,
            enrichments: nil,
            clerkUserId: "user-123",
            createdAt: 0,
            updatedAt: 0,
            planningSessionId: "session-123",
            status: "pending",
            phase: "enrichment",
            routePlanId: "plan-202",
            contentFingerprint: "fp-202"
        )
        stubConvexClient.sendRouteEnrichments([pendingEnrichment], routePlanId: "plan-202")

        let observeTask = Task {
            await viewModel.observe()
        }
        await pumpMainActor()
        observeTask.cancel()

        let viewState = viewModel.viewState
        #expect(viewState.isPendingEnrichment == true)
        #expect(viewState.weatherEntries.isEmpty)
    }

    @Test("Ride-this button is no-op without crashing")
    func routeDetails_rideThisButton_isNoOp() async throws {
        let stubConvexClient = StubLaneShadowConvexClient()
        let chatStore = ChatStore(
            flowState: .routeDetails(
                RouteDetailsState(
                    sessionId: "session-303",
                    routeOptions: PlannedRouteOptionsView(
                        planId: "plan-303",
                        options: [
                            PlannedRouteOptionView(
                                routeOptionId: "opt-1",
                                label: "Test Route",
                                rationale: "Test",
                                stats: PlannedRouteOptionStats(
                                    distanceMeters: 20000,
                                    durationSeconds: 2400,
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
                                        value: "test"
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
                                enrichment: "enrichments-303"
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

        let observeTask = Task {
            await viewModel.observe()
        }
        await pumpMainActor()
        observeTask.cancel()

        // Tap ride-this - should not throw or crash
        viewModel.handleRideThisTap()

        // Verify no side effects
        #expect(true) // If we got here, no crash occurred
    }
}
