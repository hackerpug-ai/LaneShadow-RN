#!/usr/bin/env bash
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
ID='{"subject":"s4-human-gate","issuer":"https://laneshadow.test"}'
OUT=.tmp/sprint-04-trust-pipeline/couch-export
mkdir -p "$OUT"
npx convex run couchSampleAssembler:seedCouchFixtures '{}' --identity "$ID" | tee /tmp/s4-seed-couch.json
npx convex run couchSampleAssembler:assembleCouchSample '{"targetSize":25}' --identity "$ID" | tee /tmp/s4-sample.json
python3 - <<'PY'
import json
d=json.load(open('/tmp/s4-sample.json'))
assert 20 <= len(d.get('routes',[])) <= 30, len(d.get('routes',[]))
print('sampleId', d['sampleId'], 'routes', len(d['routes']))
open('/tmp/s4-sample-id.txt','w').write(d['sampleId'])
PY
SID=$(cat /tmp/s4-sample-id.txt)
npx convex run couchSampleExport:exportCouchSample "{\"sampleId\":\"$SID\"}" --identity "$ID" | tee /tmp/s4-export.json >/dev/null
# export can be large; rewrite tee carefully
npx convex run couchSampleExport:exportCouchSample "{\"sampleId\":\"$SID\"}" --identity "$ID" > /tmp/s4-export.json
python3 - <<'PY'
import json,base64
from pathlib import Path
out=Path('.tmp/sprint-04-trust-pipeline/couch-export')
out.mkdir(parents=True, exist_ok=True)
for p in out.glob('*.png'):
    p.unlink()
d=json.load(open('/tmp/s4-export.json'))
assert d['size']>=20, d['size']
for r in d['routes']:
    p=out/f"{r['routeId'].replace(':','_')}.png"
    p.write_bytes(base64.b64decode(r['pngBase64']))
pngs=list(out.glob('*.png'))
assert len(pngs)>=20, len(pngs)
# unique sizes check (non-blank maps)
sizes=sorted({p.stat().st_size for p in pngs})
assert len(sizes)>=1 and min(sizes)>100
print(json.dumps({'ok':True,'sampleId':d['sampleId'],'pngs':len(pngs),'size':d['size'],'unique_byte_sizes':len(sizes)}))
PY
