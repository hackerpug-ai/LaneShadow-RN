# Deprecated

`.spec/tasks/` is a legacy archive.

Do not create new task files here.
Do not treat this directory as the active source of truth for planning or execution.

Current contract:
- PRDs live under `.spec/prd/{feature-name}/`
- Active tasks live under `.spec/prd/{feature-name}/tasks/`
- `/kb-project-plan` writes to the PRD's sibling `tasks/` directory
- `/kb-run-epic` executes from the PRD's sibling `tasks/` directory

This directory remains only to preserve historical artifacts until they are migrated or archived elsewhere.
