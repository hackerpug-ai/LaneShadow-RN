#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json
from pathlib import Path
raw=Path("/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z/top50-manifest.json").read_text()
d=json.loads(raw[raw.find('{'):])
rows=d.get('rows') or d.get('manifest') or d.get('routes') or []
ids=[]
for r in rows if isinstance(rows,list) else []:
  if isinstance(r,dict):
    ids.append((str(r.get('routeId') or ''), str(r.get('name') or '')))
contam=[(i,n) for i,n in ids if i.startswith(('test:','seed:')) or 'tepusquet' in i.lower() or 'Fixture' in n]
print(json.dumps({'rowCount':len(ids),'contaminationCount':len(contam),'sample':ids[:5]}, indent=2))
assert len(contam)==0
print('MUST_OBSERVE zero test/seed/tepusquet contamination')
PY
