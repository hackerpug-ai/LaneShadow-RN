# Pre-Existing Issues

## Backend Type Check Failures (NOT caused by CHAT-S04-T09a)

**Issue**: The pre-commit hook runs `pnpm type-check:native` which includes backend Convex codegen files that are missing (`_generated/dataModel`, `_generated/api`, `_generated/server`).

**Evidence**:
- Error manifests in hook output: `Cannot find module '../_generated/dataModel'`
- Errors span 150+ files in `convex/` directory
- These are pre-existing generation failures unrelated to iOS task

**Scope**: 
- CHAT-S04-T09a is iOS-only (no backend changes)
- iOS verification commands all pass (tests, build, lint)
- Backend codegen is a prerequisite for main branch and out of scope for this remediation task

**Task-Specific Verification** (all passing):
- ✅ `xcodebuild ... test -only-testing:LaneShadowTests/ChatStoreReconciliationTests` → Exit 0, 8 tests passed
- ✅ `xcodebuild ... build -quiet ONLY_ACTIVE_ARCH=YES` → Exit 0
- ✅ `swiftformat --lint ios/LaneShadow/Services/ChatStore.swift ...` → Exit 0, 0 files require formatting

**Recommendation**: 
Run `pnpm server:codegen` to regenerate Convex types before attempting full-repo commit to main.
