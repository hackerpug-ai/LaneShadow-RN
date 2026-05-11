import LaneShadowTheme
import NativeTheme
import SwiftUI

// MARK: - Animation Motion Extensions

extension Animation {
    /// Record dot pulse animation: reads from motion.recipe.recordDotPulse token
    /// - Duration: 1400ms (from token)
    /// - Easing: ease-in-out (from token)
    /// - Repeat: forever with autoreverse (from token)
    static func recordDotPulse(theme: Theme) -> Animation {
        let recipe = theme.motion.recipes["recordDotPulse"]
        let duration = TimeInterval(recipe?.duration ?? 1400) / 1000
        let easing = safeCubicBezierEasing(recipe?.easing ?? [])
        return Animation.timingCurve(
            easing[0],
            easing[1],
            easing[2],
            easing[3],
            duration: duration
        ).repeatForever(autoreverses: true)
    }
}

public enum LSTopBarTrailing {
    case none
    case newChip(action: () -> Void)
    case recordHighlight(isRecording: Bool)
}

public struct LSTopBar: View {
    @Environment(\.theme) private var theme

    private let title: String?
    private let metaText: String?
    private let headline: AttributedString?
    private let trailing: LSTopBarTrailing
    private let onMenuTap: () -> Void
    private let onNewTap: () -> Void

    public init(
        title: String? = nil,
        metaText: String? = nil,
        headline: AttributedString? = nil,
        trailing: LSTopBarTrailing = .newChip(action: {}),
        onMenuTap: @escaping () -> Void,
        onNewTap: @escaping () -> Void = {}
    ) {
        self.title = title
        self.metaText = metaText
        self.headline = headline
        self.trailing = trailing
        self.onMenuTap = onMenuTap
        self.onNewTap = onNewTap
    }

    public var body: some View {
        HStack(spacing: theme.space.sm) {
            hamburgerChip

            titleContent
                .frame(maxWidth: .infinity, minHeight: tapTargetSize, alignment: .center)

            trailingContent
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, theme.space.md)
        .padding(.top, theme.space.xs)
        .safeAreaInset(edge: .top, spacing: 0) {
            Color.clear.frame(height: 0)
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lstopbar")
    }

    private var hamburgerChip: some View {
        Button(action: onMenuTap) {
            LSGlassPanel(variant: .chrome, padding: .spacing3, cornerRadius: .md) {
                LSIcon(name: .menu, size: .sm, color: .primary)
            }
            .fixedSize(horizontal: true, vertical: false)
            .frame(width: tapTargetSize, height: tapTargetSize)
        }
        .buttonStyle(PlainButtonStyle())
        .contentShape(Rectangle())
        .accessibilityLabel("Menu")
        .accessibilityIdentifier("lstopbar-hamburger")
    }

    @ViewBuilder
    private var titleContent: some View {
        if headline != nil || title != nil || metaText != nil {
            VStack(spacing: theme.space.xs) {
                if let metaText {
                    LSText(metaText, variant: .label.sm, color: .secondary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                        .multilineTextAlignment(.center)
                        .accessibilityIdentifier("lstopbar-meta")
                }

                if let headline {
                    Text(headline)
                        .font(theme.type.opinion.md.font)
                        .foregroundStyle(LaneShadowTheme.color.content.primary)
                        .lineLimit(2)
                        .minimumScaleFactor(0.82)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .accessibilityIdentifier("lstopbar-headline")
                } else if let title {
                    LSText(title, variant: .opinion.md)
                        .lineLimit(2)
                        .minimumScaleFactor(0.82)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .accessibilityIdentifier("lstopbar-title")
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .accessibilityIdentifier("lstopbar-title")
        } else {
            Color.clear
                .accessibilityHidden(true)
        }
    }

    @ViewBuilder
    private var trailingContent: some View {
        switch trailing {
        case .none:
            Color.clear
                .frame(width: tapTargetSize, height: tapTargetSize)
                .accessibilityHidden(true)
        case let .newChip(action):
            newChip(action: action)
        case .recordHighlight:
            recordHighlightChip
        }
    }

    private func newChip(action: @escaping () -> Void) -> some View {
        Button(action: action) {
            LSGlassPanel(variant: .chrome, padding: .spacing3, cornerRadius: .md) {
                HStack(spacing: theme.space.xs) {
                    LSIcon(name: .plus, size: .sm, color: .primary)
                    LSText("NEW", variant: .label.md, color: .primary)
                }
            }
            .fixedSize(horizontal: true, vertical: false)
            .frame(minWidth: chipMinWidth, minHeight: chipSize)
        }
        .buttonStyle(PlainButtonStyle())
        .contentShape(Rectangle())
        .accessibilityLabel("New")
        .accessibilityIdentifier("lstopbar-new")
    }

    private var recordHighlightChip: some View {
        LSGlassPanel(variant: .chrome, padding: .spacing3, cornerRadius: .md) {
            HStack(spacing: theme.space.xs) {
                RecordPulsingDot()
                LSText("REC", variant: .label.md, color: .primary)
            }
        }
        .fixedSize(horizontal: true, vertical: false)
        .frame(minWidth: chipMinWidth, minHeight: chipSize)
        .accessibilityLabel("Recording")
        .accessibilityIdentifier("lstopbar-recording")
    }

    private var chipSize: CGFloat {
        theme.space.xxl + theme.space.lg + theme.space.sm
    }

    private var chipMinWidth: CGFloat {
        chipSize + theme.space.xxl + theme.space.sm
    }

    private var tapTargetSize: CGFloat {
        max(theme.touchTarget.minTouchTarget, chipSize)
    }

    private var recordingDotSize: CGFloat {
        theme.space.sm - theme.space.xs // 8 - 4 = 6, or keep as specific UI element size
    }
}

// MARK: - Record Pulsing Dot

struct RecordPulsingDot: View {
    @Environment(\.theme) private var theme
    @State private var isPulsing = false

    private let recordingDotSize: CGFloat = 6

    var body: some View {
        Circle()
            .fill(LaneShadowTheme.color.status.recording)
            .frame(width: recordingDotSize, height: recordingDotSize)
            .opacity(isPulsing ? 0.45 : 1.0)
            .animation(Animation.recordDotPulse(theme: theme), value: isPulsing)
            .onAppear {
                isPulsing = true
            }
    }
}
