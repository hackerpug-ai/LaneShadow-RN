import LaneShadowTheme
import SwiftUI

struct ThemeSlider: View {
    @Environment(\.theme) private var theme

    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    let isEnabled: Bool

    init(
        value: Binding<Double>,
        range: ClosedRange<Double> = 0 ... 1,
        step: Double = 0.1,
        isEnabled: Bool = true
    ) {
        _value = value
        self.range = range
        self.step = step
        self.isEnabled = isEnabled
    }

    var body: some View {
        Slider(value: $value, in: range, step: step)
            .tint(theme.colors.primary.default)
            .disabled(!isEnabled)
            .opacity(isEnabled ? 1 : 0.7)
            .accessibilityLabel("ThemeSlider")
    }
}
