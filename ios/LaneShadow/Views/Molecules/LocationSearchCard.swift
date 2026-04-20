import LaneShadowTheme
import SwiftUI

// MARK: - Place Result Model

/**
 * Place result model for location search
 *
 * Represents a single place result from location search (nearby or along route).
 */
public struct LSPlaceResult: Identifiable, Sendable {
    public let id: String
    public let name: String
    public let address: String
    public let types: [String]
    public let distanceMeters: Double?
    public let detourMinutes: Int?

    public init(
        id: String,
        name: String,
        address: String,
        types: [String],
        distanceMeters: Double? = nil,
        detourMinutes: Int? = nil
    ) {
        self.id = id
        self.name = name
        self.address = address
        self.types = types
        self.distanceMeters = distanceMeters
        self.detourMinutes = detourMinutes
    }
}

// MARK: - Location Search Status

/**
 * Location search status enum
 *
 * Represents the state of a location search operation.
 */
public enum LSLocationSearchStatus: Sendable, Equatable {
    case running
    case complete(results: [LSPlaceResult])
    case failed(message: String)

    public static func == (lhs: LSLocationSearchStatus, rhs: LSLocationSearchStatus) -> Bool {
        switch (lhs, rhs) {
        case (.running, .running):
            return true
        case (.complete(let lhsResults), .complete(let rhsResults)):
            return lhsResults.map(\.id) == rhsResults.map(\.id)
        case (.failed(let lhsMsg), .failed(let rhsMsg)):
            return lhsMsg == rhsMsg
        default:
            return false
        }
    }
}

// MARK: - Place Type Badge Mapping

/**
 * Maps place types to badge variants
 */
private enum PlaceTypeBadge {
    static func badge(for types: [String]) -> (label: String, variant: BadgeVariant) {
        let typeMap: [String: (label: String, variant: BadgeVariant)] = [
            "gas_station": ("Gas", .warning),
            "restaurant": ("Food", .success),
            "cafe": ("Coffee", .info),
            "coffee_shop": ("Coffee", .info),
            "lodging": ("Stay", .secondary),
            "hotel": ("Stay", .secondary),
            "tourist_attraction": ("Scenic", .default),
            "point_of_interest": ("POI", .default),
            "park": ("Park", .success),
            "parking": ("Parking", .secondary),
            "car_repair": ("Repair", .warning),
            "convenience_store": ("Store", .secondary),
        ]

        for type in types {
            if let mapped = typeMap[type] {
                return mapped
            }
        }

        // Fallback: capitalize first type
        let fallback = types.first?
            .replacingOccurrences(of: "_", with: " ")
            .capitalized ?? "Place"
        return (fallback, .outline)
    }
}

// MARK: - Location Search Card Component

/**
 * Location search card molecule component
 *
 * Renders location search results in chat with running/complete/failed states.
 * Following React Native component from react-native/components/chat/cards/location-search-card.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Running background: `theme.colors.surfaceVariant.default`
 *   - Complete background: `theme.colors.surfaceVariant.default`
 *   - Failed background: `theme.colors.danger.default` at 10% opacity
 *   - Failed border: `theme.colors.danger.default` at 30% opacity
 *   - Pulsing dot: `theme.colors.info.default`
 *   - Text: `theme.colors.onSurface.default`, `theme.colors.muted.default`
 *   - Selected result: `theme.colors.info.default` at 10% opacity
 *   - Badge colors: based on place type mapping
 * - Layout:
 *   - Corner radius: `theme.radius.md`
 *   - Padding: `theme.space.md` (container), `theme.space.sm` (rows)
 *   - Gap: `theme.space.sm` (between elements)
 * - Typography:
 *   - Header: `theme.type.body.sm`
 *   - Place name: `theme.type.body.md` with semibold weight
 *   - Address: `theme.type.body.sm`
 *   - Labels: `theme.type.label.sm`
 * - Radius:
 *   - Card: `theme.radius.md`
 *   - Index circle: 14pt (hardcoded for visual consistency)
 *
 * ## Behavior
 * - Running: Shows pulsing dot (0.4-1.0 opacity animation) with "Searching nearby places..."
 * - Complete: Shows place results with numbered circles, type badges, distances, detour times
 * - Failed: Shows error message with danger-tinted background
 * - Respects accessibilityReduceMotion for pulsing animation
 *
 * ## Parameters
 * - status: LSLocationSearchStatus (running, complete with results, or failed)
 * - headerText: Optional header text from agent (e.g., "Found 3 coffee shops nearby")
 * - selectedResultId: Optional ID of selected result for highlighting
 * - onResultPress: Optional callback when result is tapped
 */
public struct LSLocationSearchCard: View {
    // MARK: - Properties

    @Environment(\.theme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let status: LSLocationSearchStatus
    private let headerText: String
    private let selectedResultId: String?
    private let onResultPress: ((String) -> Void)?

    // MARK: - Initialization

    /// Creates a LocationSearchCard
    /// - Parameters:
    ///   - status: Search status (running, complete, or failed)
    ///   - headerText: Optional header text from agent
    ///   - selectedResultId: Optional ID of selected result
    ///   - onResultPress: Optional callback when result is tapped
    public init(
        status: LSLocationSearchStatus,
        headerText: String = "",
        selectedResultId: String? = nil,
        onResultPress: ((String) -> Void)? = nil
    ) {
        self.status = status
        self.headerText = headerText
        self.selectedResultId = selectedResultId
        self.onResultPress = onResultPress
    }

    // MARK: - Body

    public var body: some View {
        Group {
            switch status {
            case .running:
                runningState
            case .complete(let results):
                completeState(results: results)
            case .failed(let message):
                failedState(message: message)
            }
        }
    }

    // MARK: - Running State

    private var runningState: some View {
        HStack(alignment: .center, spacing: theme.space.sm) {
            pulsingDot
            Text("Searching nearby places...")
                .font(theme.type.body.sm.font)
                .foregroundStyle(theme.colors.muted.default)
        }
        .padding(theme.space.md)
        .background(theme.colors.surfaceVariant.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Searching for places")
        .accessibilityIdentifier("location-search-card-running")
    }

    // MARK: - Complete State

    private func completeState(results: [LSPlaceResult]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header text (agent's conversational summary)
            if !headerText.isEmpty {
                Text(headerText)
                    .font(theme.type.body.sm.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                    .padding(.horizontal, theme.space.md)
                    .padding(.top, theme.space.md)
                    .padding(.bottom, theme.space.xs)
            }

            // Results list
            if results.isEmpty {
                Text("No places found.")
                    .font(theme.type.body.sm.font)
                    .foregroundStyle(theme.colors.muted.default)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(theme.space.md)
            } else {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(results.enumerated()), id: \.element.id) { index, result in
                        PlaceResultRow(
                            result: result,
                            index: index + 1,
                            isSelected: result.id == selectedResultId,
                            onPress: onResultPress
                        )
                    }
                }
                .padding(.horizontal, theme.space.xs)
                .padding(.bottom, theme.space.xs)
            }
        }
        .background(theme.colors.surfaceVariant.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
        .accessibilityIdentifier("location-search-card-complete")
    }

    // MARK: - Failed State

    private func failedState(message: String) -> some View {
        Text(message.isEmpty ? "Search failed." : message)
            .font(theme.type.body.sm.font)
            .foregroundStyle(theme.colors.danger.default)
            .padding(theme.space.md)
            .background(theme.colors.danger.default.opacity(0.1))
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.md)
                    .stroke(theme.colors.danger.default.opacity(0.3), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Search failed")
            .accessibilityIdentifier("location-search-card-failed")
    }

    // MARK: - Pulsing Dot

    private var pulsingDot: some View {
        Circle()
            .fill(theme.colors.info.default)
            .frame(width: 8, height: 8)
            .opacity(pulsingOpacity)
            .onAppear {
                if !reduceMotion {
                    startPulsingAnimation()
                }
            }
            .accessibilityHidden(true)
    }

    @State private var pulsingOpacity: Double = 0.7

    private func startPulsingAnimation() {
        withAnimation(
            Animation.easeInOut(duration: 0.6)
                .repeatForever(autoreverses: true)
        ) {
            pulsingOpacity = 1.0
        }
    }
}

// MARK: - Place Result Row Component

/**
 * Place result row component
 *
 * Displays a single place result with index circle, name, badge, address, and distance/detour info.
 */
private struct PlaceResultRow: View {
    @Environment(\.theme) private var theme

    let result: LSPlaceResult
    let index: Int
    let isSelected: Bool
    let onPress: ((String) -> Void)?

    var body: some View {
        Group {
            if let onPress = onPress {
                Button(action: { onPress(result.id) }) {
                    rowContent
                }
                .buttonStyle(PlainButtonStyle())
            } else {
                rowContent
            }
        }
        .accessibilityLabel("\(result.name), \(result.address)")
        .accessibilityAddTraits(onPress != nil ? .isButton : [])
        .accessibilityIdentifier("location-search-result-\(index)")
    }

    private var rowContent: some View {
        HStack(alignment: .top, spacing: 10) {
            // Numbered circle
            indexCircle

            // Center content
            VStack(alignment: .leading, spacing: 2) {
                // Name with badge
                HStack(alignment: .center, spacing: 6) {
                    Text(result.name)
                        .font(theme.type.body.md.font)
                        .fontWeight(.semibold)
                        .foregroundStyle(theme.colors.onSurface.default)
                        .lineLimit(1)

                    typeBadge
                }

                // Address
                Text(result.address)
                    .font(theme.type.body.sm.font)
                    .foregroundStyle(theme.colors.muted.default)
                    .lineLimit(1)
            }

            Spacer()

            // Right info (distance, detour)
            VStack(alignment: .trailing, spacing: 2) {
                if let detour = result.detourMinutes, detour > 0 {
                    Text("+\(detour) min")
                        .font(theme.type.label.sm.font)
                        .fontWeight(.semibold)
                        .foregroundStyle(theme.colors.warning.default)
                }

                if let distance = result.distanceMeters {
                    Text(formatDistance(distance))
                        .font(theme.type.label.sm.font)
                        .foregroundStyle(theme.colors.muted.default)
                }
            }
        }
        .padding(.vertical, theme.space.sm)
        .padding(.horizontal, theme.space.sm)
        .background(rowBackgroundColor)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
    }

    private var indexCircle: some View {
        Text("\(index)")
            .font(theme.type.label.sm.font)
            .fontWeight(.bold)
            .foregroundStyle(isSelected ? theme.colors.onPrimary.default : theme.colors.info.default)
            .frame(width: 28, height: 28)
            .background(
                Circle()
                    .fill(isSelected ? theme.colors.info.default : theme.colors.info.default.opacity(0.15))
            )
    }

    private var typeBadge: some View {
        let badge = PlaceTypeBadge.badge(for: result.types)
        return Badge(badge.label, variant: badge.variant, opacity: 0.8)
    }

    private var rowBackgroundColor: Color {
        if isSelected {
            return theme.colors.info.default.opacity(0.1)
        }
        return .clear
    }

    private func formatDistance(_ meters: Double) -> String {
        if meters >= 1000 {
            return String(format: "%.1f km", meters / 1000)
        }
        return "\(Int(meters)) m"
    }
}

// MARK: - Preview

#Preview("LocationSearchCard - Running") {
    LSLocationSearchCard(status: .running)
        .laneShadowTheme()
        .padding()
        .frame(width: 350)
}

#Preview("LocationSearchCard - Complete with Results") {
    LSLocationSearchCard(
        status: .complete(results: [
            LSPlaceResult(
                id: "1",
                name: "Blue Bottle Coffee",
                address: "123 Main St, San Francisco",
                types: ["cafe"],
                distanceMeters: 450,
                detourMinutes: 3
            ),
            LSPlaceResult(
                id: "2",
                name: "Philz Coffee",
                address: "456 Oak Ave, San Francisco",
                types: ["coffee_shop"],
                distanceMeters: 1200,
                detourMinutes: 8
            ),
            LSPlaceResult(
                id: "3",
                name: "Chevron Station",
                address: "789 Elm Blvd, San Francisco",
                types: ["gas_station"],
                distanceMeters: 2500,
                detourMinutes: nil
            ),
        ]),
        headerText: "Found 3 places along your route",
        selectedResultId: "1",
        onResultPress: { id in
            print("Selected: \(id)")
        }
    )
    .laneShadowTheme()
    .padding()
    .frame(width: 350)
}

#Preview("LocationSearchCard - Complete Empty") {
    LSLocationSearchCard(
        status: .complete(results: []),
        headerText: "No places found in this area"
    )
    .laneShadowTheme()
    .padding()
    .frame(width: 350)
}

#Preview("LocationSearchCard - Failed") {
    LSLocationSearchCard(
        status: .failed(message: "Unable to search for places. Please check your connection.")
    )
    .laneShadowTheme()
    .padding()
    .frame(width: 350)
}

#Preview("LocationSearchCard - All Place Types") {
    LSLocationSearchCard(
        status: .complete(results: [
            LSPlaceResult(
                id: "gas",
                name: "Shell Station",
                address: "100 Fuel St",
                types: ["gas_station"],
                distanceMeters: 500,
                detourMinutes: 2
            ),
            LSPlaceResult(
                id: "food",
                name: "Taco Bell",
                address: "200 Eat Ave",
                types: ["restaurant"],
                distanceMeters: 800,
                detourMinutes: 5
            ),
            LSPlaceResult(
                id: "stay",
                name: "Marriott Hotel",
                address: "300 Sleep Blvd",
                types: ["lodging"],
                distanceMeters: 5000,
                detourMinutes: 15
            ),
            LSPlaceResult(
                id: "scenic",
                name: "Golden Gate Viewpoint",
                address: "400 Vista Way",
                types: ["tourist_attraction"],
                distanceMeters: 10000,
                detourMinutes: 25
            ),
        ]),
        headerText: "Various place types",
        onResultPress: nil
    )
    .laneShadowTheme()
    .padding()
    .frame(width: 350)
}

#Preview("LocationSearchCard - Dark Mode") {
    VStack(spacing: 16) {
        LSLocationSearchCard(status: .running)

        LSLocationSearchCard(
            status: .complete(results: [
                LSPlaceResult(
                    id: "1",
                    name: "Midnight Diner",
                    address: "123 Night St",
                    types: ["restaurant"],
                    distanceMeters: 650,
                    detourMinutes: 4
                ),
            ]),
            headerText: "Open now"
        )
    }
    .laneShadowTheme()
    .preferredColorScheme(.dark)
    .padding()
    .frame(width: 350)
}
