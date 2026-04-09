---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-09
prd_version: 1.0.0
---

# Complete Local Routing for LaneShadow

## Product Description

Complete On-Device Routing enables LaneShadow's AI-native motorcycle ride planner to calculate and display routes without requiring an internet connection. By migrating from Google Maps API to Mapbox SDK with @rnmapbox/maps, this feature eliminates recurring API costs (~$1,500/month → $15/month) while preserving all existing functionality including weather overlays, mini-maps, and copper-accented dark-first theme styling.

**Product Context:** LaneShadow is an AI-native motorcycle ride planner — map-first, conversation-driven. Tagline: "Ride the Moment" — turn a feeling into a road. Platforms: iOS and Android (React Native + Expo). Aesthetic: Rugged, industrial-warm, copper-accented, dark-first.

## Problem Statement

**Current State:**
- LaneShadow depends on Google Maps Directions API for all route calculations
- Monthly cost of ~$1,500 at 1,000 routes/day becomes prohibitive at scale
- Routes cannot be calculated without internet connection
- Adventure riders stranded in remote areas with no cell service
- Urban riders lose GPS in parking garages and tunnels
- Vendor lock-in to Google's polyline format and API infrastructure

**Impact:**
- Business scaling constrained by routing costs
- Poor user experience for motorcycle riders in areas with spotty coverage
- Safety concerns when routing fails in remote mountain terrain
- No ability to operate offline during service outages
- Technical debt from tight coupling to Google ecosystem

## Solution Summary

Migrate to Mapbox SDK with @rnmapbox/maps to enable:

1. **True Offline Routing** - Calculate routes without internet using downloaded map regions
2. **Safety for Remote Riders** - Adventure riders can navigate mountains with confidence
3. **Cost Reduction** - 99% reduction in routing costs ($1,500 → $15/month)
4. **Preserved UX** - Maintain copper-accented dark theme, weather overlays, mini-maps
5. **Proven Technology** - Mapbox used by BMW, The Weather Channel, and other enterprises
6. **React Native Compatible** - No native modules required, works with Expo

**Technical Approach:**
- Implement Mapbox SDK with @rnmapbox/maps
- Offline region download management (50MB for cities, 800MB for mountain regions)
- Weather overlay rendering using Mapbox ShapeSource
- Progressive enrichment (weather, leg labels, AI descriptions)
- Provider-agnostic route storage in Convex

**Timeline:** 8-10 weeks
**Team:** 1 React Native developer
