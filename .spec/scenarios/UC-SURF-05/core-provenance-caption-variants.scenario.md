---
service: mobile
feature: UC-SURF-05
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-SURF-05 core: the caption tells the truth for inferred lines and stays silent otherwise

Seed four detail-reachable routes on the dev deployment, one per provenance shape: an
`ai_reconstructed` route (e.g. the reconstructed Von Hoak Loop), a `name_routed` route, a
`scraped_promoted` route, and a legacy pre-provenance route whose geometry predates the
pipeline. Open each in Curated Route Detail on the iOS sim. The AI-reconstructed route shows
the plain-text caption "Route line reconstructed from the ride description"; the name-routed
route shows "Route line generated from the road name". Both render as muted informational
text (label-small, onSurface-muted) — not a Badge, not a warning affordance, no tap target.
The scraped-promoted and legacy routes render no provenance caption node at all: silence is
the design for non-inferred lines, so the caption keeps meaning where it matters. The caption
never blocks or reflows the map or the score bars; it reads as context under the line it
describes.

**Verify (Maestro `curated-route-detail.yaml` extension + real dev deployment):**
- `ai_reconstructed` detail: `curated-detail-provenance` testID present with the exact
  reconstruction copy.
- `name_routed` detail: same testID, road-name copy.
- `scraped_promoted` + legacy details: `curated-detail-provenance` absent from the tree.
- The caption element is a Text (no button/badge role in the accessibility tree); visual
  check on device: muted, small, non-alarming in light and dark.
- Backend contract: `getCuratedRouteDetail` returns `geometryProvenance` for all four seeds;
  the two silent cases return `scraped_promoted`/undefined respectively (the UI, not the
  API, decides silence).
