import LaneShadowTheme
import SwiftUI

// MARK: - Cancel Confirm Overlay

extension PlanningScreen {
    /// Cancel confirmation overlay (scrim + dialog sheet)
    var cancelConfirmOverlay: some View {
        ZStack {
            // Scrim
            LSScrim(blocking: true)
                .ignoresSafeArea()
                .accessibilityIdentifier("planningscreen-scrim")

            // Cancel confirm sheet
            VStack {
                Spacer()

                VStack(spacing: theme.space.md) {
                    // Title
                    Text("Cancel this plan?")
                        .font(theme.type.opinion.lg.font)
                        .foregroundStyle(LaneShadowTheme.color.content.primary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    // Body
                    Text("I've drawn one route already. You can back out now — but I'll toss what I have.")
                        .font(theme.type.opinion.sm.font)
                        .italic()
                        .foregroundStyle(LaneShadowTheme.color.content.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    // Actions
                    HStack(spacing: theme.space.md) {
                        // Keep button (tertiary)
                        Button(action: {}, label: {
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
                        })
                        .accessibilityIdentifier("cancel-confirm-keep")

                        // Cancel button (signal)
                        Button(action: {}, label: {
                            Text("Cancel plan")
                                .font(theme.type.title.sm.font)
                                .foregroundStyle(LaneShadowTheme.color.content.primary)
                                .frame(maxWidth: .infinity)
                                .frame(height: theme.space.xxl + theme.space.md)
                                .background(
                                    RoundedRectangle(cornerRadius: theme.radius.lg)
                                        .fill(LaneShadowTheme.color.surface.inset)
                                )
                        })
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
                .accessibilityIdentifier("planningscreen-cancel-confirm")

                Spacer()
                    .frame(height: theme.space.xl * 2) // Position from bottom
            }
        }
    }
}
