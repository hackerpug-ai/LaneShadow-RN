import LaneShadowTheme
import SwiftUI
import UIKit

/// Resolved-values helpers for ``LSMapUIViewRepresentable``.
///
/// Lives in a `+ResolvedValues.swift` file so it is exempt from the
/// `tokens:native-compliance` pre-commit hook — token→`UIColor` conversion
/// is a legitimate boundary between SwiftUI tokens and UIKit-based Mapbox
/// SDK consumers, but the hook's regex is intentionally strict about
/// `UIColor(...)` calls in non-allowed paths.
enum LSMapResolvedValues {
    /// Copper accent for the user-location puck fill.
    /// Resolves through `LaneShadowTheme.color.signal.default` so the puck
    /// matches the favourite-pin treatment and any future copper retune.
    static var puckFillUIColor: UIColor {
        UIColor(LaneShadowTheme.color.signal.default)
    }

    /// Fixed white ring around the puck. Intentionally non-theme-aware so
    /// the puck reads on both light and dark map styles.
    static var puckRingUIColor: UIColor {
        .white
    }
}
