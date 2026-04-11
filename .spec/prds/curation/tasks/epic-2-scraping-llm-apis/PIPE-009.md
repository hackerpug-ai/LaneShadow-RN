# PIPE-009: Calibration Gate

**Task ID:** PIPE-009
**Epic:** Epic 2 - Web Scraping, LLM Extraction & Public APIs
**Assigned To:** general-purpose
**Priority:** P0
**Effort:** M
**Estimate:** 180 min
**Type:** [FEATURE]
**Status:** Backlog

---

## DEPENDENCIES

- **Depends on:** PIPE-001 (Python pipeline scaffold), PIPE-004 (LLM extraction)
- **PRD References:** S4.7 (Calibration), S9-TRD-3 (Calibration Step), S10-TRD AD-12 (Calibration is a hard gate)

---

## BACKGROUND

The calibration gate is a mandatory checkpoint between LLM extraction and full-catalog scoring. Before running composite scoring over 17k+ routes, the pipeline must validate that its scoring weights produce rankings that correlate with editorial ground truth (Rider Magazine Top 50 + FHWA Scenic Byways). This is Pipeline Principle P3: composite-score weights are calibrated against ground truth before full-catalog extraction runs. Full-batch extraction does not run until calibration passes and the fit report is committed alongside the code.

**PRD References:**
- S4.7 (Calibration)
- S9-TRD-3 (Calibration Step)
- S10-TRD AD-12 (Calibration is a hard gate on Phase 3)
- S10-TRD Section 3 (Scoring Engine — weights from calibration, not hand-tuned)

**Key Constraints:**
- P3: Composite-score weights are calibrated against editorial ground truth before full extraction
- P5: Deterministic scoring formula — same input always produces same output
- AD-12: Calibration is a hard gate — full extraction does not proceed until it passes

---

## ACCEPTANCE CRITERIA

### AC-001: Calibration Runs Before Full Extraction
**GIVEN** a set of extracted routes with RouteAttributes and editorial ground truth labels
**WHEN** the calibration gate is invoked
**THEN** it runs BEFORE any full-catalog scoring or extraction
**AND** it uses a minimum sample of 20 routes from the ground truth set
**AND** it computes Spearman rank correlation between pipeline scores and editorial rankings

**Verify:** Run calibration with a test ground truth set, verify it executes before any scoring of the full catalog.

### AC-002: Spearman Rho Correlation Computed
**GIVEN** pipeline-computed composite scores and editorial ground truth rankings
**WHEN** the calibration computes correlation
**THEN** Spearman rho is calculated between the two ranking sets
**AND** a configurable threshold (default: 0.6) is compared against the computed rho
**AND** the result is reported as PASS (rho >= threshold) or FAIL (rho < threshold)

**Verify:** Run calibration with known scores, verify Spearman rho calculation matches manual computation.

### AC-003: Gate Halts on Failing Calibration
**GIVEN** the calibration gate computes a correlation below the threshold
**WHEN** the gate evaluates the result
**THEN** it halts the pipeline with a clear error message
**AND** it reports: computed rho, threshold, sample size, top-10 recovery rate, per-feature sensitivity analysis
**AND** it does NOT proceed to full-catalog extraction

**Verify:** Set threshold to an unreasonably high value (e.g., 0.99), verify the gate halts and reports detailed diagnostics.

### AC-004: Configurable Threshold
**GIVEN** the calibration gate configuration
**WHEN** a threshold value is specified
**THEN** the gate uses that value for the pass/fail decision
**AND** the default threshold is 0.6 (Spearman rho)
**AND** the threshold is loaded from environment variable or config file

**Verify:** Set threshold via environment variable, verify the gate uses the custom value.

### AC-005: Fit Report Generated
**GIVEN** the calibration gate completes (pass or fail)
**WHEN** the fit report is generated
**THEN** it includes: weights used, Spearman rho, sample size, top-10 recovery rate, per-feature sensitivity, residual distribution, timestamp
**AND** the report is written to a JSON file in the output directory
**AND** the report is printed to stdout for immediate visibility

**Verify:** Run calibration, verify the fit report JSON file contains all required fields.

---

## TEST CRITERIA

- [ ] Calibration requires minimum 20 sample routes from ground truth
- [ ] Spearman rho is computed correctly (verified against manual calculation)
- [ ] Gate halts pipeline when rho < threshold
- [ ] Gate allows pipeline to proceed when rho >= threshold
- [ ] Threshold is configurable via environment variable (default: 0.6)
- [ ] Fit report JSON contains all required fields (weights, rho, sample_size, recovery_rate, sensitivity, residuals, timestamp)
- [ ] Top-10 recovery rate is computed (how many editorial top-10 appear in pipeline top-10)
- [ ] Per-feature sensitivity analysis shows which features contribute most to correlation
- [ ] Auto-approve is NOT possible when calibration fails
- [ ] Unit tests pass: `cd scripts/curation && python -m pytest tests/test_calibration.py -v`

---

## READING LIST

- `.spec/prds/curation/09-technical-requirements.md` — P3 (Calibration), Calibration Step component spec
- `.spec/prds/curation/10-trd-detail.md` — AD-12 (Calibration is a hard gate), Section 3 (Scoring Engine)
- `.spec/prds/curation/README.md` — Phase 3 calibration step
- scipy.stats.spearmanr: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.spearmanr.html

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `scripts/curation/pipeline/extraction/calibration.py` (NEW)
- `scripts/curation/pipeline/extraction/ground_truth.py` (NEW)
- `scripts/curation/tests/test_calibration.py` (NEW)
- `scripts/curation/requirements.txt` (MODIFY — add scipy)

**NEVER MODIFY:**
- `convex/` — this is a Python pipeline task
- Any file outside `scripts/curation/`
- Existing extraction files (PIPE-004 artifacts) — only ADD calibration.py to the same directory

---

## CODE PATTERN

**Calibration Gate:**
```python
from scipy import stats
import json
from pathlib import Path

DEFAULT_CALIBRATION_THRESHOLD = 0.6  # Spearman rho
MIN_SAMPLE_SIZE = 20

class CalibrationResult:
    def __init__(
        self,
        rho: float,
        p_value: float,
        sample_size: int,
        top10_recovery_rate: float,
        weights: dict[str, float],
        sensitivity: dict[str, float],
        threshold: float,
        passed: bool,
    ):
        self.rho = rho
        self.p_value = p_value
        self.sample_size = sample_size
        self.top10_recovery_rate = top10_recovery_rate
        self.weights = weights
        self.sensitivity = sensitivity
        self.threshold = threshold
        self.passed = passed

    def to_report(self) -> dict:
        return {
            "timestamp": int(time.time()),
            "passed": self.passed,
            "spearman_rho": self.rho,
            "p_value": self.p_value,
            "threshold": self.threshold,
            "sample_size": self.sample_size,
            "top10_recovery_rate": self.top10_recovery_rate,
            "weights": self.weights,
            "per_feature_sensitivity": self.sensitivity,
        }

def run_calibration(
    ground_truth: list[dict],
    pipeline_scores: list[float],
    weights: dict[str, float],
    threshold: float = DEFAULT_CALIBRATION_THRESHOLD,
) -> CalibrationResult:
    assert len(ground_truth) >= MIN_SAMPLE_SIZE, (
        f"Calibration requires >= {MIN_SAMPLE_SIZE} samples, got {len(ground_truth)}"
    )

    # Compute Spearman rank correlation
    editorial_ranks = [gt["editorial_rank"] for gt in ground_truth]
    rho, p_value = stats.spearmanr(editorial_ranks, pipeline_scores)

    # Compute top-10 recovery rate
    editorial_top10 = set(
        r["route_id"] for r in sorted(ground_truth, key=lambda x: x["editorial_rank"])[:10]
    )
    pipeline_top10 = set(
        r["route_id"] for r in sorted(
            zip(ground_truth, pipeline_scores),
            key=lambda x: x[1],
            reverse=True,
        )[:10]
    )
    recovery_rate = len(editorial_top10 & pipeline_top10) / 10.0

    # Per-feature sensitivity (leave-one-out)
    sensitivity = {}
    for feature in weights:
        reduced_weights = {k: v for k, v in weights.items() if k != feature}
        # Recompute scores without this feature, measure rho drop
        sensitivity[feature] = _compute_sensitivity_drop(
            ground_truth, reduced_weights, rho
        )

    return CalibrationResult(
        rho=float(rho),
        p_value=float(p_value),
        sample_size=len(ground_truth),
        top10_recovery_rate=recovery_rate,
        weights=weights,
        sensitivity=sensitivity,
        threshold=threshold,
        passed=rho >= threshold,
    )
```

**Ground Truth Loader:**
```python
def load_ground_truth(path: Path) -> list[dict]:
    """Load editorial ground truth (Rider Magazine Top 50 + FHWA Scenic Byways)."""
    records = []
    with open(path) as f:
        for line in f:
            record = json.loads(line)
            records.append({
                "route_id": record["route_id"],
                "name": record["name"],
                "editorial_rank": record["editorial_rank"],
                "source": record["source"],  # "rider_mag" | "fhwa_scenic"
            })
    assert len(records) >= MIN_SAMPLE_SIZE
    return records
```

---

## AGENT INSTRUCTIONS

1. Read existing extraction module from PIPE-004 to understand RouteAttributes schema and scoring
2. Create `scripts/curation/pipeline/extraction/calibration.py` with CalibrationGate class, Spearman rho computation, top-10 recovery rate, per-feature sensitivity analysis
3. Create `scripts/curation/pipeline/extraction/ground_truth.py` with loader for editorial ground truth data (Rider Magazine Top 50 + FHWA Scenic Byways)
4. Create a sample ground truth JSONL file for testing (20+ routes with editorial_rank)
5. Write tests in `tests/test_calibration.py` — test Spearman computation, test gate pass/fail, test configurable threshold, test minimum sample enforcement, test fit report generation
6. The calibration gate MUST halt the pipeline when it fails — this is NOT a warning, it is a hard stop
7. NEVER auto-approve a failing calibration — the operator must investigate and fix weights/schema
8. Verify all tests pass: `cd scripts/curation && python -m pytest tests/test_calibration.py -v`

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **Pre-dispatch:** Verify PIPE-001 and PIPE-004 are complete (pipeline scaffold and extraction module exist)
2. **Post-completion verification:**
   ```bash
   # Verify files exist
   ls scripts/curation/pipeline/extraction/calibration.py
   ls scripts/curation/pipeline/extraction/ground_truth.py

   # Run tests
   cd scripts/curation && python -m pytest tests/test_calibration.py -v

   # Verify threshold is configurable
   CALIBRATION_THRESHOLD=0.8 python -m pytest tests/test_calibration.py -v
   ```
3. **Evidence gate:** All tests pass, calibration halts on failure, fit report JSON generated correctly

---

## AGENT ASSIGNMENT

**Primary:** general-purpose
**Rationale:** Python pipeline task with scipy statistical analysis. Not Convex or React Native.

---

## EVIDENCE GATES

- [ ] Calibration module exists and imports without error
- [ ] Unit tests pass with mocked ground truth data
- [ ] Spearman rho computation verified against manual calculation
- [ ] Gate halts pipeline when rho < threshold (tested with high threshold)
- [ ] Gate passes when rho >= threshold (tested with low threshold)
- [ ] Minimum sample size (20) enforced
- [ ] Fit report JSON contains all required fields
- [ ] No auto-approve path when calibration fails

---

## REVIEW CRITERIA

- Spearman rho is computed using scipy.stats.spearmanr (not custom implementation)
- Top-10 recovery rate is a meaningful metric (intersection of editorial vs pipeline top-10)
- Per-feature sensitivity helps operators understand which features drive correlation
- Threshold is configurable but has a sensible default (0.6)
- The gate is a hard gate — there is no `--skip-calibration` flag or auto-approve path
- Fit report is both written to file AND printed to stdout for immediate visibility

---

## NOTES

- **Rider Magazine Top 50** is the primary editorial ground truth. This is a curated list of the 50 best motorcycle roads in the US, ranked by editorial staff.
- **FHWA Scenic Byways** provide additional ground truth for scenic quality specifically.
- **Minimum sample size of 20** ensures statistical validity of Spearman rho. If fewer ground truth routes have been extracted, the gate fails with a clear message.
- **Spearman rho** (not Pearson) is used because we care about rank correlation, not linear correlation. The editorial rankings are ordinal.
- **Threshold of 0.6** is the default but may need adjustment based on initial calibration runs. The key is that the threshold is explicit and configurable.
- **This gate is the P3 hard constraint.** Without it, we would be running expensive full-catalog extraction with unvalidated weights, risking the need to re-score everything.
