import LaneShadowTheme
import NativeTheme
import SwiftUI

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
                LSText(title, variant: .title.md)
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
            .frame(width: chipSize, height: chipSize)
        }
        .accessibilityLabel("Menu")
        .accessibilityIdentifier("lstopbar-hamburger")
    }

    @ViewBuilder
    private var trailingContent: some View {
        switch trailing {
        case .none:
            Color.clear
                .frame(width: chipSize, height: chipSize)
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
        }
        .accessibilityLabel("New")
        .accessibilityIdentifier("lstopbar-new")
    }

    private var recordHighlightChip: some View {
        LSGlassPanel(variant: .chrome, padding: .spacing3, cornerRadius: .md) {
            HStack(spacing: theme.space.xs) {
                Circle()
                    .fill(LaneShadowTheme.color.status.recording)
                    .frame(width: recordingDotSize, height: recordingDotSize)
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

    private var recordingDotSize: CGFloat {
        theme.space.sm - theme.space.xs // 8 - 4 = 6, or keep as specific UI element size
    }
}
