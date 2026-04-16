---
stability: FEATURE_SPEC
last_validated: 2026-04-15
prd_version: 1.0.0
functional_group: RESTR
---

# Use Cases: Repo Restructure (RESTR)

| ID | Title | Description |
|----|-------|-------------|
| UC-RESTR-01 | Convex to Server | Move convex/ into server/convex/ with all tooling intact |
| UC-RESTR-02 | RN App to react-native/ | Move entire React Native/Expo app into react-native/ folder |
| UC-RESTR-03 | Placeholder Directories | Create android/ and ios/ placeholder directories |
| UC-RESTR-04 | Root Makefile | Create Makefile with cross-platform dev commands |
| UC-RESTR-05 | Config Updates | Update all config files, imports, and scripts for new paths |
| UC-RESTR-06 | Verification | Verify app runs and Convex deploys from new locations |

---

## UC-RESTR-01: Convex to Server

Move the `convex/` directory into `server/convex/` with all backend tooling intact.

### Acceptance Criteria
- ☐ Developer can run `npx convex dev` from `server/` and it connects to the deployment
- ☐ Developer can run `npx convex deploy` from `server/` and it pushes all functions
- ☐ All Convex functions, schema, and generated files are in `server/convex/`
- ☐ `convex/_generated/` auto-regenerates correctly from `server/` working directory
- ☐ Any Convex-related scripts (seed, migration, etc.) work from `server/`

---

## UC-RESTR-02: RN App to react-native/

Move the entire React Native/Expo application into `react-native/` folder.

### Acceptance Criteria
- ☐ Developer can run `npx expo start` from `react-native/` and the app launches
- ☐ Developer can run `npx expo run:ios` from `react-native/` and the iOS simulator builds
- ☐ Developer can run `npx expo run:android` from `react-native/` and the Android emulator builds
- ☐ All app screens, components, hooks, and providers work identically
- ☐ All tests pass when run from `react-native/`
- ☐ TypeScript compilation succeeds from `react-native/`
- ☐ ESLint runs correctly from `react-native/`

---

## UC-RESTR-03: Placeholder Directories

Create `android/` and `ios/` placeholder directories for future native apps.

### Acceptance Criteria
- ☐ `android/` directory exists with a README.md describing its future purpose
- ☐ `ios/` directory exists with a README.md describing its future purpose
- ☐ Neither directory contains build artifacts or dependencies
- ☐ `.gitignore` entries exist for both directories

---

## UC-RESTR-04: Root Makefile

Create root Makefile with cross-platform dev commands matching Storywright pattern.

### Acceptance Criteria
- ☐ `make react-native:dev` starts the Expo dev server from `react-native/`
- ☐ `make server:dev` starts Convex dev from `server/`
- ☐ `make dev` starts both react-native and server concurrently
- ☐ `make react-native:test` runs tests from `react-native/`
- ☐ `make server:test` runs Convex tests from `server/`
- ☐ `make clean` cleans build artifacts across all folders

---

## UC-RESTR-05: Config Updates

Update all configuration files for the new directory structure.

### Acceptance Criteria
- ☐ Root `CLAUDE.md` references `react-native/`, `server/`, `android/`, `ios/` paths
- ☐ `.gitignore` at root covers all subdirectory patterns
- ☐ `.husky/` pre-commit hooks work from root with correct working directories
- ☐ `package.json` at root (if any) delegates to subdirectories
- ☐ EAS config (`eas.json`) references correct project root
- ☐ Convex auth config references correct deployment URL
- ☐ Environment files (`.env`, `.env.local`) are in the correct subdirectories

---

## UC-RESTR-06: Verification

Verify the entire app works identically after restructure.

### Acceptance Criteria
- ☐ Developer can run the full pre-commit hook (typecheck + lint + convex build) successfully
- ☐ Developer can sign in and use all app features with no regressions
- ☐ Developer can deploy Convex functions from `server/`
- ☐ All existing tests pass with no failures
- ☐ No broken imports or file-not-found errors anywhere in the codebase
