import LaneShadowTheme
import NativeTheme
import SwiftUI
import UIKit

public struct LSContextCapsule: View {
    public enum CapsuleState: Equatable, Sendable {
        case idle(headline: AttributedString, metaItems: [String])
        case planning(headline: String)
        case route(name: AttributedString, metrics: [String])
    }

    @Environment(\.theme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static let pulseDurationSeconds = 1.4
    private static let metaDotOpacity = 0.45
    private static let metaDotScale = 0.5

    public let state: CapsuleState
    public let isWarning: Bool
    public let isSaved: Bool

    public init(
        state: CapsuleState,
        isWarning: Bool = false,
        isSaved: Bool = false
    ) {
        self.state = state
        self.isWarning = isWarning
        self.isSaved = isSaved
    }

    public var body: some View {
        let appearance = Self.resolvedAppearance(
            for: state,
            isWarning: isWarning,
            isSaved: isSaved,
            in: theme
        )
        let shape = RoundedRectangle(
            cornerRadius: appearance.cornerRadius,
            style: .continuous
        )
        let elevation = theme.elevation.level8

        Group {
            switch state {
            case let .idle(headline, metaItems):
                idleRouteLayout(
                    headline: styledHeadline(
                        headline,
                        baseColor: LaneShadowTheme.color.content.primary,
                        emphasisColor: LaneShadowTheme.color.signal.default
                    ),
                    headlineLabel: appearance.headlineText,
                    metaItems: metaItems,
                    metaFont: theme.type.label.sm.font,
                    metaColor: resolvedMetaColor(for: .idle)
                )
            case let .planning(headline):
                planningLayout(headline: headline)
            case let .route(name, metrics):
                idleRouteLayout(
                    headline: styledHeadline(
                        name,
                        baseColor: LaneShadowTheme.color.content.primary,
                        emphasisColor: LaneShadowTheme.color.content.primary
                    ),
                    headlineLabel: appearance.headlineText,
                    metaItems: metrics,
                    metaFont: LaneShadowTheme.typography.instrumentSm.font,
                    metaColor: LaneShadowTheme.color.content.tertiary
                )
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, theme.space.sm)
        .padding(.horizontal, theme.space.md)
        .background(LaneShadowTheme.color.surface.glass)
        .background(.ultraThinMaterial)
        .clipShape(shape)
        .overlay {
            shape
                .stroke(LaneShadowTheme.color.border.default, lineWidth: theme.borderWidth.thin)
        }
        .overlay {
            if isSaved, case .route = state {
                shape
                    .stroke(LaneShadowTheme.color.signal.default, lineWidth: theme.borderWidth.thin)
            }
        }
        .shadow(
            color: elevation.shadowColor.opacity(elevation.opacity),
            radius: elevation.radius,
            x: elevation.offsetX,
            y: elevation.offsetY
        )
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("lscontextcapsule")
    }

    private func idleRouteLayout(
        headline: AttributedString,
        headlineLabel: String,
        metaItems: [String],
        metaFont: Font,
        metaColor: Color
    ) -> some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            Text(headline)
                .font(theme.type.opinion.md.font)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(headlineLabel)
                .accessibilityIdentifier("lscontextcapsule-headline")

            if !metaItems.isEmpty {
                LSContextCapsuleMetaRow(
                    items: metaItems,
                    font: metaFont,
                    color: metaColor,
                    dotScale: Self.metaDotScale,
                    dotOpacity: Self.metaDotOpacity
                )
            }
        }
    }

    private func planningLayout(headline: String) -> some View {
        HStack(alignment: .center, spacing: theme.space.sm) {
            LSContextCapsulePulseDot(
                color: LaneShadowTheme.color.signal.default,
                diameter: theme.type.label.sm.fontSize,
                lineWidth: theme.borderWidth.thin,
                behavior: Self.planningPulseBehavior(
                    reduceMotion: reduceMotion,
                    in: theme
                )
            )

            Text(headline)
                .font(theme.type.opinion.md.font)
                .italic()
                .foregroundStyle(LaneShadowTheme.color.signal.default)
                .lineLimit(1)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(headline)
                .accessibilityIdentifier("lscontextcapsule-headline")
        }
    }

    private func styledHeadline(
        _ headline: AttributedString,
        baseColor: Color,
        emphasisColor: Color
    ) -> AttributedString {
        var styled = headline
        styled.font = theme.type.opinion.md.font
        styled.foregroundColor = baseColor

        for run in styled.runs {
            guard let intent = run.inlinePresentationIntent else {
                continue
            }

            if intent.contains(.emphasized) || intent.contains(.stronglyEmphasized) {
                styled[run.range].font = theme.type.opinion.md.font.italic()
                styled[run.range].foregroundColor = emphasisColor
            }
        }

        return styled
    }

    private func resolvedMetaColor(for state: CapsuleKind) -> Color {
        switch state {
        case .idle:
            isWarning ? LaneShadowTheme.color.status.warning.default : LaneShadowTheme.color.signal.default
        case .planning:
            LaneShadowTheme.color.signal.default
        case .route:
            LaneShadowTheme.color.content.tertiary
        }
    }
}

private struct LSContextCapsuleMetaRow: View {
    @Environment(\.theme) private var theme

    let items: [String]
    let font: Font
    let color: Color
    let dotScale: CGFloat
    let dotOpacity: Double

    var body: some View {
        HStack(spacing: theme.space.xs) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                if index > 0 {
                    LSIcon(
                        name: .circleFill,
                        size: .xs,
                        resolvedColorOverride: color.opacity(dotOpacity)
                    )
                    .scaleEffect(dotScale)
                    .accessibilityHidden(true)
                }

                Text(item)
                    .font(font)
                    .foregroundStyle(color)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(item)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("lscontextcapsule-meta")
    }
}

private struct LSContextCapsulePulseDot: View {
    @State private var isAnimating = false

    let color: Color
    let diameter: CGFloat
    let lineWidth: CGFloat
    let behavior: LSContextCapsulePulseBehavior

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: diameter, height: diameter)
            .overlay {
                if behavior.isAnimated {
                    Circle()
                        .stroke(color, lineWidth: lineWidth)
                        .scaleEffect(isAnimating ? 1.8 : 1)
                        .opacity(isAnimating ? 0 : 0.4)
                        .animation(
                            .easeInOut(duration: behavior.durationSeconds).repeatForever(autoreverses: true),
                            value: isAnimating
                        )
                        .onAppear {
                            isAnimating = true
                        }
                        .onDisappear {
                            isAnimating = false
                        }
                }
            }
            .accessibilityHidden(true)
            .accessibilityIdentifier("lscontextcapsule-pulse-dot")
    }
}
