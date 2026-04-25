import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSNavigatorMessageStory {
    static let all: [Story] = [
        Story(
            id: "organisms.navigatormessage.messageOnly",
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
            id: "organisms.navigatormessage.withOneAttachment",
            tier: .organism,
            component: "NavigatorMessage",
            name: "With One Attachment",
            summary: "Single LSRouteAttachmentCard below body with selected: true."
        ) { _ in
            LSNavigatorMessage(
                body: "Take 280 south to 92 east, then Skyline.",
                pinned: false,
                onPin: {},
                onDismiss: {}
            )
        },
        Story(
            id: "organisms.navigatormessage.withThreeAttachments",
            tier: .organism,
            component: "NavigatorMessage",
            name: "With Three Attachments",
            summary: "Three LSRouteAttachmentCard instances stacked vertically with spacing.2. First card selected."
        ) { _ in
            LSNavigatorMessage(
                body: "Take 280 south to 92 east, then Skyline.",
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
            id: "organisms.navigatormessage.longBody",
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
            id: "organisms.navigatormessage.darkMode",
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
