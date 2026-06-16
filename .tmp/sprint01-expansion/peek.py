import json
def load(k): return json.load(open(f".tmp/sprint01-expansion/{k}.json"))
def find(k,tid):
    for t in (load(k).get("expanded_tasks") or load(k).get("design_tasks")):
        if (t.get("task_id") or t.get("id"))==tid: return t
print("=== DISC-016 AC-1 scenario (rn) ===")
t=find("rn","DISC-016"); ac=t["acceptance_criteria"][0]
print("fixtures keys:", list(t.get("fixtures",{}).keys()))
print(json.dumps(ac.get("scenario"),indent=1)[:1500])
print("\n=== DATA-002 AC-1 scenario (convex) ===")
t=find("convex","DATA-002"); ac=t["acceptance_criteria"][0]
print(json.dumps(ac.get("scenario"),indent=1)[:1500])
