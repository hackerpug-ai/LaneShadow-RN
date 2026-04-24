import LaneShadowTheme
import SwiftUI

public struct LSPhaseIndicator: View {
    @Environment(\.theme) private var theme

    public typealias Phase = PlanningPhase

    private let phases: [Phase]
    private let header: String

    public init(
        phases: [Phase],
        header: String
    ) {
        self.phases = phases
        self.header = header
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            headerSection
            phaseList
        }
        .padding(theme.space.md)
        .background(LaneShadowTheme.color.surface.card)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.xl, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.xl, style: .continuous)
                .stroke(topBorderColor, lineWidth: theme.borderWidth.hairline)
        }
        .accessibilityLabel("Route planning: \(currentStepLabel)")
    }

    private var headerSection: some View {
        HStack(spacing: theme.space.sm) {
            LSPill(size: .sm) {
                LSIcon(name: .compass, size: .xs, color: .signal)
            }
            .background(compassChipBackground)
            .overlay {
                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .stroke(LaneShadowTheme.color.border.default, lineWidth: theme.borderWidth.hairline)
            }

            LSText(header, variant: .heading.sm, color: .primary)
        }
    }

    private var phaseList: some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            ForEach(phases) { phase in
                phaseRow(for: phase)
            }
        }
        .accessibilityLabel("Planning steps")
    }

    private func phaseRow(for phase: Phase) -> some View {
        HStack(spacing: theme.space.sm) {
            LSPhaseDot(state: phase.state)

            LSText(
                phase.label,
                variant: .label.sm,
                color: textColor(for: phase.state)
            )
            .strikethrough(phase.state == .done)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(phase.label)
        .accessibilityValue(phase.state.accessibilityValue)
    }

    private var topBorderColor: Color {
        if phases.allSatisfy({ $0.state == .done }) {
            return LaneShadowTheme.color.status.success.default
        }
        return LaneShadowTheme.color.signal.default
    }

    private var compassChipBackground: Color {
        if phases.allSatisfy({ $0.state == .done }) {
            return LaneShadowTheme.color.status.success.default.opacity(0.1)
        }
        return LaneShadowTheme.color.signal.default.opacity(0.22)
    }

    private var currentStepLabel: String {
        if let activePhase = phases.first(where: { $0.state == .active }) {
            return activePhase.label
        } else if phases.allSatisfy({ $0.state == .done }) {
            return "Complete"
        }
        return "Planning"
    }

    private func textColor(for state: PhaseState) -> ContentColor {
        switch state {
        case .pending: .tertiary
        case .active: .primary
        case .done: .secondary
        }
    }
}

public struct PlanningPhase: Identifiable, Equatable {
    public let id: String
    public let label: String
    public let state: PhaseState

    public init(id: String, label: String, state: PhaseState) {
        self.id = id
        self.label = label
        self.state = state
    }
}

private extension PhaseState {
    var accessibilityValue: String {
        switch self {
        case .pending: "Pending"
        case .active: "In progress"
        case .done: "Completed"
        }
    }
}
