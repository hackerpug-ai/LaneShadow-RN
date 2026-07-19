#!/usr/bin/env bash
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
python3 - <<'PY'
import json,subprocess,sys
ID=json.dumps({'subject':'s4-human-gate','issuer':'https://laneshadow.test'})

def run(fn,args=None):
  r=subprocess.run(['npx','convex','run',fn,json.dumps(args or {}),'--identity',ID],capture_output=True,text=True)
  return r

# blocked state
run('couchVerdict:clearCouchVerdicts',{})
b=run('couchVerdict:couchGateStatus',{})
print('blocked_status', b.stdout)
bs=json.loads(b.stdout)
assert bs.get('allowed') is False, bs
blocked=run('couchVerdict:runAllWaterfall',{'routeIds':['test:lever1-pass']})
print('blocked_all_exit', blocked.returncode)
print('blocked_all_out', (blocked.stdout+blocked.stderr)[:800])
assert blocked.returncode!=0 or 'COUCH_GATE_BLOCKED' in (blocked.stdout+blocked.stderr) or 'blocked' in (blocked.stdout+blocked.stderr).lower()

# restore pass
sample=json.load(open('/tmp/s4-sample.json'))
rv=[{'routeId':r['routeId'],'verdict':'true'} for r in sample['routes']]
rec=run('couchVerdict:recordCouchVerdict',{'sampleId':sample['sampleId'],'overallVerdict':'pass','routeVerdicts':rv})
assert rec.returncode==0, rec.stderr+rec.stdout
a=run('couchVerdict:couchGateStatus',{})
as_=json.loads(a.stdout)
assert as_.get('allowed') is True, as_
unblocked=run('couchVerdict:runAllWaterfall',{'routeIds':['test:lever1-pass']})
print('unblocked_exit', unblocked.returncode)
print('unblocked_out', (unblocked.stdout+unblocked.stderr)[:800])
assert unblocked.returncode==0, unblocked.stderr+unblocked.stdout
print(json.dumps({'ok':True,'blocked_allowed':bs['allowed'],'pass_allowed':as_['allowed'],'runAll_ok':True}))
PY
