//
//  ErrorMockProvider.swift
//  LaneShadow
//
//  Mock provider for Error screen data.
//
//  Provides navigator error and recovery suggestions
//  for the Error/recovery screen.
//

import Foundation

/// Mock provider for Error screen data.
///
/// Provides navigator error and recovery suggestions
/// for the Error/recovery screen.
public enum ErrorMockProvider: MockProvider {
    public static let variants = ["default", "empty", "overflow", "long-copy"]

    public static func value(variant: String = "default") -> ErrorScreenState {
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

    private static func defaultState() -> ErrorScreenState {
        return ErrorScreenState(
            error: NavigatorError(
                title: "THE NAVIGATOR",
                body: "Couldn't stitch that one together — the segment through Lucia looked broken.",
                detail: "Try a different end point, or let me route you inland via Carmel Valley Rd instead?"
            ),
            suggestions: [
                MockSuggestionChip(id: "chip-001", label: "Try inland"),
                MockSuggestionChip(id: "chip-002", label: "End at Big Sur")
            ]
        )
    }

    private static func emptyState() -> ErrorScreenState {
        return ErrorScreenState(
            error: NavigatorError(
                title: "THE NAVIGATOR",
                body: "An error occurred.",
                detail: nil
            ),
            suggestions: []
        )
    }

    private static func overflowState() -> ErrorScreenState {
        return ErrorScreenState(
            error: NavigatorError(
                title: "THE NAVIGATOR",
                body: "Multiple routing errors detected. Several road segments appear to be closed or inaccessible.",
                detail: "I found 5 alternative approaches. You can also try adjusting your route parameters."
            ),
            suggestions: [
                MockSuggestionChip(id: "chip-001", label: "Try inland"),
                MockSuggestionChip(id: "chip-002", label: "End at Big Sur"),
                MockSuggestionChip(id: "chip-003", label: "Use Highway 1"),
                MockSuggestionChip(id: "chip-004", label: "Go around"),
                MockSuggestionChip(id: "chip-005", label: "Start earlier"),
                MockSuggestionChip(id: "chip-006", label: "Shorter route"),
                MockSuggestionChip(id: "chip-007", label: "Easier roads"),
                MockSuggestionChip(id: "chip-008", label: "Skip climbs"),
                MockSuggestionChip(id: "chip-009", label: "Add stops"),
                MockSuggestionChip(id: "chip-010", label: "Change time"),
                MockSuggestionChip(id: "chip-011", label: "Different day"),
                MockSuggestionChip(id: "chip-012", label: "Start over")
            ]
        )
    }

    private static func longCopyState() -> ErrorScreenState {
        return ErrorScreenState(
            error: NavigatorError(
                title: "THE NAVIGATOR",
                body: "I encountered a significant routing problem while attempting to construct your requested route. The specific issue is that the road segment through the town of Lucia appears to be either closed for maintenance or permanently inaccessible, which prevents me from creating a continuous route through that section of the coastline. This is a known bottleneck on Highway 1 that frequently causes routing disruptions.",
                detail: "I have identified several alternative approaches that might work for you. The most reliable option would be to route inland via Carmel Valley Road, which will take you through beautiful wine country and rejoin the coast further south. Alternatively, you could consider ending your ride at Big Sur or starting from a different point north of the closure."
            ),
            suggestions: [
                MockSuggestionChip(
                    id: "chip-001",
                    label: "Try inland via Carmel Valley Road through wine country"
                ),
                MockSuggestionChip(
                    id: "chip-002",
                    label: "End at Big Sur with dinner at the famous restaurant"
                ),
                MockSuggestionChip(
                    id: "chip-003",
                    label: "Start from north of the closure at Point Sur"
                )
            ]
        )
    }
}
