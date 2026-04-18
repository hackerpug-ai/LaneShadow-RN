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

    public static let shared: DomainColors = build()
}

private extension DomainColors {
    static func build() -> DomainColors {
        let L = Tokens.Semantic.Color.Light.self
        let D = Tokens.Semantic.Color.Dark.self
        return DomainColors(
            waypointOnRoute: ColorSet(
                default: dyn(L.WaypointOnRoute.default, D.WaypointOnRoute.default),
                hover: dyn(L.WaypointOnRoute.hover, D.WaypointOnRoute.hover),
                pressed: dyn(L.WaypointOnRoute.pressed, D.WaypointOnRoute.pressed),
                disabled: dyn(L.WaypointOnRoute.disabled, D.WaypointOnRoute.disabled)
            ),
            waypointOffRoute: ColorSet(
                default: dyn(L.WaypointOffRoute.default, D.WaypointOffRoute.default),
                hover: dyn(L.WaypointOffRoute.hover, D.WaypointOffRoute.hover),
                pressed: dyn(L.WaypointOffRoute.pressed, D.WaypointOffRoute.pressed),
                disabled: dyn(L.WaypointOffRoute.disabled, D.WaypointOffRoute.disabled)
            ),
            waypointMixed: ColorSet(
                default: dyn(L.WaypointMixed.default, D.WaypointMixed.default),
                hover: dyn(L.WaypointMixed.hover, D.WaypointMixed.hover),
                pressed: dyn(L.WaypointMixed.pressed, D.WaypointMixed.pressed),
                disabled: dyn(L.WaypointMixed.disabled, D.WaypointMixed.disabled)
            ),
            enrichmentFast: ColorSet(
                default: dyn(L.EnrichmentFast.default, D.EnrichmentFast.default),
                hover: dyn(L.EnrichmentFast.hover, D.EnrichmentFast.hover),
                pressed: dyn(L.EnrichmentFast.pressed, D.EnrichmentFast.pressed),
                disabled: dyn(L.EnrichmentFast.disabled, D.EnrichmentFast.disabled)
            ),
            enrichmentExtended: ColorSet(
                default: dyn(L.EnrichmentExtended.default, D.EnrichmentExtended.default),
                hover: dyn(L.EnrichmentExtended.hover, D.EnrichmentExtended.hover),
                pressed: dyn(L.EnrichmentExtended.pressed, D.EnrichmentExtended.pressed),
                disabled: dyn(L.EnrichmentExtended.disabled, D.EnrichmentExtended.disabled)
            ),
            enrichmentCached: ColorSet(
                default: dyn(L.EnrichmentCached.default, D.EnrichmentCached.default),
                hover: dyn(L.EnrichmentCached.hover, D.EnrichmentCached.hover),
                pressed: dyn(L.EnrichmentCached.pressed, D.EnrichmentCached.pressed),
                disabled: dyn(L.EnrichmentCached.disabled, D.EnrichmentCached.disabled)
            ),
            deviationOriginalRoute: ColorSet(
                default: dyn(L.DeviationOriginalRoute.default, D.DeviationOriginalRoute.default),
                hover: dyn(L.DeviationOriginalRoute.hover, D.DeviationOriginalRoute.hover),
                pressed: dyn(L.DeviationOriginalRoute.pressed, D.DeviationOriginalRoute.pressed),
                disabled: dyn(L.DeviationOriginalRoute.disabled, D.DeviationOriginalRoute.disabled)
            ),
            deviationDetourPath: ColorSet(
                default: dyn(L.DeviationDetourPath.default, D.DeviationDetourPath.default),
                hover: dyn(L.DeviationDetourPath.hover, D.DeviationDetourPath.hover),
                pressed: dyn(L.DeviationDetourPath.pressed, D.DeviationDetourPath.pressed),
                disabled: dyn(L.DeviationDetourPath.disabled, D.DeviationDetourPath.disabled)
            ),
            deviationReconnectPoint: ColorSet(
                default: dyn(L.DeviationReconnectPoint.default, D.DeviationReconnectPoint.default),
                hover: dyn(L.DeviationReconnectPoint.hover, D.DeviationReconnectPoint.hover),
                pressed: dyn(L.DeviationReconnectPoint.pressed, D.DeviationReconnectPoint.pressed),
                disabled: dyn(L.DeviationReconnectPoint.disabled, D.DeviationReconnectPoint.disabled)
            ),
            locationPoiFill: ColorSet(
                default: dyn(L.LocationPoiFill.default, D.LocationPoiFill.default),
                hover: dyn(L.LocationPoiFill.hover, D.LocationPoiFill.hover),
                pressed: dyn(L.LocationPoiFill.pressed, D.LocationPoiFill.pressed),
                disabled: dyn(L.LocationPoiFill.disabled, D.LocationPoiFill.disabled)
            ),
            locationPoiRing: ColorSet(
                default: dyn(L.LocationPoiRing.default, D.LocationPoiRing.default),
                hover: dyn(L.LocationPoiRing.hover, D.LocationPoiRing.hover),
                pressed: dyn(L.LocationPoiRing.pressed, D.LocationPoiRing.pressed),
                disabled: dyn(L.LocationPoiRing.disabled, D.LocationPoiRing.disabled)
            ),
            locationPoiMuted: ColorSet(
                default: dyn(L.LocationPoiMuted.default, D.LocationPoiMuted.default),
                hover: dyn(L.LocationPoiMuted.hover, D.LocationPoiMuted.hover),
                pressed: dyn(L.LocationPoiMuted.pressed, D.LocationPoiMuted.pressed),
                disabled: dyn(L.LocationPoiMuted.disabled, D.LocationPoiMuted.disabled)
            ),
            locationPoiBg: ColorSet(
                default: dyn(L.LocationPoiBg.default, D.LocationPoiBg.default),
                hover: dyn(L.LocationPoiBg.hover, D.LocationPoiBg.hover),
                pressed: dyn(L.LocationPoiBg.pressed, D.LocationPoiBg.pressed),
                disabled: dyn(L.LocationPoiBg.disabled, D.LocationPoiBg.disabled)
            ),
            orange: ColorSet(
                default: dyn(L.Orange.default, D.Orange.default),
                hover: dyn(L.Orange.hover, D.Orange.hover),
                pressed: dyn(L.Orange.pressed, D.Orange.pressed),
                disabled: dyn(L.Orange.disabled, D.Orange.disabled)
            )
        )
    }
}
