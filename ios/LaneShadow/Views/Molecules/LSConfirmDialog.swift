import LaneShadowTheme
import NativeTheme
import SwiftUI

/// A centered confirmation dialog with scrim backdrop.
///
/// Renders a modal dialog with a surface.scrim backdrop and surface.card
/// dialog surface. Used for confirmations like "Start a new ride?"
public struct LSConfirmDialog: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let message: String?
    private let cancelTitle: String
    private let confirmTitle: String
    private let onCancel: @Sendable () -> Void
    private let onConfirm: @Sendable () -> Void
    private let isPresented: Bool

    public init(
        title: String,
        message: String? = nil,
        cancelTitle: String = "Cancel",
        confirmTitle: String = "Confirm",
        isPresented: Bool = true,
        onCancel: @Sendable @escaping () -> Void,
        onConfirm: @Sendable @escaping () -> Void
    ) {
        self.title = title
        self.message = message
        self.cancelTitle = cancelTitle
        self.confirmTitle = confirmTitle
        self.isPresented = isPresented
        self.onCancel = onCancel
        self.onConfirm = onConfirm
    }

    public var body: some View {
        ZStack {
            // Scrim backdrop
            LaneShadowTheme.color.surface.scrim
                .opacity(isPresented ? 1 : 0)
                .ignoresSafeArea()
                .onTapGesture {
                    onCancel()
                }

            // Dialog content
            if isPresented {
                VStack(spacing: theme.space.lg) {
                    // Title
                    LSText(title, variant: .opinion.lg)
                        .multilineTextAlignment(.center)
                        .accessibilityIdentifier("confirmdialog-title")

                    // Optional message
                    if let message {
                        LSText(message, variant: .body.md)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(theme.colors.content.secondary)
                            .accessibilityIdentifier("confirmdialog-message")
                    }

                    // Actions
                    HStack(spacing: theme.space.md) {
                        // Cancel button
                        LSButton(
                            cancelTitle,
                            variant: .tertiary,
                            size: .md,
                            action: onCancel
                        )
                        .accessibilityIdentifier("confirmdialog-cancel")

                        // Confirm button
                        LSButton(
                            confirmTitle,
                            variant: .signal,
                            size: .md,
                            action: onConfirm
                        )
                        .accessibilityIdentifier("confirmdialog-confirm")
                    }
                }
                .padding(theme.space.xl)
                .background(theme.colors.surface.card)
                .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
                .shadow(
                    color: theme.elevation.level4.shadowColor.opacity(theme.opacity.values["20"]!),
                    radius: 16,
                    x: 0,
                    y: 4
                )
                .padding(theme.space.xl)
                .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isPresented)
    }
}

#Preview {
    LSConfirmDialog(
        title: "Start a new ride?",
        message: "You have an active ride. Starting a new one will pause the current ride.",
        cancelTitle: "Cancel",
        confirmTitle: "Start new",
        isPresented: true,
        onCancel: {},
        onConfirm: {}
    )
}
