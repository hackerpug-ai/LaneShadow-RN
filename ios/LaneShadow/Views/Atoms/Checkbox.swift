import LaneShadowTheme
import SwiftUI

// MARK: - Checkbox State Enum

/**
 * Checkbox state variants
 *
 * Following RN wrapper API from react-native/components/ui/checkbox.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Checkbox.md
 */
public enum CheckboxState: Equatable {
    case unchecked
    case checked
    case indeterminate
}

// MARK: - Checkbox Component

/**
 * Checkbox component
 *
 * Following RN wrapper API from react-native/components/ui/checkbox.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Checkbox.md
 *
 * ## Design Tokens Used
 * - Size: 16×16 box (composed from theme space)
 * - Radius: theme.radius.sm (4)
 * - Border width: theme.borderWidth.thin (1)
 * - Border color: theme.colors.primary.default (always)
 * - Background unchecked: .clear
 * - Background checked: theme.colors.primary.default
 * - Background checked+pressed: theme.colors.primary.pressed
 * - Background indeterminate: theme.colors.primary.default
 * - Disabled opacity: theme.opacity.disabled (0.5)
 * - Checkmark: "✓" text, 12pt bold, theme.colors.onPrimary.default
 * - Indeterminate bar: 8×2 RoundedRectangle(cornerRadius: 1), theme.colors.onPrimary.default
 * - Touch target: minimum 44×44
 *
 * ## Parameters
 * - Parameters:
 *   - state: Checkbox state (unchecked, checked, indeterminate)
 *   - onToggle: Optional action callback when checkbox is toggled
 *   - disabled: Whether checkbox is disabled (default: false)
 *   - testID: Test identifier for UI testing
 */
public struct LSCheckbox: View {
    @Environment(\.theme) private var theme
    @State private var isPressed = false

    private let state: CheckboxState
    private let onToggle: (() -> Void)?
    private let disabled: Bool
    private let testID: String?

    private let checkboxSize: CGFloat = 16
    private let checkmarkFontSize: CGFloat = 12
    private let indeterminateBarSize: CGFloat = 8
    private let indeterminateBarHeight: CGFloat = 2
    private let indeterminateBarCornerRadius: CGFloat = 1
    private let minTouchTarget: CGFloat = 44

    public init(
        state: CheckboxState = .unchecked,
        onToggle: (() -> Void)? = nil,
        disabled: Bool = false,
        testID: String? = nil
    ) {
        self.state = state
        self.onToggle = onToggle
        self.disabled = disabled
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        Button(action: {
            guard !disabled else { return }
            onToggle?()
        }) {
            checkboxContent
        }
        .buttonStyle(.plain)
        .disabled(disabled)
        .frame(width: minTouchTarget, height: minTouchTarget)
        .contentShape(Rectangle())
        .accessibilityAddTraits(.isButton)
        .accessibilityLabel(accessibilityLabelForState)
        .accessibilityValue(accessibilityValueForState)
        .if(disabled) { view in
            view.accessibilityAddTraits(.notEnabled)
        }
        .accessibilityIdentifier(testID ?? "checkbox")
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

    // MARK: - Checkbox Content

    @ViewBuilder
    private var checkboxContent: some View {
        ZStack {
            // Background
            RoundedRectangle(cornerRadius: theme.radius.sm)
                .fill(backgroundColorForState)
                .frame(width: checkboxSize, height: checkboxSize)
                .overlay(
                    RoundedRectangle(cornerRadius: theme.radius.sm)
                        .stroke(borderColorForState, lineWidth: theme.borderWidth.thin)
                )

            // Checkmark or indeterminate bar
            if state != .unchecked {
                contentForState
            }
        }
        .opacity(disabled ? theme.opacity.disabled : 1.0)
    }

    // MARK: - State-Dependent Content

    @ViewBuilder
    private var contentForState: some View {
        switch state {
        case .unchecked:
            EmptyView()
        case .checked:
            Text("✓")
                .font(.system(size: checkmarkFontSize, weight: .bold))
                .foregroundStyle(theme.colors.onPrimary.default)
        case .indeterminate:
            RoundedRectangle(cornerRadius: indeterminateBarCornerRadius)
                .fill(theme.colors.onPrimary.default)
                .frame(width: indeterminateBarSize, height: indeterminateBarHeight)
        }
    }

    // MARK: - Color Computed Properties

    private var backgroundColorForState: Color {
        if disabled {
            return .clear
        }

        if state == .unchecked {
            return .clear
        }

        if isPressed {
            return theme.colors.primary.pressed ?? theme.colors.primary.default
        }

        return theme.colors.primary.default
    }

    private var borderColorForState: Color {
        if disabled {
            return theme.colors.onSurface.disabled ?? theme.colors.onSurface.default
        }
        return theme.colors.primary.default
    }

    // MARK: - Accessibility

    private var accessibilityLabelForState: String {
        switch state {
        case .unchecked:
            return "Checkbox"
        case .checked:
            return "Checkbox"
        case .indeterminate:
            return "Checkbox"
        }
    }

    private var accessibilityValueForState: Text {
        switch state {
        case .unchecked:
            return Text("Unchecked")
        case .checked:
            return Text("Checked")
        case .indeterminate:
            return Text("Indeterminate")
        }
    }
}

// MARK: - View Conditional Extension

private extension View {
    @ViewBuilder
    func `if`(_ condition: Bool, transform: (Self) -> some View) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

// MARK: - Preview

#Preview("Unchecked") {
    LSCheckbox(state: .unchecked)
        .laneShadowTheme()
}

#Preview("Checked") {
    LSCheckbox(state: .checked)
        .laneShadowTheme()
}

#Preview("Indeterminate") {
    LSCheckbox(state: .indeterminate)
        .laneShadowTheme()
}

#Preview("Disabled Unchecked") {
    LSCheckbox(state: .unchecked, disabled: true)
        .laneShadowTheme()
}

#Preview("Disabled Checked") {
    LSCheckbox(state: .checked, disabled: true)
        .laneShadowTheme()
}

#Preview("Interactive") {
    struct InteractiveCheckboxDemo: View {
        @State private var checkboxState: CheckboxState = .unchecked

        var body: some View {
            VStack(spacing: 16) {
                LSCheckbox(
                    state: checkboxState,
                    onToggle: {
                        switch checkboxState {
                        case .unchecked:
                            checkboxState = .checked
                        case .checked:
                            checkboxState = .indeterminate
                        case .indeterminate:
                            checkboxState = .unchecked
                        }
                    }
                )

                Text("State: \(stateName)")
                    .font(.caption)
            }
            .laneShadowTheme()
        }

        private var stateName: String {
            switch checkboxState {
            case .unchecked:
                return "Unchecked"
            case .checked:
                return "Checked"
            case .indeterminate:
                return "Indeterminate"
            }
        }
    }

    return InteractiveCheckboxDemo()
}
