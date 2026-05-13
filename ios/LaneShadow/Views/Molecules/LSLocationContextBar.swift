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
            locationPill
                .frame(maxWidth: .infinity, alignment: .leading)

            Spacer(minLength: theme.space.xs)

            Button(action: handleModeTap) {
                modePill
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Location mode: \(mode.pillLabel)")
            .accessibilityIdentifier("lslocationcontextbar-mode-pill")
        }
        .padding(.horizontal, theme.space.xs)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lslocationcontextbar")
    }

    private var locationPill: some View {
        LSPill(size: .md) {
            HStack(spacing: theme.space.xs) {
                LSIcon(name: .pin, size: .sm, resolvedColorOverride: ContentColor.primary.resolved(in: theme))
                    .fixedSize()
                LSText(location, variant: .body.sm, color: .primary)
                    .lineLimit(1)
                    .truncationMode(.tail)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                .fill(LSSurfaceColorToken.card.resolved(in: theme))
        )
        .overlay(
            RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                .stroke(theme.colors.border.default, lineWidth: theme.borderWidth.hairline)
        )
    }

    private var modePill: some View {
        LSPill(size: .md) {
            LSText(mode.pillLabel, variant: .label.sm, color: .secondary)
        }
        .background(
            RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                .fill(LSSurfaceColorToken.card.resolved(in: theme))
        )
        .overlay(
            RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                .stroke(theme.colors.border.default, lineWidth: theme.borderWidth.hairline)
        )
    }

    func handleModeTap() {
        onModeChange()
    }
}
