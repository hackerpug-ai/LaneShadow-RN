import LaneShadowTheme
import SwiftUI

public struct LSInstrumentReadout: View {
    @Environment(\.theme) private var theme

    public typealias Metric = InstrumentMetric

    private let metrics: [Metric]

    public init(metrics: [Metric]) {
        self.metrics = metrics
    }

    public var body: some View {
        VStack(spacing: 0) {
            LSDivider()

            let columnCount = min(max(metrics.count, 2), 4)
            let columns = Array(repeating: GridItem(.flexible(), spacing: 0), count: columnCount)

            LazyVGrid(columns: columns, spacing: 0) {
                ForEach(metrics) { metric in
                    metricCell(for: metric)
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("\(metric.label): \(metric.value)")
                }
            }
            .padding(.horizontal, theme.space.sm)
            .padding(.vertical, theme.space.md)

            LSDivider()
        }
        .background(LaneShadowTheme.color.surface.card)
        .accessibilityLabel("Route metrics")
    }

    private func metricCell(for metric: Metric) -> some View {
        VStack(spacing: theme.space.xs) {
            LSText(metric.label, variant: .label.sm, color: .tertiary)

            if let unit = metric.unit {
                VStack(spacing: 0) {
                    LSText(
                        metric.value,
                        variant: .label.lg,
                        color: metric.isAccent ? .onSignal : .primary
                    )
                    LSText(unit, variant: .label.sm, color: .tertiary)
                }
            } else {
                LSText(
                    metric.value,
                    variant: .label.lg,
                    color: metric.isAccent ? .onSignal : .primary
                )
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, theme.space.sm)
    }
}

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
