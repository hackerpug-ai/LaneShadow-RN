---
service: mobile
feature: UC-SURF-06
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-SURF-06 core: a saved route stays reachable through quarantine, review, and merge

Rachel saves three curated routes on the iOS sim against the dev deployment. Backend-side,
the operator then makes each one un-suggestable a different way: the first gets
length-quarantined by hygiene, the second's geometry lands in review (gate re-evaluation),
the third is merged as a duplicate shadow of a canonical row. Rachel reopens each from her
Saved Routes list. The first two resolve to Curated Route Detail normally — the quarantined
one renders the existing honest "Approximate location" state
(`curated-detail-approximate-badge`) with no fake line and no error screen; the review-held
one likewise renders honestly without leaking queue internals. The third resolves to the
canonical row's detail (the shadow redirects rather than 404ing her bookmark). Meanwhile all
three are absent from discovery, browse, and the carousel — the gate filters suggestions,
never her library. Nothing she owns disappears or errors because the catalog got stricter
behind her.

**Verify (Maestro + real dev deployment):**
- Save 3 routes via the real save flow; apply quarantine / review / `duplicateOf` backend
  mutations respectively.
- Saved Routes list still shows all 3 entries; each tap resolves (saved-route redirect →
  curated detail).
- Quarantined + review routes: detail renders with `curated-detail-approximate-badge` (or
  the real line if one exists but is disavowed — whichever ships, no crash, no fake
  authority); no review-reason text anywhere in the UI.
- Shadow route: detail shows the canonical row's routeId/content.
- Discovery + carousel + `listCuratedRoutes`: none of the three present.
