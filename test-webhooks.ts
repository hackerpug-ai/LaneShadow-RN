/**
 * WorkOS Webhook Test Script
 * Tests all webhook types with proper signature generation
 */

import crypto from 'crypto'

// Configuration
const WEBHOOK_URL = 'https://enchanted-bobcat-288.convex.site/webhooks/workos'
const WEBHOOK_SECRET = '1zcZL5keP0HtfLqlfsr38WfEb' // From your env vars

/**
 * Generate WorkOS webhook signature
 * Format: t=timestamp, v1=signature
 */
function generateWorkOSSignature(payload: string, secret: string): string {
  const timestamp = Date.now()
  const signedPayload = `${timestamp}.${payload}`
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
  return `t=${timestamp}, v1=${signature}`
}

/**
 * Send a webhook to the endpoint
 */
async function sendWebhook(eventType: string, payload: any) {
  const body = JSON.stringify(payload)
  const signature = generateWorkOSSignature(body, WEBHOOK_SECRET)

  console.log(`\n🧪 Testing: ${eventType}`)

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'workos-signature': signature,
      },
      body,
    })

    if (response.ok) {
      console.log(`   ✅ SUCCESS (${response.status})`)
    } else {
      const errorText = await response.text()
      console.log(`   ❌ FAILED (${response.status} ${response.statusText})`)
      console.log(`   Error: ${errorText}`)
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
  }
}

/**
 * Test payloads for different webhook types
 */

// 1. Organization Created
const organizationCreated = {
  id: 'event_test_org_created',
  event: 'organization.created',
  created_at: new Date().toISOString(),
  data: {
    id: 'org_test_12345',
    object: 'organization',
    name: 'Test School',
    domains: [
      {
        domain: 'testschool.edu',
        state: 'verified',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 2. Organization Updated
const organizationUpdated = {
  id: 'event_test_org_updated',
  event: 'organization.updated',
  created_at: new Date().toISOString(),
  data: {
    id: 'org_test_12345',
    object: 'organization',
    name: 'Test School (Updated)',
    domains: [
      {
        domain: 'testschool.edu',
        state: 'verified',
      },
    ],
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 3. User Created
const userCreated = {
  id: 'event_test_user_created',
  event: 'user.created',
  created_at: new Date().toISOString(),
  data: {
    id: 'user_test_67890',
    object: 'user',
    email: 'test.teacher@testschool.edu',
    email_verified: true,
    first_name: 'Test',
    last_name: 'Teacher',
    profile_picture_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 4. User Updated
const userUpdated = {
  id: 'event_test_user_updated',
  event: 'user.updated',
  created_at: new Date().toISOString(),
  data: {
    id: 'user_test_67890',
    object: 'user',
    email: 'test.teacher@testschool.edu',
    email_verified: true,
    first_name: 'Test',
    last_name: 'Teacher-Updated',
    profile_picture_url: 'https://example.com/photo.jpg',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 5. Organization Membership Created
const membershipCreated = {
  id: 'event_test_membership_created',
  event: 'organization_membership.created',
  created_at: new Date().toISOString(),
  data: {
    id: 'om_test_membership_123',
    object: 'organization_membership',
    user_id: 'user_test_67890',
    organization_id: 'org_test_12345',
    status: 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 6. Organization Membership Updated
const membershipUpdated = {
  id: 'event_test_membership_updated',
  event: 'organization_membership.updated',
  created_at: new Date().toISOString(),
  data: {
    id: 'om_test_membership_123',
    object: 'organization_membership',
    user_id: 'user_test_67890',
    organization_id: 'org_test_12345',
    status: 'inactive' as const,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 7. Organization Deleted (includes full object data)
const organizationDeleted = {
  id: 'event_test_org_deleted',
  event: 'organization.deleted',
  created_at: new Date().toISOString(),
  data: {
    id: 'org_test_12345',
    object: 'organization',
    name: 'Test School (Updated)',
    domains: [
      {
        domain: 'testschool.edu',
        state: 'verified',
      },
    ],
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
}

// 8. User Deleted (includes full object data)
const userDeleted = {
  id: 'event_test_user_deleted',
  event: 'user.deleted',
  created_at: new Date().toISOString(),
  data: {
    id: 'user_test_67890',
    object: 'user',
    email: 'test.teacher@testschool.edu',
    email_verified: true,
    first_name: 'Test',
    last_name: 'Teacher-Updated',
    profile_picture_url: 'https://example.com/photo.jpg',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
}

// 9. Organization Membership Deleted (includes full object data)
const membershipDeleted = {
  id: 'event_test_membership_deleted',
  event: 'organization_membership.deleted',
  created_at: new Date().toISOString(),
  data: {
    id: 'om_test_membership_123',
    object: 'organization_membership',
    user_id: 'user_test_67890',
    organization_id: 'org_test_12345',
    status: 'inactive' as const,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting WorkOS Webhook Tests')
  console.log('Webhook URL:', WEBHOOK_URL)
  console.log('='.repeat(80))

  // Test in PROGRESSIVE order (critical for DB dependencies):
  // 1. CREATE entities first (org → user → membership)
  // 2. UPDATE entities
  // 3. DELETE entities (membership → user → org, reverse order)
  await sendWebhook('organization.created', organizationCreated)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('user.created', userCreated)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization_membership.created', membershipCreated)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization.updated', organizationUpdated)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('user.updated', userUpdated)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization_membership.updated', membershipUpdated)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization_membership.deleted', membershipDeleted)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('user.deleted', userDeleted)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization.deleted', organizationDeleted)

  console.log('\n' + '='.repeat(80))
  console.log('✅ All webhook tests completed!')
}

// Run tests
runAllTests().catch(console.error)
