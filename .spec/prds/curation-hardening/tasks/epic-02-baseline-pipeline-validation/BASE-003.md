================================================================================
TASK: BASE-003 - Haiku extraction validation + Boy Scout __main__ for extraction/client.py
================================================================================

TASK_TYPE: INFRA
STATUS: Backlog
TDD_PHASE: RED
CURRENT_AC: AC-1
PRIORITY: P0
EFFORT: S
TYPE: PROCESS
ITERATION: 1

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST: Limit extraction to exactly 20 routes sampled from `staging/fhwa.jsonl` — do NOT run extraction on the full BBR or MR corpus in this task (cost control).
MUST: Add a `__main__` block to `extraction/client.py` (Boy Scout fix, committed separately) that reads a JSONL sample file, runs `ExtractionClient.extract()` on each route's name+description, and writes results to a specified output file.
MUST: Log and capture in `baseline-report.md`: (a) `temperature=0` confirmation from `ExtractionClient` initialization log, (b) `EXTRACTION_SCHEMA_VERSION` value from `extraction/schema.py`, (c) extraction success/failure count.
MUST: Write the 20 extracted `RouteAttributes` objects serialized as JSON lines to `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl` — this file is BASE-004's input.
MUST: Set `ANTHROPIC_API_KEY` from the environment before running — if unset, log the error and abort with a clear message rather than silently failing.
NEVER: Hardcode an API key in any file — always read from `ANTHROPIC_API_KEY` env var.
NEVER: Override temperature — `ExtractionClient` hardcodes `temperature=0` per P4; the `__main__` block must not pass a temperature argument.
NEVER: Run extraction on more than 20 routes in this task.
STRICTLY: Use `ExtractionClient.extract()` — do not call the Anthropic SDK directly in the `__main__` block.
STRICTLY: Write `baseline/catalog.jsonl` using `RouteAttributes.model_dump_json()` (it is a Pydantic BaseModel) not `dataclasses.asdict()`.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Add a minimal `__main__` block to `extraction/client.py` that accepts a JSONL sample path and output path, runs `ExtractionClient.extract()` on each route's name+description text, and writes `RouteAttributes` JSON lines to the output. Then run it on a 20-route sample drawn from `staging/fhwa.jsonl`, verify all 20 records are populated with valid scores, confirm `temperature=0` and `EXTRACTION_SCHEMA_VERSION` are logged, and write the 20 records to `baseline/catalog.jsonl` as BASE-004's input.

**Success looks like:** `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl` has exactly 20 lines; every record contains `scenic_score`, `technical_score`, `traffic_score`, `remoteness_score`, `condition_score`, `elevation_score`, `designation_score`, `community_score` all as floats in [0,1]; `baseline-report.md` extraction section shows `temperature=0` and `EXTRACTION_SCHEMA_VERSION=1`; the Boy Scout `__main__` fix is committed separately.

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** `ExtractionClient` in `scripts/curation/pipeline/extraction/client.py` has no `__main__` block, so there is no way to invoke it from the CLI without writing a driver script. As with FHWA, Epic 2 needs a runnable entry point before the Haiku extraction stage can be validated.

**Why it matters:** Haiku extraction is the probabilistic step in the curation pipeline — LLM-driven attribute inference on route descriptions. Without a runnable driver, we cannot verify temperature=0 (Pipeline Principle P4), EXTRACTION_SCHEMA_VERSION, or Pydantic schema conformance. This is the single riskiest stage in the baseline because it costs money per invocation and depends on external API behavior.

**Current state:** `ExtractionClient(api_key, model='claude-haiku-4-5')` has `.extract(text) -> RouteAttributes` as the public API. `temperature` is hardcoded to 0 in `__init__`. `RouteAttributes` is a Pydantic `BaseModel` in `extraction/schema.py` with fields `scenic_score`, `technical_score`, `traffic_score`, `remoteness_score`, `condition_score`, `elevation_score`, `designation_score`, `community_score` (all `float` in [0,1]) plus a `reasoning: str` field (chain-of-thought comes first per schema design). `EXTRACTION_SCHEMA_VERSION = 1`.

**Desired state:** `extraction/client.py` has a `__main__` block with `--sample`, `--count`, `--out` argparse flags. The block reads the FHWA sample, logs the schema version and temperature, calls `.extract()` on each route's `name + description` text, and writes each `RouteAttributes.model_dump_json()` to the output file. Running `python -m scripts.curation.pipeline.extraction.client --sample staging/fhwa.jsonl --count 20 --out .spec/.../baseline/catalog.jsonl` produces a 20-line JSONL file with all score fields populated.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Extraction module runnable as python -m with sample JSONL input
  GIVEN: extraction/client.py has a __main__ block (Boy Scout fix, committed separately), ANTHROPIC_API_KEY is set, and staging/fhwa.jsonl exists from BASE-001
  WHEN: `python -m scripts.curation.pipeline.extraction.client --sample staging/fhwa.jsonl --count 20 --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl` is executed
  THEN: the module exits 0 and baseline/catalog.jsonl is written with 20 lines

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_extraction_runnable
  VERIFY: `python -m scripts.curation.pipeline.extraction.client --sample staging/fhwa.jsonl --count 20 --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl && COUNT=$(wc -l < .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl | tr -d ' ') && python -c "assert int('$COUNT') == 20, f'Expected 20, got $COUNT'" && echo 'extraction module PASS'`

AC-2: All 20 RouteAttributes records fully populated
  GIVEN: baseline/catalog.jsonl exists from AC-1
  WHEN: all 20 records are parsed and required score fields are checked
  THEN: every record has scenic_score, technical_score, traffic_score, remoteness_score, condition_score, elevation_score, designation_score, community_score as floats in [0.0, 1.0]; no nulls

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_route_attributes_populated
  VERIFY: `python -c "import json; records=[json.loads(l) for l in open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl')]; fields=['scenic_score','technical_score','traffic_score','remoteness_score','condition_score','elevation_score','designation_score','community_score']; bad=[f for r in records for f in fields if not isinstance(r.get(f),float) or not (0.0<=r[f]<=1.0)]; assert not bad, f'Bad fields: {bad}'; print('RouteAttributes fields PASS')"`

AC-3: temperature=0 and EXTRACTION_SCHEMA_VERSION logged
  GIVEN: the extraction run from AC-1 completed
  WHEN: baseline-report.md extraction section is inspected
  THEN: it contains 'temperature=0' (or 'temperature: 0') and 'EXTRACTION_SCHEMA_VERSION' (value 1)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md — self-referential)
  TEST_FUNCTION: verify_extraction_metadata_in_report
  VERIFY: `grep -qi 'temperature.*0' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'EXTRACTION_SCHEMA_VERSION' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo 'extraction metadata PASS'`

AC-4: reasoning field present and non-empty on every record
  GIVEN: baseline/catalog.jsonl exists from AC-1
  WHEN: all 20 records are checked for the reasoning field
  THEN: every record has a non-empty reasoning string (chain-of-thought MUST come first per schema design)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_reasoning_field
  VERIFY: `python -c "import json; records=[json.loads(l) for l in open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl')]; assert all(r.get('reasoning') for r in records), 'Some records missing reasoning'; print('reasoning field PASS')"`

Quality Criteria:
- [ ] Extraction ran exactly once on 20 routes (cost bound)
- [ ] `temperature=0` confirmed in baseline-report.md
- [ ] Every record has all 8 score fields AND a non-empty reasoning string

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | `python -m scripts.curation.pipeline.extraction.client --sample staging/fhwa.jsonl --count 20 --out baseline/catalog.jsonl` exits 0 and writes exactly 20 lines | AC-1 | `python -m scripts.curation.pipeline.extraction.client --sample staging/fhwa.jsonl --count 20 --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl && python -c "assert $(wc -l < .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl \| tr -d ' ') == 20"` | [ ] TRUE [ ] FALSE |
| 2 | Every record in baseline/catalog.jsonl has all 8 score fields as floats in [0.0, 1.0] | AC-2 | `python -c "import json; recs=[json.loads(l) for l in open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl')]; assert all(isinstance(r.get('scenic_score'),float) and 0<=r['scenic_score']<=1 for r in recs)"` | [ ] TRUE [ ] FALSE |
| 3 | baseline-report.md extraction section contains 'temperature' AND 'EXTRACTION_SCHEMA_VERSION' | AC-3 | `grep -qi 'temperature' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'EXTRACTION_SCHEMA_VERSION' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md` | [ ] TRUE [ ] FALSE |
| 4 | Every record in baseline/catalog.jsonl has a non-empty reasoning field | AC-4 | `python -c "import json; recs=[json.loads(l) for l in open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl')]; assert all(recs[i].get('reasoning') for i in range(len(recs)))"` | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. scripts/curation/pipeline/extraction/client.py
   - Lines: ALL
   - Focus: `ExtractionClient.__init__` signature, `.extract()` method, `temperature` property, `model` property — design the `__main__` block around these

2. scripts/curation/pipeline/extraction/schema.py
   - Lines: ALL
   - Focus: `RouteAttributes` fields and `EXTRACTION_SCHEMA_VERSION` — these define the output schema; use `.model_dump_json()` not `asdict()`

3. scripts/curation/pipeline/models.py
   - Lines: 1-30
   - Focus: Route fields to build extraction input text from `name + description`

4. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/EPIC.md
   - Lines: 29
   - Focus: Human test step 4 — sample 20 from FHWA; verify RouteAttributes, temperature=0, EXTRACTION_SCHEMA_VERSION logged

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pipeline/extraction/client.py (MODIFY — add `__main__` block only, Boy Scout fix, commit separately)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl (NEW — 20 RouteAttributes JSON lines)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md (APPEND — extraction section)

WRITE-PROHIBITED:
- scripts/curation/pipeline/extraction/schema.py — do NOT modify `RouteAttributes` or `EXTRACTION_SCHEMA_VERSION`
- scripts/curation/pipeline/scoring/** — BASE-004 territory
- scripts/curation/pipeline/classification/** — BASE-005 territory
- staging/** — runtime output; 20-route sample is a temp file, not committed

MUST:
- [ ] Commit Boy Scout `__main__` fix separately
- [ ] Use `ExtractionClient.extract()` only (no direct Anthropic SDK calls)
- [ ] Serialize with `.model_dump_json()` (Pydantic), not `json.dumps(__dict__)`
- [ ] Sample exactly 20 routes — no more, no less

MUST NOT:
- [ ] Run extraction on more than 20 routes
- [ ] Pass temperature argument to ExtractionClient
- [ ] Hardcode API key

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Pattern: adding a `__main__` block that wraps an existing API client class with argparse, reads a JSONL sample, invokes the client on each record, and writes Pydantic model output as JSONL.

```python
if __name__ == "__main__":
    import sys
    import json
    import logging
    import argparse
    from pathlib import Path
    from scripts.curation.pipeline.extraction.schema import EXTRACTION_SCHEMA_VERSION

    logging.basicConfig(level=logging.INFO)

    p = argparse.ArgumentParser()
    p.add_argument("--sample", required=True, help="Path to input JSONL of Route records")
    p.add_argument("--count", type=int, default=20, help="Number of routes to extract (cost bound)")
    p.add_argument("--out", required=True, help="Output JSONL path for RouteAttributes")
    args = p.parse_args()

    routes = [json.loads(l) for l in open(args.sample)][: args.count]
    client = ExtractionClient()  # reads ANTHROPIC_API_KEY, temperature=0 hardcoded
    logging.info(f"EXTRACTION_SCHEMA_VERSION={EXTRACTION_SCHEMA_VERSION} temperature={client.temperature}")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as f:
        for r in routes:
            text = f"{r['name']} ({r.get('state','')})\n{r.get('description','No description')}"
            attrs = client.extract(text)
            f.write(attrs.model_dump_json() + "\n")

    print(f"Extracted {args.count} routes -> {out}")
```

**Pattern source:** `ExtractionClient` API in `scripts/curation/pipeline/extraction/client.py`; `RouteAttributes.model_dump_json()` from Pydantic BaseModel.

**Anti-pattern:** Do NOT use `json.dumps(attrs.__dict__)` — `RouteAttributes` is a Pydantic model, use `.model_dump_json()`. Do NOT pass temperature to `ExtractionClient()` — it is hardcoded to 0 and the constructor does not accept a temperature argument. Do NOT call the Anthropic SDK directly — always go through `ExtractionClient`.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: python-implement

## EXECUTION

### Step 1: Boy Scout __main__ fix
  READ: `extraction/client.py` fully to understand `ExtractionClient` constructor (does it take args? what env vars does it read?)
  WRITE: Append the `__main__` block per the CODE PATTERN section
  COMMIT: `git add scripts/curation/pipeline/extraction/client.py && git commit -m "Add __main__ block for Epic 2 baseline validation (Boy Scout)"`

### Step 2: Run extraction (AC-1, AC-2, AC-4)
  PREREQ: `ANTHROPIC_API_KEY` is set; `staging/fhwa.jsonl` exists from BASE-001
  DO: Run the extraction command from AC-1's VERIFY
  VERIFY: baseline/catalog.jsonl has 20 lines, all records have all 8 score fields + reasoning

### Step 3: Record in baseline-report.md (AC-3)
  WRITE: Extraction section with `temperature=0`, `EXTRACTION_SCHEMA_VERSION=1`, 20/20 success count, sample record
  VERIFY: grep confirms both keywords present

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER AC-1:
  RUN: the AC-1 VERIFY command
  EXPECT: "extraction module PASS" + exit 0
  IF FAIL: Missing `__main__` block OR API key unset OR network error — diagnose before retrying

AFTER AC-2:
  RUN: the AC-2 VERIFY command
  EXPECT: "RouteAttributes fields PASS"
  IF FAIL: Pydantic schema violation — may require Boy Scout fix to `RouteAttributes` validators (escalate before touching schema.py)

AFTER AC-3:
  RUN: the AC-3 VERIFY command
  EXPECT: "extraction metadata PASS"

AFTER AC-4:
  RUN: the AC-4 VERIFY command
  EXPECT: "reasoning field PASS"

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implement
**Rationale:** Python + Anthropic SDK wrapper work; python-implement owns `scripts/curation/pipeline/extraction/`.

**Review Agent:** python-review
**Rationale:** Validates Pydantic model serialization, temperature=0 confirmation, cost bound (20 routes max), no SDK key leakage.

**Assignment Date:** 2026-04-12

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Extraction exits 0 and writes 20 lines
  Command: `python -m scripts.curation.pipeline.extraction.client --sample staging/fhwa.jsonl --count 20 --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl && python -c "assert $(wc -l < .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl | tr -d ' ') == 20" && echo PASS`
  Expected: PASS

Gate 2: All 8 score fields in [0,1]
  Command: `python -c "import json; recs=[json.loads(l) for l in open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/catalog.jsonl')]; fields=['scenic_score','technical_score','traffic_score','remoteness_score','condition_score','elevation_score','designation_score','community_score']; assert all(isinstance(r.get(f),float) and 0<=r[f]<=1 for r in recs for f in fields); print('PASS')"`
  Expected: PASS

Gate 3: temperature=0 and schema version in report
  Command: `grep -qi 'temperature.*0' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'EXTRACTION_SCHEMA_VERSION' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo PASS`
  Expected: PASS

Gate 4: Boy Scout fix in separate commit
  Command: `git log --oneline -5 scripts/curation/pipeline/extraction/client.py | head -1`
  Expected: Commit message references "__main__" or "Boy Scout"

Gate 5: Scope compliance
  Command: `git diff --name-only HEAD~2..HEAD`
  Expected: Only files in WRITE-ALLOWED list

--------------------------------------------------------------------------------
REVIEW CRITERIA (for python-review)
--------------------------------------------------------------------------------

TDD Quality (INFRA adaptation):
- [ ] All 4 ACs verified via VERIFY commands
- [ ] Boy Scout `__main__` fix in separate commit
- [ ] Cost bound respected (exactly 20 extractions)

Code Quality:
- [ ] `ExtractionClient()` instantiated without arguments (uses env var)
- [ ] `.model_dump_json()` used for serialization (not `__dict__`)
- [ ] No direct Anthropic SDK calls
- [ ] argparse used for `--sample`, `--count`, `--out`

Domain-Specific:
- [ ] `temperature=0` confirmed in logs (P4 compliance)
- [ ] `EXTRACTION_SCHEMA_VERSION=1` logged and recorded
- [ ] reasoning field is non-empty on every record (chain-of-thought-first schema intent)

Security:
- [ ] No API key in any committed file
- [ ] `ANTHROPIC_API_KEY` read from environment only

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- BASE-001 — needs `staging/fhwa.jsonl` as the source of the 20-route sample

Blocks:
- BASE-004 — composite scoring operates on the extracted routes (via `baseline/catalog.jsonl` and the original Route objects)
- BASE-008 — Curation Review Protocol step 6 requires extraction output

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] BASE-001 complete (staging/fhwa.jsonl exists)
- [ ] `ANTHROPIC_API_KEY` environment variable set (verify before starting)
- [ ] Anthropic account has sufficient quota for 20 Haiku extractions

Can Execute In Parallel With: BASE-006 (OSM enrichment — uses FHWA centroids, not extraction output)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Cost estimate: ~20 Haiku API calls × ~$0.002 each = ~$0.04 total (trivial).
- This task was extracted from the archived BASE-001.md (the 240-minute single task) during the Epic 2 decomposition on 2026-04-12.
- Future epics may bump `EXTRACTION_SCHEMA_VERSION` — this task captures v=1 as the Epic 2 baseline.
- The 20-route sample should be drawn from FHWA (best-quality source) for reproducibility; random seed not required but document the sample selection in baseline-report.md.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
