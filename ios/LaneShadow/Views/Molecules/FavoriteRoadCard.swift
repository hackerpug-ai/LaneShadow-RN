import LaneShadowTheme
import SwiftUI

// MARK: - Bounds Type Definition

/**
 * Geographic bounds for map positioning
 * Following the translation matrix specification
 */
public struct LSBounds: Sendable {
    /// Southwest corner of the bounds
    public let southwest: LSLatLng
    /// Northeast corner of the bounds
    public let northeast: LSLatLng

    public init(southwest: LSLatLng, northeast: LSLatLng) {
        self.southwest = southwest
        self.northeast = northeast
    }

    // swiftlint:disable:next identifier_name
    public init(sw: LSLatLng, ne: LSLatLng) {
        /// Convenience initializer with short parameter names for compatibility
        self.southwest = sw
        self.northeast = ne
    }
}

// MARK: - Favorite Road Card Component

/**
 * Favorite road card molecule component
 *
 * Card component that displays a favorite road with name and mini map preview.
 * Following React Native component from react-native/components/ui/favorite-road-card.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.card.default`
 *   - Border: `theme.colors.border.default`
 *   - Text: `theme.colors.onSurface.default`
 *   - Delete icon: `theme.colors.danger.default`
 * - Layout:
 *   - Padding: `theme.space.lg` (container)
 *   - Gap: `theme.space.md` (between items)
 *   - Border width: `theme.borderWidth.thin` (hairline)
 * - Typography:
 *   - Title: `theme.type.title.md` (16pt semibold)
 * - Radius:
 *   - Card: `theme.radius.lg`
 *
 * ## Behavior
 * - Horizontal row with thumbnail (80x80), road name (flex 1), delete button
 * - Press state changes opacity to 0.8
 * - Delete button is separate from card press
 * - Road name truncates to 2 lines
 *
 * ## Parameters
 * - favoriteRoadId: Unique identifier for the favorite road
 * - name: Display name for the favorite road
 * - bounds: Geographic bounds for mini map positioning
 * - thumbnailContent: View builder for thumbnail content (placeholder until RouteThumbnail exists)
 * - onPress: Callback when card is pressed (not delete button)
 * - onDelete: Callback when delete button is pressed
 * - testID: Test identifier for UI testing
 */
public struct LSFavoriteRoadCard<ThumbnailContent: View>: View {
    // MARK: - Properties

    @Environment(\.theme) private var theme
    @State private var isPressed = false

    private let favoriteRoadId: String
    private let name: String
    private let bounds: LSBounds
    private let thumbnailContent: () -> ThumbnailContent
    private let onPress: ((String) -> Void)?
    private let onDelete: ((String) -> Void)?
    private let testID: String

    // MARK: - Initialization

    /// Creates a FavoriteRoadCard with the given content
    /// - Parameters:
    ///   - favoriteRoadId: Unique identifier for the favorite road
    ///   - name: Display name for the favorite road
    ///   - bounds: Geographic bounds for mini map positioning
    ///   - thumbnailContent: View builder for thumbnail content
    ///   - onPress: Callback when card is pressed
    ///   - onDelete: Callback when delete button is pressed
    ///   - testID: Test identifier for UI testing
    public init(
        favoriteRoadId: String,
        name: String,
        bounds: LSBounds,
        @ViewBuilder thumbnailContent: @escaping () -> ThumbnailContent,
        onPress: ((String) -> Void)? = nil,
        onDelete: ((String) -> Void)? = nil,
        testID: String = "favorite-road-card"
    ) {
        self.favoriteRoadId = favoriteRoadId
        self.name = name
        self.bounds = bounds
        self.thumbnailContent = thumbnailContent
        self.onPress = onPress
        self.onDelete = onDelete
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        Group {
            if let onPress {
                // Interactive card
                Button { onPress(favoriteRoadId) } label: {
                    cardContent
                }
                .buttonStyle(.plain)
                .simultaneousGesture(DragGesture(minimumDistance: 0)
                    .onChanged { _ in
                        isPressed = true
                    }
                    .onEnded { _ in
                        isPressed = false
                    })

            } else {
                // Static card
                cardContent
            }
        }
        .accessibilityLabel("View \(name)")
        .accessibilityAddTraits(onPress != nil ? .isButton : [])
        .accessibilityIdentifier(testID)
    }

    // MARK: - Card Content

    private var cardContent: some View {
        HStack(alignment: .center, spacing: theme.space.md) {
            // Thumbnail placeholder
            thumbnailContent()
                .frame(width: 80, height: 80)

            // Road name
            Text(name)
                .font(.system(size: theme.type.title.md.fontSize, weight: .semibold))
                .foregroundStyle(theme.colors.onSurface.default)
                .lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Delete button
            if let onDelete {
                Button { onDelete(favoriteRoadId) } label: {
                    LSIconSymbol(
                        name: "trash-can-outline",
                        size: 20,
                        color: theme.colors.danger.default
                    )
                    .frame(width: 36, height: 36)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Delete favorite")
                .accessibilityIdentifier("\(testID)-delete")
            }
        }
        .padding(theme.space.lg)
        .background(theme.colors.card.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: theme.radius.lg)
                .stroke(theme.colors.border.default, lineWidth: theme.borderWidth.thin)
        )
        .opacity(isPressed ? 0.8 : 1.0)
    }
}

// MARK: - Convenience Initializer

public extension LSFavoriteRoadCard where ThumbnailContent == EmptyView {
    /// Creates a FavoriteRoadCard without thumbnail content
    /// Use this when RouteThumbnail atom is not yet available
    init(
        favoriteRoadId: String,
        name: String,
        bounds: LSBounds,
        onPress: ((String) -> Void)? = nil,
        onDelete: ((String) -> Void)? = nil,
        testID: String = "favorite-road-card"
    ) {
        self.favoriteRoadId = favoriteRoadId
        self.name = name
        self.bounds = bounds
        self.thumbnailContent = { EmptyView() }
        self.onPress = onPress
        self.onDelete = onDelete
        self.testID = testID
    }
}

// MARK: - Preview

#Preview("FavoriteRoadCard - Interactive") {
    LSFavoriteRoadCard(
        favoriteRoadId: "pacific-coast-hwy",
        name: "Pacific Coast Highway",
        bounds: LSBounds(
            southwest: LSLatLng(latitude: 37.7749, longitude: -122.4194),
            northeast: LSLatLng(latitude: 37.8049, longitude: -122.3894)
        ),
        thumbnailContent: {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.3))
                .frame(width: 80, height: 80)
                .overlay {
                    Image(systemName: "map")
                        .foregroundStyle(.gray)
                }
        },
        onPress: { id in
            print("Pressed: \(id)")
        },
        onDelete: { id in
            print("Deleted: \(id)")
        },
        testID: "preview-card"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("FavoriteRoadCard - Static") {
    VStack(spacing: 16) {
        LSFavoriteRoadCard(
            favoriteRoadId: "twisty-1",
            name: "Twisty Mountain Pass",
            bounds: LSBounds(
                sw: LSLatLng(latitude: 37.7749, longitude: -122.4194),
                ne: LSLatLng(latitude: 37.8049, longitude: -122.3894)
            ),
            thumbnailContent: {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 80, height: 80)
            },
            testID: "static-card-1"
        )

        LSFavoriteRoadCard(
            favoriteRoadId: "long-name",
            name: "This is a very long road name that should be truncated to two lines with an ellipsis",
            bounds: LSBounds(
                sw: LSLatLng(latitude: 37.7749, longitude: -122.4194),
                ne: LSLatLng(latitude: 37.8049, longitude: -122.3894)
            ),
            thumbnailContent: {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 80, height: 80)
            },
            onDelete: { id in
                print("Deleted: \(id)")
            },
            testID: "static-card-2"
        )
    }
    .laneShadowTheme()
    .padding()
}

#Preview("FavoriteRoadCard - Dark Mode") {
    LSFavoriteRoadCard(
        favoriteRoadId: "night-ride",
        name: "Midnight Canyon Run",
        bounds: LSBounds(
            southwest: LSLatLng(latitude: 37.7749, longitude: -122.4194),
            northeast: LSLatLng(latitude: 37.8049, longitude: -122.3894)
        ),
        thumbnailContent: {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.3))
                .frame(width: 80, height: 80)
                .overlay {
                    Image(systemName: "moon.stars")
                        .foregroundStyle(.gray)
                }
        },
        onPress: { id in
            print("Pressed: \(id)")
        },
        onDelete: { id in
            print("Deleted: \(id)")
        }
    )
    .laneShadowTheme()
    .preferredColorScheme(.dark)
    .padding()
}
