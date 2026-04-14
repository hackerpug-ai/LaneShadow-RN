# Epic 2 Retrospective — Baseline Curation Pipeline Validation

**Epic:** epic-02-baseline-pipeline-validation
**Timeline:** 2026-04-12 → 2026-04-14 (~48 hours elapsed, ~36 hours active work across multiple sessions)
**Final verdict:** PASS
**Sign-off:** @justin (2026-04-14)

---

## TL;DR

Epic 2 was scoped as a defensive "run the existing pipeline end-to-end and prove each stage works" check before hardening. It became the most consequential epic in the Curation Hardening initiative because running the existing pipeline revealed that the community scraper stage was producing silent corruption (MR 30 routes with Alabama-stamped Blue Ridge Parkway, BBR 413 routes at ~10% yield). The remediation produced:

- A **seven-phase Crawl Plan Protocol** (`tasks/CRAWL-PLAN-PROTOCOL.md`) institutionalizing pre-extraction discipline for all future source tasks
- A **generic `crawl_plan/` framework module** (`scripts/curation/pipeline/sources/crawl_plan/`, 5 modules, 192 passing tests) battle-tested on two real Form A sources
- A new pipeline principle **P6** added to `00-overview.md` ("Committed crawl plan before extraction at scale")
- A clean Epic 2 baseline: **5,768 records** (FHWA 645 + MR 1,899 + BBR 3,224) with all 5 landmarks present and verdict PASS (honest, no softening)
- Two **protocol-level operational rules** elevated from hard-earned failures (Python module cache trap, subagent session death orphaning crawlers)
- An **INF-011 follow-up** (US_STATES allowlist normalization) partially shipped, reducing non-canonical state_primary rate from 0.92% to 0.33% of community records
- A **HANDOFF.md cold-pickup pattern** tested across multiple real session boundaries

Epic 3 (Foundation — Models, Schema, Dependencies) is now unblocked with a clean, auditable baseline to diff against.

---

## Scope evolution

**Original plan (2026-04-12):** BASE-001 as a single 240-min task validating each pipeline stage.

**Round 1 (2026-04-12):** Decomposed BASE-001 into 8 tasks (BASE-001..008) for parallelization and context-window manageability.

**Round 2 (2026-04-13 AM):** Inserted BASE-000 as Wave 0 data-prep prerequisite after `/kb-run-epic` preflight discovered the FHWA input CSV did not exist and the canonical DOT ArcGIS layer returns 645 routes (not the 184 the PRD assumed). See `DECISIONS.md` "FHWA data source resolution".

**Round 3 (2026-04-13 PM):** Inserted BASE-009 as a Crawl Plan Protocol remediation task after BASE-008 surfaced "PASS WITH ISSUES" on the community scrapers. See `DECISIONS.md` "Crawl Plan Protocol adoption".

**Round 4 (2026-04-13 PM, same evening):** Split BASE-009 into BASE-009a (framework + MR) + BASE-009b (BBR + baseline regen + verdict upgrade) for risk isolation on BBR's ~3.75hr Phase 5 execution. See `DECISIONS.md` "Split sub-decision".

**Round 5 (2026-04-14 morning):** Recalibrated BASE-009b AC-3 from `[3500, 5500]` to `[3100, 3400]` after the first Phase 5 run measured 3,226 route-details. See `DECISIONS.md` "BASE-009b Phase 5 findings — 3a AC-3 gate recalibration".

**Final task count:** 11 (BASE-000 through BASE-009b) + 1 follow-up (INF-011 in Epic 3).

---

## Arc timeline

| When | Event | Commit |
|---|---|---|
| 2026-04-12 | Original BASE-001 decomposed to BASE-001..008 | (task files) |
| 2026-04-13 AM | Preflight reveals FHWA CSV missing; BASE-000 inserted; DOT ArcGIS extract 645 routes | (BASE-000 implementation commits) |
| 2026-04-13 midday | BASE-001..007 validate existing pipeline stages | `f1f029e`, `f5d52fa`, earlier |
| 2026-04-13 PM | BASE-008 Curation Review Protocol executed; verdict "PASS WITH ISSUES" on community scrapers | `f5d52fa` |
| 2026-04-13 evening | Crawl Plan Protocol adopted; BASE-009 inserted and split into 009a/009b; principle P6 added | `a623e3d` |
| 2026-04-13 evening | HANDOFF.md written for overnight execution | `507310e` |
| 2026-04-13 evening | Phase 0 recon: parallel `general-purpose` subagents produce site-maps for MR + BBR | `e7f6368` |
| 2026-04-13 overnight | BASE-009a Phase 1: framework + MR inventory (1,908 route-details) | `80b07fb` |
| 2026-04-13 overnight | BASE-009a Phases 2-4: fixtures, selectors, parser, fixture tests | `8fd9aee` |
| 2026-04-14 00:00-02:00 | BASE-009a Phase 5 run #1 aborted at 590 records (module cache trap) | `ffa287d` → `585852f` → `67382a7` → `a533c30` |
| 2026-04-14 02:00-04:30 | BASE-009a Phase 5 run #2 clean at 1,899 records (99.5% yield) | — |
| 2026-04-14 04:40 | BASE-009a Phase 6: MR crawl-report.md verdict PASS | `cf947d7` |
| 2026-04-14 05:00 | BASE-009b Phases 2-4: BBR fixtures, selectors, tests | `ecc64f6` |
| 2026-04-14 05:15 | BASE-009b Phase 1+5: BBR inventory 3,226 (below pre-flight gate) + glue file | `7d22b42` |
| 2026-04-14 05:15-08:49 | BBR Phase 5 execution (~3hr 34min, interrupted once by session death, restarted under nohup) | — |
| 2026-04-14 08:35 | Gate recalibration + operational lessons (DECISIONS.md 3a-3d, CRAWL-PLAN-PROTOCOL.md revision 2026-04-14) | `7289f17` |
| 2026-04-14 08:36 | INF-011 stub (pre-execution) | `3836cc5` |
| 2026-04-14 08:59 | BASE-009b Phase 6: BBR crawl-report + Epic 2 baseline regen + review.md verdict PASS | `2f5f5ac` |
| 2026-04-14 09:14 | INF-011 Phase 1: US_STATES allowlist + normalize cascade | `8ca42c5` |
| 2026-04-14 PM | kb-run-epic v2.10 patch (EXCLUDE_PATHS) so `.spec/` changes don't block orchestration | `~/.claude/skills/kb-run-epic/SKILL.md` (global) |

---

## Metrics

### Scope

| Metric | Value |
|---|---|
| Elapsed wall clock | ~48 hours (2026-04-12 AM → 2026-04-14 PM) |
| Active work time | ~36 hours |
| Atomic commits in the remediation arc | 14 (`a623e3d` → `8ca42c5`) |
| Task files (BASE-*) | 11 |
| Protocol docs created | 2 (`CRAWL-PLAN-PROTOCOL.md`, `HANDOFF.md`) |
| DECISIONS.md top-level entries | 2 |
| DECISIONS.md sub-sections | 9 (3a-3d for morning + split + adoption sub-sections) |
| Files in the framework module | 5 (`inventory.py`, `selector_map.py`, `parser.py`, `executor.py`, `us_states.py`, plus `fix_regional.py` utility) |
| Framework unit + fixture test count | 192 passing |
| Test suite runtime | ~4 seconds |

### Data

| Source | Baseline count | Yield | Schema failures | Non-canonical state_primary |
|---|---|---|---|---|
| FHWA | 645 | N/A (static CSV) | 0 | 0 |
| MotorcycleRoads | 1,899 | 99.5% (1,899 / 1,908 inventory) | 0 | 17 (0.90%) — cross-country + NLP-deferred |
| BestBikingRoads | 3,224 | 99.94% (3,224 / 3,226 inventory) | 0 | 0 (post INF-011) |
| **Combined community** | **5,123** | — | **0** | **17 (0.33%)** |
| **Total (incl. FHWA)** | **5,768** | — | **0** | — |

### Landmark presence in combined staging

| Landmark | Matches | Source(s) |
|---|---|---|
| Tail of the Dragon | 6 | BBR (canonical) |
| Million Dollar Highway | 2 | BBR (canonical) |
| Blue Ridge Parkway | 18 | FHWA (authoritative NC/VA) + BBR |
| Beartooth | 5 | FHWA (MT/WY) + MR (multi-state verified) + BBR |
| Pacific Coast | 7 | FHWA (CA/OR/WA) + MR + BBR |

**All 5 landmarks present.** No Alabama-stamped Blue Ridge Parkway or Beartooth Pass (the Epic 2 sidebar-contamination bug is fixed).

### Framework artifacts

- `scripts/curation/pipeline/sources/crawl_plan/` — 5 modules, generic, 192 tests
- `scripts/curation/pipeline/sources/motorcycleroads.py` — 93 non-comment lines of thin glue (from ~300 lines of blind-selector mess)
- `scripts/curation/pipeline/sources/bestbikingroads.py` — similar thin glue
- `scripts/curation/tests/sources/` — `test_crawl_plan_framework.py` (192 tests covering inventory, classify, canonicalize, parser, us_states, normalize cascade, parser integration) + `test_motorcycleroads_fixtures.py` + `test_bestbikingroads_fixtures.py`
- `fixtures/motorcycleroads/` and `fixtures/bestbikingroads/` — ~11 HTML fixtures per source with committed `fixtures.manifest.yaml`
- `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/` and `.../bestbikingroads/` — 4 artifacts each (site-map, urls.jsonl, selectors.yaml, crawl-report.md with verdict PASS)

---

## What worked

### 1. Autonomous overnight execution pattern

User explicitly said *"wanna do BASE-009a and BASE-009b. K thanks"* and went to bed. The orchestrator session chained Phase 1 → Phase 2-6 → BBR → remediation → INF-011 across a ~12-hour span, committed 10+ atomic commits, recovered from two real failures (module cache trap, session death), and woke the user to an honest-PASS `review.md`.

The `HANDOFF.md` cold-pickup pattern proved out across multiple real session boundaries — this retro is being written from a different session than the one that ran BASE-009a. The auto-memory entries (`~/.claude/projects/.../memory/`) plus the committed `HANDOFF.md` together allow a fresh Claude instance to resume within ~5 minutes of reading.

### 2. Subagent-based Phase 0 recon

The user overrode the protocol's original "do not automate recon" rule and dispatched two parallel `general-purpose` subagents with explicit briefs (protocol doc + task files + known traps + required output structure + budget). Both returned with high-confidence site-maps in ~30 min each.

**The MR recon agent traced Epic 2's 30-route yield to its exact root cause in under an hour of investigation:** the prior scraper hit `/motorcycle-roads/{state}` which returns the site homepage with a 30-route global sidebar rail, not a state-filtered listing. The correct master index is `/motorcycle-rides-in/united-states` (103 paginated pages × ~20 routes = ~2,044 routes). This is a root-cause diagnosis the human had not reached in prior manual analysis.

The **BBR recon agent measured cluster additivity on Tennessee** (state listing 68 rides, cluster `lake-obion-weakley` 46 rides, 17% overlap = 83% additive) and flagged clusters as load-bearing discovery. Without this finding, BASE-009b would have repeated Epic 2's ~10% yield failure.

The protocol doc was updated to soften the "do not automate recon" rule into "automate only with explicit briefs + human review gate".

### 3. Gate recalibration based on measurement

BBR inventory came in at 3,226 vs the pre-flight `[3,500, 5,500]` gate. Three options were considered (see DECISIONS.md 3a):

| # | Option | Rejected because |
|---|---|---|
| A | Keep `[3500, 5500]` and call Phase 5 FAIL | The gate was an estimate, not a measurement. Failing on honest measurement because an estimate was wrong punishes measurement, not guesswork. |
| B | Loosen to `[3000, 5500]` or `[2800, 4500]` | Too wide. Defeats the purpose of the gate. |
| **C** | **Recalibrate to `[3100, 3400]` with full audit trail** | **Selected.** ~4% below / ~5% above measured reality. Catches future regressions. |

The new gate is pinned to evidence (per-state audits on CA and TN confirmed banner totals are inflated vs what's navigable). Spec files touched: BASE-009b.md AC-3/AC-9/Success-looks-like/boolean test row, EPIC.md epic-level AC, HANDOFF.md Current State. The historical `[3500, 5500]` values in DECISIONS.md and site-map.md were preserved as audit trail; only forward-looking call sites were recalibrated.

### 4. Framework design for cross-source reuse

The `crawl_plan/` module was built generic from day 1. Forms A (MR, BBR) both consume it unchanged. The design was explicitly validated against Form B/C/D extensibility at BASE-009a AC-1 review (code-reviewer checks).

**Proof points:**
- BASE-009b consumed the BASE-009a framework **unchanged** (AC-1 gate). No framework edits landed in BASE-009b's commits.
- INF-011 added `us_states.py` + parser post-processing as a new cascade without modifying `canonicalize()`, `classify()`, `discover()`, or `run_crawl()`.
- The framework unit tests (`test_crawl_plan_framework.py`) were extended by 40+ tests for us_states without changing existing tests.

Epic 4 (SRC-001 GIS, SRC-006 Rider Magazine) and Epic 9 (RID-001 ADVRider RSS, RID-002 Reddit, RID-006 Pushshift) will extend the framework via adapter layers. No framework rewrite is anticipated.

### 5. Honest verdicts throughout

Every verdict in the arc is traceable to measurement. No "PASS WITH NOTES" softening. When something couldn't honestly pass (e.g., the 17 remaining MR cross-country records), it was documented as a non-blocking follow-up with a tracked stub (INF-011 Phase 2 → Epic 10).

The Epic 2 `review.md` verdict upgrade from "PASS WITH ISSUES" to "PASS" was backed by:
- 5,768 records in combined staging
- 0 schema validation failures
- 99.5% MR yield, 99.94% BBR yield
- All 5 landmarks present in combined catalog
- No Alabama-stamped contamination (multi-state schema validated E2E on Natchez Trace Parkway AL/MS/TN)

The **absence** of a "PASS WITH ISSUES" escape hatch at the crawl-report level (protocol rule: binary verdict PASS or FAIL) was load-bearing. It forced root-cause fixes rather than workaround documentation.

### 6. Plan mode before substantial spec changes

The user invoked plan mode (`ExitPlanMode` workflow) before authorizing the 2026-04-14 morning remediation commit. The plan → review → exit-plan-mode rhythm caught the gate recalibration range question before code was touched. Plan file saved at `~/.claude/plans/eventual-cuddling-wombat.md`.

### 7. Atomic commits per logical phase

Each phase of BASE-009a/b landed as its own atomic commit with a HEREDOC message. Git history reads as a clean narrative of the arc:

```
8ca42c5 INF-011 Phase 1: US_STATES allowlist + normalize_state_primary cascade
2f5f5ac BASE-009b Phase 6: BBR crawl-report.md + Epic 2 baseline regen + review.md verdict PASS
3836cc5 epic-03: INF-011 stub for US_STATES allowlist in inventory classifier
7289f17 spec: BBR gate recalibration + operational lessons from overnight execution
7d22b42 BASE-009b Phase 1+5: BBR inventory (3226 routes) + glue file rewrite
ecc64f6 BASE-009b Phases 2-4: BBR fixtures, selectors.yaml, and fixture tests
cf947d7 BASE-009a Phase 6: MR crawl-report.md verdict PASS
a533c30 Fix conftest.py to work from both repo root and scripts/curation/
67382a7 Fix test_scrapers.py: remove obsolete MotorcycleRoadsScraper class refs, fix pre-existing failures
585852f Fix parser.py: description extraction uses span (not p) siblings
ffa287d BASE-009a Phase 5: motorcycleroads.py thin glue + __init__ fix
8fd9aee BASE-009a Phases 2-4: fixtures, selectors, parser, fixture tests
80b07fb BASE-009a Phase 1: crawl_plan framework + MR inventory (1908 route details)
507310e Add HANDOFF.md for Crawl Plan Protocol execution
a623e3d Adopt Crawl Plan Protocol; insert Epic 2 BASE-009a/b remediation
```

No WIP commits, no force-pushes, no history rewrites. Every commit passes the project pre-commit hooks (type-check + ESLint + Convex dev --once) — no `--no-verify` bypasses.

---

## What hurt (and how we recovered)

### 1. Sloppy crawling was the pre-existing failure mode

Epic 2 BASE-002's original MR and BBR scrapers used:
- Blind CSS selectors (`.field-field-rating`, `[class*='rating']`, `.field-field-description`) never validated against real pages
- Interleaved discovery + fetch + extraction in a single pass with no intermediate artifacts
- Swallowed exceptions (`except Exception: continue`) at every layer
- No committed URL inventory; dedup happened at extraction time (too late to catch sidebar contamination)
- No fixture-based parser tests, so the "state from listing page" bug was only discovered after running at scale

The Alabama-stamped Blue Ridge Parkway was the observable symptom. The underlying disease was **no crawl plan, no truth file, no accountability counters.**

**Recovery:** Crawl Plan Protocol adopted as cross-cutting methodology; BASE-009 inserted as retroactive remediation; two protocol-level operational rules elevated.

**Lasting impact:** Future source tasks (Epic 4, Epic 9) cannot repeat this pattern. The protocol's Phase 0-6 gates + the `crawl_plan/` framework's fail-closed parsing make blind-selector crawlers structurally impossible.

### 2. Python module cache trap

During BASE-009a Phase 5 run #1 (MR), the parser was fixed mid-crawl (`585852f Fix parser.py: description extraction uses span (not p) siblings`). The running Python process had already imported the old `parser.py` bytecode; Python does not hot-reload on file changes. Result: the first ~590 MR records were silently parsed with the buggy pre-commit code, producing 0% description rate. The audit counters showed `parse_success=590` because the parser didn't crash — it just returned `description=None`.

**How it was detected:** spot-check on 3 random staged records showed all three had empty descriptions. Running the committed parser against a live fetch of the same URL produced a 140-char description.

**Recovery:**
1. Killed the crawler (`kill 64460`)
2. Wiped staging files
3. Restarted via `nohup bash -c '...' & disown` — fresh process imported the fixed bytecode
4. 2nd run completed cleanly with 99.6% description yield across 1,899 records

**Elevated protocol rule:** *Never edit framework source while a crawler process is live — kill → fix → restart.*

Documented in `DECISIONS.md` "Anti-pattern: Python module cache during mid-run parser edits" (sub-section 3c) and `CRAWL-PLAN-PROTOCOL.md` Revision History row 2026-04-14 morning.

### 3. Subagent session death orphaned the BBR crawler

BASE-009b Phase 5 was dispatched via a `python-implement` subagent. The subagent started the crawler via a Bash `run_in_background=true` call (making the crawler a child of the agent's bash subprocess). When the subagent session ended — agents have context budgets and eventually return their result — its bash subprocess exited, killing its children (the crawler).

**What happened at the session boundary:** The crawler had fetched 50 routes cleanly (`fetched=50, parse_success=50, schema_validation_fail=0, http_error=0`) when the agent session ended. No crash, no log entry, no error — the process simply disappeared from `ps`.

**Recovery:**
1. Verified the crawler was not running
2. Wiped staging files
3. Restarted via `nohup bash -c 'PYTHONPATH=... python -m scripts.curation.pipeline.sources.bestbikingroads > /tmp/bbr_crawl_v2.log 2>&1' & disown`
4. Started a separate polling background task (`while kill -0 $PID; do sleep 120; done; cat audit.json`) via `run_in_background=true` for a clean completion notification
5. The crawler survived all subsequent session boundaries and ran for 3 hr 34 min to completion

**Elevated protocol rule:** *Long-running crawlers MUST be dispatched with process lifetime independent of the dispatching session — either `nohup ... & disown` from inside a shell, or the orchestrator launching with `run_in_background=true` directly, or a systemd/launchd supervisor. Subagent-dispatched child processes die with the subagent.*

Documented in `DECISIONS.md` "Anti-pattern: subagent session death orphaning background crawlers" (sub-section 3d) and `CRAWL-PLAN-PROTOCOL.md` Revision History row 2026-04-14 morning.

### 4. Pre-flight estimates were wrong in both directions

| Source | Pre-flight estimate | Measured reality | Correction |
|---|---|---|---|
| MR | 300-1000 routes | 1,908 routes (103 paginated master-index pages × ~20 routes) | `[300, 1000]` → `[1800, 2200]` on 2026-04-13 PM |
| BBR | 3,500-5,500 routes | 3,226 routes | `[3500, 5500]` → `[3100, 3400]` on 2026-04-14 morning |

Both errors traced to the same root cause: **site banner / nav-menu totals are marketing, not measurement.** BBR's "California: 401 Motorcycle Roads" banner overstates what's actually navigable from state + cluster pages (measured: 329). MR's "2,044" from the agent's first pass became 1,908 on the final inventory run due to routes rotating between the estimate and the actual crawl.

**Lesson learned (not yet elevated to protocol):** Phase 0 recon should document the *method* used to derive estimates, not just the number. If the method is "summed from banners", the gate should be wider; if the method is "recursive crawl measurement", the gate can be tight.

### 5. DC was missed in first US_STATES pass

My first `US_STATES` allowlist in INF-011 Phase 1 had strictly 50 states. BBR's 7 Washington DC records (state_primary = `washington-dc`) failed the allowlist check on first dry-run.

**Fix:** Added `washington-dc` to `US_STATES` with an explicit docstring note ("federal district; included for URL-classification purposes, not geographic/legal semantics"). Also added `dc` to `_USPS_TO_SLUG` and three DC aliases to `_NAME_TO_SLUG` for meta-description lookups. Total: 51 entries in the final set.

**Lesson:** strict semantic correctness (50 states ≠ 51 localities) loses to operational correctness (what URL slugs does the source publish). Document the tradeoff inline so future readers don't "fix" it back.

### 6. kb-run-epic dirty-tree trap (caught in post-arc cleanup)

During the retro / cleanup phase, the user's parallel waypoint research left `.spec/PRODUCT-STRATEGY.md`, `.spec/USER-PROFILES.md`, and `.spec/research/waypoint-demand/` uncommitted in the working tree. kb-run-epic's auto-commit-WIP behavior (step [1.5.e] `git add -A`) would have swept those `.spec/` files into a code-orchestration WIP commit.

**Fix:** Patched `~/.claude/skills/kb-run-epic/SKILL.md` to v2.10 with an `EXCLUDE_PATHS = [".spec/", ".claude/projects/"]` constant at step [1.5.pre]. The dirty-tree check at [1.5.a], the pre-audit at [1.5.d], and the auto-commit at [1.5.e] all filter through the exclude list via `grep -vE` and `git reset HEAD -- {path}`. Non-code directories are invisible to orchestration while remaining visible in plain `git status`.

**Lesson:** orchestration skills should distinguish "code working tree" from "project working tree". The two are not the same when `.spec/`, `.tmp/`, `.cache/`, etc. hold non-code artifacts.

---

## Lessons learned (not yet elevated to protocol rules)

1. **Plan mode before substantial spec changes.** Use `ExitPlanMode` workflow for multi-file spec/doc updates. The plan file creates a reviewable single-point-of-alignment before changes propagate.
2. **Atomic commits per logical phase.** Not per-step WIP. The git history should read as a narrative.
3. **Site banners ≠ measurements.** Always ground gates in recursive-crawl measurement. Pre-flight estimates are useful for scope, not for acceptance.
4. **LLM-assisted selector derivation is cost-effective at Phase 3.** ~45 min + ~$0.50 across both sources. Validation via `fixture_yield` catches false positives immediately.
5. **BBR multi-state is single-state by design.** Sources that have no authoritative multi-state evidence should use `states_all = [state_primary]` as a length-1 list. Documented exemption precedent in DECISIONS.md 3b for future sources to cite.
6. **gitignore isn't enough for orchestration scope.** `staging/` is gitignored, which kept the BBR staging file out of commits — good. But `.spec/` is tracked and needs explicit `EXCLUDE_PATHS` handling to stay out of code-orchestration commits — this took a separate patch.
7. **Subagents have context budgets and die.** Long-running work must have process lifetime independent of the dispatching session. See protocol rule 2 above.
8. **Python imports are cached at module-load time.** You cannot hot-reload framework code into a running process. See protocol rule 1 above.

---

## Follow-ups (non-blocking, all tracked)

### Immediate (Epic 3 prereqs)

1. **INF-002** (Epic 3 stub) — Route / EnrichedRoute model extension to carry `state_primary` + `states_all` through to Convex. Load-bearing for the framework's multi-state schema reaching production.
2. **INF-003** (Epic 3 stub) — Convex schema migration for the new fields.

### Shortly after (Epic 3 scope)

3. **INF-011 Phase 2** — NLP-based state extraction from route names for the 17 remaining MR cross-country records (`united-states`, `northeast`, `midwest`, etc.). Currently deferred to Epic 10 where the NLP pipeline lives. Could also land in Epic 3 if a simpler regex heuristic suffices.

### Medium-term (Epic 6 scope)

4. **Quality floor — state name vs URL state cross-check.** The Tier 2 human test uncovered a BBR source-data bug: `Spring Green - Barneveld` is filed under BBR's `/illinois/ride/...` path but both towns are in Wisconsin. The framework faithfully extracted Illinois as `state_primary` because that's what BBR's URL says. A downstream quality rule should cross-check the state name against route-name text (e.g., NLP-extracted place names, or a geocoding fallback). Track in Epic 6 QUAL-002 or similar.
5. **Cross-country route model.** The 11 `united-states` MR records are legitimately multi-state tour routes that span many states. A `is_cross_country: bool` flag in the Route model (Epic 3 INF-002) would let downstream consumers treat them as first-class rather than flagging them as "non-canonical state_primary".

### Long-term (Epic 10+ scope)

6. **Module hash-at-load-time check.** A framework-level defense against the Python module cache trap: on module load, compute `hashlib.sha256(open(__file__,'rb').read())`; on each call, re-check; raise if the file on disk has changed. Rejected for INF-011 scope as YAGNI / Epic 12 orchestrator concern. Documented for future reference.
7. **PID file + heartbeat supervisor.** A framework-level defense against session death orphaning crawlers: the crawler writes a PID + last-progress timestamp periodically; a supervisor detects staleness and alerts/restarts. Rejected for BASE-009 scope as Epic 12 orchestrator concern. Documented for future reference.

### Meta / tooling

8. **CI wiring.** `pytest scripts/curation/tests/sources/` on every PR touching sources or fixtures. Not required but high-leverage — catches selector drift and parser regressions automatically.
9. **Firecrawl API budget approval.** Estimated total across the initiative for Phase 3 selector spec: ~$1-3. Should be explicitly approved in `09-technical-requirements.md` before Epic 4 begins. Currently deferred.
10. **Elevate agent-driven Phase 0 recon to protocol main section.** The protocol's "do not automate recon" guidance has been softened twice (2026-04-13 evening Revision History + this arc's experience). A future protocol revision should fold the lesson into the main "Phase 0 — RECON" section: *"Automate only with explicit briefs, known traps, and a human review gate."*

---

## Cross-epic inheritance

The BASE-009a/b framework and protocol rules propagate forward:

| Future epic | How it inherits |
|---|---|
| **Epic 3 INF-001..007** | Extends Route model with `state_primary` + `states_all`; migrates Convex schema; enables downstream consumers to treat multi-state as first-class |
| **Epic 3 INF-011** (new stub) | Completes the `US_STATES` normalization work for framework cross-source use; Phase 2 NLP extraction deferred to Epic 10 |
| **Epic 4 SRC-001** (Scenic Byways GIS) | Form B adapter on the `crawl_plan/` framework; inherits canonicalize, classify, parser, executor, us_states normalization |
| **Epic 4 SRC-006** (Rider Magazine 50 Best) | Form A adapter (like MR/BBR); framework consumed unchanged |
| **Epic 4 SRC-004** (curvature discovery) | Form E — exempt from Crawl Plan Protocol (pre-computed file consumer) |
| **Epic 9 RID-001** (ADVRider RSS) | Form C adapter — XML/feedparser layer on top of the `crawl_plan/` framework |
| **Epic 9 RID-002** (Reddit OAuth2) | Form D adapter — cursor-pagination layer |
| **Epic 9 RID-006** (Pushshift backfill) | Form D variant with date-range windowing |
| **Epic 12 orchestrator** | Inherits `urls.jsonl` inventories as fan-out units, `audit.json` as success gates, `.progress` files for resumability. May land the deferred module-hash + PID-supervisor defenses from this arc's lessons. |

Every future source task has a mandatory CRAWL-PLAN-PROTOCOL acceptance criteria block and a pre-verification gate at CURATION-REVIEW-PROTOCOL Step 1.

---

## Acknowledgements

- **Original Epic 2 planning:** @justin, 2026-04-12
- **BASE-000 data-prep discovery:** `/kb-run-epic` preflight investigation, 2026-04-13 AM
- **Phase 0 recon subagents:** Two parallel `general-purpose` agents, 2026-04-13 evening
- **Overnight autonomous execution:** Orchestrator session, 2026-04-13 overnight → 2026-04-14 AM
- **Module cache trap recovery + BBR session death recovery:** Mid-execution diagnosis and nohup restart, 2026-04-14 AM
- **Gate recalibration + operational lessons:** Plan mode workflow, 2026-04-14 morning
- **BBR Phase 5 execution:** ~3hr 34min unattended, 2026-04-14 morning
- **Framework normalization (INF-011 Phase 1):** 2026-04-14 afternoon
- **Human testing (Tier 1-3):** Cross-verified, 2026-04-14 afternoon
- **Final sign-off:** @justin (2026-04-14)

Every decision along the arc was approved by @justin via chat.

---

## Status

- **Epic 2:** DONE ✅
- **BASE-000 through BASE-009b:** all marked `STATUS: Done` with `TDD_PHASE: GREEN`
- **Definition of Done:** all 9 checkboxes ✅
- **Epic-level Acceptance Criteria:** all 20 checkboxes ✅
- **Review.md verdict:** PASS (honest, cross-verified)
- **Framework:** battle-tested, 192 tests passing
- **Memory system:** 8 entries across user, feedback, project, and reference types
- **HANDOFF.md:** written for cold-pickup and kept current
- **Downstream unblock:** Epic 3 (INF-001) can dispatch whenever the user is ready

---

*End of retro. Next epic: [Epic 3 — Foundation — Models, Schema, Dependencies](../epic-03-foundation-models-schema/EPIC.md)*
