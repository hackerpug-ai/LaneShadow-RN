# GLM NLP Pilot Specification

**Status:** Draft  
**Created:** 2026-04-12  
**Owner:** Research Team  
**Related:** AD-002 (NLP Extraction Architecture)

## Overview

This pilot validates GLM-based NLP extraction accuracy before committing to the AD-002 architecture. The goal is to determine whether GLM models can achieve 85-95% accuracy (vs 60-75% for regex-based approaches) for road motorcycle route information extraction from forum content.

### Pilot Objective

Validate GLM-based NLP extraction for road motorcycle route information with the following targets:

- **Road mention extraction:** Precision > 80%, Recall > 70%
- **Attribute classification:** F1 > 0.70 per bucket
- **Sentiment accuracy:** > 75%
- **Overall accuracy:** > 75% (minimum threshold to proceed)

## Scope

### Dataset

- **Total samples:** 100 manually labeled forum posts
- **Sources:**
  - 50 posts from ADVRider Regional Forums
  - 50 posts from r/motorcycles subreddit
- **Time investment:** 1 week
  - 2 days: Manual labeling
  - 3 days: Implementation and prompt tuning
  - 2 days: Analysis and reporting

### Exclusions

- Non-English content
- Image/video-only posts (no text)
- Commercial/spam content
- Posts < 50 characters

## Label Schema

### Road Mentions (Span Extraction)

For each road mentioned in the post:

```json
{
  "start_char": 145,
  "end_char": 162,
  "road_name": "Blue Ridge Parkway",
  "highway_number": null,
  "state_location": "North Carolina"
}
```

### Attribute Classifications (7 Buckets)

Each road mention is classified across 7 attribute dimensions:

| Attribute | Values | Scale |
|-----------|--------|-------|
| **Twisty level** | straight, moderate, twisty, very_twisty | 1-4 |
| **Scenery quality** | urban, rural, mountain, coastal, desert | categorical |
| **Traffic level** | light, moderate, heavy | 1-3 |
| **Road condition** | excellent, good, fair, poor | 1-4 |
| **Elevation drama** | flat, rolling, mountainous | 1-3 |
| **Technical difficulty** | beginner, intermediate, advanced | 1-3 |
| **Surface type** | paved, gravel, dirt, mixed | categorical (NEW) |

### Sentiment

- **positive:** Rider recommends the road, expresses enjoyment
- **neutral:** Factual description without clear sentiment
- **negative:** Rider warns against the road, expresses frustration

### Ambiguity Flags

Mark when extraction is uncertain:

- **nickname:** Road referred to by informal name (e.g., "The Dragon," "Tail of the Dragon")
- **context-dependent:** Meaning requires external context
- **multiple_roads:** Post discusses multiple roads simultaneously

### Example Label

```json
{
  "post_id": "advrider_12345",
  "roads": [
    {
      "span": {"start": 45, "end": 62},
      "road_name": "Blue Ridge Parkway",
      "highway_number": null,
      "state_location": "NC/VA",
      "attributes": {
        "twisty_level": "moderate",
        "scenery_quality": "mountain",
        "traffic_level": "moderate",
        "road_condition": "good",
        "elevation_drama": "mountainous",
        "technical_difficulty": "intermediate",
        "surface_type": "paved"
      },
      "sentiment": "positive",
      "ambiguity_flags": ["nickname"]
    }
  ]
}
```

## GLM Prompt Design

### Base Prompt

```
Extract road motorcycle route information from this forum post.

For each road mentioned, provide:
1. Road name (or nickname)
2. Highway number (if mentioned)
3. State/location (if mentioned)
4. Surface type (paved/gravel/dirt/mixed)
5. Attributes on 1-5 scale:
   - Twistiness (1=straight, 5=very twisty)
   - Scenery quality (1=urban, 5=scenic)
   - Traffic level (1=light, 5=heavy)
   - Road condition (1=poor, 5=excellent)
   - Elevation drama (1=flat, 5=mountainous)
   - Technical difficulty (1=beginner, 5=advanced)
6. Sentiment (positive/neutral/negative)

Post: "{post_text}"

Respond in JSON format with this structure:
{
  "roads": [
    {
      "road_name": "string",
      "highway_number": "string|null",
      "state_location": "string|null",
      "surface_type": "paved|gravel|dirt|mixed",
      "twistiness": 1-5,
      "scenery": 1-5,
      "traffic": 1-5,
      "condition": 1-5,
      "elevation": 1-5,
      "difficulty": 1-5,
      "sentiment": "positive|neutral|negative"
    }
  ]
}
```

### Prompt Variants to Test

1. **Zero-shot:** Base prompt only
2. **Few-shot:** Include 3 examples in prompt
3. **Chain-of-thought:** Ask model to explain reasoning before JSON
4. **Structured schema:** Provide explicit JSON schema

## Implementation Plan

### Phase 1: Manual Labeling (Days 1-2)

**Tasks:**
- Select 50 posts from ADVRider Regional Forums
- Select 50 posts from r/motorcycles
- Create labeling interface (Airtable/Google Sheets)
- Label all 100 posts with full schema
- Calculate inter-annotator agreement (if multiple labelers)

**Deliverable:** `labeled-dataset.json` with 100 labeled posts

### Phase 2: GLM Integration (Days 3-4)

**Tasks:**
- Set up GLM API access
- Implement base prompt template
- Create evaluation pipeline
- Test prompt variants (zero-shot, few-shot, CoT)
- Measure initial accuracy
- Iteratively refine prompts based on error analysis

**Deliverable:** `glm-extractor.py` with prompt variants

### Phase 3: Execution (Day 5)

**Tasks:**
- Run extraction on all 100 labeled posts
- Capture GLM responses and latency
- Calculate costs per extraction
- Save results for analysis

**Deliverable:** `extraction-results.json`

### Phase 4: Analysis (Days 6-7)

**Tasks:**
- Calculate precision/recall/F1 for road mentions
- Calculate accuracy per attribute bucket
- Calculate sentiment accuracy
- Analyze error patterns (false positives, false negatives)
- Compare performance across prompt variants
- Generate cost analysis (per-extraction, per-1000 posts)

**Deliverable:** `pilot-analysis-report.md`

## Success Criteria

### Quantitative Metrics

| Metric | Target | Minimum |
|--------|--------|---------|
| Road mention precision | > 85% | > 80% |
| Road mention recall | > 75% | > 70% |
| Attribute F1 (per bucket) | > 0.75 | > 0.70 |
| Sentiment accuracy | > 80% | > 75% |
| Overall accuracy | > 85% | > 75% |

### Qualitative Assessment

- Error patterns are acceptable (not systematic biases)
- Cost per extraction is viable for scale
- Latency is acceptable for batch processing
- Prompt is stable and maintainable

## Decision Criteria

### Go/No-Go Framework

| Overall Accuracy | Decision | Next Steps |
|------------------|----------|------------|
| **> 85%** | ✅ Proceed | Move forward with GLM architecture per AD-002 |
| **75-85%** | ⚠️ Conditional | Proceed with prompt optimization and re-test |
| **< 75%** | ❌ Stop | Reconsider approach: fine-tuning, different model, or hybrid architecture |

### Cost Analysis

If accuracy targets are met, evaluate cost viability:

- **Target:** < $0.01 per extraction
- **Threshold:** < $0.05 per extraction
- **Projected volume:** 10,000 posts/month

If costs exceed threshold, consider:
- Hybrid approach (GLM for classification, regex for extraction)
- Batch processing with rate limiting
- Fine-tuned smaller model

## Risk Mitigation

### Known Risks

| Risk | Mitigation |
|------|------------|
| GLM API rate limits | Implement exponential backoff, batch requests |
| Inconsistent labeling | Use labeling guidelines, calculate inter-annotator agreement |
| Prompt instability | Version prompts, A/B test variants |
| Cost overruns | Set budget alerts, cache results |
| Low accuracy | Have fallback architecture ready (regex + manual review) |

## Dependencies

### Technical Requirements

- GLM API access (API key, rate limits)
- Python 3.10+ environment
- Data storage (JSON or database)
- Evaluation metrics library (scikit-learn or similar)

### Data Sources

- ADVRider Regional Forums access (scraping or API)
- Reddit API access for r/motorcycles
- Existing post corpus from CUR-008 database

## Timeline

```
Week 1:
Day 1-2: Manual labeling (100 posts)
Day 3-4: GLM integration and prompt tuning
Day 5:   Run extraction on labeled set
Day 6-7: Analysis and report generation

Milestone: Pilot completion decision by Day 7
```

## Deliverables

1. **labeled-dataset.json** - Ground truth labels for 100 posts
2. **glm-extractor.py** - Extraction implementation with prompt variants
3. **extraction-results.json** - Raw GLM outputs
4. **pilot-analysis-report.md** - Full analysis with metrics and recommendations
5. **decision-summary.md** - Go/no-go decision with rationale

## Next Steps After Pilot

### If Successful (> 85% accuracy)

- Proceed with AD-002 implementation
- Scale to full dataset (10,000+ posts)
- Integrate into CUR-008 pipeline
- Monitor production accuracy

### If Conditional (75-85% accuracy)

- Optimize prompts based on error analysis
- Test few-shot examples from errors
- Consider hybrid approach (GLM + regex)
- Re-run pilot with improvements

### If Unsuccessful (< 75% accuracy)

- Analyze failure modes
- Consider fine-tuning GLM on domain data
- Evaluate alternative models (GPT-4, Claude, etc.)
- Revisit architecture assumptions in AD-002

## Appendix

### Labeling Guidelines

- Extract exact road name spans (character-level precision)
- Use best judgment for ambiguous cases
- Flag all ambiguities (don't guess)
- Attribute scales should reflect rider sentiment, not objective facts
- Surface type is inferred from context (keywords: "gravel," "dirt," "paved," "tarmac")

### Evaluation Metrics

**Precision:** `TP / (TP + FP)` - How many extracted roads are correct  
**Recall:** `TP / (TP + FN)` - How many actual roads were found  
**F1 Score:** `2 * (Precision * Recall) / (Precision + Recall)`  
**Attribute Accuracy:** Percentage of correct attribute classifications  
**Sentiment Accuracy:** Percentage of correct sentiment predictions

### Cost Tracking

Track per-extraction costs:
- API token usage
- Compute time
- Rate limit delays
- Retry overhead

Project to monthly costs based on target volume.

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-12  
**Status:** Ready for execution
