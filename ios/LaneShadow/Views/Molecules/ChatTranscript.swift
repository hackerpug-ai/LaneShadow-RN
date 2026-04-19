import LaneShadowTheme
import SwiftUI

// MARK: - Chat Message Role

/**
 * Chat message role enum
 *
 * Distinguishes between messages sent by the rider (user) and the agent (assistant).
 */
public enum LSChatMessageRole: String, Sendable {
    case rider
    case agent
}

// MARK: - Chat Message Status

/**
 * Chat message status enum
 *
 * Represents the lifecycle state of a message — useful for streaming indicators.
 */
public enum LSChatMessageStatus: String, Sendable {
    case streaming
    case running
    case complete
    case failed
}

// MARK: - Chat Message Kind

/**
 * Chat message kind enum
 *
 * Defines the type of content for card rendering.
 */
public enum LSChatMessageKind: String, Sendable {
    case text
    case routing_card
    case weather_card
    case saved_route_card
    case reasoning
    case thinking_card
    case planning
    case location_search_card
}

// MARK: - Weather Badge Type

/**
 * Weather badge type enum
 */
public enum LSWeatherBadgeType: String, Sendable {
    case clear
    case rain
    case wind
    case cloudy
}

// MARK: - Weather Badge

/**
 * Weather badge model
 */
public struct LSWeatherBadge: Sendable {
    public let type: LSWeatherBadgeType
    public let text: String

    public init(type: LSWeatherBadgeType, text: String) {
        self.type = type
        self.text = text
    }
}

// MARK: - Route Attachment

/**
 * Route attachment model
 */
public struct LSRouteAttachment: Sendable {
    public let id: String
    public let label: String
    public let description: String
    public let distance: String
    public let duration: String
    public let scenicScore: Double
    public let weatherBadge: LSWeatherBadge?
    public let isBest: Bool

    public init(
        id: String,
        label: String,
        description: String,
        distance: String,
        duration: String,
        scenicScore: Double,
        weatherBadge: LSWeatherBadge? = nil,
        isBest: Bool = false
    ) {
        self.id = id
        self.label = label
        self.description = description
        self.distance = distance
        self.duration = duration
        self.scenicScore = scenicScore
        self.weatherBadge = weatherBadge
        self.isBest = isBest
    }
}

// MARK: - Card Attachment

/**
 * Card attachment base class
 */
public protocol LSCardAttachment: Sendable {
    var id: String { get }
    var type: String { get }
}

// MARK: - Thinking Step Type

/**
 * Thinking step type enum
 */
public enum LSThinkingStepType: String, Sendable {
    case thinking
    case tool_start
    case tool_finish
}

// MARK: - Thinking Step

/**
 * Thinking step model
 */
public struct LSThinkingStep: Sendable {
    public let type: LSThinkingStepType
    public let toolName: String?
    public let summary: String
    public let detail: String?
    public let timestamp: TimeInterval

    public init(
        type: LSThinkingStepType,
        toolName: String? = nil,
        summary: String,
        detail: String? = nil,
        timestamp: TimeInterval
    ) {
        self.type = type
        self.toolName = toolName
        self.summary = summary
        self.detail = detail
        self.timestamp = timestamp
    }
}

// MARK: - Chat Message Model

/**
 * Chat message data model
 *
 * Represents a single message in the conversation transcript.
 * Conforms to Identifiable for use in SwiftUI lists and ForEach.
 */
public struct LSChatMessage: Identifiable, Sendable {
    public let id: String
    public let role: LSChatMessageRole
    public let content: String
    public let timestamp: Date
    public let status: LSChatMessageStatus
    public let kind: LSChatMessageKind?
    public let routeAttachments: [LSRouteAttachment]?
    public let attachments: [any LSCardAttachment]?
    public let thinkingSteps: [LSThinkingStep]?

    public init(
        id: String,
        role: LSChatMessageRole,
        content: String,
        timestamp: Date,
        status: LSChatMessageStatus = .complete,
        kind: LSChatMessageKind? = nil,
        routeAttachments: [LSRouteAttachment]? = nil,
        attachments: [any LSCardAttachment]? = nil,
        thinkingSteps: [LSThinkingStep]? = nil
    ) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
        self.status = status
        self.kind = kind
        self.routeAttachments = routeAttachments
        self.attachments = attachments
        self.thinkingSteps = thinkingSteps
    }
}

// MARK: - Chat Transcript Component

/**
 * Chat transcript molecule component
 *
 * Displays a conversation as a series of right-aligned rider bubbles and
 * left-aligned agent messages, mirroring the ChatGPT/Claude conversation pattern.
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Rider bubble background: `theme.colors.primary.default`
 *   - Rider text: `theme.colors.onPrimary.default`
 *   - Agent text: `theme.colors.onSurface.default`
 *   - Timestamp text: `theme.colors.onSurface.subtle`
 * - Layout:
 *   - Message spacing: 12pt gaps between messages
 *   - Bubble padding: 8pt internal padding
 *   - Corner radius: 16pt for message bubbles (4pt for bottom-right of rider bubbles)
 * - Typography:
 *   - Message text: body.md (14pt)
 *   - Timestamp text: label.sm (12pt)
 *
 * ## Behavior
 * - Rider messages: right-aligned speech bubble with primary color background
 * - Agent messages: left-aligned, no bubble — plain text
 * - Timestamps: shown on first message or when >5min gap since previous message
 * - Auto-scrolls to bottom when messages are added
 *
 * ## Parameters
 * - messages: Array of chat messages to display
 * - isTyping: Whether to show a typing indicator at the bottom (default: false)
 */
public struct LSChatTranscript: View {
    @Environment(\.theme) private var theme

    private let messages: [LSChatMessage]
    private let isTyping: Bool

    public init(
        messages: [LSChatMessage],
        isTyping: Bool = false
    ) {
        self.messages = messages
        self.isTyping = isTyping
    }

    // MARK: - Body

    public var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: theme.space.md) {
                    if messages.isEmpty {
                        emptyState
                    } else {
                        ForEach(messages) { message in
                            messageRow(for: message)
                        }

                        if isTyping {
                            typingIndicatorRow
                        }
                    }
                }
                .padding(theme.space.md)
            }
            .background(theme.colors.background.default)
            .onChange(of: messages.count) { _, _ in
                scrollToBottom(proxy: proxy)
            }
            .onAppear {
                scrollToBottom(proxy: proxy)
            }
        }
    }

    // MARK: - Message Row

    private func messageRow(for message: LSChatMessage) -> some View {
        VStack(alignment: message.role == .rider ? .trailing : .leading, spacing: 4) {
            // Timestamp divider (shown conditionally)
            if let index = messages.firstIndex(where: { $0.id == message.id }),
               shouldShowTimestamp(for: message, at: index)
            {
                timestampDivider(for: message)
            }

            // Message bubble or text
            switch message.role {
            case .rider:
                riderBubble(for: message)
            case .agent:
                agentMessage(for: message)
            }
        }
    }

    // MARK: - Rider Bubble

    private func riderBubble(for message: LSChatMessage) -> some View {
        HStack {
            Spacer()

            Text(message.content)
                .font(theme.type.body.md.font)
                .foregroundStyle(theme.colors.onPrimary.default)
                .padding(theme.space.sm)
                .background(
                    RoundedRectangle(cornerRadius: theme.radius.xl)
                        .fill(theme.colors.primary.default)
                )
                .clipShape(RoundedRectangle(cornerRadius: theme.radius.xl))
                .overlay(
                    RoundedRectangle(cornerRadius: theme.radius.xl)
                        .fill(theme.colors.primary.default)
                        .frame(width: theme.radius.sm, height: theme.radius.sm),
                    alignment: .bottomTrailing
                )
        }
    }

    // MARK: - Agent Message

    private func agentMessage(for message: LSChatMessage) -> some View {
        HStack(alignment: .top, spacing: theme.space.xs) {
            // Small icon placeholder
            Image(systemName: "circle.fill")
                .font(.system(size: 8))
                .foregroundStyle(theme.colors.onSurface.subtle)

            Text(message.content)
                .font(theme.type.body.md.font)
                .foregroundStyle(theme.colors.onSurface.default)

            // Typing indicator for streaming messages
            if message.status == .streaming {
                LSTypingIndicator(size: .small)
            }

            Spacer()
        }
    }

    // MARK: - Timestamp Divider

    private func timestampDivider(for message: LSChatMessage) -> some View {
        Text(formatTimestamp(message.timestamp))
            .font(theme.type.label.sm.font)
            .foregroundStyle(theme.colors.onSurface.subtle)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, 4)
    }

    // MARK: - Typing Indicator Row

    private var typingIndicatorRow: some View {
        HStack(alignment: .top, spacing: theme.space.xs) {
            Image(systemName: "circle.fill")
                .font(.system(size: 8))
                .foregroundStyle(theme.colors.onSurface.subtle)

            LSTypingIndicator(size: .small)

            Spacer()
        }
        .padding(.vertical, 4)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: theme.space.md) {
            Image(systemName: "chat.bubble")
                .font(.system(size: 40))
                .foregroundStyle(theme.colors.onSurface.subtle)

            Text("Start a conversation")
                .font(theme.type.body.md.font)
                .foregroundStyle(theme.colors.onSurface.subtle)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(32)
    }

    // MARK: - Helpers

    private func shouldShowTimestamp(for message: LSChatMessage, at index: Int) -> Bool {
        // Always show timestamp on first message
        guard index > 0 else { return true }

        let previous = messages[index - 1]
        let current = message.timestamp
        let previousTime = previous.timestamp

        // Show timestamp if more than 5 minutes have passed
        let gap = current.timeIntervalSince(previousTime)
        return gap > 5 * 60
    }

    private func formatTimestamp(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: date)
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        guard !messages.isEmpty else { return }

        // Use a slight delay to ensure layout is complete
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.easeInOut(duration: 0.3)) {
                proxy.scrollTo(messages.last?.id, anchor: .bottom)
            }
        }
    }
}

// MARK: - Preview

#Preview("ChatTranscript - Empty") {
    LSChatTranscript(messages: [])
        .laneShadowTheme()
}

#Preview("ChatTranscript - Single Message") {
    LSChatTranscript(messages: [
        LSChatMessage(
            id: "1",
            role: .rider,
            content: "Hello, I need help finding a route",
            timestamp: Date(),
            status: .complete
        ),
    ])
    .laneShadowTheme()
}

#Preview("ChatTranscript - Conversation") {
    let now = Date()
    let messages = [
        LSChatMessage(
            id: "1",
            role: .rider,
            content: "Find me a scenic route along the coast",
            timestamp: now.addingTimeInterval(-600),
            status: .complete
        ),
        LSChatMessage(
            id: "2",
            role: .agent,
            content: "I found a beautiful coastal route for you!",
            timestamp: now.addingTimeInterval(-540),
            status: .complete
        ),
        LSChatMessage(
            id: "3",
            role: .rider,
            content: "How long is the ride?",
            timestamp: now.addingTimeInterval(-300),
            status: .complete
        ),
        LSChatMessage(
            id: "4",
            role: .agent,
            content: "The route is approximately 45 miles and takes about 2 hours to complete.",
            timestamp: now,
            status: .streaming
        ),
    ]

    return LSChatTranscript(messages: messages, isTyping: false)
        .laneShadowTheme()
}

#Preview("ChatTranscript - With Typing Indicator") {
    let messages = [
        LSChatMessage(
            id: "1",
            role: .rider,
            content: "What's the weather like on this route?",
            timestamp: Date(),
            status: .complete
        ),
    ]

    return LSChatTranscript(messages: messages, isTyping: true)
        .laneShadowTheme()
}

#Preview("ChatTranscript - Timestamp Gaps") {
    let now = Date()
    let messages = [
        LSChatMessage(
            id: "1",
            role: .rider,
            content: "Morning ride?",
            timestamp: now.addingTimeInterval(-3600), // 1 hour ago
            status: .complete
        ),
        LSChatMessage(
            id: "2",
            role: .agent,
            content: "Perfect weather for it!",
            timestamp: now.addingTimeInterval(-3540),
            status: .complete
        ),
        LSChatMessage(
            id: "3",
            role: .rider,
            content: "Any good routes nearby?",
            timestamp: Date(), // Now - more than 5 min gap
            status: .complete
        ),
    ]

    return LSChatTranscript(messages: messages)
        .laneShadowTheme()
}

#Preview("ChatTranscript - Long Messages") {
    let messages = [
        LSChatMessage(
            id: "1",
            role: .rider,
            content: "I'm planning a weekend trip and would love to find some scenic routes that pass through interesting small towns with good coffee shops and maybe some historic sites along the way.",
            timestamp: Date(),
            status: .complete
        ),
        LSChatMessage(
            id: "2",
            role: .agent,
            content: "I'd be happy to help you plan that! Based on your location, I found several routes that match your criteria. Would you prefer routes that are more coastal or inland through the mountains?",
            timestamp: Date(),
            status: .complete
        ),
    ]

    return LSChatTranscript(messages: messages)
        .laneShadowTheme()
}
