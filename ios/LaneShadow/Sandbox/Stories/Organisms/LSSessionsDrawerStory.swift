import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSSessionsDrawerStory {
    static let all: [Story] = [
        Story(
            id: "organisms.sessionsdrawer.default",
            tier: .organism,
            component: "SessionsDrawer",
            name: "Default",
            summary: "5 sessions, Santa Cruz Loop active. Copper stripe + tinted bg on active row. Header + section label sticky.",
            previewMode: .fullScreen
        ) { _ in
            LSSessionsDrawer<StorySession>(
                sessions: mockSessions,
                activeSessionId: "santa-cruz-loop",
                groupLabel: "THIS WEEK",
                onSelect: { _ in },
                onNew: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.sessionsdrawer.empty",
            tier: .organism,
            component: "SessionsDrawer",
            name: "Empty State",
            summary: "No sessions. Empty state with icon + prompt to start a new conversation. Header + NEW button present.",
            previewMode: .fullScreen
        ) { _ in
            LSSessionsDrawer<StorySession>(
                sessions: [],
                activeSessionId: nil,
                groupLabel: "THIS WEEK",
                onSelect: { _ in },
                onNew: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.sessionsdrawer.long-list",
            tier: .organism,
            component: "SessionsDrawer",
            name: "Long List",
            summary: "20 sessions; list scrolls while header + section label stay sticky. Fade at bottom indicates more rows below.",
            previewMode: .fullScreen
        ) { _ in
            LSSessionsDrawer<StorySession>(
                sessions: longMockSessions,
                activeSessionId: "session-0",
                groupLabel: "THIS WEEK",
                onSelect: { _ in },
                onNew: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.sessionsdrawer.no-active",
            tier: .organism,
            component: "SessionsDrawer",
            name: "No Active Session",
            summary: "activeSessionId: nil. No copper stripe or tinted background on any row. All rows default state.",
            previewMode: .fullScreen
        ) { _ in
            LSSessionsDrawer<StorySession>(
                sessions: mockSessions,
                activeSessionId: nil,
                groupLabel: "THIS WEEK",
                onSelect: { _ in },
                onNew: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.sessionsdrawer.dark-mode",
            tier: .organism,
            component: "SessionsDrawer",
            name: "Dark Mode",
            summary: "Drawer resolves to ink-700 surface. Copper stripe remains vivid. All text tokens re-resolve on dark surface.",
            previewMode: .fullScreen
        ) { _ in
            LSSessionsDrawer<StorySession>(
                sessions: mockSessions,
                activeSessionId: "santa-cruz-loop",
                groupLabel: "THIS WEEK",
                onSelect: { _ in },
                onNew: {},
                onDismiss: {}
            )
            .preferredColorScheme(.dark)
        },
    ]
}

// MARK: - Mock Data

private struct StorySession: Identifiable, SessionTitleProvider, SessionPreviewProvider, SessionWhenProvider {
    let id: String
    let title: String
    let preview: String
    let when: String
}

private var mockSessions: [StorySession] {
    [
        StorySession(
            id: "santa-cruz-loop",
            title: "Santa Cruz Loop",
            preview: "Take 1 south to Davenport then back through the redwoods…",
            when: "Today"
        ),
        StorySession(
            id: "skyline-to-the-sea",
            title: "Skyline to the Sea",
            preview: "Best way to do 84 to 35 heading south into the park…",
            when: "Mon"
        ),
        StorySession(
            id: "pch-evening-run",
            title: "PCH Evening Run",
            preview: "Sunset ride from Pacifica down to Half Moon Bay…",
            when: "Sun"
        ),
        StorySession(
            id: "marin-headlands",
            title: "Marin Headlands",
            preview: "Cross the bridge and head out to Hawk Hill at sunrise…",
            when: "Sat"
        ),
        StorySession(
            id: "mt-tam-summit",
            title: "Mt. Tam Summit",
            preview: "Looking for the cleanest line up Pan Toll…",
            when: "Fri"
        ),
    ]
}

private var longMockSessions: [StorySession] {
    (0 ..< 20).map { index in
        StorySession(
            id: "session-\(index)",
            title: "Session \(index)",
            preview: "Preview text for session \(index)",
            when: "Day \(index)"
        )
    }
}
