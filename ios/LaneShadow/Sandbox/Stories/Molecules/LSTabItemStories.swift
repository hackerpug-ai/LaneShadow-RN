import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum LSTabItemStories {
    static let all: [Story] = [
        Story(
            id: "molecules.tabitem.selected",
            tier: .molecule,
            component: "LSTabItem",
            name: "Selected",
            summary: "Tab item in selected state with indicator."
        ) { _ in
            TabItemSelectedStory()
        },
        Story(
            id: "molecules.tabitem.unselected",
            tier: .molecule,
            component: "LSTabItem",
            name: "Unselected",
            summary: "Tab item in unselected state."
        ) { _ in
            TabItemUnselectedStory()
        },
    ]
}

private struct TabItemSelectedStory: View {
    var body: some View {
        MoleculeStoryFrame {
            HStack(spacing: 0) {
                LSTabItem(icon: .map, label: "Map", selected: true) { }
                LSTabItem(icon: .compass, label: "Discover", selected: false) { }
                LSTabItem(icon: .clock, label: "Rides", selected: false) { }
            }
            .background(Color.white.opacity(0.1))
        }
    }
}

private struct TabItemUnselectedStory: View {
    var body: some View {
        MoleculeStoryFrame {
            HStack(spacing: 0) {
                LSTabItem(icon: .map, label: "Map", selected: false) { }
                LSTabItem(icon: .compass, label: "Discover", selected: true) { }
                LSTabItem(icon: .clock, label: "Rides", selected: false) { }
            }
            .background(Color.white.opacity(0.1))
        }
    }
}
