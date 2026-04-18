import NativeSandbox
import SwiftUI

@MainActor
enum AtomsStories {
    static let all: [Story] = [
        Story(
            id: "atoms/theme-text/default",
            tier: .atom,
            component: "ThemeText",
            name: "Default",
            summary: "react-native/components/themed-text.tsx#Default"
        ) { _ in
            EmptyView()
        },
    ]
}
