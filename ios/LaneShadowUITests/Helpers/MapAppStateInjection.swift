import Foundation

/// Parameter type for injecting an initial MapAppState at app launch via launch arguments.
///
/// Launch argument schema:
/// - .idle: `-MapAppState=idle`
/// - .planning(sessionId): `-MapAppState=planning -SessionId=<sessionId>`
/// - .routeResults(sessionId, routePlanId): `-MapAppState=routeResults -SessionId=<sessionId>
/// -RoutePlanId=<routePlanId>`
///
/// All arguments are case-sensitive and must be passed to `app.launchArguments` before `app.launch()`.
enum MapAppStateInjectionParam {
    case idle
    case planning(sessionId: String)
    case routeResults(sessionId: String, routePlanId: String)

    /// Convert to launch arguments for XCUIApplication.
    /// Returns a flat array of argument strings that will be passed to ProcessInfo.processInfo.arguments.
    var launchArguments: [String] {
        switch self {
        case .idle:
            ["-MapAppState=idle"]
        case let .planning(sessionId):
            ["-MapAppState=planning", "-SessionId=\(sessionId)"]
        case let .routeResults(sessionId, routePlanId):
            ["-MapAppState=routeResults", "-SessionId=\(sessionId)", "-RoutePlanId=\(routePlanId)"]
        }
    }

    /// Parse launch arguments back into a MapAppStateInjectionParam.
    /// Returns nil if arguments are absent or malformed.
    static func parse(from arguments: [String]) -> MapAppStateInjectionParam? {
        guard let stateArg = arguments.first(where: { $0.hasPrefix("-MapAppState=") }) else {
            return nil
        }

        let stateValue = stateArg.replacingOccurrences(of: "-MapAppState=", with: "")

        switch stateValue {
        case "idle":
            return .idle
        case "planning":
            guard let sessionId = arguments.first(where: { $0.hasPrefix("-SessionId=") })
                .map({ $0.replacingOccurrences(of: "-SessionId=", with: "") })
            else {
                return nil
            }
            return .planning(sessionId: sessionId)
        case "routeResults":
            guard let sessionId = arguments.first(where: { $0.hasPrefix("-SessionId=") })
                .map({ $0.replacingOccurrences(of: "-SessionId=", with: "") }),
                let routePlanId = arguments.first(where: { $0.hasPrefix("-RoutePlanId=") })
                .map({ $0.replacingOccurrences(of: "-RoutePlanId=", with: "") })
            else {
                return nil
            }
            return .routeResults(sessionId: sessionId, routePlanId: routePlanId)
        default:
            return nil
        }
    }
}
