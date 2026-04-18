#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const storiesRoot = path.join(projectRoot, "stories");
const outputPath = path.join(storiesRoot, "registry", "scenarioRegistry.generated.ts");

const GROUP_ORDER = ["Tokens", "Atoms", "Molecules", "Organisms", "Templates", "Screens"];
const DEFAULT_THEME_COVERAGE = ["dark"];
const TIER_OVERRIDES = new Map([
  ["components/BottomActionSheet.stories.tsx", "Templates"],
  ["components/SessionSidebar.stories.tsx", "Organisms"],
  ["components/FullChatHistoryView.stories.tsx", "Organisms"],
  ["components/PermissionNotification.stories.tsx", "Organisms"],
  ["components/WaypointList.stories.tsx", "Organisms"],
  ["components/DrawerMenu.stories.tsx", "Organisms"],
  ["components/AppHeader.stories.tsx", "Molecules"],
  ["components/Banner.stories.tsx", "Molecules"],
  ["components/BottomNavigation.stories.tsx", "Molecules"],
  ["components/CaptionInput.stories.tsx", "Molecules"],
  ["components/Card.stories.tsx", "Molecules"],
  ["components/ConnectionBanner.stories.tsx", "Molecules"],
  ["components/DepartureTimeSelector.stories.tsx", "Molecules"],
  ["components/EnrichmentStatusIndicator.stories.tsx", "Molecules"],
  ["components/FloatingSearchInput.stories.tsx", "Molecules"],
  ["components/NewSessionButton.stories.tsx", "Molecules"],
  ["components/OverlayPill.stories.tsx", "Molecules"],
  ["components/PlanningProgressIndicator.stories.tsx", "Molecules"],
  ["components/RainTimingSummary.stories.tsx", "Molecules"],
  ["components/RouteAttachmentCard.stories.tsx", "Molecules"],
  ["components/RouteBadge.stories.tsx", "Molecules"],
  ["components/RouteOptionCard.stories.tsx", "Molecules"],
  ["components/RouteThumbnail.stories.tsx", "Molecules"],
  ["components/SavedRouteCard.stories.tsx", "Molecules"],
  ["components/ScenicBiasSegmented.stories.tsx", "Molecules"],
  ["components/SearchBar.stories.tsx", "Molecules"],
  ["components/SectionHeader.stories.tsx", "Molecules"],
  ["components/SegmentDetailView.stories.tsx", "Molecules"],
  ["components/SessionCard.stories.tsx", "Molecules"],
  ["components/StatRow.stories.tsx", "Molecules"],
  ["components/SuggestionChips.stories.tsx", "Molecules"],
  ["components/TempRangeSummary.stories.tsx", "Molecules"],
  ["components/ToggleGroup.stories.tsx", "Molecules"],
  ["components/WeatherPill.stories.tsx", "Molecules"],
  ["components/WeatherStrip.stories.tsx", "Molecules"],
  ["components/waypoints/WaypointCard.stories.tsx", "Molecules"],
  ["map/CompassPlusIcon.stories.tsx", "Atoms"],
  ["map/DeviationPolyline.stories.tsx", "Atoms"],
  ["map/OverlayToggle.stories.tsx", "Atoms"],
  ["map/PlanFab.stories.tsx", "Atoms"],
  ["map/WaypointMarker.stories.tsx", "Atoms"],
  ["map/MapControls.stories.tsx", "Molecules"],
  ["map/MapHeaderOverlay.stories.tsx", "Molecules"],
  ["map/MinimalOverlayWidget.stories.tsx", "Molecules"],
  ["map/WeatherGauge.stories.tsx", "Molecules"],
  ["map/WhereToBar.stories.tsx", "Molecules"],
  ["map/MapView.stories.tsx", "Organisms"],
]);
const DEFAULT_TIERS_BY_PREFIX = [
  ["tokens/", "Tokens"],
  ["screens/", "Screens"],
  ["sheets/", "Organisms"],
  ["map/", "Molecules"],
  ["components/", "Atoms"],
];

function listStoryFiles(rootDir) {
  const output = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      output.push(...listStoryFiles(entryPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".stories.tsx")) {
      output.push(entryPath);
    }
  }
  return output.sort();
}

function slugify(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function parseStoryFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const titleMatch = raw.match(/title:\s*["']([^"']+)["']/);
  const title = titleMatch?.[1] ?? "";
  const exports = [...raw.matchAll(/export const (\w+)\s*:/g)].map((match) => match[1]);
  if (!title || exports.length === 0) {
    throw new Error(`Unable to extract title or story exports from ${filePath}`);
  }
  return { title, exports };
}

function resolveTier(relativePath) {
  if (TIER_OVERRIDES.has(relativePath)) {
    return TIER_OVERRIDES.get(relativePath);
  }
  for (const [prefix, tier] of DEFAULT_TIERS_BY_PREFIX) {
    if (relativePath.startsWith(prefix)) {
      return tier;
    }
  }
  return "Molecules";
}

function buildRegistryEntries() {
  const storyFiles = listStoryFiles(storiesRoot);
  const entries = [];

  for (const absolutePath of storyFiles) {
    const relativePath = path.relative(storiesRoot, absolutePath).replaceAll(path.sep, "/");
    if (relativePath.startsWith("registry/")) {
      continue;
    }

    const componentName = path.basename(relativePath, ".stories.tsx");
    const normalizedComponentName = componentName.replace(/\//g, " ");
    const tier = resolveTier(relativePath);
    const { title, exports } = parseStoryFile(absolutePath);

    for (const exportName of exports) {
      const scenarioId = `${slugify(tier)}/${slugify(normalizedComponentName)}/${slugify(exportName)}`;
      entries.push({
        id: scenarioId,
        tier,
        groupPath: [tier, componentName].join("/"),
        componentName,
        storyTitle: title,
        storyExport: exportName,
        rnReferencePath: `react-native/stories/${relativePath}`,
        summary: `RN reference: react-native/stories/${relativePath}#${exportName}`,
        themeCoverage: DEFAULT_THEME_COVERAGE,
        fixtureKey: `${slugify(componentName)}-${slugify(exportName)}`,
        screenshotBasename: `rn--${scenarioId.replaceAll("/", "--")}--dark`,
      });
    }
  }

  return entries.sort((left, right) => {
    const leftTier = GROUP_ORDER.indexOf(left.tier);
    const rightTier = GROUP_ORDER.indexOf(right.tier);
    if (leftTier !== rightTier) {
      return leftTier - rightTier;
    }
    return left.id.localeCompare(right.id);
  });
}

function renderGeneratedFile(entries) {
  const counts = Object.fromEntries(
    GROUP_ORDER.map((tier) => [tier, entries.filter((entry) => entry.tier === tier).length]),
  );

  return `/**
 * This file is generated by \`react-native/.rnstorybook/generate-scenario-registry.mjs\`.
 * It is the authoritative RN scenario manifest that native iOS/Android catalogs mirror.
 */

export const scenarioGroupOrder = ${JSON.stringify(GROUP_ORDER)} as const
export type ScenarioTier = (typeof scenarioGroupOrder)[number]

export interface ScenarioRegistryEntry {
  id: string
  tier: ScenarioTier
  groupPath: string
  componentName: string
  storyTitle: string
  storyExport: string
  rnReferencePath: string
  summary: string
  themeCoverage: string[]
  fixtureKey: string
  screenshotBasename: string
}

export const scenarioRegistryStats = ${JSON.stringify(counts, null, 2)} as const

export const scenarioRegistry: ScenarioRegistryEntry[] = ${JSON.stringify(entries, null, 2)} as const
`;
}

const registryEntries = buildRegistryEntries();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, renderGeneratedFile(registryEntries));
console.log(`Wrote ${registryEntries.length} scenario entries to ${path.relative(projectRoot, outputPath)}`);
