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

## Production Storage Plan

- Use Convex File Storage as the object-storage layer for curvature artifacts
- Store the decomposed state JSONL files in Convex File Storage, not in Convex document tables
- Store one merged national JSONL artifact in Convex File Storage for whole-US batch runs
- Store one manifest file per release in Convex File Storage with release metadata, checksums, and row counts
- Keep only metadata and storage IDs in Convex tables; do not store raw artifact payloads in documents
- Keep product/runtime reads on `curated_routes`; the raw curvature artifacts remain batch input only

## Convex Metadata Model

Create one metadata table for releases and one for shards:

- `curation_artifact_releases`
  - `source`
  - `releaseId`
  - `active`
  - `manifestStorageId`
  - `fullArtifactStorageId`
  - `rowCount`
  - `sha256`
  - `generatedAt`
- `curation_artifact_shards`
  - `source`
  - `releaseId`
  - `state`
  - `storageId`
  - `rowCount`
  - `sha256`

Use Convex storage IDs as the durable pointers from those tables to File Storage.

## Implemented Publish Surface

Concrete implementation paths for this plan:

- Convex metadata model validators: `models/curation-artifacts.ts`
- Convex schema tables: `curation_artifact_releases`, `curation_artifact_shards`
- Convex publish/query functions in `convex/curationArtifacts.ts`
  - `curationArtifacts:generateArtifactUploadUrl`
  - `curationArtifacts:upsertArtifactRelease`
  - `curationArtifacts:upsertArtifactShards`
  - `curationArtifacts:activateArtifactRelease`
  - `curationArtifacts:getActiveArtifactReleaseWithShards`
- Publisher CLI: `scripts/curation/publish_curvature_artifacts.py`

Publisher contract notes:

- `source` is currently fixed to `curvature`
- `generatedAt` is persisted as epoch milliseconds
- shard metadata is upserted in one batch mutation
- activation is a separate mutation after release + shard metadata are stored
- publish mutations are executed via `npx convex run`, while file bytes upload through Convex signed storage URLs

## Current Published Release

Development deployment `quirky-panther-164` now has the full national release published and activated:

- active release id: `adamfranco-us-curvature-51-states-sha256-ab590f7234b9`
- manifest storage id: `kg294vqwcb9pt1307n3d7wehd984zgwn`
- full artifact storage id: `kg2717wv7a84y06frxvz22aj4184yyt8`
- shard count: `51`
- row count: `1013985`
- sha256: `ab590f7234b94c088fa1fdaa5c82cbcd3a410af9796ebd235488168075b137ed`

## Why State Sharding

- State is the natural unit for resumable generation and retries
- State shards make partial refreshes practical without rebuilding the whole US artifact
- State shards simplify QA, debugging, and row-count verification
- State shards preserve the current compute workflow, which already runs per state
- The full national file still exists for simple sequential batch reads and canonical release validation

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
- Upload the release manifest, full US artifact, and state shards to Convex File Storage
- Persist release metadata and shard metadata in Convex tables using storage IDs
- Place or sync the active full artifact to `data/curvature/adamfranco-us-curvature.jsonl`

### Phase 5: Consume
- Run `python -m scripts.curation.pipeline.sources.curvature_discovery`
- Confirm loud failure if the artifact or default exclusion catalog is missing
- Confirm staging output contains only twisties candidates not already present by deterministic `name + state`
- Push normalized candidates into Convex `curated_routes`
- Keep mobile and API reads on `curated_routes`, not on the raw artifact release files
