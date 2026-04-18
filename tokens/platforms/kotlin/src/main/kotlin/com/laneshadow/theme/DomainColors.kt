package com.laneshadow.theme

import com.laneshadow.theme.generated.Tokens

data class DomainColors(
    val waypointOnRoute: ColorSet,
    val waypointOffRoute: ColorSet,
    val waypointMixed: ColorSet,
    val enrichmentFast: ColorSet,
    val enrichmentExtended: ColorSet,
    val enrichmentCached: ColorSet,
    val deviationOriginalRoute: ColorSet,
    val deviationDetourPath: ColorSet,
    val deviationReconnectPoint: ColorSet,
    val locationPoiFill: ColorSet,
    val locationPoiRing: ColorSet,
    val locationPoiMuted: ColorSet,
    val locationPoiBg: ColorSet,
    val orange: ColorSet,
) {
    companion object {
        fun light(): DomainColors {
            val L = Tokens.Semantic.Color.Light
            return DomainColors(
                waypointOnRoute = ColorSet(L.WaypointOnRoute.`default`, L.WaypointOnRoute.hover, L.WaypointOnRoute.pressed, L.WaypointOnRoute.disabled),
                waypointOffRoute = ColorSet(L.WaypointOffRoute.`default`, L.WaypointOffRoute.hover, L.WaypointOffRoute.pressed, L.WaypointOffRoute.disabled),
                waypointMixed = ColorSet(L.WaypointMixed.`default`, L.WaypointMixed.hover, L.WaypointMixed.pressed, L.WaypointMixed.disabled),
                enrichmentFast = ColorSet(L.EnrichmentFast.`default`, L.EnrichmentFast.hover, L.EnrichmentFast.pressed, L.EnrichmentFast.disabled),
                enrichmentExtended = ColorSet(L.EnrichmentExtended.`default`, L.EnrichmentExtended.hover, L.EnrichmentExtended.pressed, L.EnrichmentExtended.disabled),
                enrichmentCached = ColorSet(L.EnrichmentCached.`default`, L.EnrichmentCached.hover, L.EnrichmentCached.pressed, L.EnrichmentCached.disabled),
                deviationOriginalRoute = ColorSet(L.DeviationOriginalRoute.`default`, L.DeviationOriginalRoute.hover, L.DeviationOriginalRoute.pressed, L.DeviationOriginalRoute.disabled),
                deviationDetourPath = ColorSet(L.DeviationDetourPath.`default`, L.DeviationDetourPath.hover, L.DeviationDetourPath.pressed, L.DeviationDetourPath.disabled),
                deviationReconnectPoint = ColorSet(L.DeviationReconnectPoint.`default`, L.DeviationReconnectPoint.hover, L.DeviationReconnectPoint.pressed, L.DeviationReconnectPoint.disabled),
                locationPoiFill = ColorSet(L.LocationPoiFill.`default`, L.LocationPoiFill.hover, L.LocationPoiFill.pressed, L.LocationPoiFill.disabled),
                locationPoiRing = ColorSet(L.LocationPoiRing.`default`, L.LocationPoiRing.hover, L.LocationPoiRing.pressed, L.LocationPoiRing.disabled),
                locationPoiMuted = ColorSet(L.LocationPoiMuted.`default`, L.LocationPoiMuted.hover, L.LocationPoiMuted.pressed, L.LocationPoiMuted.disabled),
                locationPoiBg = ColorSet(L.LocationPoiBg.`default`, L.LocationPoiBg.hover, L.LocationPoiBg.pressed, L.LocationPoiBg.disabled),
                orange = ColorSet(L.Orange.`default`, L.Orange.hover, L.Orange.pressed, L.Orange.disabled),
            )
        }

        fun dark(): DomainColors {
            val D = Tokens.Semantic.Color.Dark
            return DomainColors(
                waypointOnRoute = ColorSet(D.WaypointOnRoute.`default`, D.WaypointOnRoute.hover, D.WaypointOnRoute.pressed, D.WaypointOnRoute.disabled),
                waypointOffRoute = ColorSet(D.WaypointOffRoute.`default`, D.WaypointOffRoute.hover, D.WaypointOffRoute.pressed, D.WaypointOffRoute.disabled),
                waypointMixed = ColorSet(D.WaypointMixed.`default`, D.WaypointMixed.hover, D.WaypointMixed.pressed, D.WaypointMixed.disabled),
                enrichmentFast = ColorSet(D.EnrichmentFast.`default`, D.EnrichmentFast.hover, D.EnrichmentFast.pressed, D.EnrichmentFast.disabled),
                enrichmentExtended = ColorSet(D.EnrichmentExtended.`default`, D.EnrichmentExtended.hover, D.EnrichmentExtended.pressed, D.EnrichmentExtended.disabled),
                enrichmentCached = ColorSet(D.EnrichmentCached.`default`, D.EnrichmentCached.hover, D.EnrichmentCached.pressed, D.EnrichmentCached.disabled),
                deviationOriginalRoute = ColorSet(D.DeviationOriginalRoute.`default`, D.DeviationOriginalRoute.hover, D.DeviationOriginalRoute.pressed, D.DeviationOriginalRoute.disabled),
                deviationDetourPath = ColorSet(D.DeviationDetourPath.`default`, D.DeviationDetourPath.hover, D.DeviationDetourPath.pressed, D.DeviationDetourPath.disabled),
                deviationReconnectPoint = ColorSet(D.DeviationReconnectPoint.`default`, D.DeviationReconnectPoint.hover, D.DeviationReconnectPoint.pressed, D.DeviationReconnectPoint.disabled),
                locationPoiFill = ColorSet(D.LocationPoiFill.`default`, D.LocationPoiFill.hover, D.LocationPoiFill.pressed, D.LocationPoiFill.disabled),
                locationPoiRing = ColorSet(D.LocationPoiRing.`default`, D.LocationPoiRing.hover, D.LocationPoiRing.pressed, D.LocationPoiRing.disabled),
                locationPoiMuted = ColorSet(D.LocationPoiMuted.`default`, D.LocationPoiMuted.hover, D.LocationPoiMuted.pressed, D.LocationPoiMuted.disabled),
                locationPoiBg = ColorSet(D.LocationPoiBg.`default`, D.LocationPoiBg.hover, D.LocationPoiBg.pressed, D.LocationPoiBg.disabled),
                orange = ColorSet(D.Orange.`default`, D.Orange.hover, D.Orange.pressed, D.Orange.disabled),
            )
        }
    }
}
