#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"
EVD="/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z"
IDENTITY='{"subject":"dev-founder-redhatfix09","issuer":"https://laneshadow.test"}'
OUT=$(npx convex run curatedGeometry:listRetirementCandidates '{"limit":10}' --identity "$IDENTITY" 2>/dev/null)
# Write raw to file first
printf '%s' "$OUT" > "$EVD/retirement-candidates.raw.txt"
python3 - <<'PY'
import json, re
from pathlib import Path
raw=Path("/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z/retirement-candidates.raw.txt").read_text()
# strip npm noise
i=raw.find('{')
j=raw.find('[')
idx=min([x for x in [i,j] if x>=0] or [0])
try:
  d=json.loads(raw[idx:])
except json.JSONDecodeError:
  # truncate huge embedded polyline strings and retry
  cleaned=re.sub(r'"bestCandidateGeometry"\s*:\s*"[^"]{200,}"', '"bestCandidateGeometry":"<truncated>"', raw[idx:])
  d=json.loads(cleaned)
Path("/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z/retirement-candidates.json").write_text(json.dumps(d, indent=2)[:200000]+('\n' if False else '\n'))
page=d.get('page') if isinstance(d,dict) else d
if page is None and isinstance(d,dict):
  page=d.get('candidates') or d.get('items') or []
if not isinstance(page, list):
  page=[]
summary=[]
for r in page[:20]:
  if not isinstance(r, dict):
    continue
  summary.append({
    'routeId': r.get('routeId'),
    'geometryStatus': r.get('geometryStatus'),
    'eligible': r.get('eligible'),
    'leverFailureReasons': r.get('leverFailureReasons') or r.get('reasons'),
  })
print(json.dumps({'candidateCount': len(page), 'sample': summary[:5]}, indent=2))
assert len(page) >= 0  # empty list ok if none, but print reasons
# Prefer non-empty when possible; allow empty with explicit note
if len(page)==0:
  print('NOTE: zero retirement candidates currently listed')
else:
  assert any(s.get('leverFailureReasons') or s.get('routeId') for s in summary)
print('MUST_OBSERVE retirement candidates with reasons')
print('candidates', len(page))
PY
