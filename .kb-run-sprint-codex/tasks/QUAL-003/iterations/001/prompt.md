# Implementer Task — QUAL-003: Quality Floor Filter

You are the **IMPLEMENTER** for task **QUAL-003**.

You are a **python-implement** agent. Write Python code following best practices with TDD discipline — write tests first, then implement to make them pass.

You may write Python source code, tests, and configuration files. You may run pytest, ruff, and other tools. You may read any file in the repository for context. Create git commits on your worktree branch.

You may NOT modify files outside your WRITE-ALLOWED list or disable pre-commit hooks.

## Worktree

- **Path:** /Users/justinrich/Projects/LaneShadow/.kb-run-sprint-codex/worktrees/QUAL-003
- **Branch:** codex/QUAL-003
- **Parent repo:** /Users/justinrich/Projects/LaneShadow
- **Iteration:** 1

## Your Task

**QUAL-003: Quality Floor Filter (premium/standard/minimal)**

### GOAL

Read reconciled curated_routes post-dedup, compute a qualityTier (premium/standard/minimal) for each route based on field completeness with a government-source allowlist, write the tier back to Convex, and log tier distribution counts.

### DELIVERABLE

- scripts/curation/pipeline/quality/__init__.py (NEW): package init exposing FloorFilter
- scripts/curation/pipeline/quality/floor_filter.py (NEW): FloorFilter class with run(), _compute_tier(), _is_government_source(), _log_distribution(), main()
- scripts/curation/tests/test_qual_003.py (NEW): pytest suite covering all ACs

### ACCEPTANCE CRITERIA

**AC-1: All four completeness fields present yields premium**
- GIVEN: route with description > 100 chars, community_rating=4.5, designation='US Scenic Byways', curvatureScore=1.8, source='BBR'
- WHEN: _compute_tier() called
- THEN: Returns 'premium'
- Test: test_all_fields_present_yields_premium

**AC-2: At least one completeness field yields standard**
- GIVEN: route with description='Short', community_rating=None, designation=None, curvatureScore=1.2
- WHEN: _compute_tier() called
- THEN: Returns 'standard'
- Test: test_one_field_present_yields_standard

**AC-3: Zero completeness fields yields minimal for non-government source**
- GIVEN: route with description='Short', community_rating=None, designation=None, curvatureScore=None, source='curvature_discovery'
- WHEN: _compute_tier() called
- THEN: Returns 'minimal'
- Test: test_no_fields_yields_minimal

**AC-4: Government source allowlist prevents minimal**
- GIVEN: route with zero completeness fields, sourceRefs containing 'FHWA'
- WHEN: _compute_tier() called
- THEN: Returns 'standard'
- Test: test_government_source_allowlist_prevents_minimal

**AC-5: Tier distribution report written**
- GIVEN: 6 routes (2 premium, 3 standard, 1 minimal)
- WHEN: run() completes
- THEN: quality_floor_report.json has {premium:2, standard:3, minimal:1, total:6}
- Test: test_tier_distribution_report_written

**AC-6: Empty string and zero treated as not-present**
- GIVEN: route with description='', community_rating=0, designation='', curvatureScore=0, source='BBR'
- WHEN: _compute_tier() called
- THEN: Returns 'minimal'
- Test: test_empty_and_zero_treated_as_not_present

### CRITICAL CONSTRAINTS

- At-least-one-of rule: description>100 OR community_rating OR FHWA designation OR curvatureScore → standard; all four → premium
- Government allowlist runs BEFORE completeness check — FHWA/Scenic Byways sources never get 'minimal'
- Handle None, empty string, and 0 as not-present
- Write qualityTier back to every route in Convex
- Log distribution to quality_floor_report.json
- Phase 1 is soft-floor only — no routes deleted or rejected
- sourceRefs is a list; _is_government_source() checks for 'FHWA' or 'Scenic Byways' (exact match, case-sensitive)

### READING LIST

1. scripts/curation/pipeline/dedup/semantic_deduplicator.py — Main() pattern, cost ledger
2. scripts/curation/pipeline/sync/convex_push.py — Convex HTTP POST pattern
3. scripts/curation/tests/test_qual_001.py — responses library mock pattern
4. scripts/curation/pipeline/models.py — Route dataclass fields

### WRITE-ALLOWED

- scripts/curation/pipeline/quality/__init__.py
- scripts/curation/pipeline/quality/floor_filter.py
- scripts/curation/tests/test_qual_003.py
- scripts/curation/data/reports/quality_floor_report.json

### WRITE-PROHIBITED

- server/convex/**
- scripts/curation/pipeline/dedup/**
- scripts/curation/pipeline/embed/**
- scripts/curation/pipeline/models.py
- scripts/curation/data/arbitration/**

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
