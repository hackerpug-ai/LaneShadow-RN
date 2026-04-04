/**
 * Test helpers for creating complete overlay objects
 * These helpers create valid overlay objects with all required fields
 */

import type { RouteOverlays } from '../models/saved-routes'

/**
 * Create a minimal valid RainOverlay
 */
export const createRainOverlay = (levels: Array<'none' | 'light' | 'moderate' | 'heavy' | 'unavailable'>): RouteOverlays['rain'] => ({
  generatedAt: Date.now(),
  modelVersion: 'test-v1',
  legend: [
    { level: 'none', label: 'No rain' },
    { level: 'light', label: 'Light rain' },
    { level: 'moderate', label: 'Moderate rain' },
    { level: 'heavy', label: 'Heavy rain' },
    { level: 'unavailable', label: 'Unavailable' },
  ],
  byLeg: [
    {
      legIndex: 0,
      segments: levels.map((level, index) => ({
        startMeters: index * 1000,
        endMeters: (index + 1) * 1000,
        level,
        probability: level === 'none' ? 0 : level === 'light' ? 0.3 : level === 'moderate' ? 0.6 : 0.9,
      })),
    },
  ],
})

/**
 * Create a minimal valid WindOverlay
 */
export const createWindOverlay = (levels: Array<'low' | 'moderate' | 'high' | 'unavailable'>): RouteOverlays['wind'] => ({
  generatedAt: Date.now(),
  modelVersion: 'test-v1',
  legend: [
    { level: 'low', label: 'Low wind' },
    { level: 'moderate', label: 'Moderate wind' },
    { level: 'high', label: 'High wind' },
    { level: 'unavailable', label: 'Unavailable' },
  ],
  byLeg: [
    {
      legIndex: 0,
      segments: levels.map((level, index) => ({
        startMeters: index * 1000,
        endMeters: (index + 1) * 1000,
        level,
        reason: level === 'high' ? 'Strong gusts expected' : undefined,
      })),
    },
  ],
})

/**
 * Create a minimal valid TemperatureOverlay
 */
export const createTemperatureOverlay = (levels: Array<'cold' | 'mild' | 'warm' | 'hot' | 'unavailable'>): RouteOverlays['temperature'] => ({
  generatedAt: Date.now(),
  modelVersion: 'test-v1',
  legend: [
    { level: 'cold', label: 'Cold', range: { min: -Infinity, max: 10, unit: '°C' } },
    { level: 'mild', label: 'Mild', range: { min: 10, max: 25, unit: '°C' } },
    { level: 'warm', label: 'Warm', range: { min: 25, max: 32, unit: '°C' } },
    { level: 'hot', label: 'Hot', range: { min: 32, max: Infinity, unit: '°C' } },
    { level: 'unavailable', label: 'Unavailable' },
  ],
  byLeg: [
    {
      legIndex: 0,
      segments: levels.map((level, index) => ({
        startMeters: index * 1000,
        endMeters: (index + 1) * 1000,
        level,
        temperatureCelsius: level === 'cold' ? 5 : level === 'mild' ? 20 : level === 'warm' ? 28 : 35,
      })),
    },
  ],
})

/**
 * Create a minimal valid empty overlay
 */
export const createEmptyOverlays = (): RouteOverlays => ({
  rain: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [],
    byLeg: [],
  },
  wind: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [],
    byLeg: [],
  },
  temperature: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [],
    byLeg: [],
  },
})
