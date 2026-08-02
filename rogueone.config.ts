import { defineRogueoneConfig } from 'rogueone/config'

/**
 * rogueone project config — LaneShadow RN (Expo/React Native + Convex).
 *
 * Written by /ro-init 2026-08-01. Every value below traces to a detected fact
 * or an explicit operator answer; nothing here was inferred from a template.
 *
 * NOTE ON MODELS: rogueone accepts any non-empty model string and never
 * verifies it against the provider. A typo surfaces at first dispatch, not at
 * config load.
 */
export default defineRogueoneConfig({
  // Operator choice: Grok Composer writes the code. The exact string matches
  // what is already in use on this machine (RULES.md kb-skills-config and the
  // rogueone repo's own config both run grok-composer-2.5-fast).
  defaults: { harness: 'grok', model: 'grok-composer-2.5-fast' },

  /**
   * Governance identities recorded on commits and review verdicts. Operator
   * chose the React Native-led set, matching RULES.md listing React Native
   * iOS/Android as the Primary platform. All three resolve to a real
   * agent.md under $ROGUEONE_AGENT_ROOT/agents/.
   *
   * The three handles MUST stay distinct. That is enforced in code, not by a
   * config toggle: src/gov/record-verdict.ts refuses a verdict whose reviewer
   * principal equals the implementer principal, and clause-set.ts carries the
   * distinct_reviewer iron gate. One human holds all three via +alias emails
   * that route to the same inbox.
   */
  principals: {
    implementer: {
      handle: 'react-native-ui-implementer',
      git_name: 'Justin Rich',
      git_email: 'justin@hackerpug.com',
    },
    reviewer: {
      handle: 'react-native-ui-reviewer',
      git_name: 'Justin Rich (review)',
      git_email: 'justin+review@hackerpug.com',
    },
    maintainer: {
      handle: 'integrator',
      git_name: 'Justin Rich (maintain)',
      git_email: 'justin+maintain@hackerpug.com',
    },
  },

  roles: {
    // There is no harness/model key on `implementer` itself — the schema is
    // .strict() and targets live under byLanguage. This repo is TypeScript
    // throughout (Expo/RN app + Convex backend + shared/ + tokens/).
    implementer: {
      persistSession: true,
      byLanguage: {
        typescript: { harness: 'grok', model: 'grok-composer-2.5-fast' },
      },
    },
    // Operator choice: review runs on a different harness AND a different model
    // family from the implementer, so the approval gate is independent by
    // construction rather than by convention.
    reviewer: {
      persistSession: false,
      harness: 'opencode',
      model: 'deepseek/deepseek-v4-pro',
    },
    // Operator choice: same leaf as the implementer. Worth knowing the tradeoff
    // — RED shares the implementer's blind spots, so the independence in this
    // pipeline comes from the reviewer above, not from the test author.
    red: {
      persistSession: false,
      harness: 'grok',
      model: 'grok-composer-2.5-fast',
    },
  },

  holdout: { storeRoot: '~/.rogueone/holdout' },

  /**
   * ADR 0003 — project-wide gates, run concurrently for trunk/seal.
   *
   * Operator chose the full honest set. Measured state at init (2026-08-01):
   *   pnpm type-check       PASS (exit 0)
   *   pnpm lint             FAIL — 9 biome errors (+264 warnings)
   *   pnpm exec vitest run  FAIL — 79 of 354 files, 218 of 2566 tests, ~5.5min
   *   npx convex dev --once PASS (exit 0, ~12s)
   *
   * So this project is RED at init by deliberate choice: nothing can ACHIEVE or
   * seal to trunk until the lint and test debt is paid. That is the intended
   * behavior, not a misconfiguration.
   *
   * `npx convex dev --once` is the project's real build gate (RULES.md
   * Verification table; lefthook runs it pre-push). Note it DEPLOYS to the dev
   * Convex deployment as a side effect — concurrent worktrees running this gate
   * share one dev deployment and can race. Raise `concurrency` below only with
   * that in mind.
   *
   * Maestro flows under .maestro/ are deliberately NOT here: they need a booted
   * simulator and a dev build, so they cannot run as a concurrent headless gate.
   */
  verifications: ['pnpm type-check', 'pnpm lint', 'pnpm exec vitest run', 'npx convex dev --once'],

  /**
   * File-scoped RED→GREEN base. Argv = this command + the task's test_files.
   *
   * `pnpm test` is NOT usable here — package.json maps it to bare `vitest`,
   * which is watch mode and never exits. This command names vitest, so rogueone
   * classifies it as vitest-shaped: name filters (verification.filter / -t) are
   * legal, and the min_tests count floor is parsed from the vitest summary line.
   */
  test_command: 'pnpm exec vitest run',

  dispatch: {
    maxRetries: 1,
    // 30 min. Deliberately well above the usual 5-min default: RN + Convex tasks
    // routinely run long, and a positive ceiling means a genuinely hung leaf is
    // killed and surfaces as a diagnosable dispatch_timeout event. timeoutMs: 0
    // would remove the ceiling entirely — a hang would then present as an
    // indefinite stall with no timeout signal for /ro-doctor to match.
    timeoutMs: 1_800_000,
  },

  governance: {
    maxMergeReviewCycles: 2,
    maxRemediationCycles: 2,
    maxVerdictParseRetries: 1,
  },

  concurrency: 1,

  // The reviewer model is provider-scoped (deepseek/…). Harmless at
  // concurrency: 1; it becomes load-bearing if concurrency is ever raised. A
  // provider's soft rate limit maps to auth_cap, which is classified never
  // transient and fails closed with ZERO retries — capping in-flight dispatches
  // is the way to avoid tripping it, retries are not.
  providers: { deepseek: { maxInFlight: 1 } },

  /**
   * Dual-lens review AND-gate — both lenses must APPROVE.
   *
   * These entries declare HOW to review, never WHO. There is no `agent` key
   * (retired in 494177e3; the schema is .strict() so a stale one fails the whole
   * config). The specialist that runs each lens is derived per dispatch from the
   * task's own brain_agent — e.g. a task assigned convex-implementer is reviewed
   * by convex-reviewer; react-native-ui-implementer by react-native-ui-reviewer.
   * Both of those -reviewer agents were verified present on disk at init, so
   * neither domain silently degrades to the code-reviewer fallback.
   *
   * sticky: 'hold' on the specs lens — it re-verifies deterministically from the
   * specs, so an unrelated commit does not invalidate what it judged. The diff
   * lens is left at the default 'fresh': its entire basis is the diff, so a new
   * commit invalidates that review by definition.
   */
  reviewers: [
    { lens: 'product', packet: { content: 'specs', report: 'informed' }, sticky: 'hold' },
    { lens: 'technical', packet: { content: 'diff', report: 'blind' } },
  ],

  /**
   * Domain → specialist map discovered from RULES.md "Agent Dispatch", recorded
   * for /ro-sprint-tasks-plan to consume as each task's brain_agent. ro-init
   * does NOT assign per-task agents — but since the reviewer is derived from
   * brain_agent, this map is what actually decides review quality.
   *
   *   convex           implement=convex-implementer           review=convex-reviewer           ✓
   *   react-native-ui  implement=react-native-ui-implementer  review=react-native-ui-reviewer  ✓
   *
   * Planning agents (convex-planner, planner) are dispatched by the planning
   * skills, not wired here.
   */

  observability: {
    project_id: 'laneshadow-rn',
    agent_intel: {
      ensure_global_sessions: true,
      // device_id intentionally omitted — the global config at
      // ~/.rogueone/rogueone.config.ts stamps 'justins-mbp-2' for this machine.
      // Setting it here would collide across machines on a shared repo.
    },
  },
})
