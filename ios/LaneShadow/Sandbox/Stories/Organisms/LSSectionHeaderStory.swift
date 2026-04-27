import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSSectionHeaderStory {
    static let all: [Story] = [
        Story(
            id: "organisms.sectionheader.title-only",
            tier: .organism,
            component: "SectionHeader",
            name: "Title Only",
            summary: "trailing: .none. title in ui.title.md. inset: spacing.3 = 12pt. No see-all link rendered."
        ) { _ in
            LSSectionHeader(title: "Nearby Routes")
        },
        Story(
            id: "organisms.sectionheader.title-with-see-all",
            tier: .organism,
            component: "SectionHeader",
            name: "Title + See All",
            summary: "trailing: .link(\"See all\", onTap). \"See all\" in signal.default + chevron R. onTap fires once per tap."
        ) { _ in
            LSSectionHeader(
                title: "Nearby Routes",
                trailing: .link(label: "See all", onTap: {})
            )
        },
        Story(
            id: "organisms.sectionheader.caps-label",
            tier: .organism,
            component: "SectionHeader",
            name: "Caps Label",
            summary: "title in ui.label.sm (8.5px 600 0.14em uppercase, content-tertiary). No trailing slot. Used inside drawers."
        ) { _ in
            LSSectionHeader(title: "THIS WEEK")
        },
        Story(
            id: "organisms.sectionheader.custom-inset",
            tier: .organism,
            component: "SectionHeader",
            name: "Custom Inset",
            summary: "inset: 16pt on Saved Routes header. Caps label \"Last Month\" with inset 8pt. Prop drives padding-left."
        ) { _ in
            VStack(spacing: 0) {
                LSSectionHeader(
                    title: "Saved Routes",
                    trailing: .link(label: "See all", onTap: {}),
                    inset: 16
                )
                LSSectionHeader(
                    title: "Last Month",
                    inset: 8
                )
            }
        },
        Story(
            id: "organisms.sectionheader.dark-mode",
            tier: .organism,
            component: "SectionHeader",
            name: "Dark Mode",
            summary: "content-primary re-resolves to ink-050. signal.default copper See all remains on dark surface. No new colors."
        ) { _ in
            LSSectionHeader(
                title: "Nearby Routes",
                trailing: .link(label: "See all", onTap: {})
            )
            .preferredColorScheme(.dark)
        },
    ]
}
