#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"
EVD="/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z"
source "$EVD/qa-state.env"
IDENTITY='{"subject":"dev-founder-redhatfix09","issuer":"https://laneshadow.test"}'
mkdir -p "$EVD/gate-step-logs"
pnpm tsx scripts/redhat-fix-05-gate-rerun.ts --run-id="$BATCH_RUN_ID" --identity="$IDENTITY" --out="$EVD/gate-step-logs"
python3 - <<'PY'
from pathlib import Path
import json
p=Path("/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z/gate-step-logs/step-3.log")
assert p.exists() and p.stat().st_size>10
d=json.loads(p.read_text())
print(json.dumps(d, indent=2)[:2500])
print('MUST_OBSERVE step-3 yield comparison present')
PY
