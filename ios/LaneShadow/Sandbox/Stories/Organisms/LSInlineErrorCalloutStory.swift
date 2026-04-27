import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSInlineErrorCalloutStory {
    static let all: [Story] = [
        Story(
            id: "organisms.inlineerror.error-only",
            tier: .organism,
            component: "InlineErrorCallout",
            name: "Error Only",
            summary: "Compass chip + 'THE NAVIGATOR' label + body in opinion.md. Warning stripe."
        ) { _ in
            LSInlineErrorCallout(
                body: "Couldn't stitch together a continuous route.",
                onSuggestionTap: { _ in }
            )
        },
        Story(
            id: "organisms.inlineerror.with-detail",
            tier: .organism,
            component: "InlineErrorCallout",
            name: "With Detail",
            summary: "Additional detail text in ui.body.sm with content.textMuted color."
        ) { _ in
            LSInlineErrorCallout(
                body: "Couldn't stitch together a continuous route.",
                detail: "Try a different destination or start point.",
                onSuggestionTap: { _ in }
            )
        },
        Story(
            id: "organisms.inlineerror.with-suggestions",
            tier: .organism,
            component: "InlineErrorCallout",
            name: "With Suggestions",
            summary: "Horizontal LSSuggestionChip row for user actions. Chips fire onSuggestionTap."
        ) { _ in
            LSInlineErrorCallout(
                body: "Couldn't stitch together a continuous route.",
                detail: "Try a different destination or start point.",
                suggestions: ["Try inland routes", "End at Big Sur"],
                onSuggestionTap: { _ in }
            )
        },
        Story(
            id: "organisms.inlineerror.long-body-suggestions",
            tier: .organism,
            component: "InlineErrorCallout",
            name: "Long Body + Long Suggestions",
            summary: "Extended text and multiple suggestion chips to test wrapping."
        ) { _ in
            LSInlineErrorCallout(
                body: "Couldn't stitch together a continuous route between your selected points. The terrain and road network in this region don't support a seamless cycling path.",
                detail: "Consider alternative routes or adjusting your start/end points.",
                suggestions: ["Try inland routes", "End at Big Sur", "Adjust start point", "See alternatives"],
                onSuggestionTap: { _ in }
            )
        },
        Story(
            id: "organisms.inlineerror.dark-mode",
            tier: .organism,
            component: "InlineErrorCallout",
            name: "Dark Mode",
            summary: "Warning stripe and compass re-resolve to dark surface. Content colors adapt automatically."
        ) { _ in
            LSInlineErrorCallout(
                body: "Couldn't stitch together a continuous route.",
                detail: "Try a different destination or start point.",
                suggestions: ["Try inland routes", "End at Big Sur"],
                onSuggestionTap: { _ in }
            )
            .preferredColorScheme(.dark)
        },
    ]
}
