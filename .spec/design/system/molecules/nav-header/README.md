# NavHeader

LaneShadow V2 Copper · Molecule · Authority: uc-mol-02-toolbar-navheader.html

## Purpose

LSNavHeader is the screen-level navigation chrome for all primary and secondary screens. It extends the LSToolbar concept with a large-title variant that collapses on scroll: expanded state renders the screen title in Newsreader 22px (`t-opinion-lg`) to signal editorial character; collapsed state snaps back to `t-title-md` with an `elev-chrome` scroll shadow. Both states use the same token set — dark mode is a zero-change token swap.

Platform safe areas are handled by the parent organism:
- iOS Dynamic Island / notch: 48pt above the molecule
- Android WindowInsets: 24pt above the molecule

## Anatomy

### Default variant

```
┌─────────────────────────────────────────────────────────┐
│  [back / empty]   [h1 title · t-title-md]   [action]   │  height: 56px
└─────────────────────────────────────────────────────────┘
```

### Large-title variant

```
┌─────────────────────────────────────────────────────────┐
│  [empty 44px]           [spacer]            [action]   │  inner toolbar row: 56px
│  h1 · t-opinion-lg (Newsreader 22px)                   │  + variable serif row
└─────────────────────────────────────────────────────────┘
```

### Collapsed variant

```
┌─────────────────────────────────────────────────────────┐
│  [44px spacer]    [h1 centered · t-title-md]   [action] │  height: 56px + elev-chrome
└─────────────────────────────────────────────────────────┘
```

| Element | Class | Role |
|---|---|---|
| Root container | `.mol-nav-header` | Background, border-bottom |
| Default bar | `.mol-nav-header--default` | 56px flex row |
| Large expanded | `.mol-nav-header--large` | Inner toolbar row + serif title |
| Collapsed bar | `.mol-nav-header--collapsed` | 56px flex row + scroll shadow |
| Toolbar row | `.mol-nav-header__toolbar-row` | Inner 56px row in large variant |
| Leading slot | `.mol-nav-header__leading` | Back button or text label |
| Back label | `.mol-nav-header__back-label` | iOS-style text chevron |
| Title (inline) | `.mol-nav-header__title` + `.t-title-md` | Default/collapsed title |
| Large title | `.mol-nav-header__large-title` + `.t-opinion-lg` | Expanded serif title |
| Trailing slot | `.mol-nav-header__trailing` | 0–1 icon action |
| Signal icon | `.mol-nav-header__icon--signal` | Copper-tinted icon |
| Icon SVG | `.mol-nav-header__icon-svg` | 20×20 stroke icon |

## Variants

| Variant | Class | Description |
|---|---|---|
| Default | `.mol-nav-header--default` | 56px, inline title, back + optional action |
| Default with back label | `.mol-nav-header--default` + `.mol-nav-header__back-label` | iOS-style text back button in copper |
| Large Expanded | `.mol-nav-header--large` | Inner toolbar row + Newsreader large title |
| Large Collapsed | `.mol-nav-header--collapsed` | 56px, centered title, elev-chrome shadow |
| Default no-back (root) | `.mol-nav-header--default` with empty leading | Title centered via equal empty slots |

## States

States are carried by composed `ls-btn` atoms in the leading/trailing slots. The molecule itself has no state class of its own.

| Class | Applied to | Effect |
|---|---|---|
| `.is-hover` | `ls-btn` child | `background: var(--surface-inset)` |
| `.is-pressed` | `ls-btn` child | Lighter press tint + `translateY(1px)` |
| `.is-disabled` | `ls-btn` child | `opacity: var(--opacity-disabled)` + `pointer-events: none` |

The collapsed variant carries the scroll shadow unconditionally in CSS (`box-shadow: var(--elev-chrome)`). The expanded ↔ collapsed swap is driven by the parent organism/scroll handler toggling between `.mol-nav-header--large` and `.mol-nav-header--collapsed` classes.

## Atoms Used

- `ls-btn` + `ls-btn--ghost` + `ls-btn--icon-only` — back button and action buttons

## Token Recipe

| Property | Token |
|---|---|
| Background | `--surface-primary` |
| Bottom border | `--stroke-sm` solid `--border-default` |
| Default/collapsed height | `--size-control-xl` (56px) |
| Inner toolbar row height (large) | `--size-control-xl` (56px) |
| Scroll shadow (collapsed) | `--elev-chrome` |
| Inline title typography | `.t-title-md` (Geist 14px 600) |
| Large title typography | `.t-opinion-lg` (Newsreader 22px 400) |
| Back label color | `--signal-default` |
| Leading / trailing min-width | `--size-touch-min` (44px) |
| Horizontal padding (default/collapsed) | `--space-5` (16px) |
| Bottom padding (large variant) | `--space-5` (16px) |

## Accessibility

- The root element should be a `<nav>` with `aria-label` describing the screen section.
- Title should be an `<h1>` or appropriate heading level — not a `<span>`.
- Back buttons require `aria-label="Go back"` or context-specific label ("Go back to Wasatch Rides").
- Disabled buttons carry both `.is-disabled` class and the HTML `disabled` attribute.
- The large-title transition between expanded and collapsed is not animated in CSS; animation is the responsibility of the native platform implementation (UINavigationController / NavigationView).

## Notes

- The `mol-nav-header__back-label` sub-component is the iOS-native pattern. Android typically uses only the chevron icon without text. Organisms should apply the appropriate pattern per platform.
- When the large title scrolls past the fold, the organism swaps `.mol-nav-header--large` for `.mol-nav-header--collapsed`. There is no intermediate CSS state; the transition is frame-rate controlled by the native scroll observer.
- The copper signal holds in both light and dark themes — `.mol-nav-header__back-label` and `.mol-nav-header__icon--signal` always render at `--signal-default` (`--copper-500`).
- For screens that require a search bar below the toolbar row in the large variant (e.g. a list screen), add a `.mol-nav-header__search` child after `.mol-nav-header__large-title` and extend the large variant padding accordingly. The molecule CSS does not impose a fixed height — only the toolbar row is height-pinned.
