import Foundation

enum PlanningPhase: String, CaseIterable, Codable, Sendable {
    case parsing
    case searching
    case drafting
    case enriching
    case finalizing

    var stepLabel: String {
        switch self {
        case .parsing:
            "Parsing"
        case .searching:
            "Searching"
        case .drafting:
            "Drafting"
        case .enriching:
            "Enriching"
        case .finalizing:
            "Finalizing"
        }
    }

    var capsuleHeadline: String {
        switch self {
        case .parsing:
            "Reading your prompt..."
        case .searching:
            "Searching available roads..."
        case .drafting:
            "Drafting candidates..."
        case .enriching:
            "Checking conditions..."
        case .finalizing:
            "Picking the best..."
        }
    }

    func indicatorState(activePhase: PlanningPhase) -> PhaseState {
        if sortIndex < activePhase.sortIndex {
            return .done
        }
        if self == activePhase {
            return .active
        }
        return .pending
    }

    static func indicatorSteps(activePhase: PlanningPhase) -> [LSPhaseIndicator.Phase] {
        allCases.map { phase in
            LSPhaseIndicator.Phase(
                id: phase.rawValue,
                label: phase.stepLabel,
                state: phase.indicatorState(activePhase: activePhase)
            )
        }
    }

    static func latest(in messages: [LaneShadowSessionMessage]) -> PlanningPhase {
        for message in messages.reversed() {
            if let phase = derive(from: message) {
                return phase
            }
        }
        return .parsing
    }

    static func derive(from message: LaneShadowSessionMessage) -> PlanningPhase? {
        guard message.kind == "planning" else {
            return nil
        }

        if message.status == "complete" {
            return .finalizing
        }

        if let thinkingStepPhase = deriveFromThinkingSteps(message.thinkingSteps) {
            return thinkingStepPhase
        }

        if let contentPhase = deriveFromPlanningContent(message.content) {
            return contentPhase
        }

        if let persistedPhase = message.phase {
            return persistedPhase
        }

        if message.status == "streaming" || message.status == "running" || message.status == nil {
            return .parsing
        }

        return nil
    }

    private var sortIndex: Int {
        Self.allCases.firstIndex(of: self) ?? 0
    }

    private static func deriveFromThinkingSteps(
        _ thinkingSteps: [LaneShadowThinkingStepSnapshot]?
    ) -> PlanningPhase? {
        var lastKnownPhase: PlanningPhase?

        for step in thinkingSteps ?? [] {
            if step.type == "tool_finish", step.toolName == "routing_agent" {
                lastKnownPhase = .finalizing
                continue
            }

            if let nextPhase = deriveFromToolName(step.toolName) {
                lastKnownPhase = nextPhase
            }
        }

        return lastKnownPhase
    }

    private static func deriveFromPlanningContent(_ content: String) -> PlanningPhase? {
        guard let data = content.data(using: .utf8),
              let payload = try? JSONDecoder().decode(PlanningEventPayload.self, from: data) else {
            return nil
        }

        var lastKnownPhase: PlanningPhase?

        for event in payload.events ?? [] {
            if event.type == "agent_complete" {
                lastKnownPhase = .finalizing
                continue
            }

            if let nextPhase = deriveFromToolName(event.tool) {
                lastKnownPhase = nextPhase
            }
        }

        return lastKnownPhase
    }

    private static func deriveFromToolName(_ toolName: String?) -> PlanningPhase? {
        guard let toolName else {
            return nil
        }

        if searchingToolNames.contains(toolName) {
            return .searching
        }
        if draftingToolNames.contains(toolName) {
            return .drafting
        }
        if enrichingToolNames.contains(toolName) {
            return .enriching
        }
        return nil
    }

    private static let searchingToolNames: Set<String> = ["geocode", "search_agent", "webSearch"]
    private static let draftingToolNames: Set<String> = [
        "createRouteSketch",
        "compileSketch",
        "planRoute",
        "routing_agent"
    ]
    private static let enrichingToolNames: Set<String> = [
        "searchNearby",
        "fetchWeather",
        "webSearchResults",
        "enrichment_agent"
    ]
}

private struct PlanningEventPayload: Decodable {
    let events: [PlanningEvent]?
}

private struct PlanningEvent: Decodable {
    let type: String?
    let tool: String?
}
