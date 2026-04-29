package com.laneshadow.sandbox.mockproviders

/**
 * Navigator domain entities for mock data providers.
 *
 * These mirror the Convex read types in server/convex/schema.ts with
 * Navigator-domain extensions per .spec/prds/v2/11-technical-requirements.md
 */

// ============================================================================
// Core Navigator Entities
// ============================================================================

/**
 * User entity - mirrors Convex User read type
 */
data class User(
    val id: String,
    val name: String,
    val handle: String,
    val avatarUrl: String? = null,
    val bio: String? = null,
)

/**
 * Route entity - mirrors Convex Route read type with Navigator extensions
 */
data class Route(
    val id: String,
    val name: String,                           // e.g. "The Skyline Spine"
    val via: String,                            // e.g. "280 → 92 → Skyline to Alice's"
    val distance: Int,                          // meters
    val estimatedTime: Int,                     // seconds
    val climb: Int,                             // feet
    val scenicScore: Int,                       // 0-10; UI shows ⌈scenicScore/2⌉ dots out of 5
    val difficulty: String,                     // "easy" | "moderate" | "advanced"
    val polyline: String,                       // encoded polyline
    val variant: String? = null,                // "best" | "alt1" | "alt2"
)

/**
 * Session entity for Navigator screen state
 */
data class Session(
    val id: String,
    val title: String,                          // e.g. "Santa Cruz loop"
    val preview: String,                        // last user prompt
    val meta: String,                           // e.g. "3 routes · Active"
    val `when`: String,                         // relative label ("Now", "Tue", "Apr 12")
    val active: Boolean,                        // currently-focused session
    val routeIds: List<String>,                 // pointers into Route fixtures
    val createdAt: String,                      // ISO 8601
)

/**
 * Session section for grouped sessions display
 */
data class SessionSection(
    val label: String,                          // e.g. "TONIGHT", "TODAY", "THIS WEEK", "LAST WEEK", "EARLIER"
    val sessions: List<Session>,                // sessions in this section
)

/**
 * Navigator message - the chat interface between user and Navigator
 */
data class NavigatorMessage(
    val id: String,
    val sessionId: String,                      // references Session.id
    val body: String,                           // Navigator's prose response
    val timestamp: String,                      // ISO 8601
    val kind: String,                           // "prompt" | "response" | "error"
    val attachments: List<RouteAttachment>? = null,  // present when kind == "response"
    val detail: String? = null,                 // optional secondary text
    val pinned: Boolean,                        // sticky response
)

/**
 * Route attachment - a route card attached to a Navigator message
 */
data class RouteAttachment(
    val routeId: String,                        // pointer into Route fixtures
    val variant: String,                        // "best" | "alt1" | "alt2"
    val isBest: Boolean,                        // renders LSBestBadge
    val weather: WeatherSummary,                // route-level forecast
    val scenic: Int,                            // 1-5 dot meter count
    val includesFavorite: Boolean? = null,      // triggers call-out
    val includesFavoriteLabel: String? = null,  // call-out text
)

/**
 * Weather summary for route conditions
 */
data class WeatherSummary(
    val condition: String,                      // "clear" | "rain" | "wind" | "storm" | "hot" | "cold"
    val label: String,                          // e.g. "Clear", "Rain 3pm", "18mph NW"
)

/**
 * Weather timeline entry for hourly forecasts
 */
data class WeatherTimelineEntry(
    val hour: String,                           // "9", "10", "11", ...
    val temperature: Int,                       // °F
    val condition: String,                      // WeatherSummary condition
)

/**
 * Planning phase for the planning screen
 */
data class PlanningPhase(
    val id: String,                             // "reading" | "sketching" | "validating" | "weather" | "building"
    val label: String,                          // e.g. "Reading your ride"
    val status: String,                         // "pending" | "active" | "done"
)

/**
 * Suggestion chip for chat input
 */
data class SuggestionChip(
    val id: String,
    val label: String,                          // e.g. "Twisty back roads"
    val isPrimary: Boolean = false,             // true = warning-amber primary, false = glass tertiary
)

/**
 * Location context for the location badge
 */
data class LocationContext(
    val label: String,                          // e.g. "Near Santa Cruz, CA"
    val mode: String,                           // "auto" | "manual"
)

// ============================================================================
// Screen State Containers
// ============================================================================

/**
 * Idle screen state
 */
data class IdleScreenState(
    val greeting: Greeting,
    val suggestions: List<SuggestionChip>,
    val locationContext: LocationContext,
    val showAdvisoryCard: Boolean = false,           // V03: show weather advisory card
    val advisoryMessage: String? = null,             // V03: advisory card message
    val isNoLocation: Boolean = false,               // V01: show "Tap to set start" pill
)

/**
 * Greeting for idle screen
 */
data class Greeting(
    val meta: String,                           // e.g. "FRIDAY · 68°F · CLEAR"
    val headline: String,                       // e.g. "Where are we riding today?"
    val emphasis: String? = null,               // substring to italicize (e.g. "today")
)

/**
 * Planning screen state
 */
data class PlanningScreenState(
    val phases: List<PlanningPhase>,
    val message: NavigatorMessage,
    val isThinking: Boolean,
    val slowApology: String? = null,                // V01: italic apology message
    val showCancelConfirm: Boolean = false,         // V02: show cancel confirmation modal
    val warningBorder: Boolean = false,             // V03: show warning border on phase indicator
    val phaseHeaders: Map<String, String>? = null,  // V03: phase header strings (phase ID -> header text)
)

/**
 * Route results screen state
 */
data class RouteResultsScreenState(
    val message: NavigatorMessage,
    val routes: List<Route>,
    val selectedRouteId: String?,
    val mode: String? = null, // "refining" for S04
    val showRecallChip: Boolean = false, // V03
    val primerChips: List<SuggestionChip> = emptyList(), // S04
)

/**
 * Route details screen state
 */
data class RouteDetailsScreenState(
    val route: Route,
    val weatherTimeline: List<WeatherTimelineEntry>,
    val darkTheme: Boolean = false, // S03
    val detent: String? = null, // "medium" for S04
    val isDismissing: Boolean = false, // S05
    val isSaved: Boolean = false, // V01
)

/**
 * Sessions screen state
 */
data class SessionsScreenState(
    val sessions: List<Session>,
    val activeSessionId: String?,
    val groupLabel: String? = null,             // Legacy: single section label (for back-compat)
    val sections: List<SessionSection>? = null, // New: multiple sections (for date grouping)
    val showConfirmDialog: Boolean = false,     // S05: show "Start a new ride?" confirm dialog
)

/**
 * Error screen state
 */
data class ErrorScreenState(
    val error: NavigatorError,
    val suggestions: List<SuggestionChip>,
    val isRecovered: Boolean = false,           // S04: recovered state (fade to 0.55, show send button)
    val isOffline: Boolean = false,             // V01: offline state (show wifi watermark, dim chat)
    val isStormGate: Boolean = false,           // S02: storm-gate variant (use wx.storm purple)
)

/**
 * Navigator error for error screen
 */
data class NavigatorError(
    val title: String = "THE NAVIGATOR",
    val body: String,                           // e.g. "Couldn't stitch that one together"
    val detail: String? = null,                 // e.g. "Try a different end point"
)
