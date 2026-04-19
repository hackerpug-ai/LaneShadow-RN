import LaneShadowTheme
import SwiftUI

// MARK: - Departure Time Selector Component

/**
 * Departure time selector molecule component
 *
 * Date/time picker with styled trigger button for selecting ride departure times.
 * Following React Native component from react-native/components/ui/departure-time-selector.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default`
 *   - Text: `theme.colors.onSurface.default`
 *   - Border: `theme.colors.border.default` (1pt)
 *   - Primary accent: `theme.colors.primary.default` (icons, 12% alpha background, 30% alpha border)
 * - Layout:
 *   - Corner radius: `theme.radius.sm` (8pt)
 *   - Padding: horizontal 16pt, vertical 12pt
 *   - Spacing between label and button: 8pt
 *   - Spacing between button elements: 8pt
 * - Typography:
 *   - Label: 13pt semibold, uppercase, 0.5 letter spacing, 60% opacity
 *   - Button text: 15pt medium
 *
 * ## Behavior
 * - Tapping button opens date picker in sheet (graphical style)
 * - Date formats: "Today, 2:30 PM" / "Tomorrow, 9:00 AM" / "Mar 15, 2:30 PM"
 * - Minimum date defaults to current time
 * - Minute interval: 15 minutes
 *
 * ## Parameters
 * - value: Binding to currently selected departure time
 * - label: Optional label text (default: "Departure")
 * - minimumDate: Minimum selectable date (default: nil → current time)
 * - testID: Optional testing identifier
 */
public struct LSDepartureTimeSelector: View {
    @Environment(\.theme) private var theme
    @Binding private var value: Date
    @State private var showPicker = false

    private let label: String
    private let minimumDate: Date?
    private let testID: String

    public init(
        value: Binding<Date>,
        label: String = "Departure",
        minimumDate: Date? = nil,
        testID: String = "departure-time-selector"
    ) {
        _value = value
        self.label = label
        self.minimumDate = minimumDate
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            // Label
            Text(label.uppercased())
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
                .tracking(0.5)
                .accessibilityIdentifier("\(testID)-label")

            // Trigger button
            Button(action: {
                showPicker = true
            }) {
                HStack(spacing: theme.space.sm) {
                    // Clock icon
                    Image(systemName: "clock")
                        .font(.system(size: 18))
                        .foregroundStyle(theme.colors.primary.default)

                    // Formatted date/time
                    Text(formatDepartureTime(value))
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(theme.colors.onSurface.default)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    // Chevron indicator
                    Image(systemName: "chevron.down")
                        .font(.system(size: 18))
                        .foregroundStyle(theme.colors.primary.default)
                }
                .padding(.horizontal, theme.space.md)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: theme.radius.sm)
                        .fill(theme.colors.primary.default.opacity(0.12))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: theme.radius.sm)
                        .stroke(theme.colors.primary.default.opacity(0.3), lineWidth: 1)
                )
            }
            .buttonStyle(PlainButtonStyle())
            .accessibilityLabel("Departure time: \(formatDepartureTime(value))")
            .accessibilityHint("Double tap to change departure time")
            .accessibilityIdentifier("\(testID)-button")
        }
        .sheet(isPresented: $showPicker) {
            datePickerSheet
        }
    }

    // MARK: - Date Picker Sheet

    private var datePickerSheet: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Date picker
                DatePicker(
                    "",
                    selection: $value,
                    in: effectiveMinimumDate...,
                    displayedComponents: [.date, .hourAndMinute]
                )
                .datePickerStyle(.graphical)
                .padding()
                .environment(\.timeZone, TimeZone.current)

                Spacer()
            }
            .navigationTitle("Select Time")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showPicker = false
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        showPicker = false
                    }
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Date Formatting

    /**
     * Formats a date for display
     * Shows "Today, 2:30 PM" or "Tomorrow, 9:00 AM" or "Mar 15, 2:30 PM"
     */
    private func formatDepartureTime(_ date: Date) -> String {
        let calendar = Calendar.current
        let now = Date()
        let today = calendar.startOfDay(for: now)
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: today)!
        let targetDay = calendar.startOfDay(for: date)

        let formatter = DateFormatter()
        formatter.timeZone = TimeZone.current
        formatter.locale = Locale(identifier: "en_US")

        // Time format: "2:30 PM"
        formatter.dateFormat = "h:mm a"
        let timeStr = formatter.string(from: date)

        if targetDay == today {
            return "Today, \(timeStr)"
        } else if targetDay == tomorrow {
            return "Tomorrow, \(timeStr)"
        } else {
            // Date format: "Mar 15"
            formatter.dateFormat = "MMM d"
            let dateStr = formatter.string(from: date)
            return "\(dateStr), \(timeStr)"
        }
    }

    // MARK: - Computed Properties

    private var effectiveMinimumDate: Date {
        minimumDate ?? Date()
    }
}

// MARK: - Preview

#Preview("DepartureTimeSelector - Today") {
    struct TodayPreview: View {
        @State private var selectedDate = Date()

        var body: some View {
            VStack(spacing: 20) {
                Text("Plan Your Ride")
                    .font(.title2)
                    .fontWeight(.bold)

                LSDepartureTimeSelector(
                    value: $selectedDate,
                    label: "Departure time"
                )

                Text("Selected: \(selectedDate.description)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
        }
    }

    return TodayPreview()
        .laneShadowTheme()
}

#Preview("DepartureTimeSelector - Tomorrow") {
    struct TomorrowPreview: View {
        @State private var selectedDate: Date = Calendar.current.date(byAdding: .day, value: 1, to: Date())!

        var body: some View {
            VStack(spacing: 20) {
                Text("Plan Your Ride")
                    .font(.title2)
                    .fontWeight(.bold)

                LSDepartureTimeSelector(
                    value: $selectedDate,
                    label: "Departure time"
                )

                Text("Selected: \(selectedDate.description)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
        }
    }

    return TomorrowPreview()
        .laneShadowTheme()
}

#Preview("DepartureTimeSelector - Future Date") {
    struct FuturePreview: View {
        @State private var selectedDate: Date = {
            let components = DateComponents(year: 2026, month: 3, day: 15, hour: 14, minute: 30)
            return Calendar.current.date(from: components)!
        }()

        var body: some View {
            VStack(spacing: 20) {
                Text("Plan Your Ride")
                    .font(.title2)
                    .fontWeight(.bold)

                LSDepartureTimeSelector(
                    value: $selectedDate,
                    label: "Departure time"
                )

                Text("Selected: \(selectedDate.description)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
        }
    }

    return FuturePreview()
        .laneShadowTheme()
}

#Preview("DepartureTimeSelector - Light Mode") {
    struct LightPreview: View {
        @State private var selectedDate = Date()

        var body: some View {
            LSDepartureTimeSelector(
                value: $selectedDate,
                label: "Departure"
            )
        }
    }

    return LightPreview()
        .laneShadowTheme()
        .preferredColorScheme(.light)
}

#Preview("DepartureTimeSelector - Dark Mode") {
    struct DarkPreview: View {
        @State private var selectedDate = Date()

        var body: some View {
            LSDepartureTimeSelector(
                value: $selectedDate,
                label: "Departure"
            )
        }
    }

    return DarkPreview()
        .laneShadowTheme()
        .preferredColorScheme(.dark)
}
