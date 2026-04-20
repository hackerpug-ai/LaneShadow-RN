import LaneShadowTheme
import SwiftUI

// MARK: - Scenario Model

/**
 * Scenario model for widget preview
 *
 * Defines a demo scenario with different availability states
 */
struct Scenario: Identifiable, Sendable {
    let id = UUID()
    let name: String
    let description: String
    let availability: LSOverlayAvailability
}

// MARK: - Minimal Overlay Widget Preview Component

/**
 * Minimal overlay widget preview molecule component
 *
 * Standalone preview component with static data for visual testing.
 * Following React Native component from react-native/components/map/minimal-overlay-widget-preview.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.background.default`
 *   - Surface variant: `theme.colors.surfaceVariant.default`
 *   - Border: `theme.colors.border.default`
 *   - Primary: `theme.colors.primary.default`
 *   - On surface: `theme.colors.onSurface.default` / `theme.colors.onSurface.muted`
 * - Layout:
 *   - Preview area height: 200pt
 *   - Scenario card width: 200pt
 *   - Scenario card radius: 12pt
 * - Typography:
 *   - Title: 28pt, weight 700
 *   - Subtitle: 16pt
 *   - Section title: 18pt, weight 600
 *   - Scenario name: 16pt, weight 600
 *   - Scenario description: 13pt
 *   - Instructions title: 16pt, weight 600
 *   - Instructions text: 14pt
 *
 * ## Scenarios
 * 1. All Available: wind=true, rain=true, temp=true
 * 2. Wind Only: wind=true, rain=false, temp=false
 * 3. Rain + Temp: wind=false, rain=true, temp=true
 * 4. None Available: all false (widget hidden)
 *
 * ## Layout
 * - Header: Title + subtitle
 * - Preview area: Widget display or hidden state message
 * - Scenario selector: Horizontal scrollable cards
 * - Instructions: How it works section
 */
public struct LSMinimalOverlayWidgetPreview: View {
    @Environment(\.theme) private var theme
    @State private var selectedScenarioIndex = 0
    @State private var activeOverlay: LSOverlayType?

    /// Demo scenarios with different availability states
    private let scenarios: [Scenario] = [
        Scenario(
            name: "All Available",
            description: "Full weather data - all overlays enabled",
            availability: LSOverlayAvailability(wind: true, rain: true, temperature: true)
        ),
        Scenario(
            name: "Wind Only",
            description: "Route has wind data but no rain/temp",
            availability: LSOverlayAvailability(wind: true, rain: false, temperature: false)
        ),
        Scenario(
            name: "Rain + Temp",
            description: "Rain and temp available, wind missing",
            availability: LSOverlayAvailability(wind: false, rain: true, temperature: true)
        ),
        Scenario(
            name: "None Available",
            description: "No overlay data - widget hidden",
            availability: LSOverlayAvailability(wind: false, rain: false, temperature: false)
        ),
    ]

    public init() {}

    // MARK: - Body

    public var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header
                header

                // Widget preview area
                previewArea

                // Scenario selector
                scenariosSection

                // Instructions
                instructions
            }
        }
        .background(theme.colors.background.default)
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            Text("Minimal Overlay Widget")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(theme.colors.onSurface.default)

            Text("Press the center icon to expand")
                .font(.system(size: 16))
                .foregroundStyle(theme.colors.onSurface.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, theme.space.lg)
        .padding(.top, 60)
        .padding(.bottom, theme.space.lg)
        .background(
            Rectangle()
                .fill(theme.colors.border.default)
                .frame(height: 1),
            alignment: .bottom
        )
    }

    // MARK: - Preview Area

    private var previewArea: some View {
        let scenario = scenarios[selectedScenarioIndex]
        let hasAnyData = scenario.availability.wind || scenario.availability.rain || scenario.availability.temperature

        return ZStack {
            if hasAnyData {
                VStack(spacing: theme.space.md) {
                    // Widget
                    LSMinimalOverlayWidget(
                        value: activeOverlay,
                        onValueChange: { newValue in
                            activeOverlay = newValue
                        },
                        availability: scenario.availability,
                        testID: "preview-widget"
                    )

                    // Selection badge
                    if let activeOverlay = activeOverlay {
                        Text("Active: \(activeOverlay.rawValue)")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(theme.colors.primary.default)
                            .padding(.horizontal, theme.space.md)
                            .padding(.vertical, theme.space.sm)
                            .background(
                                RoundedRectangle(cornerRadius: theme.space.md)
                                    .fill(theme.colors.primary.default.opacity(0.2))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: theme.space.md)
                                            .stroke(theme.colors.primary.default, lineWidth: 1)
                                    )
                            )
                    }
                }
            } else {
                // Hidden state
                Text("Widget hidden - no overlay data available")
                    .font(.system(size: 14))
                    .foregroundStyle(theme.colors.onSurface.muted)
            }
        }
        .frame(height: 200)
        .frame(maxWidth: .infinity)
        .background(theme.colors.surfaceVariant.default)
        .overlay(
            Rectangle()
                .fill(theme.colors.border.default)
                .frame(height: 1),
            alignment: .bottom
        )
    }

    // MARK: - Scenarios Section

    private var scenariosSection: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            Text("Scenarios")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(theme.colors.onSurface.default)
                .padding(.horizontal, theme.space.md)
                .padding(.top, theme.space.lg)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: theme.space.md) {
                    ForEach(Array(scenarios.enumerated()), id: \.element.id) { index, scenario in
                        scenarioCard(for: scenario, atIndex: index)
                    }
                }
                .padding(.horizontal, theme.space.md)
            }
        }
    }

    // MARK: - Scenario Card

    private func scenarioCard(for scenario: Scenario, atIndex index: Int) -> some View {
        let isSelected = selectedScenarioIndex == index

        return Button(action: {
            withAnimation(.easeInOut(duration: 0.2)) {
                selectedScenarioIndex = index
                activeOverlay = nil
            }
        }) {
            VStack(alignment: .leading, spacing: theme.space.sm) {
                // Name
                Text(scenario.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(isSelected ? theme.colors.primary.default : theme.colors.onSurface.default)

                // Description
                Text(scenario.description)
                    .font(.system(size: 13))
                    .foregroundStyle(theme.colors.onSurface.muted)
                    .lineLimit(nil)

                // Availability badges
                HStack(spacing: theme.space.xs) {
                    availabilityBadge(title: "Wind", available: scenario.availability.wind)
                    availabilityBadge(title: "Rain", available: scenario.availability.rain)
                    availabilityBadge(title: "Temp", available: scenario.availability.temperature)
                }
            }
            .frame(width: 200, alignment: .leading)
            .padding(theme.space.md)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(theme.colors.surfaceVariant.default.opacity(isSelected ? 0.8 : 1.0))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(
                                isSelected ? theme.colors.primary.default : theme.colors.border.default,
                                lineWidth: 1
                            )
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Availability Badge

    private func availabilityBadge(title: String, available: Bool) -> some View {
        Text(title)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, theme.space.xs)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(badgeColor(for: title, available: available))
            )
    }

    /// Returns badge color based on overlay type and availability
    private func badgeColor(for title: String, available: Bool) -> Color {
        guard available else {
            return Color(white: 0.27) // #444444
        }

        switch title {
        case "Wind":
            return Color(red: 0.192, green: 0.637, blue: 0.384) // #31A362
        case "Rain":
            return Color(red: 0.169, green: 0.604, blue: 0.922) // #2B9AEB
        case "Temp":
            return Color(red: 1.0, green: 0.42, blue: 0.207) // #FF6B35
        default:
            return Color(white: 0.27)
        }
    }

    // MARK: - Instructions

    private var instructions: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            Text("How it works:")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(theme.colors.onSurface.default)

            instructionBullet("Tap center icon to expand/collapse radial menu")
            instructionBullet("Tap an overlay icon to select it (tap again to deselect)")
            instructionBullet("Disabled icons show when data is unavailable")
            instructionBullet("Active overlay shows with copper glow ring")
        }
        .padding(theme.space.lg)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(theme.colors.surfaceVariant.default)
        )
        .padding(.horizontal, theme.space.md)
        .padding(.vertical, theme.space.lg)
    }

    // MARK: - Instruction Bullet

    private func instructionBullet(_ text: String) -> some View {
        HStack(alignment: .top, spacing: theme.space.sm) {
            Text("•")
                .foregroundStyle(theme.colors.onSurface.muted)
            Text(text)
                .font(.system(size: 14))
                .foregroundStyle(theme.colors.onSurface.muted)
        }
    }
}

// MARK: - Preview

#Preview("MinimalOverlayWidgetPreview") {
    LSMinimalOverlayWidgetPreview()
        .laneShadowTheme()
}
