// native-sandbox: configured
import LaneShadowTheme
import NativeSandbox
import NativeTheme
import SwiftUI

/// Color token control widget for sandbox inspector.
/// Renders a Picker with color swatches for each available token group.
public struct SandboxColorTokenControl: View {
    private let argType: ArgType
    private var argValues: ArgValues
    private let onUpdate: (ArgValues) -> Void

    @Environment(\.theme) private var theme

    public init(argType: ArgType, argValues: ArgValues, onUpdate: @escaping (ArgValues) -> Void) {
        self.argType = argType
        self.argValues = argValues
        self.onUpdate = onUpdate
    }

    public var body: some View {
        let colorGroups = TokenGroupResolver.resolveColorGroups(from: theme)
        let selectedGroup = argValues.string(argType.name)

        Picker(argType.label, selection: Binding(
            get: { selectedGroup },
            set: { newValue in
                var updated = argValues
                updated.set(argType.name, to: newValue)
                onUpdate(updated)
            }
        )) {
            ForEach(colorGroups, id: \.self) { groupName in
                HStack {
                    if let colorSet = TokenGroupResolver.resolveColorSet(for: groupName, from: theme) {
                        Rectangle()
                            .fill(colorSet.default)
                            .frame(width: 20, height: 20)
                            .cornerRadius(4)
                            .overlay(
                                RoundedRectangle(cornerRadius: 4)
                                    .stroke(.secondary.opacity(0.3), lineWidth: 1)
                            )
                    }
                    Text(groupName)
                }
                .tag(groupName)
            }
        }
        .pickerStyle(.menu)
    }
}

// MARK: - Token Group Resolver

/// Helper to resolve color token groups from LaneShadowTheme.
/// Used by SandboxColorTokenControl to populate dropdown options.
public enum TokenGroupResolver {
    /// Returns all available color group names from the theme.
    public static func resolveColorGroups(from theme: Theme) -> [String] {
        [
            "primary",
            "secondary",
            "tertiary",
            "success",
            "warning",
            "danger",
            "info",
            "surface",
            "background",
            "border",
            "input",
            "ring",
            "card",
            "popover",
            "accent",
            "muted",
            "divider",
            "scrim",
            "routeSelected",
            "routeAlternate",
        ]
    }

    /// Resolves a ColorSet for a given group name.
    public static func resolveColorSet(for groupName: String, from theme: Theme) -> ColorSet? {
        switch groupName {
        case "primary": theme.colors.primary
        case "secondary": theme.colors.secondary
        case "tertiary": theme.colors.tertiary
        case "success": theme.colors.success
        case "warning": theme.colors.warning
        case "danger": theme.colors.danger
        case "info": theme.colors.info
        case "surface": theme.colors.surface
        case "surfaceVariant": theme.colors.surfaceVariant
        case "background": theme.colors.background
        case "border": theme.colors.border
        case "input": theme.colors.input
        case "ring": theme.colors.ring
        case "card": theme.colors.card
        case "popover": theme.colors.popover
        case "accent": theme.colors.accent
        case "muted": theme.colors.muted
        case "divider": theme.colors.divider
        case "scrim": theme.colors.scrim
        case "routeSelected": theme.colors.routeSelected
        case "routeAlternate": theme.colors.routeAlternate
        default: nil
        }
    }
}
