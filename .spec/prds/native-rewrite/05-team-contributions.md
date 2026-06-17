# Team Contributions

## Phase 1: Architecture

**Contributors**: engineering-manager, product-manager

### Findings
- Target structure matches Storywright: 4 application folders at root level
- Convex backend moves to `convex/` — requires updating working directory for all `npx convex` commands
- React Native app moves to `react-native/` — requires updating all npm scripts, Expo config, and import paths
- `android/` and `ios/` are empty placeholders with README files only

### Key Decision
- Keep root-level config minimal — delegate to subdirectory package.json / build files
- Root Makefile is the single source of truth for "how do I run things"

---

## Phase 2: Feasibility

**Contributors**: engineering-manager, ui-designer

### Findings
- Expo supports running from a subdirectory with correct `package.json` and `app.json` placement
- Convex CLI supports `--project-dir` flag to specify project root
- Husky hooks run from git root but can `cd` into subdirectories
- No known blockers for this restructure
