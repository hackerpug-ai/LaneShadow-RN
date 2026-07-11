---
service: convex
feature: UC-HYG-04
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-HYG-04 core: dirty state strings canonicalize; multi-state routes stay multi-state

The catalog stores 129 distinct "state" strings including `New-York`, `North-Carolina`, and
`Alabama / Mississippi / Tennessee`. The operator runs the state-normalization pass against
the real dev deployment. Hyphenated variants resolve to their canonical names, delimiter-
joined multi-state values become an ordered set of canonical states (never collapsed to just
the first), and already-canonical rows are untouched. The pass reports its changed-count and
a second run reports zero.

**Verify (real dev deployment, no mocks):**
- `npx convex run curatedGeometryHygiene:normalizeStates '{}'` → `{changed: N}` with N > 0
  on first run.
- A previously `New-York` row and a previously `North Carolina`-with-hyphen row both read
  back with the same canonical state value as their clean siblings — a state-filtered query
  returns both old-dirty and always-clean rows together.
- The `Alabama / Mississippi / Tennessee` row reads back as an ordered 3-state set with all
  three canonical names present.
- Immediate re-run: `{changed: 0}`.
