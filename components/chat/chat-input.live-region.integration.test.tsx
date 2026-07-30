/**
 * S6-T3 AC-4 / TC-4 — accessibilityLiveRegion polite on pill container
 *
 * Inspect production ChatInput: chat-input-suggestion-chips carries
 * accessibilityLiveRegion='polite'; discovery-empty-honest and
 * discovery-fallback-national each have non-empty accessibilityLabel.
 */

import { render, screen } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_SEMANTIC } from '../../test-helpers/mock-semantic'

vi.mock('react-native-paper', () => ({
  Icon: () => null,
  Text: ({ children }: { children?: any }) => children,
}))

vi.mock('../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: MOCK_SEMANTIC }),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))

describe('S6-T3 AC-4: chat-input live region', () => {
  it('TC-4: polite live region + non-empty a11y labels on captions', async () => {
    const { ChatInput } = await import('./chat-input')

    // Empty-thin caption path
    const emptyRender = render(
      <ChatInput
        onSend={vi.fn()}
        onCancel={vi.fn()}
        state={{ phase: 'IDLE', sessionId: null } as any}
        isPlanning={false}
        suggestions={['no routes near you yet']}
      />,
    )

    const chipsEmpty = emptyRender.getByTestId('chat-input-suggestion-chips')
    expect(chipsEmpty.props.accessibilityLiveRegion).toBe('polite')
    expect(chipsEmpty.props.accessibilityLiveRegion).not.toBe('assertive')

    const honest = emptyRender.getByTestId('discovery-empty-honest')
    expect(honest.props.accessibilityLabel).toBeTruthy()
    expect(String(honest.props.accessibilityLabel).length).toBeGreaterThan(0)
    emptyRender.unmount()

    // Fallback national path
    const fallbackRender = render(
      <ChatInput
        onSend={vi.fn()}
        onCancel={vi.fn()}
        onSelectRoute={vi.fn()}
        state={{ phase: 'IDLE', sessionId: null } as any}
        isPlanning={false}
        suggestions={[
          "No routes nearby — here's our top-rated",
          { routeId: 'route-1', label: 'Cherohala Skyway' },
        ]}
      />,
    )

    const chipsFallback = fallbackRender.getByTestId('chat-input-suggestion-chips')
    expect(chipsFallback.props.accessibilityLiveRegion).toBe('polite')

    const fallback = fallbackRender.getByTestId('discovery-fallback-national')
    expect(fallback.props.accessibilityLabel).toBeTruthy()
    expect(String(fallback.props.accessibilityLabel).length).toBeGreaterThan(0)

    // MUST_NOT_OBSERVE assertive anywhere on the container
    expect(
      screen.queryByTestId('chat-input-suggestion-chips')?.props.accessibilityLiveRegion,
    ).not.toBe('assertive')
  })
})
