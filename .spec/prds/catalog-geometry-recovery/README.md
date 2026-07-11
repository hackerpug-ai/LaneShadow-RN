---
status: SUPERSEDED
superseded_by: ../route-agent-quality/
superseded_on: 2026-07-11
---

# Catalog Geometry Recovery — SUPERSEDED

> **Do not plan or implement from this folder.** The live spec is
> [`.spec/prds/route-agent-quality/`](../route-agent-quality/README.md) (v3.0.x), which
> absorbed and re-ratified this investigation's direction after the 2026-07-10 audit + PoC.
> This folder is retained as **historical evidence only**: the verified 2026-07-08 catalog
> audit, the root-cause analysis, and the results of the July recovery run.

## What this folder still proves (evidence, not plan)

| File | Keep for |
|---|---|
| [00-overview.md](./00-overview.md) | The original audit (8.6% geometry, root causes: swallowed 429s / unparsed endpoints / empty `highwayNumber`), the tier-1/2 yield validations, and the **completed 2026-07-09 full run**: 5,207 unresolved → 2,395 recovered → 50.2% coverage, with QA splits. |
| [triage.md](./triage.md) | The post-run queue census (2,864 unresolved / 1,340 suspect) that seeded the successor's group sizing, and the named garbage-headliner examples (north-cascade 9,074 mi off, truncated Cherohala). |

## What changed in the successor (do NOT follow the old plan)

- **"Drop everything unplottable" is superseded.** The old governing principle (delete
  routes without geometry; 100%-plottable catalog by deletion) was replaced by
  **rescue-first → reversible `retired` status + founder confirmation**, with a hard
  `riderReady` READ gate doing the "every suggestion plots" guarantee instead of deletion.
- **Nominatim/Overpass recovery is retired.** The name-only geocode with no output
  validation is the documented root cause of wrong-length geometry; the successor uses
  Google Geocoding (region-biased) + Google Routes, behind a **deterministic verification
  gate** (length-ratio + region + degeneracy) — the `suspect_far`/`suspect_length`
  heuristics fold into that gate.
- **A new lever exists this doc never had:** AI reconstruction of geometry from route
  descriptions (LLM anchors → geocode → route), PoC-proven at ratio 1.00 (`.spec/proposals/geometry-completion/`).
- **The agent layer is in scope there too** (Mastra rebuild; and as of v3.0.2 **pi-ai is
  removed entirely** — this doc's pi-ai install/build-fix notes are historical).
