---
stability: FEATURE_SPEC
last_validated: 2026-07-10
prd_version: 1.0.0
functional_group: HYG
---

# Use Cases: Catalog Hygiene (HYG)

| ID | Title | Description |
|----|-------|-------------|
| UC-HYG-01 | Normalize the editorial score scale | ÷100 the ~103 rows scored 72–90 so the whole catalog shares the 0–1 scale |
| UC-HYG-02 | Merge duplicate route groups | Collapse ~50 duplicate name groups (~106 rows) to one canonical row each |
| UC-HYG-03 | Quarantine length outliers, zero-length, and test rows | Flag ≤0 mi (~64), >1,000 mi (~41), and test/seed rows out of rider reach |
| UC-HYG-04 | Normalize state strings | Canonicalize dirty state values; preserve multi-state routes |

---

## UC-HYG-01: Normalize the editorial score scale

The 103 editorial rows scored 72–90 pin the ranking on the 0–1 scale (Cherohala Skyway at
"90" is permanently #1); divide their stored scores by 100 so the whole catalog shares one
scale.

Acceptance Criteria:
- ☐ System divides the stored composite and dimension scores of the ~103 out-of-scale editorial rows by 100 when the hygiene pass runs.
- ☐ System stores each normalized score on the row itself, not as a read-path patch, so a direct table query returns a 0–1 value.
- ☐ Founder-Operator can run the score-normalization pass and receive a count of rows changed equal to the number of out-of-scale rows found.
- ☐ System leaves already-in-scale (0–1) rows unmodified so a second run changes nothing.
- ☐ Founder-Operator can confirm after the pass that no `curated_routes` row carries a composite score greater than 1.0.

---

## UC-HYG-02: Merge duplicate route groups

The ~50 duplicate name groups (~106 rows) — Cherohala Skyway ×4, Skyline Drive ×4, Blue Ridge
Parkway ×3 — collapse to one canonical row each via a reversible shadow flag.

Acceptance Criteria:
- ☐ System identifies the ~50 duplicate name groups (~106 rows) by normalized route name and centroid proximity.
- ☐ System selects one canonical row per group, preferring the row with gate-passing geometry and the best score, and marks the rest as shadows of the canonical.
- ☐ Founder-Operator can review the canonical-vs-shadow selection for each group before the merge commits.
- ☐ System ensures a shadow row never appears on any suggestion surface after the merge commits.
- ☐ Founder-Operator can confirm after the merge that a search for "Cherohala Skyway" returns exactly one row.

---

## UC-HYG-03: Quarantine length outliers, zero-length, and test rows

The ~64 rows at ≤0 mi, ~41 rows over 1,000 mi (max 710,430 mi), and any test/seed rows (e.g.
"Test Route CO-04" — FOUNDER-BAR T2) get quarantine flags so nonsense never reaches a rider.

Acceptance Criteria:
- ☐ System flags every row with length ≤ 0 (~64 rows) and every row with length > 1,000 mi (~41 rows) as length-quarantined.
- ☐ System flags rows whose names match test/seed patterns as quarantined so no test row can become rider-ready.
- ☐ System excludes quarantined rows from the rider-ready flag until the condition is corrected.
- ☐ Founder-Operator can list all quarantined rows with the reason for each.
- ☐ System clears a length quarantine automatically once recovered geometry yields a measured length within the sane range.
- ☐ Founder-Operator can confirm no rider-ready row reports a length of 0 or greater than 1,000 miles.

---

## UC-HYG-04: Normalize state strings

Dirty multi-state strings (`New-York`, `North-Carolina`, `Alabama / Mississippi / Tennessee`)
normalize to canonical form so region checks and state queries agree.

Acceptance Criteria:
- ☐ System normalizes hyphenated and delimiter-joined state strings to a canonical state representation during the hygiene pass.
- ☐ System preserves a multi-state route as an ordered set of canonical states rather than collapsing it to one.
- ☐ System resolves variants like `North-Carolina` and `North Carolina` to the same canonical state so the region check treats them identically.
- ☐ Founder-Operator can run the state-normalization pass and receive a count of rows changed.
- ☐ System leaves already-canonical state values unchanged so the pass is idempotent.
