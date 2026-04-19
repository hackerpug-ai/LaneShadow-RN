---
stability: CONSTITUTION
last_validated: 2026-04-16
prd_version: 1.0.0
functional_group: DESIGN
---

# Android Compose Component Architecture

## Overview

This document maps every React Native component to its Kotlin/Compose equivalent with exact naming and structural parity. The mapping follows Material Design 3 patterns while maintaining visual consistency with iOS.

**Key Principle**: Same component names across platforms (`ThemeButton` on Android = `ThemeButton` on iOS), using idiomatic platform patterns internally.

---

## Section 1: Directory Structure

```
android/app/src/main/java/com/laneshadow/ui/
├── atoms/                    # ~20 atoms - primitive UI elements
│   ├── ThemeButton.kt
│   ├── ThemeText.kt
│   ├── ThemeCard.kt
│   ├── ThemeChip.kt
│   ├── ThemeInput.kt
│   ├── ThemeBadge.kt
│   ├── ThemeCheckbox.kt
│   ├── ThemeSwitch.kt
│   ├── ThemeSlider.kt
│   ├── ThemeAvatar.kt
│   ├── ThemeDivider.kt
│   ├── IconSymbol.kt
│   ├── StatRow.kt
│   ├── RouteBadge.kt
│   ├── WindBadge.kt
│   ├── RainBadge.kt
│   ├── TemperatureBadge.kt
│   ├── WeatherPill.kt
│   ├── Skeleton.kt
│   ├── Progress.kt
│   └── EmptyState.kt
├── molecules/                # ~25 molecules - simple combinations
│   ├── RouteOptionCard.kt
│   ├── RouteThumbnail.kt
│   ├── SessionCard.kt
│   ├── WaypointCard.kt
│   ├── SearchBar.kt
│   ├── PlanningProgressIndicator.kt
│   ├── EnrichmentStatusIndicator.kt
│   ├── SegmentDetailView.kt
│   ├── TempRangeSummary.kt
│   ├── RainTimingSummary.kt
│   ├── WeatherStrip.kt
│   ├── SuggestionChips.kt
│   ├── ScenicBiasSegmented.kt
│   ├── DepartureTimeSelector.kt
│   ├── DateRangePicker.kt
│   ├── ToggleGroup.kt
│   ├── Collapsible.kt
│   ├── DragHandle.kt
│   ├── SheetHandle.kt
│   ├── Banner.kt
│   ├── ConnectionBanner.kt
│   ├── PermissionNotification.kt
│   ├── NewSessionButton.kt
│   ├── FloatingSearchInput.kt
│   └── OverlayPill.kt
├── organisms/                # ~30 organisms - complex components
│   ├── MapHeaderOverlay.kt
│   ├── WeatherPillsRow.kt
│   ├── PlanFab.kt
│   ├── WeatherGauge.kt
│   ├── CompassPlusIcon.kt
│   ├── MinimalOverlayWidget.kt
│   ├── MapToastStack.kt
│   ├── OverlayToggle.kt
│   ├── WhereToBar.kt
│   ├── RouteDetailsSheet.kt
│   ├── RouteTimeline.kt
│   ├── TogglesContainer.kt
│   ├── FavoritesInfoSheet.kt
│   ├── PlanningErrorSheet.kt
│   ├── PlanningLoading.kt
│   ├── PreferencesRow.kt
│   ├── WaypointList.kt
│   ├── EnrichedRouteCard.kt
│   ├── VoiceAssistantOverlay.kt
│   ├── TypingIndicator.kt
│   ├── ErrorMessage.kt
│   ├── SessionContextMenu.kt
│   ├── SessionSidebar.kt
│   ├── DeleteRouteDialog.kt
│   ├── RenameRouteDialog.kt
│   ├── FAB.kt
│   ├── BottomNavigation.kt
│   ├── DrawerMenu.kt
│   ├── SectionHeader.kt
│   ├── Separator.kt
│   ├── MotorcyclePlusIcon.kt
│   └── PlanningStatusTab.kt
├── templates/                # ~5 templates - layout structures
│   ├── BaseViewLayout.kt
│   ├── SubpageLayout.kt
│   ├── AuthScreenLayout.kt
│   ├── MenuLayout.kt
│   └── TeacherTabViewLayout.kt
└── screens/                  # ~8 screens - complete views
    ├── auth/
    │   └── AuthScreen.kt
    ├── map/
    │   └── MapScreen.kt
    ├── routes/
    │   └── RoutesScreen.kt
    ├── offline/
    │   └── OfflineScreen.kt
    └── settings/
        └── SettingsScreen.kt
```

---

## Section 2: Component Mapping Table

| RN Component | Compose Name | File Path | Atomic Level | Composable Signature | Material3 Usage |
|-------------|-------------|-----------|-------------|---------------------|-----------------|
| `components/ui/button.tsx` | `ThemeButton` | `atoms/ThemeButton.kt` | Atom | `@Composable fun ThemeButton(variant: ButtonVariant, size: ButtonSize, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true, loading: Boolean = false, icon: IconSymbol? = null, iconPosition: IconPosition = IconPosition.Left, content: @Composable () -> Unit)` | `Button`, `OutlinedButton`, `TextButton`, `IconButton` |
| `components/ui/primary-button.tsx` | `PrimaryButton` | `atoms/PrimaryButton.kt` | Atom | `@Composable fun PrimaryButton(onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true, loading: Boolean = false, icon: IconSymbol? = null, content: @Composable () -> Unit)` | `Button` with custom styling |
| `components/ui/card.tsx` | `ThemeCard` | `atoms/ThemeCard.kt` | Atom | `@Composable fun ThemeCard(variant: CardVariant, modifier: Modifier = Modifier, onClick: (() -> Unit)? = null, enabled: Boolean = true, showBorder: Boolean = true, content: @Composable ColumnScope.() -> Unit)` | `Card`, `ElevatedCard`, `OutlinedCard` |
| `components/ui/chip.tsx` | `ThemeChip` | `atoms/ThemeChip.kt` | Atom | `@Composable fun ThemeChip(selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true, icon: IconSymbol? = null, label: String)` | `FilterChip`, `InputChip`, `SuggestionChip` |
| `components/ui/badge.tsx` | `ThemeBadge` | `atoms/ThemeBadge.kt` | Atom | `@Composable fun ThemeBadge(variant: BadgeVariant, modifier: Modifier = Modifier, icon: (@Composable () -> Unit)? = null, opacity: Float = 1f, content: @Composable () -> Unit)` | `AssistChip` with custom styling |
| `components/ui/checkbox.tsx` | `ThemeCheckbox` | `atoms/ThemeCheckbox.kt` | Atom | `@Composable fun ThemeCheckbox(checked: Boolean, onCheckedChange: (Boolean) -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true, indeterminate: Boolean = false)` | `Checkbox` + `TriStateCheckbox` |
| `components/ui/switch.tsx` | `ThemeSwitch` | `atoms/ThemeSwitch.kt` | Atom | `@Composable fun ThemeSwitch(checked: Boolean, onCheckedChange: (Boolean) -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true)` | `Switch` |
| `components/ui/slider.tsx` | `ThemeSlider` | `atoms/ThemeSlider.kt` | Atom | `@Composable fun ThemeSlider(value: Float, onValueChange: (Float) -> Unit, modifier: Modifier = Modifier, valueRange: ClosedFloatingPointRange<Float> = 0f..1f, steps: Int = 0, enabled: Boolean = true)` | `Slider` |
| `components/ui/avatar.tsx` | `ThemeAvatar` | `atoms/ThemeAvatar.kt` | Atom | `@Composable fun ThemeAvatar(size: AvatarSize, modifier: Modifier = Modifier, imageUrl: String? = null, initials: String? = null, showBorder: Boolean = false, showRing: Boolean = false, badge: (@Composable () -> Unit)? = null)` | `Avatar` (custom with `Box` + `AsyncImage`) |
| `components/ui/empty-state.tsx` | `EmptyState` | `atoms/EmptyState.kt` | Atom | `@Composable fun EmptyState(icon: IconSymbol, headline: String, body: String, modifier: Modifier = Modifier, ctaLabel: String? = null, onCtaPress: (() -> Unit)? = null)` | `Column` with semantic spacing |
| `components/ui/skeleton.tsx` | `Skeleton` | `atoms/Skeleton.kt` | Atom | `@Composable fun Skeleton(width: Dp, height: Dp, modifier: Modifier = Modifier, shape: SkeletonShape = SkeletonShape.Rounded)` | `Box` with `animateAlpha` |
| `components/ui/progress.tsx` | `Progress` | `atoms/Progress.kt` | Atom | `@Composable fun Progress(value: Float, modifier: Modifier = Modifier, indeterminate: Boolean = false)` | `LinearProgressIndicator` |
| `components/ui/stat-row.tsx` | `StatRow` | `atoms/StatRow.kt` | Atom | `@Composable fun StatRow(icon: IconSymbol, value: String, modifier: Modifier = Modifier, iconSize: Dp = 18.dp)` | `Row` with `Icon` + `Text` |
| `components/ui/route-badge.tsx` | `RouteBadge` | `atoms/RouteBadge.kt` | Atom | `@Composable fun RouteBadge(variant: RouteBadgeVariant, modifier: Modifier = Modifier, icon: IconSymbol? = null, iconSize: Dp = 14.dp, content: @Composable () -> Unit)` | `Surface` with custom styling |
| `components/planning/wind-badge.tsx` | `WindBadge` | `atoms/WindBadge.kt` | Atom | `@Composable fun WindBadge(windLevel: WindLevel, modifier: Modifier = Modifier)` | `ThemeBadge` with color mapping |
| `components/ui/rain-badge.tsx` | `RainBadge` | `atoms/RainBadge.kt` | Atom | `@Composable fun RainBadge(rainLevel: RainLevel, modifier: Modifier = Modifier)` | `ThemeBadge` with icon mapping |
| `components/ui/temperature-badge.tsx` | `TemperatureBadge` | `atoms/TemperatureBadge.kt` | Atom | `@Composable fun TemperatureBadge(temperatureLevel: TemperatureLevel, modifier: Modifier = Modifier, temperatureValue: Int? = null)` | `ThemeBadge` with icon mapping |
| `components/ui/weather-pill.tsx` | `WeatherPill` | `atoms/WeatherPill.kt` | Atom | `@Composable fun WeatherPill(icon: IconSymbol, description: String, modifier: Modifier = Modifier, iconSize: Dp = 16.dp, backgroundColor: Color? = null, textColor: Color? = null)` | `Surface` with custom styling |
| `components/ui/route-option-card.tsx` | `RouteOptionCard` | `molecules/RouteOptionCard.kt` | Molecule | `@Composable fun RouteOptionCard(name: String, variant: RouteOptionCardVariant, modifier: Modifier = Modifier, badges: List<RouteBadgeData> = emptyList(), stats: List<StatRowData> = emptyList(), weatherSummary: String? = null, weatherIcon: IconSymbol = IconSymbol.Air, compactStats: String? = null)` | `Card` + `Column` layout |
| `components/ui/route-thumbnail.tsx` | `RouteThumbnail` | `molecules/RouteThumbnail.kt` | Molecule | `@Composable fun RouteThumbnail(modifier: Modifier = Modifier, width: Dp = 96.dp, height: Dp = 96.dp, rotation: Float = -10f, routeTop: Dp = 20.dp, routeLeft: Dp = 15.dp, routeWidth: Dp = 60.dp, routeHeight: Dp = 50.dp, bounds: Bounds? = null)` | `Box` with `HorizontalGradient` + rotated `Box` |
| `components/ui/session-card.tsx` | `SessionCard` | `molecules/SessionCard.kt` | Molecule | `@Composable fun SessionCard(id: String, title: String, date: Instant, routeCount: Int, status: SessionStatus, previewMessage: String, modifier: Modifier = Modifier, isActive: Boolean = false, onClick: (() -> Unit)? = null, onLongPress: (() -> Unit)? = null, compact: Boolean = false)` | `Card` with `Column` layout |
| `components/waypoints/waypoint-card.tsx` | `WaypointCard` | `molecules/WaypointCard.kt` | Molecule | `@Composable fun WaypointCard(waypoint: Waypoint, order: Int, modifier: Modifier = Modifier, onApprove: ((String) -> Unit)? = null, onReject: ((String) -> Unit)? = null, onReorder: ((String, Int) -> Unit)? = null)` | `Card` with `Column` + action buttons |
| `components/ui/search-bar.tsx` | `SearchBar` | `molecules/SearchBar.kt` | Molecule | `@Composable fun SearchBar(placeholder: String, modifier: Modifier = Modifier, value: String? = null, onClick: (() -> Unit)? = null)` | `Surface` + `Row` with `IconSymbol` |
| `components/ui/planning-progress-indicator.tsx` | `PlanningProgressIndicator` | `molecules/PlanningProgressIndicator.kt` | Molecule | `@Composable fun PlanningProgressIndicator(progress: Float, message: String, modifier: Modifier = Modifier)` | `Column` with `Progress` + `Text` |
| `components/planning/enrichment-status-indicator.tsx` | `EnrichmentStatusIndicator` | `molecules/EnrichmentStatusIndicator.kt` | Molecule | `@Composable fun EnrichmentStatusIndicator(status: EnrichmentStatus, modifier: Modifier = Modifier)` | `Row` with status icons |
| `components/planning/segment-detail-view.tsx` | `SegmentDetailView` | `molecules/SegmentDetailView.kt` | Molecule | `@Composable fun SegmentDetailView(segment: RouteSegment, modifier: Modifier = Modifier)` | `Card` with segment details |
| `components/planning/temp-range-summary.tsx` | `TempRangeSummary` | `molecules/TempRangeSummary.kt` | Molecule | `@Composable fun TempRangeSummary(minTemp: Int, maxTemp: Int, modifier: Modifier = Modifier)` | `Row` with temperature display |
| `components/planning/rain-timing-summary.tsx` | `RainTimingSummary` | `molecules/RainTimingSummary.kt` | Molecule | `@Composable fun RainTimingSummary(rainTiming: List<RainSlot>, modifier: Modifier = Modifier)` | `Row` with rain timing |
| `components/planning/weather-strip.tsx` | `WeatherStrip` | `molecules/WeatherStrip.kt` | Molecule | `@Composable fun WeatherStrip(overlays: RouteOverlays, modifier: Modifier = Modifier)` | `Row` with expandable weather badges |
| `components/ui/suggestion-chips.tsx` | `SuggestionChips` | `molecules/SuggestionChips.kt` | Molecule | `@Composable fun SuggestionChips(suggestions: List<String>, modifier: Modifier = Modifier, onSuggestionClick: (String) -> Unit)` | `Row` with `FilterChip` |
| `components/ui/scenic-bias-segmented.tsx` | `ScenicBiasSegmented` | `molecules/ScenicBiasSegmented.kt` | Molecule | `@Composable fun ScenicBiasSegmented(options: List<ScenicOption>, modifier: Modifier = Modifier, selectedOption: ScenicOption, onOptionSelect: (ScenicOption) -> Unit)` | `SegmentedButton` (Material3) |
| `components/ui/departure-time-selector.tsx` | `DepartureTimeSelector` | `molecules/DepartureTimeSelector.kt` | Molecule | `@Composable fun DepartureTimeSelector(selectedTime: LocalDateTime, modifier: Modifier = Modifier, onTimeSelect: (LocalDateTime) -> Unit)` | `HorizontalDatePicker` |
| `components/ui/date-range-picker.tsx` | `DateRangePicker` | `molecules/DateRangePicker.kt` | Molecule | `@Composable fun DateRangePicker(range: ClosedRange<LocalDate>, modifier: Modifier = Modifier, onRangeSelect: (ClosedRange<LocalDate>) -> Unit)` | `DateRangePicker` (Material3) |
| `components/ui/toggle-group.tsx` | `ToggleGroup` | `molecules/ToggleGroup.kt` | Molecule | `@Composable fun ToggleGroup(type: ToggleGroupType, modifier: Modifier = Modifier, value: String? = null, values: List<String>? = null, onValueChange: ((String?) -> Unit)? = null, variant: ToggleVariant = ToggleVariant.Default, size: ToggleSize = ToggleSize.Default, disabled: Boolean = false, content: @Composable ToggleGroupScope.() -> Unit)` | `Row` with `ToggleGroupItem` |
| `components/ui/collapsible.tsx` | `Collapsible` | `molecules/Collapsible.kt` | Molecule | `@Composable fun Collapsible(expanded: Boolean, modifier: Modifier = Modifier, onExpandedChange: (Boolean) -> Unit, header: @Composable () -> Unit, content: @Composable () -> Unit)` | `Column` with `animateContentSize` |
| `components/ui/drag-handle.tsx` | `DragHandle` | `molecules/DragHandle.kt` | Molecule | `@Composable fun DragHandle(modifier: Modifier = Modifier, dragging: Boolean = false)` | `Box` with drag icon |
| `components/sheets/sheet-handle.tsx` | `SheetHandle` | `molecules/SheetHandle.kt` | Molecule | `@Composable fun SheetHandle(modifier: Modifier = Modifier)` | `Box` with rounded rectangle |
| `components/ui/banner.tsx` | `Banner` | `molecules/Banner.kt` | Molecule | `@Composable fun Banner(visible: Boolean, message: String, modifier: Modifier = Modifier, icon: IconSymbol? = null, actions: List<BannerAction> = emptyList())` | `Banner` (Material3) |
| `components/ui/connection-banner.tsx` | `ConnectionBanner` | `molecules/ConnectionBanner.kt` | Molecule | `@Composable fun ConnectionBanner(isConnected: Boolean, modifier: Modifier = Modifier)` | `Banner` with connection status |
| `components/ui/permission-notification.tsx` | `PermissionNotification` | `molecules/PermissionNotification.kt` | Molecule | `@Composable fun PermissionNotification(permission: String, modifier: Modifier = Modifier, onGrant: () -> Unit, onDismiss: () -> Unit)` | `Card` with action buttons |
| `components/ui/new-session-button.tsx` | `NewSessionButton` | `molecules/NewSessionButton.kt` | Molecule | `@Composable fun NewSessionButton(modifier: Modifier = Modifier, onClick: () -> Unit)` | `FloatingActionButton` |
| `components/ui/floating-search-input.tsx` | `FloatingSearchInput` | `molecules/FloatingSearchInput.kt` | Molecule | `@Composable fun FloatingSearchInput(query: String, modifier: Modifier = Modifier, onQueryChange: (String) -> Unit, placeholder: String = "Search")` | `Surface` with `TextField` |
| `components/ui/overlay-pill.tsx` | `OverlayPill` | `molecules/OverlayPill.kt` | Molecule | `@Composable fun OverlayPill(modifier: Modifier = Modifier, icon: IconSymbol? = null, label: String, onClick: (() -> Unit)? = null)` | `Surface` with pill styling |
| `components/map/map-header-overlay.tsx` | `MapHeaderOverlay` | `organisms/MapHeaderOverlay.kt` | Organism | `@Composable fun MapHeaderOverlay(title: String, modifier: Modifier = Modifier, leftAction: MapHeaderAction? = null, rightAction: MapHeaderAction? = null, showBackground: Boolean = true)` | `Box` with `HorizontalGradient` + `Row` |
| `components/map/weather-pills-row.tsx` | `WeatherPillsRow` | `organisms/WeatherPillsRow.kt` | Organism | `@Composable fun WeatherPillsRow(overlays: RouteOverlays, modifier: Modifier = Modifier)` | `Row` with weather pills |
| `components/map/plan-fab.tsx` | `PlanFab` | `organisms/PlanFab.kt` | Organism | `@Composable fun PlanFab(modifier: Modifier = Modifier, onClick: () -> Unit)` | `FloatingActionButton` extended |
| `components/map/weather-gauge.tsx` | `WeatherGauge` | `organisms/WeatherGauge.kt` | Organism | `@Composable fun WeatherGauge(weatherData: WeatherData, modifier: Modifier = Modifier)` | `Canvas` with custom drawing |
| `components/map/compass-plus-icon.tsx` | `CompassPlusIcon` | `organisms/CompassPlusIcon.kt` | Organism | `@Composable fun CompassPlusIcon(modifier: Modifier = Modifier, heading: Float)` | `Box` with rotated compass |
| `components/map/minimal-overlay-widget.tsx` | `MinimalOverlayWidget` | `organisms/MinimalOverlayWidget.kt` | Organism | `@Composable fun MinimalOverlayWidget(widget: MinimalWidget, modifier: Modifier = Modifier)` | `Surface` with widget content |
| `components/map/map-toast-stack.tsx` | `MapToastStack` | `organisms/MapToastStack.kt` | Organism | `@Composable fun MapToastStack(messages: List<ToastMessage>, modifier: Modifier = Modifier)` | `Box` with stacked toasts |
| `components/map/overlay-toggle.tsx` | `OverlayToggle` | `organisms/OverlayToggle.kt` | Organism | `@Composable fun OverlayToggle(isActive: Boolean, modifier: Modifier = Modifier, onToggle: (Boolean) -> Unit, icon: IconSymbol, label: String)` | `Row` with `ThemeSwitch` |
| `components/map/where-to-bar.tsx` | `WhereToBar` | `organisms/WhereToBar.kt` | Organism | `@Composable fun WhereToBar(modifier: Modifier = Modifier, destination: String? = null, onDestinationChange: (String) -> Unit, onNavigate: () -> Unit)` | `Surface` with search input |
| `components/sheets/route-details-sheet.tsx` | `RouteDetailsSheet` | `organisms/RouteDetailsSheet.kt` | Organism | `@Composable fun RouteDetailsSheet(isVisible: Boolean, modifier: Modifier = Modifier, onDismiss: () -> Unit, route: PlannedRouteOption?, onSave: (() -> Unit)? = null, isSaving: Boolean = false)` | `ModalBottomSheet` |
| `components/sheets/route-timeline.tsx` | `RouteTimeline` | `organisms/RouteTimeline.kt` | Organism | `@Composable fun RouteTimeline(route: Route, modifier: Modifier = Modifier)` | `LazyColumn` with timeline items |
| `components/sheets/toggles-container.tsx` | `TogglesContainer` | `organisms/TogglesContainer.kt` | Organism | `@Composable fun TogglesContainer(toggles: List<ToggleConfig>, modifier: Modifier = Modifier)` | `Column` with toggle rows |
| `components/sheets/favorites-info-sheet.tsx` | `FavoritesInfoSheet` | `organisms/FavoritesInfoSheet.kt` | Organism | `@Composable fun FavoritesInfoSheet(isVisible: Boolean, modifier: Modifier = Modifier, onDismiss: () -> Unit)` | `ModalBottomSheet` |
| `components/sheets/planning-error-sheet.tsx` | `PlanningErrorSheet` | `organisms/PlanningErrorSheet.kt` | Organism | `@Composable fun PlanningErrorSheet(isVisible: Boolean, modifier: Modifier = Modifier, onDismiss: () -> Unit, error: PlanningError, onRetry: () -> Unit)` | `ModalBottomSheet` |
| `components/sheets/planning-loading.tsx` | `PlanningLoading` | `organisms/PlanningLoading.kt` | Organism | `@Composable fun PlanningLoading(modifier: Modifier = Modifier, progress: Float, message: String)` | `Column` with `Progress` + text |
| `components/sheets/preferences-row.tsx` | `PreferencesRow` | `organisms/PreferencesRow.kt` | Organism | `@Composable fun PreferencesRow(title: String, modifier: Modifier = Modifier, description: String? = null, value: String? = null, onClick: (() -> Unit)? = null)` | `Row` with preference UI |
| `components/waypoints/waypoint-list.tsx` | `WaypointList` | `organisms/WaypointList.kt` | Organism | `@Composable fun WaypointList(waypoints: List<Waypoint>, modifier: Modifier = Modifier, onWaypointClick: (Waypoint) -> Unit, onReorder: (List<Waypoint>) -> Unit)` | `LazyColumn` with drag-and-drop |
| `components/enrichment/enriched-route-card.tsx` | `EnrichedRouteCard` | `organisms/EnrichedRouteCard.kt` | Organism | `@Composable fun EnrichedRouteCard(route: EnrichedRoute, modifier: Modifier = Modifier, onClick: () -> Unit)` | `Card` with route details |
| `components/assistant/voice-assistant-overlay.tsx` | `VoiceAssistantOverlay` | `organisms/VoiceAssistantOverlay.kt` | Organism | `@Composable fun VoiceAssistantOverlay(isVisible: Boolean, modifier: Modifier = Modifier, onDismiss: () -> Unit, transcript: String, isListening: Boolean)` | `Surface` with voice UI |
| `components/chat/typing-indicator.tsx` | `TypingIndicator` | `organisms/TypingIndicator.kt` | Organism | `@Composable fun TypingIndicator(modifier: Modifier = Modifier)` | `Row` with animated dots |
| `components/chat/error-message.tsx` | `ErrorMessage` | `organisms/ErrorMessage.kt` | Organism | `@Composable fun ErrorMessage(message: String, modifier: Modifier = Modifier, onDismiss: () -> Unit)` | `Card` with error styling |
| `components/ui/session-context-menu.tsx` | `SessionContextMenu` | `organisms/SessionContextMenu.kt` | Organism | `@Composable fun SessionContextMenu(session: Session, modifier: Modifier = Modifier, onDismiss: () -> Unit, onAction: (SessionAction) -> Unit)` | `DropdownMenu` |
| `components/ui/session-sidebar.tsx` | `SessionSidebar` | `organisms/SessionSidebar.kt` | Organism | `@Composable fun SessionSidebar(sessions: List<Session>, modifier: Modifier = Modifier, selectedSession: Session?, onSessionSelect: (Session) -> Unit)` | `NavigationRail` or permanent drawer |
| `components/ui/delete-route-dialog.tsx` | `DeleteRouteDialog` | `organisms/DeleteRouteDialog.kt` | Organism | `@Composable fun DeleteRouteDialog(isVisible: Boolean, modifier: Modifier = Modifier, onDismiss: () -> Unit, onConfirm: () -> Unit, routeName: String)` | `AlertDialog` |
| `components/ui/rename-route-dialog.tsx` | `RenameRouteDialog` | `organisms/RenameRouteDialog.kt` | Organism | `@Composable fun RenameRouteDialog(isVisible: Boolean, modifier: Modifier = Modifier, onDismiss: () -> Unit, onConfirm: (String) -> Unit, currentName: String)` | `AlertDialog` with `TextField` |
| `components/ui/fab.tsx` | `FAB` | `organisms/FAB.kt` | Organism | `@Composable fun FAB(icon: IconSymbol, modifier: Modifier = Modifier, onClick: () -> Unit, label: String? = null, visible: Boolean = true)` | `FloatingActionButton` |
| `components/ui/bottom-navigation.tsx` | `BottomNavigation` | `organisms/BottomNavigation.kt` | Organism | `@Composable fun BottomNavigation(items: List<NavItem>, modifier: Modifier = Modifier, selectedItem: NavItem?, onItemSelected: (NavItem) -> Unit, backgroundColor: Color? = null)` | `NavigationBar` (Material3) |
| `components/ui/drawer-menu.tsx` | `DrawerMenu` | `organisms/DrawerMenu.kt` | Organism | `@Composable fun DrawerMenu(modifier: Modifier = Modifier, items: List<DrawerItem>, selectedItem: DrawerItem?, onItemSelected: (DrawerItem) -> Unit)` | `PermanentDrawerSheet` or `ModalDrawerSheet` |
| `components/ui/section-header.tsx` | `SectionHeader` | `organisms/SectionHeader.kt` | Organism | `@Composable fun SectionHeader(title: String, modifier: Modifier = Modifier, subtitle: String? = null, action: (@Composable () -> Unit)? = null)` | `Column` with semantic spacing |
| `components/ui/separator.tsx` | `Separator` | `organisms/Separator.kt` | Organism | `@Composable fun Separator(modifier: Modifier = Modifier, orientation: Orientation = Orientation.Horizontal)` | `HorizontalDivider` or `VerticalDivider` |
| `components/ui/motorcycle-plus-icon.tsx` | `MotorcyclePlusIcon` | `organisms/MotorcyclePlusIcon.kt` | Organism | `@Composable fun MotorcyclePlusIcon(modifier: Modifier = Modifier)` | Custom drawing on `Canvas` |
| `components/planning/planning-status-tab.tsx` | `PlanningStatusTab` | `organisms/PlanningStatusTab.kt` | Organism | `@Composable fun PlanningStatusTab(status: PlanningStatus, modifier: Modifier = Modifier, startLabel: String? = null, endLabel: String? = null, statusMessage: String? = null, onTapComplete: () -> Unit, onTapRetry: () -> Unit, onDismiss: () -> Unit)` | `Surface` with animated status |
| `components/layouts/base-view-layout.tsx` | `BaseViewLayout` | `templates/BaseViewLayout.kt` | Template | `@Composable fun BaseViewLayout(modifier: Modifier = Modifier, content: @Composable () -> Unit)` | `Box` with `PaddingValues` from `WindowInsets` |
| `components/layouts/subpage-layout.tsx` | `SubpageLayout` | `templates/SubpageLayout.kt` | Template | `@Composable fun SubpageLayout(title: String, modifier: Modifier = Modifier, backTo: String = "/(app)/(tabs)", rightAction: SubpageAction? = null, content: @Composable () -> Unit)` | `Column` with gradient header + `Surface` content |
| `components/auth/auth-screen-layout.tsx` | `AuthScreenLayout` | `templates/AuthScreenLayout.kt` | Template | `@Composable fun AuthScreenLayout(title: String, modifier: Modifier = Modifier, subtitle: String? = null, backgroundImage: Painter? = null, showGlow: Boolean = true, content: @Composable () -> Unit)` | `Box` with background layers + `Column` |
| `components/layouts/menu-layout.tsx` | `MenuLayout` | `templates/MenuLayout.kt` | Template | `@Composable fun MenuLayout(modifier: Modifier = Modifier, drawerContent: @Composable () -> Unit, content: @Composable () -> Unit)` | `ModalNavigationDrawer` |
| `components/layouts/teacher-tab-view-layout.tsx` | `TeacherTabViewLayout` | `templates/TeacherTabViewLayout.kt` | Template | `@Composable fun TeacherTabViewLayout(tabs: List<TabConfig>, modifier: Modifier = Modifier, content: @Composable (TabConfig) -> Unit)` | `Column` with `TabRow` |

---

## Section 3: Props → Kotlin Data Classes

```kotlin
// ============================================================================
// ATOM PROPS
// ============================================================================

// Button Props
data class ButtonProps(
    val variant: ButtonVariant = ButtonVariant.Default,
    val size: ButtonSize = ButtonSize.Default,
    val enabled: Boolean = true,
    val loading: Boolean = false,
    val icon: IconSymbol? = null,
    val iconPosition: IconPosition = IconPosition.Left,
    val onClick: () -> Unit
)

enum class ButtonVariant { Default, Secondary, Outline, Ghost, Destructive, Link, Glass }
enum class ButtonSize { Sm, Default, Lg, Xl, TwoXl, Icon }
enum class IconPosition { Left, Right }

// Card Props
data class CardProps(
    val variant: CardVariant = CardVariant.Default,
    val onClick: (() -> Unit)? = null,
    val enabled: Boolean = true,
    val showBorder: Boolean = true
)

enum class CardVariant { Default, Primary, Success, Warning, Danger }

// Chip Props
data class ChipProps(
    val label: String,
    val selected: Boolean = false,
    val onClick: () -> Unit,
    val icon: IconSymbol? = null
)

// Badge Props
data class BadgeProps(
    val variant: BadgeVariant = BadgeVariant.Default,
    val icon: (@Composable () -> Unit)? = null,
    val opacity: Float = 1f
)

enum class BadgeVariant { Default, Secondary, Destructive, Outline, Success, Warning, Info }

// Checkbox Props
data class CheckboxProps(
    val checked: Boolean,
    val onCheckedChange: (Boolean) -> Unit,
    val enabled: Boolean = true,
    val indeterminate: Boolean = false
)

// Switch Props
data class SwitchProps(
    val value: Boolean,
    val onValueChange: (Boolean) -> Unit,
    val enabled: Boolean = true
)

// Slider Props
data class SliderProps(
    val value: Float,
    val onValueChange: (Float) -> Unit,
    val valueRange: ClosedFloatingPointRange<Float> = 0f..1f,
    val steps: Int = 0,
    val enabled: Boolean = true
)

// Avatar Props
data class AvatarProps(
    val size: AvatarSize = AvatarSize.Default,
    val imageUrl: String? = null,
    val initials: String? = null,
    val showBorder: Boolean = false,
    val showRing: Boolean = false,
    val badge: (@Composable () -> Unit)? = null
)

enum class AvatarSize { Default, Lg, Xl }

// Skeleton Props
data class SkeletonProps(
    val width: Dp,
    val height: Dp,
    val shape: SkeletonShape = SkeletonShape.Rounded
)

enum class SkeletonShape { Rectangle, Circle, Rounded }

// Progress Props
data class ProgressProps(
    val value: Float,
    val indeterminate: Boolean = false
)

// EmptyState Props
data class EmptyStateProps(
    val icon: IconSymbol,
    val headline: String,
    val body: String,
    val ctaLabel: String? = null,
    val onCtaPress: (() -> Unit)? = null
)

// ============================================================================
// MOLECULE PROPS
// ============================================================================

// RouteOptionCard Props
data class RouteOptionCardProps(
    val name: String,
    val variant: RouteOptionCardVariant = RouteOptionCardVariant.Selected,
    val badges: List<RouteBadgeData> = emptyList(),
    val stats: List<StatRowData> = emptyList(),
    val weatherSummary: String? = null,
    val weatherIcon: IconSymbol = IconSymbol.Air,
    val compactStats: String? = null
)

data class RouteBadgeData(
    val icon: IconSymbol? = null,
    val label: String,
    val variant: RouteBadgeVariant = RouteBadgeVariant.Neutral
)

enum class RouteOptionCardVariant { Selected, Compact }
enum class RouteBadgeVariant { Primary, Neutral }

data class StatRowData(
    val icon: IconSymbol,
    val value: String
)

// RouteThumbnail Props
data class RouteThumbnailProps(
    val width: Dp = 96.dp,
    val height: Dp = 96.dp,
    val rotation: Float = -10f,
    val routeTop: Dp = 20.dp,
    val routeLeft: Dp = 15.dp,
    val routeWidth: Dp = 60.dp,
    val routeHeight: Dp = 50.dp,
    val bounds: Bounds? = null
)

data class Bounds(
    val north: Double,
    val south: Double,
    val east: Double,
    val west: Double
)

// SessionCard Props
data class SessionCardProps(
    val id: String,
    val title: String,
    val date: Instant,
    val routeCount: Int,
    val status: SessionStatus,
    val previewMessage: String,
    val isActive: Boolean = false,
    val onClick: (() -> Unit)? = null,
    val onLongPress: (() -> Unit)? = null,
    val compact: Boolean = false
)

enum class SessionStatus { Active, Completed, Saved }

// WaypointCard Props
data class WaypointCardProps(
    val waypoint: Waypoint,
    val order: Int,
    val onApprove: ((String) -> Unit)? = null,
    val onReject: ((String) -> Unit)? = null,
    val onReorder: ((String, Int) -> Unit)? = null
)

data class Waypoint(
    val id: String,
    val name: String?,
    val description: String?,
    val kind: WaypointKind,
    val status: WaypointStatus,
    val detourInfo: DetourInfo? = null
)

enum class WaypointKind { OnRoute, OffRoute }
enum class WaypointStatus { Approved, Rejected, Evaluating, Ready, Pending, Applied }

data class DetourInfo(
    val distanceKm: Double,
    val durationMinutes: Int
)

// SearchBar Props
data class SearchBarProps(
    val placeholder: String,
    val value: String? = null,
    val onClick: (() -> Unit)? = null
)

// ToggleGroup Props
data class ToggleGroupProps(
    val type: ToggleGroupType = ToggleGroupType.Single,
    val value: String? = null,
    val values: List<String>? = null,
    val onValueChange: ((String?) -> Unit)? = null,
    val variant: ToggleVariant = ToggleVariant.Default,
    val size: ToggleSize = ToggleSize.Default,
    val disabled: Boolean = false
)

enum class ToggleGroupType { Single, Multiple }
enum class ToggleVariant { Default, Outline }
enum class ToggleSize { Sm, Default, Lg }

// WeatherStrip Props
data class WeatherStripProps(
    val overlays: RouteOverlays
)

data class RouteOverlays(
    val wind: WindOverlay,
    val rain: RainOverlay,
    val temperature: TemperatureOverlay
)

// ============================================================================
// ORGANISM PROPS
// ============================================================================

// MapHeaderOverlay Props
data class MapHeaderOverlayProps(
    val title: String,
    val leftAction: MapHeaderAction? = null,
    val rightAction: MapHeaderAction? = null,
    val showBackground: Boolean = true
)

data class MapHeaderAction(
    val icon: IconSymbol,
    val onClick: () -> Unit,
    val testID: String? = null,
    val accessibilityLabel: String? = null,
    val renderIcon: (@Composable () -> Unit)? = null
)

// WeatherPillsRow Props
data class WeatherPillsRowProps(
    val overlays: RouteOverlays
)

// PlanFab Props
data class PlanFabProps(
    val onClick: () -> Unit
)

// RouteDetailsSheet Props
data class RouteDetailsSheetProps(
    val isVisible: Boolean,
    val onDismiss: () -> Unit,
    val route: PlannedRouteOption?,
    val onSave: (() -> Unit)? = null,
    val isSaving: Boolean = false
)

data class PlannedRouteOption(
    val label: String,
    val rationale: String,
    val stats: RouteStats,
    val overlaysPreview: RouteOverlaysPreview
)

data class RouteStats(
    val distanceMeters: Int,
    val durationSeconds: Int,
    val legsCount: Int
)

// PlanningStatusTab Props
data class PlanningStatusTabProps(
    val status: PlanningStatus,
    val startLabel: String? = null,
    val endLabel: String? = null,
    val statusMessage: String? = null,
    val onTapComplete: () -> Unit,
    val onTapRetry: () -> Unit,
    val onDismiss: () -> Unit
)

enum class PlanningStatus { Pending, Running, Completed, Failed, Cancelled }

// ============================================================================
// TEMPLATE PROPS
// ============================================================================

// SubpageLayout Props
data class SubpageLayoutProps(
    val title: String,
    val backTo: String = "/(app)/(tabs)",
    val rightAction: SubpageAction? = null
)

data class SubpageAction(
    val icon: IconSymbol,
    val onClick: () -> Unit,
    val testID: String? = null
)

// AuthScreenLayout Props
data class AuthScreenLayoutProps(
    val title: String,
    val subtitle: String? = null,
    val backgroundImage: Painter? = null,
    val showGlow: Boolean = true
)
```

---

## Section 4: Compose-Specific Patterns

### RN → Compose Pattern Mapping

| React Native Pattern | Compose Equivalent | Notes |
|-------------------|-------------------|-------|
| `StyleSheet.create()` | `Modifier` chains | All styling via modifiers |
| `useState` | `remember + mutableStateOf` | State hoisting with `remember` |
| `useEffect` | `LaunchedEffect / DisposableEffect` | Side effects in composables |
| `useCallback` | `remember + lambda` | Stable references with `remember` |
| `FlatList` | `LazyColumn / LazyRow` | Efficient list rendering |
| `ScrollView` | `Column + verticalScroll()` | Simple scrollable containers |
| `TouchableOpacity` | `Modifier.clickable()` | Touch handling |
| `Modal` | `Dialog` / `ModalBottomSheet` | Modal presentations |
| `BottomSheet` (Gorhom) | `ModalBottomSheet` (Material3) | Sheet presentations |
| `Animated.View` | `AnimatedVisibility` | Enter/exit animations |
| `Animated.timing` | `animate*AsState` | Value animations |
| `Platform.OS === 'ios'` | `Build.VERSION.SDK_INT` | Platform checks |
| `useSafeAreaInsets()` | `WindowInsets.*` | Safe area handling |
| `Pressable` | `Modifier.combinedClickable()` | Press handling |

### Compose State Management Pattern

```kotlin
// ViewModel pattern (Google UDF)
@HiltViewModel
class MapViewModel @Inject constructor(
    private val routeRepository: RouteRepository
) : ViewModel() {
    
    val uiState: StateFlow<MapUiState> = routeRepository
        .observeRoutes()
        .map { MapUiState.Content(it) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = MapUiState.Loading
        )
}

// Composable consuming ViewModel
@Composable
fun MapScreen(
    viewModel: MapViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    when (val state = uiState) {
        is MapUiState.Loading -> LoadingIndicator()
        is MapUiState.Content -> MapContent(state.routes)
    }
}
```

### Theme Consumption Pattern

```kotlin
// Consume theme in composables
@Composable
fun ThemeButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val colors = MaterialTheme.colorScheme
    val typography = MaterialTheme.typography
    val extendedColors = LocalDomainColors.current
    
    Button(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.buttonColors(
            containerColor = extendedColors.primary.default
        )
    ) {
        Text(text = "Button", style = typography.labelLarge)
    }
}
```

---

## Section 5: Material3 Theme Mapping

### Color Token Mapping

| Theme Token (TS) | Compose Property | Material3 Property |
|-----------------|------------------|-------------------|
| `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `md.sys.color.primary` |
| `semantic.color.onPrimary.default` | `MaterialTheme.colorScheme.onPrimary` | `md.sys.color.on-primary` |
| `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` | `md.sys.color.surface` |
| `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `md.sys.color.on-surface` |
| `semantic.color.background.default` | `MaterialTheme.colorScheme.background` | `md.sys.color.background` |
| `semantic.color.card.default` | `LocalDomainColors.current.card.default` | Custom extension |
| `semantic.color.waypointOnRoute.default` | `LocalDomainColors.current.waypointOnRoute.default` | Custom extension |
| `semantic.color.enrichmentFast.default` | `LocalDomainColors.current.enrichmentFast.default` | Custom extension |

### Typography Token Mapping

| Theme Token (TS) | Compose Property | Material3 Property |
|-----------------|------------------|-------------------|
| `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` | `md.sys.typescale.label-small` |
| `semantic.type.label.md` | `MaterialTheme.typography.labelMedium` | `md.sys.typescale.label-medium` |
| `semantic.type.body.sm` | `MaterialTheme.typography.bodySmall` | `md.sys.typescale.body-small` |
| `semantic.type.body.md` | `MaterialTheme.typography.bodyMedium` | `md.sys.typescale.body-medium` |
| `semantic.type.title.md` | `MaterialTheme.typography.titleMedium` | `md.sys.typescale.title-medium` |

### Spacing Token Mapping

| Theme Token (TS) | Compose Property | Value (dp) |
|-----------------|------------------|------------|
| `semantic.space.xs` | `4.dp` | 4 |
| `semantic.space.sm` | `8.dp` | 8 |
| `semantic.space.md` | `12.dp` | 12 |
| `semantic.space.lg` | `16.dp` | 16 |
| `semantic.space.xl` | `24.dp` | 24 |
| `semantic.space.2xl` | `32.dp` | 32 |
| `semantic.space.3xl` | `48.dp` | 48 |
| `semantic.space.4xl` | `64.dp` | 64 |

### Border Radius Token Mapping

| Theme Token (TS) | Compose Property | Value (dp) |
|-----------------|------------------|------------|
| `semantic.radius.none` | `CornerSize(0.dp)` | 0 |
| `semantic.radius.sm` | `CornerSize(4.dp)` | 4 |
| `semantic.radius.md` | `CornerSize(8.dp)` | 8 |
| `semantic.radius.lg` | `CornerSize(16.dp)` | 16 |
| `semantic.radius.xl` | `CornerSize(24.dp)` | 24 |
| `semantic.radius.full` | `CornerSize(50%)` | 50% |

### Elevation Token Mapping

| Theme Token (TS) | Compose Property | Material3 Property |
|-----------------|------------------|-------------------|
| `semantic.elevation[0]` | `CardDefaults.cardElevation(0.dp)` | `md.sys.elevation.level0` |
| `semantic.elevation[1]` | `CardDefaults.cardElevation(1.dp)` | `md.sys.elevation.level1` |
| `semantic.elevation[2]` | `CardDefaults.cardElevation(3.dp)` | `md.sys.elevation.level2` |
| `semantic.elevation[3]` | `CardDefaults.cardElevation(6.dp)` | `md.sys.elevation.level3` |
| `semantic.elevation[4]` | `CardDefaults.cardElevation(8.dp)` | `md.sys.elevation.level4` |
| `semantic.elevation[5]` | `CardDefaults.cardElevation(12.dp)` | `md.sys.elevation.level5` |

---

## Section 6: Build Order

### Phase 1: Foundation (Atoms) - Days 1-3

**Priority**: High - All other components depend on these

1. `IconSymbol.kt` - Icon rendering system (painter resource loading)
2. `ThemeButton.kt` - Button with all variants
3. `ThemeText.kt` - Typography wrapper
4. `ThemeCard.kt` - Card container
5. `ThemeBadge.kt` - Badge component
6. `ThemeChip.kt` - Chip component

**Estimated Complexity**: Medium (each ~2-4 hours)

### Phase 2: Form Controls (Atoms) - Days 4-5

**Priority**: High - Required for forms and inputs

7. `ThemeCheckbox.kt` - Checkbox control
8. `ThemeSwitch.kt` - Toggle switch
9. `ThemeSlider.kt` - Range slider
10. `ThemeInput.kt` - Text input field

**Estimated Complexity**: Low-Medium (each ~1-3 hours)

### Phase 3: Feedback & Loading (Atoms) - Days 6-7

**Priority**: Medium - Required for UX feedback

11. `Progress.kt` - Progress indicator
12. `Skeleton.kt` - Loading skeleton
13. `EmptyState.kt` - Empty state display
14. `Banner.kt` - Alert banner

**Estimated Complexity**: Low (each ~1-2 hours)

### Phase 4: Specialized Atoms - Days 8-10

**Priority**: Medium - Domain-specific components

15. `ThemeAvatar.kt` - User avatar
16. `StatRow.kt` - Stat display row
17. `RouteBadge.kt` - Route attribute badge
18. `WindBadge.kt` - Wind condition badge
19. `RainBadge.kt` - Rain condition badge
20. `TemperatureBadge.kt` - Temperature badge
21. `WeatherPill.kt` - Weather pill

**Estimated Complexity**: Low-Medium (each ~1-3 hours)

### Phase 5: Templates - Days 11-13

**Priority**: High - Required for all screens

22. `BaseViewLayout.kt` - Base layout with safe areas
23. `SubpageLayout.kt` - Subpage header layout
24. `AuthScreenLayout.kt` - Auth screen layout
25. `MenuLayout.kt` - Drawer menu layout

**Estimated Complexity**: Medium (each ~3-5 hours)

### Phase 6: Map Organisms - Days 14-18

**Priority**: High - Core app functionality

26. `MapHeaderOverlay.kt` - Map header overlay
27. `WeatherPillsRow.kt` - Weather pills row
28. `PlanFab.kt` - Plan FAB
29. `WhereToBar.kt` - Where-to search bar
30. `MapToastStack.kt` - Toast stack
31. `OverlayToggle.kt` - Overlay toggle
32. `MinimalOverlayWidget.kt` - Minimal widget
33. `CompassPlusIcon.kt` - Compass icon
34. `WeatherGauge.kt` - Weather gauge (Canvas)

**Estimated Complexity**: Medium-High (each ~3-6 hours)

### Phase 7: Sheet Organisms - Days 19-22

**Priority**: High - Core app functionality

35. `SheetHandle.kt` - Sheet handle
36. `RouteDetailsSheet.kt` - Route details sheet
37. `RouteTimeline.kt` - Route timeline
38. `TogglesContainer.kt` - Toggles container
39. `FavoritesInfoSheet.kt` - Favorites sheet
40. `PlanningErrorSheet.kt` - Error sheet
41. `PlanningLoading.kt` - Planning loading
42. `PreferencesRow.kt` - Preferences row

**Estimated Complexity**: Medium-High (each ~3-5 hours)

### Phase 8: Card Molecules - Days 23-25

**Priority**: High - Route/session display

43. `RouteOptionCard.kt` - Route option card
44. `RouteThumbnail.kt` - Route thumbnail
45. `SessionCard.kt` - Session card
46. `WaypointCard.kt` - Waypoint card
47. `EnrichedRouteCard.kt` - Enriched route card
48. `WaypointList.kt` - Waypoint list

**Estimated Complexity**: Medium (each ~2-4 hours)

### Phase 9: Input Molecules - Days 26-28

**Priority**: Medium - Search and planning inputs

49. `SearchBar.kt` - Search bar
50. `FloatingSearchInput.kt` - Floating search
51. `DepartureTimeSelector.kt` - Time selector
52. `DateRangePicker.kt` - Date range picker
53. `ScenicBiasSegmented.kt` - Scenic bias
54. `SuggestionChips.kt` - Suggestion chips
55. `ToggleGroup.kt` - Toggle group
56. `Collapsible.kt` - Collapsible section

**Estimated Complexity**: Medium-High (each ~2-5 hours)

### Phase 10: Weather & Planning - Days 29-31

**Priority**: Medium - Planning UI

57. `WeatherStrip.kt` - Weather strip
58. `PlanningProgressIndicator.kt` - Progress indicator
59. `EnrichmentStatusIndicator.kt` - Enrichment status
60. `SegmentDetailView.kt` - Segment detail
61. `TempRangeSummary.kt` - Temp range
62. `RainTimingSummary.kt` - Rain timing
63. `PlanningStatusTab.kt` - Planning status tab

**Estimated Complexity**: Medium (each ~2-4 hours)

### Phase 11: Navigation & Dialogs - Days 32-34

**Priority**: Medium - App navigation

64. `BottomNavigation.kt` - Bottom nav
65. `DrawerMenu.kt` - Drawer menu
66. `FAB.kt` - FAB component
67. `DeleteRouteDialog.kt` - Delete dialog
68. `RenameRouteDialog.kt` - Rename dialog
69. `SessionContextMenu.kt` - Context menu
70. `SessionSidebar.kt` - Session sidebar

**Estimated Complexity**: Low-Medium (each ~2-3 hours)

### Phase 12: Specialized Organisms - Days 35-37

**Priority**: Low - Specialized features

71. `VoiceAssistantOverlay.kt` - Voice assistant
72. `TypingIndicator.kt` - Typing indicator
73. `ErrorMessage.kt` - Error message
74. `ConnectionBanner.kt` - Connection banner
75. `PermissionNotification.kt` - Permission notification
76. `NewSessionButton.kt` - New session button
77. `OverlayPill.kt` - Overlay pill
78. `SectionHeader.kt` - Section header
79. `Separator.kt` - Separator
80. `MotorcyclePlusIcon.kt` - Motorcycle icon

**Estimated Complexity**: Low-Medium (each ~1-3 hours)

**Total Estimated Time**: ~37 days for all 80 components

---

## Appendix: Icon Symbol Mapping

### MaterialCommunityIcons → Compose Painter

```kotlin
enum class IconSymbol(val name: String) {
    // Navigation
    ArrowLeft("arrow-left"),
    ArrowRight("arrow-right"),
    Menu("menu"),
    Close("close"),
    CheckCircle("check-circle"),
    AlertCircle("alert-circle"),
    
    // Map & Location
    MapMarker("map-marker"),
    MapMarkerPath("map-marker-path"),
    MapMarkerDistance("map-marker-distance"),
    Routes("routes"),
    Motorbike("motorbike"),
    
    // Weather
    WeatherWindy("weather-windy"),
    WeatherPouring("weather-pouring"),
    Water("water"),
    WaterOutline("water-outline"),
    Thermometer("thermometer"),
    ThermometerLow("thermometer-low"),
    ThermometerHigh("thermometer-high"),
    SnowflakeThermometer("snowflake-thermometer"),
    
    // Actions
    Magnify("magnify"),
    Plus("plus"),
    ContentSave("content-save"),
    Delete("delete"),
    Edit("edit"),
    Share("share"),
    Bookmark("bookmark"),
    BookmarkOutline("bookmark-outline"),
    
    // UI
    DragHorizontalVariant("drag-horizontal-variant"),
    DotsVertical("dots-vertical"),
    Bell("bell"),
    Settings("settings"),
    Info("information"),
    HelpCircle("help-circle"),
    HelpCircleOutline("help-circle-outline"),
    CheckCircleOutline("check-circle-outline"),
    
    // Status
    ClockOutline("clock-outline"),
    VectorPolyline("vector-polyline"),
    RadioboxMarked("radiobox-marked"),
    CircleOutline("circle-outline")
}

// Icon loading via Painter
@Composable
fun rememberIconPainter(icon: IconSymbol): Painter {
    val context = LocalContext.current
    val resId = context.resources.getIdentifier(
        icon.name,
        "drawable",
        context.packageName
    )
    return painterResource(resId)
}
```

---

## Success Criteria

- ☐ All RN components have exact-named Compose equivalents
- ☐ Every component consumes ONLY semantic tokens (no hardcoded values)
- ☐ Material3 components used where available (Button, Card, Chip, etc.)
- ☐ State-aware colors map correctly to Material3 interactive states
- ☐ Domain-specific tokens exposed via extended ColorScheme
- ☐ All components follow Compose best practices (state hoisting, modifier chains)
- ☐ Build order prioritizes atoms before molecules before organisms
- ☐ Estimated complexity provided for each component
- ☐ Cross-platform naming consistency verified (iOS uses same names)

---

## Prohibited Primitives (Sprint 2 photocopy enforcement)

The visual reference for every translated component is the **LaneShadow RN wrapper**, not Material Design 3 defaults. Material 3 defaults paint colors, radii, paddings, ripple, elevation, and typography that do **not** match the RN baseline. Any composable shipped as the final rendered surface must compose from neutral primitives + LaneShadow tokens.

### Final-rendered surfaces — DO NOT use as the visible composable

These Material 3 composables apply default visual styling that violates photocopy parity. They MAY appear inside an implementation only when fully overridden by `LaneShadowTheme` colors, custom `Modifier` chains, and disabled defaults — but they are **prohibited as the final rendered surface** for any RN-translated component.

| Material 3 composable | Why prohibited | Use instead |
|---|---|---|
| `androidx.compose.material3.Button` (and `OutlinedButton`, `TextButton`, `ElevatedButton`, `FilledTonalButton`) | Applies M3 ripple, default min height (40dp), default content padding, M3 color roles | `Surface` + `Box` + `Modifier.clickable(indication = rememberRipple(color = LaneShadowTheme.colors.primary))` (or `Modifier.pointerInput` for press-state replication) |
| `androidx.compose.material3.TextField` (and `OutlinedTextField`) | Applies M3 floating label, indicator line, default 56dp height, M3 color roles | `BasicTextField` wrapped in `Surface` + custom `decorationBox` for label / icons / focus ring |
| `androidx.compose.material3.Switch` | Applies M3 thumb / track sizing, M3 color roles | Custom `Box` + `Canvas` (or `Switch` with full `SwitchDefaults.colors(...)` override + `Modifier.size` matching RN baseline) |
| `androidx.compose.material3.Checkbox` | Applies M3 checkmark drawing, M3 color roles, M3 ripple | Custom `Box` + `Canvas` checkmark, or `Checkbox` with full `CheckboxDefaults.colors(...)` override |
| `androidx.compose.material3.Slider` | Applies M3 thumb size, track height, tick marks | Custom `Slider` with `SliderDefaults.colors(...)` override + custom `thumb` and `track` slots; or `Canvas`-based slider |
| `androidx.compose.material3.Card` | Applies M3 elevation tonal overlay, M3 surface color | `Surface` with `tonalElevation = 0.dp` + explicit `LaneShadowTheme.colors.*` background |
| `androidx.compose.material3.FloatingActionButton` | Applies M3 size, M3 elevation, M3 surface color | `Surface(shape = CircleShape)` + `Modifier.clickable` with explicit token sizing |
| `androidx.compose.material3.Chip` (and variants) | Applies M3 shape, M3 colors, M3 elevation | `Surface` + `Row` + custom selection state |
| `androidx.compose.material3.TopAppBar` / `BottomAppBar` | Applies M3 height, M3 surface color, M3 navigation icon padding | Custom `Row` + `Surface` matching RN AppHeader / BottomNavigation |
| `androidx.compose.material3.Snackbar` | Applies M3 shape, M3 surface color | Custom toast composable (matches RN ErrorToast / SuccessToast / etc.) |

### Allowed neutral primitives

These primitives carry no Material visual opinion and are the building blocks of every photocopy translation:

- `androidx.compose.foundation.layout.*` — `Box`, `Row`, `Column`, `Spacer`, `BoxWithConstraints`
- `androidx.compose.foundation.*` — `Image`, `Canvas`, `clickable`, `combinedClickable`, `border`, `background`
- `androidx.compose.foundation.text.BasicText`, `BasicTextField`
- `androidx.compose.material3.Surface` — used purely as a tinted container with `tonalElevation = 0.dp` (M3 elevation overlay disabled)
- `androidx.compose.ui.draw.*` — `clip`, `shadow`, `alpha`
- `androidx.compose.ui.input.pointer.*` — `pointerInput`, `awaitPointerEventScope` for custom press / drag gestures
- `androidx.compose.runtime.*` — `remember`, `mutableStateOf`, `derivedStateOf`, `LaunchedEffect`
- `androidx.compose.ui.semantics.*` — `semantics`, `Role`, `stateDescription`

### Override pattern when an M3 composable is genuinely the right base

If — and only if — an M3 composable's behavior (e.g., `Slider`'s thumb-drag math) is genuinely worth keeping, it must be wrapped with full default override:

```kotlin
Slider(
    value = value,
    onValueChange = onChange,
    colors = SliderDefaults.colors(
        thumbColor = LaneShadowTheme.colors.primary,
        activeTrackColor = LaneShadowTheme.colors.primary,
        inactiveTrackColor = LaneShadowTheme.colors.surfaceVariant,
        // every color role explicitly set, no M3 default leaks
    ),
    modifier = Modifier.height(LaneShadowTheme.spacing.xl), // RN baseline height, not M3 default
    thumb = { /* custom thumb matching RN baseline */ },
    track = { sliderPositions -> /* custom track matching RN baseline */ },
)
```

If the override block is incomplete (any `*Defaults` color or sizing not explicitly set), the implementation fails the photocopy gate.

---

## Framework-source Reading Map (Sprint 2)

Planners and implementers MUST read these source files when their RN wrapper imports the corresponding primitive:

| RN-wrapper import | Source file in `node_modules` |
|---|---|
| `Text`, `useTheme` from `react-native-paper` | `node_modules/react-native-paper/src/components/Typography/Text.tsx` + `node_modules/react-native-paper/src/components/Typography/v2/*.tsx` (variant tables) + `node_modules/react-native-paper/src/core/theming.tsx` |
| `BottomSheetTextInput`, `BottomSheetView`, `BottomSheetScrollView` from `@gorhom/bottom-sheet` | `node_modules/@gorhom/bottom-sheet/src/components/<name>/<Name>.tsx` (e.g., `bottomSheetTextInput/BottomSheetTextInput.tsx`) |
| `Pressable`, `TouchableOpacity` from `react-native` | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` + `node_modules/react-native/Libraries/Components/Touchable/TouchableOpacity.js` |
| `TextInput` from `react-native` | `node_modules/react-native/Libraries/Components/TextInput/TextInput.js` |
| `Switch` from `react-native` | `node_modules/react-native/Libraries/Components/Switch/Switch.js` |
| `ScrollView`, `View` from `react-native` | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native/Libraries/Components/View/View.js` |
| `LinearGradient` from `expo-linear-gradient` | `node_modules/expo-linear-gradient/build/LinearGradient.js` (+ types) |
| Any other RN-paper / RN-core / RN-third-party import | Locate at `node_modules/<package>/src/...` (TS source) or `node_modules/<package>/Libraries/...` (RN core JS) |

Every style property surfaced by these framework primitives must appear in the `STYLE PROPERTIES MATRIX` of the consuming task per `08f-translation-protocol.md` § Style Property Enumeration Rules.
