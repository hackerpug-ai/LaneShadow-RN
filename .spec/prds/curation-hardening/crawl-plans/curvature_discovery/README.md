# Curvature Discovery Provenance

Canonical source artifact: `data/curvature/adamfranco-us-curvature.jsonl`

This Form E source consumes **precomputed** output from `adamfranco/curvature` only. Epic 4 does not run the multi-hour curvature batch over the US OSM PBF. Instead, the batch is run outside this epic and its cached output is made available to the consumer.

Supported consumer input:
- precomputed `*.jsonl` or `*.ndjson` cache artifacts only
- raw `.osm`, `.pbf`, and `.osm.pbf` inputs are rejected explicitly

Artifact resolution order:
1. explicit CLI override, e.g. `python -m scripts.curation.pipeline.sources.curvature_discovery --artifact /abs/path/to/file.jsonl`
2. environment override `CURVATURE_ARTIFACT_PATH`
3. canonical default path `data/curvature/adamfranco-us-curvature.jsonl`

Failure behavior:
- If none of those locations exist, the consumer must fail loudly and stop rather than guess an input file.
- If the default existing-catalog baseline is expected and missing, the consumer must fail loudly rather than silently disabling exclusion. The only supported opt-out is an explicit internal `existing_catalog_path=False`.
- The absence of the artifact is a pre-existing input blocker, not a reason to fall back to raw OSM/PBF processing inside Epic 4.

Expected provenance contract:
- Upstream producer: precomputed `adamfranco/curvature` output, generated outside Epic 4.
- Canonical cached location: `data/curvature/adamfranco-us-curvature.jsonl`
- Consumer entrypoint: `python -m scripts.curation.pipeline.sources.curvature_discovery`
- Task scope: read artifact, exclude existing catalog matches by deterministic `name + state`, emit hidden-gem twisties candidates with populated `curvature_score`.

Recommended metadata to record once the real artifact is placed:
- generator repository + commit/version
- source PBF name/version
- generated timestamp
- row count
- sha256 checksum

Current release checkpoint:
- active Convex release id: `adamfranco-us-curvature-51-states-sha256-ab590f7234b9`
- manifest storage id: `kg294vqwcb9pt1307n3d7wehd984zgwn`
- full artifact storage id: `kg2717wv7a84y06frxvz22aj4184yyt8`
- shard count: `51`
- published row count: `1013985`
- published sha256: `ab590f7234b94c088fa1fdaa5c82cbcd3a410af9796ebd235488168075b137ed`
- verified active on dev `quirky-panther-164` and prod `fantastic-owl-967` on `2026-04-16`

Operator runbook:
- [`US-ARTIFACT-PLAN.md`](./US-ARTIFACT-PLAN.md)
