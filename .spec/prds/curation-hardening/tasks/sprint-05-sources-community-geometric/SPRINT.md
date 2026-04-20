# Sprint 5: Source Diversification — Community + Geometric

**Sequence:** 5 / 12
**Priority:** P1
**Original Estimated Effort:** 590 minutes (~10 hours)
**Actual Outcome:** 2 tasks descoped by PRD revision, 1 task delivered under Sprint 4 ownership

---

## Closure Summary

This sprint reached `Done` not by executing all three originally-planned tasks, but by a combination of PRD-driven descope and cross-sprint delivery. All originally planned scope is accounted for; nothing remains to execute.

| Task | Closure Type | Date | Reference |
|------|--------------|------|-----------|
| **SRC-002** Ingest BDR GPX Routes | **Closed: Descoped** | 2026-04-12 | PRD `04-uc-src.md` lines 16–17 (UC-SRC-02 dropped) |
| **SRC-003** twtex.com Top 100 Scraper | **Closed: Descoped** | 2026-04-12 | PRD `04-uc-src.md` lines 18–19 (UC-SRC-03 dropped) |
| **SRC-004** adamfranco/curvature Discovery | **Closed: Completed in Epic 4** | 2026-04-16 | Commit `0c473cd7d307c7906eb7091e3416009a24752543`, task file at `../epic-04-sources-government-editorial/SRC-004.md` |

---

## Closure Detail

### SRC-002 — Ingest BDR GPX Routes (Descoped)

**Decision date:** 2026-04-12
**Authority:** PRD `04-uc-src.md`, validated under `prd_version: 1.1.0`
**Reasons (both stand independently):**

1. **Product (V3 lifestyle pivot, 2026-04-12)** — BDR routes target the ADV / dual-sport persona. LaneShadow V3 re-scoped to recreational cruiser and touring riders (see `RULES.md` "User Context"); BDR is out of audience.
2. **Technical (Week 0 validation evidence)** — VAL-002 found that the published BDR GPX URLs return HTTP 403, blocking the originally planned ingestion path. Even if the V3 mismatch were resolved, the access route is non-viable without additional negotiation with BDR.

**Implementation:** None. No `scripts/curation/pipeline/sources/bdr.py` exists and none should be created without revisiting the PRD.

### SRC-003 — twtex.com Top 100 Scraper (Descoped)

**Decision date:** 2026-04-12
**Authority:** PRD `04-uc-src.md`, validated under `prd_version: 1.1.0`
**Reason:**

- **Source assumption invalidated by VAL-003** — The original PRD assumed twtex.com publishes a curated "Top 100" motorcycle roads list. Week 0 validation established that twtex.com is a Texas regional motorcycle forum, not a Top-100 source. The premise of the task does not exist on the target site.

**Implementation:** None. No `scripts/curation/pipeline/sources/twtex.py` exists and none should be created — the source itself is not what the PRD believed it to be.

### SRC-004 — adamfranco/curvature Discovery (Completed under Epic 4)

**Completion date:** 2026-04-16
**Owning task file:** [`../epic-04-sources-government-editorial/SRC-004.md`](../epic-04-sources-government-editorial/SRC-004.md) (`STATUS: Completed`)
**Merge commit:** `0c473cd7d307c7906eb7091e3416009a24752543` on `main`

**Shipped artifacts:**

- Consumer module: `scripts/curation/pipeline/sources/curvature_discovery.py` (359 lines)
- Test suite: `scripts/curation/tests/sources/test_curvature_discovery.py` — 12 tests passing
- Production artifact: `data/curvature/adamfranco-us-curvature.jsonl` — 1,013,985 rows, sha256 `ab590f7234b94c088fa1fdaa5c82cbcd3a410af9796ebd235488168075b137ed`
- Convex release: `adamfranco-us-curvature-51-states-sha256-ab590f7234b9`
  - `manifestStorageId=kg294vqwcb9pt1307n3d7wehd984zgwn`
  - `fullArtifactStorageId=kg2717wv7a84y06frxvz22aj4184yyt8`
  - All 51 state shards uploaded to Convex File Storage
  - Metadata persisted in `curation_artifact_releases` and `curation_artifact_shards`
- Verified live (2026-04-16) on dev (`quirky-panther-164`) and prod (`fantastic-owl-967`) via `curationArtifacts:getActiveArtifactReleaseWithShards`

**Why it ended up in Epic 4 instead of Sprint 5:** When the 2026-04-12 PRD revision dropped SRC-002 and SRC-003, the geometric source (SRC-004) was the only remaining task in this sprint's original scope. Rather than running a one-task sprint, the work was folded into the surviving source-diversification sprint (Epic 4 / `epic-04-sources-government-editorial/`) and shipped there.

---

## Why this sprint number is preserved

The `sprint-05-` folder is intentionally retained (rather than deleted) so the sprint sequence in `INDEX.md` and downstream sprint references stay stable. Sprints 6 onward continue to refer to "Sprint 5" as a known-closed slot, not as missing work.

---

## Original Plan (Historical Reference)

The original three-task plan, restored from `epic-05-sources-community-geometric/EPIC.md` at commit `5d2d55c1`, is preserved here for traceability. Do not treat any of this as executable work.

### Original Tasks

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Closure |
|----|-------|------|-------|----------|--------|----------|---------|
| SRC-002 | Ingest BDR GPX Routes | FEATURE | python-implement | P1 | M | 240 | Descoped 2026-04-12 |
| SRC-003 | twtex.com Top 100 Scraper | FEATURE | python-implement | P1 | M | 200 | Descoped 2026-04-12 |
| SRC-004 | adamfranco/curvature Pre-Computed Output Consumer | FEATURE | python-implement | P1 | S | 150 | Completed 2026-04-16 in Epic 4 |

**Original total:** 590 minutes (~10 hours)
**Realized scope:** 150 minutes (SRC-004 only), executed under Epic 4

### Original PRD Sections Covered

- **S4.2** — UC-SRC-02 Ingest BDR GPX *(UC dropped 2026-04-12)*
- **S4.3** — UC-SRC-03 Ingest twtex.com Top 100 *(UC dropped 2026-04-12)*
- **S4.4** — UC-SRC-04 Run adamfranco/curvature Geometric Discovery *(UC live, delivered under Epic 4)*

---

## Reopening Criteria

Do not reopen this sprint. If the BDR or twtex sources become viable again:

1. **First, amend the PRD.** Update `.spec/prds/curation-hardening/04-uc-src.md` to un-strike the relevant UC, document the new evidence overriding the V3 mismatch / VAL-002 / VAL-003 findings, and bump `prd_version`.
2. **Then plan a new sprint.** Create a fresh `sprint-NN-...` folder via `/kb-sprint-plan`. Do not retroactively edit this sprint's closure record.

This preserves the audit trail — the deletion is a real product decision, not a paperwork glitch.

---

## Redirects

- Surviving geometric scope (executable record): [SRC-004](../epic-04-sources-government-editorial/SRC-004.md)
- Governing index: [INDEX.md](../INDEX.md)
- PRD source-of-truth: [04-uc-src.md](../../04-uc-src.md)
- Project context: [README.md](../../README.md)

---

## Task Detail Files

Reopened 2026-04-20 for SRC-001 (Scenic Byways GIS) and SRC-006 (Rider Magazine 50 Best).
Both implementations exist; tasks cover missing fixture data and test verification.

- [SRC-001-scenic-byways-gis-fixture-data.md](SRC-001-scenic-byways-gis-fixture-data.md)
- [SRC-006-rider-magazine-50-best-fixture-data.md](SRC-006-rider-magazine-50-best-fixture-data.md)
