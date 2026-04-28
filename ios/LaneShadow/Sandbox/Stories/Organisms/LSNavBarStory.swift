import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSNavBarStory {
    static let all: [Story] = [
        Story(
            id: "organisms.nav-bar.basic",
            tier: .organism,
            component: "NavBar",
            name: "Default",
            summary: "Standard modal toolbar. Back leading (signal-colored), centered title, close trailing."
        ) { _ in
            LSNavBar(
                title: "Filter",
                leading: .back(action: {}),
                trailing: .action(icon: .close, action: {})
            )
        },
        Story(
            id: "organisms.nav-bar.filter-chip-row",
            tier: .organism,
            component: "NavBar",
            name: "Filter Chip Row",
            summary: "NavBar with horizontally-scrolling filter chip row below toolbar."
        ) { _ in
            LSNavBar(
                title: "Filter",
                leading: .back(action: {}),
                trailing: .action(icon: .close, action: {}),
                filterChips: [
                    FilterChipSpec(label: "Mileage", isSelected: false),
                    FilterChipSpec(label: "Difficulty", isSelected: true),
                    FilterChipSpec(label: "Surface", isSelected: false),
                    FilterChipSpec(label: "Elevation", isSelected: false),
                    FilterChipSpec(label: "Duration", isSelected: false),
                ]
            )
        },
        Story(
            id: "organisms.nav-bar.search-slot",
            tier: .organism,
            component: "NavBar",
            name: "Search Slot",
            summary: "NavBar with inset search field below toolbar."
        ) { _ in
            LSNavBar(
                title: "Filter",
                leading: .back(action: {}),
                trailing: .action(icon: .close, action: {}),
                searchSlot: SearchSlotSpec(placeholder: "Search routes…")
            )
        },
    ]
}
