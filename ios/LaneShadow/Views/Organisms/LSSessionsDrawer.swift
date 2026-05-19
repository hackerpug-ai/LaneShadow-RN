import LaneShadowTheme
import NativeTheme
import SwiftUI

// MARK: - Public API

public struct LSSessionsDrawer<Session: Identifiable & Sendable>: View where Session.ID == String {
    @Environment(\.theme) private var theme

    @State private var safeAreaTop: CGFloat = 0
    @State private var safeAreaBottom: CGFloat = 0

    private let drawerWidth: CGFloat = 312
    private let sessionRowHeight: CGFloat = 72

    private let sessions: [Session]
    private let activeSessionId: String?
    private let sections: [SessionSection<Session>]
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
        // Back-compat: wrap single group in sections array
        sections = [SessionSection(label: groupLabel, sessions: sessions)]
        self.onSelect = onSelect
        self.onNew = onNew
        self.onDismiss = onDismiss
    }

    public init(
        sections: [SessionSection<Session>],
        activeSessionId: String?,
        onSelect: @Sendable @escaping (String) -> Void,
        onNew: @Sendable @escaping () -> Void,
        onDismiss: @Sendable @escaping () -> Void
    ) {
        // Flatten sessions from all sections
        sessions = sections.flatMap(\.sessions)
        self.activeSessionId = activeSessionId
        self.sections = sections
        self.onSelect = onSelect
        self.onNew = onNew
        self.onDismiss = onDismiss
    }

    public var body: some View {
        // The outer VStack fills the full vertical space the host grants it
        // (LSMapLayer applies `.ignoresSafeArea(edges: [.top, .bottom])` to
        // the drawer slot). The chrome (card background + trailing border +
        // shadow) extends top-to-bottom edge-to-edge; CONTENT inside owns
        // its own safe-area padding via the GeometryReader background.
        VStack(spacing: 0) {
            // Sticky header — sits below the status bar / Dynamic Island
            header
                .padding(.top, safeAreaTop)

            // Scrollable session rows grouped by sections
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(sections, id: \.label) { section in
                        SectionGroup(
                            section: section,
                            activeSessionId: activeSessionId,
                            onSelect: onSelect
                        )
                    }
                }
                .padding(.bottom, safeAreaBottom)
            }
        }
        .frame(width: drawerWidth)
        .frame(maxHeight: .infinity, alignment: .top)
        .background(LaneShadowTheme.color.surface.card)
        .background(
            GeometryReader { geometry in
                Color.clear
                    .onAppear {
                        safeAreaTop = geometry.safeAreaInsets.top
                        safeAreaBottom = geometry.safeAreaInsets.bottom
                    }
                    .onChange(of: geometry.safeAreaInsets.top) { _, newValue in
                        safeAreaTop = newValue
                    }
                    .onChange(of: geometry.safeAreaInsets.bottom) { _, newValue in
                        safeAreaBottom = newValue
                    }
            }
        )
        .overlay(alignment: .trailing) {
            Rectangle()
                .fill(LaneShadowTheme.color.border.default)
                .frame(width: theme.strokeWidth.thin)
        }
        .shadow(
            color: theme.elevation.level4.shadowColor.opacity(theme.opacity.values["10"]!),
            radius: 16,
            x: 2,
            y: 0
        )
    }

    private var header: some View {
        HStack(alignment: .center, spacing: theme.space.sm) {
            LSText("Rides", variant: .opinion.lg)
                .italic()

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

// MARK: - Section Group (Internal)

private struct SectionGroup<Session: Identifiable & Sendable>: View where Session.ID == String {
    @Environment(\.theme) private var theme

    private let section: SessionSection<Session>
    private let activeSessionId: String?
    private let onSelect: @Sendable (String) -> Void

    init(
        section: SessionSection<Session>,
        activeSessionId: String?,
        onSelect: @Sendable @escaping (String) -> Void
    ) {
        self.section = section
        self.activeSessionId = activeSessionId
        self.onSelect = onSelect
    }

    var body: some View {
        VStack(spacing: 0) {
            // Section label
            LSSectionHeader(title: section.label)

            // Session rows
            ForEach(section.sessions, id: \.id) { session in
                SessionRow(
                    session: session,
                    isActive: session.id == activeSessionId,
                    onSelect: { onSelect(session.id) }
                )
            }
        }
    }
}

// MARK: - Session Row (Internal)

private struct SessionRow<Session: Identifiable & Sendable>: View where Session.ID == String {
    @Environment(\.theme) private var theme

    private let rowHeight: CGFloat = 72

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
                        .frame(width: theme.strokeWidth.thick)
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
                        ? LaneShadowTheme.color.signal.whisper
                        : Color.clear
                )
            }
        }
        .buttonStyle(.plain)
        .background(LaneShadowTheme.color.border.subtle.opacity(theme.opacity.values["50"]!))
        .frame(height: rowHeight)
    }
}

// MARK: - Session Section

public struct SessionSection<Session: Identifiable & Sendable>: Sendable where Session.ID == String {
    public let label: String
    public let sessions: [Session]

    public init(label: String, sessions: [Session]) {
        self.label = label
        self.sessions = sessions
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

    static func mock(
        sections: [SessionSection<MockSession>],
        activeSessionId: String?,
        onSelect: @Sendable @escaping (String) -> Void,
        onNew: @Sendable @escaping () -> Void,
        onDismiss: @Sendable @escaping () -> Void
    ) -> LSSessionsDrawer<MockSession> {
        LSSessionsDrawer<MockSession>(
            sections: sections,
            activeSessionId: activeSessionId,
            onSelect: onSelect,
            onNew: onNew,
            onDismiss: onDismiss
        )
    }
}

public struct MockSession: Identifiable, Sendable, SessionTitleProvider, SessionPreviewProvider, SessionWhenProvider {
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
