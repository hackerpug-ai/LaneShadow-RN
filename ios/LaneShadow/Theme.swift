import SwiftUI

enum ThemeColor {
    static let primaryText = Color("LaneShadowPrimaryText")
    static let secondaryText = Color("LaneShadowSecondaryText")
}

enum ThemeSpacing {
    static let large: CGFloat = 24
}

enum ThemeTypography {
    static let title = Font.system(.title2, design: .rounded).weight(.semibold)
    static let label = Font.system(.headline, design: .rounded).weight(.medium)
    static let body = Font.system(.body, design: .default)
}
