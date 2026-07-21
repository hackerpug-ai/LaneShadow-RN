/**
 * REDHAT-FIX-12 (v3): immutable HEAD-bound evidence-manifest verification.
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
 */

import { join } from 'node:path'
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

export interface ManifestError {
  ok: false
  code: ManifestErrorCode
  details: {
    reason: string
    file?: string
    step?: number
    artifact?: string
    capturedCommit: string
    headCommit: string
  }
}

export type ManifestResult =
  | { ok: true; manifest: EvidenceManifest; artifactPaths: string[] }
  | ManifestError

const MANIFEST_REL = 'manifest.json'

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

  return { ok: true, manifest, artifactPaths }
}
