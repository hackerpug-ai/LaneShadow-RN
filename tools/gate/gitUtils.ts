/**
 * REDHAT-FIX-12 (v3): shared git utilities for the gate-evidence tools.
 *
 * All HEAD/tracking/content resolution is INTERNAL — never caller-supplied.
 * Symlink-safe (macOS /var ↔ /private/var) via realpathish so pathspecs resolve
 * identically inside tsx children (process.cwd() resolves symlinks; caller
 * absolute paths from mkdtemp may not).
 */

import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { isAbsolute, resolve as pathResolve, relative, sep } from 'node:path'

export function git(args: string[], cwd: string): string {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

/** Internal, authoritative current HEAD. Never overridable by the caller. */
export function gitHeadInternal(cwd: string): string {
  return git(['rev-parse', 'HEAD'], cwd)
}

/** Resolve symlinks when present (macOS /var -> /private/var) for consistent relative(). */
export function realpathish(p: string): string {
  try {
    return realpathSync(p)
  } catch {
    return p
  }
}

/** Normalize an absolute-or-relative path to a repo-relative posix pathspec. */
export function toRepoRel(absOrRel: string, cwd: string): string {
  if (!isAbsolute(absOrRel)) return absOrRel.split(/[\\/]/).join('/')
  const rel = relative(realpathish(cwd), realpathish(absOrRel))
  return rel.split(/[\\/]/).join('/')
}

/** Tracked paths under `path` (empty ⇒ untracked). */
export function gitTracked(path: string, cwd: string): string[] {
  const rel = toRepoRel(path, cwd)
  const out = git(['ls-files', '--', rel], cwd)
  return out ? out.split('\n').filter(Boolean) : []
}

/** Latest commit that touched `path` (its "captured commit"). */
export function gitLastCommit(path: string, cwd: string): string {
  const rel = toRepoRel(path, cwd)
  return git(['log', '-1', '--format=%H', '--', rel], cwd)
}

/** HEAD-blob content of a repo-relative path (`git show HEAD:<path>`). */
export function gitShowHead(repoRel: string, cwd: string): string {
  const posixRel = repoRel.split(/[\\/]/).join('/')
  return git(['show', `HEAD:${posixRel}`], cwd)
}

/** Working-tree blob hash of a path (`git hash-object <path>`). */
export function gitBlobHashWorkingTree(path: string, cwd: string): string {
  return git(['hash-object', path], cwd)
}

/** HEAD blob hash of a repo-relative path (`git rev-parse HEAD:<path>`). */
export function gitBlobHashHead(repoRel: string, cwd: string): string {
  const posixRel = repoRel.split(/[\\/]/).join('/')
  return git(['rev-parse', `HEAD:${posixRel}`], cwd)
}

/** True iff `ancestor` is an ancestor of `descendant` (exit 0). */
export function gitMergeBaseIsAncestor(ancestor: string, descendant: string, cwd: string): boolean {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return true
  } catch {
    return false
  }
}

/**
 * Containment: does `candidateAbs` resolve (lexically + via realpath) to a path
 * inside `dirAbs`? Rejects `..` and symlink escapes. Returns the canonical
 * resolved path on success, or null if it escapes.
 */
export function containedRealpath(dirAbs: string, candidateAbs: string): string | null {
  const dirReal = realpathish(dirAbs)
  const lex = pathResolve(dirAbs, candidateAbs) // normalizes ..
  const lexReal = realpathish(lex)
  const inside = (p: string): boolean => p === dirReal || p.startsWith(`${dirReal}${sep}`)
  if (inside(lexReal)) return lexReal
  if (inside(lex)) return lex
  return null
}
