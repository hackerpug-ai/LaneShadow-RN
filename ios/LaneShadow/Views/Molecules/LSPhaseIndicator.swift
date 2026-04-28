import LaneShadowTheme
import SwiftUI

public struct LSPhaseIndicator: View {
    @Environment(\.theme) private var theme

    public typealias Phase = PlanningPhase

    private let phases: [Phase]
    private let header: String
    private let showWarningChrome: Bool

    public init(
        phases: [Phase],
        header: String,
        showWarningChrome: Bool = false
    ) {
        self.phases = phases
        self.header = header
        self.showWarningChrome = showWarningChrome
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
            .foregroundStyle(showWarningChrome ? LaneShadowTheme.color.status.warning.default : LaneShadowTheme.color.signal.default)
            .overlay {
                RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
                    .stroke(compassChipBorderColor, lineWidth: theme.borderWidth.hairline)
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
        if showWarningChrome {
            return LaneShadowTheme.color.status.warning.default
        }
        if phases.allSatisfy({ $0.state == .done }) {
            return LaneShadowTheme.color.status.success.default
        }
        return LaneShadowTheme.color.signal.default
    }

    private var compassChipBackground: Color {
        if showWarningChrome {
            return LaneShadowTheme.color.status.warning.default.opacity(0.1)
        }
        if phases.allSatisfy({ $0.state == .done }) {
            return LaneShadowTheme.color.status.success.default.opacity(0.1)
        }
        return LaneShadowTheme.color.signal.default.opacity(0.22)
    }

    private var compassChipBorderColor: Color {
        if showWarningChrome {
            return LaneShadowTheme.color.status.warning.default.opacity(0.35)
        }
        return LaneShadowTheme.color.border.default
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
