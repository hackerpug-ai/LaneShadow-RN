# UI-002 RN Scenario Registry Contract

## Purpose

`UI-002` freezes the React Native baseline scenario contract that native iOS and Android sandbox catalogs must mirror. React Native remains the baseline Storybook. Native platforms reuse the RN-defined scenario `id` and `summary` values inside `LaneShadowStories.all` and `AppStories.all`.

## Registry Artifacts

- Machine-readable manifest: `react-native/stories/registry/scenarioRegistry.generated.ts`
- Generator: `react-native/.rnstorybook/generate-scenario-registry.mjs`
- Browser story: `react-native/stories/registry/ScenarioRegistry.stories.tsx`

## Scenario ID Format

Scenario IDs use the format:

`{tier-slug}/{component-slug}/{story-slug}`

Examples:

- `tokens/colors/default`
- `atoms/button/disabled`
- `molecules/search-bar/default`
- `organisms/route-details-sheet/default`
- `screens/route-options-screen/loading`

These IDs are stable across RN, Android, and iOS. Native catalogs mirror them exactly in `Story.id`.

## Summary Contract

Each registry entry exposes:

- `rnReferencePath`
- `storyTitle`
- `storyExport`
- `summary`

`summary` is the human-readable RN reference string that native platforms surface through `Story.summary`.

## Atomic IA Mapping

The registry assigns every RN baseline scenario to one of these top-level tiers:

- `Tokens`
- `Atoms`
- `Molecules`
- `Organisms`
- `Templates`
- `Screens`

Current rules:

- `tokens/**` => `Tokens`
- `screens/**` => `Screens`
- `sheets/**` => `Organisms`
- `map/**` => `Atoms`, `Molecules`, or `Organisms` via explicit overrides
- `components/**` => `Atoms`, `Molecules`, `Organisms`, or `Templates` via explicit overrides

## Theme Coverage Metadata

The registry stores `themeCoverage` per scenario. The current RN preview wrapper is dark-first, so the baseline manifest records `["dark"]` until a light-mode preview pass is wired for the same inventory.

## Screenshot Naming

Each entry exposes a deterministic screenshot basename:

`rn--{scenario-id-with-slashes-replaced-by-double-dashes}--{theme}`

Examples:

- `rn--tokens--colors--default--dark`
- `rn--atoms--button--disabled--dark`

## Variance Reports

Cross-platform variance reports should use the same scenario id and theme suffix:

- `variance--{scenario-id-with-double-dashes}--rn-vs-android--{theme}.json`
- `variance--{scenario-id-with-double-dashes}--rn-vs-ios--{theme}.json`

This keeps RN, Android, and iOS artifacts aligned under the same baseline key.

---

## TRANSLATION SOURCES

> This is a contract specification document, not a component translation task. Translation sources are managed by the individual component translation tasks that consume this registry contract.
