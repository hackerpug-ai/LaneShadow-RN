import LaneShadowTheme
import SwiftUI

// MARK: - Favorites Info Sheet Component

/**
 * Favorites info sheet molecule component
 *
 * Shows informational message when favorite roads couldn't be included in route.
 * Following React Native component from react-native/components/sheets/favorites-info-sheet.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Icon background: `theme.colors.primary.default` (15% opacity)
 *   - Icon: `theme.colors.primary.default`
 *   - Title: `theme.colors.onSurface.default`
 *   - Message/guidance: `theme.colors.onSurface.muted` (60% opacity)
 *   - List background: `theme.colors.surface.default` (50% opacity)
 *   - List items: `theme.colors.onSurface.default`
 * - Layout:
 *   - Container padding: `theme.space.lg`
 *   - Gap between elements: `theme.space.md`
 *   - List container padding: `theme.space.md`
 *   - List item gap: `theme.space.sm`
 *   - Icon container padding: `theme.space.md`
 *   - Icon radius: `theme.radius.full`
 *   - List container radius: `theme.radius.md`
 * - Typography:
 *   - Title: `theme.type.title.md` (medium weight, 18pt)
 *   - Message: `theme.type.body.md` (16pt)
 *   - List items: `theme.type.body.md` (16pt)
 *   - Guidance: `theme.type.body.sm` (14pt)
 *
 * ## Parameters
 * - visible: Whether to show the sheet
 * - unavailableFavorites: Array of favorite names that couldn't be included
 * - onDismiss: Callback when user dismisses the sheet
 * - testID: Optional test identifier for UI testing
 */
public struct LSFavoritesInfoSheet: View {
    @Environment(\.theme) private var theme

    private let visible: Bool
    private let unavailableFavorites: [String]
    private let onDismiss: () -> Void
    private let testID: String

    public init(
        visible: Bool,
        unavailableFavorites: [String],
        onDismiss: @escaping () -> Void,
        testID: String = "favorites-info-sheet"
    ) {
        self.visible = visible
        self.unavailableFavorites = unavailableFavorites
        self.onDismiss = onDismiss
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        EmptyView()
            .sheet(isPresented: .constant(visible)) {
                sheetContent
            }
            .accessibilityIdentifier(testID)
    }

    // MARK: - Sheet Content

    private var sheetContent: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            // Info icon
            HStack {
                Spacer()
                LSIconSymbol(
                    name: "information",
                    size: 32,
                    color: theme.colors.primary.default
                )
                .padding(theme.space.md)
                .background(
                    Circle()
                        .fill(theme.colors.primary.default.opacity(0.15))
                )
                Spacer()
            }

            // Title
            Text("Favorites Not Included")
                .font(theme.type.title.md.font)
                .foregroundStyle(theme.colors.onSurface.default)
                .frame(maxWidth: .infinity)
                .multilineTextAlignment(.center)
                .accessibilityIdentifier("\(testID)-title")

            // Message
            Text("These favorite roads are too far from your planned route:")
                .font(theme.type.body.md.font)
                .foregroundStyle(theme.colors.onSurface.muted ?? theme.colors.onSurface.default.opacity(0.6))
                .accessibilityIdentifier("\(testID)-message")

            // Favorites list
            if !unavailableFavorites.isEmpty {
                VStack(alignment: .leading, spacing: theme.space.sm) {
                    ForEach(unavailableFavorites, id: \.self) { favorite in
                        Text("• \(favorite)")
                            .font(theme.type.body.md.font)
                            .foregroundStyle(theme.colors.onSurface.default)
                            .accessibilityLabel(favorite)
                    }
                }
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Favorite roads not included")
                .padding(theme.space.md)
                .background(
                    RoundedRectangle(cornerRadius: theme.radius.md)
                        .fill(theme.colors.surface.default.opacity(0.5))
                )
                .accessibilityIdentifier("\(testID)-list")
            }

            // Guidance
            Text("Try planning a route nearer to these favorites, or add them to a different route.")
                .font(theme.type.body.sm.font)
                .foregroundStyle(theme.colors.onSurface.muted ?? theme.colors.onSurface.default.opacity(0.6))
                .accessibilityIdentifier("\(testID)-guidance")

            // Got it button
            LSButton(
                "Got it",
                variant: .default,
                size: .lg,
                onPress: onDismiss,
                testID: "\(testID)-close-button"
            )
        }
        .padding(theme.space.lg)
        .presentationDetents([.presentation(0.6)])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Preview

#Preview("FavoritesInfoSheet - Shown") {
    struct PreviewWrapper: View {
        @State private var isVisible = true

        var body: some View {
            VStack {
                Text("Parent View")
                    .font(.headline)

                LSFavoritesInfoSheet(
                    visible: isVisible,
                    unavailableFavorites: [
                        "Pacific Coast Highway",
                        "Mulholland Drive",
                        "Sunset Boulevard",
                    ],
                    onDismiss: {
                        isVisible = false
                    },
                    testID: "preview-favorites-info-sheet"
                )
            }
        }
    }

    return PreviewWrapper()
        .laneShadowTheme()
}

#Preview("FavoritesInfoSheet - Empty List") {
    struct PreviewWrapper: View {
        @State private var isVisible = true

        var body: some View {
            VStack {
                Text("Parent View")
                    .font(.headline)

                LSFavoritesInfoSheet(
                    visible: isVisible,
                    unavailableFavorites: [],
                    onDismiss: {
                        isVisible = false
                    },
                    testID: "preview-empty-sheet"
                )
            }
        }
    }

    return PreviewWrapper()
        .laneShadowTheme()
}

#Preview("FavoritesInfoSheet - Light Mode") {
    struct PreviewWrapper: View {
        @State private var isVisible = true

        var body: some View {
            LSFavoritesInfoSheet(
                visible: isVisible,
                unavailableFavorites: ["Test Road"],
                onDismiss: {
                    isVisible = false
                }
            )
        }
    }

    return PreviewWrapper()
        .laneShadowTheme()
        .preferredColorScheme(.light)
}

#Preview("FavoritesInfoSheet - Dark Mode") {
    struct PreviewWrapper: View {
        @State private var isVisible = true

        var body: some View {
            LSFavoritesInfoSheet(
                visible: isVisible,
                unavailableFavorites: ["Test Road"],
                onDismiss: {
                    isVisible = false
                }
            )
        }
    }

    return PreviewWrapper()
        .laneShadowTheme()
        .preferredColorScheme(.dark)
}
