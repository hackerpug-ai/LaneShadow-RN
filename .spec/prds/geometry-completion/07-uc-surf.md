---
stability: FEATURE_SPEC
last_validated: 2026-07-10
prd_version: 1.0.0
functional_group: SURF
---

# Use Cases: Rider-Ready Surface (SURF)

| ID | Title | Description |
|----|-------|-------------|
| UC-SURF-01 | Compute the rider-ready flag | Deterministic, stored, indexed composition of all evidence |
| UC-SURF-02 | Gate the discovery agent tool | Rider-ready only; centroid fallback removed |
| UC-SURF-03 | Gate browse queries and the carousel | All `listCuratedRoutes` modes + carousel serve rider-ready only |
| UC-SURF-04 | Show honest thin-region absence | Honest empty + labeled fallback-to-national + distance-label fix |
| UC-SURF-05 | Render the provenance caption on detail | Calm captions for inferred lines only |
| UC-SURF-06 | Never hide a rider's saved routes | Gate filters suggestions, never the rider's own library |

---

## UC-SURF-01: Compute the rider-ready flag

`riderReady` composes gate-passed geometry, a real ride name, a sane 0–1 score, a sane
length, a positive ride-worthiness verdict, and not-retired/not-shadow status; it is
deterministic, stored, and indexed.

Acceptance Criteria:
- ☐ System computes a `riderReady` flag from gate-passing geometry, a real ride name, a sane 0–1 score, a sane length, a non-negative ride-worthiness verdict, no retirement, and no duplicate-shadow status.
- ☐ System stores the flag on the route so gated queries read an index rather than recomputing at read time.
- ☐ System sets `riderReady` to false for any route missing any one required condition.
- ☐ System recomputes the flag whenever a route's geometry, score, length, classifier verdict, retirement, or shadow status changes.
- ☐ Founder-Operator can query the rider-ready count and watch it rise from the audited 1,171 toward the projected 4,300–4,700 as the batch lands.

---

## UC-SURF-02: Gate the discovery agent tool

The discovery agent tool serves ONLY rider-ready routes; the centroid fallback is removed so
a dot can never masquerade as a suggestion.

Acceptance Criteria:
- ☐ System returns only rider-ready routes from the discovery agent tool.
- ☐ System removes the centroid fallback from `discoverCuratedRoutes` so a route with no gate-passing geometry can never be suggested.
- ☐ Rider can ask for national suggestions and receive routes that all plot a real road, replacing the audited 7-of-10-junk top-10.
- ☐ System returns an honest empty-or-partial result rather than padding suggestions with non-rider-ready routes.
- ☐ Rider cannot receive a centroid-only dot as a discovery suggestion under any query.

---

## UC-SURF-03: Gate browse queries and the carousel

Every `listCuratedRoutes` browse mode and the home carousel serve only rider-ready routes;
shadows and retired rows are excluded in the same gated query.

Acceptance Criteria:
- ☐ System serves only rider-ready routes in every `listCuratedRoutes` browse mode via the rider-ready index.
- ☐ System populates the home carousel and chat route cards exclusively with rider-ready routes inherited from the gated queries.
- ☐ Rider can browse or scroll the carousel and tap any route to see it plot a real road.
- ☐ System excludes quarantined, duplicate-shadow, and retired routes from browse results in the same gated read path.
- ☐ Founder-Operator can confirm the visible catalog matches the rider-ready count (~1,171 until the batch lands).

---

## UC-SURF-04: Show honest thin-region absence

In a region with few or no rider-ready routes, the app says so honestly — including the
fallback-to-national case, which today silently substitutes distant routes and fabricates a
"0mi" distance label.

Acceptance Criteria:
- ☐ Rider can query a thin-coverage region and receive an honest "no routes near you yet" message rather than centroid dots or padded junk.
- ☐ System labels fallback-to-national results with a leading "No routes nearby — here's our top-rated" indicator so distant routes are never presented as nearby.
- ☐ System omits the distance suffix on a suggestion pill when no real distance exists, instead of rendering a fabricated "0mi".
- ☐ Rider can distinguish "no routes here yet" from an error state or a loading state.
- ☐ System serves the honest-absence and fallback messaging from the same rider-ready gate that powers discovery and browse, so the surfaces never diverge.
- ☐ System announces pill-row content changes politely to screen readers when absence or fallback content replaces results.

---

## UC-SURF-05: Render the provenance caption on detail

The detail view shows a calm, non-warning caption for inferred lines (`ai_reconstructed`,
`name_routed`); real scraped lines and pre-existing geometry stay caption-silent so the
signal keeps meaning.

Acceptance Criteria:
- ☐ Rider can see a provenance caption on the detail view of any route whose line was AI-reconstructed or generated from the road name.
- ☐ System renders caption copy matching the stored provenance value ("Route line reconstructed from the ride description" for `ai_reconstructed`; "Route line generated from the road name" for `name_routed`).
- ☐ System renders no caption for `scraped_promoted` or pre-provenance geometry rather than inventing one.
- ☐ Rider can read the caption as plain informational text that is visually distinct from a warning badge.

---

## UC-SURF-06: Never hide a rider's saved routes

The gate filters what gets *suggested* — never the rider's own library. Saved/bookmarked
curated routes always resolve to detail, rendering honestly even when un-recovered.

Acceptance Criteria:
- ☐ Rider can open any previously saved or bookmarked curated route to its detail view regardless of its rider-ready status.
- ☐ System renders an un-recovered saved route's detail with the existing honest "Approximate location" state rather than blocking it or showing an error.
- ☐ System resolves a saved route that was merged as a duplicate shadow to its canonical row's detail.
- ☐ Rider cannot lose access to a saved route because the gate, quarantine, or retirement changed its status after saving.
