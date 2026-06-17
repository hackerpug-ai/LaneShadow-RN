declare module '@mapbox/polyline' {
  export function decode(encoded: string, precision?: number): [number, number][]
  export function encode(
    coordinates: [number, number][] | { lat: number; lng: number }[],
    precision?: number,
  ): string
}
