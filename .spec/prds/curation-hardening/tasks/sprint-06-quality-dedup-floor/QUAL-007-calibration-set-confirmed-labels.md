# QUAL-007: Calibration Set with Minimum Count Enforcement

**Task ID:** QUAL-007
**Sprint:** [sprint-06 — Quality Infrastructure (Semantic Dedup & Floor)](SPRINT.md)
**Assigned To:** python-implement
**Reviewer:** python-review
**Review Mode:** SINGLE
**Status:** Backlog
**Priority:** P1
**Effort:** S
**Estimate:** 45 min
**Type:** FEATURE
**PRD Refs:** UC-QUAL-01
**Depends on:** QUAL-001  |  **Blocks:** Sprint-7 threshold tuning

---

## GOAL

Fix the calibration set to enforce minimum counts (>= 50 positives, >= 50 negatives) and add a `label_source` field distinguishing auto-derived labels from future human-confirmed ones.

## BACKGROUND

The red-hat review (2026-04-20) found that QUAL-001's `emit_calibration_set()` populates `positives` and `negatives` from cosine classification alone. The spec requires "at minimum 50 confirmed positives, 50 confirmed negatives." The current code:
- Auto-assigns `"label": "duplicate"` for cosine > 0.92 pairs (line 133)
- Auto-assigns `"label": "non-duplicate"` for cosine < 0.75 pairs (line 139)
- Has no enforcement of minimum counts
- Has no mechanism to distinguish auto-derived labels from human-confirmed ones

The threshold-derived labels ARE useful for bootstrapping, but the spec's intent is that the calibration set eventually supports human review. The fix is: keep the auto-derivation, add a `label_source` field, enforce minimum counts, and emit a warning if the catalog is too small to meet minimums.

## DELIVERABLE

- scripts/curation/pipeline/dedup/semantic_deduplicator.py (MODIFY): add minimum count enforcement and `label_source` to calibration entries
- scripts/curation/tests/test_qual_007.py (NEW): tests for calibration set enforcement

## DONE WHEN

- [ ] Each calibration entry has a `label_source` field: `"auto_cosine"` for threshold-derived labels
- [ ] `emit_calibration_set()` logs a WARNING if `len(positives) < 50` or `len(negatives) < 50`
- [ ] The JSON file is still written even when counts are below minimum (no error raised)
- [ ] The calibration JSON schema includes a `metadata` section with `min_positives: 50`, `min_negatives: 50`, `meets_minimum: bool`
- [ ] Existing `test_calibration_set_emitted` in test_qual_001.py still passes
- [ ] `cd scripts/curation && python -m pytest tests/test_qual_007.py -v` passes
- [ ] Only WRITE-ALLOWED files modified

## OUT OF SCOPE

- Building a human review workflow — the `label_source` field is the integration point for future tooling
- Changing the auto-merge or arbitration thresholds
- Adding confirmed labels from an external source (that's a future manual process)

## CRITICAL CONSTRAINTS

**MUST:**
- Add `label_source: "auto_cosine"` to every calibration entry (both positives and negatives)
- Log `WARNING` level message if either list is below 50 entries
- Include `metadata` dict in the calibration JSON with `min_positives`, `min_negatives`, `meets_minimum` keys
- Write the file regardless of whether minimums are met (soft enforcement, not hard failure)

**NEVER:**
- Raise an exception or return non-zero exit code if minimums are not met — this is diagnostic, not a gate
- Remove or change existing fields (`runId`, `generatedAt`, `positives`, `negatives`) — that would break QUAL-002's consumer contract
- Fabricate calibration entries to meet the 50 minimum — if the catalog only has 10 pairs, emit 10, log the warning

**STRICTLY:**
- The minimum count constants (50) must be class-level attributes on `SemanticDeduplicator` so they're visible in the task spec and adjustable for threshold tuning

## SPECIFICATION

**Objective:** Add minimum count enforcement and label provenance to the calibration set emitted by `emit_calibration_set()`.

**Success state:** Running dedup on a catalog produces `dedup_calibration_set.json` with `metadata.meets_minimum` reflecting whether the catalog was large enough to produce 50+ auto-derived positives and negatives. A WARNING is logged if not.

## ACCEPTANCE CRITERIA (TDD Beads)

### 1: Label source field added to entries

**GIVEN:** A dedup run that produces 2 auto-merged pairs (cosine > 0.92)
**WHEN:** `emit_calibration_set()` is called
**THEN:** Each positive entry contains `"label_source": "auto_cosine"` alongside existing fields

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_007.py::test_label_source_in_entries -v`

### 2: Warning logged when below minimum

**GIVEN:** A dedup run with only 10 positive pairs and 8 negative pairs
**WHEN:** `emit_calibration_set()` is called
**THEN:** A WARNING log message containing "calibration set below minimum" is emitted; the file is still written successfully

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_007.py::test_warning_on_below_minimum -v`

### 3: Metadata reflects minimum compliance

**GIVEN:** A dedup run with 60 positive pairs and 55 negative pairs
**WHEN:** `emit_calibration_set()` is called
**THEN:** The JSON contains `metadata.meets_minimum: true`; no WARNING is logged

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_007.py::test_metadata_meets_minimum -v`

### 4: Existing tests unbroken

**GIVEN:** The existing `test_calibration_set_emitted` test in test_qual_001.py
**WHEN:** The test suite is run
**THEN:** The test still passes without modification

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_001.py::test_calibration_set_emitted -v`

## TEST CRITERIA

1. Every calibration entry has `label_source` equal to `"auto_cosine"`
2. WARNING is logged when positives < 50 or negatives < 50
3. No WARNING when both >= 50
4. `metadata.meets_minimum` is `true` when both counts >= 50, `false` otherwise
5. The JSON file is written and valid regardless of minimum compliance
6. Existing test_qual_001.py tests still pass

## READING LIST

- `scripts/curation/pipeline/dedup/semantic_deduplicator.py` (lines: 133, 139, 204-213) — current calibration logic
- `scripts/curation/tests/test_qual_001.py` (lines: ~330-350) — existing calibration test to not break

## GUARDRAILS

### WRITE-ALLOWED
- scripts/curation/pipeline/dedup/semantic_deduplicator.py (MODIFY)
- scripts/curation/tests/test_qual_007.py (NEW)

### WRITE-PROHIBITED
- scripts/curation/tests/test_qual_001.py — must still pass, do not modify
- scripts/curation/data/calibration/dedup_calibration_set.json — output file, not source
- server/convex/** — backend schema is frozen

## DESIGN

**Pattern:** Add class constants and enhance the existing `emit_calibration_set` method.

```python
class SemanticDeduplicator:
    CALIBRATION_MIN_POSITIVES = 50
    CALIBRATION_MIN_NEGATIVES = 50

    def emit_calibration_set(self) -> None:
        meets_minimum = (
            len(self._calibration_positives) >= self.CALIBRATION_MIN_POSITIVES
            and len(self._calibration_negatives) >= self.CALIBRATION_MIN_NEGATIVES
        )
        if not meets_minimum:
            logger.warning(
                "calibration set below minimum: %d/%d positives, %d/%d negatives",
                len(self._calibration_positives), self.CALIBRATION_MIN_POSITIVES,
                len(self._calibration_negatives), self.CALIBRATION_MIN_NEGATIVES,
            )
        payload = {
            "runId": self.run_id,
            "generatedAt": _utc_now_iso(),
            "metadata": {
                "min_positives": self.CALIBRATION_MIN_POSITIVES,
                "min_negatives": self.CALIBRATION_MIN_NEGATIVES,
                "meets_minimum": meets_minimum,
            },
            "positives": self._calibration_positives,
            "negatives": self._calibration_negatives,
        }
        # ... write file
```

**Anti-pattern:** Do NOT add synthetic/fabricated pairs to pad the calibration set. If the catalog only has 10 duplicate pairs, emit 10 and log the warning.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| New Tests Pass | `cd scripts/curation && python -m pytest tests/test_qual_007.py -v` | Exit 0 |
| Existing Tests Pass | `cd scripts/curation && python -m pytest tests/test_qual_001.py -v` | Exit 0 |
| Full Suite Pass | `cd scripts/curation && python -m pytest tests/test_qual_*.py -v` | Exit 0 |
| Scope Compliance | `git diff --name-only` | Only WRITE-ALLOWED files modified |

## AGENT ASSIGNMENT

**Implementation agent:** `python-implement`
**Rationale:** Small Python modification to existing module.

**Review agent:** `python-review`

## CODING STANDARDS

- `brain/docs/kanban/TASK-TEMPLATE.md (v5.0)`
- `brain/docs/TDD-METHODOLOGY.md`

## DEPENDENCIES

**Depends on:** QUAL-001 (code exists to modify)

**Blocks:** Sprint-7 threshold tuning (calibration set is the input)
