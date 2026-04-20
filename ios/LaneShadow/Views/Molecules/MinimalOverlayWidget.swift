import LaneShadowTheme
import SwiftUI

// MARK: - Overlay Type

/**
 * Overlay type enum
 *
 * Defines the three weather overlay types available in the map view.
 */
public enum LSOverlayType: String, CaseIterable, Sendable {
    case wind
    case rain
    case temperature

    /// SF Symbol name for this overlay type
    var icon: String {
        switch self {
        case .wind: "wind"
        case .rain: "drop"
        case .temperature: "thermometer"
        }
    }

    /// Accessibility label for this overlay type
    var accessibilityLabel: String {
        switch self {
        case .wind: "Wind"
        case .rain: "Rain"
        case .temperature: "Temperature"
        }
    }
}

// MARK: - Overlay Availability

/**
 * Overlay availability model
 *
 * Defines which overlay types are currently available for selection.
 */
public struct LSOverlayAvailability: Sendable {
    public let wind: Bool
    public let rain: Bool
    public let temperature: Bool

    public init(
        wind: Bool,
        rain: Bool,
        temperature: Bool
    ) {
        self.wind = wind
        self.rain = rain
        self.temperature = temperature
    }

    /// Returns availability for a given overlay type
    func isAvailable(_ overlayType: LSOverlayType) -> Bool {
        switch overlayType {
        case .wind: wind
        case .rain: rain
        case .temperature: temperature
        }
    }
}

// MARK: - Minimal Overlay Widget Component

/**
 * Minimal overlay widget molecule component
 *
 * A compact, single-icon weather overlay control that expands into a radial menu.
 * Inspired by motorcycle instrument dials and compass navigation.
 * Following React Native component from react-native/components/map/minimal-overlay-widget.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Center button background: `theme.colors.surfaceVariant.default`
 *   - Active indicator border: `theme.colors.primary.default`
 *   - Selected overlay background: `theme.colors.primary.default` at 20% opacity
 *   - Border: `theme.colors.border.default` (1.5pt for center, 1pt for radial icons)
 *   - Unavailable opacity: 0.4
 * - Layout:
 *   - Container: 120×120pt
 *   - Center button: 40×40pt circle
 *   - Active ring: 48×48pt circle
 *   - Radial icons: 36×36pt circles
 *   - Radial radius: 36pt from center
 *   - Center button border: 1.5pt
 *   - Radial icon border: 1pt
 * - Animation:
 *   - Expand/collapse: spring animation
 *   - Icon positions: easeInOut 0.2s
 * - Icons:
 *   - Wind: "wind" (SF Symbol)
 *   - Rain: "drop" (SF Symbol)
 *   - Temperature: "thermometer" (SF Symbol)
 *   - Default (none selected): "square.stack.3d.up"
 *   - Radial icon size: 18pt
 *   - Center icon size: 20pt
 *
 * ## States
 * - Collapsed: Single icon showing active overlay (or stack icon when none)
 * - Expanded: Three icons arc outward (wind at -30°, rain at 0°, temperature at 30°)
 * - Selected: Active overlay glows with primary border and 20% opacity background
 *
 * ## Parameters
 * - value: Currently selected overlay type (nil for none)
 * - onValueChange: Callback when selection changes (toggle behavior: selecting same overlay deselects)
 * - availability: Which overlays are available for selection
 * - testID: Testing identifier
 */
public struct LSMinimalOverlayWidget: View {
    @Environment(\.theme) private var theme
    @State private var isExpanded = false

    private let value: LSOverlayType?
    private let onValueChange: (LSOverlayType?) -> Void
    private let availability: LSOverlayAvailability
    private let testID: String?

    /// Radial positions (angles in degrees)
    private let radialPositions: [(angle: Double, overlay: LSOverlayType)] = [
        (-30, .wind),
        (0, .rain),
        (30, .temperature),
    ]

    private let radialRadius: CGFloat = 36

    public init(
        value: LSOverlayType?,
        onValueChange: @escaping (LSOverlayType?) -> Void,
        availability: LSOverlayAvailability,
        testID: String? = nil
    ) {
        self.value = value
        self.onValueChange = onValueChange
        self.availability = availability
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        ZStack {
            // Radial icons (expanded state)
            ForEach(radialPositions, id: \.overlay) { position in
                radialIcon(for: position.overlay, at: position.angle)
            }

            // Center toggle button
            centerButton
        }
        .frame(width: 120, height: 120)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Weather overlays")
    }

    // MARK: - Center Button

    private var centerButton: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                isExpanded.toggle()
            }
        }) {
            ZStack {
                // Active indicator ring
                if value != nil {
                    Circle()
                        .stroke(theme.colors.primary.default, lineWidth: 2)
                        .frame(width: 48, height: 48)
                }

                // Center button background
                Circle()
                    .fill(theme.colors.surfaceVariant.default)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Circle()
                            .stroke(
                                value != nil ? theme.colors.primary.default : theme.colors.border.default,
                                lineWidth: 1.5
                            )
                    )

                // Center icon
                Image(systemName: currentIcon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(
                        value != nil ? theme.colors.primary.default : theme.colors.onSurface.default
                    )
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Weather overlays")
        .accessibilityHint(isExpanded ? "Double tap to collapse" : "Double tap to expand")
    }

    // MARK: - Radial Icon

    private func radialIcon(for overlayType: LSOverlayType, at angle: Double) -> some View {
        let isAvailable = availability.isAvailable(overlayType)
        let isSelected = value == overlayType

        let radians = angle * .pi / 180
        let xOffset = CGFloat(sin(radians)) * radialRadius
        let yOffset = CGFloat(-cos(radians)) * radialRadius

        return Button(action: {
            guard isAvailable else { return }

            // Toggle behavior: selecting same overlay deselects it
            let newValue: LSOverlayType? = if value == overlayType {
                nil
            } else {
                overlayType
            }

            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                onValueChange(newValue)
                isExpanded = false
            }
        }) {
            ZStack {
                // Background
                Circle()
                    .fill(
                        isSelected
                            ? theme.colors.primary.default.opacity(0.2)
                            : theme.colors.surfaceVariant.default
                    )
                    .frame(width: 36, height: 36)

                // Border
                Circle()
                    .stroke(
                        isSelected ? theme.colors.primary.default : theme.colors.border.default,
                        lineWidth: 1
                    )
                    .frame(width: 36, height: 36)

                // Icon
                Image(systemName: overlayType.icon)
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(
                        isSelected
                            ? theme.colors.primary.default
                            : theme.colors.onSurface.muted
                    )
            }
        }
        .buttonStyle(.plain)
        .offset(x: isExpanded ? xOffset : 0, y: isExpanded ? yOffset : 0)
        .opacity(isExpanded ? (isAvailable ? 1.0 : 0.4) : 0)
        .scaleEffect(isExpanded ? 1.0 : 0)
        .animation(.easeInOut(duration: 0.2), value: isExpanded)
        .disabled(!isAvailable)
        .accessibilityLabel(overlayType.accessibilityLabel)
        .accessibilityValue(isSelected ? "Selected" : "Not selected")
        .accessibilityAddTraits(isSelected ? [.isSelected, .isButton] : .isButton)
    }

    // MARK: - Computed Properties

    /// Returns the current icon to display in the center button
    private var currentIcon: String {
        guard let value else {
            return "square.stack.3d.up" // Stack icon when nothing selected
        }
        return value.icon
    }
}

// MARK: - Preview

#Preview("MinimalOverlayWidget - No selection") {
    struct PreviewWrapper: View {
        @State private var selectedValue: LSOverlayType? = nil

        var body: some View {
            LSMinimalOverlayWidget(
                value: selectedValue,
                onValueChange: { newValue in
                    selectedValue = newValue
                },
                availability: LSOverlayAvailability(
                    wind: true,
                    rain: true,
                    temperature: true
                )
            )
        }
    }

    return PreviewWrapper()
        .padding()
        .laneShadowTheme()
}

#Preview("MinimalOverlayWidget - Wind selected") {
    struct PreviewWrapper: View {
        @State private var selectedValue: LSOverlayType? = .wind

        var body: some View {
            LSMinimalOverlayWidget(
                value: selectedValue,
                onValueChange: { newValue in
                    selectedValue = newValue
                },
                availability: LSOverlayAvailability(
                    wind: true,
                    rain: true,
                    temperature: true
                )
            )
        }
    }

    return PreviewWrapper()
        .padding()
        .laneShadowTheme()
}

#Preview("MinimalOverlayWidget - Partial availability") {
    struct PreviewWrapper: View {
        @State private var selectedValue: LSOverlayType? = nil

        var body: some View {
            LSMinimalOverlayWidget(
                value: selectedValue,
                onValueChange: { newValue in
                    selectedValue = newValue
                },
                availability: LSOverlayAvailability(
                    wind: true,
                    rain: false, // Not available
                    temperature: true
                )
            )
        }
    }

    return PreviewWrapper()
        .padding()
        .laneShadowTheme()
}

#Preview("MinimalOverlayWidget - Dark theme") {
    struct PreviewWrapper: View {
        @State private var selectedValue: LSOverlayType? = .rain

        var body: some View {
            LSMinimalOverlayWidget(
                value: selectedValue,
                onValueChange: { newValue in
                    selectedValue = newValue
                },
                availability: LSOverlayAvailability(
                    wind: true,
                    rain: true,
                    temperature: true
                )
            )
        }
    }

    return PreviewWrapper()
        .padding()
        .laneShadowTheme()
        .preferredColorScheme(.dark)
}
