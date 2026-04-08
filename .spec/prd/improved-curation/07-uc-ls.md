---
stability: FEATURE_SPEC
last_validated: 2026-04-08
prd_version: 1.0.0
functional_group: LS
---

# Use Cases: LLM Service (LS)

## Use Case Summary

| ID | Title | Description |
|----|-------|-------------|
| UC-LS-01 | Generate Recommendations | Produce quality-gated recommendations for end users |
| UC-LS-02 | Incorporate Feedback | Learn from explicit user feedback |
| UC-LS-03 | Explain Recommendations | Provide reasoning for why items were recommended |

---

## UC-LS-01: Generate Recommendations

**Description**: Produce personalized recommendations for end users using a quality-gated pipeline that only retrieves from approved pools.

**Acceptance Criteria**:
- ☐ API accepts recommendation request with taste profile or user context
- ☐ System retrieves candidates from approved quality pools only
- ☐ System filters candidates by quality threshold (default 70)
- ☐ LLM generates final recommendations from top candidates
- ☐ Response includes 5-20 recommendations with relevance scores
- ☐ API response time is < 2 seconds for 95th percentile

---

## UC-LS-02: Incorporate Feedback

**Description**: Learn from explicit user feedback (helpful/not helpful) to continuously improve recommendation quality.

**Acceptance Criteria**:
- ☐ API accepts feedback signals (helpful, not_helpful, skip, save)
- ☐ System adjusts quality scores for items based on feedback
- ☐ Feedback is aggregated by taste profile and item
- ☐ System re-ranks pools weekly based on feedback patterns
- ☐ Feedback data is retained for 90 days

---

## UC-LS-03: Explain Recommendations

**Description**: Provide explainable reasoning for why items were recommended using knowledge graph paths and quality signals.

**Acceptance Criteria**:
- ☐ API returns explanation for each recommended item
- ☐ Explanations include: similarity to user context, quality score, profile match
- ☐ System uses knowledge graph for "because you liked X" explanations
- ☐ Explanations are human-readable and concise (< 100 chars)
- ☐ Explanation detail level is configurable (brief, standard, detailed)
