import LaneShadowTheme
import SwiftUI

// MARK: - Array Helper

extension Array {
    var isNilOrEmpty: Bool {
        isEmpty
    }
}

extension Optional where Wrapped: Collection {
    var isNilOrEmpty: Bool {
        self?.isEmpty ?? true
    }
}

// MARK: - View Conditional Helper

extension View {
    @ViewBuilder
    func `if`(
        _ condition: Bool,
        transform: (Self) -> some View
    ) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

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
 * Weather badge data model
 */
public struct LSWeatherBadgeInfo: Sendable {
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
    public let weatherBadge: LSWeatherBadgeInfo?
    public let isBest: Bool

    public init(
        id: String,
        label: String,
        description: String,
        distance: String,
        duration: String,
        scenicScore: Double,
        weatherBadge: LSWeatherBadgeInfo? = nil,
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
 * Chat transcript organism component
 *
 * Displays a conversation as a series of right-aligned rider bubbles and
 * left-aligned agent messages, mirroring the ChatGPT/Claude conversation pattern.
 *
 * ## Design Tokens Used (from translation matrix)
 * - Colors:
 *   - Rider bubble background: `theme.colors.primary.default`
 *   - Rider text: `theme.colors.onPrimary.default`
 *   - Agent text: `theme.colors.onSurface.default`
 *   - Timestamp text: `Color.gray`
 *   - Agent glass background (transparent mode): `theme.colors.surface.default` with 0.85 opacity
 * - Layout:
 *   - Message spacing: `theme.space.lg` (16pt) gaps between messages
 *   - Bubble padding: `theme.space.md` (12pt) internal padding
 *   - Corner radius: `theme.radius.xl` (16pt) for message bubbles, `theme.radius.sm` (4pt) for bottom-right of rider bubbles
 *   - Content padding: `theme.space.lg` (16pt) around scroll content
 * - Typography:
 *   - Rider message text: `theme.type.body.lg`
 *   - Agent message text: `theme.type.body.md`
 *   - Timestamp text: `theme.type.label.sm`
 *   - Empty state text: `theme.type.body.md`
 *
 * ## Behavior
 * - Rider messages: right-aligned speech bubble with primary color background and tight bottom-right corner
 * - Agent messages: left-aligned, with optional glass container background in transparent mode
 * - Timestamps: shown on first message OR when >5min gap since previous message OR on new calendar day
 * - Auto-scrolls to bottom on mount and when new messages arrive (unless user scrolled away)
 * - Route attachments render as separate rows below agent messages
 * - Empty state shows centered icon and text when no messages
 *
 * ## Parameters
 * - messages: Array of chat messages to display
 * - onRoutePress: Callback when user taps a route attachment (routeId, messageId) -> Void
 * - onViewOnMap: Callback when user taps "View on Map" button
 * - topInset: Extra top padding for overlay positioning (default: 0)
 * - bottomInset: Extra bottom padding for input bar clearance (default: 0)
 * - transparent: When true, background is transparent for map overlay mode (default: false)
 * - onScrollBeginDrag: Callback when user begins scrolling
 * - isTyping: Whether to show a typing indicator at the bottom (default: false)
 */
public struct LSChatTranscript: View {
    @Environment(\.theme) private var theme
    @State private var userHasScrolled: Bool = false

    private let messages: [LSChatMessage]
    private let onRoutePress: ((String, String) -> Void)?
    private let onViewOnMap: (() -> Void)?
    private let topInset: CGFloat
    private let bottomInset: CGFloat
    private let transparent: Bool
    private let onScrollBeginDrag: (() -> Void)?
    private let isTyping: Bool

    public init(
        messages: [LSChatMessage],
        onRoutePress: ((String, String) -> Void)? = nil,
        onViewOnMap: (() -> Void)? = nil,
        topInset: CGFloat = 0,
        bottomInset: CGFloat = 0,
        transparent: Bool = false,
        onScrollBeginDrag: (() -> Void)? = nil,
        isTyping: Bool = false
    ) {
        self.messages = messages
        self.onRoutePress = onRoutePress
        self.onViewOnMap = onViewOnMap
        self.topInset = topInset
        self.bottomInset = bottomInset
        self.transparent = transparent
        self.onScrollBeginDrag = onScrollBeginDrag
        self.isTyping = isTyping
    }

    // MARK: - Body

    public var body: some View {
        if messages.isEmpty {
            emptyState
        } else {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: theme.space.lg) {
                        ForEach(Array(messages.enumerated()), id: \.element.id) { index, message in
                            messageRow(for: message, at: index)
                        }

                        if isTyping {
                            typingIndicatorRow
                        }
                    }
                    .padding(theme.space.lg)
                    .padding(.top, theme.space.lg + topInset)
                    .padding(.bottom, theme.space.lg + bottomInset)
                }
                .background(transparent ? Color.clear : theme.colors.background.default)
                .scrollIndicators(.hidden)
                .onChange(of: messages.map(\.id).joined(separator: ",")) { oldValue, newValue in
                    // Only auto-scroll if new messages arrived (not just status updates)
                    let hasNewMessages = oldValue != newValue && !messages.isEmpty
                    if hasNewMessages, !userHasScrolled {
                        scrollToBottom(proxy: proxy)
                    }
                }
                .onAppear {
                    scrollToBottom(proxy: proxy)
                }
            }
        }
    }

    // MARK: - Message Row

    private func messageRow(for message: LSChatMessage, at index: Int) -> some View {
        VStack(alignment: .leading, spacing: theme.space.lg) {
            // Timestamp divider (shown conditionally)
            if shouldShowTimestamp(for: message, at: index) {
                timestampDivider(for: message, at: index)
            }

            // Message bubble or text
            switch message.role {
            case .rider:
                riderBubble(for: message)
            case .agent:
                agentMessage(for: message)
                // Route attachments render as separate rows below agent messages
                if !message.routeAttachments.isNilOrEmpty {
                    routeAttachmentsRow(for: message)
                }
            }
        }
    }

    // MARK: - Rider Bubble

    private func riderBubble(for message: LSChatMessage) -> some View {
        HStack {
            Spacer()

            Text(message.content)
                .font(theme.type.body.lg.font)
                .foregroundStyle(theme.colors.onPrimary.default)
                .padding(theme.space.md)
                .background(
                    RoundedRectangle(cornerRadius: theme.radius.xl)
                        .fill(theme.colors.primary.default)
                )
                .clipShape(RoundedCorner(
                    topLeft: theme.radius.xl,
                    bottomLeft: theme.radius.xl,
                    topRight: theme.radius.xl,
                    bottomRight: theme.radius.sm // Tight bottom-right corner for "sent" appearance
                ))
                .frame(maxWidth: .infinity, alignment: .trailing)
                .padding(.trailing, UIScreen.main.bounds.width * 0.2) // 80% max width
        }
    }

    // MARK: - Agent Message

    private func agentMessage(for message: LSChatMessage) -> some View {
        HStack(alignment: .top, spacing: theme.space.xs) {
            // Small icon placeholder
            Image(systemName: "circle.fill")
                .font(.system(size: 8))
                .foregroundStyle(Color.gray)

            VStack(alignment: .leading, spacing: 4) {
                Text(message.content) // TODO: Use MarkdownText when available
                    .font(theme.type.body.md.font)
                    .foregroundStyle(theme.colors.onSurface.default)

                // Typing indicator for streaming messages
                if message.status == .streaming {
                    // LSTypingIndicator(size: .small) // TODO: Add LSTypingIndicator
                    Text("...")
                        .padding(.leading, theme.space.xs)
                }
            }

            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .if(transparent) { view in
            view
                .padding(.horizontal, theme.space.md)
                .padding(.vertical, theme.space.sm)
                .background(theme.colors.surface.default.opacity(0.85))
                .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
        }
    }

    // MARK: - Route Attachments Row

    private func routeAttachmentsRow(for message: LSChatMessage) -> some View {
        HStack(spacing: theme.space.sm) {
            ForEach(message.routeAttachments ?? [], id: \.id) { attachment in
                // TODO: Use LSRouteAttachmentCard when mapping is available
                Text("Route: \(attachment.label)")
                    .font(theme.type.body.sm.font)
                    .padding(theme.space.sm)
                    .background(Color.gray.opacity(0.2))
                    .onTapGesture {
                        onRoutePress?(attachment.id, message.id)
                    }
            }
        }
        .padding(.top, 4) // semantic.space.micro equivalent
    }

    // MARK: - Timestamp Divider

    private func timestampDivider(for message: LSChatMessage, at index: Int) -> some View {
        let previous = index > 0 ? messages[index - 1] : nil
        let isNewDay = !isNewDay(current: message.timestamp, previous: previous?.timestamp)

        let label: String = if isNewDay || previous == nil {
            "\(formatDayLabel(message.timestamp)) · \(formatMessageTime(message.timestamp))"
        } else {
            formatMessageTime(message.timestamp)
        }

        return Text(label)
            .font(theme.type.label.sm.font)
            .foregroundStyle(Color.gray)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, 4) // semantic.space.micro equivalent
    }

    // MARK: - Typing Indicator Row

    private var typingIndicatorRow: some View {
        HStack(alignment: .top, spacing: theme.space.xs) {
            Image(systemName: "circle.fill")
                .font(.system(size: 8))
                .foregroundStyle(Color.gray)

            LSTypingIndicator(size: .small)

            Spacer()
        }
        .padding(.vertical, 4)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: theme.space.md) {
            Image(systemName: "chat.bubble")
                .font(.system(size: 40)) // semantic.icon.lg equivalent
                .foregroundStyle(Color.gray)

            Text("Start a conversation from the home screen")
                .font(theme.type.body.md.font)
                .foregroundStyle(Color.gray)
                .multilineTextAlignment(.center)
                .padding(.top, theme.space.md)
                .lineSpacing(22) // lineHeight from spec
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(32)
    }

    // MARK: - Helpers

    private func shouldShowTimestamp(for message: LSChatMessage, at index: Int) -> Bool {
        // Always show timestamp on first message
        guard index > 0 else { return true }

        let previous = messages[index - 1]
        return shouldShowTimestamp(current: message, previous: previous)
    }

    private func shouldShowTimestamp(current: LSChatMessage, previous: LSChatMessage) -> Bool {
        let curr = current.timestamp
        let prev = previous.timestamp

        // New calendar day
        if isNewDay(current: curr, previous: prev) {
            return true
        }

        // Gap > 5 minutes
        let gapMs = curr.timeIntervalSince(prev)
        return gapMs > 5 * 60
    }

    private func isNewDay(current: Date, previous: Date?) -> Bool {
        guard let previous else { return true }

        let calendar = Calendar.current
        let currComponents = calendar.dateComponents([.year, .month, .day], from: current)
        let prevComponents = calendar.dateComponents([.year, .month, .day], from: previous)

        return currComponents.year != prevComponents.year ||
            currComponents.month != prevComponents.month ||
            currComponents.day != prevComponents.day
    }

    private func formatMessageTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: date)
    }

    private func formatDayLabel(_ date: Date) -> String {
        let now = Date()
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: now)
        let messageDay = calendar.startOfDay(for: date)
        let diffDays = calendar.dateComponents([.day], from: messageDay, to: today).day ?? 0

        if diffDays == 0 { return "Today" }
        if diffDays == 1 { return "Yesterday" }
        if diffDays < 7 {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEEE"
            return formatter.string(from: date)
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date)
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        guard !messages.isEmpty else { return }

        // Use a short delay to ensure layout is complete (100ms from RN spec)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.easeInOut(duration: 0.3)) {
                proxy.scrollTo(messages.last?.id, anchor: .bottom)
            }
        }
    }
}

// MARK: - RoundedCorner Shape

/**
 * Custom rounded corner shape for rider bubble with tight bottom-right corner
 */
struct RoundedCorner: Shape {
    var topLeft: CGFloat = 0
    var bottomLeft: CGFloat = 0
    var topRight: CGFloat = 0
    var bottomRight: CGFloat = 0

    func path(in rect: CGRect) -> Path {
        var path = Path()

        let width = rect.width
        let height = rect.height

        // Top-left corner
        path.move(to: CGPoint(x: 0, y: topLeft))
        path.addArc(center: CGPoint(x: topLeft, y: topLeft),
                    radius: topLeft,
                    startAngle: .degrees(180),
                    endAngle: .degrees(270),
                    clockwise: false)

        // Top edge to top-right corner
        path.addLine(to: CGPoint(x: width - topRight, y: 0))

        // Top-right corner
        path.addArc(center: CGPoint(x: width - topRight, y: topRight),
                    radius: topRight,
                    startAngle: .degrees(270),
                    endAngle: .degrees(0),
                    clockwise: false)

        // Right edge to bottom-right corner
        path.addLine(to: CGPoint(x: width, y: height - bottomRight))

        // Bottom-right corner (tight for "sent" appearance)
        path.addArc(center: CGPoint(x: width - bottomRight, y: height - bottomRight),
                    radius: bottomRight,
                    startAngle: .degrees(0),
                    endAngle: .degrees(90),
                    clockwise: false)

        // Bottom edge to bottom-left corner
        path.addLine(to: CGPoint(x: bottomLeft, y: height))

        // Bottom-left corner
        path.addArc(center: CGPoint(x: bottomLeft, y: height - bottomLeft),
                    radius: bottomLeft,
                    startAngle: .degrees(90),
                    endAngle: .degrees(180),
                    clockwise: false)

        // Left edge back to start
        path.closeSubpath()

        return path
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
