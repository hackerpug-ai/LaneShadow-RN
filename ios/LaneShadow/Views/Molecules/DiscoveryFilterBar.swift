import LaneShadowTheme
import SwiftUI

// MARK: - Route Archetype Enum

/**
 * Route archetype enum
 *
 * Following RN API from react-native/components/discovery/discovery-filter-bar.tsx
 * Represents different types of motorcycle routes for filtering
 */
public enum LSRouteArchetype: String, CaseIterable, Sendable {
    case all
    case twisties
    case scenic
    case technical
    case cruising
    case sport
    case adventure

    /// Display label for this archetype
    var label: String {
        switch self {
        case .all: return "All"
        case .twisties: return "Twisties"
        case .scenic: return "Scenic"
        case .technical: return "Technical"
        case .cruising: return "Cruising"
        case .sport: return "Sport"
        case .adventure: return "Adventure"
        }
    }

    /// Icon name for this archetype (optional)
    var iconName: String? {
        switch self {
        case .all: return "checkmark.circle.fill"
        case .twisties: return "road.variant"
        case .scenic: return "landscape.fill"
        case .technical: return "wrench.fill"
        case .cruising: return "bicycle"
        case .sport: return "flame.fill"
        case .adventure: return "compass.fill"
        }
    }
}

// MARK: - Discovery Filter Bar Component

/**
 * Discovery filter bar molecule component
 *
 * Horizontal scrollable archetype filter chips for route discovery.
 * Glassmorphic design with semi-transparent background.
 * Following React Native component from react-native/components/discovery/discovery-filter-bar.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default` with 0.8 opacity
 *   - Border: `theme.colors.border.default` with 0.2 opacity
 * - Layout:
 *   - Padding: `theme.space.md` top/bottom, `theme.space.lg` horizontal
 *   - Chip spacing: `theme.space.sm`
 * - Glassmorphic effect: Semi-transparent surface with bottom border
 *
 * ## Behavior
 * - "All" chip clears the filter (sets selection to empty)
 * - Other archetypes toggle selection
 * - Deselecting last archetype shows all (clears filter)
 * - Count badges display formatted (e.g., "Scenic (12)", "Twisties (99+)", "All (1.2k)")
 *
 * ## Parameters
 * - selectedArchetypes: Array of currently selected archetypes
 * - onArchetypeChange: Callback when selection changes
 * - counts: Dictionary of archetype counts to display
 * - testID: Optional testing identifier for UI tests
 */
public struct LSDiscoveryFilterBar: View {
    @Environment(\.theme) private var theme

    private let selectedArchetypes: [LSRouteArchetype]
    private let onArchetypeChange: ([LSRouteArchetype]) -> Void
    private let counts: [LSRouteArchetype: Int]
    private let testID: String

    public init(
        selectedArchetypes: [LSRouteArchetype],
        onArchetypeChange: @escaping ([LSRouteArchetype]) -> Void,
        counts: [LSRouteArchetype: Int],
        testID: String = "discovery-filter-bar"
    ) {
        self.selectedArchetypes = selectedArchetypes
        self.onArchetypeChange = onArchetypeChange
        self.counts = counts
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        VStack(spacing: 0) {
            // Glassmorphic background container
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: theme.space.sm) {
                    // "All" chip
                    archetypeChip(for: .all)

                    // Archetype chips (exclude "all" from iteration)
                    ForEach(LSRouteArchetype.allCases.filter { $0 != .all }, id: \.self) { archetype in
                        archetypeChip(for: archetype)
                    }
                }
                .padding(.horizontal, theme.space.lg)
                .padding(.vertical, theme.space.md)
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Route archetype filters")

            // Bottom border
            Rectangle()
                .fill(theme.colors.border.default.opacity(0.2))
                .frame(height: theme.borderWidth.thin)
        }
        .background(theme.colors.surface.default.opacity(0.8))
    }

    // MARK: - Archetype Chip

    @ViewBuilder
    private func archetypeChip(for archetype: LSRouteArchetype) -> some View {
        let isSelected = isSelected(archetype)
        let count = counts[archetype] ?? 0
        let label = "\(archetype.label) (\(formatCount(count)))"

        LSChip(
            label,
            selected: isSelected,
            onPress: {
                handleArchetypeTap(archetype)
            },
            icon: {
                if let iconName = archetype.iconName {
                    AnyView(Image(systemName: iconName))
                } else {
                    AnyView(EmptyView())
                }
            },
            testID: "\(testID)-chip-\(archetype.rawValue)"
        )
    }

    // MARK: - Selection Logic

    private func isSelected(_ archetype: LSRouteArchetype) -> Bool {
        if archetype == .all {
            return selectedArchetypes.isEmpty
        }
        return selectedArchetypes.contains(archetype)
    }

    private func handleArchetypeTap(_ archetype: LSRouteArchetype) {
        if archetype == .all {
            // "All" clears the filter
            onArchetypeChange([])
            return
        }

        // Toggle the archetype
        let isSelected = selectedArchetypes.contains(archetype)
        if isSelected {
            // If deselecting and this was the only one, show all
            if selectedArchetypes.count == 1 {
                onArchetypeChange([])
            } else {
                onArchetypeChange(selectedArchetypes.filter { $0 != archetype })
            }
        } else {
            // Add to selection
            onArchetypeChange(selectedArchetypes + [archetype])
        }
    }

    // MARK: - Count Formatting

    /**
     * Format count for display (e.g., 12, 99+, 1.2k)
     */
    private func formatCount(_ count: Int) -> String {
        if count >= 1000 {
            return String(format: "%.1fk", Double(count) / 1000.0)
        }
        if count > 99 {
            return "99+"
        }
        return String(count)
    }
}

// MARK: - Test Helper

extension LSDiscoveryFilterBar {
    /**
     * Test helper to simulate tapping an archetype chip
     * Used in unit tests to verify selection behavior
     */
    func simulateTap(archetype: LSRouteArchetype) {
        handleArchetypeTap(archetype)
    }
}

// MARK: - Preview

#Preview("Discovery Filter Bar") {
    VStack(alignment: .leading, spacing: 24) {
        Text("Discovery Filter Bar")
            .font(.title)
            .fontWeight(.bold)
            .padding(.horizontal)

        VStack(alignment: .leading, spacing: 8) {
            Text("No Selection (All selected)")
                .font(.headline)
                .padding(.horizontal)

            LSDiscoveryFilterBar(
                selectedArchetypes: [],
                onArchetypeChange: { archetypes in
                    print("Selected: \(archetypes)")
                },
                counts: [
                    .all: 1250,
                    .scenic: 250,
                    .twisties: 300,
                    .technical: 150,
                    .cruising: 200,
                    .sport: 100,
                    .adventure: 50
                ]
            )
        }

        VStack(alignment: .leading, spacing: 8) {
            Text("Multiple Selection")
                .font(.headline)
                .padding(.horizontal)

            LSDiscoveryFilterBar(
                selectedArchetypes: [.scenic, .twisties],
                onArchetypeChange: { archetypes in
                    print("Selected: \(archetypes)")
                },
                counts: [
                    .all: 1250,
                    .scenic: 250,
                    .twisties: 300,
                    .technical: 150,
                    .cruising: 200,
                    .sport: 100,
                    .adventure: 50
                ]
            )
        }

        VStack(alignment: .leading, spacing: 8) {
            Text("Single Selection")
                .font(.headline)
                .padding(.horizontal)

            LSDiscoveryFilterBar(
                selectedArchetypes: [.technical],
                onArchetypeChange: { archetypes in
                    print("Selected: \(archetypes)")
                },
                counts: [
                    .all: 1250,
                    .scenic: 250,
                    .twisties: 300,
                    .technical: 150,
                    .cruising: 200,
                    .sport: 100,
                    .adventure: 50
                ]
            )
        }

        Spacer()
    }
    .laneShadowTheme()
}
