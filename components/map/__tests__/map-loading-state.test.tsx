import { render } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { describe, expect, it } from 'vitest'
import { getMapLoadingPalette, MapLoadingState, type MapLoadingTheme } from '../map-loading-state'

const THEMES: MapLoadingTheme[] = ['light', 'dark']

describe('MapLoadingState', () => {
  it('renders a map-specific loading canvas instead of a generic spinner', () => {
    const { getByLabelText, getByTestId, getByText } = render(<MapLoadingState />)

    expect(getByLabelText('Loading map')).toBeTruthy()
    expect(getByTestId('map-loading-state-sheet')).toBeTruthy()
    expect(getByTestId('map-loading-state-route')).toBeTruthy()
    expect(getByTestId('map-loading-state-beacon')).toBeTruthy()
    expect(getByText('Drawing the map')).toBeTruthy()
  })

  it.each(THEMES)('uses the %s map palette', (theme) => {
    const testID = `map-loading-${theme}`
    const { getByTestId } = render(<MapLoadingState theme={theme} testID={testID} />)
    const palette = getMapLoadingPalette(theme)

    const rootStyle = StyleSheet.flatten(getByTestId(testID).props.style)
    const statusStyle = StyleSheet.flatten(getByTestId(`${testID}-status`).props.style)

    expect(rootStyle.backgroundColor).toBe(palette.background)
    expect(statusStyle.backgroundColor).toBe(palette.statusBg)
    expect(statusStyle.borderColor).toBe(palette.statusBorder)
  })
})
