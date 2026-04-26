//
//  PlanningMockProvider.swift
//  LaneShadow
//
//  Mock provider for Planning screen data.
//
//  Provides planning phases, navigator message, and thinking state
//  for the Planning/route-building screen.
//

import Foundation

/// Mock provider for Planning screen data.
///
/// Provides planning phases, navigator message, and thinking state
/// for the Planning/route-building screen.
public enum PlanningMockProvider: MockProvider {
    public static let variants = ["default", "empty", "overflow", "long-copy"]

    public static func value(variant: String = "default") -> PlanningScreenState {
        switch variant {
        case "empty":
            return emptyState()
        case "overflow":
            return overflowState()
        case "long-copy":
            return longCopyState()
        default:
            return defaultState()
        }
    }

    private static func defaultState() -> PlanningScreenState {
        return PlanningScreenState(
            phases: [
                PlanningPhase(id: "reading", label: "Reading your ride", status: "done"),
                PlanningPhase(id: "sketching", label: "Sketching routes", status: "active"),
                PlanningPhase(id: "validating", label: "Validating roads", status: "pending"),
                PlanningPhase(id: "weather", label: "Checking conditions", status: "pending"),
                PlanningPhase(id: "building", label: "Building your rides", status: "pending")
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
            isThinking: true
        )
    }

    private static func emptyState() -> PlanningScreenState {
        return PlanningScreenState(
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
            isThinking: false
        )
    }

    private static func overflowState() -> PlanningScreenState {
        return PlanningScreenState(
            phases: [
                PlanningPhase(id: "reading", label: "Reading your ride request", status: "done"),
                PlanningPhase(id: "analyzing", label: "Analyzing terrain", status: "done"),
                PlanningPhase(id: "sketching", label: "Sketching primary routes", status: "done"),
                PlanningPhase(id: "alternatives", label: "Finding alternatives", status: "active"),
                PlanningPhase(id: "validating", label: "Validating road conditions", status: "pending"),
                PlanningPhase(id: "weather", label: "Checking weather forecasts", status: "pending"),
                PlanningPhase(id: "traffic", label: "Analyzing traffic patterns", status: "pending"),
                PlanningPhase(id: "scenic", label: "Evaluating scenic value", status: "pending"),
                PlanningPhase(id: "building", label: "Building final routes", status: "pending"),
                PlanningPhase(id: "optimizing", label: "Optimizing for preferences", status: "pending"),
                PlanningPhase(id: "finalizing", label: "Finalizing recommendations", status: "pending")
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
            isThinking: true
        )
    }

    private static func longCopyState() -> PlanningScreenState {
        return PlanningScreenState(
            phases: [
                PlanningPhase(
                    id: "reading",
                    label: "Reading and parsing your comprehensive ride request with all specified parameters and preferences",
                    status: "done"
                ),
                PlanningPhase(
                    id: "sketching",
                    label: "Sketching preliminary route options based on topographical analysis and road network mapping",
                    status: "active"
                ),
                PlanningPhase(
                    id: "validating",
                    label: "Validating road surface conditions, closure status, and accessibility for all route segments",
                    status: "pending"
                ),
                PlanningPhase(
                    id: "weather",
                    label: "Checking microclimate weather forecasts and wind patterns for each proposed route corridor",
                    status: "pending"
                ),
                PlanningPhase(
                    id: "building",
                    label: "Building comprehensive route profiles with turn-by-turn directions and elevation profiles",
                    status: "pending"
                )
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
            isThinking: true
        )
    }
}
