import LaneShadowTheme
import SwiftUI

/// Phase indicator molecule showing Navigator's planning pipeline
///
/// Composes LSPhaseDot atoms with LSText labels to show multi-step progress.
/// Includes compass chip and narrator header using LSPill and LSIcon.
///
/// ## Design Tokens Used
/// - Colors:
///   - Compass chip bg: `theme.colors.primary.default.opacity(0.22)` (signal whisper at 22%)
///   - Compass chip border: `theme.colors.border.default` (signal tint)
///   - Compass icon: `theme.colors.primary.default` (signal default)
///   - Header text: `theme.colors.content.primary`
///   - Step label pending: `theme.colors.content.tertiary`
///   - Step label active: `theme.colors.content.primary`
///   - Step label done: `theme.colors.content.secondary`
/// - Typography:
///   - Header: `theme.typography.opinionMd` (italic Newsreader)
///   - Step label: `theme.typography.instrumentSm` (tabular mono)
/// - Spacing:
///   - Container padding: `theme.space.md` / `theme.space.lg`
///   - Step gap: `theme.space.md`
///   - Dot-label gap: `theme.space.sm`
///
/// ## Parameters
/// - phases: Array of planning steps with label and state
/// - header: Narrator text shown above phase list
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
            // Compass chip + header
            headerSection

            // Phase step list
            phaseList
        }
        .padding(theme.space.md)
        .background(theme.colors.surface.card)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.xl))
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.xl)
                .stroke(topBorderColor, lineWidth: theme.borderWidth.thin)
        }
        .shadow(
            color: theme.colors.scrim.opacity(0.1),
            radius: theme.elevation.level2.radius,
            x: theme.elevation.level2.offsetX,
            y: theme.elevation.level2.offsetY
        )
        .accessibilityLabel("Route planning: \(currentStepLabel)")
        .accessivityLiveRegion(.polite)
    }

    // MARK: - Private Views

    private var headerSection: some View {
        HStack(spacing: theme.space.sm) {
            // Compass chip
            compassChip

            // Narrator header
            LSText(header, variant: .opinionMd, color: .primary)
        }
    }

    private var compassChip: some View {
        LSPill(size: .sm) {
            LSIcon(name: .compass, size: .xs, color: .signal)
        }
        .background(compassChipBackground)
        .overlay {
            RoundedRectangle(cornerRadius: theme.radius.full)
                .stroke(theme.colors.border.default, lineWidth: theme.borderWidth.hairline)
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
                variant: .instrumentSm,
                color: textColor(for: phase.state)
            )
            .strikethrough(phase.state == .done)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(phase.label)
        .accessibilityValue(phase.state.accessibilityValue)
        .accessibilityCurrentState(phase.state == .active ? .inProgress : nil)
    }

    // MARK: - Helper Properties

    private var topBorderColor: Color {
        let allDone = phases.allSatisfy { $0.state == .done }
        if allDone {
            return theme.colors.success.default
        } else {
            return theme.colors.primary.default
        }
    }

    private var compassChipBackground: Color {
        let allDone = phases.allSatisfy { $0.state == .done }
        if allDone {
            return theme.colors.success.default.opacity(0.1)
        } else {
            return theme.colors.primary.default.opacity(0.22)
        }
    }

    private var currentStepLabel: String {
        if let activePhase = phases.first(where: { $0.state == .active }) {
            activePhase.label
        } else if phases.allSatisfy({ $0.state == .done }) {
            "Complete"
        } else {
            "Planning"
        }
    }

    // MARK: - Helper Methods

    private func textColor(for state: PhaseState) -> ContentColor {
        switch state {
        case .pending:
            .tertiary
        case .active:
            .primary
        case .done:
            .secondary
        }
    }
}

// MARK: - Planning Phase Model

/// Planning phase step with label and state
public struct PlanningPhase: Identifiable, Equatable {
    public let id: String
    public let label: String
    public let state: PhaseState

    public init(
        id: String,
        label: String,
        state: PhaseState
    ) {
        self.id = id
        self.label = label
        self.state = state
    }
}

// MARK: - PhaseState Extensions

private extension PhaseState {
    var accessibilityValue: String {
        switch self {
        case .pending:
            "Pending"
        case .active:
            "In progress"
        case .done:
            "Completed"
        }
    }
}

// MARK: - Preview

#Preview("Phase Indicator - In Progress") {
    LSPhaseIndicator(
        phases: [
            PlanningPhase(id: "1", label: "Understanding your request", state: .done),
            PlanningPhase(id: "2", label: "Searching routes", state: .active),
            PlanningPhase(id: "3", label: "Checking conditions", state: .pending),
            PlanningPhase(id: "4", label: "Evaluating options", state: .pending),
        ],
        header: "Let me think on that…"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Phase Indicator - All Done") {
    LSPhaseIndicator(
        phases: [
            PlanningPhase(id: "1", label: "Understanding your request", state: .done),
            PlanningPhase(id: "2", label: "Searching routes", state: .done),
            PlanningPhase(id: "3", label: "Checking conditions", state: .done),
            PlanningPhase(id: "4", label: "Evaluating options", state: .done),
        ],
        header: "Found 3 great routes"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Phase Indicator - All Pending") {
    LSPhaseIndicator(
        phases: [
            PlanningPhase(id: "1", label: "Understanding your request", state: .pending),
            PlanningPhase(id: "2", label: "Searching routes", state: .pending),
            PlanningPhase(id: "3", label: "Checking conditions", state: .pending),
        ],
        header: "Starting search…"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("Dark Theme") {
    LSPhaseIndicator(
        phases: [
            PlanningPhase(id: "1", label: "Understanding your request", state: .done),
            PlanningPhase(id: "2", label: "Searching routes", state: .active),
            PlanningPhase(id: "3", label: "Checking conditions", state: .pending),
        ],
        header: "Let me think on that…"
    )
    .laneShadowTheme()
    .padding()
    .preferredColorScheme(.dark)
}
