---
service: convex
feature: UC-LIFE-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-LIFE-03 core: the coverage report is live truth for R1 — counts, percentages, verdict

The operator runs the coverage report against the real dev deployment. It returns the
count and percentage of eligible (plottable) routes with a ship-ready why, per-state
counts for absent / abstained / stale / failed / qa_failed / thin-grounded
(attribute-only), and the R1 verdict. It is computed from live state at query time:
flipping a single row's status and re-running the report moves exactly one route between
exactly two buckets — no cache, no hand-maintained figure anywhere in the path.

**Verify (integration, real dev deployment + operator CLI):**
- `npx convex run curatedEnrichment:coverageReport` → buckets, ship-ready percentage, and
  the R1 verdict are all present; the bucket sum equals the eligible-route count.
- Patch one row `qa_passed` → `qa_failed` → re-run: ship-ready −1, qa_failed +1, every
  other bucket identical.
- Revert the patch → the report returns to its original figures exactly.
