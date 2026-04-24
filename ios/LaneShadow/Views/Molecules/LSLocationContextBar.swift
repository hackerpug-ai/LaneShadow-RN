import LaneShadowTheme
import NativeTheme
import SwiftUI

public enum LSLocationContextMode: String, CaseIterable, Sendable {
    case auto
    case manual

    var pillLabel: String {
        rawValue.uppercased()
    }
}

public struct LSLocationContextBar: View {
    @Environment(\.theme) private var theme

    let location: String
    let mode: LSLocationContextMode
    let onModeChange: () -> Void

    public init(
        location: String,
        mode: LSLocationContextMode,
        onModeChange: @escaping () -> Void
    ) {
        self.location = location
        self.mode = mode
        self.onModeChange = onModeChange
    }

    public var body: some View {
        HStack(spacing: 0) {
            LSTagPill(icon: .pin, label: location)
                .frame(maxWidth: .infinity, alignment: .leading)

            Spacer(minLength: theme.space.xs)

            Button(action: handleModeTap) {
                LSTagPill(label: mode.pillLabel)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Location mode: \(mode.pillLabel)")
            .accessibilityIdentifier("lslocationcontextbar-mode-pill")
        }
        .padding(.horizontal, theme.space.xs)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lslocationcontextbar")
    }

    func handleModeTap() {
        onModeChange()
    }
}
