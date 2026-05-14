import Foundation

struct PlanningScreenLiveState {
    var messages: [LSChatMessage]
    var phases: [LSPhaseIndicator.Phase]
    var errorMessage: String?
    var isThinking: Bool
    var isSending: Bool
    var shouldRenderMap: Bool
    var capsuleHeadline: String = "Reading your prompt..."
}
