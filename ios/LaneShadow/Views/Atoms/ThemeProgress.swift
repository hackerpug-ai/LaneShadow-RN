import LaneShadowTheme
import SwiftUI

struct ThemeProgress: View {
    @Environment(\.theme) private var theme

    let value: Double
    let maxValue: Double
    let isIndeterminate: Bool
    let accessibilityLabel: String?

    init(
        value: Double,
        maxValue: Double = 100,
        isIndeterminate: Bool = false,
        accessibilityLabel: String? = nil
    ) {
        self.value = value
        self.maxValue = maxValue
        self.isIndeterminate = isIndeterminate
        self.accessibilityLabel = accessibilityLabel
    }

    var body: some View {
        Group {
            if isIndeterminate {
                ProgressView()
                    .progressViewStyle(.linear)
            } else {
                ProgressView(value: min(max(value / max(maxValue, 1), 0), 1))
                    .progressViewStyle(.linear)
            }
        }
        .tint(theme.colors.primary.default)
        .frame(maxWidth: .infinity)
        .accessibilityLabel(accessibilityLabel ?? "ThemeProgress")
    }
}
