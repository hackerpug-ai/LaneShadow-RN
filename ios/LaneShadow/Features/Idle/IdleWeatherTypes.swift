import Foundation

enum GreetingScope: String {
    case today
    case tonight

    static func from(hour: Int) -> GreetingScope {
        (hour >= 17) ? .tonight : .today
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

struct FavoriteLocation: Identifiable {
    let id: String
    let lat: Double
    let lon: Double
    let label: String
}
