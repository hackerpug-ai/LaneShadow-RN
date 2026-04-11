# LaneShadow Curation Pipeline

Python pipeline for ingesting, scoring, and classifying motorcycle route data from multiple sources (FHWA, motorcycle road websites, BDRs) and syncing enriched records to Convex.

## Directory Structure

```
scripts/curation/
├── pipeline/
│   ├── sources/         # Data ingestion modules (FHWA CSV, website scrapers)
│   ├── scoring/         # Composite scoring engine
│   ├── classification/  # Archetype classifier
│   ├── sync/            # Convex batch upsert
│   └── models.py        # Shared dataclasses (Route, EnrichedRoute)
├── tests/               # Pytest test suite
├── pyproject.toml       # Package configuration
├── requirements.txt     # Production dependencies
└── requirements-dev.txt # Test dependencies
```

## Installation

```bash
cd scripts/curation
pip install -r requirements-dev.txt
```

## Running Tests

```bash
cd scripts/curation
python -m pytest
```

With coverage:

```bash
python -m pytest --cov=pipeline --cov-report=html
```

## Running the Pipeline

(Placeholder — `main.py` is a future task)

```bash
python -m pipeline.main
```

## Data Models

- **Route**: Raw route data from ingestion sources (FHWA, motorcycleroads.com, etc.)
- **EnrichedRoute**: Route with computed scores (curvature, scenic, technical, traffic, remoteness) and classification (primary_archetype, secondary_tags, one_liner, summary, badges)

Both models are defined in `pipeline/models.py` using stdlib dataclasses (no Pydantic dependency required).

## Phase 1 Scope

Seed data pipeline:
1. FHWA CSV ingestion (PIPE-002)
2. Composite scoring engine (PIPE-007)
3. Archetype classifier (PIPE-008)
4. Convex batch upsert (PIPE-005)
