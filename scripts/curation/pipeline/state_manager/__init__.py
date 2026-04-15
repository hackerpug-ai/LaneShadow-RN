"""Pipeline state manager for curation data load.

Provides idempotent, resumable, auditable pipeline execution for all
three staging sources (motorcycleroads, bestbikingroads, fhwa).

Usage:
    python -m scripts.curation.pipeline.state_manager <command> [options]

Subcommands:
    status          Show per-stage counts and cumulative cost
    ingest          Load staging JSONL into state table
    extract         Run LLM extraction on pending routes
    push            Push extracted routes to Convex
    embed           Embed all pushed routes
    quality-report  Write markdown quality report
    wipe-test-seeds Delete editorial test seeds from Convex
    reset           Clear stage timestamps for re-run
"""
