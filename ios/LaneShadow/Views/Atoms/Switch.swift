import LaneShadowTheme
import SwiftUI

// MARK: - Switch Component

/**
 * Switch atom component
 *
 * Following RN wrapper API from react-native/components/ui/switch.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Switch.md
 *
 * ## Design Tokens Used
 * - Track size: 44×24pt, capsule shape
 * - Track background unchecked: theme.colors.muted.default
 * - Track background checked: theme.colors.primary.default
 * - Thumb size: 20×20pt, circle
 * - Thumb background: theme.colors.surface.default
 * - Thumb shadow: radius 4, y offset 2
 * - Thumb position unchecked: x offset 2
 * - Thumb position checked: x offset 22
 * - Thumb animation: .easeInOut(duration: 0.2)
 * - Disabled opacity: theme.opacity.disabled (0.5)
 * - Touch target: minimum 44×44
 *
 * ## Parameters
 * - Parameters:
 *   - value: Binding to current on/off state
 *   - onValueChange: Optional callback when switch is toggled
 *   - disabled: Whether switch is disabled (default: false)
 *   - testID: Test identifier for UI testing
 */
public struct LSSwitch: View {
    @Environment(\.theme) private var theme
    @Binding private var value: Bool
    private let onValueChange: ((Bool) -> Void)?
    private let disabled: Bool
    private let testID: String?

    // Layout constants
    private let trackWidth: CGFloat = 44
    private let trackHeight: CGFloat = 24
    private let thumbSize: CGFloat = 20
    private let thumbOffsetUnchecked: CGFloat = 2
    private let thumbOffsetChecked: CGFloat = 22
    private let minTouchTarget: CGFloat = 44
    private let shadowRadius: CGFloat = 4
    private let shadowYOffset: CGFloat = 2
    private let animationDuration: Double = 0.2

    /// Creates a Switch
    /// - Parameters:
    ///   - value: Binding to current on/off state
    ///   - onValueChange: Optional callback when switch is toggled
    ///   - disabled: Whether switch is disabled (default: false)
    ///   - testID: Test identifier for UI testing
    public init(
        value: Binding<Bool>,
        onValueChange: ((Bool) -> Void)? = nil,
        disabled: Bool = false,
        testID: String? = nil
    ) {
        _value = value
        self.onValueChange = onValueChange
        self.disabled = disabled
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        Button(action: {
            guard !disabled else { return }
            value.toggle()
            onValueChange?(value)
        }) {
            switchContent
        }
        .buttonStyle(.plain)
        .disabled(disabled)
        .frame(width: minTouchTarget, height: minTouchTarget)
        .contentShape(Rectangle())
        .accessibilityAddTraits(.isButton)
        .accessibilityValue(value ? "1" : "0")
        .accessibilityIdentifier(testID ?? "switch")
    }

    // MARK: - Switch Content

    private var switchContent: some View {
        ZStack(alignment: .leading) {
            // Track
            RoundedRectangle(cornerRadius: trackHeight / 2)
                .fill(trackColor)
                .frame(width: trackWidth, height: trackHeight)

            // Thumb
            Circle()
                .fill(theme.colors.surface.default)
                .frame(width: thumbSize, height: thumbSize)
                .shadow(
                    color: theme.elevation.level1.shadowColor,
                    radius: theme.elevation.level1.radius,
                    x: theme.elevation.level1.offsetX,
                    y: theme.elevation.level1.offsetY
                )
                .offset(x: value ? thumbOffsetChecked : thumbOffsetUnchecked)
                .animation(.easeInOut(duration: animationDuration), value: value)
        }
        .opacity(disabled ? theme.opacity.disabled : 1.0)
    }

    // MARK: - Color Computed Properties

    private var trackColor: Color {
        if value {
            theme.colors.primary.default
        } else {
            theme.colors.muted.default
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
    LSSwitch(value: .constant(false))
        .laneShadowTheme()
}

#Preview("Checked") {
    LSSwitch(value: .constant(true))
        .laneShadowTheme()
}

#Preview("Disabled Unchecked") {
    LSSwitch(value: .constant(false), disabled: true)
        .laneShadowTheme()
}

#Preview("Disabled Checked") {
    LSSwitch(value: .constant(true), disabled: true)
        .laneShadowTheme()
}

#Preview("Interactive") {
    struct InteractiveSwitchDemo: View {
        @State private var isOn = false

        var body: some View {
            VStack(spacing: 24) {
                LSSwitch(
                    value: $isOn,
                    onValueChange: { newValue in
                        print("Switch changed to: \(newValue)")
                    }
                )

                Text("State: \(isOn ? "On" : "Off")")
                    .font(.caption)
            }
            .laneShadowTheme()
        }
    }

    return InteractiveSwitchDemo()
}

#Preview("All variants") {
    struct AllVariantsDemo: View {
        @State private var switch1 = false
        @State private var switch2 = true
        @State private var switch3 = false

        var body: some View {
            VStack(spacing: 16) {
                HStack {
                    Text("Normal unchecked")
                    Spacer()
                    LSSwitch(value: $switch1)
                }

                HStack {
                    Text("Normal checked")
                    Spacer()
                    LSSwitch(value: $switch2)
                }

                HStack {
                    Text("Disabled unchecked")
                    Spacer()
                    LSSwitch(value: .constant(false), disabled: true)
                }

                HStack {
                    Text("Disabled checked")
                    Spacer()
                    LSSwitch(value: .constant(true), disabled: true)
                }

                HStack {
                    Text("With callback")
                    Spacer()
                    LSSwitch(
                        value: $switch3,
                        onValueChange: { newValue in
                            print("Callback: \(newValue)")
                        }
                    )
                }
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return AllVariantsDemo()
}
