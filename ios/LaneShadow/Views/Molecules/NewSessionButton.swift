import LaneShadowTheme
import SwiftUI

// MARK: - New Session Button Variant Enum

/**
 * New session button variant
 *
 * Following RN wrapper API from react-native/components/ui/new-session-button.tsx
 */
public enum LSNewSessionVariant {
    case header
    case fab
    case text
}

// MARK: - New Session Button Size Enum

/**
 * New session button size
 *
 * Following RN wrapper API from react-native/components/ui/new-session-button.tsx
 */
public enum LSNewSessionSize {
    case sm
    case md
    case lg
}

// MARK: - New Session Button Component

/**
 * New session button component
 *
 * Following RN wrapper API from react-native/components/ui/new-session-button.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/molecules/NewSessionButton.md
 *
 * ## Design Tokens Used
 * - Colors: `theme.colors.primary`, `theme.colors.onSurface`, `theme.colors.surfaceVariant`
 * - Typography: `theme.type.body` with weight 600/700
 * - Spacing: `theme.space.sm/md` (6-8pt for gap)
 * - Elevation: `theme.elevation.level3` for fab variant
 * - Opacity: 0.5 when disabled, 0.8 when pressed
 *
 * ## Variants
 * - **header** (default): HStack with plus.circle icon + label, muted text color, 6pt spacing
 * - **fab**: Circular floating action button with elevation, 50% opacity when disabled
 * - **text**: HStack with plus.circle icon + label, primary color, 8pt spacing, bold text
 *
 * ## Size configurations
 * - **sm**: icon 20pt, font 13pt, padding 4pt
 * - **md**: icon 24pt, font 14pt, padding 6pt (default)
 * - **lg**: icon 28pt, font 16pt, padding 8pt
 *
 * ## Parameters
 * - variant: Button variant (header, fab, text)
 * - label: Button label text (default: "Session")
 * - size: Button size (sm, md, lg)
 * - onPress: Action callback when button is pressed
 * - disabled: Whether button is disabled (default: false)
 * - accessibilityLabel: Accessibility label for screen readers
 * - testID: Test identifier for UI testing
 */
public struct LSNewSessionButton: View {
    @Environment(\.theme) private var theme
    @State private var isPressed = false

    private let variant: LSNewSessionVariant
    private let label: String
    private let size: LSNewSessionSize
    private let onPress: (() -> Void)?
    private let disabled: Bool
    private let accessibilityLabel: String?
    private let testID: String?

    public init(
        variant: LSNewSessionVariant = .header,
        label: String = "Session",
        size: LSNewSessionSize = .md,
        onPress: (() -> Void)? = nil,
        disabled: Bool = false,
        accessibilityLabel: String? = nil,
        testID: String? = nil
    ) {
        self.variant = variant
        self.label = label
        self.size = size
        self.onPress = onPress
        self.disabled = disabled
        self.accessibilityLabel = accessibilityLabel
        self.testID = testID
    }

    // MARK: - Layout Computed Properties

    private var iconSize: CGFloat {
        switch size {
        case .sm:
            return 20
        case .lg:
            return 28
        case .md:
            return 24
        }
    }

    private var fontSize: CGFloat {
        switch size {
        case .sm:
            return 13
        case .lg:
            return 16
        case .md:
            return 14
        }
    }

    private var padding: CGFloat {
        switch size {
        case .sm:
            return theme.space.xs // 4
        case .lg:
            return theme.space.md // 8
        case .md:
            return theme.space.sm // 6
        }
    }

    private var fontWeight: Font.Weight {
        switch variant {
        case .text:
            return .bold // 700
        case .header, .fab:
            return .semibold // 600
        }
    }

    private var spacing: CGFloat {
        switch variant {
        case .header:
            return 6
        case .fab:
            return 0
        case .text:
            return 8
        }
    }

    // MARK: - Color Computed Properties

    private var iconColor: Color {
        if disabled {
            return theme.colors.onSurface.subtle
        }

        switch variant {
        case .header:
            return theme.colors.primary.default
        case .fab:
            return theme.colors.onPrimary.default
        case .text:
            return theme.colors.primary.default
        }
    }

    private var textColor: Color {
        if disabled {
            return theme.colors.onSurface.subtle
        }

        switch variant {
        case .header:
            return theme.colors.onSurface.muted
        case .fab:
            return theme.colors.onPrimary.default
        case .text:
            return theme.colors.primary.default
        }
    }

    private var backgroundColor: Color {
        if disabled {
            return theme.colors.surfaceVariant.default
        }

        if isPressed {
            return theme.colors.primary.pressed ?? theme.colors.primary.default
        }

        return theme.colors.primary.default
    }

    // MARK: - Body

    public var body: some View {
        Group {
            switch variant {
            case .fab:
                fabContent
            case .header:
                headerContent
            case .text:
                textContent
            }
        }
        .disabled(disabled)
        .opacity(disabled ? 0.5 : (isPressed ? 0.8 : 1.0))
        .accessibilityAddTraits(.isButton)
        .accessibilityAddTraits(disabled ? .notEnabled : [])
        .accessibilityLabel(accessibilityLabel ?? computedAccessibilityLabel)
        .accessibilityIdentifier(testID ?? "new-session-button")
    }

    // MARK: - FAB Content

    private var fabContent: some View {
        let fabSize: CGFloat = {
            switch size {
            case .sm:
                return 48
            case .lg:
                return 64
            case .md:
                return 56
            }
        }()

        return Button(action: {
            onPress?()
        }) {
            LSIconSymbol(
                name: "plus",
                size: iconSize,
                color: iconColor
            )
            .frame(width: fabSize, height: fabSize)
            .background(backgroundColor)
            .clipShape(Circle())
            .shadow(
                color: theme.elevation.level3.shadowColor,
                radius: theme.elevation.level3.radius,
                x: theme.elevation.level3.offsetX,
                y: theme.elevation.level3.offsetY
            )
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !disabled {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    isPressed = false
                }
        )
    }

    // MARK: - Header Content

    private var headerContent: some View {
        Button(action: {
            onPress?()
        }) {
            HStack(spacing: spacing) {
                LSIconSymbol(
                    name: "plus-circle-outline",
                    size: iconSize,
                    color: iconColor
                )

                Text(label)
                    .font(.system(size: fontSize, weight: fontWeight))
                    .foregroundStyle(textColor)
            }
            .padding(padding)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !disabled {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    isPressed = false
                }
        )
    }

    // MARK: - Text Content

    private var textContent: some View {
        Button(action: {
            onPress?()
        }) {
            HStack(spacing: spacing) {
                LSIconSymbol(
                    name: "plus-circle-outline",
                    size: iconSize,
                    color: iconColor
                )

                Text(label)
                    .font(.system(size: fontSize, weight: fontWeight))
                    .foregroundStyle(textColor)
            }
            .padding(padding)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !disabled {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    isPressed = false
                }
        )
    }

    // MARK: - Helpers

    private var computedAccessibilityLabel: String {
        switch variant {
        case .fab:
            return "New session"
        case .header, .text:
            return "New \(label)"
        }
    }
}

// MARK: - Preview

#Preview("NewSessionButton - Header") {
    VStack(spacing: 16) {
        LSNewSessionButton(
            variant: .header,
            label: "Session",
            size: .sm,
            onPress: {}
        )

        LSNewSessionButton(
            variant: .header,
            label: "Session",
            size: .md,
            onPress: {}
        )

        LSNewSessionButton(
            variant: .header,
            label: "Session",
            size: .lg,
            onPress: {}
        )

        LSNewSessionButton(
            variant: .header,
            label: "Session",
            size: .md,
            onPress: {},
            disabled: true
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("NewSessionButton - FAB") {
    VStack(spacing: 16) {
        LSNewSessionButton(
            variant: .fab,
            label: "Session",
            size: .sm,
            onPress: {}
        )

        LSNewSessionButton(
            variant: .fab,
            label: "Session",
            size: .md,
            onPress: {}
        )

        LSNewSessionButton(
            variant: .fab,
            label: "Session",
            size: .lg,
            onPress: {}
        )

        LSNewSessionButton(
            variant: .fab,
            label: "Session",
            size: .md,
            onPress: {},
            disabled: true
        )
    }
    .padding()
    .laneShadowTheme()
}

#Preview("NewSessionButton - Text") {
    VStack(spacing: 16) {
        LSNewSessionButton(
            variant: .text,
            label: "Session",
            size: .sm,
            onPress: {}
        )

        LSNewSessionButton(
            variant: .text,
            label: "Session",
            size: .md,
            onPress: {}
        )

        LSNewSessionButton(
            variant: .text,
            label: "Session",
            size: .lg,
            onPress: {}
        )

        LSNewSessionButton(
            variant: .text,
            label: "Session",
            size: .md,
            onPress: {},
            disabled: true
        )
    }
    .padding()
    .laneShadowTheme()
}
