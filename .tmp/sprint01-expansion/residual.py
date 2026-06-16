import json, subprocess
VS="/Users/justinrich/Projects/brain/tools/validate-scenario/validate_scenario.py"
base=".tmp/sprint01-expansion"
def load(k): return json.load(open(f"{base}/{k}.json"))
targets={"DATA-008","DISC-016","DISC-017","DISC-018","DISC-019","DISC-020"}
for k in ["convex","rn"]:
    for t in load(k).get("expanded_tasks",[]):
        tid=t.get("task_id") or t.get("id")
        if tid not in targets: continue
        for ac in t.get("acceptance_criteria",[]):
            if not ac.get("scenario"): continue
            contract={"fixtures":t.get("fixtures",{}),"requirements":[{"id":ac["id"],"scenario":ac["scenario"]}]}
            r=subprocess.run(["python3",VS,"/dev/stdin"],input=json.dumps(contract),capture_output=True,text=True)
            if r.returncode!=0:
                v=json.loads(r.stdout).get("violations",[])
                print(f"\n## {tid} {ac['id']}")
                for x in v: print(f"  [{x['severity']}] {x['code']}: {x['message']}")
                # show the offending must_observe/must_not_observe
                for ci,case in enumerate(ac['scenario'].get('cases',[])):
                    es=case.get('end_state',{})
                    print(f"   case[{ci}].must_observe={es.get('must_observe')}")
                    print(f"   case[{ci}].must_not_observe={es.get('must_not_observe')}")
