# QUAL-002: LLM Arbitration Batch Runner

**Task ID:** QUAL-002
**Sprint:** [sprint-06 — Quality Infrastructure (Semantic Dedup & Floor)](SPRINT.md)
**Assigned To:** python-implement
**Reviewer:** python-review
**Review Mode:** SINGLE
**Status:** Backlog
**Priority:** P0
**Effort:** M
**Estimate:** 180 min
**Type:** FEATURE
**PRD Refs:** UC-QUAL-01
**Depends on:** QUAL-001  |  **Blocks:** QUAL-003

---

## GOAL

Consume the arbitration queue produced by QUAL-001, send each route pair to Claude Haiku 4.5 with a same-road decision prompt, merge confirmed duplicates using source priority, write results to route_matches, and log per-batch LLM cost to a run ledger.

## DELIVERABLE

- scripts/curation/pipeline/dedup/llm_arbitrator.py (NEW): LLMArbitrator class with run(), _build_prompt(), _parse_decision(), _merge_routes(), cost ledger, main() entrypoint
- scripts/curation/tests/test_qual_002.py (NEW): pytest suite covering all ACs with mocked Anthropic API and mocked Convex HTTP via responses library

## DONE WHEN

- [ ] All pairs in arbitration_queue.json produced by QUAL-001 are processed by Claude Haiku 4.5 (model id claude-haiku-4-5-20251001)
- [ ] Pairs where LLM returns 'YES' (same road) are merged using source priority and written to route_matches via addRouteMatch with isArbitrated=true and arbitrationNotes containing the LLM reasoning
- [ ] Each confirmed merge appends one entry to the winning route's llmReconciliationLog
- [ ] Pairs where LLM returns 'NO' are left unmerged with no route_matches row written
- [ ] Per-batch LLM cost (input tokens, output tokens, USD estimate) is written to scripts/curation/data/ledger/arbitration_cost_ledger.jsonl as one JSON line per batch
- [ ] cd scripts/curation && python -m pytest tests/test_qual_002.py -v passes
- [ ] Only WRITE-ALLOWED files modified

## OUT OF SCOPE

- Re-processing auto-merged pairs from QUAL-001 — those are already resolved
- Quality tier assignment — deferred to QUAL-003
- Human review interface for LLM-uncertain decisions — deferred to a later sprint
- Threshold tuning or updating QUAL-001 thresholds based on arbitration outcomes — out of scope for this task
- Retry logic beyond simple exponential backoff for Anthropic API rate limits

## CRITICAL CONSTRAINTS

**MUST:**
- Use model claude-haiku-4-5-20251001 exactly — no other model ID is permitted
- Prompt must include name, state, highway, description, and candidate_identifiers for both routes in the pair
- Set route_matches.isArbitrated=true for every row written by this task; set arbitrationNotes to the raw LLM reasoning text
- Log per-batch cost to scripts/curation/data/ledger/arbitration_cost_ledger.jsonl — one JSON line per batch with fields: runId, batchIndex, pairsProcessed, inputTokens, outputTokens, costUSD, completedAt
- Apply source priority FHWA > Scenic Byways > Rider Mag > motorcycleroads > BBR > curvature_discovery on all conflicting fields for confirmed merges

**NEVER:**
- Write to field_provenance dict or route_mentions table — those no longer exist
- Re-embed routes by calling updateRouteEmbedding — INF-004 owns all embeddings
- Use a model other than claude-haiku-4-5-20251001 for any arbitration decision
- Hit the real Anthropic API or real Convex deployment in tests — all HTTP must be mocked
- Silently swallow an LLM parse error — log it and write the pair to an error queue file for manual review

**STRICTLY:**
- The decision prompt must produce a structured response parseable to YES/NO/UNCERTAIN — UNCERTAIN must be logged to an error queue, not silently treated as NO
- Every addRouteMatch call for a confirmed merge must include rerankModel='claude-haiku-4-5-20251001' and rerankCost equal to the calculated per-pair USD cost

## SPECIFICATION

**Objective:** Implement an LLMArbitrator that reads the arbitration queue from QUAL-001, batches pairs into Haiku 4.5 API calls with a structured same-road prompt, merges confirmed duplicates into Convex with full audit trail, and records LLM cost per batch.

**Success state:** After a successful run, route_matches contains one isArbitrated=true row per confirmed duplicate pair with arbitrationNotes populated, arbitration_cost_ledger.jsonl records total cost, and no arbitration pair is silently dropped — every pair is either merged, skipped, or in the error queue.

## ACCEPTANCE CRITERIA (TDD Beads)

Each AC is a RED → GREEN → REFACTOR micro-cycle. Orchestrator advances through ACs sequentially.

### 1: LLM YES decision triggers merge and route_matches write

**GIVEN:** arbitration_queue.json contains one pair with cosineSimilarity=0.85 and the mocked Haiku API returns a YES decision with reasoning text
**WHEN:** LLMArbitrator.run() processes the queue
**THEN:** addRouteMatch is called with isArbitrated=true, arbitrationNotes contains the reasoning text, rerankModel='claude-haiku-4-5-20251001', and the winning route's llmReconciliationLog gains one entry

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_002.py::TestLLMArbitrator::test_yes_decision_merges_and_writes_route_match -v`
- **Test file:** `scripts/curation/tests/test_qual_002.py`
- **Test function:** `test_yes_decision_merges_and_writes_route_match`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 2: LLM NO decision leaves routes unmerged

**GIVEN:** arbitration_queue.json contains one pair and the mocked Haiku API returns a NO decision
**WHEN:** LLMArbitrator.run() processes the queue
**THEN:** addRouteMatch is not called, llmReconciliationLog is unchanged, the pair is absent from route_matches

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_002.py::TestLLMArbitrator::test_no_decision_leaves_routes_unmerged -v`
- **Test file:** `scripts/curation/tests/test_qual_002.py`
- **Test function:** `test_no_decision_leaves_routes_unmerged`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 3: Empty arbitration queue exits cleanly

**GIVEN:** arbitration_queue.json exists but contains an empty list
**WHEN:** LLMArbitrator.run() is called
**THEN:** The Anthropic API is never called, cost ledger records a batch with pairsProcessed=0 and costUSD=0.0, process exits 0

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_002.py::TestLLMArbitrator::test_empty_queue_exits_cleanly -v`
- **Test file:** `scripts/curation/tests/test_qual_002.py`
- **Test function:** `test_empty_queue_exits_cleanly`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 4: UNCERTAIN decision routed to error queue

**GIVEN:** arbitration_queue.json contains one pair and the mocked Haiku API returns an UNCERTAIN decision
**WHEN:** LLMArbitrator.run() processes the pair
**THEN:** addRouteMatch is not called, the pair is appended to scripts/curation/data/arbitration/arbitration_error_queue.jsonl with decision='UNCERTAIN', process exits 0

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_002.py::TestLLMArbitrator::test_uncertain_decision_routed_to_error_queue -v`
- **Test file:** `scripts/curation/tests/test_qual_002.py`
- **Test function:** `test_uncertain_decision_routed_to_error_queue`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 5: Per-batch cost logged to ledger

**GIVEN:** arbitration_queue.json contains 3 pairs processed in a single batch and the mocked Haiku API returns usage metadata with inputTokens=300, outputTokens=90
**WHEN:** LLMArbitrator.run() completes
**THEN:** arbitration_cost_ledger.jsonl contains one JSON line with pairsProcessed=3, inputTokens=300, outputTokens=90, costUSD > 0.0, and completedAt is an ISO timestamp

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_002.py::TestLLMArbitrator::test_per_batch_cost_logged -v`
- **Test file:** `scripts/curation/tests/test_qual_002.py`
- **Test function:** `test_per_batch_cost_logged`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

## TEST CRITERIA

Boolean statements that map 1:1 to acceptance criteria. No conditional language.

1. addRouteMatch is called with isArbitrated=true and arbitrationNotes populated for every LLM YES decision
2. addRouteMatch is never called for LLM NO decisions
3. The Anthropic API is never called when the arbitration queue is empty
4. Pairs with UNCERTAIN LLM response appear in arbitration_error_queue.jsonl and addRouteMatch is not called for them
5. arbitration_cost_ledger.jsonl gains exactly one line per batch with inputTokens, outputTokens, and costUSD > 0 when pairs are processed

## READING LIST

- `scripts/curation/pipeline/embed/batch_embed_routes.py` (lines: 1-80) — Cost ledger dataclass pattern and main() CLI structure to replicate for LLM batch runner
- `scripts/curation/pipeline/sync/convex_push.py` (lines: 1-60) — addRouteMatch HTTP POST pattern — exact payload structure and auth header
- `scripts/curation/tests/test_inf004_embed.py` (lines: 1-80) — responses library HTTP mock pattern and MagicMock fixture conventions for Convex calls
- `scripts/curation/data/arbitration/arbitration_queue.json` (lines: 1-30) — Exact schema of queue entries produced by QUAL-001 — name, state, highway, description, candidate_identifiers fields
- `.spec/prds/curation-hardening/tasks/epic-03-foundation-models-schema/INF-006.md` (lines: 1-60) — addRouteMatch required fields: rerankModel, rerankCost, isArbitrated, arbitrationNotes

## GUARDRAILS

### WRITE-ALLOWED
- scripts/curation/pipeline/dedup/llm_arbitrator.py
- scripts/curation/tests/test_qual_002.py
- scripts/curation/data/ledger/arbitration_cost_ledger.jsonl
- scripts/curation/data/arbitration/arbitration_error_queue.jsonl

### WRITE-PROHIBITED
- server/convex/** — schema contract frozen, handled by INF-003
- scripts/curation/pipeline/embed/** — embedding generation owned by INF-004
- scripts/curation/pipeline/dedup/semantic_deduplicator.py — owned by QUAL-001; do not modify
- scripts/curation/data/arbitration/arbitration_queue.json — input artifact from QUAL-001; read-only
- scripts/curation/pipeline/models.py — shared dataclass; changes require cross-task review
- Any file not explicitly listed in write_allowed

## DESIGN

**References:**
- SPRINT.md (sprint-06-quality-dedup-floor/SPRINT.md)
- .spec/prds/curation-hardening/05-uc-qual.md#UC-QUAL-01
- .spec/prds/curation-hardening/tasks/epic-03-foundation-models-schema/INF-006.md

**Interaction notes:**
- arbitration_queue.json is the sole input; LLMArbitrator must not fetch routes from Convex directly — all needed fields are pre-populated by QUAL-001
- Haiku 4.5 prompt must elicit a structured response: first line must be exactly 'DECISION: YES', 'DECISION: NO', or 'DECISION: UNCERTAIN' followed by a 'REASONING:' section — _parse_decision() splits on these tokens
- rerankCost per pair is calculated as: (inputTokens * 0.00000025) + (outputTokens * 0.00000125) — Haiku 4.5 pricing as of 2026-04 (treat as constant, do not call a pricing API)

**Pattern (reference):**

```python
from dataclasses import dataclass, field
from typing import List
import anthropic, json, logging
from datetime import datetime, timezone

@dataclass
class ArbitrationBatchLedger:
    runId: str
    batchIndex: int
    pairsProcessed: int
    inputTokens: int
    outputTokens: int
    costUSD: float
    completedAt: str

class LLMArbitrator:
    MODEL = 'claude-haiku-4-5-20251001'
    BATCH_SIZE = 20

    def run(self, queue_path: str) -> None: ...
    def _build_prompt(self, pair: dict) -> str: ...
    def _parse_decision(self, response_text: str) -> tuple[str, str]: ...  # (decision, reasoning)
    def _merge_routes(self, winner: dict, loser: dict) -> dict: ...
    def _write_ledger(self, ledger: ArbitrationBatchLedger) -> None: ...

def main():
    arbitrator = LLMArbitrator()
    arbitrator.run('data/arbitration/arbitration_queue.json')
```

**Pattern source:** `scripts/curation/pipeline/embed/batch_embed_routes.py`

**Anti-pattern:** Do not re-introduce field_provenance dict or route_mentions table. Do not call updateRouteEmbedding. Do not use any model other than claude-haiku-4-5-20251001. Do not silently treat UNCERTAIN as NO — route to error queue.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| All Tests Pass | `cd scripts/curation && python -m pytest tests/test_qual_002.py -v` | Exit 0 |
| Scope Compliance | `git diff --name-only` | Only WRITE-ALLOWED files modified |

## AGENT INSTRUCTIONS

Per AC: RED (write pytest with xfail, mock Anthropic SDK via unittest.mock.patch on anthropic.Anthropic, mock Convex HTTP via responses library for addRouteMatch POST) → GREEN (implement minimal LLMArbitrator that passes each AC) → REFACTOR (extract _build_prompt, _parse_decision, _write_ledger, add BATCH_SIZE batching). Orchestrator verifies each gate after REFACTOR. Confirm arbitration_queue.json exists from QUAL-001 run before executing against real Convex.

## AGENT ASSIGNMENT

**Implementation agent:** `python-implement`
**Rationale:** Batch LLM invocation over a file-based queue, Convex write-back via HTTP bridge, cost ledger — all Python pipeline work with no mobile or schema changes.

**Review agent:** `python-review`
**Rationale:** Domain-specific reviewer for Python curation pipeline — validates TDD evidence, scope compliance, and anti-pattern adherence with fresh context.

## CODING STANDARDS

- `brain/docs/kanban/TASK-TEMPLATE.md (v5.0)`
- `brain/docs/TDD-METHODOLOGY.md`

## DEPENDENCIES

**Depends on:** QUAL-001

## NOTES

- BATCH_SIZE=20 is a reasonable starting point; each pair generates roughly 400–600 input tokens with the full prompt including both route descriptions
- The cost formula in interaction_notes uses Haiku 4.5 pricing as of 2026-04 — treat as a constant; do not call a dynamic pricing API
- If arbitration_queue.json does not exist (QUAL-001 has not run), main() must exit 1 with a clear error message rather than crashing on FileNotFoundError
- UNCERTAIN decisions are expected to be rare (<5% of queue) but must never be silently dropped — the error queue is the audit trail for manual review in a later sprint
