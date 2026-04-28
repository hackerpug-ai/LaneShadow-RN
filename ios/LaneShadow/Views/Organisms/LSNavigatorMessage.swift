import LaneShadowTheme
import NativeTheme
import SwiftUI

public struct LSNavigatorMessage: View {
    @Environment(\.theme) private var theme

    private let indicatorDotSize: CGFloat = 5

    private let messageBody: String
    private let attachments: [LSRouteAttachment]
    private let pinned: Bool
    private let onPin: @Sendable () -> Void
    private let onDismiss: @Sendable () -> Void
    private let onRouteCardTap: @Sendable (String) -> Void
    @State private var isVisible: Bool = true

    public init(
        body: String,
        attachments: [LSRouteAttachment] = [],
        pinned: Bool = false,
        onPin: @Sendable @escaping () -> Void,
        onDismiss: @Sendable @escaping () -> Void,
        onRouteCardTap: @Sendable @escaping (String) -> Void = { _ in }
    ) {
        messageBody = body
        self.attachments = attachments
        self.pinned = pinned
        self.onPin = onPin
        self.onDismiss = onDismiss
        self.onRouteCardTap = onRouteCardTap
    }

    public var body: some View {
        if isVisible {
            LSGlassPanel(variant: .callout(accent: .signal)) {
                VStack(alignment: .leading, spacing: theme.space.sm) {
                    headerRow

                    LSText(messageBody, variant: .opinion.md)
                        .foregroundStyle(LaneShadowTheme.color.content.primary)

                    if !attachments.isEmpty {
                        attachmentStack
                    }

                    if pinned {
                        pinnedIndicator
                    }
                }
            }
            .task {
                // Auto-dismiss after 5000ms for unpinned messages
                try? await Task.sleep(nanoseconds: 5_000_000_000)
                guard !Task.isCancelled else { return }
                if !pinned {
                    onDismiss()
                }
            }
        }
    }
}

extension LSNavigatorMessage {
    private var attachmentStack: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            ForEach(Array(attachments.enumerated()), id: \.element.id) { index, attachment in
                LSRouteAttachmentCard(
                    route: LSRouteAttachmentCardRoute(
                        variant: attachment.isBest ? .best : (index == 1 ? .alt1 : .alt2),
                        title: attachment.label,
                        subtitle: attachment.description,
                        distance: attachment.distance,
                        duration: attachment.duration,
                        elevation: "", // Not provided by LSRouteAttachment
                        scenicRating: Int(attachment.scenicScore),
                        weather: attachment.weatherBadge.map { weather in
                            LSRouteAttachmentCardRoute.Weather(
                                condition: weatherCondition(from: weather.type),
                                label: weather.text
                            )
                        },
                        favoriteLabel: nil
                    ),
                    selected: index == 0, // First attachment is selected
                    compact: false,
                    onTap: { onRouteCardTap(attachment.id) }
                )
            }
        }
        .padding(.top, theme.space.xs)
    }

    private func weatherCondition(from type: LSWeatherBadgeType) -> WeatherCondition {
        switch type {
        case .clear:
            .clear
        case .rain:
            .rain
        case .wind:
            .wind
        case .cloudy:
            .storm // Map cloudy to storm as closest equivalent
        }
    }

    private var headerRow: some View {
        HStack(alignment: .top, spacing: theme.space.xs) {
            compassChip

            VStack(alignment: .leading, spacing: theme.space.xs) {
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
                .opacity(theme.opacity.values["20"]!)
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
                resolvedColorOverride: pinned ? LaneShadowTheme.color.signal.default : LaneShadowTheme.color.content
                    .tertiary
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(pinned ? "Unpin message" : "Pin message")
        .accessibilityIdentifier("navigatormessage-pin")
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
        .accessibilityIdentifier("navigatormessage-dismiss")
    }

    private var pinnedIndicator: some View {
        HStack(spacing: theme.space.xs) {
            Circle()
                .fill(LaneShadowTheme.color.signal.default)
                .frame(width: indicatorDotSize, height: indicatorDotSize)

            LSText("Pinned — will not auto-dismiss", variant: .label.sm)
                .foregroundStyle(LaneShadowTheme.color.signal.default)
        }
        .padding(.top, theme.space.xs)
        .padding(.bottom, -theme.space.xs)
    }
}
