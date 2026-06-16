import json, subprocess
VS="/Users/justinrich/Projects/brain/tools/validate-scenario/validate_scenario.py"
base=".tmp/sprint01-expansion"
def load(k): return json.load(open(f"{base}/{k}.json"))
# empty-signature appends (faithful: name the start/empty state that must NOT appear)
neg_append={
 ("DISC-016","AC-3"):"transcript count === 0 after the send (empty — nothing persisted)",
 ("DISC-017","AC-2"):"the empty 'no nearby routes' copy shown while still loading (premature empty state)",
 ("DISC-017","AC-3"):"a blank slot with no feedback message (empty — rider gets nothing)",
 ("DISC-018","AC-1"):"neither footer button rendered (empty footer / 0 buttons)",
 ("DISC-018","AC-2"):"an empty map with 0 route polylines while a route should be shown",
 ("DISC-019","AC-1"):"an empty drawer with 0 navigation items (over-deletion)",
 ("DISC-019","AC-2"):"an empty drawer / 0 navigation items rendered",
}
# weak-oracle concrete replacements (faithful tightening of the SAME assertion)
oracle_replace={
 ("DATA-008","AC-2"):("executeDiscoverCuratedRoutes return.routePlanId is a defined route_plans id (not undefined)",
   "typeof executeDiscoverCuratedRoutes return.routePlanId === 'string' && return.routePlanId.length > 0 (a real route_plans id)"),
 ("DISC-020","AC-1"):("the real road name string rendered (non-empty, matches the option label from the catalog)",
   "getByText(option.name) !== null where option.name is the real catalog road name literal (e.g. 'Tail of the Dragon'), length > 0"),
}
for k in ["convex","rn"]:
    o=load(k)
    for t in o.get("expanded_tasks",[]):
        tid=t.get("task_id") or t.get("id")
        for ac in t.get("acceptance_criteria",[]):
            key=(tid,ac.get("id"))
            sc=ac.get("scenario")
            if not sc: continue
            if key in neg_append:
                sc["cases"][0]["end_state"]["must_not_observe"].append(neg_append[key])
            if key in oracle_replace:
                old,new=oracle_replace[key]
                for case in sc["cases"]:
                    mo=case["end_state"]["must_observe"]
                    case["end_state"]["must_observe"]=[new if x==old else x for x in mo]
    json.dump(o,open(f"{base}/{k}.json","w"),indent=2)
# FINAL full audit
allt=[]
for k in ["convex","rn","design"]:
    o=load(k)
    for t in (o.get("expanded_tasks") or o.get("design_tasks") or []): allt.append(t)
fails={}
for t in allt:
    tid=t.get("task_id") or t.get("id")
    if t.get("task_type")!="FEATURE": continue
    reqs=[{"id":a.get("id"),"scenario":a["scenario"]} for a in t.get("acceptance_criteria",[]) if a.get("scenario")]
    r=subprocess.run(["python3",VS,"/dev/stdin"],input=json.dumps({"fixtures":t.get("fixtures",{}),"requirements":reqs}),capture_output=True,text=True)
    if r.returncode!=0:
        try: codes=sorted(set(x["code"]+":"+x["severity"] for x in json.loads(r.stdout).get("violations",[])))
        except: codes=[r.stdout[-160:]]
        fails[tid]=codes
print("=== FINAL FAKEABILITY AUDIT ===")
if not fails: print("✓✓ ALL 11 FEATURE TASKS PASS — fakeability floor clear (0 CRITICAL/HIGH)")
else:
    for tid,c in fails.items(): print(f"FAIL {tid}: {c}")
