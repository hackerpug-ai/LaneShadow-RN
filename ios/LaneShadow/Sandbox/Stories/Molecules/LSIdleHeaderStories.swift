import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSIdleHeaderStories {
    static let all: [Story] = [
        Story(
            id: "molecules.idle-header.default",
            tier: .molecule,
            component: "LSIdleHeader",
            name: "Default",
            summary: "Unified idle header — menu + greeting capsule + new in a single glass chip."
        ) { _ in
            LSIdleHeader(
                capsuleState: .idle(
                    headline: AttributedString("Where are we riding today, rider?"),
                    metaItems: ["SUNDAY", "67°F", "CLEAR"]
                ),
                onMenuTap: {},
                onNewTap: {}
            )
            .padding()
        },
        Story(
            id: "molecules.idle-header.no-meta",
            tier: .molecule,
            component: "LSIdleHeader",
            name: "No Meta",
            summary: "Headline-only — meta row hidden when metaItems is empty."
        ) { _ in
            LSIdleHeader(
                capsuleState: .idle(
                    headline: AttributedString("Where are we starting from?"),
                    metaItems: []
                ),
                onMenuTap: {},
                onNewTap: {}
            )
            .padding()
        },
        Story(
            id: "molecules.idle-header.warning",
            tier: .molecule,
            component: "LSIdleHeader",
            name: "Weather Advisory",
            summary: "Meta tinted with status.warning when isWarning is true."
        ) { _ in
            LSIdleHeader(
                capsuleState: .idle(
                    headline: AttributedString("Not the prettiest day."),
                    metaItems: ["FRI", "62°F", "RAIN"]
                ),
                isWarning: true,
                onMenuTap: {},
                onNewTap: {}
            )
            .padding()
        },
    ]
}
