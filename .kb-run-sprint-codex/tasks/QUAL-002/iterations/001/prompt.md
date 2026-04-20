# Implementer Task — QUAL-002: LLM Arbitration Batch Runner

You are the **IMPLEMENTER** for task **QUAL-002**.

You are a **python-implement** agent. Write Python code following best practices with TDD discipline — write tests first, then implement to make them pass.

You may write Python source code, tests, and configuration files. You may run pytest, ruff, and other tools. You may read any file in the repository for context. Create git commits on your worktree branch.

You may NOT modify files outside your WRITE-ALLOWED list or disable pre-commit hooks.

## Worktree

- **Path:** /Users/justinrich/Projects/LaneShadow/.kb-run-sprint-codex/worktrees/QUAL-002
- **Branch:** codex/QUAL-002
- **Parent repo:** /Users/justinrich/Projects/LaneShadow
- **Iteration:** 1

## Your Task

**QUAL-002: LLM Arbitration Batch Runner**

### GOAL

Consume the arbitration queue produced by QUAL-001, send each route pair to Claude Haiku 4.5 with a same-road decision prompt, merge confirmed duplicates using source priority, write results to route_matches, and log per-batch LLM cost.

### DELIVERABLE

- scripts/curation/pipeline/dedup/llm_arbitrator.py (NEW): LLMArbitrator class with run(), _build_prompt(), _parse_decision(), _merge_routes(), cost ledger, main()
- scripts/curation/tests/test_qual_002.py (NEW): pytest suite covering all ACs with mocked Anthropic API and mocked Convex HTTP

### ACCEPTANCE CRITERIA

**AC-1: LLM YES decision triggers merge and route_matches write**
- GIVEN: arbitration_queue.json has one pair (cosine=0.85), mocked Haiku returns YES
- WHEN: LLMArbitrator.run() processes the queue
- THEN: addRouteMatch called with isArbitrated=true, arbitrationNotes has reasoning, rerankModel='claude-haiku-4-5-20251001', winning route's llmReconciliationLog gains one entry
- Test: test_yes_decision_merges_and_writes_route_match

**AC-2: LLM NO decision leaves routes unmerged**
- GIVEN: One pair, mocked Haiku returns NO
- WHEN: run() processes
- THEN: addRouteMatch NOT called, llmReconciliationLog unchanged
- Test: test_no_decision_leaves_routes_unmerged

**AC-3: Empty arbitration queue exits cleanly**
- GIVEN: Empty queue list
- WHEN: run() called
- THEN: Anthropic API never called, cost ledger records pairsProcessed=0, costUSD=0.0
- Test: test_empty_queue_exits_cleanly

**AC-4: UNCERTAIN decision routed to error queue**
- GIVEN: One pair, mocked Haiku returns UNCERTAIN
- WHEN: run() processes
- THEN: addRouteMatch NOT called, pair appended to arbitration_error_queue.jsonl with decision='UNCERTAIN'
- Test: test_uncertain_decision_routed_to_error_queue

**AC-5: Per-batch cost logged to ledger**
- GIVEN: 3 pairs in one batch, mocked Haiku returns inputTokens=300, outputTokens=90
- WHEN: run() completes
- THEN: arbitration_cost_ledger.jsonl has one line: pairsProcessed=3, inputTokens=300, outputTokens=90, costUSD > 0.0
- Test: test_per_batch_cost_logged

### CRITICAL CONSTRAINTS

- Use model `claude-haiku-4-5-20251001` exactly
- Prompt must include name, state, highway, description, candidate_identifiers for both routes
- isArbitrated=true for every row; arbitrationNotes = raw LLM reasoning
- Log per-batch cost to arbitration_cost_ledger.jsonl
- Source priority: FHWA > Scenic Byways > Rider Mag > motorcycleroads > BBR > curvature_discovery
- UNCERTAIN must go to error queue, NOT silently treated as NO
- rerankCost = (inputTokens * 0.00000025) + (outputTokens * 0.00000125)

### READING LIST

1. scripts/curation/pipeline/dedup/semantic_deduplicator.py — Source priority map, _write_route_match pattern, cost ledger
2. scripts/curation/pipeline/sync/convex_push.py — HTTP POST to Convex pattern
3. scripts/curation/tests/test_qual_001.py — responses library mock pattern
4. scripts/curation/data/arbitration/arbitration_queue.json — Queue schema from QUAL-001

### WRITE-ALLOWED

- scripts/curation/pipeline/dedup/llm_arbitrator.py
- scripts/curation/tests/test_qual_002.py
- scripts/curation/data/ledger/arbitration_cost_ledger.jsonl
- scripts/curation/data/arbitration/arbitration_error_queue.jsonl

### WRITE-PROHIBITED

- server/convex/**
- scripts/curation/pipeline/embed/**
- scripts/curation/pipeline/dedup/semantic_deduplicator.py
- scripts/curation/data/arbitration/arbitration_queue.json
- scripts/curation/pipeline/models.py

## Output Format

Your final message MUST be a single JSON object. First character `{`, last character `}`. No markdown fences.

```json
{
  "$schema": "ImplementerResponse",
  "type": "object",
  "required": ["status", "iteration", "worktree_path", "worktree_branch", "validation_passed", "self_heal_count", "commit_sha", "evidence", "notebook_entries", "summary"],
  "properties": {
    "status": {"enum": ["completed", "blocked_pre_existing", "blocked_external", "needs_kickback"]},
    "iteration": {"type": "integer", "minimum": 1},
    "worktree_path": {"type": "string"},
    "worktree_branch": {"type": "string"},
    "validation_passed": {"type": "boolean"},
    "self_heal_count": {"type": "integer", "minimum": 0},
    "commit_sha": {"type": "string", "pattern": "^[a-f0-9]{40}$"},
    "evidence": {
      "type": "object",
      "required": ["test_output_path", "typecheck_output_path", "lint_output_path"],
      "properties": {
        "test_output_path": {"type": "string"},
        "typecheck_output_path": {"type": "string"},
        "lint_output_path": {"type": "string"}
      }
    },
    "files_modified": {"type": "array", "items": {"type": "string"}},
    "summary": {"type": "string", "minLength": 20},
    "notebook_entries": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["timestamp", "actor", "iteration", "action", "outcome", "learning"],
        "properties": {
          "timestamp": {"type": "string"},
          "actor": {"enum": ["implementer", "reviewer", "orchestrator"]},
          "iteration": {"type": "integer"},
          "action": {"type": "string"},
          "outcome": {"type": "string"},
          "learning": {"type": "string"},
          "evidence_path": {"type": "string"}
        }
      }
    }
  }
}
```
