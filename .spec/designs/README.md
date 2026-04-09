# LaneShadow UI Wireframes

This directory contains HTML wireframe designs for the LaneShadow Complete Local Routing feature. All wireframes are self-contained HTML files with inline CSS for portability.

## Design System References

All wireframes follow the LaneShadow design system as defined in `/styles/RULES.md`:

- **Theme**: Dark-first, copper-accented, industrial-warm aesthetic
- **Colors**: Semantic tokens only (no hardcoded values)
  - Primary: `#B87333` (Copper)
  - Secondary: `#1A1C1F` (Charcoal)
  - Success: `#31A362`
  - Warning: `#D98E04`
  - Danger: `#E35D6A`
  - Info: `#2B9AEB`
- **Typography**: Inter (body), Space Grotesk (display)
- **Spacing**: 4px grid system
- **Border Radius**: 4px, 8px, 12px, 16px, 24px, 32px
- **Elevation**: 6 levels (0-5), max 3 on map overlays

## Wireframe Files

### Phase 0: Shadow Setup (Onboarding)

| File | Use Case | Description |
|------|----------|-------------|
| `shadow-setup-welcome.html` | Phase 0 | Welcome screen with feature highlights |
| `shadow-setup-wifi.html` | Phase 0 | WiFi requirement check with connection detection |
| `shadow-setup-download.html` | Phase 0 | Model download progress with circular indicator |
| `shadow-setup-complete.html` | Phase 0 | Setup complete with confetti celebration |

**Key Interactions:**
- Hard gate: App cannot be used without model download
- WiFi requirement enforced (cellular downloads blocked)
- Progress updates every 5% (not every byte)
- Background download continues if user navigates away
- Download resumes if app is killed (state persisted)

### Offline Management (UC-OFF-01 through UC-OFF-05)

| File | Use Case | Description |
|------|----------|-------------|
| `offline-region-download.html` | UC-OFF-01 | Interactive region selection with map preview |
| `offline-download-progress.html` | UC-OFF-02 | Real-time download progress with stats |
| `offline-regions-list.html` | UC-OFF-03 | List of downloaded regions with metadata |
| `offline-delete-confirmation.html` | UC-OFF-04 | Delete confirmation with storage impact |
| `offline-storage-warning.html` | UC-OFF-05 | Insufficient storage warning with suggestions |

**Key Interactions:**
- Mapbox MapView with interactive region selection
- Resize handles for adjusting bounding box
- Storage validation before download
- Swipe actions for quick delete
- Menu for: Delete, Rename, View Details

### Route Planning (UC-RTE-02)

| File | Use Case | Description |
|------|----------|-------------|
| `route-planning-waypoints.html` | UC-RTE-02 | Route planning with waypoint management |

**Key Interactions:**
- Drag waypoints to reorder (⋮⋮ handle)
- Remove waypoints with ✕ button
- Add waypoint button opens search/location picker
- Supports up to 10 waypoints per route
- Offline mode banner shows when no connection

### Progressive Enrichment (UC-OFF-08)

| File | Use Case | Description |
|------|----------|-------------|
| `progressive-enrichment.html` | UC-OFF-08 | Progressive enhancement UI with stage indicators |

**Key Interactions:**
- Route displays immediately with leg labels (0.35s)
- Creative name appears when ready (1.2s)
- Rationale appears when ready (2.5s)
- Highlight tags appear when ready (3.9s)
- Status badge updates: partial → complete
- User can continue using app during enrichment
- Toast dismisses automatically when complete

## Viewing Wireframes

Open any HTML file in a web browser to view the wireframe. Each file is self-contained with inline CSS and requires no external dependencies.

## Annotations

Blue annotation boxes in the wireframes indicate:
- Use case references (e.g., "UC-OFF-01")
- Key interactions and behaviors
- Technical implementation notes
- Accessibility considerations

## Design Principles

All wireframes follow these principles:

1. **Map is Primary**: UI overlays the map, never replaces it
2. **Dark-First**: Design in dark mode, adapt to light
3. **Copper = Action**: Copper signals interactivity
4. **Warmth Over Sterility**: Warm browns, coppers, off-whites
5. **Progressive Disclosure**: Collapsed by default, detail on demand

## Accessibility

All wireframes include:
- Touch targets ≥ 44px (WCAG AA)
- Screen reader labels and hints
- Proper color contrast ratios
- Semantic HTML structure
- Focus indicators

## Next Steps

1. Review wireframes with stakeholders
2. Implement components using semantic theme tokens
3. Test in both light and dark modes
4. Validate accessibility with screen readers
5. Create Storybook stories for components
