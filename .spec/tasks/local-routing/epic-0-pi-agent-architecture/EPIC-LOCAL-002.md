# EPIC-LOCAL-002: Coordinate Conversion Workflow

**Epic:** EPIC-0: Pi Agent Architecture Foundation
**Task ID:** EPIC-LOCAL-002
**Status:** Backlog
**Priority:** P0 (Critical - blocks EPIC-2, EPIC-4)
**Effort:** S (< half day)
**Type:** FEATURE (Deterministic Workflow)
**Iteration:** 1

---

## CRITICAL CONSTRAINTS

MUST: Create deterministic workflow (no LLM reasoning)
MUST: Convert [lat, lng] ↔ [lng, lat] bidirectionally
MUST: Handle arrays and object formats
NEVER: Use LLM for coordinate conversion (pure function)
STRICTLY: All conversions must be reversible without precision loss

---

## SPECIFICATION

**Objective:** Implement deterministic coordinate conversion workflow for Mapbox SDK compatibility.

**Success looks like:** Workflow converts Google Maps format [lat, lng] to Mapbox format [lng, lat] and back without precision loss.

---

## PREREQUISITES

| Phase | Document | Lines/Section | Purpose |
|-------|----------|---------------|---------|
| BEFORE_START | `EPIC-LOCAL-001` | COMPLETE | Extension foundation must exist |
| BEFORE_START | `/Users/justinrich/Projects/LaneShadow/.spec/prds/complete-local-routing/08-technical-requirements.md` | Coordinate System section | Understand conversion requirements |
| IF_BLOCKED | `~/.pi/agent/core/workflows/README.md` | Workflow Pattern | Reference deterministic workflow pattern |

---

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Coordinate in Google format [37.7749, -122.4194] | Workflow converts to Mapbox format | Returns [-122.4194, 37.7749] | `pi-cli workflow run local-routing.coordinateConversion '{"format":"google","coordinates":[37.7749,-122.4194]}' \| jq -e '.mapbox == [-122.4194,37.7749]'` |
| 2 | Coordinate in Mapbox format [-122.4194, 37.7749] | Workflow converts to Google format | Returns [37.7749, -122.4194] | `pi-cli workflow run local-routing.coordinateConversion '{"format":"mapbox","coordinates":[-122.4194,37.7749]}' \| jq -e '.google == [37.7749,-122.4194]'` |
| 3 | Array of coordinates [[lat,lng], [lat,lng]] | Workflow converts array | Returns all coordinates in [lng,lat] format | `pi-cli workflow run local-routing.coordinateConversion '{"format":"google","coordinates":[[37.7749,-122.4194],[37.6879,-122.4702]]}' \| jq -e '.mapbox \| length == 2'` |
| 4 | Coordinate object {lat: 37.7749, lng: -122.4194} | Workflow converts object | Returns {lng: -122.4194, lat: 37.7749} | `pi-cli workflow run local-routing.coordinateConversion '{"format":"google","coordinates":{"lat":37.7749,"lng":-122.4194}}' \| jq -e '.mapbox.lat == 37.7749'` |
| 5 | Invalid coordinate format | Workflow receives invalid input | Returns error with descriptive message | `pi-cli workflow run local-routing.coordinateConversion '{"format":"invalid"}' 2>&1 \| grep -q 'Invalid coordinate format'` |

---

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Workflow converts single Google coordinate to Mapbox format when given [lat,lng] array | AC-1 | `pi-cli workflow run local-routing.coordinateConversion '{"format":"google","coordinates":[37.7749,-122.4194]}' \| jq -e '.mapbox == [-122.4194,37.7749]'` | [ ] TRUE [ ] FALSE |
| 2 | Workflow converts single Mapbox coordinate to Google format when given [lng,lat] array | AC-2 | `pi-cli workflow run local-routing.coordinateConversion '{"format":"mapbox","coordinates":[-122.4194,37.7749]}' \| jq -e '.google == [37.7749,-122.4194]'` | [ ] TRUE [ ] FALSE |
| 3 | Workflow converts coordinate array when given multiple coordinates | AC-3 | `pi-cli workflow run local-routing.coordinateConversion '{"format":"google","coordinates":[[37.7749,-122.4194],[37.6879,-122.4702]]}' \| jq -e '.mapbox[0] == [-122.4194,37.7749]'` | [ ] TRUE [ ] FALSE |
| 4 | Workflow converts coordinate object when given {lat, lng} object | AC-4 | `pi-cli workflow run local-routing.coordinateConversion '{"format":"google","coordinates":{"lat":37.7749,"lng":-122.4194}}' \| jq -e '.mapbox.lng == -122.4194'` | [ ] TRUE [ ] FALSE |
| 5 | Workflow returns error when given invalid coordinate format | AC-5 | `pi-cli workflow run local-routing.coordinateConversion '{"format":"invalid"}' 2>&1; echo $? \| grep -q '1'` | [ ] TRUE [ ] FALSE |

---

## DESIGN

### Workflow Signature

```typescript
// workflows/coordinateConversion.ts
export const coordinateConversion = {
  name: 'coordinateConversion',
  description: 'Convert coordinates between Google Maps [lat,lng] and Mapbox [lng,lat] formats',
  type: 'deterministic',
  input: {
    format: v.union(v.literal('google'), v.literal('mapbox')),
    coordinates: v.union(
      v.array(v.number()),           // [lat, lng] or [lng, lat]
      v.array(v.array(v.number())),  // [[lat, lng], ...]
      v.object({                     // {lat: x, lng: y}
        lat: v.number(),
        lng: v.number()
      })
    )
  },
  output: {
    google: v.optional(v.union(
      v.array(v.number()),
      v.array(v.array(v.number())),
      v.object({ lat: v.number(), lng: v.number() })
    )),
    mapbox: v.optional(v.union(
      v.array(v.number()),
      v.array(v.array(v.number())),
      v.object({ lng: v.number(), lat: v.number() })
    ))
  }
};
```

### Conversion Logic

```typescript
function convertToMapbox(coords: any): any {
  if (Array.isArray(coords)) {
    if (Array.isArray(coords[0])) {
      // Array of coordinates: [[lat, lng], ...]
      return coords.map(c => [c[1], c[0]]);
    } else {
      // Single coordinate: [lat, lng]
      return [coords[1], coords[0]];
    }
  } else if (typeof coords === 'object') {
    // Object: {lat: x, lng: y}
    return { lng: coords.lng, lat: coords.lat };
  }
  throw new Error('Invalid coordinate format');
}

function convertToGoogle(coords: any): any {
  if (Array.isArray(coords)) {
    if (Array.isArray(coords[0])) {
      // Array of coordinates: [[lng, lat], ...]
      return coords.map(c => [c[1], c[0]]);
    } else {
      // Single coordinate: [lng, lat]
      return [coords[1], coords[0]];
    }
  } else if (typeof coords === 'object') {
    // Object: {lng: x, lat: y}
    return { lat: coords.lat, lng: coords.lng };
  }
  throw new Error('Invalid coordinate format');
}
```

### Test Cases

```typescript
// Single coordinate
convertToMapbox([37.7749, -122.4194]) // → [-122.4194, 37.7749]
convertToGoogle([-122.4194, 37.7749])  // → [37.7749, -122.4194]

// Array of coordinates
convertToMapbox([[37.7749, -122.4194], [37.6879, -122.4702]])
// → [[-122.4194, 37.7749], [-122.4702, 37.6879]]

// Object format
convertToMapbox({lat: 37.7749, lng: -122.4194})
// → {lng: -122.4194, lat: 37.7749}
```

---

## GUARDRAILS

### WRITE-ALLOWED

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `~/.pi/agent/extensions/local-routing/workflows/coordinateConversion.ts` | Workflow implementation |
| MODIFY | `~/.pi/agent/extensions/local-routing/index.ts` | Export workflow |

### WRITE-PROHIBITED

- Using LLM for coordinate conversion
- Modifying other workflow files
- Adding non-deterministic logic

---

## CONSTRAINTS

| Constraint | Value | Reason |
|------------|-------|--------|
| Workflow type | deterministic | Pure function, no LLM |
| Precision loss | 0 decimal places | Coordinate precision must be preserved |
| Execution time | < 10ms | Simple array manipulation |
| Dependencies | 0 external packages | Pure TypeScript |

---

## VERIFICATION GATES

```bash
# Gate 1: Workflow file exists
test -f ~/.pi/agent/extensions/local-routing/workflows/coordinateConversion.ts

# Gate 2: Workflow loads in extension
pi-cli workflow list | grep -q 'local-routing.coordinateConversion'

# Gate 3: Single coordinate conversion (Google → Mapbox)
pi-cli workflow run local-routing.coordinateConversion '{"format":"google","coordinates":[37.7749,-122.4194]}' | jq -e '.mapbox == [-122.4194,37.7749]'

# Gate 4: Single coordinate conversion (Mapbox → Google)
pi-cli workflow run local-routing.coordinateConversion '{"format":"mapbox","coordinates":[-122.4194,37.7749]}' | jq -e '.google == [37.7749,-122.4194]'

# Gate 5: Array conversion
pi-cli workflow run local-routing.coordinateConversion '{"format":"google","coordinates":[[37.7749,-122.4194],[37.6879,-122.4702]]}' | jq -e '.mapbox | length == 2'
```

---

## FILES TO CREATE/MODIFY

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `~/.pi/agent/extensions/local-routing/workflows/coordinateConversion.ts` | Workflow implementation |
| CREATE | `~/.pi/agent/extensions/local-routing/workflows/__tests__/coordinateConversion.test.ts` | Unit tests |
| MODIFY | `~/.pi/agent/extensions/local-routing/index.ts` | Export workflow |

---

## DESIGN NOTES

### Coordinate System Differences

**Google Maps:** [latitude, longitude]
- Example: [37.7749, -122.4194] (San Francisco)

**Mapbox:** [longitude, latitude]
- Example: [-122.4194, 37.7749] (San Francisco)

**Why This Matters:**
- Mapbox SDK expects [lng, lat] format
- Passing wrong format causes coordinates to render in wrong locations (ocean instead of city)
- All route geometry from Mapbox must be converted before display

### Precision Handling

- Coordinates are stored as floating point numbers
- Conversion must preserve all decimal places
- No rounding or truncation during conversion
- Reversible conversion: Google → Mapbox → Google = original value

### Error Handling

Invalid inputs should throw descriptive errors:
- Non-numeric coordinates
- Missing lat/lng properties
- Nested arrays with inconsistent lengths
- Null/undefined values

---

## CONTRACT

### Agent Instructions

1. **Create workflow file** at `workflows/coordinateConversion.ts`
2. **Implement conversion functions** (toMapbox, toGoogle)
3. **Add input validation** for all coordinate formats
4. **Export workflow** in `index.ts`
5. **Test with sample coordinates** (San Francisco, New York, London)
6. **Verify reversibility** (convert both ways, compare results)
7. **Add error tests** (invalid formats, missing fields)

### Journal Format

```json
{
  "task_id": "EPIC-LOCAL-002",
  "status": "in_progress",
  "steps_completed": [
    "Created workflow file",
    "Implemented conversion functions",
    "Added input validation",
    "Exported workflow"
  ],
  "verification_results": {
    "gate_1_file_exists": "PASS",
    "gate_2_workflow_loads": "PASS",
    "gate_3_google_to_mapbox": "PASS",
    "gate_4_mapbox_to_google": "PASS",
    "gate_5_array_conversion": "PASS"
  },
  "test_coordinates": [
    "[37.7749, -122.4194] → [-122.4194, 37.7749]",
    "[40.7128, -74.0060] → [-74.0060, 40.7128]",
    "[51.5074, -0.1278] → [-0.1278, 51.5074]"
  ]
}
```

---

## APPROVAL

**Approved By:** Pending
**Date:** Pending

---

**End of Task Definition**
