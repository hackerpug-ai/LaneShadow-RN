---
stability: FEATURE_SPEC
last_validated: 2026-07-10
prd_version: 1.0.0
functional_group: LIFE
---

# Use Cases: Enrichment Lifecycle & Ops (LIFE)

| ID | Title | Description |
|----|-------|-------------|
| UC-LIFE-01 | Detect staleness on input change | Content-hash comparison flags enrichment whose grounding inputs changed |
| UC-LIFE-02 | Regenerate scoped sets | Stale/failed/new/single-route regeneration through the same QA gates |
| UC-LIFE-03 | Report coverage and health | The operator instrument behind the R1 claim |

---

## UC-LIFE-01: Detect and flag enrichment that has gone stale after its route data changed

Enrichment is generated from a snapshot of a route's inputs; when the Trust wave or later
curation changes those inputs (re-geocode, score edit), or when the prompt/model version is
bumped, the existing "why" may no longer be true. The system detects the change by comparing
a deterministic content-hash of the current inputs (+ promptVersion + model) against the
hash stored at generation time and flags the enrichment stale. Staleness is a first-class
recorded state, not silent drift — and it does not unpublish (see UC-WHY-03).

**Acceptance Criteria**

- ☐ System can flag an enrichment as stale when the deterministic hash of the route's current grounding inputs (including prompt and model version) differs from the hash stored at generation time.
- ☐ System can keep a stale enrichment's prior QA-passed text available and serving while it is queued for regeneration, rather than deleting or hiding it.
- ☐ Admin can define which route-input changes participate in the staleness hash versus which are cosmetic and excluded.
- ☐ Operator can retrieve the list of stale enrichments across the catalog.

---

## UC-LIFE-02: Regenerate enrichment for changed, stale, or failed routes

The operator can re-run generation targeting only the routes that need it — newly added,
changed, flagged stale, or previously failed — without regenerating the whole catalog.
Regeneration is idempotent: a route whose current input hash matches its stored QA-passed
enrichment is skipped with no model spend. Every regenerated "why" passes back through the
same grounding and tone QA before it can ship.

**Acceptance Criteria**

- ☐ Operator can trigger regeneration scoped to only the stale, failed, and newly-added routes.
- ☐ System can skip a route whose current input hash matches its stored QA-passed enrichment, spending no model tokens on it.
- ☐ System can re-run grounding and tone QA on every regenerated "why" before it becomes ship-ready.
- ☐ System can clear a route's stale or failed flag once its regenerated enrichment passes QA.
- ☐ Operator can regenerate a single named route on demand for a spot fix.

---

## UC-LIFE-03: Report enrichment coverage and health to the operator

The operator needs a truthful, catalog-wide picture of the corpus to know whether R1 is
actually met: how many routes have a shipped "why," and how many are absent, abstained,
stale, thin-grounded, failed, or QA-failed. The coverage report is computed from live
enrichment state — never a cached or hand-maintained figure — and is the operational
instrument behind the Founder Bar's R1 claim.

**Acceptance Criteria**

- ☐ Operator can view the count and percentage of eligible catalog routes that have a ship-ready "why."
- ☐ Operator can view how many routes are in each non-ready state — absent, abstained, stale, failed, QA-failed, and thin-grounded (attribute-only).
- ☐ Operator can confirm from the report whether R1 (every plottable route's detail shows a grounded "why") is met for the shippable catalog.
- ☐ System can compute the coverage report from live enrichment state at query time rather than a cached or hand-maintained figure.
