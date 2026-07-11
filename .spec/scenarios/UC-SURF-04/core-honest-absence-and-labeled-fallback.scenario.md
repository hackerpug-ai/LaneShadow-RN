---
service: mobile
feature: UC-SURF-04
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-SURF-04 core: thin regions say so; national fallback is labeled; no fabricated distances

On the iOS sim against the dev deployment, set the simulated location to a seeded
thin-coverage region (zero rider-ready routes within the nearby radius, several available
nationally). The pill row renders the leading non-tappable label chip "No routes nearby —
here's our top-rated" followed by the real national pills — never the old silent
substitution. Each fallback pill omits the distance suffix entirely because `distanceMi` is
null for national results: no pill anywhere renders "0mi". Then move the simulated location
to a region with zero routes even nationally-filtered (fully empty result): the pill row
shows "No routes near you yet", visually and by testID distinct from the loading spinner and
from the error state, with the chat input directly beneath as the natural next step. The
same seeded data drives the agent chat path: asking for routes in the thin region yields the
honest message, not padded suggestions.

**Verify (Maestro on iOS sim + real dev deployment):**
- Thin region: `discovery-suggestion-fallback-label` chip present and first in the row;
  subsequent pills are real national rider-ready routes.
- Zero pills contain the substring "0mi"; pills with null distance show no `· Xmi` suffix.
- Fully-empty region: `discovery-suggestion-empty` chip with "No routes near you yet";
  spinner testID absent; error testID absent.
- Chat ask in the thin region → honest absence message; persisted `route_plans` for that
  turn contains no non-rider-ready substitutes.
- Pill-row container carries `accessibilityLiveRegion="polite"` (inspected via the
  accessibility tree) so the swap announces to VoiceOver.
