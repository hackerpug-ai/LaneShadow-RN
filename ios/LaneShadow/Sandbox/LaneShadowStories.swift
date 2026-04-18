import LaneShadowTheme
import NativeSandbox
import NativeTheme
import SwiftUI

@MainActor
enum LaneShadowStories {
    static let all: [Story] = [
        Story(
            id: "atoms/sandbox-host/hello-story",
            tier: .atom,
            component: "SandboxHost",
            name: "HelloStory",
            summary: "react-native/stories/registry/ScenarioRegistry.stories.tsx#HelloStory"
        ) { _ in
            SandboxTokenStoryView()
        },
        Story(
            id: "templates/sandbox-launch/default",
            tier: .infrastructure,
            component: "SandboxLaunch",
            name: "Default",
            summary: "react-native/stories/registry/ScenarioRegistry.stories.tsx#SandboxLaunchDefault"
        ) { _ in
            InfrastructureStoryView(title: "SandboxLaunch configured")
        },
        Story(
            id: "templates/lane-shadow-sandbox-entry/default",
            tier: .infrastructure,
            component: "LaneShadowSandboxEntry",
            name: "Default",
            summary: "react-native/stories/registry/ScenarioRegistry.stories.tsx#LaneShadowSandboxEntryDefault"
        ) { _ in
            InfrastructureStoryView(title: "SandboxRoot entry wired")
        },
        Story(
            id: "templates/lane-shadow-stories/default",
            tier: .infrastructure,
            component: "LaneShadowStories",
            name: "Default",
            summary: "react-native/stories/registry/ScenarioRegistry.stories.tsx#LaneShadowStoriesDefault"
        ) { _ in
            InfrastructureStoryView(title: "LaneShadowStories aggregator ready")
        },
        Story(
            id: "molecules/catalog-navigation/default",
            tier: .molecule,
            component: "CatalogNavigation",
            name: "Default",
            summary: "react-native/stories/registry/ScenarioRegistry.stories.tsx#CatalogNavigationDefault"
        ) { _ in
            CatalogNavigationStoryView(query: "")
        },
        Story(
            id: "molecules/catalog-navigation/search-active",
            tier: .molecule,
            component: "CatalogNavigation",
            name: "SearchActive",
            summary: "react-native/stories/registry/ScenarioRegistry.stories.tsx#CatalogNavigationSearchActive"
        ) { _ in
            CatalogNavigationStoryView(query: "registry")
        },
        Story(
            id: "molecules/rn-reference-registry/default",
            tier: .molecule,
            component: "RNReferenceRegistry",
            name: "Default",
            summary: "react-native/stories/registry/ScenarioRegistry.stories.tsx#RNReferenceRegistryDefault"
        ) { _ in
            RNReferenceRegistryStoryView(isEmpty: false)
        },
        Story(
            id: "molecules/rn-reference-registry/empty",
            tier: .molecule,
            component: "RNReferenceRegistry",
            name: "Empty",
            summary: "react-native/stories/registry/ScenarioRegistry.stories.tsx#RNReferenceRegistryEmpty"
        ) { _ in
            RNReferenceRegistryStoryView(isEmpty: true)
        },
    ] + AtomsStories.all
}

private struct SandboxTokenStoryView: View {
    @Environment(\.theme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            Text("Hello from LaneShadow!")
                .font(theme.type.title.md.font)
                .foregroundStyle(theme.colors.onSurface.default)

            Text("Sandbox host bootstrap ready")
                .font(theme.type.body.md.font)
                .foregroundStyle(theme.colors.onSurface.default)
        }
        .padding(theme.space.lg)
        .background(theme.colors.surface.default)
    }
}

private struct InfrastructureStoryView: View {
    @Environment(\.theme) private var theme

    let title: String

    var body: some View {
        Text(title)
            .font(theme.type.body.md.font)
            .foregroundStyle(theme.colors.onSurface.default)
            .padding(theme.space.lg)
            .background(theme.colors.surface.default)
    }
}

private struct CatalogNavigationStoryView: View {
    @Environment(\.theme) private var theme

    let query: String

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            Text("Catalog Navigation")
                .font(theme.type.title.md.font)
                .foregroundStyle(theme.colors.onSurface.default)
                .accessibilityLabel("Catalog Navigation Header")

            Text(query.isEmpty ? "Browse all tiers" : "Filtering by: \(query)")
                .font(theme.type.body.md.font)
                .foregroundStyle(theme.colors.onSurface.default)
                .accessibilityLabel("Catalog Navigation State")
        }
        .padding(theme.space.lg)
        .background(theme.colors.surfaceVariant.default)
        .safeAreaPadding(theme.space.sm)
        .animation(.default, value: query)
    }
}

private struct RNReferenceRegistryStoryView: View {
    @Environment(\.theme) private var theme

    let isEmpty: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            Text("RN Reference Registry")
                .font(theme.type.title.md.font)
                .foregroundStyle(theme.colors.onSurface.default)
                .accessibilityLabel("RN Reference Registry Header")

            Text(isEmpty ? "No RN references found" : "Showing deterministic RN reference labels")
                .font(theme.type.body.md.font)
                .foregroundStyle(theme.colors.onSurface.default)
                .accessibilityLabel("RN Reference Registry State")
        }
        .padding(theme.space.lg)
        .background(theme.colors.surface.default)
        .safeAreaPadding(theme.space.sm)
        .animation(.default, value: isEmpty)
    }
}

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
    ]
}

struct ThemeText: View {
    @Environment(\.theme) private var theme

    let content: String
    let variant: ThemeTextVariant
    let color: Color?

    init(_ content: String, variant: ThemeTextVariant = .bodyMd, color: Color? = nil) {
        self.content = content
        self.variant = variant
        self.color = color
    }

    var body: some View {
        let typography = variant.typography(in: theme)
        let lineHeightDelta = max(typography.lineHeight - typography.fontSize, 0)

        return Text(content)
            .font(typography.font)
            .lineSpacing(lineHeightDelta)
            .foregroundStyle(color ?? theme.colors.onSurface.default)
    }
}

enum ThemeTextVariant: String, CaseIterable {
    case labelSm
    case labelMd
    case labelLg
    case bodySm
    case bodyMd
    case bodyLg
    case titleSm
    case titleMd
    case titleLg
    case headingSm
    case headingMd
    case headingLg
    case displaySm
    case displayMd
    case displayLg

    func typography(in theme: Theme) -> TypographyStyle {
        switch self {
        case .labelSm: theme.type.label.sm
        case .labelMd: theme.type.label.md
        case .labelLg: theme.type.label.lg
        case .bodySm: theme.type.body.sm
        case .bodyMd: theme.type.body.md
        case .bodyLg: theme.type.body.lg
        case .titleSm: theme.type.title.sm
        case .titleMd: theme.type.title.md
        case .titleLg: theme.type.title.lg
        case .headingSm: theme.type.heading.sm
        case .headingMd: theme.type.heading.md
        case .headingLg: theme.type.heading.lg
        case .displaySm: theme.type.display.sm
        case .displayMd: theme.type.display.md
        case .displayLg: theme.type.display.lg
        }
    }
}

struct ThemeBackground<Content: View>: View {
    @Environment(\.theme) private var theme

    let variant: ThemeBackgroundVariant
    @ViewBuilder let content: () -> Content

    init(
        variant: ThemeBackgroundVariant = .surface,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.variant = variant
        self.content = content
    }

    var body: some View {
        content()
            .padding(theme.space.md)
            .background(variant.color(in: theme))
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous))
    }
}

enum ThemeBackgroundVariant: String, CaseIterable {
    case surface
    case surfaceVariant
    case background
    case card
    case muted

    func color(in theme: Theme) -> Color {
        switch self {
        case .surface: theme.colors.surface.default
        case .surfaceVariant: theme.colors.surfaceVariant.default
        case .background: theme.colors.background.default
        case .card: theme.colors.card.default
        case .muted: theme.colors.muted.default
        }
    }
}

struct ThemeIcon: View {
    @Environment(\.theme) private var theme

    let name: String
    let size: CGFloat
    let color: Color?

    var body: some View {
        Image(systemName: sfSymbolName(for: name))
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .foregroundStyle(color ?? theme.colors.onSurface.default)
            .accessibilityLabel(name)
    }

    private func sfSymbolName(for symbol: String) -> String {
        switch symbol {
        case "search": "magnifyingglass"
        case "close": "xmark"
        case "location": "location.fill"
        case "drag-handle": "line.3.horizontal"
        case "sheet-handle": "line.3.horizontal.decrease"
        default: "questionmark.circle"
        }
    }
}

struct ThemeSeparator: View {
    @Environment(\.theme) private var theme

    let orientation: ThemeSeparatorOrientation

    var body: some View {
        Rectangle()
            .fill(theme.colors.divider.default)
            .frame(
                width: orientation == .vertical ? max(theme.space.xs / 4, 1) : nil,
                height: orientation == .horizontal ? max(theme.space.xs / 4, 1) : nil
            )
            .accessibilityHidden(true)
    }
}

enum ThemeSeparatorOrientation: String {
    case horizontal
    case vertical
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
                ThemeText(
                    isAccent ? "Accent Icon" : "Default Icon",
                    variant: .bodyMd
                )
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
                .frame(
                    width: active ? theme.space.xxxl : theme.space.xxl,
                    height: max(theme.space.xs / 2, 1)
                )
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
                .frame(
                    width: expanded ? theme.space.xxxxl : theme.space.xxxl,
                    height: max(theme.space.xs / 2, 1)
                )
                .accessibilityLabel("ThemeSheetHandle")
                .animation(.default, value: expanded)

            ThemeText(expanded ? "Expanded" : "Default", variant: .labelMd)
        }
        .padding(theme.space.lg)
        .background(theme.colors.surfaceVariant.default)
        .safeAreaPadding(theme.space.sm)
    }
}
