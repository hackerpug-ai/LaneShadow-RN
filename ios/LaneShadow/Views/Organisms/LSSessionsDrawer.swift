import LaneShadowTheme
import NativeTheme
import SwiftUI

// MARK: - Public API

public struct LSSessionsDrawer<Session: Identifiable>: View where Session.ID == String {
    @Environment(\.theme) private var theme

    private let sessions: [Session]
    private let activeSessionId: String?
    private let groupLabel: String
    private let onSelect: @Sendable (String) -> Void
    private let onNew: @Sendable () -> Void
    private let onDismiss: @Sendable () -> Void

    public init(
        sessions: [Session],
        activeSessionId: String?,
        groupLabel: String = "THIS WEEK",
        onSelect: @Sendable @escaping (String) -> Void,
        onNew: @Sendable @escaping () -> Void,
        onDismiss: @Sendable @escaping () -> Void
    ) {
        self.sessions = sessions
        self.activeSessionId = activeSessionId
        self.groupLabel = groupLabel
        self.onSelect = onSelect
        self.onNew = onNew
        self.onDismiss = onDismiss
    }

    public var body: some View {
        VStack(spacing: 0) {
            LSGlassPanel(variant: .chrome, padding: .spacing4) {
                VStack(spacing: 0) {
                    // Sticky header
                    header

                    // Section label
                    LSSectionHeader(title: groupLabel)

                    // Scrollable session rows
                    ScrollView {
                        LazyVStack(spacing: 0) {
                            ForEach(sessions, id: \.id) { session in
                                SessionRow(
                                    session: session,
                                    isActive: session.id == activeSessionId,
                                    onSelect: { onSelect(session.id) }
                                )
                            }
                        }
                    }
                }
            }
            .frame(width: 312)
            .overlay(alignment: .trailing) {
                Rectangle()
                    .fill(LaneShadowTheme.color.border.default)
                    .frame(width: theme.strokeWidth.thin)
            }
            .shadow(
                color: theme.elevation.level4.shadowColor.opacity(theme.opacity.values["10"] ?? 0.1),
                radius: 16,
                x: 2,
                y: 0
            )
        }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: theme.space.sm) {
            LSText("Rides", variant: .title.lg)

            Spacer()

            LSButton(
                "NEW",
                variant: .outline,
                size: .md,
                leadingIcon: .plus,
                action: onNew
            )
        }
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.md)
    }
}

// MARK: - Session Row (Internal)

private struct SessionRow<Session: Identifiable>: View where Session.ID == String {
    @Environment(\.theme) private var theme

    private let session: Session
    private let isActive: Bool
    private let onSelect: @Sendable () -> Void

    /// Session data protocol - allows any session type with required properties
    private var title: String {
        (session as? any SessionTitleProvider)?.title ?? ""
    }

    private var preview: String {
        (session as? any SessionPreviewProvider)?.preview ?? ""
    }

    private var when: String {
        (session as? any SessionWhenProvider)?.when ?? ""
    }

    init(
        session: Session,
        isActive: Bool,
        onSelect: @Sendable @escaping () -> Void
    ) {
        self.session = session
        self.isActive = isActive
        self.onSelect = onSelect
    }

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 0) {
                // Active stripe
                if isActive {
                    Rectangle()
                        .fill(LaneShadowTheme.color.signal.default)
                        .frame(width: 3)
                }

                // Row content
                VStack(alignment: .leading, spacing: theme.space.xs) {
                    // Title row
                    HStack(alignment: .firstTextBaseline, spacing: theme.space.sm) {
                        LSText(title, variant: .label.lg)
                            .lineLimit(1)

                        Spacer()

                        LSText(when, variant: .body.sm, color: .subtle)
                    }

                    // Preview
                    LSText(preview, variant: .body.sm, color: .secondary)
                        .lineLimit(1)
                }
                .padding(.horizontal, theme.space.md)
                .padding(.vertical, theme.space.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    isActive
                        ? LaneShadowTheme.color.signal.default.opacity(theme.opacity.values["5"] ?? 0.05)
                        : Color.clear
                )
            }
        }
        .buttonStyle(.plain)
        .background(LaneShadowTheme.color.border.subtle.opacity(theme.opacity.values["50"] ?? 0.5))
        .frame(height: rowHeight)
    }

    private var rowHeight: CGFloat {
        72
    }
}

// MARK: - Session Data Protocols

public protocol SessionTitleProvider {
    var title: String { get }
}

public protocol SessionPreviewProvider {
    var preview: String { get }
}

public protocol SessionWhenProvider {
    var when: String { get }
}

// MARK: - Test Helpers

extension LSSessionsDrawer {
    static func mock(
        sessions: [MockSession],
        activeSessionId: String?,
        groupLabel: String = "THIS WEEK",
        onSelect: @Sendable @escaping (String) -> Void,
        onNew: @Sendable @escaping () -> Void,
        onDismiss: @Sendable @escaping () -> Void
    ) -> LSSessionsDrawer<MockSession> {
        LSSessionsDrawer<MockSession>(
            sessions: sessions,
            activeSessionId: activeSessionId,
            groupLabel: groupLabel,
            onSelect: onSelect,
            onNew: onNew,
            onDismiss: onDismiss
        )
    }
}

public struct MockSession: Identifiable, SessionTitleProvider, SessionPreviewProvider, SessionWhenProvider {
    public let id: String
    public let title: String
    public let preview: String
    public let when: String

    public init(
        id: String,
        title: String,
        preview: String,
        when: String
    ) {
        self.id = id
        self.title = title
        self.preview = preview
        self.when = when
    }
}
