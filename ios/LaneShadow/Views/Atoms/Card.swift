import LaneShadowTheme
import SwiftUI

// MARK: - CardVariant

/// Card color variants matching the translation matrix
public enum CardVariant: String, CaseIterable {
    case `default`
    case primary
    case success
    case warning
    case danger
}

// MARK: - Card

/// Card component - Container with semantic theme styling
///
/// Following the translation matrix specification:
/// - borderRadius: theme.radius.lg (16)
/// - padding: theme.space.lg (16)
/// - elevation: level2 (default), level3 (pressed)
/// - Typography: theme.type.title.md (16pt semibold), theme.type.body.sm (14pt normal)
public struct Card<Content: View>: View {
    // MARK: - Properties

    @Environment(\.theme) private var theme
    @State private var isPressed = false

    private let variant: CardVariant
    private let onPress: (() -> Void)?
    private let disabled: Bool
    private let showBorder: Bool
    private let testID: String?
    private let content: () -> Content

    // MARK: - Initialization

    /// Creates a Card with the given content and optional styling
    /// - Parameters:
    ///   - variant: The color variant (default is .default)
    ///   - onPress: Optional action callback when card is pressed
    ///   - disabled: Whether the card is disabled (default is false)
    ///   - showBorder: Whether to show a border (default is true)
    ///   - testID: Test identifier for UI testing
    ///   - content: The card's content
    public init(
        variant: CardVariant = .default,
        onPress: (() -> Void)? = nil,
        disabled: Bool = false,
        showBorder: Bool = true,
        testID: String? = nil,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.variant = variant
        self.onPress = onPress
        self.disabled = disabled
        self.showBorder = showBorder
        self.testID = testID
        self.content = content
    }

    // MARK: - Body

    public var body: some View {
        Group {
            if let onPress, !disabled {
                // Interactive card
                Button(action: onPress) {
                    cardContent
                }
                .buttonStyle(.plain)
                .simultaneousGesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { _ in
                            isPressed = true
                        }
                        .onEnded { _ in
                            isPressed = false
                        }
                )
            } else {
                // Static card
                cardContent
            }
        }
        .disabled(disabled)
        .accessibilityAddTraits((onPress != nil) ? .isButton : [])
        .accessibilityAddTraits(disabled ? .notEnabled : [])
        .accessibilityIdentifier(testID ?? "card")
    }

    // MARK: - Card Content

    private var cardContent: some View {
        content()
            .frame(maxWidth: .infinity)
            .padding(theme.space.lg) // Matrix: padding = 16
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg)) // Matrix: borderRadius = 16
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.lg)
                    .stroke(borderColor, lineWidth: showBorder ? theme.borderWidth.thin : 0) // Matrix: borderWidth = 1
            )
            .shadow(
                color: shadowColor,
                radius: isPressed ? theme.elevation.level3.radius : theme.elevation.level2.radius,
                x: isPressed ? theme.elevation.level3.offsetX : theme.elevation.level2.offsetX,
                y: isPressed ? theme.elevation.level3.offsetY : theme.elevation.level2.offsetY
            )
            .opacity(shadowOpacity)
    }

    // MARK: - Color Helpers

    private var backgroundColor: Color {
        if disabled {
            return theme.colors.card.disabled ?? theme.colors.card.default
        }

        if isPressed {
            return pressedBackgroundColor
        }

        return defaultBackgroundColor
    }

    private var defaultBackgroundColor: Color {
        switch variant {
        case .default:
            theme.colors.card.default
        case .primary:
            theme.colors.primary.default
        case .success:
            theme.colors.success.default
        case .warning:
            theme.colors.warning.default
        case .danger:
            theme.colors.danger.default
        }
    }

    private var pressedBackgroundColor: Color {
        switch variant {
        case .default:
            theme.colors.card.pressed ?? theme.colors.card.default
        case .primary:
            theme.colors.primary.pressed ?? theme.colors.primary.default
        case .success:
            theme.colors.success.pressed ?? theme.colors.success.default
        case .warning:
            theme.colors.warning.pressed ?? theme.colors.warning.default
        case .danger:
            theme.colors.danger.pressed ?? theme.colors.danger.default
        }
    }

    private var borderColor: Color {
        showBorder ? theme.colors.border.default : .clear
    }

    private var shadowColor: Color {
        theme.elevation.level2.shadowColor
    }

    private var shadowOpacity: Double {
        isPressed ? theme.elevation.level3.opacity : theme.elevation.level2.opacity
    }
}

// MARK: - CardHeader

/// Card Header component
/// Container for card title and actions
public struct CardHeader: View {
    @Environment(\.theme) private var theme

    private let content: () -> AnyView

    /// Creates a CardHeader with the given content
    /// - Parameter content: The header's content
    public init(@ViewBuilder content: @escaping () -> some View) {
        self.content = { AnyView(content()) }
    }

    public var body: some View {
        HStack(alignment: .center) {
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, theme.space.md) // Matrix: marginBottom = 12
    }
}

// MARK: - CardTitle

/// Card Title component
/// Title text for cards
public struct CardTitle: View {
    @Environment(\.theme) private var theme

    private let text: String
    private let variant: CardVariant

    /// Creates a CardTitle with the given text
    /// - Parameters:
    ///   - text: The title text
    ///   - variant: The color variant (default is .default)
    public init(
        _ text: String,
        variant: CardVariant = .default
    ) {
        self.text = text
        self.variant = variant
    }

    public var body: some View {
        Text(text)
            .font(.system(size: theme.type.title.md.fontSize, weight: .semibold)) // Matrix: 16pt semibold
            .foregroundStyle(textColor)
    }

    private var textColor: Color {
        switch variant {
        case .primary, .success, .warning, .danger:
            theme.colors.onPrimary.default
        case .default:
            theme.colors.onSurface.default
        }
    }
}

// MARK: - CardContent

/// Card Content component
/// Main content area of card
public struct CardContent<Content: View>: View {
    private let content: () -> Content

    /// Creates a CardContent with the given content
    /// - Parameter content: The content
    public init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    public var body: some View {
        content()
            .layoutPriority(1) // Matrix: flex = 1
    }
}

// MARK: - CardDescription

/// Card Description component
/// Secondary text for cards
public struct CardDescription: View {
    @Environment(\.theme) private var theme

    private let text: String
    private let variant: CardVariant

    /// Creates a CardDescription with the given text
    /// - Parameters:
    ///   - text: The description text
    ///   - variant: The color variant (default is .default)
    public init(
        _ text: String,
        variant: CardVariant = .default
    ) {
        self.text = text
        self.variant = variant
    }

    public var body: some View {
        Text(text)
            .font(.system(size: theme.type.body.sm.fontSize, weight: .regular)) // Matrix: 14pt normal
            .foregroundStyle(textColor)
    }

    private var textColor: Color {
        switch variant {
        case .primary, .success, .warning, .danger:
            theme.colors.onPrimary.default
        case .default:
            // Use onSurface.muted if available, otherwise fall back to onSurface.default
            theme.colors.onSurface.muted ?? theme.colors.onSurface.default
        }
    }
}

// MARK: - Preview

#Preview("Default Card") {
    Card {
        VStack(alignment: .leading, spacing: 8) {
            CardHeader {
                CardTitle("Default Card")
            }
            CardContent {
                CardDescription("This is a default card with border and elevation.")
            }
        }
    }
    .laneShadowTheme()
}

#Preview("Primary Card") {
    Card(variant: .primary) {
        VStack(alignment: .leading, spacing: 8) {
            CardHeader {
                CardTitle("Primary Card")
            }
            CardContent {
                CardDescription("This is a primary card with colored background.")
            }
        }
    }
    .laneShadowTheme()
}

#Preview("Success Card") {
    Card(variant: .success) {
        VStack(alignment: .leading, spacing: 8) {
            CardHeader {
                CardTitle("Success Card")
            }
            CardContent {
                CardDescription("This is a success card with green background.")
            }
        }
    }
    .laneShadowTheme()
}

#Preview("Warning Card") {
    Card(variant: .warning) {
        VStack(alignment: .leading, spacing: 8) {
            CardHeader {
                CardTitle("Warning Card")
            }
            CardContent {
                CardDescription("This is a warning card with yellow background.")
            }
        }
    }
    .laneShadowTheme()
}

#Preview("Danger Card") {
    Card(variant: .danger) {
        VStack(alignment: .leading, spacing: 8) {
            CardHeader {
                CardTitle("Danger Card")
            }
            CardContent {
                CardDescription("This is a danger card with red background.")
            }
        }
    }
    .laneShadowTheme()
}

#Preview("Interactive Card") {
    Card(
        variant: .default,
        onPress: { print("Card pressed!") },
        testID: "interactive-card"
    ) {
        VStack(alignment: .leading, spacing: 8) {
            CardHeader {
                CardTitle("Interactive Card")
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(.secondary)
            }
            CardContent {
                CardDescription("Tap this card to see press feedback.")
            }
        }
    }
    .laneShadowTheme()
}

#Preview("Card Without Border") {
    Card(showBorder: false) {
        VStack(alignment: .leading, spacing: 8) {
            CardHeader {
                CardTitle("Card Without Border")
            }
            CardContent {
                CardDescription("This card has no border.")
            }
        }
    }
    .laneShadowTheme()
}

#Preview("Disabled Card") {
    Card(
        variant: .primary,
        onPress: { print("Should not fire") },
        disabled: true
    ) {
        VStack(alignment: .leading, spacing: 8) {
            CardHeader {
                CardTitle("Disabled Card")
            }
            CardContent {
                CardDescription("This card is disabled and cannot be pressed.")
            }
        }
    }
    .laneShadowTheme()
}

#Preview("All Variants") {
    VStack(spacing: 16) {
        Card { CardTitle("Default") }
        Card(variant: .primary) { CardTitle("Primary") }
        Card(variant: .success) { CardTitle("Success") }
        Card(variant: .warning) { CardTitle("Warning") }
        Card(variant: .danger) { CardTitle("Danger") }
    }
    .laneShadowTheme()
}
