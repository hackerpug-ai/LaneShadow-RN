# Sheets

Reusable bottom-sheet primitives for Sprint 4 and beyond.

- `BottomActionSheet`: low-level Gorhom modal with `stackBehavior="push"` for stacked sheets. Accepts `snapPoints`, `wrapChildren`, and `testID`.
- `BottomSheetWrapper`: mid-level wrapper that standardizes padding, snap-point presets (`content`, `half`, `full`), and optional `SheetHandle`.
- `SheetHandle`: drag affordance using semantic theme colors.

## Stacking sheets
Use `BottomActionSheet` (or the wrapper) with the default `stackBehavior="push"`:

1. Render Sheet A with `visible`.
2. From Sheet A, set Sheet B `visible` → Sheet B slides over A.
3. Dismiss Sheet B → Sheet A remains mounted/visible.

## Scrollable content
When using Gorhom scrollables (`BottomSheetScrollView`, `BottomSheetFlatList`, etc.), pass `wrapChildren={false}` so those components sit directly under `BottomSheetModal` and manage gestures correctly.
