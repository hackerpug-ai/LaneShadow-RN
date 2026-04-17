// Temporary stub so TypeScript can resolve the module before native deps are installed.
declare module 'react-native-maps'

// Stub for @mapbox/polyline which ships without bundled TypeScript declarations.
declare module '@mapbox/polyline' {
  const polyline: {
    decode(str: string, precision?: number): [number, number][]
    encode(coordinates: [number, number][], precision?: number): string
    fromGeoJSON(geojson: object, precision?: number): string
    toGeoJSON(str: string, precision?: number): object
  }
  export default polyline
}
