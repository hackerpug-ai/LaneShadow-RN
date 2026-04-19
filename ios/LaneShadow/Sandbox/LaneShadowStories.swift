import LaneShadowTheme
import NativeSandbox
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
    // Note: MoleculesStories.all will be added once MoleculesStories.swift is added to Xcode project
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
