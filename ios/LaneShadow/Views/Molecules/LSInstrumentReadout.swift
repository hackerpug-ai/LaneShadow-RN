import LaneShadowTheme
import SwiftUI

/// Instrument readout molecule showing numeric metrics in tabular mono grid
///
/// Renders N-column grid with LSDivider atoms and mono typography values.
/// Supports 2-4 columns with flexible metric types.
///
/// ## Design Tokens Used
/// - Colors:
///   - Container bg: `theme.colors.surface.card`
///   - Label: `theme.colors.content.tertiary`
///   - Value: `theme.colors.content.primary`
///   - Value accent: `theme.colors.primary.default` (copper for scenic score)
///   - Divider: `theme.colors.divider.default`
/// - Typography:
///   - Label: `theme.typography.label.sm`
///   - Value: `theme.typography.instrument.lg` (tabular mono)
/// - Spacing:
///   - Cell padding: `theme.space.sm` / `theme.space.md`
///   - Grid padding: `theme.space.sm` / 0
/// - Layout:
///   - Column count: determined by metrics.count (2-4 supported)
///
/// ## Parameters
/// - metrics: Array of metric definitions with label, value, and optional unit
public struct LSInstrumentReadout: View {
    @Environment(\.theme) private var theme

    public typealias Metric = InstrumentMetric

    private let metrics: [Metric]

    public init(metrics: [Metric]) {
        self.metrics = metrics
    }

    public var body: some View {
        VStack(spacing: 0) {
            // Top divider
            LSDivider()

            // Metric grid
            metricGrid

            // Bottom divider
            LSDivider()
        }
        .background(theme.colors.surface.card)
        .accessibilityLabel("Route metrics")
    }

    // MARK: - Private Views

    private var metricGrid: some View {
        let columnCount = min(max(metrics.count, 2), 4)
        let columns = Array(repeating: GridItem(.flexible(), spacing: 0), count: columnCount)

        return LazyVGrid(columns: columns, spacing: 0) {
            ForEach(metrics) { metric in
                metricCell(for: metric)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("\(metric.label): \(metric.value)")
            }
        }
        .padding(.horizontal, theme.space.sm)
        .padding(.vertical, theme.space.md)
    }

    private func metricCell(for metric: Metric) -> some View {
        VStack(spacing: theme.space.xs) {
            // Label
            LSText(metric.label, variant: .labelSm, color: .tertiary)

            // Value (with optional unit)
            if let unit = metric.unit {
                VStack(spacing: 0) {
                    LSText(
                        metric.value,
                        variant: .instrumentLg,
                        color: metric.isAccent ? .onSignal : .primary
                    )

                    LSText(unit, variant: .labelSm, color: .tertiary)
                }
            } else {
                LSText(
                    metric.value,
                    variant: .instrumentLg,
                    color: metric.isAccent ? .onSignal : .primary
                )
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, theme.space.sm)
    }
}

// MARK: - Instrument Metric Model

/// Instrument metric with label, value, and optional unit
public struct InstrumentMetric: Identifiable, Equatable {
    public let id = UUID()
    public let label: String
    public let value: String
    public let unit: String?
    public let isAccent: Bool

    public init(
        label: String,
        value: String,
        unit: String? = nil,
        isAccent: Bool = false
    ) {
        self.label = label
        self.value = value
        self.unit = unit
        self.isAccent = isAccent
    }

    /// Convenience constructors for common metric types
    public static func dist(_ value: String) -> InstrumentMetric {
        InstrumentMetric(label: "Dist", value: value)
    }

    public static func time(_ value: String) -> InstrumentMetric {
        InstrumentMetric(label: "Time", value: value)
    }

    public static func climb(_ value: String) -> InstrumentMetric {
        InstrumentMetric(label: "Climb", value: value, unit: "ft gain")
    }

    public static func scenic(_ value: String) -> InstrumentMetric {
        InstrumentMetric(label: "Scenic", value: value, isAccent: true)
    }
}

// MARK: - Preview

#Preview("Instrument Readout - 4 Metrics") {
    LSInstrumentReadout(
        metrics: [
            .dist("64 mi"),
            .time("2h 10m"),
            .climb("2,400ft"),
            .scenic("9.2"),
        ]
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Instrument Readout - 3 Metrics") {
    LSInstrumentReadout(
        metrics: [
            .dist("64 mi"),
            .time("2h 10m"),
            .climb("2,400ft"),
        ]
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Instrument Readout - 2 Metrics") {
    LSInstrumentReadout(
        metrics: [
            .dist("64 mi"),
            .time("2h 10m"),
        ]
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Instrument Readout - Long Values") {
    LSInstrumentReadout(
        metrics: [
            InstrumentMetric(label: "Distance", value: "164.2", unit: "miles"),
            InstrumentMetric(label: "Duration", value: "12h 45m"),
            InstrumentMetric(label: "Elevation", value: "12,400", unit: "ft gain"),
            InstrumentMetric(label: "Scenic", value: "9.8", isAccent: true),
        ]
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Dark Theme") {
    LSInstrumentReadout(
        metrics: [
            .dist("64 mi"),
            .time("2h 10m"),
            .climb("2,400ft"),
            .scenic("9.2"),
        ]
    )
    .laneShadowTheme()
    .padding()
    .preferredColorScheme(.dark)
}
