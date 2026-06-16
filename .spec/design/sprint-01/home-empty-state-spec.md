# Home Empty State Spec

**Task:** DESIGN-S01-003
**Sprint:** sprint-01
**Status:** Draft

## 1. Gating Condition

### Show When
```typescript
hasActiveRoute === false && transcriptMessages.length === 0
```

### Signal Sources

| Signal | Source Location | Note |
|--------|-----------------|------|
| `hasActiveRoute` | `app/(app)/(tabs)/index.tsx` line 257 | Derived from `!!agentActiveOption` |
| `transcriptMessages` | `app/(app)/(tabs)/index.tsx` | `rawTranscriptMessages` filtered array from `useQuery(api.db.sessionMessages.list, ...)` |

### TestID
- **Value:** `home-empty-state` (on the overlay View or its wrapper)
- **Authority:** 07-ui-infrastructure.md §6 testID registry

## 2. Copy Strings and Typography

### Discovery Invite (Primary Copy)

| Property | Value | Token Path | Resolved (Light) | Resolved (Dark) |
|----------|-------|------------|------------------|-----------------|
| Copy text | "Discover roads near you" | — | — | — |
| Font size | — | `semantic.type.body.md.fontSize` | 12pt | 12pt |
| Line height | — | `semantic.type.body.md.lineHeight` | 18pt | 18pt |
| Font weight | — | `semantic.type.body.md.fontWeight` | 400 | 400 |
| Font style | — | `italic` | italic | italic |
| Color | — | `semantic.color.onSurface.muted` | #9CA3AF | #9CA3AF |

### Empty Catalog (Secondary Copy)

| Property | Value | Token Path | Resolved (Light) | Resolved (Dark) |
|----------|-------|------------|------------------|-----------------|
| Copy text | "No routes near you yet" | — | — | — |
| Font size | — | `semantic.type.body.sm.fontSize` | 11pt | 11pt |
| Line height | — | `semantic.type.body.sm.lineHeight` | 16pt | 16pt |
| Font weight | — | `semantic.type.body.sm.fontWeight` | 400 | 400 |
| Color | — | `semantic.color.onSurface.muted` | #9CA3AF | #9CA3AF |

### Gating for Empty Catalog

```typescript
// Show empty catalog only when routes are empty
useCuratedDiscovery({ isEmpty: true }) === true

// Hide during loading
useCuratedDiscovery({ isLoading: true }) === true

// Hide when routes exist
useCuratedDiscovery({ routes: [...] }).length > 0
```

**Rule:** Empty catalog line shows ONLY when `isEmpty === true`; hidden during loading and when routes exist.

## 3. Layout and Visual Spec

### Container Properties

| Property | Token Path | Resolved (Light) | Resolved (Dark) |
|----------|------------|------------------|-----------------|
| Background | `semantic.color.surface.glass` | rgba(253,251,248,0.72) | rgba(45,34,24,0.72) |
| Border Radius | `semantic.radius.lg` | 14pt | 14pt |
| Padding Horizontal | `semantic.space.xl` | 24pt | 24pt |
| Padding Vertical | `semantic.space.lg` | 16pt | 16pt |
| Elevation | `semantic.elevation[2]` | shadowOpacity 0.21, shadowRadius 6, elevation 2 | shadowOpacity 0.21, shadowRadius 6, elevation 2 |

### Positioning

| Property | Value | Token Path | Note |
|----------|-------|------------|------|
| Position | `absolute` | — | Fixed position over map |
| Bottom | ChatInput height + `semantic.space.md` margin | `semantic.space.md` = 12pt | OR use `marginBottom` from ChatInput `bottomOffset` prop |
| Alignment | Centered horizontally | — | Via `alignSelf: 'center'` OR `left: 0, right: 0` with `alignItems: 'center'` |
| Text Alignment | `center` | — | Center text within container |

### Note: `surface.glass` vs `surface.overlay`

**MUST use `surface.glass` (72% alpha), NOT `surface.overlay` (92% alpha):**

| Token | Alpha | Use Case |
|-------|-------|----------|
| `color.surface.glass` | 72% | Glassmorphic overlays over map (this spec) |
| `color.surface.overlay` | 92% | Modal overlays (NOT for this use case) |

**Authority:** 10-design-system.md §1 glassmorphic overlay rule

## 4. zIndex and Interaction Model

### zIndex Value
```typescript
zIndex: 10
```

### Rationale
- **ChatInput zIndex:** 20 (defined in `chat-input.tsx` StyleSheet line 417)
- **Empty-state overlay zIndex:** 10 (must be **below** ChatInput)
- **Why:** Empty-state must not intercept suggestion pill tap events; suggestion chips (testID `chat-input-suggestion-chips`) must remain tappable

### Pointer Events

```typescript
pointerEvents="none"
```

**Rationale:**
- Overlay is purely informational
- Must NOT block taps on the suggestion chips area
- Touch passes through to suggestion pills below

### Interaction Flow

1. **Initial state:** No route on map, no transcript messages → empty-state overlay visible
2. **Tap suggestion pill:** Routes appear on map → `hasActiveRoute` becomes true → overlay hides
3. **Clear route:** `hasActiveRoute` becomes false → overlay re-shows (if transcript still empty)
4. **User types message:** `transcriptMessages.length > 0` → overlay hides
5. **Chat mode active:** Overlay hidden per gating condition

---

**Token Authority References:**
- `tokens/semantic/colors.tokens.json` (lines 26-30): `color.surface.glass` (72% alpha)
- `tokens/semantic/colors.tokens.json` (lines 21-24): `color.surface.overlay` (92% alpha) — NOT for this use case
- `tokens/semantic/semantic.tokens.json` (lines 576-579): `semantic.radius.lg` (14pt)
- `tokens/semantic/semantic.tokens.json` (lines 546-549): `semantic.space.xl` (24pt)
- `tokens/semantic/semantic.tokens.json` (lines 542-545): `semantic.space.lg` (16pt)
- `tokens/semantic/semantic.tokens.json` (lines 534-537): `semantic.space.md` (12pt)
- `tokens/semantic/semantic.tokens.json` (lines 639-651): `semantic.type.body.md` (fontSize 12, lineHeight 18, fontWeight 400)
- `tokens/semantic/semantic.tokens.json` (lines 632-638): `semantic.type.body.sm` (fontSize 11, lineHeight 16, fontWeight 400)
- `tokens/semantic/semantic.tokens.json` (lines 53-57): `semantic.color.onSurface.muted`
- `tokens/semantic/semantic.tokens.json` (lines 873-900): `semantic.elevation[2]`
- `components/chat/chat-input.tsx` (line 417): `styles.container.zIndex: 20` — ChatInput baseline zIndex