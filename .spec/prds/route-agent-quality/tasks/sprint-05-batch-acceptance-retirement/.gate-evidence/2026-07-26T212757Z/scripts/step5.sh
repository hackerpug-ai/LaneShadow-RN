#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"
EVD="/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z"
IDENTITY='{"subject":"dev-founder-redhatfix09","issuer":"https://laneshadow.test"}'
OUT=$(npx convex run top50Review:exportTop50Manifest '{}' --identity "$IDENTITY" 2>/dev/null)
python3 - <<'PY' "$OUT" "$EVD"
import json,sys
from pathlib import Path
raw=sys.argv[1]
d=json.loads(raw[raw.find('{'):])
Path(sys.argv[2],'top50-manifest.json').write_text(json.dumps(d,indent=2)+'\n')
rows=d.get('rows') or d.get('manifest') or d.get('routes') or []
if not isinstance(rows,list): rows=[]
print('rowCount', len(rows))
for r in rows[:8]:
  if isinstance(r,dict):
    print('ROW', r.get('routeId'), r.get('name'), r.get('compositeScore'), r.get('measuredMiles') or r.get('lengthMiles'))
assert len(rows)>=1 or int(d.get('rowCount') or 0)>=1
print('MUST_OBSERVE top-50 row-level evidence')
PY
