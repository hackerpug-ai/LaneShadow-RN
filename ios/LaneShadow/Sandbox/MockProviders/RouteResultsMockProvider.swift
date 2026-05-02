import Foundation

/// Mock provider for Route Results screen data.
///
/// Provides navigator message, route list, and selected route
/// for the Route Results/route-selection screen.
public enum RouteResultsMockProvider: MockProvider {
    public static let variants = [
        "default",
        "empty",
        "overflow",
        "long-copy",
        "s02-alt-selected",
        "s04-refining",
        "v03-recall",
    ]

    public static func value(variant: String = "default") -> RouteResultsScreenState {
        switch variant {
        case "empty":
            emptyState()
        case "overflow":
            overflowState()
        case "long-copy":
            longCopyState()
        case "s02-alt-selected":
            s02AltSelectedState()
        case "s04-refining":
            s04RefiningState()
        case "v03-recall":
            v03RecallState()
        default:
            defaultState()
        }
    }
}
