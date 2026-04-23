# Molecules — LaneShadow V2 Copper

Two-or-more-atom compositions. Each molecule references existing `.ls-*` atoms by class and adds layout/composition glue — never redefines atom styling.

**Authority:** `.spec/prds/v2/concepts/uc-mol-01..08.html`

## Inventory

| # | Molecule | Folder | Authority | Composes | Description |
|---|----------|--------|-----------|----------|-------------|
| 1 | content-card | `content-card/` | uc-mol-01 | ls-card · ls-btn · ls-pill | LSContentCard — card w/ optional image, title, meta, chips, footer actions |
| 2 | list-row | `list-row/` | uc-mol-01 | ls-avatar · ls-icon · ls-toggle · ls-btn | LSListRow — leading icon/avatar, title+subtitle, trailing chevron/toggle |
| 3 | toolbar | `toolbar/` | uc-mol-02 | ls-btn · ls-icon · ls-text | LSToolbar — 3-slot top bar (leading / title / trailing) |
| 4 | nav-header | `nav-header/` | uc-mol-02 | ls-btn · ls-icon · ls-text · ls-divider | LSNavHeader — screen nav chrome w/ large + collapsed variants |
| 5 | bottom-sheet | `bottom-sheet/` | uc-mol-03 | ls-scrim · ls-panel · ls-card · ls-divider | LSBottomSheet — swipe-up detent sheet w/ handle |
| 6 | toast | `toast/` | uc-mol-03 | ls-glass-panel · ls-icon · ls-btn · ls-phase-dot | LSToast — transient banner w/ info/success/warning/error/recording variants |
| 7 | modal | `modal/` | uc-mol-03 | ls-scrim · ls-card · ls-btn · ls-input · ls-form-field | LSModal — blocking centered dialog |
| 8 | form-field | `form-field/` | uc-mol-04 | ls-form-field · ls-input · ls-textarea · ls-icon · ls-btn | LSFormField — labeled input w/ helper/error text |
| 9 | tab-item | `tab-item/` | uc-mol-04 | ls-icon · ls-pill | LSTabItem — tab cell with icon+label+badge, pill/underline/segmented bars |
| 10 | empty-state | `empty-state/` | uc-mol-04 | ls-icon · ls-btn · ls-card | LSEmptyState — centered zero-content messaging w/ optional action |
| 11 | tag-pill | `tag-pill/` | uc-mol-05 | ls-pill | LSTagPill — non-interactive taxonomy label |
| 12 | filter-chip | `filter-chip/` | uc-mol-05 | ls-pill · ls-icon | LSFilterChip — selectable filter w/ optional close |
| 13 | suggestion-chip | `suggestion-chip/` | uc-mol-05 | ls-pill · ls-icon | LSSuggestionChip — tappable prompt primer w/ leading icon |
| 14 | weather-badge | `weather-badge/` | uc-mol-05 | ls-badge-weather · ls-text | LSWeatherBadge — condition icon + temp/wind readout, 6 weather variants |
| 15 | chat-input | `chat-input/` | uc-mol-06 | ls-btn (chat-send/icon-only) · ls-input · ls-glass-panel · ls-icon · ls-spinner · ls-pill | LSChatInput — bottom-anchored conversational input |
| 16 | phase-indicator | `phase-indicator/` | uc-mol-07 | ls-phase-dot · ls-text · ls-divider | LSPhaseIndicator — Navigator pipeline progress dots |
| 17 | weather-timeline | `weather-timeline/` | uc-mol-07 | ls-badge-weather · ls-text · ls-divider | LSWeatherTimeline — horizontal per-hour forecast grid |
| 18 | instrument-readout | `instrument-readout/` | uc-mol-07 | ls-text · ls-divider | LSInstrumentReadout — JetBrains-Mono numeric stats w/ label+unit |
| 19 | location-context-bar | `location-context-bar/` | uc-mol-08 | ls-phase-dot · ls-icon · ls-text · ls-pill | LSLocationContextBar — ambient location + mode header |
| 20 | route-attachment-card | `route-attachment-card/` | uc-mol-08 | ls-card · ls-badge-best · ls-badge-weather · ls-pill · ls-btn · ls-icon | LSRouteAttachmentCard — route preview card w/ map thumb, badges, accept action |

## Atoms-Used Matrix

| Molecule | ls-text | ls-btn | ls-input | ls-avatar | ls-divider | ls-spinner | ls-card | ls-panel | ls-glass-panel | ls-pill | ls-badge-weather | ls-badge-best | ls-phase-dot | ls-scrim | ls-icon | ls-toggle | ls-form-field |
|----------|:-------:|:------:|:--------:|:---------:|:----------:|:----------:|:-------:|:--------:|:--------------:|:-------:|:----------------:|:-------------:|:------------:|:--------:|:-------:|:---------:|:-------------:|
| content-card | ✔ | ✔ | | | | | ✔ | | | ✔ | | | | | ✔ | | |
| list-row | ✔ | ✔ | | ✔ | ✔ | | | | | | | | | | ✔ | ✔ | |
| toolbar | ✔ | ✔ | | | | | | | | | | | | | ✔ | | |
| nav-header | ✔ | ✔ | | | ✔ | | | | | | | | | | ✔ | | |
| bottom-sheet | ✔ | ✔ | | | ✔ | | ✔ | ✔ | | | | | | ✔ | ✔ | | |
| toast | ✔ | ✔ | | | | | | | ✔ | | | | ✔ | | ✔ | | |
| modal | ✔ | ✔ | ✔ | | | | ✔ | | | | | | | ✔ | ✔ | | ✔ |
| form-field | ✔ | ✔ | ✔ | | | | | | | | | | | | ✔ | | ✔ |
| tab-item | ✔ | | | | | | | | | ✔ | | | | | ✔ | | |
| empty-state | ✔ | ✔ | | | | | ✔ | | | | | | | | ✔ | | |
| tag-pill | ✔ | | | | | | | | | ✔ | | | | | | | |
| filter-chip | ✔ | | | | | | | | | ✔ | | | | | ✔ | | |
| suggestion-chip | ✔ | | | | | | | | | ✔ | | | | | ✔ | | |
| weather-badge | ✔ | | | | | | | | | | ✔ | | | | ✔ | | |
| chat-input | ✔ | ✔ | ✔ | | | ✔ | | | ✔ | ✔ | | | | | ✔ | | |
| phase-indicator | ✔ | | | | ✔ | | | | | | | | ✔ | | | | |
| weather-timeline | ✔ | | | | ✔ | | | | | | ✔ | | | | | | |
| instrument-readout | ✔ | | | | ✔ | | | | | | | | | | | | |
| location-context-bar | ✔ | | | | | | | | | ✔ | | | ✔ | | ✔ | | |
| route-attachment-card | ✔ | ✔ | | | | | ✔ | | | ✔ | ✔ | ✔ | | | ✔ | | |

## Quality Bar (all 20 molecules audited)

- ✅ Zero hex literals in molecule `<style>` blocks
- ✅ Zero numeric `font-size` / `font-weight` / `font-family` declarations — typography delegated to `.t-*` type module classes
- ✅ Zero raw px in padding / margin / gap / border-radius — all use `var(--space-*)`, `var(--radius-*)`, `var(--stroke-*)`
- ✅ Every variant × state rendered in both light and dark themes via stacked `.two-up` panes
- ✅ Self-contained HTML — links only `../../typography/fonts.css`, `../../tokens/tokens.css`, `../../typography/type-modules.css`, `../../atoms/_preview.css`, `../_atoms.css`
- ✅ Real SLC/Utah ride-context content throughout — no lorem ipsum
- ✅ No `.ls-*` atom selectors redefined in molecule `<style>` blocks

## Remaining Molecule-Local Constants (documented in each molecule README)

A handful of geometry constants remain as literals where no system token applies:

| Molecule | Property | Value | Reason |
|----------|----------|-------|--------|
| chat-input | `backdrop-filter: blur(14px)` | 14px | Visual-effect blur radius; not a spacing token |
| tab-item | `.mol-tab-bar` `max-width` | 380px | Demo-helper container (preview-only) |
| tab-item | indicator `width` | 24px | Geometric constant per concept spec |
| empty-state | `--mol-empty-icon-slot-size` | 64px | Molecule-local custom property |
| empty-state | `--mol-empty-illustration-size` | 80px | Molecule-local custom property |
| toggle (atom) | handle width/height | 18px | Internal toggle anatomy geometry |
| toggle (atom) | slide offset | 22px | Derived from track width / handle / padding |

These are intentional per design — they are NOT candidates for the shared token system.

## New Tokens Added During Molecule Build

| Token | Value | Reason |
|-------|-------|--------|
| `--status-info-tint` / `--success-tint` / `--warning-tint` / `--error-tint` | pastel light · rgba dark | Toast backgrounds |
| `--radius-2xl` | 18px | chat-input bar |
| `--size-control-chat` | 54px | chat-input bar height |
| `--border-glass` | rgba-white-0.55 light / ink-22 dark | Frosted glass edge on pill family + chat-input |

## New Atom Extracted

- **toggle** (ls-toggle) — boolean switch atom, extracted from list-row molecule. See `atoms/toggle/`.

## Typography Classes Available

From `typography/type-modules.css`:
- `.t-opinion-xl/lg/md/sm` — Newsreader serif (Navigator voice)
- `.t-title-lg/md/sm` — Geist 600 (screen/card titles)
- `.t-body-lg/md/sm` — Geist 400 (paragraphs)
- `.t-label-lg/md/sm` — Geist 500/600 all-caps (eyebrows, labels, badges)
- `.t-instr-lg/md/sm/xs` — JetBrains Mono 500 tnum (distances, coords, stats)

## How to Preview

Open any `molecules/{name}/{name}.html` in a browser — it renders every variant × state × both themes self-contained. No build step.
