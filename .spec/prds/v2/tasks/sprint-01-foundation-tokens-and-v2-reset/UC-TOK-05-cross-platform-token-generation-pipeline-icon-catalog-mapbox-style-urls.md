<!-- Task Template v5.1 | INFRA-adapted for sandbox/token foundation work -->

================================================================================
TASK: UC-TOK-05 - Cross-platform token generation pipeline + icon catalog + Mapbox style URLs
================================================================================

TASK_TYPE:  INFRA
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     XL
SPRINT:     [sprint-01-foundation-tokens-and-v2-reset](./SPRINT.md)
AGENT:      implementer=shared-tooling (swift-planner + kotlin-planner) | reviewer=design-system-reviewer
ESTIMATE:   480 min

RUNTIME_COMMANDS:
  test:      pnpm test --filter tokens
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched tokens/

PRD_REFS:   UC-TOK-05, .spec/prds/v2/04-uc-tok.md, .spec/prds/v2/11-technical-requirements.md
DEPENDS_ON: UC-TOK-01, UC-TOK-02, UC-TOK-03, UC-TOK-04
BLOCKS:     (none)

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

tokens/scripts/generate.ts produces Swift, Kotlin, TypeScript tokens + SVG icon catalog + Mapbox style URL constants + font manifest; lefthook pre-commit runs validate + sync-check + icons:check.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER modify ~/Projects/native-theme/** or ~/Projects/native-sandbox/**.
- MUST emit to exact paths: tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift, tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt, tokens/platforms/web/tokens.ts.
- MUST emit Mapbox style URL constants + SVG icon catalog + font manifest as first-class pipeline outputs.
- MUST wire pnpm tokens:validate, pnpm tokens:sync-check, pnpm icons:check into lefthook pre-commit.
- STRICTLY generator is the ONLY writer of platform token files — hand-edits are forbidden and sync-check enforces this.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

[ ] pnpm tokens:generate produces all four outputs (Swift, Kotlin, TS, SVG catalog) — maps to AC-1 (PRIMARY)
[ ] pnpm tokens:sync-check exits 0 immediately after generate
[ ] pnpm icons:check validates SVG catalog against semantic/icons manifest
[ ] lefthook.yml pre-commit runs validate + sync-check + icons:check
[ ] Swift + Kotlin generated files compile under ios + android build
[ ] Only tokens/** + lefthook.yml modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: generate.ts emits all four platform outputs [PRIMARY]
  GIVEN: semantic tokens from TOK-01..04 committed
  WHEN:  pnpm tokens:generate runs
  THEN:  Tokens.swift, Tokens.kt, tokens.ts, SVG catalog, mapbox.ts constants, and font manifest are emitted to documented paths

  TDD_STATE:     none
  TEST_FILE:     tokens/scripts/generate.ts
  TEST_FUNCTION: n/a
  VERIFY:        pnpm tokens:generate && test -f tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift && test -f tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt && test -f tokens/platforms/web/tokens.ts && test -f tokens/platforms/web/mapbox.ts && test -d tokens/icons

AC-2: sync-check detects drift
  GIVEN: generated outputs committed, then a semantic token edited without regenerating
  WHEN:  pnpm tokens:sync-check runs
  THEN:  exits non-zero with a clear drift message

  TDD_STATE:     none
  TEST_FILE:     tokens/scripts/sync-check.ts
  TEST_FUNCTION: n/a
  VERIFY:        pnpm tokens:generate && git diff --quiet tokens/platforms && pnpm tokens:sync-check

AC-3: Generated Swift compiles under iOS build (edge)
  GIVEN: Tokens.swift emitted
  WHEN:  xcodebuild build runs
  THEN:  Tokens.swift compiles without errors

  TDD_STATE:     none
  TEST_FILE:     tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
  TEST_FUNCTION: n/a
  VERIFY:        xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build

AC-4: icons:check fails on missing SVG (error path)
  GIVEN: semantic icons manifest lists icon 'foo' but tokens/icons/foo.svg is missing
  WHEN:  pnpm icons:check runs
  THEN:  exits non-zero

  TDD_STATE:     none
  TEST_FILE:     tokens/scripts/icons-check.ts
  TEST_FUNCTION: n/a
  VERIFY:        node tokens/scripts/icons-check.ts --fixture tokens/__fixtures__/icons-missing.json || test $? -ne 0

AC-5: lefthook pre-commit wired
  GIVEN: lefthook.yml
  WHEN:  grep checks pre-commit hooks
  THEN:  tokens:validate, tokens:sync-check, icons:check all appear

  TDD_STATE:     none
  TEST_FILE:     lefthook.yml
  TEST_FUNCTION: n/a
  VERIFY:        grep -q 'tokens:validate' lefthook.yml && grep -q 'tokens:sync-check' lefthook.yml && grep -q 'icons:check' lefthook.yml


--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- tokens/scripts/generate.ts (NEW) — semantic → platform emitter
- tokens/scripts/sync-check.ts (NEW) — drift detector
- tokens/scripts/icons-check.ts (NEW) — SVG catalog validator
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift (NEW, generated)
- tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt (NEW, generated)
- tokens/platforms/web/tokens.ts (NEW, generated)
- tokens/platforms/web/mapbox.ts (NEW, generated) — Mapbox style URL constants
- tokens/icons/**.svg (NEW) — icon catalog
- tokens/semantic/icons.json (NEW) — icon manifest
- tokens/semantic/mapbox.tokens.json (NEW) — style URL tokens
- tokens/__fixtures__/icons-missing.json (NEW) — negative fixture
- lefthook.yml (MODIFY) — add pre-commit hooks
- package.json (MODIFY) — tokens:generate/sync-check/icons:check scripts

writeProhibited:
- ~/Projects/native-sandbox/** (never modify sibling projects)
- ~/Projects/native-theme/** (never modify sibling projects)
- ios/LaneShadow/** — iOS host consumes generated files via SPM path
- android/app/src/** — Android host consumes generated files via Gradle
- server/**, react-native/** — out of scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Generator is the ONLY writer of tokens/platforms/** — include a do-not-edit header
- Keep emitter deterministic so sync-check can diff reliably
- Validate tokens before generation — fail fast

⚠️ Ask First:
- Adding a new platform target beyond Swift/Kotlin/TS
- Changing emitted file paths (downstream iOS/Android hosts depend on them)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- tokens/scripts/generate.ts (NEW): emitter for Swift/Kotlin/TS/mapbox
- tokens/scripts/sync-check.ts (NEW): drift detector
- tokens/scripts/icons-check.ts (NEW): SVG catalog validator
- tokens/platforms/**/*.{swift,kt,ts} (NEW, generated): platform token outputs
- tokens/icons/*.svg + tokens/semantic/icons.json (NEW): icon catalog + manifest
- tokens/semantic/mapbox.tokens.json + tokens/platforms/web/mapbox.ts (NEW): Mapbox style URLs
- lefthook.yml (MODIFY): pre-commit wiring
- package.json (MODIFY): tokens:* scripts

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-05-pipeline.html [PRIMARY]
   - Lines: all
   - Focus: REQUIRED READING — pipeline architecture + emitted shapes
2. .spec/prds/v2/04-uc-tok.md
   - Lines: UC-TOK-05
   - Focus: acceptance criteria + output paths
3. .spec/prds/v2/11-technical-requirements.md
   - Lines: pipeline section
   - Focus: integration expectations with lefthook
4. ~/Projects/native-theme/README.md
   - Lines: all
   - Focus: primitive shapes generator must emit to
5. lefthook.yml
   - Lines: all
   - Focus: current hook structure

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References:
- /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-05-pipeline.html

Interaction notes:
- REQUIRED READING: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-05-pipeline.html

Pattern (to imitate):
```
// Tokens.swift emitted with do-not-edit header
// GENERATED by tokens/scripts/generate.ts — do not edit by hand
public enum Tokens { public static let spacing: [Int: CGFloat] = [0: 0, 1: 4, 2: 8 /* ... */] }
```

Pattern source: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-05-pipeline.html

Anti-pattern (to avoid):
Emitting files without a do-not-edit header; non-deterministic ordering (breaks sync-check); hand-editing generated files after generation.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

INFRA pipeline task — build generator, emit outputs, wire hooks, verify iOS + Android compile against generated code, commit.

### IMPLEMENTATION STEPS (INFRA — run in order)

1. 1. Read uc-tok-05-pipeline.html for emitted shapes
2. 2. Implement generate.ts loading + merging semantic token files
3. 3. Implement Swift emitter (TypographyStyle + ColorSet + dimensions + motion)
4. 4. Implement Kotlin emitter (Compose Typography/Colors/Animations)
5. 5. Implement TypeScript emitter + Mapbox style URL constants
6. 6. Author icons/ SVG catalog + icons.json manifest + icons-check.ts
7. 7. Implement sync-check.ts (re-run generate into temp dir, diff)
8. 8. Wire package.json scripts + lefthook.yml pre-commit
9. 9. Run xcodebuild + gradle to confirm generated files compile
10. 10. Commit

### VERIFICATION CHECKLIST

- [ ] all outputs emitted
    - Command: `pnpm tokens:generate && ls tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt tokens/platforms/web/tokens.ts tokens/platforms/web/mapbox.ts`
    - Expected: all present
- [ ] sync-check green post-generate
    - Command: `pnpm tokens:generate && pnpm tokens:sync-check`
    - Expected: Exit 0
- [ ] icons catalog validates
    - Command: `pnpm icons:check`
    - Expected: Exit 0
- [ ] lefthook wired
    - Command: `grep -E 'tokens:(validate|sync-check)|icons:check' lefthook.yml | wc -l`
    - Expected: >= 3
- [ ] iOS compiles with generated Swift
    - Command: `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build`
    - Expected: Exit 0
- [ ] Android compiles with generated Kotlin
    - Command: `cd android && ./gradlew :app:compileDebugKotlin`
    - Expected: Exit 0

--------------------------------------------------------------------------------
VERIFICATION GATES (run before declaring DONE)
--------------------------------------------------------------------------------

- **Tokens validate** — `pnpm tokens:validate` → Exit 0
- **Sync-check clean** — `pnpm tokens:sync-check` → Exit 0
- **Icons check** — `pnpm icons:check` → Exit 0
- **Typecheck** — `pnpm type-check:native` → Exit 0
- **Lint** — `pnpm exec biome check --no-errors-on-unmatched tokens/` → no errors
- **iOS build** — `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build` → Exit 0
- **Android compile** — `cd android && ./gradlew :app:compileDebugKotlin` → Exit 0

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

Implementer: **shared-tooling (swift-planner + kotlin-planner)**
Rationale: Pipeline must emit Swift, Kotlin, TypeScript, SVG catalog, Mapbox constants, and font manifest from a single source — highest-integration task in the sprint.
Reviewer: **design-system-reviewer**

--------------------------------------------------------------------------------
CODING STANDARDS
--------------------------------------------------------------------------------

- /Users/justinrich/Projects/LaneShadow/CLAUDE.md
- /Users/justinrich/Projects/LaneShadow/RULES.md
- ~/Projects/native-sandbox/RULES.md
- ~/Projects/native-theme/README.md
- ~/.claude/CLAUDE.md (commit discipline)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

Depends on TOK-01..04 semantic tokens. This task closes the sprint by wiring the whole pipeline into lefthook — any regression caught pre-commit going forward.
