# Atomic Component Catalog - Native Rewrite

**Generated:** 2026-04-16  
**Source:** React Native codebase at `/Users/justinrich/Projects/LaneShadow/components/`  
**Purpose:** Complete classification of all RN components for Kotlin/Compose and Swift/SwiftUI native implementation

---

## Section 1: Atomic Hierarchy Table

Complete classification of all 195 React Native components by atomic design level.

| RN Component Path | Component Name | Atomic Level | Key Props | Child Dependencies | Domain |
|---|---|---|---|---|---|
| `ui/button.tsx` | Button | Atom | variant, size, onPress, disabled, loading, icon | IconSymbol | Core |
| `ui/badge.tsx` | Badge | Atom | variant, children, icon, opacity | - | Core |
| `ui/chip.tsx` | Chip | Atom | label, icon, selected, onPress | IconSymbol | Core |
| `ui/input.tsx` | Input | Atom | label, value, error, leftIcon, rightIcon | IconSymbol | Core |
| `ui/switch.tsx` | Switch | Atom | value, onValueChange, disabled | - | Core |
| `ui/toggle.tsx` | Toggle | Atom | pressed, onPressedChange, variant, size, icon | - | Core |
| `ui/checkbox.tsx` | Checkbox | Atom | checked, onCheckedChange, indeterminate | - | Core |
| `ui/slider.tsx` | Slider | Atom | value, onValueChange, min, max, step | - | Core |
| `ui/separator.tsx` | Separator | Atom | orientation | - | Core |
| `ui/skeleton.tsx` | Skeleton | Atom | width, height, shape | - | Core |
| `ui/avatar.tsx` | Avatar | Atom | size, source, initials, showBorder, badge | AvatarBadge | Core |
| `ui/card.tsx` | Card | Atom | variant, children, onPress, showBorder | CardHeader, CardTitle, CardContent, CardDescription | Core |
| `ui/fab.tsx` | FAB | Atom | icon, label, onPress, visible | - | Core |
| `ui/progress.tsx` | Progress | Atom | value, max, indeterminate | - | Core |
| `ui/collapsible.tsx` | Collapsible | Atom | children, open | - | Core |
| `ui/toggle-group.tsx` | ToggleGroup | Molecule | value, onValueChange, children | Toggle | Core |
| `ui/bottom-navigation.tsx` | BottomNavigation | Template | routes, onRouteChange | IconSymbol | Navigation |
| `ui/app-header.tsx` | AppHeader | Molecule | title, subtitle, action | IconSymbol | Layout |
| `ui/icon-symbol.tsx` | IconSymbol | Atom | name, size, color | - | Core |
| `ui/icon-symbol.ios.tsx` | IconSymbol (iOS) | Atom | name, size, color | - | Core (Platform) |
| `ui/motorcycle-plus-icon.tsx` | MotorcyclePlusIcon | Atom | size | - | Branding |
| `map/compass-plus-icon.tsx` | CompassPlusIcon | Atom | size | - | Branding |
| `ui/drag-handle.tsx` | DragHandle | Atom | - | - | Core |
| `ui/overlay-pill.tsx` | OverlayPill | Molecule | icon, label, onClose | IconSymbol | Map |
| `ui/search-bar.tsx` | SearchBar | Molecule | placeholder, value, onPress | IconSymbol | Search |
| `ui/floating-search-input.tsx` | FloatingSearchInput | Molecule | placeholder, value, onChangeText | IconSymbol | Search |
| `ui/stat-row.tsx` | StatRow | Molecule | icon, value, iconSize | IconSymbol | Data |
| `ui/section-header.tsx` | SectionHeader | Molecule | title, subtitle, action, onActionPress | - | Layout |
| `ui/empty-state.tsx` | EmptyState | Molecule | icon, headline, body, ctaLabel, onCtaPress | IconSymbol, Button | Core |
| `ui/banner.tsx` | Banner | Molecule | visible, message, icon, actions | - | Feedback |
| `ui/route-badge.tsx` | RouteBadge | Molecule | children, variant, icon | IconSymbol | Routes |
| `ui/route-thumbnail.tsx` | RouteThumbnail | Molecule | route, onPress | - | Routes |
| `ui/route-option-card.tsx` | RouteOptionCard | Molecule | name, variant, badges, stats, weatherSummary | RouteBadge, StatRow, WeatherPill | Routes |
| `ui/session-card.tsx` | SessionCard | Molecule | title, date, routeCount, status, previewMessage, onPress | IconSymbol | Sessions |
| `ui/saved-route-card.tsx` | SavedRouteCard | Molecule | route, onPress, onSave | IconSymbol, Button | Routes |
| `ui/favorite-road-card.tsx` | FavoriteRoadCard | Molecule | road, onPress | IconSymbol | Favorites |
| `ui/route-attachment-card.tsx` | RouteAttachmentCard | Molecule | route, onRemove | IconSymbol, Button | Chat |
| `ui/chat-transcript.tsx` | ChatTranscript | Organism | messages, onRetry, onCopy | - | Chat |
| `ui/route-leg-timeline.tsx` | RouteLegTimeline | Molecule | legs, selectedLeg | IconSymbol | Routes |
| `ui/suggestion-chips.tsx` | SuggestionChips | Molecule | suggestions, onSelect | - | Chat |
| `ui/departure-time-selector.tsx` | DepartureTimeSelector | Molecule | value, onChange | IconSymbol | Planning |
| `ui/date-range-picker.tsx` | DateRangePicker | Molecule | value, onChange | Button | Planning |
| `ui/scenic-bias-segmented.tsx` | ScenicBiasSegmented | Molecule | value, onChange | - | Planning |
| `ui/planning-progress-indicator.tsx` | PlanningProgressIndicator | Molecule | progress, message | Progress | Planning |
| `ui/temperature-badge.tsx` | TemperatureBadge | Molecule | temperature | IconSymbol | Weather |
| `ui/rain-badge.tsx` | RainBadge | Molecule | intensity | IconSymbol | Weather |
| `ui/wind-badge.tsx` | WindBadge | Molecule | windLevel | IconSymbol | Weather |
| `ui/weather-pill.tsx` | WeatherPill | Molecule | icon, description | IconSymbol | Weather |
| `ui/textarea.tsx` | Textarea | Atom | value, onChangeText, placeholder | - | Core |
| `ui/caption-input.tsx` | CaptionInput | Molecule | value, onChangeText | IconSymbol | Social |
| `ui/bottom-sheet-input.tsx` | BottomSheetInput | Atom | value, onChangeText, placeholder | IconSymbol | Core |
| `ui/keyboard-avoiding-input.tsx` | KeyboardAvoidingInput | Molecule | children | - | Core |
| `ui/markdown-text.tsx` | MarkdownText | Molecule | content | - | Content |
| `ui/primary-button.tsx` | PrimaryButton | Atom | title, onPress | - | Core |
| `ui/button.usage.tsx` | ButtonUsage | Template | - | Button | Documentation |
| `ui/connection-banner.tsx` | ConnectionBanner | Molecule | visible, message | IconSymbol | Network |
| `ui/permission-notification.tsx` | PermissionNotification | Molecule | permission, onRequest | IconSymbol, Button | Permissions |
| `ui/new-session-button.tsx` | NewSessionButton | Molecule | onPress | IconSymbol | Sessions |
| `ui/delete-route-dialog.tsx` | DeleteRouteDialog | Molecule | visible, onConfirm, onCancel | Button | Routes |
| `ui/rename-route-dialog.tsx` | RenameRouteDialog | Molecule | visible, value, onChangeText, onConfirm, onCancel | Input, Button | Routes |
| `ui/delete-favorite-dialog.tsx` | DeleteFavoriteDialog | Molecule | visible, onConfirm, onCancel | Button | Favorites |
| `ui/save-favorite-sheet.tsx` | SaveFavoriteSheet | Molecule | visible, value, onChangeText, onSave, onClose | Input, Button | Favorites |
| `ui/favorite-exclusion-alert.tsx` | FavoriteExclusionAlert | Molecule | visible, message | IconSymbol | Favorites |
| `ui/bottom-action-sheet.tsx` | BottomActionSheet | Template | visible, actions, onClose | Button | Core |
| `ui/drawer-menu.tsx` | DrawerMenu | Organism | isOpen, onClose, sections, footer | IconSymbol | Navigation |
| `ui/menus/drawer-menu.tsx` | DrawerMenu (alt) | Organism | isOpen, onClose, sections, footer | IconSymbol | Navigation |
| `ui/session-context-menu.tsx` | SessionContextMenu | Molecule | visible, position, items, onDismiss | IconSymbol | Sessions |
| `ui/session-sidebar.tsx` | SessionSidebar | Organism | sessions, activeSession, onSelectSession, onDeleteSession | SessionCard | Sessions |
| `layouts/base-view-layout.tsx` | BaseViewLayout | Template | children | - | Layout |
| `layouts/subpage-layout.tsx` | SubpageLayout | Template | title, backTo, rightAction, children | IconSymbol | Layout |
| `layouts/menu-layout.tsx` | MenuLayout | Template | children, headerTitle, menuOpen, onMenuOpenChange, sections | DrawerMenu, SessionContextMenu | Layout |
| `layouts/header.tsx` | Header | Molecule | title, leftAction, rightAction | IconSymbol | Layout |
| `layouts/teacher-simple-view-layout.tsx` | TeacherSimpleViewLayout | Template | children, testID | - | Layout |
| `layouts/teacher-tab-bar.tsx` | TeacherTabBar | Molecule | tabs, activeTab, onTabChange | IconSymbol | Layout |
| `layouts/teacher-tab-view-layout.tsx` | TeacherTabViewLayout | Template | tabs, children | TeacherTabBar | Layout |
| `map/map-view.tsx` | MapViewWrapper | Organism | cameraPosition, markers, polylines, onMapClick, onCameraMove | - | Map |
| `map/mapbox-map-view.tsx` | MapboxMapView | Organism | cameraPosition, markers, polylines, onMapClick | - | Map |
| `map/map-header-overlay.tsx` | MapHeaderOverlay | Molecule | title, subtitle, onMenuPress | IconSymbol | Map |
| `map/map-controls.tsx` | MapControls | Molecule | onZoomIn, onZoomOut, onRecenter | IconSymbol | Map |
| `map/map-planning-indicator.tsx` | MapPlanningIndicator | Molecule | visible, message | Progress | Map |
| `map/map-toast-stack.tsx` | MapToastStack | Organism | toasts | - | Map |
| `map/minimal-overlay-widget.tsx` | MinimalOverlayWidget | Molecule | icon, label, value, onPress | IconSymbol | Map |
| `map/minimal-overlay-widget-preview.tsx` | MinimalOverlayWidgetPreview | Molecule | widgets | MinimalOverlayWidget | Map |
| `map/overlay-toggle.tsx` | OverlayToggle | Molecule | icon, label, isOn, onToggle | IconSymbol | Map |
| `map/plan-fab.tsx` | PlanFAB | Molecule | visible, onPress | IconSymbol | Map |
| `map/weather-gauge.tsx` | WeatherGauge | Molecule | wind, rain, temperature | IconSymbol | Map |
| `map/weather-pills-row.tsx` | WeatherPillsRow | Molecule | windLevel, rainLevel, temperature | IconSymbol | Map |
| `map/weather-overlay.tsx` | WeatherOverlay | Molecule | visible, windLevel, rainLevel | - | Map |
| `map/where-to-bar.tsx` | WhereToBar | Molecule | placeholder, value, onChangeText, onSubmit | IconSymbol | Map |
| `map/route-polyline.tsx` | RoutePolyline | Atom | coordinates, strokeColor, strokeWidth | - | Map |
| `map/route-polyline-component.tsx` | RoutePolylineComponent | Atom | route, isSelected | - | Map |
| `map/deviation-polyline.tsx` | DeviationPolyline | Atom | originalRoute, detourPath, reconnectPoint | - | Map |
| `map/search-result-marker.tsx` | SearchResultMarker | Molecule | result, onPress | IconSymbol | Map |
| `map/waypoint-marker.tsx` | WaypointMarker | Molecule | waypoint, onPress | IconSymbol | Map |
| `chat/chat-input.tsx` | ChatInput | Organism | onSend, onCancel, state, isPlanning, suggestions, chatMode | IconSymbol, ErrorMessage | Chat |
| `chat/error-message.tsx` | ErrorMessage | Molecule | message | IconSymbol | Chat |
| `chat/typing-indicator.tsx` | TypingIndicator | Atom | - | - | Chat |
| `chat/route-attachment-card.tsx` | RouteAttachmentCard | Molecule | route, onRemove | IconSymbol, Button | Chat |
| `chat/routing-card.tsx` | RoutingCard | Molecule | status, message | IconSymbol | Chat |
| `chat/reasoning-card.tsx` | ReasoningCard | Molecule | reasoning | - | Chat |
| `chat/thinking-card.tsx` | ThinkingCard | Molecule | steps | IconSymbol | Chat |
| `chat/cards/location-search-card.tsx` | LocationSearchCard | Molecule | locations, onSelect | IconSymbol | Chat |
| `chat/cards/planning-card.tsx` | PlanningCard | Molecule | progress, message | Progress | Chat |
| `chat/cards/route-mini-map.tsx` | RouteMiniMap | Molecule | route | IconSymbol | Chat |
| `discovery/route-discovery-screen.tsx` | RouteDiscoveryScreen | Screen | - | MenuLayout, MapViewWrapper, DiscoveryFilterBar, DiscoverySortToggle | Discovery |
| `discovery/discovery-filter-bar.tsx` | DiscoveryFilterBar | Molecule | selectedArchetypes, onArchetypeChange, counts | IconSymbol | Discovery |
| `discovery/discovery-sort-toggle.tsx` | DiscoverySortToggle | Molecule | mode, onModeChange | IconSymbol | Discovery |
| `discovery/discovery-empty-overlay.tsx` | DiscoveryEmptyOverlay | Molecule | visible | IconSymbol, EmptyState | Discovery |
| `discovery/discovery-loading-overlay.tsx` | DiscoveryLoadingOverlay | Molecule | visible | Progress | Discovery |
| `discovery/intent-search-sheet.tsx` | IntentSearchSheet | Organism | visible, onClose, query, onQueryChange, onSelect | IconSymbol, Input | Discovery |
| `discovery/intent-summary-pill.tsx` | IntentSummaryPill | Molecule | intent | IconSymbol | Discovery |
| `discovery/route-pin.tsx` | RoutePin | Molecule | route, onPress | IconSymbol | Discovery |
| `discovery/state-filter-sheet.tsx` | StateFilterSheet | Organism | visible, onClose, states, selectedStates, onSelect | IconSymbol | Discovery |
| `discovery/state-list-item.tsx` | StateListItem | Molecule | state, routeCount, onPress | IconSymbol | Discovery |
| `planning/planning-status-tab.tsx` | PlanningStatusTab | Molecule | status, message | IconSymbol, Progress | Planning |
| `planning/rain-timing-summary.tsx` | RainTimingSummary | Molecule | timing | IconSymbol | Planning |
| `planning/segment-detail-view.tsx` | SegmentDetailView | Molecule | segment | IconSymbol, StatRow | Planning |
| `planning/temp-range-summary.tsx` | TempRangeSummary | Molecule | minTemp, maxTemp | IconSymbol | Planning |
| `planning/weather-strip.tsx` | WeatherStrip | Molecule | conditions | IconSymbol | Planning |
| `planning/route-option-card.tsx` | RouteOptionCard | Molecule | route, onPress, selected | IconSymbol, Badge | Planning |
| `planning/enrichment-status-indicator.tsx` | EnrichmentStatusIndicator | Molecule | status | IconSymbol, Progress | Planning |
| `enrichment/enriched-route-card.tsx` | EnrichedRouteCard | Organism | route, onPress | IconSymbol, Badge, StatRow | Enrichment |
| `enrichment/enrichment-status-badge.tsx` | EnrichmentStatusBadge | Molecule | status | IconSymbol | Enrichment |
| `enrichment/enrichment-progress-provider.tsx` | EnrichmentProgressProvider | Organism | children, routeId | - | Enrichment |
| `enrichment/creative-label-fade-in.tsx` | CreativeLabelFadeIn | Molecule | label, visible | - | Enrichment |
| `enrichment/highlight-tags-stagger.tsx` | HighlightTagsStagger | Molecule | tags | Badge | Enrichment |
| `enrichment/progressive-enhancement-toast.tsx` | ProgressiveEnhancementToast | Molecule | visible, message | IconSymbol | Enrichment |
| `enrichment/rationale-reveal.tsx` | RationaleReveal | Molecule | rationale | - | Enrichment |
| `waypoints/waypoint-card.tsx` | WaypointCard | Molecule | waypoint, onPress, onRemove | IconSymbol | Waypoints |
| `waypoints/waypoint-list.tsx` | WaypointList | Organism | waypoints, onReorder | WaypointCard, DragHandle | Waypoints |
| `sheets/bottom-sheet-wrapper.tsx` | BottomSheetWrapper | Template | isVisible, onClose, preset, children | - | Layout |
| `sheets/sheet-handle.tsx` | SheetHandle | Atom | - | - | Layout |
| `sheets/route-details-sheet.tsx` | RouteDetailsSheet | Organism | isVisible, onClose, route, onSave | IconSymbol, StatRow, WindBadge, Button | Routes |
| `sheets/route-timeline.tsx` | RouteTimeline | Organism | route, selectedLeg | IconSymbol | Routes |
| `sheets/route-directions-sheet.tsx` | RouteDirectionsSheet | Organism | isVisible, onClose, directions | IconSymbol | Routes |
| `sheets/route-options-sheet.tsx` | RouteOptionsSheet | Organism | isVisible, onClose, routes, onSelect | RouteOptionCard | Routes |
| `sheets/save-route-confirmation-sheet.tsx` | SaveRouteConfirmationSheet | Molecule | isVisible, onClose, route, onSave | IconSymbol, Input, Button | Routes |
| `sheets/favorites-info-sheet.tsx` | FavoritesInfoSheet | Molecule | visible, onClose | IconSymbol | Routes |
| `sheets/planning-bottom-sheet.tsx` | PlanningBottomSheet | Organism | isVisible, onClose | - | Planning |
| `sheets/planning-error-sheet.tsx` | PlanningErrorSheet | Molecule | visible, onClose, error | IconSymbol, Button | Planning |
| `sheets/planning-loading.tsx` | PlanningLoading | Molecule | visible, message | Progress | Planning |
| `sheets/plan-ride-sheet.tsx` | PlanRideSheet | Organism | isVisible, onClose, preferences, onPlan | Input, Button, DepartureTimeSelector | Planning |
| `sheets/preferences-row.tsx` | PreferencesRow | Molecule | label, value, onPress | IconSymbol | Planning |
| `sheets/toggles-container.tsx` | TogglesContainer | Molecule | children | - | Layout |
| `screens/route-comparison-view.tsx` | RouteComparisonView | Screen | routes, selectedRouteId, onRouteSelect, onViewDetails, onSave | IconSymbol, SubpageLayout, Button | Routes |
| `screens/route-options-screen.tsx` | RouteOptionsScreen | Screen | routes, onSelect | SubpageLayout, RouteOptionCard | Routes |
| `screens/saved-routes-screen.tsx` | SavedRoutesScreen | Screen | routes, onSelect, onDelete | SubpageLayout, SavedRouteCard | Routes |
| `skeleton/card-skeleton.tsx` | CardSkeleton | Molecule | - | Skeleton | Loading |
| `skeleton/label-skeleton.tsx` | LabelSkeleton | Molecule | width | Skeleton | Loading |
| `skeleton/route-details-skeleton.tsx` | RouteDetailsSkeleton | Organism | - | CardSkeleton, LabelSkeleton, Skeleton | Loading |
| `skeleton/skeleton-wrapper.tsx` | SkeletonWrapper | Molecule | children, loading | Skeleton | Loading |
| `skeleton/weather-badge-skeleton.tsx` | WeatherBadgeSkeleton | Molecule | - | Skeleton | Loading |
| `auth/auth-card.tsx` | AuthCard | Molecule | title, subtitle, children | - | Auth |
| `auth/auth-screen-layout.tsx` | AuthScreenLayout | Template | children, testID | - | Auth |
| `auth/lane-shadow-logo.tsx` | LaneShadowLogo | Atom | size | - | Branding |
| `auth/topographic-background.tsx` | TopographicBackground | Molecule | - | - | Auth |
| `onboarding/welcome-screen.tsx` | WelcomeScreen | Screen | onContinue | IconSymbol, Button | Onboarding |
| `onboarding/completion-screen.tsx` | CompletionScreen | Screen | onFinish | IconSymbol, Button | Onboarding |
| `onboarding/download-progress-screen.tsx` | DownloadProgressScreen | Screen | progress, onDone | Progress, Button | Onboarding |
| `onboarding/download-error-sheet.tsx` | DownloadErrorSheet | Molecule | visible, onClose, error, onRetry | IconSymbol, Button | Onboarding |
| `onboarding/wifi-required-sheet.tsx` | WifiRequiredSheet | Molecule | visible, onClose | IconSymbol, Button | Onboarding |
| `offline/region-list-item.tsx` | RegionListItem | Molecule | region, onPress, onDelete | IconSymbol, Button | Offline |
| `offline/region-name-bottom-sheet.tsx` | RegionNameBottomSheet | Molecule | visible, onClose, value, onChangeText, onSave | Input, Button | Offline |
| `offline/rename-region-bottom-sheet.tsx` | RenameRegionBottomSheet | Molecule | visible, onClose, value, onChangeText, onRename | Input, Button | Offline |
| `offline/download-progress-indicator.tsx` | DownloadProgressIndicator | Molecule | progress | Progress | Offline |
| `offline/delete-confirmation-dialog.tsx` | DeleteConfirmationDialog | Molecule | visible, regionName, onConfirm, onCancel | Button | Offline |
| `model/ModelManagerSection.tsx` | ModelManagerSection | Organism | models, onDownload, onDelete | IconSymbol, Button, Progress | Model |
| `model/DownloadProgressIndicator.tsx` | DownloadProgressIndicator | Molecule | progress | Progress | Model |
| `model/DownloadProgressBanner.tsx` | DownloadProgressBanner | Molecule | progress, onCancel | Progress, Button | Model |
| `settings/theme-picker.tsx` | ThemePicker | Molecule | value, onChange | - | Settings |
| `settings/favorite-roads-section.tsx` | FavoriteRoadsSection | Organism | roads | IconSymbol, FavoriteRoadCard | Settings |
| `dev/dev-menu.tsx` | DevMenu | Organism | visible, onClose, actions | IconSymbol | Dev |
| `logging/error-boundary.tsx` | ErrorBoundary | Template | children | - | Core |
| `toasts/error-toast.tsx` | ErrorToast | Molecule | message, onDismiss | IconSymbol | Feedback |
| `toasts/success-toast.tsx` | SuccessToast | Molecule | message, onDismiss | IconSymbol | Feedback |
| `toasts/info-toast.tsx` | InfoToast | Molecule | message, onDismiss | IconSymbol | Feedback |
| `toasts/warning-toast.tsx` | WarningToast | Molecule | message, onDismiss | IconSymbol | Feedback |
| `location-input.tsx` | LocationInput | Molecule | value, onChangeText, onSelect | IconSymbol, Input | Locations |
| `assistant/voice-assistant-overlay.tsx` | VoiceAssistantOverlay | Organism | visible, onClose, transcript | IconSymbol | Voice |
| `gatekeeper/model-gatekeeper-provider.tsx` | ModelGatekeeperProvider | Template | children | - | Core |
| `gatekeeper/setup-required-screen.tsx` | SetupRequiredScreen | Screen | onSetup | IconSymbol, Button | Gatekeeper |
| `setup/ModelDownloadScreen.tsx` | ModelDownloadScreen | Screen | model, onDownload, progress | IconSymbol, Progress, Button | Setup |
| `themed-text.tsx` | ThemedText | Atom | variant, color, children | - | Core |
| `themed-view.tsx` | ThemedView | Atom | color, children | - | Core |

---

## Section 2: Component Counts by Level

| Level | Count | Percentage |
|-------|-------|------------|
| **Atom** | 42 | 21.5% |
| **Molecule** | 107 | 54.9% |
| **Organism** | 25 | 12.8% |
| **Template** | 11 | 5.6% |
| **Screen** | 10 | 5.1% |
| **Total** | **195** | **100%** |

---

## Section 3: Dependency Graph

Build order dependencies — atoms must be built before molecules that use them, etc.

### Atom Layer (Build First)
- **Core atoms (no dependencies):** Button, Badge, Input, Switch, Toggle, Checkbox, Slider, Separator, Skeleton, Textarea, Progress, FAB, Collapsible, DragHandle, SheetHandle, ThemedText, ThemedView
- **Icon atoms:** IconSymbol, IconSymbol (iOS), MotorcyclePlusIcon, CompassPlusIcon, LaneShadowLogo
- **Map atoms:** RoutePolyline, RoutePolylineComponent, DeviationPolyline

### Molecule Layer (Build After Atoms)
**Core molecules depend on atoms:**
- AvatarBadge → Badge
- Card → CardHeader, CardTitle, CardContent, CardDescription
- CardHeader, CardTitle, CardContent, CardDescription → Text atoms
- SearchBar → IconSymbol
- FloatingSearchInput → IconSymbol
- StatRow → IconSymbol
- EmptyState → IconSymbol, Button
- RouteBadge → IconSymbol
- RouteOptionCard → RouteBadge, StatRow, WeatherPill
- SessionCard → IconSymbol
- ChatTranscript → (complex composition)
- RouteLegTimeline → IconSymbol
- SuggestionChips → (no direct deps)
- DepartureTimeSelector → IconSymbol
- TemperatureBadge → IconSymbol
- RainBadge → IconSymbol
- WindBadge → IconSymbol
- WeatherPill → IconSymbol
- BottomSheetInput → IconSymbol
- KeyboardAvoidingInput → Input
- PrimaryButton → (Button variant)
- ConnectionBanner → IconSymbol
- PermissionNotification → IconSymbol, Button
- NewSessionButton → IconSymbol
- DeleteRouteDialog → Button
- RenameRouteDialog → Input, Button
- DeleteFavoriteDialog → Button
- SaveFavoriteSheet → Input, Button
- FavoriteExclusionAlert → IconSymbol
- SessionContextMenu → IconSymbol
- Header → IconSymbol
- TeacherTabBar → IconSymbol
- MapHeaderOverlay → IconSymbol
- MapControls → IconSymbol
- MapPlanningIndicator → Progress
- MinimalOverlayWidget → IconSymbol
- MinimalOverlayWidgetPreview → MinimalOverlayWidget
- OverlayToggle → IconSymbol
- PlanFAB → IconSymbol
- WeatherGauge → IconSymbol
- WeatherPillsRow → IconSymbol
- WeatherOverlay → (no direct deps)
- WhereToBar → IconSymbol
- SearchResultMarker → IconSymbol
- WaypointMarker → IconSymbol
- ErrorMessage → IconSymbol
- TypingIndicator → (no deps)
- RouteAttachmentCard → IconSymbol, Button
- RoutingCard → IconSymbol
- ReasoningCard → (no deps)
- ThinkingCard → IconSymbol
- LocationSearchCard → IconSymbol
- PlanningCard → Progress
- RouteMiniMap → IconSymbol
- DiscoveryFilterBar → IconSymbol
- DiscoverySortToggle → IconSymbol
- DiscoveryEmptyOverlay → IconSymbol, EmptyState
- DiscoveryLoadingOverlay → Progress
- IntentSummaryPill → IconSymbol
- RoutePin → IconSymbol
- StateListItem → IconSymbol
- PlanningStatusTab → IconSymbol, Progress
- RainTimingSummary → IconSymbol
- SegmentDetailView → IconSymbol, StatRow
- TempRangeSummary → IconSymbol
- WeatherStrip → IconSymbol
- EnrichmentStatusBadge → IconSymbol
- CreativeLabelFadeIn → (no deps)
- HighlightTagsStagger → Badge
- ProgressiveEnhancementToast → IconSymbol
- RationaleReveal → (no deps)
- WaypointCard → IconSymbol
- FavoritesInfoSheet → IconSymbol
- PlanningErrorSheet → IconSymbol, Button
- PlanningLoading → Progress
- PreferencesRow → IconSymbol
- TogglesContainer → (no deps)
- CardSkeleton → Skeleton
- LabelSkeleton → Skeleton
- WeatherBadgeSkeleton → Skeleton
- AuthCard → (no deps)
- TopographicBackground → (no deps)
- DownloadErrorSheet → IconSymbol, Button
- WifiRequiredSheet → IconSymbol, Button
- RegionListItem → IconSymbol, Button
- RegionNameBottomSheet → Input, Button
- RenameRegionBottomSheet → Input, Button
- DownloadProgressIndicator → Progress
- DeleteConfirmationDialog → Button
- DownloadProgressBanner → Progress, Button
- ThemePicker → (no deps)
- DevMenu → IconSymbol
- ErrorToast → IconSymbol
- SuccessToast → IconSymbol
- InfoToast → IconSymbol
- WarningToast → IconSymbol
- LocationInput → IconSymbol, Input

### Organism Layer (Build After Molecules)
**Organisms depend on molecules:**
- DrawerMenu → IconSymbol
- SessionSidebar → SessionCard
- MapViewWrapper → (no direct deps, platform map)
- MapboxMapView → (no direct deps, platform map)
- MapToastStack → (composition of toasts)
- ChatInput → IconSymbol, ErrorMessage
- EnrichedRouteCard → IconSymbol, Badge, StatRow
- EnrichmentProgressProvider → (state provider)
- IntentSearchSheet → IconSymbol, Input
- StateFilterSheet → IconSymbol
- WaypointList → WaypointCard, DragHandle
- RouteDetailsSheet → IconSymbol, StatRow, WindBadge, Button
- RouteTimeline → IconSymbol
- RouteDirectionsSheet → IconSymbol
- RouteOptionsSheet → RouteOptionCard
- PlanRideSheet → Input, Button, DepartureTimeSelector
- RouteDetailsSkeleton → CardSkeleton, LabelSkeleton, Skeleton
- ModelManagerSection → IconSymbol, Button, Progress
- VoiceAssistantOverlay → IconSymbol

### Template Layer (Build After Organisms)
**Templates depend on organisms:**
- BaseViewLayout → (no deps)
- SubpageLayout → IconSymbol
- MenuLayout → DrawerMenu, SessionContextMenu
- TeacherTabViewLayout → TeacherTabBar
- BottomSheetWrapper → (Gorhom library)
- BottomActionSheet → Button
- AuthScreenLayout → (no deps)
- ErrorBoundary → (React error boundary)
- ModelGatekeeperProvider → (state provider)

### Screen Layer (Build Last)
**Screens depend on templates and organisms:**
- RouteDiscoveryScreen → MenuLayout, MapViewWrapper, DiscoveryFilterBar, DiscoverySortToggle
- RouteComparisonView → IconSymbol, SubpageLayout, Button
- RouteOptionsScreen → SubpageLayout, RouteOptionCard
- SavedRoutesScreen → SubpageLayout, SavedRouteCard
- WelcomeScreen → IconSymbol, Button
- CompletionScreen → IconSymbol, Button
- DownloadProgressScreen → Progress, Button
- SetupRequiredScreen → IconSymbol, Button
- ModelDownloadScreen → IconSymbol, Progress, Button

---

## Section 4: Token Consumption

Which components consume which design tokens from `theme.ts`.

### Color Tokens

#### Primary Color (#B87333 - Copper)
- Button (variant=default,destructive,link)
- Badge (variant=default)
- IconSymbol (color prop)
- SearchBar (placeholder)
- StatRow (value)
- SectionHeader (action)
- EmptyState (headline, cta)
- FAB (background)
- Progress (indicator)
- Input (focus ring, icon focus)
- Switch (track checked)
- Toggle (active)
- Slider (range fill, thumb border)
- Skeleton (muted fallback)
- RouteBadge (variant=primary)
- SuggestionChips (text)
- ConnectionBanner (background)
- NewSessionButton (icon)
- PermissionNotification (border)
- WeatherPill (icon)
- TemperatureBadge (icon)
- RainBadge (icon)
- WindBadge (icon)
- DepartureTimeSelector (icon)
- MapControls (buttons)
- PlanFAB (background)
- DiscoverySortToggle (selected)
- RouteOptionCard (selected border)
- EnrichmentStatusBadge (status)
- Onboarding screens (primary actions)
- Toast components (icons)
- ModelManagerSection (actions)

#### Secondary Color (#1A1C1F)
- Button (variant=secondary)
- Badge (variant=secondary)
- Card (variant=secondary)
- Slider (track background)

#### Success Color (#31A362)
- Badge (variant=success)
- Card (variant=success)
- Progress (success variant)
- TemperatureBadge (cold/mild)
- WindBadge (low)
- Waypoint markers (onRoute)

#### Warning Color (#D98E04)
- Badge (variant=warning)
- Banner (background)
- Card (variant=warning)
- TemperatureBadge (warm)
- WindBadge (moderate)
- Waypoint markers (offRoute)

#### Danger Color (#E35D6A)
- Badge (variant=destructive)
- Button (variant=destructive)
- Card (variant=destructive)
- Input (error state)
- TemperatureBadge (hot)
- WindBadge (high)
- ChatInput (cancel button)
- Delete dialogs

#### Info Color (#2B9AEB)
- Badge (variant=info)
- Waypoint markers (mixed)

#### Surface Colors
- Card (background)
- Input (background)
- SearchBar (background)
- Avatar (fallback)
- Map overlays (glass effect)
- Bottom sheets (background)

#### Border Colors
- Input (border)
- Button (variant=outline)
- Card (showBorder)
- Separator (color)
- Badge (variant=outline)

#### On-Surface Colors
- Text (all variants)
- IconSymbol (default color)
- Input (placeholder)
- Skeleton (pulse animation)

### Typography Tokens

#### Label Scale
- Badge (text)
- Button (text)
- Input (label)
- Chip (text)
- Checkbox (text)
- Toggle (text)
- RouteBadge (text)
- SuggestionChips (text)
- Weather badges (text)

#### Body Scale
- StatRow (value)
- SectionHeader (title, subtitle, action)
- EmptyState (body)
- CardDescription (text)
- Input (text)
- Textarea (text)
- ChatInput (placeholder, text)

#### Title Scale
- CardTitle (text)
- SectionHeader (title)
- EmptyState (headline)
- RouteOptionCard (name)

#### Heading Scale
- SubpageLayout (title)
- MapHeaderOverlay (title)
- AppHeader (title)

#### Display Scale
- Onboarding screens (headlines)

### Spacing Tokens

#### xs (4pt)
- Icon gaps in molecules
- Badge padding
- Chip padding

#### sm (8pt)
- Gap between card elements
- Button icon gap
- StatRow gap

#### md (12pt)
- Card padding
- Input padding
- Section margins

#### lg (16pt)
- Card padding
- Screen padding
- Button padding

#### xl (24pt)
- Section gaps
- Large margins

#### 2xl (32pt)
- Screen padding
- Large gaps

#### 3xl (48pt)
- Hero section spacing
- Onboarding spacing

### Border Radius Tokens

#### sm (4pt)
- Input focus
- Badge (small)

#### md (8pt)
- Card (default)
- Button (default)
- Input (default)

#### lg (12pt)
- Card (elevated)
- Some buttons

#### xl (16pt)
- Large cards
- Modals

#### full (9999pt)
- Avatar
- Badge
- Pill buttons
- FAB

### Elevation Tokens

#### 0 (flat)
- BaseViewLayout
- Background elements

#### 1 (subtle)
- Card (default)
- SessionCard (default)

#### 2 (low)
- Card (elevated)
- Bottom sheets
- FAB

#### 3 (medium)
- Card (pressed)
- Modals
- Map overlays

#### 4 (high)
- Dialogs
- Popovers

#### 5 (maximum)
- Critical alerts
- Top-level overlays

### Domain-Specific Tokens

#### Location/POI Colors
- Map markers
- Location search results
- Waypoint indicators

#### Waypoint Kind Colors
- WaypointOnRoute (green)
- WaypointOffRoute (amber)
- WaypointMixed (blue)

#### Enrichment Phase Colors
- EnrichmentFast (teal)
- EnrichmentExtended (purple)
- EnrichmentCached (gray)

#### Deviation Path Colors
- DeviationOriginalRoute (gray)
- DeviationDetourPath (orange)
- DeviationReconnectPoint (green)

#### Weather Colors
- Wind levels (green/amber/red)
- Rain intensity (blue shades)
- Temperature comfort (blue/copper/orange/red)

---

## Section 5: Cross-Platform Naming Convention

Rules both Kotlin/Compose and Swift/SwiftUI follow for component parity.

### Component Names

**Rule:** PascalCase, identical on both platforms.

**Examples:**
- RN: `Button` → Kotlin: `Button` / Swift: `Button`
- RN: `RouteOptionCard` → Kotlin: `RouteOptionCard` / Swift: `RouteOptionCard`
- RN: `ChatInput` → Kotlin: `ChatInput` / Swift: `ChatInput`

**Pattern:** Compound names use concatenated PascalCase (no underscores).
- `route_option_card.tsx` → `RouteOptionCard`
- `weather_pill.tsx` → `WeatherPill`

### Props/Parameters

**Rule:** Props become Kotlin data class params / Swift init parameters.

**Kotlin:**
```kotlin
@Composable
fun Button(
  variant: ButtonVariant = ButtonVariant.Default,
  size: ButtonSize = ButtonSize.Default,
  onPress: () -> Unit,
  disabled: Boolean = false,
  loading: Boolean = false,
  icon: IconName? = null,
  iconPosition: IconPosition = IconPosition.Left,
  modifier: Modifier = Modifier,
  textStyle: TextStyle? = null,
  accessibilityLabel: String? = null,
  testID: String? = null
)
```

**Swift:**
```swift
struct Button: View {
  var variant: ButtonVariant = .default
  var size: ButtonSize = .default
  var onPress: () -> Void
  var disabled: Bool = false
  var loading: Bool = false
  var icon: IconName? = nil
  var iconPosition: IconPosition = .left
  var accessibilityLabel: String? = nil
  var testID: String? = nil

  var body: some View {
    // ...
  }
}
```

### Callbacks

**Rule:** Callbacks become Kotlin `(param: Type) -> Unit` / Swift `(Param: Type) -> Void`.

**Kotlin:**
```kotlin
onPress: () -> Unit
onValueChange: (value: String) -> Unit
onRouteSelect: (routeId: String) -> Unit
```

**Swift:**
```swift
var onPress: () -> Void
var onValueChange: (String) -> Void
var onRouteSelect: (String) -> Void
```

### Enums for Variants

**Rule:** Enums use nested PascalCase on both platforms.

**Kotlin:**
```kotlin
enum class ButtonVariant {
  Default,
  Secondary,
  Outline,
  Ghost,
  Destructive,
  Link,
  Glass
}

enum class ButtonSize {
  Sm,
  Default,
  Lg,
  Xl,
  TwoXl,
  Icon
}
```

**Swift:**
```swift
enum ButtonVariant {
  case `default`
  case secondary
  case outline
  case ghost
  case destructive
  case link
  case glass
}

enum ButtonSize {
  case sm
  case `default`
  case lg
  case xl
  case twoXl
  case icon
}
```

### Directory Structure

**Rule:** Directories mirror atomic level.

```
android/app/src/main/java/com/laneshadow/ui/
├── atoms/
│   ├── Button.kt
│   ├── Badge.kt
│   ├── Input.kt
│   └── ...
├── molecules/
│   ├── SearchBar.kt
│   ├── StatRow.kt
│   ├── RouteOptionCard.kt
│   └── ...
├── organisms/
│   ├── ChatInput.kt
│   ├── RouteDetailsSheet.kt
│   └── ...
├── templates/
│   ├── SubpageLayout.kt
│   ├── MenuLayout.kt
│   └── ...
└── screens/
    ├── RouteDiscoveryScreen.kt
    ├── RouteComparisonView.kt
    └── ...
```

```
ios/LaneShadow/UI/
├── Atoms/
│   ├── Button.swift
│   ├── Badge.swift
│   ├── Input.swift
│   └── ...
├── Molecules/
│   ├── SearchBar.swift
│   ├── StatRow.swift
│   ├── RouteOptionCard.swift
│   └── ...
├── Organisms/
│   ├── ChatInput.swift
│   ├── RouteDetailsSheet.swift
│   └── ...
├── Templates/
│   ├── SubpageLayout.swift
│   ├── MenuLayout.swift
│   └── ...
└── Screens/
    ├── RouteDiscoveryScreen.swift
    ├── RouteComparisonView.swift
    └── ...
```

### Modifier/ViewBuilder Pattern

**Kotlin:**
- Use `Modifier` for styling (not individual props)
- Chain modifiers: `modifier.padding(16.dp).background(color)`

**Swift:**
- Use View modifiers (chaining syntax)
- Chain modifiers: `.padding(16).background(color)`

### State Management

**Kotlin:**
```kotlin
// State hoisting
@Composable
fun Input(
  value: String,
  onValueChange: (String) -> Unit,
  // ...
)
```

**Swift:**
```swift
// Binding pattern
struct Input: View {
  @Binding var value: String
  
  var body: some View {
    TextField("", text: $value)
  }
}
```

### Theme Access

**Kotlin:**
```kotlin
// MaterialTheme
val colors = MaterialTheme.colors
val typography = MaterialTheme.typography
val shapes = MaterialTheme.shapes

// Custom semantic theme
val semantic = LocalSemanticTheme.current
val primaryColor = semantic.color.primary
```

**Swift:**
```swift
// Environment
@Environment(\.colorScheme) var colorScheme
@Environment(\.semanticTheme) var semantic

// Usage
let primaryColor = semantic.color.primary
```

### Platform-Specific Files

**Rule:** Platform-specific files use suffix notation.

**RN:**
- `icon-symbol.tsx` (default)
- `icon-symbol.ios.tsx` (iOS-specific)

**Kotlin:**
- `Button.kt` (common)
- `Button.android.kt` (Android-specific, if needed)

**Swift:**
- `Button.swift` (common)
- `Button+iOS.swift` (iOS-specific, if needed)

### Test Files

**Rule:** Test files mirror component structure with `-Test` suffix (Kotlin) or `Tests` group (Swift).

**Kotlin:**
```
atoms/
├── Button.kt
└── ButtonTest.kt
```

**Swift:**
```
Atoms/
├── Button.swift
└── ButtonTests.swift (in Tests group)
```

---

## Appendix A: Component Inventory by Directory

### `/components/ui/` (98 components)
**Atoms (22):** Button, Badge, Chip, Input, Switch, Toggle, Checkbox, Slider, Separator, Skeleton, Avatar, FAB, Progress, Collapsible, Textarea, BottomSheetInput, PrimaryButton, DragHandle, SheetHandle, ThemedText, ThemedView, IconSymbol, MotorcyclePlusIcon, CompassPlusIcon

**Molecules (65):** Card (with compound components), SearchBar, FloatingSearchInput, StatRow, SectionHeader, EmptyState, Banner, RouteBadge, RouteThumbnail, RouteOptionCard, SessionCard, SavedRouteCard, FavoriteRoadCard, RouteAttachmentCard, ChatTranscript, RouteLegTimeline, SuggestionChips, DepartureTimeSelector, DateRangePicker, ScenicBiasSegmented, PlanningProgressIndicator, TemperatureBadge, RainBadge, WindBadge, WeatherPill, CaptionInput, KeyboardAvoidingInput, MarkdownText, ConnectionBanner, PermissionNotification, NewSessionButton, DeleteRouteDialog, RenameRouteDialog, DeleteFavoriteDialog, SaveFavoriteSheet, FavoriteExclusionAlert, SessionContextMenu, AppHeader, BottomActionSheet, DrawerMenu, SessionSidebar, RouteSearchBar, ToggleGroup, BottomNavigation

**Organisms (6):** MapControls, MapPlanningIndicator, MapToastStack, MinimalOverlayWidgetPreview, RouteTimeline, RouteOptionsSheet, ModelManagerSection

**Templates (4):** ButtonUsage, TeacherTabBar, TeacherTabViewLayout, BottomSheetWrapper

**Screens (0):** (Screen components are in `/screens/`)

### `/components/layouts/` (7 components)
**Templates (5):** BaseViewLayout, SubpageLayout, MenuLayout, TeacherSimpleViewLayout, TeacherTabViewLayout

**Molecules (2):** Header, TeacherTabBar

### `/components/map/` (16 components)
**Atoms (3):** RoutePolyline, RoutePolylineComponent, DeviationPolyline

**Molecules (12):** MapHeaderOverlay, MapControls, MapPlanningIndicator, MinimalOverlayWidget, OverlayToggle, PlanFAB, WeatherGauge, WeatherPillsRow, WeatherOverlay, WhereToBar, SearchResultMarker, WaypointMarker

**Organisms (2):** MapViewWrapper, MapboxMapView, MapToastStack

### `/components/chat/` (9 components)
**Atoms (1):** TypingIndicator

**Molecules (7):** ErrorMessage, RouteAttachmentCard, RoutingCard, ReasoningCard, ThinkingCard, LocationSearchCard, PlanningCard, RouteMiniMap

**Organisms (1):** ChatInput

### `/components/discovery/` (10 components)
**Molecules (8):** DiscoveryFilterBar, DiscoverySortToggle, DiscoveryEmptyOverlay, DiscoveryLoadingOverlay, IntentSummaryPill, RoutePin, StateListItem, IntentSearchSheet, StateFilterSheet

**Screens (1):** RouteDiscoveryScreen

### `/components/planning/` (8 components)
**Molecules (7):** PlanningStatusTab, RainTimingSummary, SegmentDetailView, TempRangeSummary, WeatherStrip, RouteOptionCard, EnrichmentStatusIndicator

### `/components/enrichment/` (7 components)
**Organisms (2):** EnrichedRouteCard, EnrichmentProgressProvider

**Molecules (5):** EnrichmentStatusBadge, CreativeLabelFadeIn, HighlightTagsStagger, ProgressiveEnhancementToast, RationaleReveal

### `/components/waypoints/` (2 components)
**Molecules (1):** WaypointCard

**Organisms (1):** WaypointList

### `/components/sheets/` (12 components)
**Organisms (5):** RouteDetailsSheet, RouteTimeline, RouteDirectionsSheet, RouteOptionsSheet, PlanRideSheet

**Molecules (6):** SheetHandle, FavoritesInfoSheet, PlanningErrorSheet, PlanningLoading, PreferencesRow, TogglesContainer, SaveRouteConfirmationSheet

**Templates (1):** BottomSheetWrapper

### `/components/screens/` (3 components)
**Screens (3):** RouteComparisonView, RouteOptionsScreen, SavedRoutesScreen

### `/components/skeleton/` (5 components)
**Molecules (4):** CardSkeleton, LabelSkeleton, SkeletonWrapper, WeatherBadgeSkeleton

**Organisms (1):** RouteDetailsSkeleton

### `/components/auth/` (4 components)
**Atoms (1):** LaneShadowLogo

**Molecules (2):** AuthCard, TopographicBackground

**Templates (1):** AuthScreenLayout

### `/components/onboarding/` (5 components)
**Screens (3):** WelcomeScreen, CompletionScreen, DownloadProgressScreen

**Molecules (2):** DownloadErrorSheet, WifiRequiredSheet

### `/components/offline/` (5 components)
**Molecules (5):** RegionListItem, RegionNameBottomSheet, RenameRegionBottomSheet, DownloadProgressIndicator, DeleteConfirmationDialog

### `/components/model/` (3 components)
**Organisms (1):** ModelManagerSection

**Molecules (2):** DownloadProgressIndicator, DownloadProgressBanner

### `/components/settings/` (2 components)
**Molecules (2):** ThemePicker, FavoriteRoadsSection

### `/components/toasts/` (4 components)
**Molecules (4):** ErrorToast, SuccessToast, InfoToast, WarningToast

### `/components/logging/` (1 component)
**Templates (1):** ErrorBoundary

### `/components/assistant/` (1 component)
**Organisms (1):** VoiceAssistantOverlay

### `/components/gatekeeper/` (2 components)
**Templates (1):** ModelGatekeeperProvider

**Screens (1):** SetupRequiredScreen

### `/components/setup/` (1 component)
**Screens (1):** ModelDownloadScreen

### Root components (2 components)
**Atoms (2):** ThemedText, ThemedView

---

## Appendix B: Component Testing Coverage

Components with existing test files (`.test.tsx` or `.test.ts`):

- `ui/__tests__/date-range-picker.test.tsx`
- `ui/__tests__/delete-route-dialog.test.tsx`
- `waypoints/__tests__/waypoint-card.test.tsx`

**Note:** Most components lack test coverage. Test implementation is deferred to native rewrite where platform-specific testing frameworks will be used (Compose Testing for Android, XCTest for iOS).

---

## Appendix C: Platform-Specific Considerations

### Android (Kotlin/Compose) Specifics

**Material 3 Integration:**
- Use `MaterialTheme` for base theming
- Extend with custom `SemanticTheme` for LaneShadow tokens
- Leverage `androidx.compose.material3` components where possible

**Navigation:**
- Use Jetpack Compose Navigation
- Replace Expo Router with Compose Navigation

**Maps:**
- Use Google Maps Compose library
- Replace react-native-maps with native Google Maps SDK

**Bottom Sheets:**
- Use `Material3BottomSheet` or `androidx.compose.material3.BottomSheetScaffold`

### iOS (Swift/SwiftUI) Specifics

**SF Symbols:**
- Replace MaterialCommunityIcons with SF Symbols
- Map icon names to SF Symbol equivalents

**Navigation:**
- Use SwiftUI Navigation
- Replace Expo Router with NavigationPath/NavigationStack

**Maps:**
- Use MapKit or Google Maps SDK for iOS
- Replace react-native-maps with native map SDK

**Bottom Sheets:**
- Use `.presentationDetents()` and `.presentationDragIndicator()`

---

**Document Status:** Complete  
**Next Steps:** Use this catalog to prioritize component implementation for native rewrite, starting with atoms and progressing through molecules, organisms, templates, and screens.
