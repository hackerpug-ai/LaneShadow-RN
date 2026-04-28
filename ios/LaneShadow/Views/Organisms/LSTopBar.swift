import LaneShadowTheme
import NativeTheme
import SwiftUI

// MARK: - Animation Motion Extensions

extension Animation {
    /// Record dot pulse animation: 1400ms ease-in-out, autoreversing
    ///
    /// TOKEN GAP: Design specifies 1400ms, but tokens only provide up to 600ms ("deliberate").
    /// Using 1400ms as specified in design until tokens are updated.
    static func recordDotPulse(theme: Theme) -> Animation {
        let duration: TimeInterval = 1.4 // 1400ms
        let easing = theme.motion.easing["standard"] ?? [0.4, 0.0, 0.2, 1.0]
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
    private let trailing: LSTopBarTrailing
    private let onMenuTap: () -> Void
    private let onNewTap: () -> Void

    public init(
        title: String? = nil,
        trailing: LSTopBarTrailing = .newChip(action: {}),
        onMenuTap: @escaping () -> Void,
        onNewTap: @escaping () -> Void = {}
    ) {
        self.title = title
        self.trailing = trailing
        self.onMenuTap = onMenuTap
        self.onNewTap = onNewTap
    }

    public var body: some View {
        HStack(spacing: theme.space.sm) {
            // Leading: Hamburger chip
            hamburgerChip

            // Center: Optional title
            if let title {
                Spacer()
                LSText(title, variant: .opinion.md)
                    .lineLimit(1)
                Spacer()
            } else {
                Spacer()
            }

            // Trailing: NEW chip or Record Highlight
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
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityLabel("Menu")
        .accessibilityIdentifier("lstopbar-hamburger")
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
            .frame(height: chipSize)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
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
        .frame(height: chipSize)
        .accessibilityLabel("Recording")
        .accessibilityIdentifier("lstopbar-recording")
    }

    private var chipSize: CGFloat {
        theme.space.xl + theme.space.md + theme.space.xs // 24 + 12 + 4 = 40
    }

    private var tapTargetSize: CGFloat {
        max(44, chipSize) // iOS HIG minimum tap target
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
