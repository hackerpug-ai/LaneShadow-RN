import LaneShadowTheme
import NativeTheme
import SwiftUI

public struct LSNavigatorMessage: View {
    @Environment(\.theme) private var theme

    private let messageBody: String
    private let pinned: Bool
    private let onPin: @Sendable () -> Void
    private let onDismiss: @Sendable () -> Void

    public init(
        body: String,
        pinned: Bool = false,
        onPin: @Sendable @escaping () -> Void,
        onDismiss: @Sendable @escaping () -> Void
    ) {
        self.messageBody = body
        self.pinned = pinned
        self.onPin = onPin
        self.onDismiss = onDismiss
    }

    public var body: some View {
        LSGlassPanel(variant: .callout(accent: .signal)) {
            VStack(alignment: .leading, spacing: theme.space.sm) {
                headerRow

                LSText(messageBody, variant: .heading.md)
                    .foregroundStyle(LaneShadowTheme.color.content.primary)

                if pinned {
                    pinnedIndicator
                }
            }
        }
    }
}

extension LSNavigatorMessage {
    private var headerRow: some View {
        HStack(alignment: .top, spacing: theme.space.xs) {
            compassChip

            VStack(alignment: .leading, spacing: 2) {
                LSText("THE NAVIGATOR", variant: .label.sm)
                    .foregroundStyle(LaneShadowTheme.color.signal.default)
            }

            Spacer(minLength: 0)

            HStack(spacing: theme.space.xs) {
                pinButton
                dismissButton
            }
        }
    }

    private var compassChip: some View {
        LSPill(size: .sm) {
            LSIcon(
                name: .compass,
                size: .xs,
                resolvedColorOverride: LaneShadowTheme.color.signal.default
            )
        }
        .background(
            Circle()
                .fill(LaneShadowTheme.color.signal.whisper)
                .opacity(0.22)
        )
        .overlay(
            Circle()
                .stroke(LaneShadowTheme.color.signal.tint, lineWidth: theme.borderWidth.hairline)
        )
    }

    private var pinButton: some View {
        Button(action: onPin) {
            LSIcon(
                name: pinned ? .bookmarkFill : .bookmark,
                size: .sm,
                resolvedColorOverride: pinned ? LaneShadowTheme.color.signal.default : LaneShadowTheme.color.content.tertiary
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(pinned ? "Unpin message" : "Pin message")
    }

    private var dismissButton: some View {
        Button(action: onDismiss) {
            LSIcon(
                name: .close,
                size: .sm,
                resolvedColorOverride: LaneShadowTheme.color.content.tertiary
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Dismiss message")
    }

    private var pinnedIndicator: some View {
        HStack(spacing: theme.space.xs) {
            Circle()
                .fill(LaneShadowTheme.color.signal.default)
                .frame(width: 5, height: 5)

            LSText("Pinned — will not auto-dismiss", variant: .label.sm)
                .foregroundStyle(LaneShadowTheme.color.signal.default)
        }
        .padding(.top, theme.space.xs)
        .padding(.bottom, -theme.space.xs)
    }
}
