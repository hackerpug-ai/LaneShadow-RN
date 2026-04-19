# GatekeeperUpgradePrompt — STYLE PROPERTIES MATRIX

**Component:** GatekeeperUpgradePrompt
**Level:** Organism (Delta)
**Source:** UC-GATE-03, UC-GATE-08 (NEW for Sprint 2)
**Platform Mapping:** Android `Dialog` + cards, iOS `.sheet` + cards

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | NEW component (no RN source) | Dialog/sheet layout | Android: `app/src/main/java/com/laneshadow/ui/organisms/GatekeeperUpgradePrompt.kt`<br>iOS: `app/ui/organisms/GatekeeperUpgradePrompt.swift` | 2 variants: online, offline |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

### Layout — Dialog/Sheet Container

**Source files read:**
- Specification: UC-GATE-03, UC-GATE-08 (gatekeeper/subscription use cases)
- Design: Paywall modal with tier cards + benefits + CTAs + offline variant

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | UC spec | `90%` max | `Modifier.requiredWidthIn(max = 0.9 * screenWidth)` | `.frame(maxWidth: .infinity * 0.9)` | n/a |
| Layout | maxWidth | UC spec | `400` | `Modifier.requiredWidthIn(max = 400.dp)` | `.frame(maxWidth: 400)` | ESCALATE — `size.dialogMaxWidth = 400` |
| Visual | backgroundColor | UC spec | `card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Visual | cornerRadius | UC spec | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Visual | shadow | UC spec | `elevation[5]` | `Modifier.shadow(elevation = 5.dp)` | `.shadow(color:.black.opacity(0.15), radius:12, y:4)` | `elevation.light.5` |
| Layout | padding | UC spec | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | ESCALATE — `space.lg` |
| Layout | gap | UC spec | `16` | `Spacer(Modifier.height(16.dp))` | `Spacer(minLength: 16)` | `space.lg` |

### Typography — Title

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | UC spec | `heading.lg` | `MaterialTheme.typography.headlineLarge` | `.font(.headlineLarge)` | ESCALATE — map to `type.heading.lg` |
| Typography | textAlign | UC spec | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | color | UC spec | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Subtitle

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | UC spec | `body.md` | `MaterialTheme.typography.bodyMedium` | `.font(.bodyMedium)` | ESCALATE — map to `type.body.md` |
| Typography | textAlign | UC spec | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | color | UC spec | `onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Layout | marginTop | UC spec | `8` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |

### Layout — Tier Cards

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | gap | UC spec | `12` | `Spacer(Modifier.height(12.dp))` | `Spacer(minLength: 12)` | ESCALATE — `space.md` |

### Layout — Tier Card

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | padding | UC spec | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | ESCALATE — `space.lg` |
| Layout | gap | UC spec | `8` | `Spacer(Modifier.height(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| Visual | backgroundColor | UC spec | `surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | borderRadius | UC spec | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | ESCALATE — `radius.md + 4` |
| Visual | borderWidth | UC spec | `2` (selected) / `0` (unselected) | `Modifier.border(2.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 2))` | ESCALATE — `borderWidth.thick = 2` |
| Visual | borderColor | UC spec | `primary.default` (selected) | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Tier Name

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `16` | `16.sp` | `font(.system(size: 16))` | `type.body.md.fontSize` |
| Typography | fontWeight | UC spec | `'600'` | `FontWeight.SemiBold` | `.semibold` | `type.body.md.fontWeight` |
| Typography | color | UC spec | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Tier Price

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `20` | `20.sp` | `font(.system(size: 20))` | ESCALATE — map to `type.title.lg.fontSize = 24` (scale down) |
| Typography | fontWeight | UC spec | `'700'` | `FontWeight.Bold` | `.bold` | ESCALATE — `fontWeight.bold = 700` |
| Typography | color | UC spec | `primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Tier Benefits

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `14` | `14.sp` | `font(.system(size: 14))` | `type.body.sm.fontSize` |
| Typography | color | UC spec | `onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Layout | gap | UC spec | `4` | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |

### Icon — Benefit Checkmark

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Icon | name | UC spec | `check-circle` | `Icons.Outlined.CheckCircle` | `checkmark.circle.fill` | n/a |
| Icon | size | UC spec | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | `iconSize.sm` |
| Icon | color | UC spec | `success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |

### Layout — CTAs

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | UC spec | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | justifyContent | UC spec | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | gap | UC spec | `8` | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| Layout | marginTop | UC spec | `16` | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | ESCALATE — `space.lg` |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Paywall modal for subscription upgrade
- Shows tier cards with pricing and benefits
- Primary and secondary CTAs
- Offline variant (no internet connection)
- Used when feature requires higher tier

---

## VERIFICATION GATES

- Modal/sheet appears smoothly
- Tier cards selectable
- Benefits readable
- CTAs accessible
- Offline variant shows appropriate message

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Button component
- IconSymbol component
- Dialog/sheet system (Android `AlertDialog`, iOS `.sheet`)

---

## COMPOSITION

- GatekeeperUpgradePrompt = Dialog/Sheet + [Title, Subtitle, TierCards, Benefits, CTAs]
- TierCards = [TierCard, TierCard, ...]
- TierCard = Column + [Name, Price, Benefits[Checkmark + Text]]
- Used by: SubscriptionGatekeeper, FeatureGatedScreen
