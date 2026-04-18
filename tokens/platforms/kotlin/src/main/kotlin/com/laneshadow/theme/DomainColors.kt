package com.laneshadow.theme

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
        fun from(tokens: SemanticTokens, darkMode: Boolean): DomainColors {
            val m = if (darkMode) tokens.color.dark else tokens.color.light
            return DomainColors(
                waypointOnRoute = colorSet(m, "waypointOnRoute"),
                waypointOffRoute = colorSet(m, "waypointOffRoute"),
                waypointMixed = colorSet(m, "waypointMixed"),
                enrichmentFast = colorSet(m, "enrichmentFast"),
                enrichmentExtended = colorSet(m, "enrichmentExtended"),
                enrichmentCached = colorSet(m, "enrichmentCached"),
                deviationOriginalRoute = colorSet(m, "deviationOriginalRoute"),
                deviationDetourPath = colorSet(m, "deviationDetourPath"),
                deviationReconnectPoint = colorSet(m, "deviationReconnectPoint"),
                locationPoiFill = colorSet(m, "locationPoiFill"),
                locationPoiRing = colorSet(m, "locationPoiRing"),
                locationPoiMuted = colorSet(m, "locationPoiMuted"),
                locationPoiBg = colorSet(m, "locationPoiBg"),
                orange = colorSet(m, "orange"),
            )
        }
    }
}
