import json
def load(k): return json.load(open(f".tmp/sprint01-expansion/{k}.json"))
def tasks(o): return o.get("expanded_tasks") or o.get("design_tasks") or []
allt=[]
for k in ["convex","rn","design"]:
    for t in tasks(load(k)):
        t["_src"]=k; allt.append(t)
print(f"TOTAL tasks: {len(allt)}")
for t in allt:
    tid = t.get("task_id") or t.get("id")
    pb = t.get("proposed_by","MISSING")
    tt = t.get("task_type","?")
    acs = t.get("acceptance_criteria",[])
    tcs = t.get("test_criteria",[])
    reqs = t.get("requirements",[])
    sc = sum(1 for a in acs if isinstance(a,dict) and a.get("scenario"))
    acids = [a.get("id") for a in acs if isinstance(a,dict)]
    print(f"{tid:14} src={t['_src']:6} type={tt:8} proposed_by={pb!=None and pb!='MISSING'} ACs={len(acs)} (sc={sc}) TCs={len(tcs)} reqs={len(reqs)} fixtures={'fixtures' in t}")
    # flag AC id gaps
    nums=[a.get('id') for a in acs if isinstance(a,dict)]
    if any(n is None for n in nums): print(f"   !! AC without id: {nums}")
