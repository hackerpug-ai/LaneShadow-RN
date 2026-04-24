import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// Molecule stories — Sprint 4 molecule components.
@MainActor
enum MoleculesStories {
    static let all: [Story] = LSFormFieldStories.all + LSTabItemStories.all + LSEmptyStateStories
        .all + LSChatInputStories.all
}
