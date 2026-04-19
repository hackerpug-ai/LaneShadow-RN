import LaneShadowTheme
import SwiftUI

// MARK: - Date Range Preset

/**
 * Date range preset options
 *
 * Defines the available preset time ranges for filtering.
 */
public enum LSDateRangePreset: String, CaseIterable, Sendable {
    case all = "All time"
    case week = "Last week"
    case month = "Last month"
    case threeMonths = "Last 3 months"

    /// Returns the number of days to go back from today (nil for "all time")
    var daysBack: Int? {
        switch self {
        case .all: nil
        case .week: 7
        case .month: 30
        case .threeMonths: 90
        }
    }
}

// MARK: - Date Range Model

/**
 * Date range model
 *
 * Represents a filtered date range with optional bounds.
 */
public struct LSDateRange: Sendable, Equatable {
    public var afterDate: Date?
    public var beforeDate: Date?

    public init(afterDate: Date? = nil, beforeDate: Date? = nil) {
        self.afterDate = afterDate
        self.beforeDate = beforeDate
    }

    /// Empty date range (no filtering)
    public static let empty = LSDateRange()
}

// MARK: - Date Range Picker Component

/**
 * Date range picker molecule component
 *
 * Chip-style date range selector with preset options for filtering by creation date.
 * Following React Native component from react-native/components/ui/date-range-picker.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Selected background: `theme.colors.primary.default`
 *   - Selected text: `theme.colors.onPrimary.default`
 *   - Unselected background: `theme.colors.surfaceVariant.default`
 *   - Unselected text: `theme.colors.onSurface.default`
 *   - Border: `theme.colors.border.default` (1pt)
 * - Layout:
 *   - Corner radius: pill shape (`theme.radius.full`)
 *   - Padding: horizontal 12pt, vertical 6pt
 *   - Spacing between chips: 6pt
 *   - Horizontal scroll padding: 12pt
 * - Typography:
 *   - Label: `theme.type.label.sm` (small, semibold)
 *
 * ## Behavior
 * - Default selected: `.all`
 * - Tapping same chip toggles back to `.all`
 * - On selection, computes `afterDate = now - daysBack` days
 * - Horizontal scrolling when chips overflow
 *
 * ## Parameters
 * - onDateRangeChange: Callback when range changes with computed `LSDateRange`
 * - testID: Optional testing identifier for UI tests
 */
public struct LSDateRangePicker: View {
    @Environment(\.theme) private var theme
    @State private var selectedPreset: LSDateRangePreset = .all

    private let onDateRangeChange: (LSDateRange) -> Void
    private let testID: String

    public init(
        onDateRangeChange: @escaping (LSDateRange) -> Void,
        testID: String = "date-range-picker"
    ) {
        self.onDateRangeChange = onDateRangeChange
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: theme.space.sm) {
                ForEach(LSDateRangePreset.allCases, id: \.self) { preset in
                    chipButton(for: preset)
                }
            }
            .padding(.horizontal, theme.space.md)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Date range filter")
    }

    // MARK: - Chip Button

    @ViewBuilder
    private func chipButton(for preset: LSDateRangePreset) -> some View {
        let isSelected = selectedPreset == preset

        Button(action: {
            handlePresetTap(preset)
        }) {
            Text(preset.rawValue)
                .font(.system(size: theme.type.label.sm.fontSize, weight: theme.type.label.sm.fontWeight))
                .foregroundStyle(isSelected ? theme.colors.onPrimary.default : theme.colors.onSurface.default)
                .padding(.horizontal, theme.space.md)
                .padding(.vertical, theme.space.sm)
                .background(
                    RoundedRectangle(cornerRadius: theme.radius.full)
                        .fill(isSelected ? theme.colors.primary.default : theme.colors.surfaceVariant.default)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: theme.radius.full)
                        .stroke(theme.colors.border.default, lineWidth: isSelected ? 0 : 1)
                )
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityLabel(preset.rawValue)
        .accessibilityValue(isSelected ? "Selected" : "Not selected")
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
        .accessibilityIdentifier(
            "\(testID)-chip-\(preset.rawValue.lowercased().replacingOccurrences(of: " ", with: "-"))"
        )
    }

    // MARK: - Interaction Handlers

    private func handlePresetTap(_ preset: LSDateRangePreset) {
        if preset == .all {
            selectedPreset = .all
            onDateRangeChange(.empty)
            return
        }

        if preset == selectedPreset {
            // Toggle off — deselect back to "All time"
            selectedPreset = .all
            onDateRangeChange(.empty)
            return
        }

        selectedPreset = preset
        onDateRangeChange(computeDateRange(for: preset))
    }

    private func computeDateRange(for preset: LSDateRangePreset) -> LSDateRange {
        guard let daysBack = preset.daysBack else {
            return .empty
        }

        let calendar = Calendar.current
        let now = Date()
        guard let afterDate = calendar.date(byAdding: .day, value: -daysBack, to: now) else {
            return .empty
        }

        return LSDateRange(afterDate: afterDate, beforeDate: nil)
    }
}

// MARK: - Preview

#Preview("DateRangePicker - Default") {
    LSDateRangePicker { range in
        print("Date range changed:")
        print("  After: \(range.afterDate?.description ?? "none")")
        print("  Before: \(range.beforeDate?.description ?? "none")")
    }
    .laneShadowTheme()
}

#Preview("DateRangePicker - With Initial Selection") {
    VStack(spacing: 20) {
        Text("Filter rides by date")
            .font(.headline)

        LSDateRangePicker { range in
            print("Date range changed:")
            print("  After: \(range.afterDate?.description ?? "none")")
            print("  Before: \(range.beforeDate?.description ?? "none")")
        }

        Text("Selected range will appear above")
            .font(.caption)
            .foregroundStyle(.secondary)
    }
    .laneShadowTheme()
}

#Preview("DateRangePicker - Light Mode") {
    LSDateRangePicker { range in
        print("Range: \(range.afterDate?.description ?? "none")")
    }
    .laneShadowTheme()
    .preferredColorScheme(.light)
}

#Preview("DateRangePicker - Dark Mode") {
    LSDateRangePicker { range in
        print("Range: \(range.afterDate?.description ?? "none")")
    }
    .laneShadowTheme()
    .preferredColorScheme(.dark)
}
