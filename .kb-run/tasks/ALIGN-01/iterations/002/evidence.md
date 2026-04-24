# ALIGN-01 Evidence

Host validation
- Restored inherited `.kb-run-sprint-codex/.state.json.sha256` from the isolated worktree before validation.
- `test -f .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` passed.
- `grep -c 'MISSING' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` returned `34`.
- `grep 'scrim-soft' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | grep 'rgba(34,24,16,0.18)'` matched the expected row.
- `grep 'map.style.light\|map.style.dark' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | wc -l` returned `2`.
- `grep 'sizing.stroke.md' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | grep '\b2\b'` matched `| sizing.stroke.md | 2 | 2 | MISSING | MISSING |`.
- `grep 'surface.scrim-soft\|border.glass' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` matched both required surface and border rows.
- `grep 'map.paper\|map.contour\|map.style' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | wc -l` returned `6`.
- `grep 'sizing.stroke' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | wc -l` returned `5`.
- `grep 'signal.hover\|status.*tint' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` matched all required signal and status-tint rows.
- `grep -i 'android\|kotlin\|naming.mismatch\|camelCase' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` confirmed the Android-specific drift and naming-mismatch sections.
- `git diff --name-only | grep -vE 'drift-report\.md' | grep -E '\.swift|\.kt' | wc -l` returned `0`.

Scope note
- The worktree diff is limited to `.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md`.
