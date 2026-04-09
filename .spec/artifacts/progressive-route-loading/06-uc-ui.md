---
stability: FEATURE_SPEC
last_validated: 2026-04-09
prd_version: 1.0.0
functional_group: UI
---

# Use Cases: UI Progressive Display (UI)

## UC-UI-01: Display Skeleton States While Enrichment Loads

**Description:**
While weather data is loading, the route card displays skeleton placeholders for weather badges to reserve space and prevent layout shifts. The enrichment status indicator shows "Quick analysis..." with a pulsing animation.

**Acceptance Criteria:**
- ☐ RouteAttachmentCard accepts enrichmentStatus prop ('pending' | 'running' | 'completed' | 'failed')
- ☐ When enrichmentStatus is 'pending' or 'running', show WeatherBadgeSkeleton components
- ☐ WeatherBadgeSkeleton matches dimensions of actual weather badges (80×24px)
- ☐ WeatherBadgeSkeleton shows ActivityIndicator with pulse animation
- ☐ EnrichmentStatusIndicator displays in card header with status message
- ☐ Status message shows "Quick analysis..." during weather phase
- ☐ Status message shows "Deep analysis..." during AI enrichment phase
- ☐ Skeleton states reserve exact layout space to prevent shifts

## UC-UI-02: Animate Progressive Data Arrival

**Description:**
When weather data arrives from the enrichment job, weather badges fade in with a 200ms animation. AI labels and rationales fade in with a 300ms animation when that phase completes. Transitions are smooth and non-jarring.

**Acceptance Criteria:**
- ☐ Weather badges use Animated.View with FadeIn.duration(200) when data arrives
- ☐ Route labels use FadeIn.duration(300) when AI enrichment completes
- ☐ Highlights use FadeIn.duration(400) when available
- ☐ Animations respect reduced motion preference (skip when enabled)
- ☐ No layout shifts during transitions (space reserved by skeletons)
- ☐ EnrichmentStatusIndicator disappears when status is 'completed'
- ☐ EnrichmentStatusIndicator shows error state with retry button on failure
- ☐ Animations run at 60fps on target devices
