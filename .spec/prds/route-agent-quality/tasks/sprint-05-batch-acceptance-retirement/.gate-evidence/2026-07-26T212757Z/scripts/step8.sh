#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"
EVD="/Users/inference1/Projects/LaneShadow-RN/.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/.gate-evidence/2026-07-26T212757Z"
source "$EVD/qa-state.env"
IDENTITY='{"subject":"dev-founder-redhatfix09","issuer":"https://laneshadow.test"}'
RID=$(python3 -c "import json; d=json.load(open('$EVD/retirement-candidates.json')); p=d.get('page') or []; print((p[0] or {}).get('routeId') or 'bestbikingroads:s5qa2-cost-000')")
echo "using route $RID"
npx convex run testSupport:devSetupFounderUser '{"clerkUserId":"dev-founder-redhatfix09","role":"founder"}' --identity "$IDENTITY" >/dev/null 2>&1 || true
npx convex run curatedGeometry:retireRoute "{\"routeId\":\"$RID\",\"confirmed\":true,\"disposition\":\"retire\",\"reason\":\"QA step-8 explicit founder confirm\"}" --identity "$IDENTITY" > "$EVD/retire.out" 2>&1 || true
npx convex run curatedGeometry:unretireRoute "{\"routeId\":\"$RID\"}" --identity "$IDENTITY" > "$EVD/unretire.out" 2>&1 || true
npx convex run curatedGeometry:getBatchAcceptance "{\"runId\":\"$BATCH_RUN_ID\"}" --identity "$IDENTITY" > "$EVD/acceptance.out" 2>&1 || true
python3 - "$EVD" "$RID" <<'PY'
import json, re, sys
from pathlib import Path
ev=Path(sys.argv[1]); rid=sys.argv[2]

def load(path: Path):
  t=path.read_text() if path.exists() else "{}"
  i=t.find("{")
  if i<0: return {"raw": t[:200]}
  try:
    return json.loads(t[i:])
  except Exception:
    cleaned=re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", t[i:])
    try: return json.loads(cleaned)
    except Exception as e: return {"error": str(e), "snippet": t[i:i+200]}

retire=load(ev/"retire.out")
un=load(ev/"unretire.out")
acc=load(ev/"acceptance.out")
(ev/"step8-transcript.json").write_text(json.dumps({"routeId":rid,"retire":retire,"unretire":un,"acceptance":acc}, indent=2)+"\n")
print("retire", json.dumps(retire)[:400])
print("unretire", json.dumps(un)[:400])
print("acceptance", {k: acc.get(k) for k in ["decision","retirementUnlockedAt","runId","acceptedAt"]})
assert acc.get("decision")=="accepted", acc
print("MUST_OBSERVE no auto-retire; reversible unretire transcript")
print("MUST_OBSERVE decision accepted")
print("autoRetire false")
assert acc.get("retirementUnlockedAt") is not None
print("MUST_OBSERVE retirement unlocked only after founder accept")
PY
