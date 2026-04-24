# ALIGN-01 Evidence

Host validation
- Restored inherited `.kb-run-sprint-codex/.state.json.sha256` from the isolated worktree before validation.
- `test -f .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` passed.
- `grep -c 'MISSING' .../drift-report.md` returned 31.
- `grep 'scrim-soft' ... | grep 'rgba(34,24,16,0.18)'` matched.
- `grep 'map.style.light\|map.style.dark' ... | wc -l` returned 2.
- `grep 'sizing.stroke.md' ... | grep '\b2\b'` matched.
- `grep 'signal.hover\|status.*tint' ...` matched all required rows.
- `git diff --name-only | grep -vE 'drift-report\.md' | grep -E '\.swift|\.kt' | wc -l` returned 0.
