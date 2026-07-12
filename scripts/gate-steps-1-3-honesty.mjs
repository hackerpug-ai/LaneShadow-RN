/**
 * Human Testing Gate steps 1–3 honesty evaluator (REDHAT-FIX-003 / H3).
 */

import { createHash } from 'node:crypto'

const PLACEHOLDER_CMD = 'npx convex run ...'

export function cmdSha(literalCmd) {
  if (!literalCmd || literalCmd.trim() === PLACEHOLDER_CMD) {
    return null
  }
  return createHash('sha256').update(literalCmd.trim()).digest('hex').slice(0, 16)
}

export function commandClass(literalCmd) {
  if (!literalCmd) return 'unknown'
  if (literalCmd.includes('curatedGeometryReconstruct:reconstructForRoute')) {
    return 'reconstructForRoute'
  }
  if (literalCmd.includes('curatedGeometryReconstruct:getVerificationForRoute')) {
    return 'getVerificationForRoute'
  }
  if (literalCmd.includes('curatedGeometryReconstruct:getRouteForReading')) {
    return 'getRouteForReading'
  }
  return 'other'
}

export function evaluateGateSteps1to3Honesty(plan) {
  const reasons = []
  const steps = (plan.steps ?? []).filter((s) => s.n >= 1 && s.n <= 3)
  if (steps.length < 3) {
    reasons.push('gate-plan must define steps 1, 2, and 3')
  }

  const byN = Object.fromEntries(steps.map((s) => [s.n, s]))
  const step1 = byN[1]
  const step2 = byN[2]
  const step3 = byN[3]

  const step1Cmd = step1?.literal_cmd ?? ''
  if (!step1Cmd.includes('curatedGeometryReconstruct:reconstructForRoute')) {
    reasons.push('step 1 must invoke curatedGeometryReconstruct:reconstructForRoute')
  }
  if (step1Cmd.includes('getVerificationForRoute') && !step1Cmd.includes('reconstructForRoute')) {
    reasons.push('step 1 is residual verification re-read only (re-read theatre)')
  }

  const allVerificationOnly = [step1, step2, step3].every(
    (s) =>
      s?.literal_cmd?.includes('getVerificationForRoute') &&
      !s?.literal_cmd?.includes('reconstructForRoute'),
  )
  if (allVerificationOnly) {
    reasons.push('re-read theatre: steps 1–3 only getVerificationForRoute')
  }

  const sha1 = cmdSha(step1?.literal_cmd)
  const sha2 = cmdSha(step2?.literal_cmd)
  const sha3 = cmdSha(step3?.literal_cmd)

  if (sha1 && sha2 && sha1 === sha2) {
    reasons.push('shared cmd_sha between steps 1 and 2')
  }
  if (sha1 && sha3 && sha1 === sha3) {
    reasons.push('shared cmd_sha between steps 1 and 3')
  }
  if (sha2 && sha3 && sha2 === sha3) {
    reasons.push('shared cmd_sha between steps 2 and 3')
  }

  if (commandClass(step1?.literal_cmd) !== 'reconstructForRoute') {
    reasons.push('step 1 command class must be reconstructForRoute')
  }

  return {
    verdict: reasons.length === 0 ? 'pass' : 'fail',
    reasons,
  }
}
