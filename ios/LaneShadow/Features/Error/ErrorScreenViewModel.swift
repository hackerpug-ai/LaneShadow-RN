import Foundation
import Observation

struct ErrorScreenLiveState: Equatable {
    let body: String
    let detail: String?
    let suggestions: [MockSuggestionChip]
    let isRecovered: Bool
    let chatPlaceholder: String
    let isChatEnabled: Bool
}

@MainActor
@Observable
final class ErrorScreenViewModel {
    let error: LaneShadowError

    @ObservationIgnored private let chatStore: ChatStore
    @ObservationIgnored
    private let appState: AppState

    init(
        error: LaneShadowError,
        chatStore: ChatStore,
        appState: AppState
    ) {
        self.error = error
        self.chatStore = chatStore
        self.appState = appState
    }

    var bodyText: String {
        error.bodyText
    }

    var detailText: String? {
        error.detailText
    }

    var suggestionLabels: [String] {
        suggestionChips.map(\.label)
    }

    var suggestionChips: [MockSuggestionChip] {
        var chips: [MockSuggestionChip] = []
        if showsRetryChip {
            chips.append(MockSuggestionChip(id: "try-again", label: "Try again"))
        }
        if showsStartOverChip {
            chips.append(MockSuggestionChip(id: "start-over", label: "Start over"))
        }
        return chips
    }

    var showsRetryChip: Bool {
        error.allowsRetry
    }

    var showsStartOverChip: Bool {
        true
    }

    var isChatEnabled: Bool {
        switch error {
        case .rateLimitExceeded,
             .planLimitExceeded,
             .unauthenticated:
            false
        default:
            true
        }
    }

    var chatPlaceholder: String {
        if isChatEnabled {
            return "Try again or tell me what to change…"
        }

        return "Start over to plan a new ride…"
    }

    var liveState: ErrorScreenLiveState {
        ErrorScreenLiveState(
            body: bodyText,
            detail: detailText,
            suggestions: suggestionChips,
            isRecovered: false,
            chatPlaceholder: chatPlaceholder,
            isChatEnabled: isChatEnabled
        )
    }

    func handleSuggestionTap(_ chip: MockSuggestionChip) {
        switch chip.label {
        case "Try again":
            handleTryAgain()
        case "Start over":
            handleStartOver()
        default:
            handleSend(chip.label)
        }
    }

    func handleTryAgain() {
        guard showsRetryChip,
              let retryPayload = appState.cachedLastFailedInput?.trimmingCharacters(in: .whitespacesAndNewlines),
              !retryPayload.isEmpty
        else {
            return
        }

        chatStore.dispatch(.sendMessage(retryPayload))
    }

    func handleStartOver() {
        appState.cachedLastFailedInput = nil
        appState.appRoute = .home
        chatStore.dispatch(.newSession)
    }

    func handleSend(_ message: String) {
        guard isChatEnabled else {
            return
        }

        let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return
        }

        appState.cachedLastFailedInput = trimmed
        chatStore.dispatch(.sendMessage(trimmed))
    }
}
