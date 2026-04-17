import { describe, it, expect } from 'vitest'
import {
  mapClerkMembership,
  mapClerkOrg,
  mapClerkUser,
  shouldSkipWebhookUpdate,
} from '../db/clerkSync'

describe('mapClerkUser', () => {
  it('maps primary email and name', () => {
    const mapped = mapClerkUser({
      id: 'user_1',
      email_addresses: [
        { id: 'primary', email_address: 'primary@example.com' },
        { id: 'secondary', email_address: 'secondary@example.com' },
      ],
      primary_email_address_id: 'primary',
      first_name: 'Ada',
      last_name: 'Lovelace',
      created_at: 10,
      updated_at: 20,
    })

    expect(mapped).toMatchObject({
      clerkUserId: 'user_1',
      email: 'primary@example.com',
      name: 'Ada Lovelace',
      createdAt: 10,
      updatedAt: 20,
      lastLocalUpdateAt: 20,
    })
  })
})

describe('mapClerkOrg', () => {
  it('maps org data', () => {
    const mapped = mapClerkOrg({
      id: 'org_1',
      name: 'Acme',
      slug: 'acme',
      image_url: 'http://example.com/logo.png',
      created_at: 1,
      updated_at: 2,
    })

    expect(mapped).toMatchObject({
      clerkOrgId: 'org_1',
      name: 'Acme',
      slug: 'acme',
      imageUrl: 'http://example.com/logo.png',
      createdAt: 1,
      updatedAt: 2,
      lastLocalUpdateAt: 2,
    })
  })
})

describe('mapClerkMembership', () => {
  it('maps membership data', () => {
    const mapped = mapClerkMembership({
      data: {
        id: 'mem_1',
        organization_id: 'org_1',
        role: 'admin',
        created_at: 5,
        updated_at: 6,
      },
      userId: 'u1' as any,
      orgId: 'o1' as any,
    })

    expect(mapped).toMatchObject({
      clerkMembershipId: 'mem_1',
      role: 'admin',
      createdAt: 5,
      updatedAt: 6,
      userId: 'u1',
      orgId: 'o1',
    })
  })
})

describe('shouldSkipWebhookUpdate', () => {
  it('skips when local timestamp is newer', () => {
    expect(shouldSkipWebhookUpdate(200, 100)).toBe(true)
  })

  it('applies when webhook is newer', () => {
    expect(shouldSkipWebhookUpdate(100, 200)).toBe(false)
  })
})
