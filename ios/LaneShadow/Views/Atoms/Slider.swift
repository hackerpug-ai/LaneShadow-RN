import LaneShadowTheme
import SwiftUI

// MARK: - Slider Component

/**
 * Slider component
 *
 * Following RN wrapper API from react-native/components/ui/slider.tsx
 * Matrix reference: .spec/prds/native-rewrite/matrices/ui/atoms/Slider.md
 *
 * ## Design Tokens Used
 * - Track height: 8pt
 * - Track corner radius: theme.radius.full
 * - Track background: theme.colors.secondary.default
 * - Range fill: theme.colors.primary.default
 * - Thumb size: 20×20pt
 * - Thumb corner radius: theme.radius.full
 * - Thumb background: theme.colors.background.default
 * - Thumb border: theme.borderWidth.thin (1), theme.colors.primary.default
 * - Thumb shadow: elevation.level2
 * - Thumb offset: y = -6 (centered on track), x = percentage * trackWidth - 10
 * - Disabled opacity: theme.opacity.disabled (0.5)
 * - Touch target: minimum 20pt height
 *
 * ## Parameters
 * - value: Binding<Float> — current value (required)
 * - min: Float — minimum value (default: 0)
 * - max: Float — maximum value (default: 100)
 * - step: Float — step increment (default: 1)
 * - disabled: Bool — whether slider is disabled (default: false)
 * - testID: String? — test identifier for UI testing
 */
public struct LSSlider: View {
    @Environment(\.theme) private var theme

    @Binding private var value: Float
    private let min: Float
    private let max: Float
    private let step: Float
    private let disabled: Bool
    private let testID: String?

    @State private var isDragging = false
    @State private var dragOffset: CGFloat = 0

    // Layout constants from matrix
    private let trackHeight: CGFloat = 8
    private let thumbSize: CGFloat = 20
    private let thumbBorderWidth: CGFloat = 2
    private let containerHeight: CGFloat = 20

    public init(
        value: Binding<Float>,
        min: Float = 0,
        max: Float = 100,
        step: Float = 1,
        disabled: Bool = false,
        testID: String? = nil
    ) {
        _value = value
        self.min = min
        self.max = max
        self.step = step
        self.disabled = disabled
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Track background
                trackBackground

                // Range fill
                rangeFill(width: geometry.size.width)

                // Thumb
                thumb(width: geometry.size.width)
            }
            .frame(height: containerHeight)
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { gesture in
                        guard !disabled else { return }
                        updateValue(from: gesture.location.x, in: geometry.size.width)
                        isDragging = true
                    }
                    .onEnded { _ in
                        isDragging = false
                    }
            )
            .opacity(disabled ? theme.opacity.disabled : 1.0)
            .accessibilityElement()
            .accessibilityLabel("Slider")
            .accessibilityValue(Text("\(Int(value))"))
            .accessibilityAdjustableAction { direction in
                guard !disabled else { return }
                switch direction {
                case .increment:
                    value = Swift.min(max, value + step)
                case .decrement:
                    value = Swift.max(min, value - step)
                @unknown default:
                    break
                }
            }
            .accessibilityIdentifier(testID ?? "slider")
        }
        .frame(height: containerHeight)
    }

    // MARK: - Track Background

    private var trackBackground: some View {
        RoundedRectangle(cornerRadius: theme.radius.full)
            .fill(theme.colors.secondary.default)
            .frame(height: trackHeight)
    }

    // MARK: - Range Fill

    private func rangeFill(width: CGFloat) -> some View {
        let percentage = CGFloat((value - min) / (max - min))
        let fillWidth = width * percentage

        return RoundedRectangle(cornerRadius: theme.radius.full)
            .fill(theme.colors.primary.default)
            .frame(width: fillWidth, height: trackHeight)
    }

    // MARK: - Thumb

    private func thumb(width: CGFloat) -> some View {
        let percentage = CGFloat((value - min) / (max - min))
        let thumbX = (width * percentage) - (thumbSize / 2)

        return Circle()
            .fill(theme.colors.background.default)
            .overlay(
                Circle()
                    .stroke(theme.colors.primary.default, lineWidth: thumbBorderWidth)
            )
            .frame(width: thumbSize, height: thumbSize)
            .shadow(
                color: theme.elevation.level2.shadowColor,
                radius: theme.elevation.level2.radius,
                x: theme.elevation.level2.offsetX,
                y: theme.elevation.level2.offsetY
            )
            .offset(x: thumbX, y: -6)
    }

    // MARK: - Helpers

    private func updateValue(from xPosition: CGFloat, in width: CGFloat) {
        let clampedX = Swift.max(0, Swift.min(xPosition, width))
        let percentage = Float(clampedX / width)
        let rawValue = min + (percentage * (max - min))

        // Snap to step
        let steppedValue = round(rawValue / step) * step
        value = Swift.max(min, Swift.min(max, steppedValue))
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

#Preview("Default") {
    struct SliderDemo: View {
        @State private var sliderValue: Float = 50

        var body: some View {
            VStack(spacing: 32) {
                LSSlider(value: $sliderValue)

                Text("Value: \(Int(sliderValue))")
                    .font(.caption)
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return SliderDemo()
}

#Preview("Custom Range") {
    struct CustomRangeDemo: View {
        @State private var sliderValue: Float = 5

        var body: some View {
            VStack(spacing: 32) {
                LSSlider(
                    value: $sliderValue,
                    min: 0,
                    max: 10,
                    step: 0.5
                )

                Text("Value: \(sliderValue, specifier: "%.1f")")
                    .font(.caption)
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return CustomRangeDemo()
}

#Preview("Disabled") {
    struct DisabledDemo: View {
        @State private var sliderValue: Float = 30

        var body: some View {
            VStack(spacing: 32) {
                LSSlider(
                    value: $sliderValue,
                    disabled: true
                )

                Text("Value: \(Int(sliderValue))")
                    .font(.caption)
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return DisabledDemo()
}

#Preview("Interactive") {
    struct InteractiveDemo: View {
        @State private var sliderValue1: Float = 25
        @State private var sliderValue2: Float = 75
        @State private var sliderValue3: Float = 5.5

        var body: some View {
            VStack(spacing: 48) {
                VStack(spacing: 16) {
                    LSSlider(value: $sliderValue1)
                    Text("Default range (0-100): \(Int(sliderValue1))")
                        .font(.caption)
                }

                VStack(spacing: 16) {
                    LSSlider(
                        value: $sliderValue2,
                        min: 0,
                        max: 1,
                        step: 0.01
                    )
                    Text("Fine steps (0-1): \(sliderValue2, specifier: "%.2f")")
                        .font(.caption)
                }

                VStack(spacing: 16) {
                    LSSlider(
                        value: $sliderValue3,
                        min: 0,
                        max: 10,
                        step: 0.5
                    )
                    Text("Half steps (0-10): \(sliderValue3, specifier: "%.1f")")
                        .font(.caption)
                }

                VStack(spacing: 16) {
                    LSSlider(
                        value: .constant(50),
                        disabled: true
                    )
                    Text("Disabled slider")
                        .font(.caption)
                }
            }
            .padding()
            .laneShadowTheme()
        }
    }

    return InteractiveDemo()
}
