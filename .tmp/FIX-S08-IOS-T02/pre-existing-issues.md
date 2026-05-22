# Pre-Existing Issues Blocking Clean Verification

## TypeScript / Native Typecheck
- `pnpm type-check:native` fails in untouched server Convex files such as `server/convex/http.ts`, `server/convex/semanticSearch.ts`, and other `server/convex/_generated` imports missing from this worktree.

## Lint
- `pnpm exec biome check --no-errors-on-unmatched` fails on unrelated HTML accessibility issues under `logos/preview.html` and `logos/v2/preview.html`.

## iOS Tests
- `IdleScreenWiringTests.idleScreenRendersSprintGreetingHeadlineForTodayScope()` fails in an untouched assertion path (`Search did not find a match`) when the full `IdleScreenWiringTests` suite is executed.
- The task-relevant new forwarding assertion `idleScreenSubmitSuggestionForwardsCurrentLocationWhenAvailable()` passed in the same suite run.

These issues were observed outside the files changed for FIX-S08-IOS-T02.
