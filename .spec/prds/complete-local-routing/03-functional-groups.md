---
stability: FEATURE_SPEC
last_validated: 2026-04-09
prd_version: 1.0.0
---

# Functional Groups

## Overview

Complete Local Routing is organized into **4 functional groups** that deliver offline routing capability while preserving existing LaneShadow functionality.

## Functional Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| **Map Foundation** | MAP | Core Mapbox SDK integration, MapView rendering, camera controls, and theme-aware styling |
| **Offline Management** | OFF | Offline region download, progress tracking, storage management, and user interface |
| **Route Calculation** | RTE | Offline route calculation, waypoint support, provider-agnostic storage, and Convex integration |
| **Weather & UI** | WUI | Weather overlay implementation, mini-map components, polyline rendering, and performance optimization |
| **Progressive Enrichment** | PE | Background weather fetching, progressive UI states, and enrichment status tracking |

## Use Case Summary

| Group | Use Cases | Total |
|-------|-----------|-------|
| MAP | 5 | 5 |
| OFF | 6 | 6 |
| RTE | 4 | 4 |
| WUI | 4 | 4 |
| PE | 3 | 3 |
| **Total** | | **22** |

## Group Details

### MAP: Map Foundation

**Deliverables:**
- @rnmapbox/maps SDK installation and configuration
- MapView wrapper component with theme support
- Camera positioning and controls
- Marker and shape rendering
- Coordinate system integration

**Dependencies:** None (foundational)

### OFF: Offline Management

**Deliverables:**
- Offline region download interface
- Progress tracking UI
- Region storage management
- Download queue system
- Storage limit handling
- User education for offline features

**Dependencies:** MAP (requires MapView)

### RTE: Route Calculation

**Deliverables:**
- Offline route calculation API
- Waypoint routing support
- Route caching and replay
- Provider-agnostic storage schema
- Convex mutations and queries

**Dependencies:** MAP (requires MapView), OFF (requires offline data)

### MIG: Feature Migration

**Deliverables:**
- Weather overlay rendering migration
- RouteMiniMap component migration
- Polyline coordinate conversion
- Performance optimization
- Feature flag integration

**Dependencies:** MAP (requires MapView), RTE (requires route data)

### WUI: Weather & UI

**Deliverables:**
- Weather overlay rendering using Mapbox ShapeSource
- RouteMiniMap component for route cards
- Polyline coordinate conversion
- Performance optimization (batching, LOD)
- Camera animations and fit-to-bounds

**Dependencies:** MAP (requires MapView), RTE (requires route data)

### PE: Progressive Enrichment

**Deliverables:**
- Weather enrichment background job scheduling
- Progressive loading states for route cards
- WeatherBadgeSkeleton component for loading states
- EnrichmentStatusIndicator integration
- Enrichment phase tracking (pending → weather → partial → complete)
- Background job retry logic with exponential backoff
- Progressive enhancement toast notifications

**Dependencies:** RTE (requires route data), MIG (requires weather rendering)
