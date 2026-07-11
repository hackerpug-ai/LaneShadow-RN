---
stability: FEATURE_SPEC
last_validated: 2026-07-11
prd_version: 3.1.0
functional_group: REC
---

# Use Cases: Geometry Recovery (REC)

| ID | Title | Description |
|----|-------|-------------|
| UC-REC-01 | Promote validated in-row scraped polylines (Lever 1) | ~1,752 legacy rider-drawn lines validated and promoted at $0 |
| UC-REC-02 | Reconstruct geometry from turn-by-turn descriptions (Lever 2) | ~948 routes rebuilt via LLM anchors → geocode → route → gate |
| UC-REC-03 | Re-route from endpoints or road names (Lever 3) | ~1,076 A-to-B / road-name routes re-routed deterministically |
| UC-REC-04 | Orchestrate the resumable rescue waterfall | Levers in order over ~4,050 routes; provenance; resume; cost cap |
| UC-REC-05 | Retire only after every lever fails | ~274 residual; founder-confirmed, reversible retirement |

> **Per-lever expected yield — ASSUMPTION, not a commitment (v3.1.0).** These are planning
> estimates only. The sole evidence is the 2026-07-10 PoC (n=3: 2 PASS / 1 REVIEW ≈ 67%) and
> the *superseded* investigation's priors (Tier-1 retry ~16%; endpoint-parse ~40–55% ceiling).
> **The PRD commits to NO target catalog number**; the acceptance figure is the *realized*
> rider-ready count after the batch, gated by UC-REC-04 AC-7. This reconciles the FOUNDER-BAR
> "≈2.5–3k honest roads" line and the earlier "4,300–4,700" projection: both are outcomes to
> *observe*, not promises to hit.
>
> | Lever | Candidates | Assumed PASS → rider-ready | Basis / caveat |
> |---|---|---|---|
> | 1 promote (`scraped_promoted`) | ~1,752 | unproven | in-row polylines were flagged `unresolved` for a reason; T-REC-001 proves only that one promotes |
> | 2 reconstruct (`ai_reconstructed`) | ~948 | ~67% | PoC n=3 only |
> | 3 re-route (`name_routed`) | ~1,076 | ~40–55% | superseded endpoint-parse ceiling |
>
> A per-lever PASS rate far below its estimate (e.g. reconstruct < 40%) **escalates to the
> founder** — it does not silently complete (UC-REC-04 AC-7).

---

## UC-REC-01: Promote validated in-row scraped polylines (Lever 1)

~1,752 broken routes carry a real rider-drawn polyline in the legacy in-row field the
side-table read path ignores; length-validate and promote them at zero cost.

Acceptance Criteria:
- ☐ System reads the legacy in-row polyline for each of the ~1,752 Lever-1 candidates and measures its decoded length.
- ☐ System promotes an in-row polyline to the geometry side table only when it passes the deterministic length gate (ratio 0.6–1.6).
- ☐ System records provenance = `scraped_promoted` on every route promoted by Lever 1.
- ☐ Founder-Operator can run Lever 1 as a deterministic, zero-cost pass with no LLM or geocoding calls.
- ☐ System sends any in-row polyline that fails the length gate to the next applicable lever rather than promoting it.
- ☐ Founder-Operator can see the count of routes promoted versus rejected after Lever 1 completes.

---

## UC-REC-02: Reconstruct geometry from turn-by-turn descriptions (Lever 2)

~948 routes have turn-by-turn descriptions; the PoC-proven pipeline extracts ordered anchors
via LLM, geocodes region-biased, routes through via-waypoints, and gates the result.

Acceptance Criteria:
- ☐ System extracts ordered intersection anchors from a route's description using the reconstruction LLM for each of the ~948 Lever-2 candidates.
- ☐ System geocodes each anchor with a region bias and rejects any anchor more than 150 miles from the route centroid.
- ☐ System requests a routed polyline through the anchors and admits it only when it passes the length gate (ratio 0.6–1.6).
- ☐ System records provenance = `ai_reconstructed` on every route accepted by Lever 2.
- ☐ Founder-Operator can reconstruct a single named route (e.g., Twist of Tepusquet Loop) and observe a PASS with its measured length and anchor count (41.1 mi, 7 anchors in the PoC).
- ☐ System sends a route that fails the gate after reconstruction into the repair round rather than storing the failed geometry.

---

## UC-REC-03: Re-route from endpoints or road names (Lever 3)

~1,076 A-to-B / road-name routes recover via deterministic endpoint parsing, geocoding, and a
routed line, held to the same gate. No LLM in this lever.

Acceptance Criteria:
- ☐ System parses endpoint or road-name structure (`A – B`, `from X to Y`, highway refs) for each of the ~1,076 Lever-3 candidates using the deterministic parser.
- ☐ System geocodes the parsed endpoints region-biased and requests a routed polyline between them.
- ☐ System admits a re-routed polyline only when it passes the length gate (ratio 0.6–1.6) and the region check.
- ☐ System records provenance = `name_routed` on every route accepted by Lever 3.
- ☐ Founder-Operator can re-route a single named route (e.g., Route 680 — Alameda County) and observe the measured result.
- ☐ System sends a re-routed route that fails the gate into the REVIEW queue rather than storing it.

---

## UC-REC-04: Orchestrate the resumable rescue waterfall

A resumable batch runs the levers in order over all ~4,050 broken-geometry routes, recording
provenance, skipping already-PASSed routes on resume, and staying inside the cost envelope.

Acceptance Criteria:
- ☐ System processes each of the ~4,050 broken-geometry routes through the levers in order (promote → reconstruct → re-route) until one produces a gate-passing geometry.
- ☐ System records the winning lever's provenance value on each recovered route.
- ☐ Founder-Operator can stop and restart the batch and see it resume without reprocessing routes that already PASSed.
- ☐ System ends every processed route in exactly one terminal state (recovered, queued for review, or retirement-eligible) with none left silently unprocessed.
- ☐ Founder-Operator can monitor per-lever and per-state counts while the batch runs.
- ☐ System keeps the batch within the projected envelope (~$0.07 per reconstructed route) and exposes a running cost or call count.
- ☐ Founder-Operator can accept or reject the completed batch on its **realized** rider-ready count and per-lever PASS rates measured against the expected-yield table, and the batch is not "complete" — nor does it unlock retirement — until that acceptance is recorded; a per-lever PASS rate far below its estimate escalates to the founder rather than silently completing.
- ☐ Founder-Operator can verify, on the **real post-batch catalog with no seeded data**, that opening the app in the founder's home region (SLC/Ogden) returns at least a threshold count of rider-ready routes that browse → tap → plot → save end to end — the literal Saturday test the previous catalog failed (near Ogden: 3 routes ≤30 mi, 0 plottable).

---

## UC-REC-05: Retire only after every lever fails

The ~274 residual routes have no recoverable source; retirement is gated behind all-lever
failure plus the classifier verdict, with explicit founder confirmation, and is reversible.

Acceptance Criteria:
- ☐ System marks a route retirement-eligible only after Levers 1–3 have all failed to produce a gate-passing geometry for it.
- ☐ System never retires a route a lever or the ride-worthiness classifier could still rescue.
- ☐ Founder-Operator can review the full retirement-candidate list with each route's failure reason before any retirement commits.
- ☐ System requires explicit founder confirmation before removing any route from the rider-ready surface via retirement.
- ☐ System preserves a retired route's record rather than hard-deleting it, so a later lever or manual fix can restore it via un-retire.
