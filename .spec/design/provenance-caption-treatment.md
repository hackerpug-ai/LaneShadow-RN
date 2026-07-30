# Provenance Caption — Calm Treatment Spec

| Field | Value |
|---|---|
| **spec_id** | DESIGN-S06-PROVENANCE-CAPTION |
| **UC** | UC-SURF-05 |
| **Implements via** | **S6-T4** |
| **Surface** | `app/(app)/curated-route/[id].tsx` detail body |
| **testID** | `curated-detail-provenance` |
| **Pattern source** | Summary muted `Text` leaf (`curated-route/[id].tsx` summary block) |

One-page handoff for S6-T4. No new tokens. No new components. Plain informational `Text` only.

---

## 1. Literal caption copy (verbatim — do not paraphrase)

| `geometryProvenance` | Caption string (exact) |
|---|---|
| `ai_reconstructed` | `Route line reconstructed from the ride description` |
| `name_routed` | `Route line generated from the road name` |
| `scraped_promoted` / unset / pre-provenance | **Render nothing** — no node, no empty shell |

Map is exclusive: only the two inferred values show a caption; real scraped lines stay caption-silent so the signal keeps meaning.

---

## 2. Calm treatment (token-pinned)

**Leaf:** single non-interactive `Text` (react-native-paper), same calm framing as the detail summary muted line — not a chip, not a banner, not a status.

| Role | Token path | Light | Dark |
|---|---|---|---|
| Color | `semantic.color.onSurface.subtle` | `#6B7280` | `rgba(255,255,255,0.55)` |
| Type | `semantic.type.body.sm` | fontSize `14` · lineHeight `21` · fontWeight `400` | same scale (mode-independent type) |

```tsx
// Pseudocode for S6-T4 — values from useSemanticTheme()
<Text
  testID="curated-detail-provenance"
  style={[semantic.type.body.sm, { color: semantic.color.onSurface.subtle }]}
>
  {caption} // exact string from §1
</Text>
```

- **Placement:** detail body, immediately under the summary section (section gap already uses `semantic.space.*`).
- **Interaction:** none (not pressable; no haptics).
- **Emphasis:** no bold, no italic, no underline, no icon, no leading bullet.
- **Modes:** same body in light and dark — only the subtle color swaps via theme.

Cited paths resolve under `pnpm tokens:validate` (existing tokens; **NEVER** introduce a new token).

---

## 3. Explicit rules — no Badge / no warning color

- The caption is **not a Badge** and MUST NOT use any `Badge` variant (`default`, `outline`, `secondary`, `warning`, or otherwise).
- The caption MUST use **no warning** color and **no alert** color (`semantic.color.warning.*`, `danger.*`, `status.error.*`, or any alert/intent chrome).
- Do **not** reuse the DESIGN-003 `Approximate location` `Badge variant="outline"` pattern for provenance — that badge is geometry-absent honesty, not line provenance.
- Trust framing only: calm, muted, informational. Same treatment in light and dark.

---

## 4. Anti-patterns (reject)

| Reject | Why |
|---|---|
| Paraphrased or shortened copy | UC-SURF-05 + S6-T4 require literal strings |
| New design token | Existing subtle + body.sm only |
| Badge / pill / chip / banner | Alert framing; dilutes trust signal |
| Warning / alert / error color | Implies fault; caption is informational |
| Caption for `scraped_promoted` | Silence keeps signal meaningful |
| Empty testID node when silent | Absence = no node |

---

## 5. Implementer checklist (S6-T4)

- [ ] Project `geometryProvenance` from `getCuratedRouteDetail`
- [ ] Branch: `ai_reconstructed` → copy 1; `name_routed` → copy 2; else null
- [ ] `testID="curated-detail-provenance"` only when caption renders
- [ ] Styles: `semantic.type.body.sm` + `semantic.color.onSurface.subtle` only
- [ ] Eyeball light + dark on device (S6-T7)
