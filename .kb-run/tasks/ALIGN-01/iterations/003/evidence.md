# ALIGN-01 Evidence

Host validation
- `test -f .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` passed.
- `grep -c 'MISSING' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` returned `61`.
- `grep 'surface.scrim-soft\|border.glass' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` matched both required rows.
- `grep 'map.style.light\|map.style.dark' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | wc -l` returned `2`.
- `grep 'sizing.stroke' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | wc -l` returned `3`.
- `rg -n 'radius\.|opacity\.|size\.(touch-min|control|avatar)|space\.(0|1|2|3|4|5|6|7|8|9|10|11|12)|size\.icon-(xs|sm|md|lg|xl)|Legacy-Theme Dependencies' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` matched the newly-expanded drift families and legacy dependency section.
- `git diff --name-only HEAD^ HEAD` returned only `.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md`.

Scope note
- The checkpoint remains documentation-only; no production Swift or Kotlin files were modified.
