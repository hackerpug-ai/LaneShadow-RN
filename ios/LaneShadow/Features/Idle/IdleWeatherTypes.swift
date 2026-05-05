import Foundation

enum GreetingScope: String {
    case today
    case tonight

    static func from(hour: Int) -> GreetingScope {
        (hour >= 18 || hour < 5) ? .tonight : .today
    }
}

struct CurrentWeatherSummary {
    let tempF: Int
    let condition: String
    let severity: WeatherSeverity
    let dayOfWeek: String
}

enum WeatherSeverity: String {
    case normal
    case advisory
    case warning
}

public struct FavoriteLocation: Identifiable, Sendable {
    public let id: String
    public let lat: Double
    public let lon: Double
    public let label: String

    public init(id: String, lat: Double, lon: Double, label: String) {
        self.id = id
        self.lat = lat
        self.lon = lon
        self.label = label
    }
}
