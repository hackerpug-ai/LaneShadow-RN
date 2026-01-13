import { parseAutocompletePredictions, parsePlaceDetails } from './use-place-autocomplete'

describe('use-place-autocomplete helpers', () => {
  it('parses autocomplete predictions', () => {
    const predictions = parseAutocompletePredictions({
      predictions: [
        {
          place_id: 'abc123',
          description: '123 Main St, City',
          structured_formatting: {
            main_text: '123 Main St',
            secondary_text: 'City',
          },
        },
      ],
    })

    expect(predictions).toHaveLength(1)
    expect(predictions[0]).toEqual({
      placeId: 'abc123',
      primaryText: '123 Main St',
      secondaryText: 'City',
      description: '123 Main St, City',
    })
  })

  it('parses place details', () => {
    const details = parsePlaceDetails({
      result: {
        place_id: 'abc123',
        name: '123 Main St',
        formatted_address: '123 Main St, City',
        geometry: {
          location: { lat: 12.34, lng: 56.78 },
        },
      },
    })

    expect(details).toEqual({
      lat: 12.34,
      lng: 56.78,
      label: '123 Main St',
      placeId: 'abc123',
    })
  })

  it('returns null when details are missing', () => {
    const details = parsePlaceDetails({ result: {} })
    expect(details).toBeNull()
  })
})
