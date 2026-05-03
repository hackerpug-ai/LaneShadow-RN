import Foundation

/// Mock provider for Planning screen data.
///
/// Provides planning phases, navigator message, and thinking state
/// for the Planning/route-building screen.
public enum PlanningMockProvider: MockProvider {
    public static let variants = [
        "default",
        "empty",
        "overflow",
        "long-copy",
        "v-slow",
        "v-cancel-confirm",
        "v-single-candidate",
    ]

    public static func value(variant: String = "default") -> PlanningScreenState {
        switch variant {
        case "empty":
            emptyState()
        case "overflow":
            overflowState()
        case "long-copy":
            longCopyState()
        case "v-slow":
            slowPlanningState()
        case "v-cancel-confirm":
            cancelConfirmState()
        case "v-single-candidate":
            singleCandidateState()
        default:
            defaultState()
        }
    }

    private static func defaultState() -> PlanningScreenState {
        PlanningScreenState(
            phases: [
                PlanningPhaseData(id: "parsing", label: "Parsing your request", status: "done"),
                PlanningPhaseData(id: "searching", label: "Searching routes", status: "active"),
                PlanningPhaseData(id: "drafting", label: "Drafting options", status: "pending"),
                PlanningPhaseData(id: "enriching", label: "Enriching with details", status: "pending"),
                PlanningPhaseData(id: "finalizing", label: "Finalizing your routes", status: "pending"),
            ],
            message: NavigatorMessage(
                id: "msg-001",
                sessionId: "session-001",
                body: "Looking for the best twisty roads between Santa Cruz and Big Sur...",
                timestamp: "2025-04-25T10:30:00Z",
                kind: "response",
                attachments: nil,
                detail: nil,
                pinned: false
            ),
            isThinking: true,
            showSlowApology: false,
            showCancelConfirm: false,
            showWarningChrome: false
        )
    }

    private static func emptyState() -> PlanningScreenState {
        PlanningScreenState(
            phases: [],
            message: NavigatorMessage(
                id: "msg-001",
                sessionId: "session-001",
                body: "Starting to plan your ride...",
                timestamp: "2025-04-25T10:30:00Z",
                kind: "response",
                attachments: nil,
                detail: nil,
                pinned: false
            ),
            isThinking: false,
            showSlowApology: false,
            showCancelConfirm: false,
            showWarningChrome: false
        )
    }

    private static func overflowState() -> PlanningScreenState {
        PlanningScreenState(
            phases: [
                PlanningPhaseData(id: "parsing", label: "Parsing your ride request", status: "done"),
                PlanningPhaseData(id: "searching", label: "Searching terrain", status: "done"),
                PlanningPhaseData(id: "drafting", label: "Drafting primary routes", status: "done"),
                PlanningPhaseData(id: "enriching", label: "Enriching with alternatives", status: "active"),
                PlanningPhaseData(id: "finalizing", label: "Finalizing recommendations", status: "pending"),
            ],
            message: NavigatorMessage(
                id: "msg-001",
                sessionId: "session-001",
                body: "I'm analyzing every possible route combination between Santa Cruz and Big Sur, taking into account road conditions, weather patterns, traffic forecasts, scenic value, and your personal preferences for twisty roads and coastal views. This is taking longer than usual because there are so many excellent options in this area.",
                timestamp: "2025-04-25T10:30:00Z",
                kind: "response",
                attachments: nil,
                detail: "I've found 47 potential routes so far and am evaluating each one.",
                pinned: false
            ),
            isThinking: true,
            showSlowApology: false,
            showCancelConfirm: false,
            showWarningChrome: false
        )
    }

    private static func longCopyState() -> PlanningScreenState {
        PlanningScreenState(
            phases: [
                PlanningPhaseData(
                    id: "parsing",
                    label: "Parsing and understanding your comprehensive ride request with all specified parameters and preferences",
                    status: "done"
                ),
                PlanningPhaseData(
                    id: "searching",
                    label: "Searching preliminary route options based on topographical analysis and road network mapping",
                    status: "active"
                ),
                PlanningPhaseData(
                    id: "drafting",
                    label: "Drafting road surface conditions, closure status, and accessibility for all route segments",
                    status: "pending"
                ),
                PlanningPhaseData(
                    id: "enriching",
                    label: "Enriching with microclimate weather forecasts and wind patterns for each proposed route corridor",
                    status: "pending"
                ),
                PlanningPhaseData(
                    id: "finalizing",
                    label: "Finalizing comprehensive route profiles with turn-by-turn directions and elevation profiles",
                    status: "pending"
                ),
            ],
            message: NavigatorMessage(
                id: "msg-001",
                sessionId: "session-001",
                body: "I'm currently analyzing your request for a coastal motorcycle adventure from Santa Cruz to Big Sur. I'm examining the topography of the region, identifying the most scenic and technically engaging roads, checking current road conditions and closures, analyzing weather patterns along different route corridors, and evaluating traffic patterns for various departure times. This comprehensive analysis ensures I can provide you with the absolute best routing options for your ride today.",
                timestamp: "2025-04-25T10:30:00Z",
                kind: "response",
                attachments: nil,
                detail: "I'm particularly focused on finding routes with optimal corner sequences and scenic overlooks while avoiding any construction or road maintenance areas.",
                pinned: false
            ),
            isThinking: true,
            showSlowApology: false,
            showCancelConfirm: false,
            showWarningChrome: false
        )
    }

    // MARK: - V01: Slow Planning

    private static func slowPlanningState() -> PlanningScreenState {
        PlanningScreenState(
            phases: [
                PlanningPhaseData(id: "parsing", label: "Parsing your request", status: "done"),
                PlanningPhaseData(id: "searching", label: "Searching routes", status: "active"),
                PlanningPhaseData(id: "drafting", label: "Drafting options", status: "pending"),
                PlanningPhaseData(id: "enriching", label: "Enriching with details", status: "pending"),
                PlanningPhaseData(id: "finalizing", label: "Finalizing your routes", status: "pending"),
            ],
            message: NavigatorMessage(
                id: "msg-001",
                sessionId: "session-001",
                body: "Looking for the best twisty roads between Santa Cruz and Big Sur...",
                timestamp: "2025-04-25T10:30:00Z",
                kind: "response",
                attachments: nil,
                detail: "Still scouting… this area is surprisingly complex.",
                pinned: false
            ),
            isThinking: true,
            showSlowApology: true, // V01: Show slow apology
            showCancelConfirm: false,
            showWarningChrome: false
        )
    }

    // MARK: - V02: Cancel Confirm

    private static func cancelConfirmState() -> PlanningScreenState {
        PlanningScreenState(
            phases: [
                PlanningPhaseData(id: "parsing", label: "Parsing your request", status: "done"),
                PlanningPhaseData(id: "searching", label: "Searching routes", status: "active"),
                PlanningPhaseData(id: "drafting", label: "Drafting options", status: "pending"),
                PlanningPhaseData(id: "enriching", label: "Enriching with details", status: "pending"),
                PlanningPhaseData(id: "finalizing", label: "Finalizing your routes", status: "pending"),
            ],
            message: NavigatorMessage(
                id: "msg-001",
                sessionId: "session-001",
                body: "Looking for the best twisty roads between Santa Cruz and Big Sur...",
                timestamp: "2025-04-25T10:30:00Z",
                kind: "response",
                attachments: nil,
                detail: nil,
                pinned: false
            ),
            isThinking: true,
            showSlowApology: false,
            showCancelConfirm: true, // V02: Show cancel confirm
            showWarningChrome: false
        )
    }

    // MARK: - V03: Single Candidate

    private static func singleCandidateState() -> PlanningScreenState {
        PlanningScreenState(
            phases: [
                PlanningPhaseData(id: "parsing", label: "Parsing your request", status: "done"),
                PlanningPhaseData(id: "searching", label: "Searching routes", status: "done"),
                PlanningPhaseData(id: "drafting", label: "Drafting options", status: "active"),
                PlanningPhaseData(id: "enriching", label: "Enriching with details", status: "pending"),
                PlanningPhaseData(id: "finalizing", label: "Finalizing your routes", status: "pending"),
            ],
            message: NavigatorMessage(
                id: "msg-001",
                sessionId: "session-001",
                body: "Found one solid option that matches your constraints.",
                timestamp: "2025-04-25T10:30:00Z",
                kind: "response",
                attachments: nil,
                detail: "Only one candidate meets your criteria — the coastal route via Hwy 1.",
                pinned: false
            ),
            isThinking: true,
            showSlowApology: false,
            showCancelConfirm: false,
            showWarningChrome: true // V03: Show warning chrome
        )
    }
}
