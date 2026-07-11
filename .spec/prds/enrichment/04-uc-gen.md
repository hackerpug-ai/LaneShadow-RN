---
stability: FEATURE_SPEC
last_validated: 2026-07-10
prd_version: 1.0.0
functional_group: GEN
---

# Use Cases: Enrichment Generation (GEN)

| ID | Title | Description |
|----|-------|-------------|
| UC-GEN-01 | Generate a grounded "why" from structured route attributes | Core generation: one paragraph per plottable route, every claim traceable |
| UC-GEN-02 | Generate honestly from thin inputs | Attribute-only generation or abstention for the ~32% without source prose |
| UC-GEN-03 | Handle generation failure without corruption | Failures record a reason, never fabricate, never block the batch |

---

## UC-GEN-01: Generate a grounded one-paragraph "why this road is worth riding" from structured route attributes

The pipeline composes a single grounded paragraph for a curated route using only that
route's structured inputs — geometry-derived curvature and span, length, elevation where
available, the five dimension scores, archetype, state/region, and any source snippets. The
paragraph reads in a rider's voice, respects the length budget (lead sentence ≤100 chars,
target 180–260 chars, hard cap 320), and every claim it makes is drawn from a supplied input
fact. Generation runs on the dedicated `enrichment` model tier (z.ai GLM-5.2) and records
the exact grounding-facts snapshot used — the vision-ready seam.

**Acceptance Criteria**

- ☐ System can generate a one-paragraph "why" for any curated route that has trustworthy geometry (`geometryStatus === 'generated'`) and at least one dimension score, using only that route's supplied input facts.
- ☐ System can ground every factual claim in the paragraph to a specific supplied input fact — a dimension score, a geometry/elevation attribute, or a source snippet — so the claim is traceable at review time.
- ☐ System can record the grounding-facts snapshot (including the always-absent-in-v1 optional visual block) with each enrichment so a future vision input extends the same pipeline without schema migration.
- ☐ Operator can generate enrichment for the full post-drop plottable catalog in a single resumable batch run.
- ☐ System can hold every generated "why" to the single-paragraph constraint (one paragraph, no lists, no headers, ≤320 characters) for each successfully enriched route.
- ☐ System can perform generation through the dedicated `enrichment` model tier so the provider/model is swappable in one place without touching pipeline code.

---

## UC-GEN-02: Generate honestly from thin inputs for routes lacking a source summary

About 32% of routes carry no source prose, leaving only scores, geometry, length, archetype,
and region to ground the "why." For these thin-grounding routes the pipeline generates
strictly from the attributes that exist and marks the result attribute-only, never inventing
narrative color to fill the gap. If too little grounding exists to say anything true and
road-specific, it abstains — a recorded state, not a silent skip.

**Acceptance Criteria**

- ☐ System can generate a "why" for a thin-grounding route using only its scores, geometry, length, archetype, and region when no source prose is present.
- ☐ System can mark a thin-grounding enrichment as attribute-only so QA and rendering treat it honestly.
- ☐ System can abstain from producing an enrichment — recording an `abstained` state retrievable by the coverage report — when the available input facts are insufficient to make any true, road-specific claim.
- ☐ System can attribute an interpretation to its underlying score (e.g., "tight, technical corners" tied to a high curvature score) rather than inventing unlisted specifics such as switchback counts or named viewpoints.

---

## UC-GEN-03: Handle a generation failure without corrupting the catalog or lying about coverage

Some routes will fail generation (input parse error, provider timeout, the z.ai
429-insufficient-balance failure seen in FIX-001, QA rejection loop). A failed route must
leave prior state intact, record a retrievable reason, and never write a partial or
placeholder "why." The batch continues past isolated failures but halts after a run of
consecutive provider errors rather than silently substituting a different model.

**Acceptance Criteria**

- ☐ System can record a generation failure with a retrievable reason for any route that fails to produce a valid enrichment.
- ☐ System can leave a route that has no prior enrichment in the honest-absence state — not a partial or placeholder — when its generation fails.
- ☐ System can preserve the last valid enrichment for a route whose regeneration fails, rather than overwriting it with a failed result.
- ☐ Operator can retrieve the list of failed routes with their reasons after a batch run.
- ☐ System can continue processing the remaining routes after any single-route generation failure.
- ☐ System can halt the batch run after a configured number of consecutive provider errors (e.g., sustained 429s) without substituting a different model or provider.
