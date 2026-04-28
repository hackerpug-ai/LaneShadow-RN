import LaneShadowTheme
import SwiftUI

/// LSCancelConfirmSheet — A centered confirmation sheet for Planning V02.
///
/// Renders a modal dialog asking the user to confirm cancellation
/// of the current planning operation.
public struct LSCancelConfirmSheet: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let body: String
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
        self.body = body
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
                .foregroundStyle(theme.colors.content.primary)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Body
            Text(body)
                .font(theme.type.opinion.sm.font)
                .italic()
                .foregroundStyle(theme.colors.content.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Actions
            HStack(spacing: theme.space.md) {
                // Keep button (tertiary)
                Button(action: onKeep) {
                    Text(keepLabel)
                        .font(theme.type.title.sm.font)
                        .foregroundStyle(theme.colors.content.secondary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(
                            RoundedRectangle(cornerRadius: theme.radius.lg)
                                .strokeBorder(
                                    theme.colors.border.default,
                                    lineWidth: theme.borderWidth.sm
                                )
                        )
                }
                .accessibilityIdentifier("cancel-confirm-keep")

                // Cancel button (signal)
                Button(action: onCancel) {
                    Text(cancelLabel)
                        .font(theme.type.title.sm.font)
                        .foregroundStyle(theme.colors.content.primary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(
                            RoundedRectangle(cornerRadius: theme.radius.lg)
                                .fill(theme.colors.surface.inset)
                        )
                }
                .accessibilityIdentifier("cancel-confirm-cancel")
            }
        }
        .padding(theme.space.lg)
        .background(
            RoundedRectangle(cornerRadius: theme.radius.xl)
                .fill(theme.colors.surface.card)
        )
        .shadow(radius: theme.elevation.overlay)
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
