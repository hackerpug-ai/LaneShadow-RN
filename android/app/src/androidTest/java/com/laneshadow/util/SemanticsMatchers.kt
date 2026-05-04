package com.laneshadow.util

import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.test.SemanticsMatcher

/**
 * Custom semantics matchers for testing LaneShadow-specific UI components.
 * These matchers allow tests to verify component-specific properties through Compose semantics.
 */

/**
 * Semantics property for route variant (Best, Alt1, Alt2).
 */
val RouteVariantKey = SemanticsPropertyKey<String>("RouteVariant")
var SemanticsPropertyReceiver.routeVariant by RouteVariantKey

/**
 * Semantics property for polyline style (Solid, Dashed).
 */
val PolylineStyleKey = SemanticsPropertyKey<String>("PolylineStyle")
var SemanticsPropertyReceiver.polylineStyle by PolylineStyleKey

/**
 * Semantics property for scenic score (1-5).
 */
val ScenicScoreKey = SemanticsPropertyKey<Int>("ScenicScore")
var SemanticsPropertyReceiver.scenicScore by ScenicScoreKey

/**
 * Semantics property for phase state (Pending, Active, Done).
 */
val PhaseStateKey = SemanticsPropertyKey<String>("PhaseState")
var SemanticsPropertyReceiver.phaseState by PhaseStateKey

/**
 * Semantics property for session ID.
 */
val SessionIdKey = SemanticsPropertyKey<String>("SessionId")
var SemanticsPropertyReceiver.sessionId by SessionIdKey

/**
 * Semantics property for route plan ID.
 */
val RoutePlanIdKey = SemanticsPropertyKey<String>("RoutePlanId")
var SemanticsPropertyReceiver.routePlanId by RoutePlanIdKey

/**
 * Semantics property for selected route ID.
 */
val SelectedRouteIdKey = SemanticsPropertyKey<String>("SelectedRouteId")
var SemanticsPropertyReceiver.selectedRouteId by SelectedRouteIdKey

/**
 * Semantics property for attachment card border color.
 */
val AttachmentBorderColorKey = SemanticsPropertyKey<androidx.compose.ui.graphics.Color>("AttachmentBorderColor")
var SemanticsPropertyReceiver.attachmentBorderColor by AttachmentBorderColorKey

/**
 * Matcher for nodes with a specific route variant.
 */
fun routeVariantEquals(variant: String): SemanticsMatcher {
    return SemanticsMatcher.expectValue(RouteVariantKey, variant)
}

/**
 * Matcher for nodes with a specific polyline style.
 */
fun polylineStyleEquals(style: String): SemanticsMatcher {
    return SemanticsMatcher.expectValue(PolylineStyleKey, style)
}

/**
 * Matcher for nodes with a specific phase state.
 */
fun phaseStateEquals(state: String): SemanticsMatcher {
    return SemanticsMatcher.expectValue(PhaseStateKey, state)
}

/**
 * Matcher for nodes with a specific session ID.
 */
fun sessionIdEquals(sessionId: String): SemanticsMatcher {
    return SemanticsMatcher.expectValue(SessionIdKey, sessionId)
}

/**
 * Matcher for nodes that contain a specific session ID in their semantics.
 */
fun hasSessionId(sessionId: String): SemanticsMatcher {
    return SemanticsMatcher("SessionId contains $sessionId") { node ->
        val config = node.config
        // Try to get the session ID from various possible keys
        val idFromKey = try {
            config[SessionIdKey]
        } catch (e: Exception) {
            null
        }
        val idFromText = try {
            val textAnnotations = config[androidx.compose.ui.semantics.SemanticsProperties.Text]
            textAnnotations.any { it.text.contains(sessionId) }
        } catch (e: Exception) {
            false
        }

        idFromKey == sessionId || idFromText
    }
}

/**
 * Matcher for nodes with a specific route plan ID.
 */
fun routePlanIdEquals(planId: String): SemanticsMatcher {
    return SemanticsMatcher.expectValue(RoutePlanIdKey, planId)
}

/**
 * Matcher for nodes with a specific selected route ID.
 */
fun selectedRouteIdEquals(routeId: String): SemanticsMatcher {
    return SemanticsMatcher.expectValue(SelectedRouteIdKey, routeId)
}

/**
 * Matcher for nodes that represent the best route (variant = "Best").
 */
fun isBestRoute(): SemanticsMatcher {
    return routeVariantEquals("Best")
}

/**
 * Matcher for nodes that represent an alternate route (Alt1 or Alt2).
 */
fun isAltRoute(): SemanticsMatcher {
    return SemanticsMatcher.keyIsDefined(RouteVariantKey)
        .and(
            SemanticsMatcher("RouteVariant is Alt1 or Alt2") { node ->
                val variant = try {
                    node.config[RouteVariantKey]
                } catch (e: Exception) {
                    null
                }
                variant == "Alt1" || variant == "Alt2"
            }
        )
}

/**
 * Matcher for nodes with solid polyline style.
 */
fun hasSolidPolyline(): SemanticsMatcher {
    return polylineStyleEquals("Solid")
}

/**
 * Matcher for nodes with dashed polyline style.
 */
fun hasDashedPolyline(): SemanticsMatcher {
    return polylineStyleEquals("Dashed")
}

/**
 * Matcher for nodes in active phase state.
 */
fun isActivePhase(): SemanticsMatcher = phaseStateEquals("Active")

/**
 * Matcher for nodes in done phase state.
 */
fun isDonePhase(): SemanticsMatcher = phaseStateEquals("Done")

/**
 * Matcher for nodes in pending phase state.
 */
fun isPendingPhase(): SemanticsMatcher = phaseStateEquals("Pending")
