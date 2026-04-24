import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// Navigator molecule stories — Sprint 4 Navigator components
@MainActor
enum LSNavigatorMoleculesStories {
    static let all: [Story] = phaseIndicatorStories + weatherTimelineStories + instrumentReadoutStories

    // MARK: - LSPhaseIndicator Stories

    static var phaseIndicatorStories: [Story] {
        [
            Story(
                id: "molecules.phaseIndicator.default",
                tier: .molecule,
                component: "LSPhaseIndicator",
                name: "Phase Indicator - In Progress",
                summary: "Shows compass chip, narrator header, and multi-step phase list with active step animation"
            ) { _ in
                LSPhaseIndicator(
                    phases: [
                        PlanningPhase(id: "1", label: "Understanding your request", state: .done),
                        PlanningPhase(id: "2", label: "Searching routes", state: .active),
                        PlanningPhase(id: "3", label: "Checking conditions", state: .pending),
                        PlanningPhase(id: "4", label: "Evaluating options", state: .pending),
                    ],
                    header: "Let me think on that…"
                )
            },

            Story(
                id: "molecules.phaseIndicator.allDone",
                tier: .molecule,
                component: "LSPhaseIndicator",
                name: "Phase Indicator - All Done",
                summary: "Shows completed state with all steps done and green top border"
            ) { _ in
                LSPhaseIndicator(
                    phases: [
                        PlanningPhase(id: "1", label: "Understanding your request", state: .done),
                        PlanningPhase(id: "2", label: "Searching routes", state: .done),
                        PlanningPhase(id: "3", label: "Checking conditions", state: .done),
                        PlanningPhase(id: "4", label: "Evaluating options", state: .done),
                    ],
                    header: "Found 3 great routes"
                )
            },

            Story(
                id: "molecules.phaseIndicator.allPending",
                tier: .molecule,
                component: "LSPhaseIndicator",
                name: "Phase Indicator - All Pending",
                summary: "Shows initial state with all steps pending"
            ) { _ in
                LSPhaseIndicator(
                    phases: [
                        PlanningPhase(id: "1", label: "Understanding your request", state: .pending),
                        PlanningPhase(id: "2", label: "Searching routes", state: .pending),
                        PlanningPhase(id: "3", label: "Checking conditions", state: .pending),
                    ],
                    header: "Starting search…"
                )
            },
        ]
    }

    // MARK: - LSWeatherTimeline Stories

    static var weatherTimelineStories: [Story] {
        [
            Story(
                id: "molecules.weatherTimeline.sixHours",
                tier: .molecule,
                component: "LSWeatherTimeline",
                name: "Weather Timeline - 6 Hours",
                summary: "Shows 6-cell horizontal grid with per-condition tinted backgrounds"
            ) { _ in
                LSWeatherTimeline(
                    entries: [
                        WeatherEntry(hour: "9 AM", condition: .clear, temp: "68°"),
                        WeatherEntry(hour: "10 AM", condition: .clear, temp: "70°"),
                        WeatherEntry(hour: "11 AM", condition: .rain, temp: "65°"),
                        WeatherEntry(hour: "12 PM", condition: .rain, temp: "63°"),
                        WeatherEntry(hour: "1 PM", condition: .wind, temp: "64°"),
                        WeatherEntry(hour: "2 PM", condition: .clear, temp: "67°"),
                    ],
                    from: "9 AM",
                    to: "2 PM"
                )
            },

            Story(
                id: "molecules.weatherTimeline.mixedWeather",
                tier: .molecule,
                component: "LSWeatherTimeline",
                name: "Weather Timeline - Mixed Weather",
                summary: "Shows all six weather conditions with distinct tint colors"
            ) { _ in
                LSWeatherTimeline(
                    entries: [
                        WeatherEntry(hour: "9 AM", condition: .clear, temp: "68°"),
                        WeatherEntry(hour: "10 AM", condition: .rain, temp: "65°"),
                        WeatherEntry(hour: "11 AM", condition: .wind, temp: "63°"),
                        WeatherEntry(hour: "12 PM", condition: .storm, temp: "60°"),
                        WeatherEntry(hour: "1 PM", condition: .hot, temp: "75°"),
                        WeatherEntry(hour: "2 PM", condition: .cold, temp: "55°"),
                    ],
                    from: "9 AM",
                    to: "2 PM"
                )
            },

            Story(
                id: "molecules.weatherTimeline.allClear",
                tier: .molecule,
                component: "LSWeatherTimeline",
                name: "Weather Timeline - All Clear",
                summary: "Shows consistent clear conditions across all hours"
            ) { _ in
                LSWeatherTimeline(
                    entries: [
                        WeatherEntry(hour: "9 AM", condition: .clear, temp: "68°"),
                        WeatherEntry(hour: "10 AM", condition: .clear, temp: "70°"),
                        WeatherEntry(hour: "11 AM", condition: .clear, temp: "72°"),
                        WeatherEntry(hour: "12 PM", condition: .clear, temp: "74°"),
                        WeatherEntry(hour: "1 PM", condition: .clear, temp: "75°"),
                        WeatherEntry(hour: "2 PM", condition: .clear, temp: "73°"),
                    ],
                    from: "9 AM",
                    to: "2 PM"
                )
            },
        ]
    }

    // MARK: - LSInstrumentReadout Stories

    static var instrumentReadoutStories: [Story] {
        [
            Story(
                id: "molecules.instrumentReadout.fourMetrics",
                tier: .molecule,
                component: "LSInstrumentReadout",
                name: "Instrument Readout - 4 Metrics",
                summary: "Shows 4-column grid with distance, time, climb, and scenic score"
            ) { _ in
                LSInstrumentReadout(
                    metrics: [
                        .dist("64 mi"),
                        .time("2h 10m"),
                        .climb("2,400ft"),
                        .scenic("9.2"),
                    ]
                )
            },

            Story(
                id: "molecules.instrumentReadout.threeMetrics",
                tier: .molecule,
                component: "LSInstrumentReadout",
                name: "Instrument Readout - 3 Metrics",
                summary: "Shows 3-column grid with distance, time, and climb"
            ) { _ in
                LSInstrumentReadout(
                    metrics: [
                        .dist("64 mi"),
                        .time("2h 10m"),
                        .climb("2,400ft"),
                    ]
                )
            },

            Story(
                id: "molecules.instrumentReadout.longValues",
                tier: .molecule,
                component: "LSInstrumentReadout",
                name: "Instrument Readout - Long Values",
                summary: "Shows metric grid with longer values and units"
            ) { _ in
                LSInstrumentReadout(
                    metrics: [
                        InstrumentMetric(label: "Distance", value: "164.2", unit: "miles"),
                        InstrumentMetric(label: "Duration", value: "12h 45m"),
                        InstrumentMetric(label: "Elevation", value: "12,400", unit: "ft gain"),
                        InstrumentMetric(label: "Scenic", value: "9.8", isAccent: true),
                    ]
                )
            },
        ]
    }
}
