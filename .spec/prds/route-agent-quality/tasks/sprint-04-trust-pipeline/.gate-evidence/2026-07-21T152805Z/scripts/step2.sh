#!/usr/bin/env bash
# Honest step2: assert each route from step1 evidence ends in exactly one terminal state.
set -euo pipefail
EVIDENCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
python3 - <<PY
import json
d=json.load(open("$EVIDENCE_DIR/step1-real-provider-waterfall.json"))
rs=d.get("routes") or []
assert rs
for r in rs:
    assert isinstance(r.get("terminalState"), str) and r["terminalState"]
counts=d.get("perStateCounts") or {}
assert sum(int(v) for v in counts.values())==len(rs)
print(json.dumps({"ok":True,"count":len(rs),"states":sorted({r["terminalState"] for r in rs})}))
PY
