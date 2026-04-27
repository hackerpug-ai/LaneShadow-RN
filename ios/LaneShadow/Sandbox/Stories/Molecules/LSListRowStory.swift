import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSListRowStory {
    static let all: [Story] = [
        Story(
            id: "molecules.listrow.leading-icon",
            tier: .molecule,
            component: "LSListRow",
            name: "Leading Icon",
            summary: "List row with icon-leading content and static trailing icon."
        ) { _ in
            LSListRow(
                leading: .icon(.pin),
                title: "Notifications",
                trailing: .icon(.sparkle)
            )
            .padding(Theme.shared.space.lg)
        },
        Story(
            id: "molecules.listrow.leading-avatar",
            tier: .molecule,
            component: "LSListRow",
            name: "Leading Avatar",
            summary: "List row with avatar-leading content and chevron trailing affordance."
        ) { _ in
            LSListRow(
                leading: .avatar(initials: "LS"),
                title: "Lane Shadow",
                trailing: .chevron
            )
            .padding(Theme.shared.space.lg)
        },
        Story(
            id: "molecules.listrow.with-subtitle",
            tier: .molecule,
            component: "LSListRow",
            name: "With Subtitle",
            summary: "List row with title and subtitle stack."
        ) { _ in
            LSListRow(
                leading: .icon(.route),
                title: "Route alerts",
                subtitle: "Ride alerts and mentions",
                trailing: .chevron
            )
            .padding(Theme.shared.space.lg)
        },
        Story(
            id: "molecules.listrow.with-toggle",
            tier: .molecule,
            component: "LSListRow",
            name: "With Toggle",
            summary: "List row with trailing toggle state indicator."
        ) { _ in
            LSListRow(
                leading: .icon(.sliders),
                title: "Scenic routing",
                subtitle: "Keep scenic weighting enabled",
                trailing: .toggle(isOn: true)
            )
            .padding(Theme.shared.space.lg)
        },
        Story(
            id: "molecules.listrow.with-chevron",
            tier: .molecule,
            component: "LSListRow",
            name: "With Chevron",
            summary: "Interactive list row using the chevron trailing pattern."
        ) { _ in
            LSListRow(
                leading: .icon(.map),
                title: "Open route details",
                trailing: .chevron,
                onTap: {}
            )
            .padding(Theme.shared.space.lg)
        },
        Story(
            id: "molecules.listrow.with-trailing-button",
            tier: .molecule,
            component: "LSListRow",
            name: "With Trailing Button",
            summary: "List row with trailing atom button action."
        ) { _ in
            LSListRow(
                leading: .avatar(initials: "JR"),
                title: "Justin Rider",
                subtitle: "Touring planner",
                trailing: .button(title: "Follow", variant: .outline, action: {})
            )
            .padding(Theme.shared.space.lg)
        },
    ]
}
