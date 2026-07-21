/**
 * REDHAT-FIX-12 (v3): two-object provenance contract (closes the MEDIUM finding,
 * review 2026-07-21T005254Z).
 *
 * A generated sentinel cannot byte-equal its own carrying commit SHA (editing the
 * file to contain a SHA changes that SHA — a fixed point with no solution). So
 * the provenance contract is TWO objects, verified by relation rather than
 * equality:
 *   - attested_source_commit = the internal `git rev-parse HEAD` at generation
 *     time (the reviewed code/evidence commit), recorded by the writer;
 *   - attestation_commit     = the sentinel's OWN last-touch commit (the commit
 *     that carries the generated sentinel);
 * and the verifier requires attestation_commit to be a STRICT descendant of
 * attested_source_commit: `git merge-base --is-ancestor S A` succeeds AND
 * S != A. Self-equality, ancestor-inversion, or unrelated commits are rejected
 * with PROVENANCE_RELATION_INVALID.
 */

import {
  gitHeadInternal,
  gitLastCommit,
  gitMergeBaseIsAncestor,
  gitShowHead,
  toRepoRel,
} from './gitUtils'

export interface ProvenanceOk {
  ok: true
  attested_source_commit: string
  attestation_commit: string
  relation: 'strict_descendant'
}

export interface ProvenanceInvalid {
  ok: false
  code: 'PROVENANCE_RELATION_INVALID'
  details: {
    reason: string
    attested_source_commit: string | null
    attestation_commit: string | null
  }
}

export type ProvenanceResult = ProvenanceOk | ProvenanceInvalid

interface SentinelFile {
  generator?: { attested_source_commit?: string }
}

/**
 * Verify the provenance of a committed sentinel. Reads attested_source_commit
 * from the sentinel's HEAD blob (never the working tree) and attestation_commit
 * from the sentinel's own last-touch commit.
 */
export function verifyProvenance(sentinelPath: string, cwd: string): ProvenanceResult {
  const sentinelRel = toRepoRel(sentinelPath, cwd)
  const headBlob = gitShowHead(sentinelRel, cwd)
  let attested: string | null = null
  try {
    if (headBlob) {
      const parsed = JSON.parse(headBlob) as SentinelFile
      attested = parsed.generator?.attested_source_commit ?? null
    }
  } catch {
    attested = null
  }
  const attestation = gitLastCommit(sentinelRel, cwd) || null
  const _head = gitHeadInternal(cwd)

  const invalid = (reason: string): ProvenanceInvalid => ({
    ok: false,
    code: 'PROVENANCE_RELATION_INVALID',
    details: { reason, attested_source_commit: attested, attestation_commit: attestation },
  })

  if (!attested || !attestation) return invalid('missing_provenance_object')
  // Self-equality is the impossible/forged relation — explicitly rejected.
  if (attested === attestation) return invalid('self_equal')
  // attestation_commit must be a STRICT descendant of attested_source_commit.
  if (!gitMergeBaseIsAncestor(attested, attestation, cwd)) return invalid('not_ancestor')
  return {
    ok: true,
    attested_source_commit: attested,
    attestation_commit: attestation,
    relation: 'strict_descendant',
  }
}

/** Convenience: true iff `descendant` is a strict descendant of `ancestor`. */
export function isStrictDescendant(ancestor: string, descendant: string, cwd: string): boolean {
  return ancestor !== descendant && gitMergeBaseIsAncestor(ancestor, descendant, cwd)
}
