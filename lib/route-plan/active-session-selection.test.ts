import { describe, expect, it } from 'vitest'
import { resolveActiveChatSessionId } from './active-session-selection'

describe('resolveActiveChatSessionId', () => {
  it('returns null on cold open so old route sessions do not auto-render', () => {
    expect(
      resolveActiveChatSessionId({
        sessionIdParam: undefined,
        planningSessionId: null,
      }),
    ).toBeNull()
  })

  it('uses an explicit session param when the rider opens a session', () => {
    expect(
      resolveActiveChatSessionId({
        sessionIdParam: 'session-explicit',
        planningSessionId: null,
      }),
    ).toBe('session-explicit')
  })

  it('uses the newly-created planning session after the rider sends a message', () => {
    expect(
      resolveActiveChatSessionId({
        sessionIdParam: undefined,
        planningSessionId: 'session-new-message',
      }),
    ).toBe('session-new-message')
  })

  it('gives explicit URL selection precedence over an in-memory session', () => {
    expect(
      resolveActiveChatSessionId({
        sessionIdParam: 'session-from-drawer',
        planningSessionId: 'session-in-progress',
      }),
    ).toBe('session-from-drawer')
  })
})
