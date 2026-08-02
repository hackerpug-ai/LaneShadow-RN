# Task for convex-reviewer

ADVERSARIAL REMEDIATION VERIFICATION — read-only. Do NOT modify any file.

Context: Sprint 04 "trust pipeline" of a React-Native + Convex route-quality app. Two prior red-hat reviews found the gate closeout was FORGED (deterministic test seam injected into the live waterfall, forgeable couch verdicts, ungated fixtures, approval that bypassed the canonical gate). 11 REDHAT-FIX remediation tasks were implemented. Your job: independently and adversarially verify whether each is GENUINELY resolved in the current code, or whether a residual forgeability/bypass/stub remains.

Repo: /Users/inference1/Projects/LaneShadow-RN (cwd). HEAD commit: b2499228. Read convex/_generated/ai/guidelines.md first for Convex correctness rules.

The 11 REDHAT-FIX spec files (each cites the exact code locations to inspect) live in:
.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-01-*.md through REDHAT-FIX-11-*.md

For EACH of the 11 fixes, inspect the cited code at HEAD and verdict it:
- RESOLVED — the forgeability/bypass is genuinely closed, with the specific code evidence (file:line).
- PARTIAL — partially closed; name exactly what remains exploitable.
- NOT-RESOLVED — the original exploit still works; show the exact call path.

Scrutinize hardest (these are the trust-critical ones) and try to construct a concrete exploit for each:
- FIX-01: can a production closeout identity (e.g. subject 's4-human-gate' or a real Clerk user) still inject lever2FixedGeometry / simulateRateLimitFailures / skipSleep into runSampleWaterfall or retryDisposition? Check convex/waterfallOrchestrator.ts (runSampleWaterfall handler), convex/reviewQueue.ts (retryDisposition), convex/guards.ts (assertTestSubjectOrThrow + TEST_SUBJECT_PREFIXES). Is the test-prefix gate bypassable (e.g. a real user whose subject happens to start with 'dev-' or 'test:')? Are there OTHER entry points to the deterministic seam (reconstructForRouteWithFixedGeometry) not gated?
- FIX-03/04/10: can recordCouchVerdict still forge a PASS without a real immutable sample manifest? Check convex/couchVerdict.ts + convex/couchSampleAssembler.ts. Can membership be spoofed (missing/extra/duplicate routes)? Is the manifest hash truly immutable/bound? Can a non-founder record a pass?
- FIX-05: can approveDisposition still forge verdict='pass'/riderReady=true on gate-FAILING geometry? Check convex/reviewQueue.ts (evaluateApprovalCandidate + approveDisposition). Does it truly re-run the canonical gate?
- FIX-06: are requireFounder/requireOperator real server-owned role checks (not client-supplied)? Check convex/guards.ts. Is there any operational mutation still using a weaker requireIdentity?
- FIX-08: are ALL fixture/cleanup seams (seedWaterfallFixtures, seedReviewQueueEntry, seedCostBurnRoutes, teardown*, couchSampleAssembler fixtures) gated to operator/founder or test-prefix? Can an authenticated non-operator manufacture or erase trust evidence?
- FIX-02/09/11: weaker priority, but check classifyCatalog pagination/checkpoint completeness, waterfall durable terminal-state/fail-closed cost, and freeway rescue-first evidence.

ALSO hunt for any NEW issue you find (not in the original 11) that would let trust evidence be forged, bypassed, or manufactured.

Output: a per-fix verdict table (FIX | verdict | evidence file:line | residual exploit if any), then a short list of any NEW findings, then an overall statement: are the 11 REDHAT-FIX items genuinely resolved at HEAD, yes or no (with caveats)? Be skeptical and concrete — do not trust test-pass counts or commit messages; read the actual code paths.

## Acceptance Contract
Acceptance level: attested
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Return concrete findings with file paths and severity when applicable

Required evidence: review-findings, residual-risks

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```