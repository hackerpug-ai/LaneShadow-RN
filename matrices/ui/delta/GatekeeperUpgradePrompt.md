# GatekeeperUpgradePrompt - STYLE PROPERTIES MATRIX

**Component:** GatekeeperUpgradePrompt (DELTA)
**Level:** Organism
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js` (composition of existing components)

---

## DELTA CONTEXT

**Source UC:** UC-GATE-03, UC-GATE-08 — Paywall modal with tier cards + benefits + CTAs + offline variant

**Rationale:** Net-new organism for subscription gatekeeper UI. Combines tier cards, benefits lists, upgrade CTAs, and offline handling into reusable modal.

**Migration path:** Compose existing components (`Card`, `Button`, `Badge`, `StatRow`) - no new primitives needed.

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/16-uc-gatekeeper.md` | UC-GATE-03, UC-GATE-08 requirements |
| Card | `react-native/components/ui/card.tsx` | Tier cards (see matrices/ui/atoms/Card.md) |
| Button | `react-native/components/ui/button.tsx` | CTAs (see matrices/ui/atoms/Button.md) |
| Badge | `react-native/components/ui/badge.tsx` | Tier badges (see matrices/ui/atoms/Badge.md) |

---

## STYLE PROPERTIES MATRIX

### Layout — Modal Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | Task spec | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| backgroundColor | Task spec | `color.scrim.default` with 0.8 alpha | `Modifier.alpha(0.8f).background(LaneShadowTheme.colors.scrim)` | `.background(Color.black.opacity(0.8))` | ESCALATE — propose `opacity.modalScrim = 0.8` |

### Layout — Modal Content (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | Task spec | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| justifyContent | Task spec | `'center'` | `Modifier.wrapContentSize(Alignment.CenterVertically)` | `.frame(alignment: .center)` | n/a |
| paddingHorizontal | Task spec | `space.xl` = 24 | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | `space.xl` |

### Layout — Modal Card (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| backgroundColor | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | Task spec | `radius.xl` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.xl` |
| padding | Task spec | `space.xl` = 24 | `Modifier.padding(24.dp)` | `.padding(24)` | `space.xl` |
| gap | Task spec | `space.lg` = 16 | `Arrangement.spacedBy(16.dp)` / `Modifier.padding(end = 16.dp)` between items | `spacing(16)` | `space.lg` |
| maxHeight | Task spec | `'80%'` | `Modifier.requiredHeightIn(max = 0.8f)` | `.frame(maxHeight: .infinity).frame(maxHeight: geometry.size.height * 0.8)` | n/a (percentage) |

### Typography — Title (Text variant=headlineMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `headlineMedium` | `MaterialTheme.typography.headlineMedium` | Verify against Paper | n/a |
| fontSize | Paper headlineMedium | Verify in source | (verify) | (verify) | ESCALATE — verify token |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| textAlign | Task spec | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| text | Task spec | `'Upgrade Your Ride'` or `'Offline Maps Required'` | `Text(...)` | `Text(...)` | n/a (dynamic) |

### Typography — Body (Text variant=bodyMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | Verify against Paper | n/a |
| color | Task spec | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| textAlign | Task spec | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| text | Task spec | Dynamic message | `Text(...)` | `Text(...)` | n/a (dynamic) |

### Layout — Tier Cards (ScrollView)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| gap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |
| marginBottom | Task spec | `space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Layout — Tier Card (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| backgroundColor | Task spec | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | Task spec | `radius.lg` = 12 | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| borderWidth | Task spec | `2` | `Modifier.border(BorderStroke(2.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 2))` | ESCALATE — propose `borderWidth.tierCard = 2` |
| borderColor | Task spec (selected) | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| borderColor | Task spec (unselected) | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| padding | Task spec | `space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| gap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Typography — Tier Name (Text variant=titleMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `titleMedium` | `MaterialTheme.typography.titleMedium` | Verify against Paper | n/a |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| text | Task spec | `'Free'`, `'Premium'`, `'Pro'` | `Text(...)` | `Text(...)` | n/a (dynamic) |

### Typography — Tier Price (Text variant=headlineSmall)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `headlineSmall` | `MaterialTheme.typography.headlineSmall` | Verify against Paper | n/a |
| color | Task spec | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| text | Task spec | `'$9.99/mo'` | `Text(...)` | `Text(...)` | n/a (dynamic) |

### Layout — Benefits List (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| gap | Task spec | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |

### Layout — Benefit Item (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | Task spec | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | Task spec | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | Task spec | `space.sm` = 8 | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |

### Icon — Benefit Check (IconSymbol)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| name | Task spec | `'check'` | `Icons.Default.Check` | `checkmark` (SF Symbol) | n/a |
| size | Task spec | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `icon.benefitCheck = 16` |
| color | Task spec | `color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |

### Typography — Benefit Text (Text variant=bodyMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | Verify against Paper | n/a |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| text | Task spec | Dynamic benefit | `Text(...)` | `Text(...)` | n/a (dynamic) |

### Layout — Action Buttons (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | Task spec | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Button — Cancel (Button)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | Task spec | `'Maybe Later'` or `'Cancel'` | `Button(title = "Maybe Later", ...)` | `Button("Maybe Later")` | n/a (dynamic) |
| variant | Task spec | `'secondary'` | `ButtonVariant.Secondary` | `ButtonVariant.secondary` | n/a |
| onPress | Task spec | `onCancel` | `onPress = onCancel` | `onPress: onCancel` | n/a |
| flex | Task spec | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

### Button — Upgrade (Button)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | Task spec | `'Upgrade'` or `'Subscribe'` | `Button(title = "Upgrade", ...)` | `Button("Upgrade")` | n/a (dynamic) |
| variant | Task spec | `'default'` (primary) | `ButtonVariant.Default` | `ButtonVariant.default` | n/a |
| onPress | Task spec | `onUpgrade` | `onPress = onUpgrade` | `onPress: onUpgrade` | n/a |
| flex | Task spec | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

### State — Props

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|
| variant | Task spec | `'upgrade'` or `'offline'` | `val variant: PromptVariant` | `var variant: PromptVariant` | n/a |
| title | Task spec | `String` | `val title: String` | `var title: String` | n/a |
| body | Task spec | `String` | `val body: String` | `var body: String` | n/a |
| tiers | Task spec | `List<SubscriptionTier>` | `val tiers: List<SubscriptionTier>` | `var tiers: [SubscriptionTier]` | n/a |
| selectedTier | Task spec | `String` | `val selectedTier: String` | `var selectedTier: String` | n/a |
| onTierSelect | Task spec | `(String) -> Unit` | `onTierSelect: (String) -> Unit` | `onTierSelect: (String) -> Void` | n/a |
| onUpgrade | Task spec | `() -> Unit` | `onUpgrade: () -> Unit` | `onUpgrade: () -> Void` | n/a |
| onCancel | Task spec | `() -> Unit` | `onCancel: () -> Unit` | `onCancel: () -> Void` | n/a |

---

## NOTES

- **NEW organism:** No RN baseline exists
- **Modal:** Full-screen scrim (80% opacity) with centered card
- **Card:** 80% max height, scrollable content
- **Title:** "Upgrade Your Ride" or "Offline Maps Required"
- **Tier cards:** 2-3 cards with border selection state
- **Tier info:** Name + price + benefits list
- **Benefits:** Check icon + text for each benefit
- **Actions:** Cancel (secondary) + Upgrade (primary) buttons
- **Spacing:** 24px card padding, 16px gaps, 12px tier gaps, 8px benefit gaps
- **Selection:** Primary border on selected tier
- **Accessibility:** Modal announces title, tier selection available
- **TestID:** Passed to container
