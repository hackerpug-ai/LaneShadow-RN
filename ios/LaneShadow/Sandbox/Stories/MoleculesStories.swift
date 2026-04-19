import LaneShadowTheme
import NativeSandbox
import SwiftUI

/**
 * Story registration for Sprint 2 molecule components.
 *
 * ## How to Register a Component Story
 *
 * 1. Import your component from `LaneShadowApp/Views/Molecules/{ComponentName}`
 * 2. Add a story entry following the pattern from AtomsStories.swift
 *
 * ## Theme Compliance
 *
 * All component styling MUST use theme tokens from `@Environment(\.theme)`
 *
 * ## Sprint 2 Registration
 *
 * Sprint 2 will populate this list with stories for all molecule components.
 */
@MainActor
enum MoleculesStories {
    static let all: [Story] = [
        // Enrichment Status Badge Stories

        Story(
            id: "molecules.enrichment-status-badge.draft",
            tier: .molecule,
            component: "EnrichmentStatusBadge",
            name: "Draft Status",
            summary: "react-native/components/enrichment/enrichment-status-badge.tsx - Draft status with clock icon and subtle color"
        ) { context in
            LSEnrichmentStatusBadge(status: .draft)
        },

        Story(
            id: "molecules.enrichment-status-badge.partial",
            tier: .molecule,
            component: "EnrichmentStatusBadge",
            name: "Partial Status",
            summary: "react-native/components/enrichment/enrichment-status-badge.tsx - Partial status with check-circle icon and enrichmentFast color"
        ) { context in
            LSEnrichmentStatusBadge(status: .partial)
        },

        Story(
            id: "molecules.enrichment-status-badge.complete",
            tier: .molecule,
            component: "EnrichmentStatusBadge",
            name: "Complete Status",
            summary: "react-native/components/enrichment/enrichment-status-badge.tsx - Complete status with star icon and enrichmentExtended color"
        ) { context in
            LSEnrichmentStatusBadge(status: .complete)
        },

        Story(
            id: "molecules.enrichment-status-badge.failed",
            tier: .molecule,
            component: "EnrichmentStatusBadge",
            name: "Failed Status",
            summary: "react-native/components/enrichment/enrichment-status-badge.tsx - Failed status with alert icon and danger color"
        ) { context in
            LSEnrichmentStatusBadge(status: .failed)
        },

        Story(
            id: "molecules.enrichment-status-badge.medium",
            tier: .molecule,
            component: "EnrichmentStatusBadge",
            name: "Medium Size Variants",
            summary: "react-native/components/enrichment/enrichment-status-badge.tsx - All statuses in medium size"
        ) { context in
            VStack(alignment: .leading, spacing: 16) {
                LSEnrichmentStatusBadge(status: .draft, size: .medium)
                LSEnrichmentStatusBadge(status: .partial, size: .medium)
                LSEnrichmentStatusBadge(status: .complete, size: .medium)
                LSEnrichmentStatusBadge(status: .failed, size: .medium)
            }
        },

        Story(
            id: "molecules.enrichment-status-badge.all-variants",
            tier: .molecule,
            component: "EnrichmentStatusBadge",
            name: "All Status and Size Variants",
            summary: "react-native/components/enrichment/enrichment-status-badge.tsx - Complete showcase of all statuses and sizes"
        ) { context in
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Small Size")
                        .font(context.theme.type.label.md.font)
                        .foregroundStyle(context.theme.colors.onSurface.subtle)
                    HStack(spacing: 8) {
                        LSEnrichmentStatusBadge(status: .draft, size: .small)
                        LSEnrichmentStatusBadge(status: .partial, size: .small)
                        LSEnrichmentStatusBadge(status: .complete, size: .small)
                        LSEnrichmentStatusBadge(status: .failed, size: .small)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Medium Size")
                        .font(context.theme.type.label.md.font)
                        .foregroundStyle(context.theme.colors.onSurface.subtle)
                    HStack(spacing: 8) {
                        LSEnrichmentStatusBadge(status: .draft, size: .medium)
                        LSEnrichmentStatusBadge(status: .partial, size: .medium)
                        LSEnrichmentStatusBadge(status: .complete, size: .medium)
                        LSEnrichmentStatusBadge(status: .failed, size: .medium)
                    }
                }
            }
            .padding()
        },

        // Error Toast Stories

        Story(
            id: "molecules.error-toast.default",
            tier: .molecule,
            component: "ErrorToast",
            name: "Default Error Toast",
            summary: "react-native/components/toasts/error-toast.tsx - Error toast with close button"
        ) { context in
            LSErrorToast(
                title: "Error",
                description: "Something went wrong. Please try again."
            )
        },

        Story(
            id: "molecules.error-toast.without-close",
            tier: .molecule,
            component: "ErrorToast",
            name: "Error Toast Without Close Button",
            summary: "react-native/components/toasts/error-toast.tsx - Error toast without close button"
        ) { context in
            LSErrorToast(
                title: "Network Error",
                description: "Unable to connect to the server.",
                showCloseButton: false
            )
        },

        Story(
            id: "molecules.error-toast.with-callback",
            tier: .molecule,
            component: "ErrorToast",
            name: "Error Toast With Callback",
            summary: "react-native/components/toasts/error-toast.tsx - Error toast with close callback"
        ) { context in
            LSErrorToast(
                title: "Error",
                description: "This toast has a close callback.",
                onClose: {
                    print("Close button tapped")
                }
            )
        },

        Story(
            id: "molecules.error-toast.multiple",
            tier: .molecule,
            component: "ErrorToast",
            name: "Multiple Error Toasts",
            summary: "react-native/components/toasts/error-toast.tsx - Multiple error toasts stacked"
        ) { context in
            VStack(spacing: 16) {
                LSErrorToast(
                    title: "Error",
                    description: "Something went wrong. Please try again."
                )
                LSErrorToast(
                    title: "Network Error",
                    description: "Unable to connect to the server. Check your internet connection."
                )
                LSErrorToast(
                    title: "Validation Error",
                    description: "Please check your input and try again.",
                    showCloseButton: false
                )
            }
        },

        // Favorites Info Sheet Stories

        Story(
            id: "molecules.favorites-info-sheet.default",
            tier: .molecule,
            component: "FavoritesInfoSheet",
            name: "Default with Favorites",
            summary: "react-native/components/sheets/favorites-info-sheet.tsx - Info sheet with unavailable favorites"
        ) { context in
            VStack {
                Text("Parent View")
                    .font(context.theme.type.title.md.font)
                    .foregroundStyle(context.theme.colors.onSurface.default)
                    .padding()
            }
            .laneShadowTheme()
        },

        Story(
            id: "molecules.favorites-info-sheet.empty",
            tier: .molecule,
            component: "FavoritesInfoSheet",
            name: "Empty Favorites List",
            summary: "react-native/components/sheets/favorites-info-sheet.tsx - Info sheet with no favorites"
        ) { context in
            VStack {
                Text("Parent View")
                    .font(context.theme.type.title.md.font)
                    .foregroundStyle(context.theme.colors.onSurface.default)
                    .padding()
            }
            .laneShadowTheme()
        },

        Story(
            id: "molecules.favorites-info-sheet.single",
            tier: .molecule,
            component: "FavoritesInfoSheet",
            name: "Single Favorite",
            summary: "react-native/components/sheets/favorites-info-sheet.tsx - Info sheet with one favorite"
        ) { context in
            VStack {
                Text("Parent View")
                    .font(context.theme.type.title.md.font)
                    .foregroundStyle(context.theme.colors.onSurface.default)
                    .padding()
            }
            .laneShadowTheme()
        },
    ]
}
