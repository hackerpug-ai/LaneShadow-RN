import LaneShadowTheme
import SwiftUI

/// Size variants for LSPill component
///
/// Maps to sizing tokens:
/// - `.sm` → sizing.pill.sm (24pt)
/// - `.md` → sizing.pill.md (32pt)
/// - `.lg` → sizing.pill.lg (40pt)
public enum PillSize: Sendable {
    case sm
    case md
    case lg

    /// Height in points for this size from theme tokens
    func height(in theme: Theme) -> CGFloat {
        switch self {
        case .sm:
            24 // sizing.pill.sm
        case .md:
            32 // sizing.pill.md
        case .lg:
            40 // sizing.pill.lg
        }
    }
}
