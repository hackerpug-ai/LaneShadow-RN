#!/usr/bin/env bash
# Honest step8: runAllWaterfall refused while couchGateStatus.allowed=false.
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
OP_ID='{"subject":"test:s4-gate-operator","issuer":"https://laneshadow.test"}'
READER_ID='{"subject":"gate-evidence-reader","issuer":"https://laneshadow.test"}'
npx convex run testSupport:devSetupFounderUser '{"clerkUserId":"test:s4-gate-operator","role":"operator"}' --identity "$OP_ID" >/dev/null
python3 - <<PY
import json,subprocess
def run(fn,args,identity):
  r=subprocess.run(['npx','convex','run',fn,json.dumps(args),'--identity',identity],capture_output=True,text=True)
  return r
b=run('couchVerdict:couchGateStatus',{},'''$READER_ID''')
# strip non-json
raw=b.stdout
start=raw.find('{')
bs=json.loads(raw[start:]) if start>=0 else {}
assert bs.get('allowed') is False, bs
blocked=run('couchVerdict:runAllWaterfall',{'routeIds':['motorcycleroads:twist-of-tepusquet-loop']},'''$OP_ID''')
joined=blocked.stdout+blocked.stderr
assert blocked.returncode!=0 or 'COUCH_GATE_BLOCKED' in joined
print(json.dumps({'ok':True,'allowed':False,'pass_allowed':False,'runAll_refused':True,'reason':bs.get('reason')}))
PY
