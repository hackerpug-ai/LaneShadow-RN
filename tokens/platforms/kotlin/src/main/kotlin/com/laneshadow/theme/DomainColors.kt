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
            return DomainColors(
                waypointOnRoute = ColorSet(Tokens.Semantic.Color.Light.WaypointOnRoute.`default`, Tokens.Semantic.Color.Light.WaypointOnRoute.hover, Tokens.Semantic.Color.Light.WaypointOnRoute.pressed, Tokens.Semantic.Color.Light.WaypointOnRoute.disabled),
                waypointOffRoute = ColorSet(Tokens.Semantic.Color.Light.WaypointOffRoute.`default`, Tokens.Semantic.Color.Light.WaypointOffRoute.hover, Tokens.Semantic.Color.Light.WaypointOffRoute.pressed, Tokens.Semantic.Color.Light.WaypointOffRoute.disabled),
                waypointMixed = ColorSet(Tokens.Semantic.Color.Light.WaypointMixed.`default`, Tokens.Semantic.Color.Light.WaypointMixed.hover, Tokens.Semantic.Color.Light.WaypointMixed.pressed, Tokens.Semantic.Color.Light.WaypointMixed.disabled),
                enrichmentFast = ColorSet(Tokens.Semantic.Color.Light.EnrichmentFast.`default`, Tokens.Semantic.Color.Light.EnrichmentFast.hover, Tokens.Semantic.Color.Light.EnrichmentFast.pressed, Tokens.Semantic.Color.Light.EnrichmentFast.disabled),
                enrichmentExtended = ColorSet(Tokens.Semantic.Color.Light.EnrichmentExtended.`default`, Tokens.Semantic.Color.Light.EnrichmentExtended.hover, Tokens.Semantic.Color.Light.EnrichmentExtended.pressed, Tokens.Semantic.Color.Light.EnrichmentExtended.disabled),
                enrichmentCached = ColorSet(Tokens.Semantic.Color.Light.EnrichmentCached.`default`, Tokens.Semantic.Color.Light.EnrichmentCached.hover, Tokens.Semantic.Color.Light.EnrichmentCached.pressed, Tokens.Semantic.Color.Light.EnrichmentCached.disabled),
                deviationOriginalRoute = ColorSet(Tokens.Semantic.Color.Light.DeviationOriginalRoute.`default`, Tokens.Semantic.Color.Light.DeviationOriginalRoute.hover, Tokens.Semantic.Color.Light.DeviationOriginalRoute.pressed, Tokens.Semantic.Color.Light.DeviationOriginalRoute.disabled),
                deviationDetourPath = ColorSet(Tokens.Semantic.Color.Light.DeviationDetourPath.`default`, Tokens.Semantic.Color.Light.DeviationDetourPath.hover, Tokens.Semantic.Color.Light.DeviationDetourPath.pressed, Tokens.Semantic.Color.Light.DeviationDetourPath.disabled),
                deviationReconnectPoint = ColorSet(Tokens.Semantic.Color.Light.DeviationReconnectPoint.`default`, Tokens.Semantic.Color.Light.DeviationReconnectPoint.hover, Tokens.Semantic.Color.Light.DeviationReconnectPoint.pressed, Tokens.Semantic.Color.Light.DeviationReconnectPoint.disabled),
                locationPoiFill = ColorSet(Tokens.Semantic.Color.Light.LocationPoiFill.`default`, Tokens.Semantic.Color.Light.LocationPoiFill.hover, Tokens.Semantic.Color.Light.LocationPoiFill.pressed, Tokens.Semantic.Color.Light.LocationPoiFill.disabled),
                locationPoiRing = ColorSet(Tokens.Semantic.Color.Light.LocationPoiRing.`default`, Tokens.Semantic.Color.Light.LocationPoiRing.hover, Tokens.Semantic.Color.Light.LocationPoiRing.pressed, Tokens.Semantic.Color.Light.LocationPoiRing.disabled),
                locationPoiMuted = ColorSet(Tokens.Semantic.Color.Light.LocationPoiMuted.`default`, Tokens.Semantic.Color.Light.LocationPoiMuted.hover, Tokens.Semantic.Color.Light.LocationPoiMuted.pressed, Tokens.Semantic.Color.Light.LocationPoiMuted.disabled),
                locationPoiBg = ColorSet(Tokens.Semantic.Color.Light.LocationPoiBg.`default`, Tokens.Semantic.Color.Light.LocationPoiBg.hover, Tokens.Semantic.Color.Light.LocationPoiBg.pressed, Tokens.Semantic.Color.Light.LocationPoiBg.disabled),
                orange = ColorSet(Tokens.Semantic.Color.Light.Orange.`default`, Tokens.Semantic.Color.Light.Orange.hover, Tokens.Semantic.Color.Light.Orange.pressed, Tokens.Semantic.Color.Light.Orange.disabled),
            )
        }

        fun dark(): DomainColors {
            return DomainColors(
                waypointOnRoute = ColorSet(Tokens.Semantic.Color.Dark.WaypointOnRoute.`default`, Tokens.Semantic.Color.Dark.WaypointOnRoute.hover, Tokens.Semantic.Color.Dark.WaypointOnRoute.pressed, Tokens.Semantic.Color.Dark.WaypointOnRoute.disabled),
                waypointOffRoute = ColorSet(Tokens.Semantic.Color.Dark.WaypointOffRoute.`default`, Tokens.Semantic.Color.Dark.WaypointOffRoute.hover, Tokens.Semantic.Color.Dark.WaypointOffRoute.pressed, Tokens.Semantic.Color.Dark.WaypointOffRoute.disabled),
                waypointMixed = ColorSet(Tokens.Semantic.Color.Dark.WaypointMixed.`default`, Tokens.Semantic.Color.Dark.WaypointMixed.hover, Tokens.Semantic.Color.Dark.WaypointMixed.pressed, Tokens.Semantic.Color.Dark.WaypointMixed.disabled),
                enrichmentFast = ColorSet(Tokens.Semantic.Color.Dark.EnrichmentFast.`default`, Tokens.Semantic.Color.Dark.EnrichmentFast.hover, Tokens.Semantic.Color.Dark.EnrichmentFast.pressed, Tokens.Semantic.Color.Dark.EnrichmentFast.disabled),
                enrichmentExtended = ColorSet(Tokens.Semantic.Color.Dark.EnrichmentExtended.`default`, Tokens.Semantic.Color.Dark.EnrichmentExtended.hover, Tokens.Semantic.Color.Dark.EnrichmentExtended.pressed, Tokens.Semantic.Color.Dark.EnrichmentExtended.disabled),
                enrichmentCached = ColorSet(Tokens.Semantic.Color.Dark.EnrichmentCached.`default`, Tokens.Semantic.Color.Dark.EnrichmentCached.hover, Tokens.Semantic.Color.Dark.EnrichmentCached.pressed, Tokens.Semantic.Color.Dark.EnrichmentCached.disabled),
                deviationOriginalRoute = ColorSet(Tokens.Semantic.Color.Dark.DeviationOriginalRoute.`default`, Tokens.Semantic.Color.Dark.DeviationOriginalRoute.hover, Tokens.Semantic.Color.Dark.DeviationOriginalRoute.pressed, Tokens.Semantic.Color.Dark.DeviationOriginalRoute.disabled),
                deviationDetourPath = ColorSet(Tokens.Semantic.Color.Dark.DeviationDetourPath.`default`, Tokens.Semantic.Color.Dark.DeviationDetourPath.hover, Tokens.Semantic.Color.Dark.DeviationDetourPath.pressed, Tokens.Semantic.Color.Dark.DeviationDetourPath.disabled),
                deviationReconnectPoint = ColorSet(Tokens.Semantic.Color.Dark.DeviationReconnectPoint.`default`, Tokens.Semantic.Color.Dark.DeviationReconnectPoint.hover, Tokens.Semantic.Color.Dark.DeviationReconnectPoint.pressed, Tokens.Semantic.Color.Dark.DeviationReconnectPoint.disabled),
                locationPoiFill = ColorSet(Tokens.Semantic.Color.Dark.LocationPoiFill.`default`, Tokens.Semantic.Color.Dark.LocationPoiFill.hover, Tokens.Semantic.Color.Dark.LocationPoiFill.pressed, Tokens.Semantic.Color.Dark.LocationPoiFill.disabled),
                locationPoiRing = ColorSet(Tokens.Semantic.Color.Dark.LocationPoiRing.`default`, Tokens.Semantic.Color.Dark.LocationPoiRing.hover, Tokens.Semantic.Color.Dark.LocationPoiRing.pressed, Tokens.Semantic.Color.Dark.LocationPoiRing.disabled),
                locationPoiMuted = ColorSet(Tokens.Semantic.Color.Dark.LocationPoiMuted.`default`, Tokens.Semantic.Color.Dark.LocationPoiMuted.hover, Tokens.Semantic.Color.Dark.LocationPoiMuted.pressed, Tokens.Semantic.Color.Dark.LocationPoiMuted.disabled),
                locationPoiBg = ColorSet(Tokens.Semantic.Color.Dark.LocationPoiBg.`default`, Tokens.Semantic.Color.Dark.LocationPoiBg.hover, Tokens.Semantic.Color.Dark.LocationPoiBg.pressed, Tokens.Semantic.Color.Dark.LocationPoiBg.disabled),
                orange = ColorSet(Tokens.Semantic.Color.Dark.Orange.`default`, Tokens.Semantic.Color.Dark.Orange.hover, Tokens.Semantic.Color.Dark.Orange.pressed, Tokens.Semantic.Color.Dark.Orange.disabled),
            )
        }
    }
}
