/**
 * REDHAT-FIX-12 (v3) + REDHAT-FIX-18: immutable HEAD-bound evidence-manifest
 * verification with canonical 1..8 step-set completeness.
 *
 * Closes the red-hat CRITICAL findings (review 2026-07-21T005254Z):
 *   - the manifest and every enumerated artifact are resolved from immutable
 *     HEAD-bound content (`git show HEAD:<path>` + working-tree-blob-hash vs
 *     HEAD-blob-hash byte-equality), NEVER a working-tree `readFileSync`;
 *   - freshness is checked PER-FILE (each required file's OWN last-touch commit
 *     == internal HEAD), so an unrelated file newly committed under the bundle
 *     directory can no longer launder a stale manifest/artifact
 *     (EVIDENCE_FILE_STALE);
 *   - a dirty/staged manifest or artifact is rejected (MANIFEST_NOT_HEAD_BOUND);
 *   - artifact paths are contained within the bundle via realpath
 *     canonicalization BEFORE any tracking check, so a `../../package.json`
 *     escape is rejected even though that file is tracked (ARTIFACT_PATH_ESCAPE).
 *
 * REDHAT-FIX-18: evidence_steps must cover exactly the committed gate-plan.json
 * steps[].n set (canonical 1..8). Incomplete / extra keys fail closed with
 * INCOMPLETE_EVIDENCE_STEPS so a 1-step all-PASS bundle cannot substantiate
 * full gate completeness.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  containedRealpath,
  gitBlobHashHead,
  gitBlobHashWorkingTree,
  gitLastCommit,
  gitShowHead,
  gitTracked,
  toRepoRel,
} from './gitUtils'

export interface ManifestStep {
  result: string
  artifacts: string[]
}

export interface EvidenceManifest {
  version: number
  evidence_steps: Record<string, ManifestStep>
}

export type ManifestErrorCode =
  | 'MISSING_EVIDENCE_MANIFEST'
  | 'MANIFEST_NOT_HEAD_BOUND'
  | 'EVIDENCE_FILE_STALE'
  | 'ARTIFACT_PATH_ESCAPE'
  | 'INCOMPLETE_EVIDENCE_STEPS'

export interface ManifestError {
  ok: false
  code: ManifestErrorCode
  details: {
    reason: string
    file?: string
    step?: number
    artifact?: string
    missing?: number[]
    extra?: number[]
    capturedCommit: string
    headCommit: string
  }
}

export type ManifestResult =
  | { ok: true; manifest: EvidenceManifest; artifactPaths: string[] }
  | ManifestError

const MANIFEST_REL = 'manifest.json'

/** Committed gate-plan path (read-only expected step set source). FIX-20 owns path rewrite. */
export const GATE_PLAN_REL =
  '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json'

/**
 * Load the fixed expected step IDs (in plan order) from committed gate-plan.json.
 * Prefers cwd-relative plan (so temp test repos with a seeded plan work); falls
 * back to the plan next to this package's project root. Returns [] only when
 * no plan is readable (callers fail closed on empty).
 */
export function loadGatePlanExpectedSteps(cwd: string): number[] {
  const candidates = [
    join(cwd, GATE_PLAN_REL),
    // tools/gate → repo root
    join(dirname(__dirname), '..', GATE_PLAN_REL),
  ]
  for (const p of candidates) {
    if (!existsSync(p)) continue
    try {
      const raw = JSON.parse(readFileSync(p, 'utf-8')) as {
        steps?: Array<{ n?: number }>
      }
      if (!raw?.steps || !Array.isArray(raw.steps)) continue
      const ids = raw.steps
        .map((s) => (typeof s?.n === 'number' ? s.n : NaN))
        .filter((n) => Number.isFinite(n))
      if (ids.length > 0) return ids
    } catch {
      // try next candidate
    }
  }
  return []
}

function parseManifest(content: string): EvidenceManifest | null {
  try {
    const raw = JSON.parse(content) as Partial<EvidenceManifest>
    if (
      raw &&
      typeof raw === 'object' &&
      raw.evidence_steps &&
      typeof raw.evidence_steps === 'object'
    ) {
      return { version: raw.version ?? 1, evidence_steps: raw.evidence_steps }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Compare evidence_steps keys against the canonical expected set.
 * Order of object keys is ignored; missing or extra step IDs fail closed.
 */
export function validateEvidenceStepsCompleteness(
  evidenceSteps: Record<string, ManifestStep>,
  expected: number[],
): { ok: true } | { ok: false; missing: number[]; extra: number[] } {
  const present = new Set(
    Object.keys(evidenceSteps)
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n)),
  )
  const expectedSet = new Set(expected)
  const missing = expected.filter((n) => !present.has(n))
  const extra = [...present].filter((n) => !expectedSet.has(n)).sort((a, b) => a - b)
  if (missing.length > 0 || extra.length > 0) {
    return { ok: false, missing, extra }
  }
  return { ok: true }
}

/**
 * Verify the evidence manifest and every enumerated artifact against the
 * internal HEAD. Returns the HEAD-bound manifest on success.
 */
export function verifyEvidenceManifest(
  bundlePath: string,
  head: string,
  cwd: string,
): ManifestResult {
  const bundleRel = toRepoRel(bundlePath, cwd)
  const manifestRepoRel = `${bundleRel}/${MANIFEST_REL}`.replace(/\/+/g, '/')
  const manifestWtPath = join(bundlePath, MANIFEST_REL)

  // 1. The manifest must exist as a HEAD blob (committed content of record).
  const headContent = gitShowHead(manifestRepoRel, cwd)
  if (!headContent) {
    return {
      ok: false,
      code: 'MISSING_EVIDENCE_MANIFEST',
      details: {
        reason: 'manifest_not_in_head',
        capturedCommit: gitLastCommit(bundlePath, cwd),
        headCommit: head,
      },
    }
  }
  // 2. Dirty check: the working-tree manifest must byte-equal the HEAD blob.
  const wtHash = gitBlobHashWorkingTree(manifestWtPath, cwd)
  const headHash = gitBlobHashHead(manifestRepoRel, cwd)
  if (headHash && wtHash && wtHash !== headHash) {
    return {
      ok: false,
      code: 'MANIFEST_NOT_HEAD_BOUND',
      details: {
        reason: 'dirty_working_tree',
        file: MANIFEST_REL,
        capturedCommit: gitLastCommit(manifestRepoRel, cwd),
        headCommit: head,
      },
    }
  }
  // 3. Per-file freshness: the manifest's OWN last-touch commit == HEAD.
  const manifestTouch = gitLastCommit(manifestRepoRel, cwd)
  if (manifestTouch !== head) {
    return {
      ok: false,
      code: 'EVIDENCE_FILE_STALE',
      details: {
        reason: 'file_not_at_head',
        file: MANIFEST_REL,
        capturedCommit: manifestTouch,
        headCommit: head,
      },
    }
  }

  const manifest = parseManifest(headContent)
  if (!manifest) {
    return {
      ok: false,
      code: 'MISSING_EVIDENCE_MANIFEST',
      details: { reason: 'manifest_unparseable', capturedCommit: manifestTouch, headCommit: head },
    }
  }

  const artifactPaths: string[] = []
  // 4. For every enumerated artifact: containment FIRST, then tracked + dirty +
  //    per-file freshness. Containment uses realpath canonicalization and runs
  //    BEFORE any gitTracked call (a `../` escape is rejected even if tracked).
  //    REDHAT-FIX-18 completeness runs AFTER these checks so path-escape /
  //    freshness / dirty-tree rejections are never masked.
  for (const [stepN, entry] of Object.entries(manifest.evidence_steps)) {
    const artifacts = Array.isArray(entry?.artifacts) ? entry.artifacts : []
    for (const art of artifacts) {
      const candidateAbs = join(bundlePath, art)
      const contained = containedRealpath(bundlePath, candidateAbs)
      if (contained === null) {
        return {
          ok: false,
          code: 'ARTIFACT_PATH_ESCAPE',
          details: {
            reason: 'artifact_outside_bundle',
            step: Number(stepN),
            artifact: art,
            capturedCommit: manifestTouch,
            headCommit: head,
          },
        }
      }
      const artRepoRel = toRepoRel(candidateAbs, cwd)
      if (gitTracked(artRepoRel, cwd).length === 0) {
        return {
          ok: false,
          code: 'EVIDENCE_FILE_STALE',
          details: {
            reason: 'artifact_untracked',
            step: Number(stepN),
            file: artRepoRel,
            capturedCommit: '',
            headCommit: head,
          },
        }
      }
      const artWtHash = gitBlobHashWorkingTree(candidateAbs, cwd)
      const artHeadHash = gitBlobHashHead(artRepoRel, cwd)
      if (artHeadHash && artWtHash && artWtHash !== artHeadHash) {
        return {
          ok: false,
          code: 'MANIFEST_NOT_HEAD_BOUND',
          details: {
            reason: 'dirty_working_tree',
            step: Number(stepN),
            file: artRepoRel,
            capturedCommit: gitLastCommit(artRepoRel, cwd),
            headCommit: head,
          },
        }
      }
      const artTouch = gitLastCommit(artRepoRel, cwd)
      if (artTouch !== head) {
        return {
          ok: false,
          code: 'EVIDENCE_FILE_STALE',
          details: {
            reason: 'file_not_at_head',
            step: Number(stepN),
            file: artRepoRel,
            capturedCommit: artTouch,
            headCommit: head,
          },
        }
      }
      artifactPaths.push(artRepoRel)
    }
  }

  // 5. REDHAT-FIX-18: evidence_steps must be exactly the canonical gate-plan
  //    set (typically 1..8). A 1-step all-PASS subset fails closed — only after
  //    FIX-12 path/freshness/dirty checks so those seams stay unweakened.
  const expectedSteps = loadGatePlanExpectedSteps(cwd)
  if (expectedSteps.length === 0) {
    return {
      ok: false,
      code: 'INCOMPLETE_EVIDENCE_STEPS',
      details: {
        reason: 'gate_plan_expected_steps_unreadable',
        file: MANIFEST_REL,
        missing: [],
        extra: [],
        capturedCommit: manifestTouch,
        headCommit: head,
      },
    }
  }
  const completeness = validateEvidenceStepsCompleteness(manifest.evidence_steps, expectedSteps)
  if (!completeness.ok) {
    return {
      ok: false,
      code: 'INCOMPLETE_EVIDENCE_STEPS',
      details: {
        reason: 'evidence_steps_not_canonical_set',
        file: MANIFEST_REL,
        missing: completeness.missing,
        extra: completeness.extra,
        capturedCommit: manifestTouch,
        headCommit: head,
      },
    }
  }

  return { ok: true, manifest, artifactPaths }
}
