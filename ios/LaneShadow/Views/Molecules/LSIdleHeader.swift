import LaneShadowTheme
import SwiftUI

/// Unified idle-screen floating header. Renders menu + idle context capsule
/// content + new-session affordance inside a single `LSGlassPanel` chip so
/// the three elements visually read as one. Replaces the older three-chip
/// `LSTopBar` layout on the idle screen only.
///
/// Authority: `.spec/design/system/views/mapapp/idle/README.md`
/// "TopBar Chip Paradigm".
public struct LSIdleHeader: View {
    @Environment(\.theme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let capsuleState: LSContextCapsule.CapsuleState
    private let isWarning: Bool
    private let onMenuTap: () -> Void
    private let onNewTap: () -> Void

    public init(
        capsuleState: LSContextCapsule.CapsuleState,
        isWarning: Bool = false,
        onMenuTap: @escaping () -> Void,
        onNewTap: @escaping () -> Void
    ) {
        self.capsuleState = capsuleState
        self.isWarning = isWarning
        self.onMenuTap = onMenuTap
        self.onNewTap = onNewTap
    }

    public var body: some View {
        LSGlassPanel(variant: .chrome, padding: .spacing3, cornerRadius: .md) {
            HStack(alignment: .center, spacing: theme.space.sm) {
                menuButton
                capsuleContent
                    .frame(maxWidth: .infinity, alignment: .leading)
                newButton
            }
        }
        .frame(minHeight: chipHeight)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lsidleheader")
    }

    // MARK: - Menu / new buttons

    private var menuButton: some View {
        Button(action: onMenuTap) {
            LSIcon(name: .menu, size: .sm, color: .primary)
        }
        .buttonStyle(.plain)
        .frame(width: actionSize, height: actionSize)
        .contentShape(Rectangle())
        .accessibilityLabel("Open sessions")
        .accessibilityIdentifier("lsidleheader-menu")
    }

    private var newButton: some View {
        Button(action: onNewTap) {
            LSIcon(name: .plus, size: .sm, color: .primary)
        }
        .buttonStyle(.plain)
        .frame(width: actionSize, height: actionSize)
        .contentShape(Rectangle())
        .accessibilityLabel("Start new session")
        .accessibilityIdentifier("lsidleheader-new")
    }

    // MARK: - Capsule content (headline + meta)

    @ViewBuilder
    private var capsuleContent: some View {
        switch capsuleState {
        case let .idle(headline, metaItems):
            idleContent(headline: headline, metaItems: metaItems)
        case let .planning(headline):
            planningContent(headline: headline)
        case let .route(name, metrics):
            idleContent(headline: name, metaItems: metrics)
        }
    }

    private func idleContent(
        headline: AttributedString,
        metaItems: [String]
    ) -> some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            Text(styledHeadline(headline))
                .font(theme.type.opinion.md.font)
                .lineLimit(1)
                .minimumScaleFactor(0.82)
                .accessibilityIdentifier("lsidleheader-capsule-headline")

            if !metaItems.isEmpty {
                metaRow(items: metaItems)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lsidleheader-capsule")
    }

    private func planningContent(headline: String) -> some View {
        Text(headline)
            .font(theme.type.opinion.md.font)
            .italic()
            .foregroundStyle(LaneShadowTheme.color.signal.default)
            .lineLimit(1)
            .accessibilityIdentifier("lsidleheader-capsule-headline")
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("lsidleheader-capsule")
    }

    // MARK: - Styling helpers (mirror LSContextCapsule recipe)

    private func styledHeadline(_ headline: AttributedString) -> AttributedString {
        var styled = headline
        styled.font = theme.type.opinion.md.font
        styled.foregroundColor = LaneShadowTheme.color.content.primary

        for run in styled.runs {
            guard let intent = run.inlinePresentationIntent else { continue }
            if intent.contains(.emphasized) || intent.contains(.stronglyEmphasized) {
                styled[run.range].font = theme.type.opinion.md.font.italic()
                styled[run.range].foregroundColor = LaneShadowTheme.color.signal.default
            }
        }
        return styled
    }

    private func metaRow(items: [String]) -> some View {
        let color = isWarning
            ? LaneShadowTheme.color.status.warning.default
            : LaneShadowTheme.color.signal.default
        return HStack(spacing: theme.space.xs) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                if index > 0 {
                    LSIcon(
                        name: .circleFill,
                        size: .xs,
                        resolvedColorOverride: color.opacity(0.45)
                    )
                    .scaleEffect(0.5)
                    .accessibilityHidden(true)
                }

                Text(item)
                    .font(theme.type.label.sm.font)
                    .foregroundStyle(color)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(item)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("lsidleheader-capsule-meta")
    }

    // MARK: - Sizing

    private var chipHeight: CGFloat {
        max(theme.touchTarget.minTouchTarget, theme.space.xxl + theme.space.lg + theme.space.sm)
    }

    private var actionSize: CGFloat {
        max(theme.touchTarget.minTouchTarget, theme.space.xxl + theme.space.lg)
    }
}
