# Sprint 2: UI Component Translation

## SPECIAL EXECUTION MODE: Kanban-Style Batch Processing

This sprint has many tasks (60+). The `/kb-run-sprint` orchestrator will execute them in **kanban-style batches of 4 tasks at a time** using `.kb-run-sprint-state.jsonl` as the persistent state tracker.

### How the batch execution works

1. **Read state file** — `.kb-run-sprint-state.jsonl` tracks all tasks with status, assignee, blocked_by
2. **Find ready batch** — Filter to tasks where `status="pending"` AND all `blocked_by` tasks are `completed`
3. **Dispatch batch** — Run up to 4 tasks in parallel using the implementer→reviewer loop from `/kb-run-epic`
4. **Update state** — When tasks complete, update their status in `.kb-run-sprint-state.jsonl`
5. **Next batch** — Repeat until all tasks are `completed`

### Implementer→Reviewer Loop (per batch)

For each task in the batch:
1. **Dispatch implementer** (e.g., `kotlin-implementer`, `swift-implementer`) with task spec
2. **Implementer commits work** — Must pass pre-commit hooks (typecheck, lint, tests)
3. **Dispatch matching reviewer** (e.g., `kotlin-reviewer`, `swift-reviewer`) to verify
4. **Reviewer verdict**:
   - `APPROVED` → Update state to `completed`, task proceeds to next wave
   - `NEEDS_FIXES` → Update state to `needs_fixes`, create remediation task
5. **Remediation loop** — If rejected, dispatch implementer again with reviewer feedback
6. **Commit enforcement** — No task is marked `completed` without a verified commit SHA

### Restart capability

If execution is interrupted (crash, user abort, etc.):
- The state file preserves all progress
- Re-running `/kb-run-sprint sprint-02-ui-component-translation` resumes from where it left off
- Only `pending` tasks are dispatched; `completed` tasks are skipped

### Manual state override (rarely needed)

If you need to reset a task status manually:

```bash
# Reset a specific task to pending
python3 -c "
import json
lines = open('.kb-run-sprint-state.jsonl').readlines()
out = []
for l in lines:
    t = json.loads(l)
    if t['task_id'] == 'UI-001-android-avatar':
        t['status'] = 'pending'
    out.append(json.dumps(t))
open('.kb-run-sprint-state.jsonl', 'w').write('\n'.join(out) + '\n')
"
```

## How to Use .kb-run-sprint-state.jsonl

`.kb-run-sprint-state.jsonl` is the execution state file for this sprint (managed by `/kb-run-sprint`). Each line is a JSON object describing one task. **Before starting any work, read this file and filter to tasks with `"status":"pending"` whose `blocked_by` list is empty or whose dependencies are all `"completed"`.**

### Status values

| Value | Meaning |
|---|---|
| `pending` | Not started. Ready once all `blocked_by` tasks are `completed`. |
| `in_progress` | Actively being worked by an agent. |
| `completed` | Implementation complete, tests passing, committed. |
| `blocked` | Blocked by dependency or merge conflict. |
| `needs_fixes` | Attempted and rejected by reviewer. Needs remediation. |

### Reading the file

```bash
# See all pending tasks ready to run (no unmet dependencies)
cat .kb-run-sprint-state.jsonl | python3 -c "
import sys, json
tasks = [json.loads(l) for l in sys.stdin if l.strip()]
done = {t['task_id'] for t in tasks if t['status'] == 'completed'}
ready = [t for t in tasks if t['status'] == 'pending' and all(d not in done or d in done for d in t.get('blocked_by', []))]
for t in ready: print(t['task_id'], t.get('assignee', 'unassigned'), t['title'][:60])
"

# See in-progress tasks
cat .kb-run-sprint-state.jsonl | python3 -c "import sys,json; [print(json.loads(l)['task_id'], json.loads(l)['title']) for l in sys.stdin if json.loads(l.strip())['status']=='in_progress']"

# Count by status
cat .kb-run-sprint-state.jsonl | python3 -c "
import sys,json,collections
counts = collections.Counter(json.loads(l)['status'] for l in sys.stdin if l.strip())
for k,v in counts.items(): print(k, v)
"
```

### Updating task status

The `/kb-run-sprint` orchestrator manages this file automatically. When dispatching tasks, it updates status to `in_progress`, and when reviewers approve, it updates to `completed`. Manual updates are rarely needed but can be done with:

```bash
# Mark UI-001-android-avatar as in_progress
python3 -c "
import json
lines = open('.kb-run-sprint-state.jsonl').readlines()
out = []
for l in lines:
    t = json.loads(l)
    if t['task_id'] == 'UI-001-android-avatar':
        t['status'] = 'in_progress'
    out.append(json.dumps(t))
open('.kb-run-sprint-state.jsonl', 'w').write('\n'.join(out) + '\n')
"

# Mark UI-001-android-avatar as completed
python3 -c "
import json
lines = open('.kb-run-sprint-state.jsonl').readlines()
out = []
for l in lines:
    t = json.loads(l)
    if t['task_id'] == 'UI-001-android-avatar':
        t['status'] = 'completed'
    out.append(json.dumps(t))
open('.kb-run-sprint-state.jsonl', 'w').write('\n'.join(out) + '\n')
"
```

## Execution Order

```
Sprint 2 builds on sprint 1c foundations. All tasks assume:
- Native theme system is wired (sprint 1c)
- Component gallery exists (sprint 1c)
- Convex backend is deployed (sprint 1c)

Execution is organized by UI translation tiers:
  Tier 1: Static atoms (text, buttons, inputs) — parallel safe
  Tier 2: Interactive atoms (toggles, sliders, chips) — depends on Tier 1
  Tier 3: Composite molecules (cards, lists) — depends on Tier 1+2
  Tier 4: Complex organisms (forms, modals) — depends on Tier 1+2+3
  Tier 5: Screen-level flows (auth, onboarding) — depends on Tiers 1-4

Per SPRINT.md, all UI tasks are leaf nodes and can execute in parallel
subject to platform agent capacity. MDL tasks are also leaf nodes.
Specific dependencies are tracked in .kb-run-sprint-state.jsonl blocked_by field.
Filter by: status = "pending" AND blocked_by = [] OR all blocked_by tasks have status = "completed"
```

## Critical Constraints (read before implementing anything)

1. **Theme-first translation** — All components MUST use native theme tokens (AND-002 system), NOT hardcoded colors/values from sprint 1.

2. **Platform parity** — iOS and Android components must have identical behavior, animations, and accessibility. Visual differences are acceptable where platform conventions differ.

3. **Component gallery** — Every translated component MUST have a gallery preview with interactive triggers for all states (idle, loading, error, success).

4. **Test coverage** — All components require snapshot tests for all states + unit tests for interaction logic.

5. **Performance** — Components must render at 60fps on mid-range devices. Use CompositionProfiler on Android, Instruments on iOS.

6. **Accessibility** — All interactive elements must have semantic labels, content descriptions, and proper screen reader support.

## Verification Commands

### Android
```bash
cd android/
./gradlew :app:ktlintCheck       # lint
./gradlew :app:detekt            # static analysis
./gradlew :app:compileDebugKotlin  # typecheck
./gradlew :app:test              # unit tests
./gradlew :app:assembleDebug     # full build
```

### iOS
```bash
cd ios/
swiftlint lint --quiet
swiftformat --lint
xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow \
  -destination 'generic/platform=iOS Simulator' -quiet build
```

## Sprint Human Testing Gate

**A founder can launch the app on both iOS and Android devices, navigate through translated UI flows, and verify consistent behavior, smooth animations, and proper theme application across all components.**

This gate is verified by running through the test steps in SPRINT.md after all Tier 5 tasks are committed.
