"""Route geometry enrichment for the curation pipeline.

Provides per-source geometry fetchers and a pipeline stage to backfill
all routes with lat/lng waypoints, centroids, and bounding boxes.

Pipeline stage order: ingest → extract → geocode → push → embed
"""
