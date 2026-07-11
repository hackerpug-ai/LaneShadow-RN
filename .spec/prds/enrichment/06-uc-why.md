---
stability: FEATURE_SPEC
last_validated: 2026-07-10
prd_version: 1.0.0
functional_group: WHY
---

# Use Cases: Rider-Facing "Why" Rendering (WHY)

| ID | Title | Description |
|----|-------|-------------|
| UC-WHY-01 | Render the "why" in the existing detail screen | "Why ride it" section between Summary and Scores; no new screens |
| UC-WHY-02 | Show honest absence | "No write-up yet" — never a blank, spinner, or fabrication |
| UC-WHY-03 | Serve provenance and staleness honestly | Provenance caption; stale text keeps serving; staleness rider-invisible in v1 |

---

## UC-WHY-01: Render the grounded "why" inside the existing route detail screen

When a route has a ship-ready enrichment, the detail screen (`curated-route/[id]`, a
full-screen pushed stack route) shows the one-paragraph "why" in a labeled "Why ride it"
section placed between the Summary and Scores sections. The enrichment arrives in the same
query wave as the rest of the detail (one indexed side-lookup inside
`getCuratedRouteDetail`) so it shares the existing loading gate — no separate spinner. Only
QA-passed content is ever served.

**Acceptance Criteria**

- ☐ Rider can read the one-paragraph "why this road is worth riding" on the route detail screen for any route with a ship-ready enrichment.
- ☐ Rider can see the "why" rendered inside the existing detail surface, positioned between the Summary and Scores sections, without navigating to a new screen.
- ☐ System can deliver the enrichment in the same detail query response as the route's other fields so the existing loading state covers it with no separate enrichment spinner.
- ☐ System can serve only QA-passed enrichment content to the detail query — `generated`, `qa_failed`, and `abstained` states are never rendered to riders.
- ☐ System can render the detail screen without error whether or not the route's enrichment is present.

---

## UC-WHY-02: Show an honest absence state when a route has no shippable enrichment

Not every route will have a shipped "why" — early in rollout, and permanently for abstained
or failed routes. Those detail views show a calm, honest absence line ("No write-up yet")
under the always-present "Why ride it" label — matching the screen's established
empty-state idiom — rather than a blank gap, a spinner, or invented text. When the route's
summary is also missing, the two near-identical absence lines collapse into one so the
screen never reads as broken. Enrichment fetch errors collapse to the same rider copy;
the distinction stays in telemetry.

**Acceptance Criteria**

- ☐ Rider can see an honest "No write-up yet" state under the "Why ride it" label for a route that has no ship-ready enrichment.
- ☐ Rider can still use the full remainder of the detail screen (scores, map, conditions, Save, Ride It) when the "why" is absent.
- ☐ System can distinguish internally between not-yet-generated, abstained, failed, and fetch-error states while presenting the rider a single honest absence copy.
- ☐ System can collapse the Summary section's empty line and the enrichment absence line into a single absence message when both summary and enrichment are missing.
- ☐ Rider cannot see a placeholder, a forever-spinner, or a fabricated paragraph in place of a missing "why."
- ☐ System can keep an enrichment-only read failure from breaking the rest of the detail screen (the failure collapses to absence; the route still renders).

---

## UC-WHY-03: Serve provenance and staleness honestly (rider-invisible staleness)

Enriched routes carry a small always-on provenance caption ("Generated from route & terrain
data") so the first LLM-authored rider-facing content in the app is transparent about its
nature. Staleness is rider-invisible in v1: when a route's inputs change after generation,
the enrichment keeps serving its last QA-passed text while regeneration queues — riders are
never shown an actionless "out of date" warning, and attribute-only enrichments carry no
language implying source-verified narrative detail.

**Acceptance Criteria**

- ☐ Rider can see a provenance caption on every enriched detail view identifying the "why" as generated from route and terrain data.
- ☐ Rider can still read the existing "why" text while its enrichment is internally marked stale, rather than having it hidden pending regeneration.
- ☐ Rider cannot see any staleness badge, timestamp, or "may be out of date" marker in v1 — staleness is operator-facing only.
- ☐ System can serve an attribute-only "why" without any marker or claim implying source-verified narrative detail it does not have.
