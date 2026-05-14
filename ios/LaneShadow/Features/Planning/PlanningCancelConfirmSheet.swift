import LaneShadowTheme
import SwiftUI

/// PlanningCancelConfirmSheet — Confirmation dialog for cancelling active planning session.
///
/// Renders a centered sheet with title, body copy, and two buttons: "Keep thinking" (dismiss)
/// and "Cancel plan" (confirm cancellation). Scrim is rendered separately by the parent view.
/// Uses semantic design tokens exclusively for all colors, spacing, and typography.
public struct PlanningCancelConfirmSheet: View {
    @Environment(\.theme) private var theme

    private let onConfirm: () -> Void
    private let onDismiss: () -> Void
    private let sheetTitle: String
    private let sheetBody: String

    public init(
        title: String = "Cancel this plan?",
        body: String = "I've drawn one route already. You can back out now — but I'll toss what I have.",
        onConfirm: @escaping () -> Void,
        onDismiss: @escaping () -> Void
    ) {
        self.sheetTitle = title
        self.sheetBody = body
        self.onConfirm = onConfirm
        self.onDismiss = onDismiss
    }

    public var body: some View {
        VStack {
            Spacer()

            VStack(spacing: theme.space.md) {
                // Title
                Text(sheetTitle)
                    .font(theme.type.opinion.lg.font)
                    .foregroundStyle(LaneShadowTheme.color.content.primary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                // Body
                Text(sheetBody)
                    .font(theme.type.opinion.sm.font)
                    .italic()
                    .foregroundStyle(LaneShadowTheme.color.content.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                // Actions
                HStack(spacing: theme.space.md) {
                    // Keep button (tertiary)
                    Button(action: onDismiss) {
                        Text("Keep thinking")
                            .font(theme.type.title.sm.font)
                            .foregroundStyle(LaneShadowTheme.color.content.secondary)
                            .frame(maxWidth: .infinity)
                            .frame(height: theme.space.xxl + theme.space.md)
                            .background(
                                RoundedRectangle(cornerRadius: theme.radius.lg)
                                    .strokeBorder(
                                        LaneShadowTheme.color.border.default,
                                        lineWidth: theme.borderWidth.hairline
                                    )
                            )
                    }
                    .accessibilityIdentifier("cancel-confirm-keep")

                    // Cancel button (signal)
                    Button(action: onConfirm) {
                        Text("Cancel plan")
                            .font(theme.type.title.sm.font)
                            .foregroundStyle(LaneShadowTheme.color.content.primary)
                            .frame(maxWidth: .infinity)
                            .frame(height: theme.space.xxl + theme.space.md)
                            .background(
                                RoundedRectangle(cornerRadius: theme.radius.lg)
                                    .fill(LaneShadowTheme.color.surface.inset)
                            )
                    }
                    .accessibilityIdentifier("cancel-confirm-cancel")
                }
            }
            .padding(theme.space.lg)
            .background(
                RoundedRectangle(cornerRadius: theme.radius.xl)
                    .fill(LaneShadowTheme.color.surface.card)
            )
            .shadow(
                color: theme.elevation.level1.shadowColor,
                radius: theme.elevation.level1.radius,
                x: theme.elevation.level1.offsetX,
                y: theme.elevation.level1.offsetY
            )
            .padding(.horizontal, theme.space.md)
            .accessibilityIdentifier("planning-cancel-confirm-sheet")

            Spacer()
                .frame(height: theme.space.xl * 2) // Position from bottom
        }
    }
}

#Preview {
    ZStack {
        LSScrim(blocking: true)
            .ignoresSafeArea()

        PlanningCancelConfirmSheet(
            onConfirm: {
                print("Cancel confirmed")
            },
            onDismiss: {
                print("Keep thinking")
            }
        )
    }
}
