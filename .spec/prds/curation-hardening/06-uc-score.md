---
stability: FEATURE_SPEC
last_validated: 2026-04-12
prd_version: 1.0.0
functional_group: SCORE
---

# Use Cases: Scoring & Calibration (SCORE)

| UC ID | Title | Description |
|-------|-------|-------------|
| UC-SCORE-01 | Realign Composite Score Weights | Administrator updates scoring formula to match research-derived weights |
| UC-SCORE-02 | Build and Validate Ground Truth Calibration Set | Administrator builds labeled dataset of 50-100 routes with verified attributes |
| UC-SCORE-03 | Enforce Calibration Gate Before Full Pipeline Run | Pipeline enforces 80% agreement threshold before full-batch extraction |
| UC-SCORE-04 | Validate Haiku Extraction Accuracy | Administrator measures extraction accuracy per attribute against ground truth |

---

## UC-SCORE-01: Realign Composite Score Weights

**Description:** Administrator updates the composite scoring formula to reflect research-derived weight changes. Community rating increases from 5% to 15%, a new mention_frequency signal is added at 10%, and lower-signal weights are reduced to compensate.

**Acceptance Criteria:**
- ☐ Administrator can update scoring weights via configuration file (not code change)
- ☐ System applies updated weight distribution: curviness 20% (was 25%), scenery 15% (unchanged), traffic 10% (was 15%), road_condition 10% (unchanged), elevation_drama 10% (unchanged), fhwa_designation 5% (was 10%), community_rating 15% (was 5%), mention_frequency 10% (new), remoteness 5% (unchanged)
- ☐ System validates all weights sum to 100%
- ☐ System handles routes with null mention_frequency by using 0.0 default (no boost penalty)
- ☐ System re-scores all existing routes when weights change
- ☐ System logs before/after score distributions to detect unintended shifts
- ☐ System produces a weight change impact report: top 10 routes that gained most, top 10 that dropped most

---

## UC-SCORE-02: Build and Validate Ground Truth Calibration Set

**Description:** Administrator builds a labeled ground truth set of 50-100 routes with manually verified attributes. This set is the calibration anchor — if the pipeline cannot correctly score these known-good routes, it cannot be trusted on the long tail.

**Acceptance Criteria:**
- ☐ Administrator can define ground truth set via JSON file listing route name, state, expected archetype, expected score range, and attribute overrides
- ☐ System includes Rider Magazine 50 Best routes (from UC-SRC-06) in ground truth set
- ☐ System includes FHWA All-American Roads (subset of Scenic Byways) in ground truth set
- ☐ System includes manually added known routes: Tail of the Dragon (NC/TN), Pacific Coast Highway (CA), Beartooth Highway (MT/WY), Blue Ridge Parkway (NC/VA), Million Dollar Highway (CO)
- ☐ System compares pipeline-computed composite score against expected score range for each ground truth route
- ☐ System flags routes where computed score deviates more than 2.0 points from expected range
- ☐ System reports ground truth alignment percentage: routes within expected range vs. total ground truth routes
- ☐ System logs per-route calibration detail: expected vs. actual score, component breakdown

---

## UC-SCORE-03: Enforce Calibration Gate Before Full Pipeline Run

**Description:** Pipeline enforces a calibration gate: before running extraction and scoring on the full 17k+ route batch, the ground truth set must pass an 80% agreement threshold. This prevents wasting $34+ on a batch run that produces miscalibrated scores.

**Acceptance Criteria:**
- ☐ Administrator can run calibration gate via `python -m pipeline.scoring.calibration_gate`
- ☐ System runs the full extraction + scoring pipeline on ground truth routes only (50-100 routes)
- ☐ System measures per-attribute agreement: for each extracted attribute (curviness, scenery_type, traffic_level, etc.), percentage matching the ground truth label
- ☐ System measures composite score agreement: percentage of ground truth routes where computed score falls within expected range
- ☐ System requires 80% per-attribute agreement threshold to pass
- ☐ System requires 80% composite score agreement threshold to pass
- ☐ System outputs PASS/FAIL verdict with detailed per-attribute and per-route breakdown
- ☐ System blocks full batch run (exits with error code) if calibration gate fails
- ☐ System logs calibration results for historical trend tracking
- ☐ Administrator can override gate failure with explicit `--force` flag and documented justification

---

## UC-SCORE-04: Validate Haiku Extraction Accuracy

**Description:** Administrator runs an extraction accuracy audit comparing Haiku's attribute extraction against the manually labeled ground truth set. This measures whether Haiku is correctly reading route descriptions — independent of whether the scoring formula weights are correct.

**Acceptance Criteria:**
- ☐ Administrator can run extraction audit via `python -m pipeline.scoring.extraction_audit`
- ☐ System runs Haiku extraction on all ground truth route descriptions
- ☐ System compares each extracted attribute against ground truth label
- ☐ System computes per-attribute precision, recall, and F1 score
- ☐ System computes overall extraction accuracy (correct attributes / total attributes)
- ☐ System produces confusion matrix per categorical attribute (e.g., curviness: straight/moderate/twisty/very_twisty)
- ☐ System flags attributes with F1 below 0.7 as "needs prompt improvement"
- ☐ System outputs audit report as structured JSON and human-readable markdown
- ☐ System stores audit results for longitudinal comparison across prompt versions
