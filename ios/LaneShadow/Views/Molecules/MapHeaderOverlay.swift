import LaneShadowTheme
import SwiftUI

// MARK: - MapHeaderOverlay Action Model

/**
 * Action model for map header overlay buttons
 *
 * Defines the icon and press handler for left/right action buttons
 *
 * ## Parameters
 * - icon: Icon name (MaterialCommunityIcons name, mapped to SF Symbol)
 * - onPress: Button tap handler
 * - accessibilityLabel: Accessibility label for screen readers
 * - testID: Testing identifier
 */
public struct LSMapHeaderOverlayAction: Sendable {
    public let icon: String
    public let onPress: @Sendable () -> Void
    public let accessibilityLabel: String?
    public let testID: String?

    public init(
        icon: String,
        onPress: @escaping @Sendable () -> Void,
        accessibilityLabel: String? = nil,
        testID: String? = nil
    ) {
        self.icon = icon
        self.onPress = onPress
        self.accessibilityLabel = accessibilityLabel
        self.testID = testID
    }
}

// MARK: - MapHeaderOverlay Component

/**
 * Map header overlay molecule component
 *
 * Transparent glass-morphic header overlay for map screens
 * Following React Native component from react-native/components/map/map-header-overlay.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - `theme.colors.surface.default` (gradient with opacity)
 *   - `theme.colors.onSurface.default` (title text, icon tints)
 * - Layout:
 *   - Width: 100% (full screen width)
 *   - Top padding: safe area insets (using GeometryReader)
 *   - Bottom padding: space.xl (gradient), space.2xl (content)
 *   - Horizontal padding: space.lg
 *   - Button min width: space.3xl
 * - Typography:
 *   - Title: headlineMedium (bold)
 * - Gradient:
 *   - Surface default at 95% alpha → 50% alpha → transparent
 *   - When showBackground = false: all transparent
 *
 * ## Parameters
 * - title: Header title text (required)
 * - leftAction: Optional left button action
 * - rightAction: Optional right button action
 * - showBackground: Toggle gradient visibility (default: true)
 * - testID: Testing identifier
 */
public struct LSMapHeaderOverlay: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let leftAction: LSMapHeaderOverlayAction?
    private let rightAction: LSMapHeaderOverlayAction?
    private let showBackground: Bool
    private let testID: String?

    public init(
        title: String,
        leftAction: LSMapHeaderOverlayAction? = nil,
        rightAction: LSMapHeaderOverlayAction? = nil,
        showBackground: Bool = true,
        testID: String? = nil
    ) {
        self.title = title
        self.leftAction = leftAction
        self.rightAction = rightAction
        self.showBackground = showBackground
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                // Gradient overlay
                gradientView
                    .frame(maxWidth: .infinity)

                // Spacer for remaining height
                Spacer()
            }
        }
        .frame(height: totalHeight)
    }

    // MARK: - Computed Properties

    private var totalHeight: CGFloat {
        // Safe area top + space.xl (gradient) + space.2xl (content)
        theme.space.xl + theme.space.xxl
    }

    // MARK: - Gradient View

    private var gradientView: some View {
        ZStack {
            // Background gradient
            if showBackground {
                LinearGradient(
                    colors: [
                        theme.colors.surface.default.opacity(0.95),
                        theme.colors.surface.default.opacity(0.5),
                        Color.clear,
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            } else {
                Color.clear
            }

            // Content
            contentView
        }
        .frame(maxWidth: .infinity)
        .background(
            GeometryReader { geometry in
                Color.clear.onAppear {
                    safeAreaTop = geometry.safeAreaInsets.top
                }
                .onChange(of: geometry.safeAreaInsets.top) { oldValue, newValue in
                    safeAreaTop = newValue
                }
            }
        )
        .padding(.top, safeAreaTop)
        .padding(.bottom, theme.space.xl)
    }

    // MARK: - Content View

    private var contentView: some View {
        HStack(alignment: .center, spacing: 0) {
            // Left section
            leftSection
                .frame(minWidth: theme.space.xxxl)

            Spacer()

            // Center title
            Text(title)
                .font(.system(size: 16, weight: .bold)) // headlineMedium equivalent
                .foregroundStyle(theme.colors.onSurface.default)
                .accessibilityIdentifier(testID.map { "\($0)-title" } ?? "map-header-title")

            Spacer()

            // Right section
            rightSection
                .frame(minWidth: theme.space.xxxl)
        }
        .padding(.horizontal, theme.space.lg)
        .padding(.bottom, theme.space.xxl)
    }

    // MARK: - Left Section

    @ViewBuilder
    private var leftSection: some View {
        if let action = leftAction {
            Button(action: action.onPress) {
                LSIconSymbol(
                    name: action.icon,
                    size: 24,
                    color: theme.colors.onSurface.default
                )
                .frame(width: theme.space.xxxl, height: theme.space.xxxl)
                .background(
                    theme.colors.surfaceVariant.default.opacity(0.5)
                        .cornerRadius(theme.radius.md)
                )
            }
            .buttonStyle(PlainButtonStyle())
            .accessibilityLabel(action.accessibilityLabel ?? "Left action")
            .accessibilityIdentifier(action.testID.map { "\($0)-left-button" } ?? "map-header-left-button")
        } else {
            // Placeholder
            Color.clear
                .frame(width: theme.space.xxxl, height: theme.space.xxxl)
        }
    }

    // MARK: - Right Section

    @ViewBuilder
    private var rightSection: some View {
        if let action = rightAction {
            Button(action: action.onPress) {
                LSIconSymbol(
                    name: action.icon,
                    size: 24,
                    color: theme.colors.onSurface.default
                )
                .frame(width: theme.space.xxxl, height: theme.space.xxxl)
                .background(
                    theme.colors.surfaceVariant.default.opacity(0.5)
                        .cornerRadius(theme.radius.md)
                )
            }
            .buttonStyle(PlainButtonStyle())
            .accessibilityLabel(action.accessibilityLabel ?? "Right action")
            .accessibilityIdentifier(action.testID.map { "\($0)-right-button" } ?? "map-header-right-button")
        } else {
            // Placeholder
            Color.clear
                .frame(width: theme.space.xxxl, height: theme.space.xxxl)
        }
    }

    // MARK: - Safe Area Top

    @State private var safeAreaTop: CGFloat = 0
}

// MARK: - Preview

#Preview("MapHeaderOverlay - Basic") {
    LSMapHeaderOverlay(
        title: "LaneShadow"
    )
    .laneShadowTheme()
}

#Preview("MapHeaderOverlay - With Left Action") {
    LSMapHeaderOverlay(
        title: "LaneShadow",
        leftAction: LSMapHeaderOverlayAction(
            icon: "menu",
            onPress: {
                print("Menu pressed")
            },
            accessibilityLabel: "Menu"
        )
    )
    .laneShadowTheme()
}

#Preview("MapHeaderOverlay - With Right Action") {
    LSMapHeaderOverlay(
        title: "LaneShadow",
        rightAction: LSMapHeaderOverlayAction(
            icon: "cog",
            onPress: {
                print("Settings pressed")
            },
            accessibilityLabel: "Settings"
        )
    )
    .laneShadowTheme()
}

#Preview("MapHeaderOverlay - With Both Actions") {
    LSMapHeaderOverlay(
        title: "LaneShadow",
        leftAction: LSMapHeaderOverlayAction(
            icon: "menu",
            onPress: {
                print("Menu pressed")
            },
            accessibilityLabel: "Menu"
        ),
        rightAction: LSMapHeaderOverlayAction(
            icon: "cog",
            onPress: {
                print("Settings pressed")
            },
            accessibilityLabel: "Settings"
        )
    )
    .laneShadowTheme()
}

#Preview("MapHeaderOverlay - No Background") {
    LSMapHeaderOverlay(
        title: "LaneShadow",
        showBackground: false
    )
    .laneShadowTheme()
}
