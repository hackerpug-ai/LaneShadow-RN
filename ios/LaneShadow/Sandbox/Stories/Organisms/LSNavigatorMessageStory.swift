import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSNavigatorMessageStory {
    static let all: [Story] = [
        Story(
            id: "organisms.navigatormessage.message-only",
            tier: .organism,
            component: "NavigatorMessage",
            name: "Message Only",
            summary: "Compass chip + 'THE NAVIGATOR' label + body in opinion.md (Newsreader serif). Signal stripe."
        ) { _ in
            LSNavigatorMessage(
                body: "Take 280 south to 92 east, then Skyline.",
                pinned: false,
                onPin: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.navigatormessage.with-one-attachment",
            tier: .organism,
            component: "NavigatorMessage",
            name: "With One Attachment",
            summary: "Single LSRouteAttachmentCard below body with selected: true."
        ) { _ in
            LSNavigatorMessage(
                body: "Take 280 south to 92 east, then Skyline.",
                attachments: [
                    LSRouteAttachment(
                        id: "route-1",
                        label: "Via Skyline Blvd",
                        description: "Scenic coastal route",
                        distance: "42 mi",
                        duration: "2h 15m",
                        scenicScore: 4.8,
                        isBest: true
                    ),
                ],
                pinned: false,
                onPin: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.navigatormessage.with-three-attachments",
            tier: .organism,
            component: "NavigatorMessage",
            name: "With Three Attachments",
            summary: "Three LSRouteAttachmentCard instances stacked vertically with spacing.2. First card selected."
        ) { _ in
            LSNavigatorMessage(
                body: "Take 280 south to 92 east, then Skyline.",
                attachments: [
                    LSRouteAttachment(
                        id: "route-1",
                        label: "Via Skyline Blvd",
                        description: "Scenic coastal route",
                        distance: "42 mi",
                        duration: "2h 15m",
                        scenicScore: 4.8,
                        isBest: true
                    ),
                    LSRouteAttachment(
                        id: "route-2",
                        label: "Highway 1 South",
                        description: "Direct highway route",
                        distance: "38 mi",
                        duration: "1h 45m",
                        scenicScore: 3.2,
                        isBest: false
                    ),
                    LSRouteAttachment(
                        id: "route-3",
                        label: "Through Pescadero",
                        description: "Inland route through farmland",
                        distance: "52 mi",
                        duration: "2h 40m",
                        scenicScore: 4.1,
                        isBest: false
                    ),
                ],
                pinned: false,
                onPin: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.navigatormessage.pinned",
            tier: .organism,
            component: "NavigatorMessage",
            name: "Pinned",
            summary: "Pinned variant shows bookmarkFill icon and pinned indicator. Auto-dismiss disabled."
        ) { _ in
            LSNavigatorMessage(
                body: "Take 280 south to 92 east, then Skyline.",
                pinned: true,
                onPin: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.navigatormessage.long-body",
            tier: .organism,
            component: "NavigatorMessage",
            name: "Long Body",
            summary: "Extended message text to test wrapping and layout with opinion.md typography."
        ) { _ in
            LSNavigatorMessage(
                body: "Take 280 south to 92 east, then continue on Skyline Boulevard for approximately 12 miles until you reach the trailhead parking area on your right. The route features scenic coastal views with several elevation changes.",
                pinned: false,
                onPin: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.navigatormessage.dark-mode",
            tier: .organism,
            component: "NavigatorMessage",
            name: "Dark Mode",
            summary: "Signal stripe and compass re-resolve to dark surface. Content colors adapt automatically."
        ) { _ in
            LSNavigatorMessage(
                body: "Take 280 south to 92 east, then Skyline.",
                pinned: false,
                onPin: {},
                onDismiss: {}
            )
            .preferredColorScheme(.dark)
        },
    ]
}
