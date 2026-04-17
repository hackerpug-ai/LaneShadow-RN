import { describe, expect, it } from 'vitest'

// AC-1: routePlanValidator exports a valid v.object() shape with all required fields
describe('routePlanValidator', () => {
  it('exports routePlanValidator with all required fields', async () => {
    const { routePlanValidator } = await import('../route-plans.js')
    expect(routePlanValidator).toBeDefined()
    expect(routePlanValidator.kind).toBe('object')
    const fields = routePlanValidator.fields
    expect(fields.clerkUserId).toBeDefined()
    expect(fields.planInput).toBeDefined()
    expect(fields.status).toBeDefined()
    expect(fields.createdAt).toBeDefined()
    expect(fields.updatedAt).toBeDefined()
  })
})

// AC-2: ROUTE_PLAN_STATUS constant and RoutePlanStatus type cover all five statuses
describe('ROUTE_PLAN_STATUS', () => {
  it('exports all five status values', async () => {
    const { ROUTE_PLAN_STATUS } = await import('../route-plans.js')
    expect(ROUTE_PLAN_STATUS.PENDING).toBe('pending')
    expect(ROUTE_PLAN_STATUS.RUNNING).toBe('running')
    expect(ROUTE_PLAN_STATUS.COMPLETED).toBe('completed')
    expect(ROUTE_PLAN_STATUS.FAILED).toBe('failed')
    expect(ROUTE_PLAN_STATUS.CANCELLED).toBe('cancelled')
  })
})

// AC-3: routePlanStatusValidator accepts valid values and rejects invalid ones
describe('routePlanStatusValidator', () => {
  it('accepts all valid status literals', async () => {
    const { routePlanStatusValidator } = await import('../route-plans.js')
    expect(routePlanStatusValidator.kind).toBe('union')
    // All five literals should be members
    const members = routePlanStatusValidator.members.map((m: { value: string }) => m.value)
    expect(members).toContain('pending')
    expect(members).toContain('running')
    expect(members).toContain('completed')
    expect(members).toContain('failed')
    expect(members).toContain('cancelled')
  })
})

// AC-4: optional fields on routePlanValidator are truly optional (v.optional)
describe('routePlanValidator optional fields', () => {
  it('marks optional fields as optional', async () => {
    const { routePlanValidator } = await import('../route-plans.js')
    const fields = routePlanValidator.fields
    // v.optional wraps its inner validator and sets isOptional: 'optional'
    expect(fields.startLabel?.isOptional).toBe('optional')
    expect(fields.endLabel?.isOptional).toBe('optional')
    expect(fields.statusMessage?.isOptional).toBe('optional')
    expect(fields.result?.isOptional).toBe('optional')
    expect(fields.errorCode?.isOptional).toBe('optional')
    expect(fields.errorMessage?.isOptional).toBe('optional')
    expect(fields.scheduledActionId?.isOptional).toBe('optional')
    expect(fields.completedAt?.isOptional).toBe('optional')
  })
})
