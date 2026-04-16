# US Curvature Artifact Plan

## Scope

Produce the national precomputed curvature cache that LaneShadow consumes at `data/curvature/adamfranco-us-curvature.jsonl`. The pipeline consumer does not accept raw `.osm` or `.pbf`; operators generate the artifact out-of-band and then place or sync the final JSONL cache into the canonical location.

## Chosen Workflow

1. Download state-sharded Geofabrik extracts for the US coverage set needed for the run.
2. Run the upstream `adamfranco/curvature` processor per shard and keep its native msgpack outputs as the durable intermediate.
3. Convert msgpack results into normalized GeoJSON/feature records for QA and spot-checking.
4. Flatten approved records into the LaneShadow JSONL contract:
   - one JSON object per line
   - route `name`
   - `state`
   - centroid coordinates (`centroid_lat`/`centroid_lng` or `location`)
   - numeric `curvature_score`
   - optional `source_url` or provenance URL
5. Concatenate shards, validate schema/JSONL integrity, then publish the final cache artifact.

## Required Provenance Fields

Record these alongside the published artifact release:

- upstream repo and commit/tag for `adamfranco/curvature`
- Geofabrik shard list and download dates
- source OSM/PBF versions
- msgpack conversion script version/commit
- generated timestamp in UTC
- total row count
- sha256 for the final JSONL artifact

## Storage And Runtime Expectations

- Raw Geofabrik PBF shards: large, transient operator input; do not point LaneShadow at them
- Upstream msgpack outputs: primary resumable intermediate; retain until the JSONL artifact is accepted
- GeoJSON QA exports: optional review material; can be discarded after validation
- Final LaneShadow JSONL: compact runtime artifact, expected to be copied or mounted at `data/curvature/adamfranco-us-curvature.jsonl`
- Consumer runtime target: artifact read/filter only; no national recompute inside repo execution

## Execution Phases

### Phase 1: Acquire
- Freeze the Geofabrik shard list for the run
- Download shards
- Record versions/checksums

### Phase 2: Compute
- Run upstream curvature processing shard-by-shard
- Persist msgpack outputs and per-shard logs

### Phase 3: Normalize
- Convert msgpack to GeoJSON for QA
- Convert approved records to LaneShadow JSONL
- Validate JSON parse, required fields, and numeric curvature scores

### Phase 4: Publish
- Merge shards into the final US JSONL
- Generate provenance metadata and sha256
- Place or sync the artifact to `data/curvature/adamfranco-us-curvature.jsonl`

### Phase 5: Consume
- Run `python -m scripts.curation.pipeline.sources.curvature_discovery`
- Confirm loud failure if the artifact or default exclusion catalog is missing
- Confirm staging output contains only twisties candidates not already present by deterministic `name + state`
