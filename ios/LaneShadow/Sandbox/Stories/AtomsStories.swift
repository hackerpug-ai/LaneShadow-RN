import LaneShadowTheme
import NativeSandbox
import SwiftUI

@MainActor
enum AtomsStories {
    static let all: [Story] = [
        Story(
            id: "atoms/theme-text/default",
            tier: .atom,
            component: "ThemeText",
            name: "Default",
            summary: "react-native/components/themed-text.tsx#Default"
        ) { _ in
            AtomsTextStoryView(isEmphasis: false)
        },
        Story(
            id: "atoms/theme-text/emphasis",
            tier: .atom,
            component: "ThemeText",
            name: "Emphasis",
            summary: "react-native/components/themed-text.tsx#Emphasis"
        ) { _ in
            AtomsTextStoryView(isEmphasis: true)
        },
        Story(
            id: "atoms/theme-background/surface",
            tier: .atom,
            component: "ThemeBackground",
            name: "Surface",
            summary: "react-native/components/themed-view.tsx#Surface"
        ) { _ in
            AtomsBackgroundStoryView(variant: .surface)
        },
        Story(
            id: "atoms/theme-background/surface-variant",
            tier: .atom,
            component: "ThemeBackground",
            name: "SurfaceVariant",
            summary: "react-native/components/themed-view.tsx#SurfaceVariant"
        ) { _ in
            AtomsBackgroundStoryView(variant: .surfaceVariant)
        },
        Story(
            id: "atoms/theme-icon/default",
            tier: .atom,
            component: "ThemeIcon",
            name: "Default",
            summary: "react-native/components/ui/icon-symbol.tsx#Default"
        ) { _ in
            AtomsIconStoryView(isAccent: false)
        },
        Story(
            id: "atoms/theme-icon/accent",
            tier: .atom,
            component: "ThemeIcon",
            name: "Accent",
            summary: "react-native/components/ui/icon-symbol.tsx#Accent"
        ) { _ in
            AtomsIconStoryView(isAccent: true)
        },
        Story(
            id: "atoms/theme-separator/horizontal",
            tier: .atom,
            component: "ThemeSeparator",
            name: "Horizontal",
            summary: "react-native/components/ui/separator.tsx#Horizontal"
        ) { _ in
            AtomsSeparatorStoryView(orientation: .horizontal)
        },
        Story(
            id: "atoms/theme-separator/vertical",
            tier: .atom,
            component: "ThemeSeparator",
            name: "Vertical",
            summary: "react-native/components/ui/separator.tsx#Vertical"
        ) { _ in
            AtomsSeparatorStoryView(orientation: .vertical)
        },
        Story(
            id: "atoms/theme-drag-handle/default",
            tier: .atom,
            component: "ThemeDragHandle",
            name: "Default",
            summary: "react-native/components/ui/drag-handle.tsx#Default"
        ) { _ in
            AtomsDragHandleStoryView(active: false)
        },
        Story(
            id: "atoms/theme-drag-handle/active",
            tier: .atom,
            component: "ThemeDragHandle",
            name: "Active",
            summary: "react-native/components/ui/drag-handle.tsx#Active"
        ) { _ in
            AtomsDragHandleStoryView(active: true)
        },
        Story(
            id: "atoms/theme-sheet-handle/default",
            tier: .atom,
            component: "ThemeSheetHandle",
            name: "Default",
            summary: "react-native/components/sheets/sheet-handle.tsx#Default"
        ) { _ in
            AtomsSheetHandleStoryView(expanded: false)
        },
        Story(
            id: "atoms/theme-sheet-handle/expanded",
            tier: .atom,
            component: "ThemeSheetHandle",
            name: "Expanded",
            summary: "react-native/components/sheets/sheet-handle.tsx#Expanded"
        ) { _ in
            AtomsSheetHandleStoryView(expanded: true)
        },
        Story(
            id: "atoms/theme-button/default",
            tier: .atom,
            component: "ThemeButton",
            name: "Default",
            summary: "react-native/components/ui/button.tsx#Default"
        ) { _ in
            ThemeButtonStoryView(variant: .default, isLoading: false)
        },
        Story(
            id: "atoms/theme-button/loading",
            tier: .atom,
            component: "ThemeButton",
            name: "Loading",
            summary: "react-native/components/ui/button.tsx#Loading"
        ) { _ in
            ThemeButtonStoryView(variant: .secondary, isLoading: true)
        },
        Story(
            id: "atoms/theme-primary-button/default",
            tier: .atom,
            component: "ThemePrimaryButton",
            name: "Default",
            summary: "react-native/components/ui/primary-button.tsx#Default"
        ) { _ in
            ThemePrimaryButtonStoryView()
        },
        Story(
            id: "atoms/theme-input/default",
            tier: .atom,
            component: "ThemeInput",
            name: "Default",
            summary: "react-native/components/ui/input.tsx#Default"
        ) { _ in
            ThemeInputStoryView(isError: false)
        },
        Story(
            id: "atoms/theme-input/error",
            tier: .atom,
            component: "ThemeInput",
            name: "Error",
            summary: "react-native/components/ui/input.tsx#Error"
        ) { _ in
            ThemeInputStoryView(isError: true)
        },
        Story(
            id: "atoms/theme-textarea/default",
            tier: .atom,
            component: "ThemeTextarea",
            name: "Default",
            summary: "react-native/components/ui/textarea.tsx#Default"
        ) { _ in
            ThemeTextareaStoryView()
        },
        Story(
            id: "atoms/theme-bottom-sheet-input/default",
            tier: .atom,
            component: "ThemeBottomSheetInput",
            name: "Default",
            summary: "react-native/components/ui/bottom-sheet-input.tsx#Default"
        ) { _ in
            ThemeBottomSheetInputStoryView()
        },
        Story(
            id: "atoms/theme-switch/on",
            tier: .atom,
            component: "ThemeSwitch",
            name: "On",
            summary: "react-native/components/ui/switch.tsx#Checked"
        ) { _ in
            ThemeSwitchStoryView()
        },
        Story(
            id: "atoms/theme-toggle/pressed",
            tier: .atom,
            component: "ThemeToggle",
            name: "Pressed",
            summary: "react-native/components/ui/toggle.tsx#Pressed"
        ) { _ in
            ThemeToggleStoryView()
        },
        Story(
            id: "atoms/theme-checkbox/checked",
            tier: .atom,
            component: "ThemeCheckbox",
            name: "Checked",
            summary: "react-native/components/ui/checkbox.tsx#Checked"
        ) { _ in
            ThemeCheckboxStoryView()
        },
        Story(
            id: "atoms/theme-slider/default",
            tier: .atom,
            component: "ThemeSlider",
            name: "Default",
            summary: "react-native/components/ui/slider.tsx#Default"
        ) { _ in
            ThemeSliderStoryView()
        },
    ]
}

private struct AtomsTextStoryView: View {
    @Environment(\.theme) private var theme

    let isEmphasis: Bool

    var body: some View {
        ThemeBackground(variant: .surface) {
            VStack(alignment: .leading, spacing: theme.space.sm) {
                ThemeText(
                    "ThemeText \(isEmphasis ? "Emphasis" : "Default")",
                    variant: isEmphasis ? .titleLg : .bodyMd
                )
                .accessibilityLabel("ThemeText Story Title")

                ThemeText(
                    "Token-driven typography for light and dark parity.",
                    variant: .labelMd,
                    color: theme.colors.muted.default
                )
            }
        }
        .safeAreaPadding(theme.space.sm)
        .animation(.default, value: isEmphasis)
    }
}

private struct AtomsBackgroundStoryView: View {
    @Environment(\.theme) private var theme

    let variant: ThemeBackgroundVariant

    var body: some View {
        ThemeBackground(variant: variant) {
            ThemeText("ThemeBackground \(variant.rawValue)", variant: .bodyMd)
                .accessibilityLabel("ThemeBackground Label")
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .safeAreaPadding(theme.space.sm)
    }
}

private struct AtomsIconStoryView: View {
    @Environment(\.theme) private var theme

    let isAccent: Bool

    var body: some View {
        ThemeBackground(variant: .surfaceVariant) {
            HStack(spacing: theme.space.md) {
                ThemeIcon(
                    name: isAccent ? "location" : "search",
                    size: theme.space.xl,
                    color: isAccent ? theme.colors.accent.default : nil
                )
                ThemeText(isAccent ? "Accent Icon" : "Default Icon", variant: .bodyMd)
            }
            .accessibilityLabel("ThemeIcon Row")
        }
        .safeAreaPadding(theme.space.sm)
        .animation(.default, value: isAccent)
    }
}

private struct AtomsSeparatorStoryView: View {
    @Environment(\.theme) private var theme

    let orientation: ThemeSeparatorOrientation

    var body: some View {
        ThemeBackground(variant: .surface) {
            Group {
                if orientation == .horizontal {
                    VStack(alignment: .leading, spacing: theme.space.sm) {
                        ThemeText("Above", variant: .labelMd)
                        ThemeSeparator(orientation: .horizontal)
                        ThemeText("Below", variant: .labelMd)
                    }
                } else {
                    HStack(spacing: theme.space.sm) {
                        ThemeText("Left", variant: .labelMd)
                        ThemeSeparator(orientation: .vertical)
                            .frame(height: theme.space.xxl)
                        ThemeText("Right", variant: .labelMd)
                    }
                }
            }
            .accessibilityLabel("ThemeSeparator Layout")
        }
        .safeAreaPadding(theme.space.sm)
    }
}

private struct AtomsDragHandleStoryView: View {
    @Environment(\.theme) private var theme

    let active: Bool

    var body: some View {
        VStack(spacing: theme.space.md) {
            Capsule(style: .continuous)
                .fill(active ? theme.colors.primary.default : theme.colors.divider.default)
                .frame(width: active ? theme.space.xxxl : theme.space.xxl, height: max(theme.space.xs / 2, 1))
                .accessibilityLabel("ThemeDragHandle")
                .animation(.default, value: active)

            ThemeText(active ? "Active" : "Default", variant: .labelMd)
        }
        .padding(theme.space.lg)
        .background(theme.colors.surface.default)
        .safeAreaPadding(theme.space.sm)
    }
}

private struct AtomsSheetHandleStoryView: View {
    @Environment(\.theme) private var theme

    let expanded: Bool

    var body: some View {
        VStack(spacing: theme.space.md) {
            RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                .fill(expanded ? theme.colors.onSurface.default : theme.colors.muted.default)
                .frame(width: expanded ? theme.space.xxxxl : theme.space.xxxl, height: max(theme.space.xs / 2, 1))
                .accessibilityLabel("ThemeSheetHandle")
                .animation(.default, value: expanded)

            ThemeText(expanded ? "Expanded" : "Default", variant: .labelMd)
        }
        .padding(theme.space.lg)
        .background(theme.colors.surfaceVariant.default)
        .safeAreaPadding(theme.space.sm)
    }
}

private struct ThemeButtonStoryView: View {
    let variant: ThemeButtonVariant
    let isLoading: Bool

    var body: some View {
        ThemeButton(
            isLoading ? "Saving ride" : "Save route",
            variant: variant,
            size: .lg,
            iconName: "search",
            isLoading: isLoading,
            accessibilityLabel: "ThemeButton Story"
        ) {}
            .safeAreaPadding()
    }
}

private struct ThemePrimaryButtonStoryView: View {
    var body: some View {
        ThemePrimaryButton("Start ride", iconName: "arrow-right") {}
            .safeAreaPadding()
    }
}

private struct ThemeInputStoryView: View {
    @State private var text = "Bear Lake Loop"
    let isError: Bool

    var body: some View {
        ThemeInput(
            label: "Destination",
            text: $text,
            placeholder: "Search destinations",
            leftIconName: "search",
            rightIconName: isError ? "close" : nil,
            isError: isError
        )
        .safeAreaPadding()
    }
}

private struct ThemeTextareaStoryView: View {
    @State private var text = "Smooth canyon sweepers with scenic lake pullouts."

    var body: some View {
        ThemeTextarea(
            label: "Ride notes",
            text: $text,
            placeholder: "Add route notes"
        )
        .safeAreaPadding()
    }
}

private struct ThemeBottomSheetInputStoryView: View {
    @State private var text = "Meet at 8:30 AM"

    var body: some View {
        ThemeBottomSheetInput(
            label: "Bottom sheet field",
            text: $text,
            placeholder: "Add a note",
            leftIconName: "location"
        )
        .safeAreaPadding()
    }
}

private struct ThemeSwitchStoryView: View {
    @State private var isOn = true

    var body: some View {
        ThemeSwitch(isOn: $isOn, label: "Avoid highways")
            .safeAreaPadding()
    }
}

private struct ThemeToggleStoryView: View {
    @State private var isPressed = true

    var body: some View {
        ThemeToggle(
            "Scenic",
            isPressed: $isPressed,
            variant: .outline,
            size: .lg,
            iconName: "location"
        )
        .safeAreaPadding()
    }
}

private struct ThemeCheckboxStoryView: View {
    @State private var isChecked = true

    var body: some View {
        ThemeCheckbox(isChecked: $isChecked, label: "Download offline map")
            .safeAreaPadding()
    }
}

private struct ThemeSliderStoryView: View {
    @State private var value = 0.6

    var body: some View {
        ThemeSlider(value: $value, range: 0 ... 1, step: 0.1)
            .safeAreaPadding()
    }
}
