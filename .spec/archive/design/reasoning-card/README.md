# ReasoningCard — Design Spec

**Status:** Draft v1.0
**Owner:** ui-designer
**Implements:** US-312 (design) → US-313 (implementation)
**Surface:** Chat transcript (home screen, ride planning agent)

---

## 1. Purpose

The `ReasoningCard` surfaces the ride-planning agent's internal thinking
(`thinking_delta` events streamed from the pi-ai model) inline in the chat
transcript. It gives users a trust-building glimpse into *why* the agent is
doing what it's doing, without visually overwhelming the conversation.

**Design intent:** subtle, muted, collapsible, out-of-the-way by default.
Reasoning is secondary content. The user's conversation and the agent's
answers remain the primary focus.

---

## 2. Reference Cards (visual language source of truth)

The new card MUST inherit its visual language from existing chat cards:

| Reference | Path | Borrowed pattern |
|---|---|---|
| `RoutingCard` | `components/chat/routing-card.tsx` | Card container (`surfaceVariant` bg + `radius.md` + `space.md` padding), `space.sm` gap, `accessibilityLiveRegion="polite"`, left-aligned `alignSelf: 'flex-start'`, `maxWidth: '90%'` |
| `RoutingCard.PendingCard` | same file, lines 160-183 | Exactly the muted tone + `body.sm` typography the ReasoningCard's **collapsed** state should match |
| `RouteAttachmentCard` | `components/chat/route-attachment-card.tsx` | Touch feedback idiom (`Pressable` + ripple) |

ReasoningCard is tonally **quieter** than `RoutingCard.RunningCard`. It must
not compete with the phase-pill animation. Think of it as a "thought bubble"
annotation.

---

## 3. Placement in Transcript

ReasoningCard renders **above** the agent response it belongs to (per the
plan in EPIC.md for US-311..US-314). Layout:

```
[user message ]
           [ user bubble, right-aligned ]

[ReasoningCard — collapsed by default] ← left-aligned, 90% max width
[RoutingCard / agent text bubble       ] ← left-aligned, belongs to same turn
```

Each agent turn may have **at most one** ReasoningCard. If the agent runs
multiple ReAct steps, a single ReasoningCard accumulates all thinking
deltas concatenated with a separator (`\n\n---\n\n`).

Spacing: `space.xs` gap between the ReasoningCard and the agent response
below it. Treat them as a visual pair.

---

## 4. Visual States

### 4.1 Collapsed (default)

```
┌────────────────────────────────────────────┐
│  ◇  Thought for 3s              ⌄          │
└────────────────────────────────────────────┘
```

- Single-row chip-like card.
- Lightbulb/sparkle glyph (`◇`) on the left — `IconSymbol` name
  `"lightbulb"` or `"sparkle"`, color `onSurface.muted`.
- Label text: `"Thought for {N}s"` once complete, or `"Thinking…"` while
  streaming (see 4.2).
- Chevron-down glyph (`⌄`) on the right indicating expandability.
- Height ≥ 44pt (touch target compliance).
- Tap anywhere on the row expands.

### 4.2 Streaming (live)

```
┌────────────────────────────────────────────┐
│  ◇  Thinking…  ●   (pulsing)    ⌄          │
└────────────────────────────────────────────┘
```

- Identical layout to collapsed, BUT:
  - Label reads `"Thinking…"` (present tense).
  - A small pulsing dot (`●`, 6pt diameter, `primary.default`) sits to the
    right of the label. Pulse animation: opacity 0.4 → 1.0 → 0.4 over 1.2s,
    `withRepeat(-1)`. **Respects reduce-motion** — if enabled, dot is
    static at opacity 0.7.
- Card background tint subtly shifts to `primary.default @ 8% alpha`
  overlaid on `surfaceVariant.default` to signal "active thinking". Border
  remains none.
- `accessibilityLiveRegion="polite"` announces `"Agent is thinking"` on
  entry; does NOT re-announce on every delta (would be spammy).

### 4.3 Expanded (user tapped to reveal)

```
┌────────────────────────────────────────────┐
│  ◇  Thought for 3s              ⌃          │
│ ────────────────────────────────────────── │
│                                            │
│  The user asked for a scenic morning       │
│  route. I should check the weather first,  │
│  then prioritize routes with low traffic   │
│  and good sightlines. Let me query the     │
│  route planner with "scenic" priority…     │
│                                            │
└────────────────────────────────────────────┘
```

- Header row identical to collapsed, but chevron flips to `⌃` (up).
- Thin `space.xs`-height divider using `outline.subtle` (or
  `onSurface.muted @ 20% alpha` fallback).
- Body: full reasoning text in `body.sm`, color `onSurface.muted`, line
  height generous (`1.5`) for readability.
- Body padding: `space.md` horizontal, `space.sm` vertical.
- No max-height — card grows to fit content. Parent `ScrollView`
  (transcript) handles scrolling.
- Tap header row again to collapse.

### 4.4 Completed (post-streaming, collapsed — default resting state)

Same as **Collapsed (4.1)** but with final duration rendered:
`"Thought for 3s"`. The duration is computed from `streamStartedAt` →
`streamCompletedAt` timestamps stored on the message.

### 4.5 Error (thinking stream failed mid-flight)

Rare. Fall back to collapsed state with label `"Thought briefly"` and no
chevron (not expandable if body is empty). If partial body exists, remain
expandable. Never show a red/danger state — reasoning failures are
non-blocking and shouldn't alarm the user.

---

## 5. Typography

| Element | Token | Color token |
|---|---|---|
| Header label ("Thought for 3s" / "Thinking…") | `semantic.type.label.md` | `semantic.color.onSurface.muted` |
| Body reasoning text | `semantic.type.body.sm` | `semantic.color.onSurface.muted` |
| Pulsing dot | — (6pt View) | `semantic.color.primary.default` |
| Glyphs (lightbulb, chevron) | `IconSymbol` size 16 | `semantic.color.onSurface.muted` |

**No bolding. No color accents in the body.** The reasoning is meant to
read as an aside — muted throughout.

---

## 6. Color & Container Tokens

| Property | Collapsed/Completed | Streaming | Expanded |
|---|---|---|---|
| Background | `semantic.color.surfaceVariant.default` | `surfaceVariant.default` + `primary.default @ 8% alpha` overlay | same as collapsed |
| Border radius | `semantic.radius.md` | same | same |
| Padding (header row) | `space.md` horiz, `space.sm` vert | same | same |
| Padding (body) | — | — | `space.md` horiz, `space.sm` vert |
| Gap (icon ↔ label) | `space.sm` | same | same |
| Elevation / shadow | none (matches `PendingCard`) | none | none |

**No hardcoded hex values anywhere.** All colors come from `semantic.color.*`.
Opacity overlays use `+ '14'` hex suffix (8%) following the
`RoutingCard.FailedCard` pattern (lines 285-290 in `routing-card.tsx`).

Light vs dark mode: **identical token names in both modes**. The
`semantic.color.surfaceVariant` and `onSurface.muted` tokens already
resolve to appropriate values per mode via the theme provider — no
conditional logic needed in the component.

---

## 7. Interaction

| Gesture | Effect | Notes |
|---|---|---|
| Tap header row | Toggle expanded ↔ collapsed | Entire row is a single `Pressable` |
| Ripple / press feedback | `android_ripple={{ color: onSurface.muted + '14' }}` + iOS opacity 0.7 via `style={({ pressed }) => …}` | MD3-aligned ripple |
| Scroll | Expanded state **persists** on scroll (stored in local component state, not reset on re-render) | Must use stable state; no state reset on keyboard events |
| Streaming → completed transition | Header label updates in place; no layout jump | Body content (if expanded) grows smoothly — no animated height required for v1 |

Only one ReasoningCard per turn; expanding one does NOT auto-collapse
others. Users can expand multiple historical cards simultaneously.

---

## 8. Accessibility (WCAG 2.1 AA)

### 8.1 Touch targets

- Header row: **minHeight 44pt**, full-width tappable.
- Chevron and glyphs are decorative (inside the tappable row) — no
  separate targets.

### 8.2 Contrast

- `onSurface.muted` on `surfaceVariant.default` — verify ≥ 4.5:1 for
  label text (normal size) and ≥ 3:1 for the 16pt glyphs.
  - If the existing `onSurface.muted` token fails in dark mode, **escalate
    to token owner**; do NOT hardcode a replacement.
- Pulsing dot on `surfaceVariant + primary@8% overlay`: ≥ 3:1 (UI
  component contrast).

### 8.3 Screen reader

| State | `accessibilityRole` | `accessibilityLabel` | `accessibilityHint` | `accessibilityState` |
|---|---|---|---|---|
| Collapsed | `button` | `"Agent reasoning, thought for 3 seconds"` | `"Double tap to expand"` | `{ expanded: false }` |
| Streaming | `button` | `"Agent is thinking"` | `"Double tap to expand reasoning"` | `{ expanded: false, busy: true }` |
| Expanded | `button` | `"Agent reasoning, thought for 3 seconds"` | `"Double tap to collapse"` | `{ expanded: true }` |

- Body text (when expanded) is a sibling `Text` with default
  `accessibilityRole` (none); screen readers will announce it after the
  header button.
- `accessibilityLiveRegion="polite"` ONLY on initial streaming entry.
  Remove live-region once streaming completes to avoid re-announcement
  on state transitions.
- `accessibilityElementsHidden={false}` always; this content is
  informational and should be reachable by screen readers.

### 8.4 Reduce motion

- Detect via `AccessibilityInfo.isReduceMotionEnabled()` (pattern from
  `routing-card.tsx:346-353`).
- When enabled: pulsing dot is static (opacity 0.7), no animation.

---

## 9. Material Design 3 Alignment

- Container: MD3 "filled card" variant — uses `surfaceVariant` as per
  spec, no elevation, no border. Matches
  `RoutingCard.PendingCard`/`RunningCard` idiom.
- Corner radius: `md` token (maps to MD3 "medium" 12pt).
- Ripple: MD3 state-layer at 8% alpha (`onSurface.muted + '14'`).
- Typography: `label.md` for the header chip, `body.sm` for content —
  both are MD3 roles exposed through the `semantic.type.*` layer.

---

## 10. Props Contract (for ui-developer in US-313)

```ts
export type ReasoningCardProps = {
  message: {
    _id: Id<'session_messages'>
    kind: 'reasoning'
    content: string              // accumulated thinking text
    status: 'streaming' | 'complete' | 'failed'
    streamStartedAt: number      // ms epoch
    streamCompletedAt?: number   // ms epoch, set when status !== 'streaming'
  }
}
```

- No attachments, no Convex reactive query required — the parent
  transcript already subscribes to `session_messages` and passes the
  row in. ReasoningCard is **pure presentational** over this prop.
- Local state (uncontrolled): `const [expanded, setExpanded] = useState(false)`.
- Duration label: computed inline from the two timestamps; rounded to
  nearest whole second; for sub-second streams show `"Thought briefly"`.

---

## 11. Out of Scope (v1)

- Animated height on expand/collapse (deferred; instant toggle for v1).
- Copy-to-clipboard on the reasoning body.
- Multiple separate thinking-deltas per turn shown as separate cards
  (v1 concatenates into one).
- Syntax highlighting / markdown rendering of reasoning body (v1 is
  plain text).

---

## 12. Deviations from `RoutingCard`

| Aspect | `RoutingCard` | `ReasoningCard` | Rationale |
|---|---|---|---|
| Interactive | No | Yes (tap to expand) | Reasoning is optional detail |
| Animation signature | Phase-pill pulse | Single dot pulse | Reasoning is quieter |
| Max width | 90% | 90% | Consistent |
| Live region | Always polite | Only during stream | Prevent toggle spam |
| Danger state | Red-tinted failed card | None (graceful degrade) | Reasoning failures non-blocking |

---

## 13. Open Questions

1. **Icon choice:** `lightbulb.fill` vs `sparkle` vs `brain.head.profile`?
   Defer to ui-developer — pick whichever exists in the current
   `IconSymbol` SF Symbol mapping. Default recommendation: `sparkle`.
2. **Token gap:** does `semantic.color.outline.subtle` exist for the
   divider? If not, use `onSurface.muted + '33'` (20% alpha) as fallback.
   ui-developer should check `hooks/use-semantic-theme.ts` and `styles/types.ts`.
3. **Duration formatting:** `"Thought for 3s"` — confirm copy with PM.
   Alternatives: `"Reasoned for 3s"`, `"Considered for 3s"`.

---

## 14. Acceptance Criteria (for US-313 implementer)

- [ ] Renders collapsed by default, tap-to-expand toggles state
- [ ] Streaming state shows pulsing dot + "Thinking…" label
- [ ] Dot animation respects `AccessibilityInfo.isReduceMotionEnabled()`
- [ ] No hardcoded colors, spacing, or radii — all `semantic.*` tokens
- [ ] Verified contrast ≥ 4.5:1 (text) and ≥ 3:1 (UI) in both light + dark
- [ ] Touch target ≥ 44pt verified on device
- [ ] VoiceOver + TalkBack announcements match Section 8.3
- [ ] Expanded state persists on transcript scroll
- [ ] Uses `Pressable` with MD3 ripple on Android, opacity on iOS
- [ ] Pattern consistency with `RoutingCard.PendingCard` verified visually
