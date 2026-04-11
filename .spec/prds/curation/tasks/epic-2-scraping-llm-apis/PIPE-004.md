# PIPE-004: LLM Extraction with Haiku + Instructor

**Task ID:** PIPE-004
**Epic:** Epic 2 - Web Scraping, LLM Extraction & Public APIs
**Assigned To:** general-purpose
**Priority:** P0
**Effort:** M
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Backlog

---

## DEPENDENCIES

- **Depends on:** PIPE-001 (Python pipeline scaffold), PIPE-002 (FHWA CSV ingestion), PIPE-003 (Community site scrapers)
- **Blocks:** PIPE-005, PIPE-006, PIPE-007, PIPE-009

---

## BACKGROUND

The LLM extraction layer takes raw scraped route data (from FHWA CSV, motorcycleroads.com, and bestbikingroads.com) and produces structured `RouteAttributes` using Claude Haiku via the Anthropic API with Instructor for deterministic output parsing. This is the text-to-structure conversion step mandated by Pipeline Principle P1 — the LLM never ranks or selects routes, it only extracts structured attributes from descriptive text.

**PRD References:**
- S2.3 (Phase 3: LLM Extraction)
- S3-QUALITY (UC-QUALITY-01)
- S9-TRD-2 (LLM Extraction Layer)
- S10-TRD AD-10 (Pipeline Principles: P1, P4, P5)
- S10-TRD Section 2 (LLM Extractor component)

**Key Constraints:**
- P1: LLM does text -> structure only, never structure -> selection
- P4: All extraction at temperature=0 with retry-on-degeneration
- P5: Deterministic parser (Instructor + Pydantic) between LLM and downstream code

---

## ACCEPTANCE CRITERIA

### AC-001: Structured Attribute Extraction
**GIVEN** a scraped route record with name, description, and source_url
**WHEN** the extraction pipeline processes it
**THEN** the system produces a validated RouteAttributes object
**AND** the object contains: scenic_score, technical_score, traffic_score, remoteness_score, condition_score, elevation_score, designation_score, community_score, season, road_surface, primary_archetype_hint, reasoning (chain-of-thought)
**AND** the output passes Pydantic schema validation

**Verify:** Process 5 known route descriptions, verify structured output matches expected attribute ranges (0.0-1.0 for scores).

### AC-002: Temperature=0 Enforcement
**GIVEN** any LLM extraction call
**WHEN** the Anthropic API is invoked
**THEN** temperature is set to exactly 0
**AND** this is enforced at the client wrapper level (not per-call)
**AND** any attempt to override temperature is logged as a warning

**Verify:** Inspect API call configuration in tests, verify temperature=0 is the default and only setting.

### AC-003: Pydantic Validation Catches Bad Output
**GIVEN** the LLM returns a response that does not match the RouteAttributes schema
**WHEN** Instructor parses the response
**THEN** a validation error is raised (not silently accepted)
**AND** the error is logged with the raw response text
**AND** a retry is attempted with the validation error as context
**AND** after max retries, the route is marked as extraction_failed

**Verify:** Mock LLM to return invalid JSON, verify error handling and retry behavior.

### AC-004: Raw Responses Logged
**GIVEN** any LLM extraction call completes (success or failure)
**WHEN** the extraction finishes
**THEN** the raw LLM response is logged to a per-batch log file
**AND** the log includes: route_id, timestamp, latency_ms, raw_response, parsed_attributes, extraction_schema_version
**AND** logs are stored in a structured format (JSONL) for auditability

**Verify:** Run extraction on 3 routes, verify log file contains all expected fields per route.

### AC-005: Resumable Extraction
**GIVEN** the extraction pipeline has partially processed a batch and is interrupted
**WHEN** the pipeline is restarted
**THEN** it reads the existing output JSONL to identify already-extracted route_ids
**AND** it skips those routes and continues from the next unextracted route
**AND** the final output contains no duplicate extractions

**Verify:** Start extraction on a batch of 10 routes, kill after 5, restart, verify all 10 routes are extracted exactly once.

---

## TEST CRITERIA

- [ ] Extraction produces structured RouteAttributes for valid input
- [ ] temperature=0 is enforced at client wrapper level
- [ ] Pydantic validation rejects malformed LLM output
- [ ] Retry-on-validation-failure works (up to 2 retries)
- [ ] Failed extractions are logged and route is marked extraction_failed
- [ ] Raw responses logged to JSONL audit file
- [ ] Resumable extraction skips already-processed routes
- [ ] Parallel extraction via ThreadPoolExecutor with max_workers=5
- [ ] extractionSchemaVersion tracked on every output record
- [ ] Reasoning field is populated before attribute fields (chain-of-thought)
- [ ] Unit tests pass: `cd scripts/curation && python -m pytest tests/test_extraction.py -v`

---

## READING LIST

- `.spec/prds/curation/09-technical-requirements.md` — Pipeline Principles P1, P4, P5; LLM Extractor component spec
- `.spec/prds/curation/10-trd-detail.md` — Section 2 (LLM Extractor), AD-10 (Pipeline Principles)
- `.spec/prds/curation/README.md` — Phase 3 implementation plan
- Instructor library: https://python.useinstructor.com
- Anthropic Python SDK: https://docs.anthropic.com/en/docs/client-sdks

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `scripts/curation/pipeline/extraction/__init__.py` (NEW)
- `scripts/curation/pipeline/extraction/extractor.py` (NEW)
- `scripts/curation/pipeline/extraction/schema.py` (NEW)
- `scripts/curation/pipeline/extraction/client.py` (NEW)
- `scripts/curation/tests/test_extraction.py` (NEW)
- `scripts/curation/requirements.txt` (MODIFY — add anthropic, instructor, pydantic)

**NEVER MODIFY:**
- `convex/` — this is a Python pipeline task
- Any file outside `scripts/curation/`
- Existing scraper files (PIPE-003 artifacts)

---

## CODE PATTERN

**Pydantic Schema (RouteAttributes):**
```python
from pydantic import BaseModel, Field
from typing import Literal
from enum import Enum

class Season(str, Enum):
    YEAR_ROUND = "year_round"
    APR_NOV = "apr_nov"
    MAY_SEP = "may_sep"
    SPRING_FALL = "spring_fall"

class RoadSurface(str, Enum):
    PAVED = "paved"
    GRAVEL = "gravel"
    DIRT = "dirt"
    MIXED = "mixed"

EXTRACTION_SCHEMA_VERSION = 1

class RouteAttributes(BaseModel):
    """Structured attributes extracted from route description text."""
    # Chain-of-thought reasoning MUST come first (improves extraction quality)
    reasoning: str = Field(
        description="Step-by-step reasoning about the route's characteristics before scoring."
    )

    # Scores (0.0 - 1.0)
    scenic_score: float = Field(ge=0.0, le=1.0, description="Visual scenery quality")
    technical_score: float = Field(ge=0.0, le=1.0, description="Technical riding challenge")
    traffic_score: float = Field(ge=0.0, le=1.0, description="Low traffic (1.0 = empty road)")
    remoteness_score: float = Field(ge=0.0, le=1.0, description="Distance from urban areas")
    condition_score: float = Field(ge=0.0, le=1.0, description="Road surface condition")
    elevation_score: float = Field(ge=0.0, le=1.0, description="Elevation gain/variety")
    designation_score: float = Field(ge=0.0, le=1.0, description="Official scenic/byway designation")
    community_score: float = Field(ge=0.0, le=1.0, description="Community/rider popularity")

    # Categorical
    season: Season = Field(description="Recommended riding season")
    road_surface: RoadSurface = Field(description="Road surface type")
    primary_archetype_hint: Literal[
        "twisties", "mountain", "coastal", "adventure",
        "scenic_byway", "desert"
    ] = Field(description="Primary ride archetype suggestion")
```

**Extraction Client (temperature=0 enforced):**
```python
import anthropic
import instructor

class ExtractionClient:
    def __init__(self, api_key: str):
        raw_client = anthropic.Anthropic(api_key=api_key)
        self.client = instructor.from_anthropic(raw_client)
        self._temperature = 0  # P4: hardcoded, never overridden

    def extract(self, route_text: str) -> RouteAttributes:
        return self.client.chat.completions.create(
            model="claude-3-5-haiku-latest",
            temperature=self._temperature,  # ALWAYS 0
            max_tokens=1024,
            response_model=RouteAttributes,
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": route_text},
            ],
        )
```

**Parallel Extraction:**
```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def extract_batch(routes: list[dict], max_workers: int = 5) -> list[dict]:
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(extract_single, route): route
            for route in routes
        }
        for future in as_completed(futures):
            route = futures[future]
            try:
                attributes = future.result()
                results.append({
                    **route,
                    "attributes": attributes.model_dump(),
                    "extraction_schema_version": EXTRACTION_SCHEMA_VERSION,
                    "extracted_at": int(time.time()),
                    "extraction_status": "success",
                })
            except Exception as e:
                results.append({
                    **route,
                    "extraction_error": str(e),
                    "extraction_status": "failed",
                })
    return results
```

---

## AGENT INSTRUCTIONS

1. Read existing `scripts/curation/pipeline/` structure from PIPE-001
2. Create `scripts/curation/pipeline/extraction/schema.py` with the Pydantic RouteAttributes model — reasoning field first, Literal types for enums, EXTRACTION_SCHEMA_VERSION constant
3. Create `scripts/curation/pipeline/extraction/client.py` with the Anthropic + Instructor wrapper — temperature=0 hardcoded at client level
4. Create `scripts/curation/pipeline/extraction/extractor.py` with batch extraction logic — ThreadPoolExecutor(max_workers=5), resumable JSONL output, raw response logging, retry-on-validation-failure (max 2 retries)
5. Write tests in `tests/test_extraction.py` — mock Anthropic API, verify schema validation, test retry logic, test resumable extraction, verify temperature=0 enforcement
6. The reasoning field must appear FIRST in the prompt output (chain-of-thought before scoring improves quality)
7. NEVER send route candidates to the LLM for ranking or selection (P1 violation)
8. NEVER use temperature > 0 (P4 violation)
9. Verify all tests pass: `cd scripts/curation && python -m pytest tests/test_extraction.py -v`

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **Pre-dispatch:** Verify PIPE-001, PIPE-002, and PIPE-003 are complete (check for pipeline scaffold, FHWA module, and scraper files)
2. **Post-completion verification:**
   ```bash
   # Verify files exist
   ls scripts/curation/pipeline/extraction/schema.py
   ls scripts/curation/pipeline/extraction/client.py
   ls scripts/curation/pipeline/extraction/extractor.py

   # Run tests
   cd scripts/curation && python -m pytest tests/test_extraction.py -v

   # Verify temperature=0 is hardcoded (grep for temperature)
   grep -n "temperature" scripts/curation/pipeline/extraction/client.py
   ```
3. **Evidence gate:** All tests pass, temperature=0 is enforced at client level, Pydantic schema validates correctly

---

## AGENT ASSIGNMENT

**Primary:** general-purpose
**Rationale:** Python pipeline task with Anthropic SDK + Instructor + Pydantic. Not Convex or React Native.

---

## EVIDENCE GATES

- [ ] Extraction module files exist and import without error
- [ ] Unit tests pass with mocked Anthropic API
- [ ] Pydantic RouteAttributes schema rejects invalid data
- [ ] temperature=0 is hardcoded in client (grep verification)
- [ ] Retry-on-validation-failure tested (max 2 retries)
- [ ] Resumable extraction tested (interrupt + resume scenario)
- [ ] extractionSchemaVersion present on all output records
- [ ] No LLM ranking or selection of routes (P1 compliance)

---

## REVIEW CRITERIA

- Pydantic schema uses Literal types (not string) for enums (P5 deterministic parsing)
- Reasoning field is first in the output schema (chain-of-thought pattern)
- ThreadPoolExecutor respects max_workers=5 limit (API rate limit compliance)
- Raw response logging includes all audit fields (route_id, timestamp, latency, raw_response)
- Extraction errors are logged but do not crash the batch (graceful degradation)
- Schema version constant is defined once and reused everywhere

---

## NOTES

- **Instructor + Pydantic is the deterministic parser** between LLM and downstream (P5). Every LLM output must pass through this validation before reaching the scoring engine.
- **Retry-on-validation-failure**: If the first extraction fails Pydantic validation, retry with the validation error appended to the prompt. After 2 retries, mark the route as extraction_failed and continue.
- **Parallel workers**: max_workers=5 balances throughput against API rate limits. Adjust if hitting Anthropic rate limits.
- **extractionSchemaVersion**: Bump this when the Pydantic schema or prompt changes. Downstream code uses this to decide whether to re-extract batches.
- **The LLM is NEVER given route candidates to rank or select** — this is a P1 hard constraint. The LLM only receives a single route's descriptive text and returns structured attributes.
