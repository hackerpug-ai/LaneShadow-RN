import LaneShadowTheme
import SwiftUI

/// LSCancelConfirmSheet — A centered confirmation sheet for Planning V02.
///
/// Renders a modal dialog asking the user to confirm cancellation
/// of the current planning operation.
public struct LSCancelConfirmSheet: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let sheetBody: String
    private let keepLabel: String
    private let cancelLabel: String
    private let onKeep: () -> Void
    private let onCancel: () -> Void

    public init(
        title: String = "Cancel this plan?",
        body: String,
        keepLabel: String = "Keep thinking",
        cancelLabel: String = "Cancel plan",
        onKeep: @escaping () -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.title = title
        sheetBody = body
        self.keepLabel = keepLabel
        self.cancelLabel = cancelLabel
        self.onKeep = onKeep
        self.onCancel = onCancel
    }

    public var body: some View {
        VStack(spacing: theme.space.md) {
            // Title
            Text(title)
                .font(theme.type.opinion.lg.font)
                .foregroundStyle(theme.colors.onSurface.default)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Body
            Text(sheetBody)
                .font(theme.type.opinion.sm.font)
                .italic()
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.7))
                .frame(maxWidth: .infinity, alignment: .leading)

            // Actions
            HStack(spacing: theme.space.md) {
                // Keep button (tertiary)
                Button(action: onKeep) {
                    Text(keepLabel)
                        .font(theme.type.title.sm.font)
                        .foregroundStyle(theme.colors.onSurface.default.opacity(0.7))
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(
                            RoundedRectangle(cornerRadius: theme.radius.lg)
                                .strokeBorder(
                                    theme.colors.border.default,
                                    lineWidth: theme.borderWidth.thin
                                )
                        )
                }
                .accessibilityIdentifier("cancel-confirm-keep")

                // Cancel button (signal)
                Button(action: onCancel) {
                    Text(cancelLabel)
                        .font(theme.type.title.sm.font)
                        .foregroundStyle(theme.colors.onSurface.default)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(
                            RoundedRectangle(cornerRadius: theme.radius.lg)
                                .fill(theme.colors.surface.default)
                        )
                }
                .accessibilityIdentifier("cancel-confirm-cancel")
            }
        }
        .padding(theme.space.lg)
        .background(
            RoundedRectangle(cornerRadius: theme.radius.xl)
                .fill(theme.colors.surface.default)
        )
        .shadow(
            color: theme.elevation.level2.shadowColor,
            radius: theme.elevation.level2.radius,
            x: theme.elevation.level2.offsetX,
            y: theme.elevation.level2.offsetY
        )
        .padding(.horizontal, theme.space.md)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Cancel planning confirmation")
    }
}

// MARK: - Preview

#Preview {
    ZStack {
        // Simulate scrim background
        Color.black.opacity(0.4)
            .ignoresSafeArea()

        VStack {
            Spacer()

            LSCancelConfirmSheet(
                body: "I've drawn one route already. You can back out now — but I'll toss what I have.",
                onKeep: {},
                onCancel: {}
            )

            Spacer()
                .frame(height: 200) // Simulate bottom sheet positioning
        }
    }
}
