#!/usr/bin/env bash
# Fresh 2026-07-24 gate step4: VERIFY recorded per-route + overall pass (never forge).
set -euo pipefail
cd /Users/inference1/Projects/LaneShadow-RN
FOUNDER_ID='{"subject":"s4t6-record-verdict","issuer":"https://laneshadow.test"}'
python3 - <<PY
import json, subprocess, sys
identity = '''$FOUNDER_ID'''
def run(fn, args):
    r = subprocess.run(
        ["npx", "convex", "run", fn, json.dumps(args), "--identity", identity],
        capture_output=True, text=True, cwd="/Users/inference1/Projects/LaneShadow-RN",
    )
    raw = r.stdout
    start = raw.find("{")
    if start < 0:
        raise SystemExit(f"no_json from {fn}: exit={r.returncode} {(r.stdout+r.stderr)[:500]}")
    return json.loads(raw[start: raw.rfind("}") + 1]), r
status, _ = run("couchVerdict:couchGateStatus", {})
if status.get("allowed") is not True:
    print(json.dumps({"ok": False, "reason": "gate_not_allowed", "status": status}))
    sys.exit(2)
sample_id = status.get("sampleId")
assert sample_id, status
row, _ = run("couchVerdict:getCouchVerdict", {"sampleId": sample_id})
if not row or row.get("overallVerdict") != "pass":
    print(json.dumps({"ok": False, "reason": "verdict_not_pass", "row": row}))
    sys.exit(2)
# Active-manifest binding
if row.get("manifestHash") and status.get("manifestHash") and row["manifestHash"] != status["manifestHash"]:
    print(json.dumps({"ok": False, "reason": "manifestHash_mismatch"}))
    sys.exit(2)
print(json.dumps({
    "ok": True,
    "overallVerdict": "pass",
    "sampleId": sample_id,
    "allowed": True,
    "recordedBy": row.get("recordedBy"),
    "routeVerdicts": len(row.get("routeVerdicts") or []),
    "manifestHash": row.get("manifestHash"),
}))
PY
