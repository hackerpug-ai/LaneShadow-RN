import Foundation

/// Discriminated union for MapApp unified screen states.
/// Each state represents a distinct composition of overlays and data sources.
@MainActor
enum MapAppState: Equatable {
    /// Idle state: map with idle-specific overlays (LSTopBar with capsule, LSChatInput in idle config)
    case idle

    /// Planning state: map with planning-specific overlays (planning UI, phase indicators, chat in planning mode)
    /// - Parameter sessionId: The session ID for the planning session
    case planning(sessionId: String)

    /// Route results state: map with route results overlays (placeholder for Sprint 09)
    /// - Parameters:
    ///   - sessionId: The session ID
    ///   - routePlanId: The route plan ID
    case routeResults(sessionId: String, routePlanId: String)
}
