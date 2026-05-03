import Foundation

struct RouteDetailsViewState {
    let routeTitle: String
    let distanceKm: String
    let durationFormatted: String
    let elevationM: String
    let scenicScore: String
    let weatherEntries: [WeatherEntry]
    let isSaved: Bool
    let isPendingEnrichment: Bool
    let error: LaneShadowError?
    let polylines: [PolylineData]
    let isBest: Bool
    let timeRange: (String, String)
}
