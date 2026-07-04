import { render } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
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

describe('ChatInput suggestion pills', () => {
  it('renders curated route icon inline with the route text', async () => {
    const { ChatInput } = await import('./chat-input')

    const { getByTestId } = render(
      <ChatInput
        onSend={vi.fn()}
        onCancel={vi.fn()}
        onSelectRoute={vi.fn()}
        state={{ phase: 'IDLE', sessionId: null } as any}
        isPlanning={false}
        suggestions={[{ routeId: 'muir-woods', label: 'Muir Woods Road · 11mi' }]}
      />,
    )

    const pill = getByTestId('discovery-suggestion-pill-muir-woods')
    const style = StyleSheet.flatten(pill.props.style)

    expect(style.flexDirection).toBe('row')
    expect(style.alignItems).toBe('center')
  })
})
