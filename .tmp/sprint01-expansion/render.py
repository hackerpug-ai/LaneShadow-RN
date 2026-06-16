import json, re, os
base=".tmp/sprint01-expansion"
OUT=".spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view"
SPRINT="[SPRINT.md](./SPRINT.md)"
def load(k): return json.load(open(f"{base}/{k}.json"))
def kebab(s):
    s=re.sub(r"[^a-zA-Z0-9]+","-",s.lower()).strip("-")
    return re.sub(r"-+","-",s)[:60]
def as_list(x):
    if x is None: return []
    if isinstance(x,list): return x
    if isinstance(x,dict):
        out=[]
        for kk,vv in x.items():
            if isinstance(vv,list):
                for it in vv: out.append(f"**{kk}**: {it}")
            else: out.append(f"**{kk}**: {vv}")
        return out
    return [str(x)]
def spec_str(s):
    if isinstance(s,dict):
        return "\n".join(f"- **{k}**: {v}" for k,v in s.items())
    return str(s)
def ac_verify(ac, task):
    # AC has no 'verify' — derive from test_file/test_function or task verification gate
    tf=ac.get("test_file"); fn=ac.get("test_function")
    if tf and fn: return f"`pnpm test {tf}` → `{fn}`"
    if tf: return f"`pnpm test {tf}`"
    vg=task.get("verification_gates")
    if isinstance(vg,dict): return f"`{vg.get('test') or next(iter(vg.values()))}`"
    if isinstance(vg,list) and vg: return f"`{vg[0]}`"
    return "(see Verification Gates)"
def vg_rows(vg):
    rows=[]
    if isinstance(vg,list):
        for g in vg: rows.append(("gate",g if isinstance(g,str) else json.dumps(g)))
    elif isinstance(vg,dict):
        for k,v in vg.items():
            if isinstance(v,dict): rows.append((v.get("gate",k), v.get("command",json.dumps(v))))
            else: rows.append((k,v))
    return rows
def reading_rows(rl):
    out=[]
    for r in rl or []:
        if isinstance(r,dict):
            out.append((r.get("path") or r.get("file") or "?", r.get("lines","all"), r.get("focus","")))
        else: out.append((str(r),"",""))
    return out

scores={}
def score(t):
    s=0; cc=t.get("critical_constraints"); 
    n_cc=len(as_list(cc))
    if n_cc>=3: s+=10
    if t.get("specification"): s+=10
    acs=t.get("acceptance_criteria",[]); s+= 20 if len(acs)>=4 else 10
    if t.get("test_criteria"): s+=10
    # stable ids
    if all(a.get("id") for a in acs) and all(tc.get("id") for tc in t.get("test_criteria",[])): s+=5
    s+=5 # capability coverage (touches_capabilities or N/A)
    g=t.get("guardrails"); 
    if (isinstance(g,dict) and g.get("write_allowed")) or (isinstance(g,list) and g): s+=5
    if t.get("design"): s+=10
    if t.get("verification_gates"): s+=15
    if t.get("agent"): s+=5
    if t.get("estimate_minutes"): s+=5
    if t.get("coding_standards"): s+=5
    # test tier compliance: primary AC integration/e2e
    prim=[a for a in acs if a.get("primary") or a.get("id")=="AC-1"]
    if prim and all(a.get("test_tier") in ("integration","e2e") for a in prim): s+=10
    elif acs and all(a.get("test_tier") for a in acs): s+=7
    return s

def build_requirements(t):
    reqs=t.get("requirements")
    if reqs: return reqs
    out=[]
    for a in t.get("acceptance_criteria",[]):
        desc=f"GIVEN {a.get('given','')} WHEN {a.get('when','')} THEN {a.get('then','')}".strip()
        e={"id":a["id"],"type":"acceptance_criterion","description":desc,"verify":ac_verify(a,t).strip("`")}
        if a.get("scenario") and isinstance(a["scenario"],dict): e["scenario"]=a["scenario"]
        out.append(e)
    for tc in t.get("test_criteria",[]):
        out.append({"id":tc["id"],"type":"test_criterion","description":tc.get("statement") or tc.get("description",""),"maps_to_ac":tc.get("maps_to_ac"),"verify":tc.get("verify","")})
    return out

def render(t):
    tid=t.get("task_id") or t.get("id")
    title=t.get("title","")
    agent=t.get("agent","")
    impl=agent; reviewer=""
    m=re.search(r"implementer=([\w-]+).*reviewer=([\w-]+)",agent)
    if m: impl,reviewer=m.group(1),m.group(2)
    L=[]
    L.append(f"# {tid}: {title}\n")
    L.append(f"**Sprint:** {SPRINT}  ")
    L.append(f"**Type:** {t.get('task_type','FEATURE')} · **Status:** {t.get('status','To Do')} · **Priority:** {t.get('priority','P1')} · **Effort:** {t.get('effort','M')} · **Estimate:** {t.get('estimate_minutes','?')} min  ")
    L.append(f"**Agent:** {impl}" + (f" · **Reviewer:** {reviewer}" if reviewer else "") + "  ")
    L.append(f"**Proposed By:** {t.get('proposed_by','?')}  ")
    if t.get("agent_rationale"): L.append(f"**Agent rationale:** {t['agent_rationale']}  ")
    L.append("")
    if t.get("outcome"): L.append(f"## Outcome\n\n{t['outcome']}\n")
    L.append("## Specification\n\n"+spec_str(t.get("specification",""))+"\n")
    cc=as_list(t.get("critical_constraints"))
    if cc:
        L.append("## Critical Constraints\n")
        for c in cc: L.append(f"- {c}")
        L.append("")
    # ACs
    L.append("## Acceptance Criteria\n")
    for a in t.get("acceptance_criteria",[]):
        L.append(f"### {a['id']}: {a.get('name','')}")
        if a.get("primary"): L.append("*(PRIMARY)*")
        L.append(f"- **GIVEN** {a.get('given','')}")
        L.append(f"- **WHEN** {a.get('when','')}")
        L.append(f"- **THEN** {a.get('then','')}")
        L.append(f"- **Test tier:** `{a.get('test_tier','?')}`" + (f" · **Service:** {a.get('verification_service')}" if a.get('verification_service') else ""))
        L.append(f"- **Verify:** {ac_verify(a,t)}")
        if a.get("scenario") and isinstance(a["scenario"],dict):
            sc=a["scenario"]
            cases=sc.get("cases") or [{}]
            cs=cases[0].get("end_state",{}) if isinstance(cases[0],dict) else {}
            if not isinstance(cs,dict): cs={}
            mo=cs.get("must_observe",[]) or []; mno=cs.get("must_not_observe",[]) or []
            ncobj=sc.get("negative_control")
            nc=ncobj.get("would_fail_if",[]) if isinstance(ncobj,dict) else ([] if not ncobj else [str(ncobj)])
            L.append(f"- **Scenario** (start `{sc.get('start_ref','?')}`):")
            if mo: L.append(f"  - must observe: {('; '.join(mo))}")
            if mno: L.append(f"  - must NOT observe: {('; '.join(mno))}")
            if nc: L.append(f"  - negative control (would fail if): {('; '.join(nc))}")
        L.append("")
    # TCs
    if t.get("test_criteria"):
        L.append("## Test Criteria\n")
        L.append("| ID | Statement | Maps to | Verify |")
        L.append("|----|-----------|---------|--------|")
        for tc in t["test_criteria"]:
            stmt=(tc.get("statement") or tc.get("description","")).replace("|","\\|")
            L.append(f"| {tc['id']} | {stmt} | {tc.get('maps_to_ac','')} | `{tc.get('verify','')}` |")
        L.append("")
    # Reading list
    rr=reading_rows(t.get("reading_list"))
    if rr:
        L.append("## Reading List\n")
        for p,ln,fo in rr: L.append(f"- `{p}`" + (f" ({ln})" if ln else "") + (f" — {fo}" if fo else ""))
        L.append("")
    # Guardrails
    g=t.get("guardrails")
    if g:
        L.append("## Guardrails\n")
        if isinstance(g,dict):
            for f in g.get("write_allowed",[]): L.append(f"- WRITE-ALLOWED: `{f}`")
            for f in g.get("write_prohibited",[]): L.append(f"- WRITE-PROHIBITED: {f}")
        else:
            for c in g: L.append(f"- {c}")
        L.append("")
    # Design
    d=t.get("design")
    if d:
        L.append("## Design\n")
        refs=d.get("references") or d.get("refs") or []
        for r in refs: L.append(f"- ref: {r}")
        if d.get("pattern"): L.append(f"- pattern: {d['pattern']}")
        if d.get("pattern_source"): L.append(f"- pattern source: {d['pattern_source']}")
        if d.get("anti_pattern"): L.append(f"- anti-pattern: {d['anti_pattern']}")
        for note in d.get("interaction_notes",[]): L.append(f"- note: {note}")
        L.append("")
    # Verification gates
    vg=vg_rows(t.get("verification_gates"))
    if vg:
        L.append("## Verification Gates\n")
        L.append("| Gate | Command |")
        L.append("|------|---------|")
        for gname,cmd in vg: L.append(f"| {gname} | `{cmd}` |")
        L.append("")
    # Coding standards
    if t.get("coding_standards"):
        L.append("## Coding Standards\n")
        for c in t["coding_standards"]: L.append(f"- {c}")
        L.append("")
    # Dependencies
    dep=t.get("dependencies",{})
    L.append("## Dependencies\n")
    L.append(f"- Depends on: {', '.join(dep.get('depends_on',[])) or 'None'}")
    L.append(f"- Blocks: {', '.join(dep.get('blocks',[])) or 'None'}")
    if dep.get("parallel"): L.append(f"- Parallel: {', '.join(dep.get('parallel',[]))}")
    L.append("")
    # Requirement contract
    contract={"fixtures":t.get("fixtures",{}),"requirements":build_requirements(t)}
    L.append("<!-- REQUIREMENT-CONTRACT v1 -->")
    L.append("<!--")
    L.append(json.dumps(contract,indent=2))
    L.append("-->")
    L.append("")
    return tid, kebab(title), "\n".join(L)

os.makedirs(OUT,exist_ok=True)
written=[]
for k in ["convex","rn","design"]:
    o=load(k)
    for t in (o.get("expanded_tasks") or o.get("design_tasks") or []):
        sc=score(t); scores[t.get("task_id") or t.get("id")]=sc
        tid,slug,md=render(t)
        fn=f"{OUT}/{tid}-{slug}.md"
        open(fn,"w").write(md)
        written.append((tid,sc,os.path.basename(fn)))
print("=== RENDERED TASK FILES (score/115) ===")
for tid,sc,fn in written: print(f"  {sc:3}/115  {fn}")
avg=sum(s for _,s,_ in written)/len(written)
print(f"\n{len(written)} task files written · avg {avg:.0f}/115 · min {min(s for _,s,_ in written)}/115")
