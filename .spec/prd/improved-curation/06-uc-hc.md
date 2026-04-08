---
stability: FEATURE_SPEC
last_validated: 2026-04-08
prd_version: 1.0.0
functional_group: HC
---

# Use Cases: Human Curation (HC)

## Use Case Summary

| ID | Title | Description |
|----|-------|-------------|
| UC-HC-01 | Create Quality Pool | Experts curate item pools for taste profiles |
| UC-HC-02 | Review Candidate Items | Experts validate algorithmically suggested items |
| UC-HC-03 | Set Quality Criteria | Define domain-specific quality standards |
| UC-HC-04 | Monitor Pool Performance | Track engagement metrics for curated pools |

---

## UC-HC-01: Create Quality Pool

**Description**: Domain experts create and manage quality pools of approved items for each taste profile, serving as the human expertise layer.

**Acceptance Criteria**:
- ☐ Experts can create pools linked to specific taste profiles
- ☐ Experts can add/remove items from pools with drag-and-drop interface
- ☐ System shows algorithmic suggestions for pool additions
- ☐ Pools have minimum (50) and maximum (500) item limits
- ☐ Pool changes are saved with audit trail (who, when, what)

---

## UC-HC-02: Review Candidate Items

**Description**: Experts validate algorithmically suggested items before they're added to quality pools, ensuring only high-quality items are recommended.

**Acceptance Criteria**:
- ☐ System presents candidate items with quality scores and similarity rationale
- ☐ Experts can approve, reject, or defer candidates
- ☐ System learns from approval patterns to improve suggestions
- ☐ Review queue is prioritized by quality score (highest first)
- ☐ Experts can bulk-approve candidates from trusted sources

---

## UC-HC-03: Set Quality Criteria

**Description**: Define domain-specific quality standards that items must meet to be recommended, capturing expert knowledge that algorithms can't easily infer.

**Acceptance Criteria**:
- ☐ Experts can define quality rules per category (e.g., "must have images", "min rating 4.0")
- ☐ Rules support boolean logic (AND, OR, NOT)
- ☐ System validates candidate items against quality rules
- ☐ Rules can be tested on sample items before activation
- ☐ Rule changes trigger re-evaluation of existing pools

---

## UC-HC-04: Monitor Pool Performance

**Description**: Track engagement metrics (skip rates, saves, shares) for curated pools to continuously improve curation quality.

**Acceptance Criteria**:
- ☐ Dashboard shows pool performance metrics (engagement rate, diversity, novelty)
- ☐ System flags underperforming pools for expert review
- ☐ Experts can drill down to individual item performance
- ☐ Performance data is available by time range (7d, 30d, 90d)
- ☐ System exports performance reports for analysis
