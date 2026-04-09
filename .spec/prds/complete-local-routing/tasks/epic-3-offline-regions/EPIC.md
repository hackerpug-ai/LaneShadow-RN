# Epic 3: Offline Regions

**Epic ID:** CLR-E003
**Status:** Pending
**Timeline:** Weeks 3-4
**PRD Coverage:** UC-OFF-01 through UC-OFF-08

---

## Human Test Deliverable

User downloads, manages, and deletes offline map regions

**Test Steps:**
1. Open Settings → Offline Maps
2. See list of downloaded regions (empty initially)
3. Tap "Download New Region"
4. Select region bounds on map
5. Name region "Rocky Mountains"
6. Confirm download
7. Watch progress bar (0-100%)
8. See region in list with size and date
9. Tap region to see details
10. Swipe to delete with confirmation

**Gate:** Region download < 3 min

---

## Theme

"Prepare for Adventure" - Offline region download and management

---

## Tasks

### CLR-008: Offline Region Download Manager

**Assigned To:** react-native-ui-implementer
**Estimate:** 1200 min
**Type:** [FEATURE]

**Specification:**
Implement `lib/mapbox/offline-manager.ts` with Mapbox offline pack management:
- Download queue system with priority handling
- Progress tracking per pack (bytes downloaded / total bytes)
- Resource loading notification callbacks
- Storage limit detection and handling
- Download pause/resume functionality
- Pack metadata persistence (name, bounds, date, size)

**Prerequisites:**
- Epic 2 complete (MapboxMapView working)

**Examples:**
```typescript
// lib/mapbox/offline-manager.ts
export const OfflineManager = {
  async downloadRegion(name: string, bounds: Bounds) {
    const pack = {
      name,
      styleURL: Theme.current.mapStyleURL,
      minZoom: 10,
      maxZoom: 16,
      bounds: [bounds.sw.lng, bounds.sw.lat, bounds.ne.lng, bounds.ne.lat]
    }
    return Mapbox.offlineManager.createPack(pack, onProgress)
  }
}
```

**Constraints:**
- Must handle cellular download blocking (WiFi-only)
- Must show progress updates every 5%
- Must validate region bounds before download
- Must handle Mapbox token authentication

**Acceptance Criteria:**
- System downloads map region for offline use
- User can view download progress (0-100%)
- System validates WiFi connection before download
- User can pause and resume downloads
- System displays region metadata (name, size, date)
- Downloaded regions persist across app restarts

---

### CLR-009: Region Selection UI

**Assigned To:** frontend-designer
**Estimate:** 480 min
**Type:** [DESIGN] [FEATURE]

**Specification:**
Design and implement offline region selection interface:
- Map-based bounds selection with draggable corners
- Region naming input with character limit
- Download confirmation dialog with size estimate
- Region list screen with downloaded items
- Swipe-to-delete with confirmation
- Storage usage indicator

**Prerequisites:**
- CLR-008 complete (OfflineManager available)
- Epic 2 complete (MapboxMapView working)

**Design Requirements:**
- Dark theme with copper accents (see styles/RULES.md)
- Bottom sheet for region naming (KeyboardAvoidingInput)
- Shimmer loading states during download
- Progress bar with percentage and estimated time
- Empty state with illustration and "Download Your First Region" CTA

**Examples:**
```typescript
// components/offline/RegionSelector.tsx
export const RegionSelector: React.FC = () => {
  const [bounds, setBounds] = useState<Bounds>()
  const [name, setName] = useState("")
  
  return (
    <MapboxMapView>
      <BoundsSelector bounds={bounds} onChange={setBounds} />
      <BottomSheet>
        <TextInput value={name} onChangeText={setName} placeholder="Region name" />
        <Button onPress={handleDownload} disabled={!bounds || !name}>
          Download Region ({estimateSize(bounds)} MB)
        </Button>
      </BottomSheet>
    </MapboxMapView>
  )
}
```

**Constraints:**
- Must follow LaneShadow UI/UX patterns
- Must work in dark and light themes
- Must handle keyboard avoidance properly
- Must validate region name before download
- Must show size estimate before confirmation

**Acceptance Criteria:**
- User can select region bounds on map
- User can name region with text input
- System displays estimated download size
- User can view list of downloaded regions
- User can delete region with swipe gesture
- System shows storage usage indicator
- UI follows copper-accented dark theme
- Bottom sheet avoids keyboard properly

---

## Dependencies

**Blocks:** Epic 4 (Local Routing)
**Blocked By:** Epic 2 (Map Foundation)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Download abandonment | Background download with progress |
| Storage limits | Clear size estimates, management UI |
| Coordinate bugs | Unit tests for bounds conversion |

---

## Definition of Done

- [ ] All tasks completed
- [ ] Human test steps pass
- [ ] Region download < 3 min gate met
- [ ] Unit tests for bounds conversion
- [ ] Integration tests for download flow
- [ ] Design review approved
