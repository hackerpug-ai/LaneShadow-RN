/**
 * WorkOS Webhook Test Script - Role Changes
 * Tests organization membership webhooks with role data
 */

import crypto from 'node:crypto'

// Configuration
const WEBHOOK_URL = 'https://enchanted-bobcat-288.convex.site/webhooks/workos'
const WEBHOOK_SECRET = '1zcZL5keP0HtfLqlfsr38WfEb'

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
    } else {
      const _errorText = await response.text()
    }
  } catch (_error: any) {}
}

/**
 * Test payloads with role data
 */

// 1. Organization Created
const organizationCreated = {
  id: 'event_role_test_org_created',
  event: 'organization.created',
  created_at: new Date().toISOString(),
  data: {
    id: 'org_role_test_12345',
    object: 'organization',
    name: 'Role Test School',
    domains: [
      {
        domain: 'roletestschool.edu',
        state: 'verified',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 2. User Created
const userCreated = {
  id: 'event_role_test_user_created',
  event: 'user.created',
  created_at: new Date().toISOString(),
  data: {
    id: 'user_role_test_67890',
    object: 'user',
    email: 'role.test@roletestschool.edu',
    email_verified: true,
    first_name: 'Role',
    last_name: 'Test',
    profile_picture_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 3. Organization Membership Created - WITH ROLE
const membershipCreatedWithRole = {
  id: 'event_role_test_membership_created',
  event: 'organization_membership.created',
  created_at: new Date().toISOString(),
  data: {
    id: 'om_role_test_membership_123',
    object: 'organization_membership',
    user_id: 'user_role_test_67890',
    organization_id: 'org_role_test_12345',
    status: 'active' as const,
    // WorkOS sends role data with hyphens
    role: {
      slug: 'spectator', // Starting role
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 4. Organization Membership Updated - ROLE CHANGED TO LEAD_TEACHER
const membershipUpdatedToLeadTeacher = {
  id: 'event_role_test_membership_updated_lead',
  event: 'organization_membership.updated',
  created_at: new Date().toISOString(),
  data: {
    id: 'om_role_test_membership_123',
    object: 'organization_membership',
    user_id: 'user_role_test_67890',
    organization_id: 'org_role_test_12345',
    status: 'active' as const,
    // Changed role (WorkOS format with hyphens)
    role: {
      slug: 'lead-teacher', // Updated role
    },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 5. Organization Membership Updated - ROLE CHANGED TO ASSISTANT_TEACHER
const membershipUpdatedToAssistantTeacher = {
  id: 'event_role_test_membership_updated_asst',
  event: 'organization_membership.updated',
  created_at: new Date().toISOString(),
  data: {
    id: 'om_role_test_membership_123',
    object: 'organization_membership',
    user_id: 'user_role_test_67890',
    organization_id: 'org_role_test_12345',
    status: 'active' as const,
    // Changed role again (WorkOS format with hyphens)
    role: {
      slug: 'assistant-teacher', // Updated role
    },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 6. Alternative WorkOS format test - using roles array
const membershipUpdatedWithRolesArray = {
  id: 'event_role_test_membership_updated_array',
  event: 'organization_membership.updated',
  created_at: new Date().toISOString(),
  data: {
    id: 'om_role_test_membership_123',
    object: 'organization_membership',
    user_id: 'user_role_test_67890',
    organization_id: 'org_role_test_12345',
    status: 'active' as const,
    // Some WorkOS implementations might use a roles array
    roles: [
      {
        slug: 'lead-teacher',
      },
    ],
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 7. Test hyphenated role format (lead-teacher instead of lead_teacher)
const membershipUpdatedWithHyphenatedRole = {
  id: 'event_role_test_membership_hyphen',
  event: 'organization_membership.updated',
  created_at: new Date().toISOString(),
  data: {
    id: 'om_role_test_membership_123',
    object: 'organization_membership',
    user_id: 'user_role_test_67890',
    organization_id: 'org_role_test_12345',
    status: 'active' as const,
    // Test hyphenated format (WorkOS might send this)
    role: {
      slug: 'lead-teacher', // Hyphenated format
    },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 8. Test another hyphenated role format (assistant-teacher)
const membershipUpdatedWithHyphenatedAssistant = {
  id: 'event_role_test_membership_hyphen_asst',
  event: 'organization_membership.updated',
  created_at: new Date().toISOString(),
  data: {
    id: 'om_role_test_membership_123',
    object: 'organization_membership',
    user_id: 'user_role_test_67890',
    organization_id: 'org_role_test_12345',
    status: 'active' as const,
    // Test hyphenated format (WorkOS might send this)
    role: {
      slug: 'assistant-teacher', // Hyphenated format
    },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// 7. Cleanup
const membershipDeleted = {
  id: 'event_role_test_membership_deleted',
  event: 'organization_membership.deleted',
  created_at: new Date().toISOString(),
  data: {
    id: 'om_role_test_membership_123',
    object: 'organization_membership',
    user_id: 'user_role_test_67890',
    organization_id: 'org_role_test_12345',
    status: 'inactive' as const,
    role: {
      slug: 'assistant-teacher',
    },
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
}

const userDeleted = {
  id: 'event_role_test_user_deleted',
  event: 'user.deleted',
  created_at: new Date().toISOString(),
  data: {
    id: 'user_role_test_67890',
    object: 'user',
    email: 'role.test@roletestschool.edu',
    email_verified: true,
    first_name: 'Role',
    last_name: 'Test',
    profile_picture_url: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
}

const organizationDeleted = {
  id: 'event_role_test_org_deleted',
  event: 'organization.deleted',
  created_at: new Date().toISOString(),
  data: {
    id: 'org_role_test_12345',
    object: 'organization',
    name: 'Role Test School',
    domains: [
      {
        domain: 'roletestschool.edu',
        state: 'verified',
      },
    ],
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
}

/**
 * Run role change tests
 */
async function runRoleTests() {
  // 1. Create organization
  await sendWebhook('organization.created', organizationCreated)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 2. Create user
  await sendWebhook('user.created', userCreated)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization_membership.created', membershipCreatedWithRole)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization_membership.updated', membershipUpdatedToLeadTeacher)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization_membership.updated', membershipUpdatedToAssistantTeacher)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization_membership.updated', membershipUpdatedWithRolesArray)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization_membership.updated', membershipUpdatedWithHyphenatedRole)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization_membership.updated', membershipUpdatedWithHyphenatedAssistant)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization_membership.deleted', membershipDeleted)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('user.deleted', userDeleted)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await sendWebhook('organization.deleted', organizationDeleted)
}

// Run tests
runRoleTests().catch(console.error)
