import SwiftUI

public struct DomainColors: Sendable {
    public let waypointOnRoute: ColorSet
    public let waypointOffRoute: ColorSet
    public let waypointMixed: ColorSet
    public let enrichmentFast: ColorSet
    public let enrichmentExtended: ColorSet
    public let enrichmentCached: ColorSet
    public let deviationOriginalRoute: ColorSet
    public let deviationDetourPath: ColorSet
    public let deviationReconnectPoint: ColorSet
    public let locationPoiFill: ColorSet
    public let locationPoiRing: ColorSet
    public let locationPoiMuted: ColorSet
    public let locationPoiBg: ColorSet
    public let orange: ColorSet
}

extension DomainColors {
    static func build(from tokens: SemanticTokens) -> DomainColors {
        let L = tokens.color.light
        let D = tokens.color.dark
        return DomainColors(
            waypointOnRoute: makeColorSet(L, D, "waypointOnRoute"),
            waypointOffRoute: makeColorSet(L, D, "waypointOffRoute"),
            waypointMixed: makeColorSet(L, D, "waypointMixed"),
            enrichmentFast: makeColorSet(L, D, "enrichmentFast"),
            enrichmentExtended: makeColorSet(L, D, "enrichmentExtended"),
            enrichmentCached: makeColorSet(L, D, "enrichmentCached"),
            deviationOriginalRoute: makeColorSet(L, D, "deviationOriginalRoute"),
            deviationDetourPath: makeColorSet(L, D, "deviationDetourPath"),
            deviationReconnectPoint: makeColorSet(L, D, "deviationReconnectPoint"),
            locationPoiFill: makeColorSet(L, D, "locationPoiFill"),
            locationPoiRing: makeColorSet(L, D, "locationPoiRing"),
            locationPoiMuted: makeColorSet(L, D, "locationPoiMuted"),
            locationPoiBg: makeColorSet(L, D, "locationPoiBg"),
            orange: makeColorSet(L, D, "orange")
        )
    }
}
