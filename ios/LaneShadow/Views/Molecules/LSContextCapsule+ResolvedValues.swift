import LaneShadowTheme
import NativeTheme
import SwiftUI
import UIKit

struct LSContextCapsuleAppearance: Equatable {
    let headlineText: String
    let emphasizedText: [String]
    let headlineTypographyToken: String
    let headlineColorToken: String
    let emphasisColorToken: String
    let metaItems: [String]
    let metaTypographyToken: String?
    let metaColorToken: String?
    let containerBackgroundToken: String
    let containerBorderToken: String
    let cornerRadius: CGFloat
    let savedOverlayColorToken: String?
    let savedOverlayLineWidth: CGFloat?
}

struct LSContextCapsulePulseBehavior: Equatable {
    let isAnimated: Bool
    let colorToken: String
    let durationSeconds: Double
}

struct LSContextCapsuleResolvedThemeColors: Equatable {
    let surfaceGlass: String
    let contentPrimary: String
    let signalDefault: String
}

extension LSContextCapsule {
    static func resolvedAppearance(
        for state: CapsuleState,
        isWarning: Bool,
        isSaved: Bool,
        in theme: Theme
    ) -> LSContextCapsuleAppearance {
        let kind = capsuleKind(for: state)

        return LSContextCapsuleAppearance(
            headlineText: plainText(from: state),
            emphasizedText: emphasizedSegments(from: state),
            headlineTypographyToken: "type.opinion.md",
            headlineColorToken: headlineColorToken(for: kind),
            emphasisColorToken: kind == .route ? "color.content.primary" : "color.signal.default",
            metaItems: metaItems(for: state),
            metaTypographyToken: metaTypographyToken(for: kind),
            metaColorToken: metaColorToken(for: kind, isWarning: isWarning),
            containerBackgroundToken: "color.surface.glass",
            containerBorderToken: "color.border.default",
            cornerRadius: theme.radius.lg,
            savedOverlayColorToken: isSaved && kind == .route ? "color.signal.default" : nil,
            savedOverlayLineWidth: isSaved && kind == .route ? theme.borderWidth.thin : nil
        )
    }

    static func planningPulseBehavior(
        reduceMotion: Bool,
        in _: Theme
    ) -> LSContextCapsulePulseBehavior {
        LSContextCapsulePulseBehavior(
            isAnimated: !reduceMotion,
            colorToken: "color.signal.default",
            durationSeconds: pulseDurationSeconds
        )
    }

    static func resolvedThemeColors(for interfaceStyle: UIUserInterfaceStyle) -> LSContextCapsuleResolvedThemeColors {
        let traitCollection = UITraitCollection(userInterfaceStyle: interfaceStyle)

        return LSContextCapsuleResolvedThemeColors(
            surfaceGlass: resolvedColorDescription(
                LaneShadowTheme.color.surface.glass,
                traitCollection: traitCollection
            ),
            contentPrimary: resolvedColorDescription(
                LaneShadowTheme.color.content.primary,
                traitCollection: traitCollection
            ),
            signalDefault: resolvedColorDescription(
                LaneShadowTheme.color.signal.default,
                traitCollection: traitCollection
            )
        )
    }

    private static func metaTypographyToken(for kind: CapsuleKind) -> String? {
        switch kind {
        case .idle:
            "type.label.sm"
        case .planning:
            nil
        case .route:
            "type.instrument.sm"
        }
    }

    private static func metaColorToken(
        for kind: CapsuleKind,
        isWarning: Bool
    ) -> String? {
        switch kind {
        case .idle:
            isWarning ? "color.status.warning.default" : "color.signal.default"
        case .planning:
            nil
        case .route:
            "color.content.tertiary"
        }
    }

    private static func headlineColorToken(for kind: CapsuleKind) -> String {
        switch kind {
        case .idle:
            "color.content.primary"
        case .planning:
            "color.signal.default"
        case .route:
            "color.content.primary"
        }
    }

    private static func metaItems(for state: CapsuleState) -> [String] {
        switch state {
        case let .idle(_, metaItems):
            metaItems
        case .planning:
            []
        case let .route(_, metrics):
            metrics
        }
    }

    private static func capsuleKind(for state: CapsuleState) -> CapsuleKind {
        switch state {
        case .idle:
            .idle
        case .planning:
            .planning
        case .route:
            .route
        }
    }

    private static func plainText(from state: CapsuleState) -> String {
        switch state {
        case let .idle(headline, _):
            String(headline.characters)
        case let .planning(headline):
            headline
        case let .route(name, _):
            String(name.characters)
        }
    }

    private static func emphasizedSegments(from state: CapsuleState) -> [String] {
        let attributed: AttributedString

        switch state {
        case let .idle(headline, _):
            attributed = headline
        case .planning:
            return []
        case let .route(name, _):
            attributed = name
        }

        return attributed.runs.compactMap { run in
            guard let intent = run.inlinePresentationIntent else {
                return nil
            }
            guard intent.contains(.emphasized) || intent.contains(.stronglyEmphasized) else {
                return nil
            }

            return String(attributed[run.range].characters)
        }
    }

    private static func resolvedColorDescription(
        _ color: Color,
        traitCollection: UITraitCollection
    ) -> String {
        let resolved = UIColor(color).resolvedColor(with: traitCollection)
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        resolved.getRed(&red, green: &green, blue: &blue, alpha: &alpha)

        return "\(red)-\(green)-\(blue)-\(alpha)"
    }
}

enum CapsuleKind {
    case idle
    case planning
    case route
}
