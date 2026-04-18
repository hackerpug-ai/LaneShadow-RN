import LaneShadowTheme
import SwiftUI

struct ThemeIcon: View {
    @Environment(\.theme) private var theme

    let name: String
    let size: CGFloat
    let color: Color?

    var body: some View {
        Image(systemName: sfSymbolName(for: name))
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .foregroundStyle(color ?? theme.colors.onSurface.default)
            .accessibilityLabel(name)
    }

    private func sfSymbolName(for symbol: String) -> String {
        switch symbol {
        case "search": "magnifyingglass"
        case "close": "xmark"
        case "location": "location.fill"
        case "drag-handle": "line.3.horizontal"
        case "sheet-handle": "line.3.horizontal.decrease"
        default: "questionmark.circle"
        }
    }
}
