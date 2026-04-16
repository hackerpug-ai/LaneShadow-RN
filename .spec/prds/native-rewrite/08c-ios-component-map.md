---
stability: CONSTITUTION
last_validated: 2026-04-16
prd_version: 2.0.0
functional_group: DESIGN
---

# iOS Component Mapping — React Native to SwiftUI

## Overview

This document maps every React Native component in LaneShadow to its Swift/SwiftUI equivalent with exact naming parity to Android. All components use semantic design tokens from the unified design system (see `08-design-system.md`).

**Target Platform**: iOS 17+ (Swift 5.9+, SwiftUI)

---

## Section 1: Directory Structure

```
ios/LaneShadow/Views/
├── Atoms/                              # Atomic design elements
│   ├── ThemeButton.swift
│   ├── ThemeText.swift
│   ├── ThemeCard.swift
│   ├── ThemeInput.swift
│   ├── ThemeBadge.swift
│   ├── ThemeChip.swift
│   ├── ThemeCheckbox.swift
│   ├── ThemeSwitch.swift
│   ├── ThemeSlider.swift
│   ├── ThemeProgress.swift
│   ├── ThemeSeparator.swift
│   ├── ThemeSkeleton.swift
│   ├── ThemeAvatar.swift
│   ├── ThemeFAB.swift
│   └── ThemeIcon.swift
│
├── Molecules/                          # Simple component combinations
│   ├── ThemeBanner.swift
│   ├── ThemeCollapsible.swift
│   ├── ThemeDragHandle.swift
│   ├── ThemeEmptyState.swift
│   ├── ThemeOverlayPill.swift
│   ├── ThemeStatRow.swift
│   ├── ThemeSectionHeader.swift
│   ├── ThemeFloatingSearchInput.swift
│   ├── ThemeCaptionInput.swift
│   ├── ThemePermissionNotification.swift
│   ├── ThemePlanningProgressIndicator.swift
│   ├── ThemeConnectionBanner.swift
│   ├── ThemeRenameRouteDialog.swift
│   ├── ThemeDeleteRouteDialog.swift
│   ├── ThemeDateRangePicker.swift
│   ├── ThemeDepartureTimeSelector.swift
│   ├── ThemeScenicBiasSegmented.swift
│   ├── ThemeToggleGroup.swift
│   ├── ThemeRouteThumbnail.swift
│   ├── ThemeRouteSearchBar.swift
│   ├── ThemeNewSessionButton.swift
│   ├── ThemePrimaryButton.swift
│   ├── ThemeRainBadge.swift
│   ├── ThemeTemperatureBadge.swift
│   ├── ThemeWindBadge.swift
│   ├── ThemeWeatherPill.swift
│   ├── ThemeSessionCard.swift
│   ├── ThemeRouteOptionCard.swift
│   ├── ThemeRouteCard.swift
│   ├── ThemeSessionContextMenu.swift
│   ├── ThemeDrawerMenu.swift
│   ├── ThemeBottomNavigation.swift
│   └── ThemeAppHeader.swift
│
├── Organisms/                          # Complex component assemblies
│   ├── ThemeSheetHandle.swift
│   ├── ThemeTogglesContainer.swift
│   ├── ThemeRouteDetailsSheet.swift
│   ├── ThemeRouteTimeline.swift
│   ├── ThemePlanningErrorSheet.swift
│   ├── ThemePlanningLoading.swift
│   ├── ThemeFavoritesInfoSheet.swift
│   ├── ThemePreferencesRow.swift
│   ├── ThemePlanningStatusTab.swift
│   ├── ThemeRainTimingSummary.swift
│   ├── ThemeSegmentDetailView.swift
│   ├── ThemeTempRangeSummary.swift
│   ├── ThemeWeatherStrip.swift
│   ├── ThemeMapHeaderOverlay.swift
│   ├── ThemeMapToastStack.swift
│   ├── ThemeMinimalOverlayWidget.swift
│   ├── ThemeMinimalOverlayWidgetPreview.swift
│   ├── ThemeOverlayToggle.swift
│   ├── ThemePlanFAB.swift
│   ├── ThemeWeatherGauge.swift
│   ├── ThemeWeatherPillsRow.swift
│   ├── ThemeWhereToBar.swift
│   ├── ThemeCompassPlusIcon.swift
│   ├── ThemeEnrichmentStatusIndicator.swift
│   ├── ThemeEnrichedRouteCard.swift
│   ├── ThemeWaypointCard.swift
│   ├── ThemeWaypointList.swift
│   ├── ThemeVoiceAssistantOverlay.swift
│   ├── ThemeTeacherTabBar.swift
│   ├── ThemeTeacherTabViewLayout.swift
│   ├── ThemeTeacherSimpleViewLayout.swift
│   ├── ThemeTopographicBackground.swift
│   ├── ThemeAuthCard.swift
│   ├── ThemeAuthScreenLayout.swift
│   ├── ThemeErrorMessage.swift
│   ├── ThemeTypingIndicator.swift
│   └── ThemeErrorBoundary.swift
│
├── Templates/                          # Page-level layouts
│   ├── MenuLayout.swift
│   ├── SubpageLayout.swift
│   ├── BaseViewLayout.swift
│   ├── Header.swift
│   └── TeacherTabViewLayout.swift
│
├── Screens/                            # Full screen compositions
│   ├── MapScreen.swift
│   ├── SettingsScreen.swift
│   ├── SavedRoutesScreen.swift
│   ├── SessionScreen.swift
│   ├── AuthScreen.swift
│   ├── OfflineScreen.swift
│   └── ProfileScreen.swift
│
└── Theme/                              # Design tokens
    ├── AppTheme.swift
    ├── ThemeColors.swift
    ├── ThemeSpacing.swift
    ├── ThemeTypography.swift
    ├── ThemeRadius.swift
    ├── ThemeElevation.swift
    └── ThemeDomain.swift
```

---

## Section 2: Full Component Mapping Table

| RN File | SwiftUI Name | Swift File | Atomic Level | View Signature | System Components Used |
|---------|--------------|------------|--------------|-----------------|----------------------|
| `components/ui/button.usage.tsx` | `ThemeButton` | `Atoms/ThemeButton.swift` | Atom | `struct ThemeButton: View { init(variant: ButtonVariant, size: ButtonSize, icon: String?, iconPosition: IconPosition, action: @escaping () -> Void, label: Text) }` | `Button`, `.buttonStyle(.bordered)`, `.tint()`, `.disabled()`, `.hoverEffect()` |
| `components/ui/card.tsx` | `ThemeCard` | `Atoms/ThemeCard.swift` | Atom | `struct ThemeCard<Content: View>: View { init(variant: CardVariant, onPress: @escaping () -> Void, showBorder: Bool, @ViewBuilder content: () -> Content) }` | `RoundedRectangle`, `.background()`, `.shadow()`, `.onTapGesture()` |
| `components/ui/badge.tsx` | `ThemeBadge` | `Atoms/ThemeBadge.swift` | Atom | `struct ThemeBadge: View { init(variant: BadgeVariant, icon: Image?, opacity: Double, @ViewBuilder label: () -> Text) }` | `Text`, `.padding()`, `.background()`, `.clipShape(Capsule())` |
| `components/ui/chip.tsx` | `ThemeChip` | `Atoms/ThemeChip.swift` | Atom | `struct ThemeChip: View { init(label: String, icon: String?, selected: Bool, action: @escaping () -> Void) }` | `Button`, `.buttonStyle(.bordered)`, `.overlay()` |
| `components/ui/checkbox.tsx` | `ThemeCheckbox` | `Atoms/ThemeCheckbox.swift` | Atom | `struct ThemeCheckbox: View { init(@Binding isChecked: Bool, disabled: Bool, indeterminate: Bool, label: String?) }` | `Toggle`, `.toggleStyle(.checkbox)`, `.disabled()` |
| `components/ui/switch.tsx` | `ThemeSwitch` | `Atoms/ThemeSwitch.swift` | Atom | `struct ThemeSwitch: View { init(@Binding isOn: Bool, disabled: Bool, label: String?) }` | `Toggle`, `.toggleStyle(.switch)` |
| `components/ui/input.tsx` | `ThemeInput` | `Atoms/ThemeInput.swift` | Atom | `struct ThemeInput: View { init(label: String?, text: Binding<String>, placeholder: String?, leftIcon: String?, rightIcon: String?, error: Bool, editable: Bool) }` | `TextField`, `.textFieldStyle()`, `.padding()`, `.border()` |
| `components/ui/slider.tsx` | `ThemeSlider` | `Atoms/ThemeSlider.swift` | Atom | `struct ThemeSlider: View { init(value: Binding<Double>, min: Double, max: Double, step: Double, disabled: Bool) }` | `Slider`, `.disabled()` |
| `components/ui/progress.tsx` | `ThemeProgress` | `Atoms/ThemeProgress.swift` | Atom | `struct ThemeProgress: View { init(value: Double, max: Double, indeterminate: Bool) }` | `ProgressView`, `.progressViewStyle()` |
| `components/ui/skeleton.tsx` | `ThemeSkeleton` | `Atoms/ThemeSkeleton.swift` | Atom | `struct ThemeSkeleton: View { init(width: CGFloat?, height: CGFloat?, shape: SkeletonShape) }` | `RoundedRectangle`, `.fill()`, `.opacity()`, `.animation(.default, value: isLoading)` |
| `components/ui/avatar.tsx` | `ThemeAvatar` | `Atoms/ThemeAvatar.swift` | Atom | `struct ThemeAvatar: View { init(size: AvatarSize, source: Image?, initials: String?, showBorder: Bool, showRing: Bool, badge: Badge?) }` | `AsyncImage`, `Circle()`, `.overlay()` |
| `components/ui/separator.tsx` | `ThemeSeparator` | `Atoms/ThemeSeparator.swift` | Atom | `struct ThemeSeparator: View { init(orientation: SeparatorOrientation) }` | `Rectangle`, `.fill()`, `.frame(width:height:)` |
| `components/ui/fab.tsx` | `ThemeFAB` | `Atoms/ThemeFAB.swift` | Atom | `struct ThemeFAB: View { init(icon: String, label: String?, action: @escaping () -> Void, visible: Bool) }` | `Button`, `.buttonStyle(.floatingAction)` |
| `components/ui/banner.tsx` | `ThemeBanner` | `Molecules/ThemeBanner.swift` | Molecule | `struct ThemeBanner: View { init(variant: BannerVariant, title: String, message: String?, dismissible: Bool, onDismiss: @escaping () -> Void) }` | `HStack`, `Image`, `Text`, `.background()`, `.shadow()` |
| `components/ui/collapsible.tsx` | `ThemeCollapsible` | `Molecules/ThemeCollapsible.swift` | Molecule | `struct ThemeCollapsible<Content: View>: View { init(isExpanded: Binding<Bool>, label: String, @ViewBuilder content: () -> Content) }` | `DisclosureGroup`, `.animation()` |
| `components/ui/drag-handle.tsx` | `ThemeDragHandle` | `Molecules/ThemeDragHandle.swift` | Molecule | `struct ThemeDragHandle: View { init(active: Bool) }` | `Image(systemName: "line.3.horizontal")`, `.opacity()` |
| `components/ui/empty-state.tsx` | `ThemeEmptyState` | `Molecules/ThemeEmptyState.swift` | Molecule | `struct ThemeEmptyState: View { init(icon: String, title: String, message: String, action: EmptyStateAction?) }` | `VStack`, `Image`, `Text`, `Button` |
| `components/ui/overlay-pill.tsx` | `ThemeOverlayPill` | `Molecules/ThemeOverlayPill.swift` | Molecule | `struct ThemeOverlayPill: View { init(label: String, icon: String, isActive: Bool, action: @escaping () -> Void) }` | `Button`, `.buttonStyle(.pill)`, `.overlay()` |
| `components/ui/stat-row.tsx` | `ThemeStatRow` | `Molecules/ThemeStatRow.swift` | Molecule | `struct ThemeStatRow: View { init(icon: String, value: String, label: String?) }` | `HStack`, `Image`, `Text` |
| `components/ui/section-header.tsx` | `ThemeSectionHeader` | `Molecules/ThemeSectionHeader.swift` | Molecule | `struct ThemeSectionHeader: View { init(title: String, subtitle: String?, action: SectionHeaderAction?) }` | `VStack`, `Text`, `Button` |
| `components/ui/floating-search-input.tsx` | `ThemeFloatingSearchInput` | `Molecules/ThemeFloatingSearchInput.swift` | Molecule | `struct ThemeFloatingSearchInput: View { init(text: Binding<String>, placeholder: String?, onSearch: (String) -> Void) }` | `HStack`, `TextField`, `.background()`, `.shadow()`, `.padding()` |
| `components/ui/caption-input.tsx` | `ThemeCaptionInput` | `Molecules/ThemeCaptionInput.swift` | Molecule | `struct ThemeCaptionInput: View { init(text: Binding<String>, placeholder: String?, maxLength: Int?) }` | `VStack`, `TextField`, `Text` |
| `components/ui/permission-notification.tsx` | `ThemePermissionNotification` | `Molecules/ThemePermissionNotification.swift` | Molecule | `struct ThemePermissionNotification: View { init(title: String, message: String, grantAction: @escaping () -> Void) }` | `HStack`, `Text`, `Button`, `.background()`, `.shadow()` |
| `components/ui/planning-progress-indicator.tsx` | `ThemePlanningProgressIndicator` | `Molecules/ThemePlanningProgressIndicator.swift` | Molecule | `struct ThemePlanningProgressIndicator: View { init(progress: PlanningProgress, message: String) }` | `VStack`, `ProgressView`, `Text` |
| `components/ui/connection-banner.tsx` | `ThemeConnectionBanner` | `Molecules/ThemeConnectionBanner.swift` | Molecule | `struct ThemeConnectionBanner: View { init(isConnected: Bool, onRetry: @escaping () -> Void) }` | `HStack`, `Image`, `Text`, `Button` |
| `components/ui/rename-route-dialog.tsx` | `ThemeRenameRouteDialog` | `Molecules/ThemeRenameRouteDialog.swift` | Molecule | `struct ThemeRenameRouteDialog: View { init(isPresented: Binding<Bool>, routeName: Binding<String>, onConfirm: @escaping (String) -> Void) }` | `.alert()`, `TextField` |
| `components/ui/delete-route-dialog.tsx` | `ThemeDeleteRouteDialog` | `Molecules/ThemeDeleteRouteDialog.swift` | Molecule | `struct ThemeDeleteRouteDialog: View { init(isPresented: Binding<Bool>, routeName: String, onDelete: @escaping () -> Void) }` | `.alert()` |
| `components/ui/date-range-picker.tsx` | `ThemeDateRangePicker` | `Molecules/ThemeDateRangePicker.swift` | Molecule | `struct ThemeDateRangePicker: View { init(selection: Binding<ClosedRange<Date>>) }` | `DatePicker`, `.datePickerStyle(.compact)` |
| `components/ui/departure-time-selector.tsx` | `ThemeDepartureTimeSelector` | `Molecules/ThemeDepartureTimeSelector.swift` | Molecule | `struct ThemeDepartureTimeSelector: View { init(selection: Binding<Date>, mode: DepartureMode) }` | `DatePicker`, `.datePickerStyle(.graphical)` |
| `components/ui/scenic-bias-segmented.tsx` | `ThemeScenicBiasSegmented` | `Molecules/ThemeScenicBiasSegmented.swift` | Molecule | `struct ThemeScenicBiasSegmented: View { init(selection: Binding<ScenicBias>) }` | `Picker`, `.pickerStyle(.segmented)` |
| `components/ui/toggle-group.tsx` | `ThemeToggleGroup` | `Molecules/ThemeToggleGroup.swift` | Molecule | `struct ThemeToggleGroup: View { init(selection: Binding<ToggleOption>, options: [ToggleOption]) }` | `HStack`, `Button`, `.buttonStyle(.toggle)` |
| `components/ui/route-thumbnail.tsx` | `ThemeRouteThumbnail` | `Molecules/ThemeRouteThumbnail.swift` | Molecule | `struct ThemeRouteThumbnail: View { init(route: Route, size: ThumbnailSize) }` | `AsyncImage`, `.clipShape()` |
| `components/ui/route-search-bar.tsx` | `ThemeRouteSearchBar` | `Molecules/ThemeRouteSearchBar.swift` | Molecule | `struct ThemeRouteSearchBar: View { init(text: Binding<String>, onSearch: (String) -> Void) }` | `HStack`, `TextField`, `Button` |
| `components/ui/new-session-button.tsx` | `ThemeNewSessionButton` | `Molecules/ThemeNewSessionButton.swift` | Molecule | `struct ThemeNewSessionButton: View { init(action: @escaping () -> Void) }` | `Button`, `.buttonStyle(.primary)` |
| `components/ui/primary-button.tsx` | `ThemePrimaryButton` | `Molecules/ThemePrimaryButton.swift` | Molecule | `struct ThemePrimaryButton: View { init(action: @escaping () -> Void, label: Text) }` | `Button`, `.buttonStyle(.primaryLarge)` |
| `components/ui/rain-badge.tsx` | `ThemeRainBadge` | `Molecules/ThemeRainBadge.swift` | Molecule | `struct ThemeRainBadge: View { init(intensity: RainIntensity) }` | `HStack`, `Image`, `Text`, `.background()`, `.clipShape()` |
| `components/ui/temperature-badge.tsx` | `ThemeTemperatureBadge` | `Molecules/ThemeTemperatureBadge.swift` | Molecule | `struct ThemeTemperatureBadge: View { init(temperature: Temperature) }` | `HStack`, `Image`, `Text`, `.background()`, `.clipShape()` |
| `components/planning/wind-badge.tsx` | `ThemeWindBadge` | `Molecules/ThemeWindBadge.swift` | Molecule | `struct ThemeWindBadge: View { init(windLevel: WindLevel) }` | `HStack`, `Image`, `Text`, `.background()`, `.clipShape()` |
| `components/planning/weather-pill.tsx` | `ThemeWeatherPill` | `Molecules/ThemeWeatherPill.swift` | Molecule | `struct ThemeWeatherPill: View { init(icon: String, description: String) }` | `HStack`, `Image`, `Text`, `.background()`, `.clipShape(Capsule())` |
| `components/ui/session-card.tsx` | `ThemeSessionCard` | `Molecules/ThemeSessionCard.swift` | Molecule | `struct ThemeSessionCard: View { init(session: Session, isActive: Bool, onPress: @escaping () -> Void, onLongPress: @escaping () -> Void, compact: Bool) }` | `VStack`, `HStack`, `ThemeBadge`, `Text`, `.onTapGesture()`, `.onLongPressGesture()` |
| `components/ui/route-option-card.tsx` | `ThemeRouteOptionCard` | `Molecules/ThemeRouteOptionCard.swift` | Molecule | `struct ThemeRouteOptionCard: View { init(route: RouteOption, variant: RouteOptionVariant, badges: [Badge], stats: [Stat], weatherSummary: WeatherSummary?) }` | `VStack`, `ThemeBadge`, `ThemeStatRow`, `ThemeWeatherPill` |
| `components/ui/session-context-menu.tsx` | `ThemeSessionContextMenu` | `Molecules/ThemeSessionContextMenu.swift` | Molecule | `struct ThemeSessionContextMenu: View { init(isPresented: Binding<Bool>, position: CGPoint, items: [ContextMenuItem]) }` | `.confirmationDialog()`, `.position()` |
| `components/ui/menus/drawer-menu.tsx` | `ThemeDrawerMenu` | `Molecules/ThemeDrawerMenu.swift` | Molecule | `struct ThemeDrawerMenu: View { init(isOpen: Binding<Bool>, sections: [DrawerSection], footerItems: [DrawerItem], alignment: DrawerAlignment) }` | `VStack`, `List`, `Divider`, `.transition()` |
| `components/ui/bottom-navigation.tsx` | `ThemeBottomNavigation` | `Molecules/ThemeBottomNavigation.swift` | Molecule | `struct ThemeBottomNavigation: View { init(selection: Binding<Tab>, tabs: [Tab]) }` | `TabView`, `.tabViewStyle(.page)` |
| `components/ui/app-header.tsx` | `ThemeAppHeader` | `Molecules/ThemeAppHeader.swift` | Molecule | `struct ThemeAppHeader: View { init(title: String, leftAction: HeaderAction?, rightAction: HeaderAction?) }` | `HStack`, `Text`, `Button` |
| `components/sheets/sheet-handle.tsx` | `ThemeSheetHandle` | `Organisms/ThemeSheetHandle.swift` | Organism | `struct ThemeSheetHandle: View { init() }` | `RoundedRectangle`, `.fill()`, `.frame()` |
| `components/sheets/toggles-container.tsx` | `ThemeTogglesContainer` | `Organisms/ThemeTogglesContainer.swift` | Organism | `struct ThemeTogglesContainer<Content: View>: View { init(@ViewBuilder content: () -> Content) }` | `VStack`, `.padding()` |
| `components/sheets/route-details-sheet.tsx` | `ThemeRouteDetailsSheet` | `Organisms/ThemeRouteDetailsSheet.swift` | Organism | `struct ThemeRouteDetailsSheet: View { init(isPresented: Binding<Bool>, route: RouteOption?, onSave: @escaping () -> Void, isSaving: Bool) }` | `.sheet()`, `.presentationDetents()`, `ScrollView`, `VStack`, `ThemeStatRow`, `ThemeWindBadge`, `ThemeButton` |
| `components/sheets/route-timeline.tsx` | `ThemeRouteTimeline` | `Organisms/ThemeRouteTimeline.swift` | Organism | `struct ThemeRouteTimeline: View { init(waypoints: [Waypoint], onWaypointTap: @escaping (Waypoint) -> Void) }` | `VStack`, `HStack`, `ThemeWaypointCard`, `.separator()` |
| `components/sheets/planning-error-sheet.tsx` | `ThemePlanningErrorSheet` | `Organisms/ThemePlanningErrorSheet.swift` | Organism | `struct ThemePlanningErrorSheet: View { init(isPresented: Binding<Bool>, error: PlanningError, onRetry: @escaping () -> Void) }` | `.alert()`, `VStack`, `Image`, `Text`, `Button` |
| `components/sheets/planning-loading.tsx` | `ThemePlanningLoading` | `Organisms/ThemePlanningLoading.swift` | Organism | `struct ThemePlanningLoading: View { init(progress: Double, message: String) }` | `VStack`, `ProgressView`, `ThemeSkeleton`, `Text` |
| `components/sheets/favorites-info-sheet.tsx` | `ThemeFavoritesInfoSheet` | `Organisms/ThemeFavoritesInfoSheet.swift` | Organism | `struct ThemeFavoritesInfoSheet: View { init(isPresented: Binding<Bool>, favorites: [FavoriteRoute]) }` | `.sheet()`, `List`, `ThemeRouteCard` |
| `components/sheets/preferences-row.tsx` | `ThemePreferencesRow` | `Organisms/ThemePreferencesRow.swift` | Organism | `struct ThemePreferencesRow: View { init(label: String, value: String, onChange: @escaping (String) -> Void) }` | `HStack`, `Text`, `ThemeSwitch` |
| `components/planning/planning-status-tab.tsx` | `ThemePlanningStatusTab` | `Organisms/ThemePlanningStatusTab.swift` | Organism | `struct ThemePlanningStatusTab: View { init(status: PlanningStatus, details: PlanningDetails?) }` | `HStack`, `VStack`, `ThemeBadge`, `Text`, `.background()` |
| `components/planning/rain-timing-summary.tsx` | `ThemeRainTimingSummary` | `Organisms/ThemeRainTimingSummary.swift` | Organism | `struct ThemeRainTimingSummary: View { init(rainForecast: RainForecast) }` | `VStack`, `ThemeRainBadge`, `Text` |
| `components/planning/segment-detail-view.tsx` | `ThemeSegmentDetailView` | `Organisms/ThemeSegmentDetailView.swift` | Organism | `struct ThemeSegmentDetailView: View { init(segment: RouteSegment) }` | `VStack`, `ThemeStatRow`, `Text`, `.map()` |
| `components/planning/temp-range-summary.tsx` | `ThemeTempRangeSummary` | `Organisms/ThemeTempRangeSummary.swift` | Organism | `struct ThemeTempRangeSummary: View { init(temperatureRange: TemperatureRange) }` | `HStack`, `ThemeTemperatureBadge`, `Text` |
| `components/planning/weather-strip.tsx` | `ThemeWeatherStrip` | `Organisms/ThemeWeatherStrip.swift` | Organism | `struct ThemeWeatherStrip: View { init(conditions: WeatherCondition[]) }` | `ScrollView`, `HStack`, `ThemeWeatherPill` |
| `components/map/map-header-overlay.tsx` | `ThemeMapHeaderOverlay` | `Organisms/ThemeMapHeaderOverlay.swift` | Organism | `struct ThemeMapHeaderOverlay: View { init(title: String, subtitle: String?, leftAction: HeaderAction?, rightAction: HeaderAction?) }` | `HStack`, `VisualEffectView`, `.background(.ultraThinMaterial)` |
| `components/map/map-toast-stack.tsx` | `ThemeMapToastStack` | `Organisms/ThemeMapToastStack.swift` | Organism | `struct ThemeMapToastStack: View { init(toasts: [ToastMessage]) }` | `VStack`, `ThemeBanner`, `.transition()` |
| `components/map/minimal-overlay-widget.tsx` | `ThemeMinimalOverlayWidget` | `Organisms/ThemeMinimalOverlayWidget.swift` | Organism | `struct ThemeMinimalOverlayWidget: View { init(selection: Binding<OverlayType?>, availability: OverlayAvailability) }` | `ZStack`, `Circle()`, `.rotationEffect()`, `.scaleEffect()`, `.position()` |
| `components/map/minimal-overlay-widget-preview.tsx` | `ThemeMinimalOverlayWidgetPreview` | `Organisms/ThemeMinimalOverlayWidgetPreview.swift` | Organism | `struct ThemeMinimalOverlayWidgetPreview: View { init() }` | `ThemeMinimalOverlayWidget`, `.preview()` |
| `components/map/overlay-toggle.tsx` | `ThemeOverlayToggle` | `Organisms/ThemeOverlayToggle.swift` | Organism | `struct ThemeOverlayToggle: View { init(isOn: Binding<Bool>, label: String) }` | `Toggle`, `.toggleStyle(.switch)` |
| `components/map/plan-fab.tsx` | `ThemePlanFAB` | `Organisms/ThemePlanFAB.swift` | Organism | `struct ThemePlanFAB: View { init(action: @escaping () -> Void, visible: Bool) }` | `Button`, `.buttonStyle(.floatingAction)`, `.shadow()` |
| `components/map/weather-gauge.tsx` | `ThemeWeatherGauge` | `Organisms/ThemeWeatherGauge.swift` | Organism | `struct ThemeWeatherGauge: View { init(weather: WeatherCondition) }` | `ZStack`, `Circle()`, `.trim()`, `.rotation()` |
| `components/map/weather-pills-row.tsx` | `ThemeWeatherPillsRow` | `Organisms/ThemeWeatherPillsRow.swift` | Organism | `struct ThemeWeatherPillsRow: View { init(pills: [WeatherPill]) }` | `ScrollView`, `HStack`, `ThemeWeatherPill` |
| `components/map/where-to-bar.tsx` | `ThemeWhereToBar` | `Organisms/ThemeWhereToBar.swift` | Organism | `struct ThemeWhereToBar: View { init(destination: Binding<String>, onSearch: (String) -> Void) }` | `HStack`, `TextField`, `Button`, `.background(.regularMaterial)` |
| `components/map/compass-plus-icon.tsx` | `ThemeCompassPlusIcon` | `Organisms/ThemeCompassPlusIcon.swift` | Organism | `struct ThemeCompassPlusIcon: View { init(bearing: Double) }` | `ZStack`, `Image`, `.rotationEffect()` |
| `components/planning/enrichment-status-indicator.tsx` | `ThemeEnrichmentStatusIndicator` | `Organisms/ThemeEnrichmentStatusIndicator.swift` | Organism | `struct ThemeEnrichmentStatusIndicator: View { init(status: EnrichmentStatus, progress: Double?) }` | `HStack`, `ProgressView`, `ThemeBadge`, `Text` |
| `components/enrichment/enriched-route-card.tsx` | `ThemeEnrichedRouteCard` | `Organisms/ThemeEnrichedRouteCard.swift` | Organism | `struct ThemeEnrichedRouteCard: View { init(route: EnrichedRoute, onSave: @escaping () -> Void) }` | `VStack`, `ThemeBadge`, `ThemeStatRow`, `Text`, `ThemeButton` |
| `components/waypoints/waypoint-card.tsx` | `ThemeWaypointCard` | `Organisms/ThemeWaypointCard.swift` | Organism | `struct ThemeWaypointCard: View { init(waypoint: Waypoint, order: Int, onApprove: @escaping (Waypoint) -> Void, onReject: @escaping (Waypoint) -> Void, onReorder: @escaping (Waypoint, Int) -> Void) }` | `VStack`, `HStack`, `ThemeBadge`, `Text`, `Button`, `.onDrag()` |
| `components/waypoints/waypoint-list.tsx` | `ThemeWaypointList` | `Organisms/ThemeWaypointList.swift` | Organism | `struct ThemeWaypointList: View { init(waypoints: [Waypoint], onReorder: @escaping ([Waypoint]) -> Void) }` | `List`, `ThemeWaypointCard`, `.onMove()` |
| `components/assistant/voice-assistant-overlay.tsx` | `ThemeVoiceAssistantOverlay` | `Organisms/ThemeVoiceAssistantOverlay.swift` | Organism | `struct ThemeVoiceAssistantOverlay: View { init(isListening: Binding<Bool>, transcript: String) }` | `VStack`, `VisualEffectView`, `.background(.thinMaterial)`, `.animation(.pulse)` |
| `components/layouts/teacher-tab-bar.tsx` | `ThemeTeacherTabBar` | `Organisms/ThemeTeacherTabBar.swift` | Organism | `struct ThemeTeacherTabBar: View { init(selection: Binding<TeacherTab>) }` | `HStack`, `Button`, `.buttonStyle(.tab)` |
| `components/layouts/teacher-tab-view-layout.tsx` | `ThemeTeacherTabViewLayout` | `Organisms/ThemeTeacherTabViewLayout.swift` | Organism | `struct ThemeTeacherTabViewLayout<Tab: Hashable>: View { init(selection: Binding<Tab>, tabs: [TeacherTab], @ViewBuilder content: (Tab) -> Content) }` | `TabView`, `.tabViewStyle(.page)` |
| `components/layouts/teacher-simple-view-layout.tsx` | `ThemeTeacherSimpleViewLayout` | `Organisms/ThemeTeacherSimpleViewLayout.swift` | Organism | `struct ThemeTeacherSimpleViewLayout<Content: View>: View { init(@ViewBuilder content: () -> Content) }` | `VStack`, `.padding()` |
| `components/auth/topographic-background.tsx` | `ThemeTopographicBackground` | `Organisms/ThemeTopographicBackground.swift` | Organism | `struct ThemeTopographicBackground: View { init() }` | `GeometryReader`, `MeshGradient`, `.ignoresSafeArea()` |
| `components/auth/auth-card.tsx` | `ThemeAuthCard` | `Organisms/ThemeAuthCard.swift` | Organism | `struct ThemeAuthCard<Content: View>: View { init(@ViewBuilder content: () -> Content) }` | `VStack`, `.background()`, `.shadow()`, `.clipShape()` |
| `components/auth/auth-screen-layout.tsx` | `ThemeAuthScreenLayout` | `Organisms/ThemeAuthScreenLayout.swift` | Organism | `struct ThemeAuthScreenLayout<Content: View>: View { init(@ViewBuilder content: () -> Content) }` | `ZStack`, `ThemeTopographicBackground`, `ThemeAuthCard` |
| `components/chat/error-message.tsx` | `ThemeErrorMessage` | `Organisms/ThemeErrorMessage.swift` | Organism | `struct ThemeErrorMessage: View { init(message: String, onRetry: @escaping () -> Void) }` | `HStack`, `Image`, `Text`, `Button` |
| `components/chat/typing-indicator.tsx` | `ThemeTypingIndicator` | `Organisms/ThemeTypingIndicator.swift` | Organism | `struct ThemeTypingIndicator: View { init(isTyping: Bool) }` | `HStack`, `Circle()`, `.scaleEffect()`, `.animation(.easeInOut)` |
| `components/logging/error-boundary.tsx` | `ThemeErrorBoundary` | `Organisms/ThemeErrorBoundary.swift` | Organism | `struct ThemeErrorBoundary<Content: View>: View { init(@ViewBuilder content: () -> Content) }` | `@ScenePhase`, `.alert()`, `fatalError()` |
| `components/layouts/menu-layout.tsx` | `MenuLayout` | `Templates/MenuLayout.swift` | Template | `struct MenuLayout<Content: View>: View { init(@ViewBuilder content: (onMenuDismiss: @escaping () -> Void) -> Content) }` | `GeometryReader`, `HStack`, `ThemeDrawerMenu`, `.offset()`, `.animation()` |
| `components/layouts/subpage-layout.tsx` | `SubpageLayout` | `Templates/SubpageLayout.swift` | Template | `struct SubpageLayout<Content: View>: View { init(title: String, backTo: String?, rightAction: HeaderAction?, @ViewBuilder content: () -> Content) }` | `VStack`, `LinearGradient`, `HStack`, `Text`, `.padding()`, `.safeAreaInset()` |
| `components/layouts/base-view-layout.tsx` | `BaseViewLayout` | `Templates/BaseViewLayout.swift` | Template | `struct BaseViewLayout<Content: View>: View { init(@ViewBuilder content: () -> Content) }` | `VStack`, `.safeAreaInset()` |
| `components/layouts/header.tsx` | `Header` | `Templates/Header.swift` | Template | `struct Header: View { init(title: String, leftAction: HeaderAction?, rightAction: HeaderAction?) }` | `HStack`, `Text`, `Button` |
| `components/ui/icon-symbol.tsx` | `ThemeIcon` | `Atoms/ThemeIcon.swift` | Atom | `struct ThemeIcon: View { init(name: String, size: CGFloat, color: Color?) }` | `Image(systemName:)`, `.font(.system(size:weight:))` |
| `components/ui/icon-symbol.ios.tsx` | (merged into ThemeIcon) | `Atoms/ThemeIcon.swift` | Atom | N/A — iOS-specific icons handled via SF Symbols | `Image(systemName:)` |
| `components/ui/motorcycle-plus-icon.tsx` | (merged into ThemeIcon) | `Atoms/ThemeIcon.swift` | Atom | N/A — custom asset | `Image("motorcycle-plus")`, `.renderingMode(.template)` |
| `components/ui/button.tsx` | (merged into ThemeButton) | `Atoms/ThemeButton.swift` | Atom | N/A | N/A |
| `components/ui/suggestion-chips.tsx` | (merged into ThemeChip) | `Atoms/ThemeChip.swift` | Atom | N/A | N/A |
| `components/ui/toggle.tsx` | (merged into ThemeSwitch) | `Atoms/ThemeSwitch.swift` | Atom | N/A | N/A |
| `components/themed-text.tsx` | `ThemeText` | `Atoms/ThemeText.swift` | Atom | `struct ThemeText: View { init(variant: TypographyVariant, color: ThemeColor?, @ViewBuilder content: () -> Text) }` | `Text`, `.font()`, `.foregroundColor()` |
| `components/themed-view.tsx` | `ThemeBackground` | `Atoms/ThemeBackground.swift` | Atom | `struct ThemeBackground<Content: View>: View { init(variant: BackgroundVariant, @ViewBuilder content: () -> Content) }` | `Color`, `.ignoresSafeArea()` |
| `components/location-input.tsx` | `ThemeLocationInput` | `Molecules/ThemeLocationInput.swift` | Molecule | `struct ThemeLocationInput: View { init(location: Binding<Location?>, onSearch: (String) -> Void) }` | `HStack`, `TextField`, `Button`, `.sheet()` |

---

## Section 3: Props → Swift Structs

### ThemeButton

```swift
enum ButtonVariant {
    case primary, secondary, tertiary, outline, ghost
}

enum ButtonSize {
    case sm, md, lg, icon
}

enum IconPosition {
    case left, right
}

struct ButtonConfiguration {
    let variant: ButtonVariant
    let size: ButtonSize
    let icon: String?
    let iconPosition: IconPosition
    let action: () -> Void
    let label: Text
    let isDisabled: Bool
}
```

### ThemeCard

```swift
enum CardVariant {
    case default, primary, success, warning, danger
}

struct CardConfiguration {
    let variant: CardVariant
    let onPress: (() -> Void)?
    let showBorder: Bool
}
```

### ThemeInput

```swift
struct InputConfiguration {
    let label: String?
    let text: Binding<String>
    let placeholder: String?
    let leftIcon: String?
    let rightIcon: String?
    let error: Bool
    let editable: Bool
}
```

### ThemeRouteDetailsSheet

```swift
struct RouteDetailsSheetConfiguration {
    let route: RouteOption
    let onSave: (() -> Void)?
    let isSaving: Bool
}

struct PlannedRouteOptionView {
    let id: String
    let label: String
    let rationale: String
    let stats: RouteStats
    let overlaysPreview: WeatherOverlaysPreview
}

struct RouteStats {
    let distanceMeters: Int
    let durationSeconds: Int
    let legsCount: Int
}
```

### ThemeWaypointCard

```swift
struct WaypointCardConfiguration {
    let waypoint: Waypoint
    let order: Int
    let onApprove: ((Waypoint) -> Void)?
    let onReject: ((Waypoint) -> Void)?
    let onReorder: ((Waypoint, Int) -> Void)?
}

enum WaypointKind {
    case onRoute, offRoute
}

enum WaypointStatus {
    case ready, pending, evaluating, approved, rejected, applied
}

struct Waypoint {
    let id: String
    let name: String?
    let description: String?
    let kind: WaypointKind
    let status: WaypointStatus
    let detourInfo: DetourInfo?
}
```

### ThemeSessionCard

```swift
struct SessionCardConfiguration {
    let session: Session
    let isActive: Bool
    let onPress: ((Session) -> Void)?
    let onLongPress: ((Session) -> Void)?
    let compact: Bool
}

struct Session {
    let id: String
    let title: String
    let date: Date
    let routeCount: Int
    let status: SessionStatus
    let previewMessage: String
}

enum SessionStatus {
    case active, completed, saved
}
```

### ThemeRouteOptionCard

```swift
enum RouteOptionCardVariant {
    case selected, compact
}

struct RouteOptionCardConfiguration {
    let name: String
    let variant: RouteOptionCardVariant
    let badges: [RouteBadge]
    let stats: [RouteStat]
    let weatherSummary: WeatherSummary?
}

struct RouteBadge {
    let icon: String?
    let label: String
    let variant: BadgeVariant
}
```

### ThemeMap

```swift
struct MapConfiguration {
    let center: CLLocationCoordinate2D
    let zoom: Double
    let routes: [RoutePolyline]
    let waypoints: [WaypointAnnotation]
    let overlays: [WeatherOverlay]
    let onTapRoute: ((RoutePolyline) -> Void)?
    let onTapWaypoint: ((WaypointAnnotation) -> Void)?
}
```

---

## Section 4: RN → SwiftUI Pattern Mapping

| RN Pattern | SwiftUI Equivalent | Notes |
|---|---|---|
| `StyleSheet.create()` | `ViewModifier` / custom styles | SwiftUI uses modifiers directly on views |
| `useState` | `@State` / `@Binding` | SwiftUI's property wrappers |
| `useEffect` | `.task` / `.onAppear` / `.onChange` | Task for async, onAppear for side effects |
| `FlatList` | `List` / `LazyVStack` | List includes built-in separators |
| `ScrollView` | `ScrollView` + `LazyVStack` | Direct mapping |
| `TouchableOpacity` | `Button` / `.onTapGesture` | Button for accessibility, onTapGesture for custom |
| `Modal` (React Native) | `.sheet()` | SwiftUI's sheet presentation |
| `BottomSheet` (Gorhom) | `.sheet()` + `presentationDetents` | Use detents for snap points |
| `Animated.View` | `withAnimation` / `.animation()` | SwiftUI animations are implicit |
| `Reanimated` | `@Namespace` / `.matchedGeometryEffect` | Hero transitions use matched geometry |
| `Platform.select` | `#if os(iOS)` / `@available` | Compile-time platform checks |
| `useSafeAreaInsets` | `.safeAreaInset()` / `GeometryReader` | SwiftUI safe area handling |
| `Pressable` | `.buttonStyle()` / `.onTapGesture(count:)` | Pressable maps to button styles |
| `PanResponder` | `DragGesture` / `UIKitPanGestureRecognizer` | SwiftUI gestures are declarative |
| `LayoutAnimation` | `.transition()` / `.animation()` | SwiftUI transitions are explicit |
| `StatusBar` | `.statusBar(hidden:)` | Modifer-based status bar control |
| `KeyboardAvoidingView` | `.keyboardLayoutGuide()` | iOS 17+ keyboard avoidance |
| `Alert.alert` | `.alert()` | Native alert presentation |
| `Linking.openURL` | `Link()` / `openURL` | SwiftUI Link component |
| `ActivityIndicator` | `ProgressView()` | Native progress indicators |
| `ImageBackground` | `ZStack { Image(); ... }` | ZStack for layered content |
| `TextInput` multiline | `TextEditor` | Multiline text input |
| `Switch` (RN) | `Toggle` | Native toggle control |
| `Slider` (RN) | `Slider` | Direct mapping |
| `RefreshControl` | `.refreshable { }` | Pull-to-refresh modifier |
| `SectionList` | `List { Section { } }` | Grouped list sections |
| `Clipboard.setString` | `UIPasteboard.general.string` | UIKit clipboard access |

---

## Section 5: Theme Token → SwiftUI Mapping

### Color Tokens

```swift
struct ThemeColors {
    // Brand colors
    let primary: Color
    let secondary: Color
    let tertiary: Color
    
    // Intent colors
    let success: Color
    let warning: Color
    let danger: Color
    let info: Color
    
    // Surface colors
    let surface: Color
    let surfaceVariant: Color
    let background: Color
    
    // Text colors
    let onSurface: Color
    let onSurfaceMuted: Color
    let onSurfaceSubtle: Color
    let onPrimary: Color
    let onSecondary: Color
    
    // UI element colors
    let border: Color
    let input: Color
    let ring: Color
    
    // Location POI colors
    let locationPoiFill: Color
    let locationPoiRing: Color
    let locationPoiMuted: Color
    let locationPoiBg: Color
    
    // Component-specific colors
    let card: Color
    let popover: Color
    let accent: Color
    
    // Domain-specific colors
    let waypointOnRoute: Color
    let waypointOffRoute: Color
    let waypointMixed: Color
    let enrichmentFast: Color
    let enrichmentExtended: Color
    let enrichmentCached: Color
    let deviationOriginalRoute: Color
    let deviationDetourPath: Color
    let deviationReconnectPoint: Color
    
    // Environment-aware color resolution
    func resolve(_ colorKey: ColorKey, for scheme: ColorScheme) -> Color {
        switch (colorKey, scheme) {
        case (.primary, .dark): return Color(hex: "B87333")
        case (.primary, .light): return Color(hex: "B87333")
        // ... all color mappings
        }
    }
}
```

### Typography Tokens

```swift
struct ThemeTypography {
    struct Label {
        let sm: Font
        let md: Font
        let lg: Font
    }
    
    struct Body {
        let sm: Font
        let md: Font
        let lg: Font
    }
    
    struct Title {
        let sm: Font
        let md: Font
        let lg: Font
    }
    
    struct Heading {
        let sm: Font
        let md: Font
        let lg: Font
    }
    
    struct Display {
        let sm: Font
        let md: Font
        let lg: Font
    }
    
    let label: Label
    let body: Body
    let title: Title
    let heading: Heading
    let display: Display
    
    // SF Pro font family (iOS default)
    init() {
        self.label = Label(
            sm: .system(size: 12, weight: .medium),
            md: .system(size: 14, weight: .medium),
            lg: .system(size: 14, weight: .medium)
        )
        self.body = Body(
            sm: .system(size: 14, weight: .regular),
            md: .system(size: 16, weight: .regular),
            lg: .system(size: 16, weight: .regular)
        )
        self.title = Title(
            sm: .system(size: 14, weight: .semibold),
            md: .system(size: 16, weight: .semibold),
            lg: .system(size: 24, weight: .bold)
        )
        self.heading = Heading(
            sm: .system(size: 16, weight: .semibold),
            md: .system(size: 18, weight: .semibold),
            lg: .system(size: 20, weight: .semibold)
        )
        self.display = Display(
            sm: .system(size: 36, weight: .regular),
            md: .system(size: 45, weight: .regular),
            lg: .system(size: 57, weight: .regular)
        )
    }
}
```

### Spacing Tokens

```swift
enum Spacing: CGFloat {
    case xs = 4
    case sm = 8
    case md = 12
    case lg = 16
    case xl = 24
    case twoXl = 32
    case threeXl = 48
    case fourXl = 64
}
```

### Border Radius Tokens

```swift
enum CornerRadius: CGFloat {
    case none = 0
    case sm = 4
    case md = 8
    case lg = 16
    case xl = 24
    case twoXl = 32
    case full = 9999
}
```

### Elevation Tokens

```swift
struct ThemeElevation {
    static func shadow(_ level: Int) -> some ViewModifier {
        switch level {
        case 0: return EmptyModifier()
        case 1: return ShadowModifier(color: .black.opacity(0.05), radius: 2, offset: CGSize(width: 0, height: 1))
        case 2: return ShadowModifier(color: .black.opacity(0.05), radius: 4, offset: CGSize(width: 0, height: 2))
        case 3: return ShadowModifier(color: .black.opacity(0.08), radius: 8, offset: CGSize(width: 0, height: 4))
        case 4: return ShadowModifier(color: .black.opacity(0.12), radius: 16, offset: CGSize(width: 0, height: 8))
        case 5: return ShadowModifier(color: .black.opacity(0.15), radius: 24, offset: CGSize(width: 0, height: 12))
        default: return EmptyModifier()
        }
    }
}

struct ShadowModifier: ViewModifier {
    let color: Color
    let radius: CGFloat
    let offset: CGSize
    
    func body(content: Content) -> some View {
        content.shadow(color: color, radius: radius, x: offset.width, y: offset.height)
    }
}
```

### Theme Environment

```swift
private struct ThemeEnvironmentKey: EnvironmentKey {
    static let defaultValue = AppTheme.current
}

extension EnvironmentValues {
    var theme: AppTheme {
        get { self[ThemeEnvironmentKey.self] }
        set { self[ThemeEnvironmentKey.self] = newValue }
    }
}

struct AppTheme {
    let colors: ThemeColors
    let typography: ThemeTypography
    let spacing: Spacing
    let radius: CornerRadius
    let elevation: ThemeElevation
    
    static let light = AppTheme(colors: .light, typography: .init(), spacing: .lg, radius: .lg, elevation: .init())
    static let dark = AppTheme(colors: .dark, typography: .init(), spacing: .lg, radius: .lg, elevation: .init())
    
    static var current: AppTheme {
        // Resolved from color scheme
    }
}
```

---

## Section 6: Build Order

Components listed in dependency order with estimated hours:

### Phase 1: Theme Foundation (8 hours)
1. **AppTheme.swift** (2h) — Theme infrastructure, Environment values
2. **ThemeColors.swift** (2h) — Color token enums with dark/light resolution
3. **ThemeTypography.swift** (1h) — Font scale with SF Pro
4. **ThemeSpacing.swift** (0.5h) — Spacing enum
5. **ThemeRadius.swift** (0.5h) — Corner radius enum
6. **ThemeElevation.swift** (1h) — Shadow modifiers
7. **ThemeDomain.swift** (1h) — Domain-specific tokens (waypoint, enrichment, deviation)

### Phase 2: Atomic Components (24 hours)
8. **ThemeIcon.swift** (1h) — SF Symbol wrapper
9. **ThemeText.swift** (1h) — Typography variants
10. **ThemeBackground.swift** (0.5h) — Background colors
11. **ThemeButton.swift** (3h) — All button variants, states, icons
12. **ThemeInput.swift** (2h) — Text field with focus states, icons
13. **ThemeCard.swift** (2h) — Card container with variants
14. **ThemeBadge.swift** (1h) — Status badges
15. **ThemeChip.swift** (1h) — Selectable chips
16. **ThemeCheckbox.swift** (1h) — Custom checkbox
17. **ThemeSwitch.swift** (1h) — Custom switch
18. **ThemeSlider.swift** (1h) — Range slider
19. **ThemeProgress.swift** (1h) — Progress bar
20. **ThemeSeparator.swift** (0.5h) — Dividers
21. **ThemeSkeleton.swift** (1h) — Loading placeholders
22. **ThemeAvatar.swift** (1.5h) — User avatars with fallbacks
23. **ThemeFAB.swift** (1.5h) — Floating action button
24. **ThemeLocationInput.swift** (2h) — Location autocomplete

### Phase 3: Molecule Components (32 hours)
25. **ThemeBanner.swift** (2h) — Alert banners
26. **ThemeCollapsible.swift** (1.5h) — Disclosure groups
27. **ThemeDragHandle.swift** (0.5h) — Drag indicator
28. **ThemeEmptyState.swift** (1.5h) — Empty state with action
29. **ThemeOverlayPill.swift** (1h) — Map overlay toggles
30. **ThemeStatRow.swift** (1h) — Icon + value rows
31. **ThemeSectionHeader.swift** (1h) — Section headers
32. **ThemeFloatingSearchInput.swift** (2h) — Floating search bar
33. **ThemeCaptionInput.swift** (1.5h) — Caption text field
34. **ThemePermissionNotification.swift** (1.5h) — Permission requests
35. **ThemePlanningProgressIndicator.swift** (2h) — Planning progress
36. **ThemeConnectionBanner.swift** (1.5h) — Network status
37. **ThemeRenameRouteDialog.swift** (1.5h) — Rename alert
38. **ThemeDeleteRouteDialog.swift** (1h) — Delete confirmation
39. **ThemeDateRangePicker.swift** (2h) — Date range selection
40. **ThemeDepartureTimeSelector.swift** (1.5h) — Departure time picker
41. **ThemeScenicBiasSegmented.swift** (1h) — Scenic bias toggle
42. **ThemeToggleGroup.swift** (1h) — Toggle group
43. **ThemeRouteThumbnail.swift** (1.5h) — Route preview images
44. **ThemeRouteSearchBar.swift** (1.5h) — Route search
45. **ThemeNewSessionButton.swift** (1h) — New session action
46. **ThemePrimaryButton.swift** (0.5h) — Primary button alias
47. **ThemeRainBadge.swift** (1h) — Rain intensity badge
48. **ThemeTemperatureBadge.swift** (1h) — Temperature badge
49. **ThemeWindBadge.swift** (1h) — Wind level badge
50. **ThemeWeatherPill.swift** (1h) — Weather summary pill
51. **ThemeSessionCard.swift** (2h) — Session cards
52. **ThemeRouteOptionCard.swift** (2h) — Route option cards
53. **ThemeSessionContextMenu.swift** (1.5h) — Context menu
54. **ThemeDrawerMenu.swift** (3h) — Side drawer navigation
55. **ThemeBottomNavigation.swift** (2h) — Tab bar
56. **ThemeAppHeader.swift** (1h) — App header

### Phase 4: Organism Components (40 hours)
57. **ThemeSheetHandle.swift** (0.5h) — Sheet drag handle
58. **ThemeTogglesContainer.swift** (1h) — Toggle group container
59. **ThemeRouteDetailsSheet.swift** (4h) — Route details sheet
60. **ThemeRouteTimeline.swift** (3h) — Waypoint timeline
61. **ThemePlanningErrorSheet.swift** (2h) — Error sheet
62. **ThemePlanningLoading.swift** (2h) — Loading state
63. **ThemeFavoritesInfoSheet.swift** (2h) — Favorites sheet
64. **ThemePreferencesRow.swift** (1.5h) — Settings row
65. **ThemePlanningStatusTab.swift** (1.5h) — Planning status
66. **ThemeRainTimingSummary.swift** (1h) — Rain timing
67. **ThemeSegmentDetailView.swift** (2h) — Route segment details
68. **ThemeTempRangeSummary.swift** (1h) — Temperature range
69. **ThemeWeatherStrip.swift** (1.5h) — Weather strip
70. **ThemeMapHeaderOverlay.swift** (2h) — Map header
71. **ThemeMapToastStack.swift** (2h) — Toast notifications
72. **ThemeMinimalOverlayWidget.swift** (4h) — Overlay radial menu
73. **ThemeMinimalOverlayWidgetPreview.swift** (0.5h) — Preview variant
74. **ThemeOverlayToggle.swift** (1h) — Overlay toggle
75. **ThemePlanFAB.swift** (1.5h) — Plan FAB
76. **ThemeWeatherGauge.swift** (2h) — Weather gauge
77. **ThemeWeatherPillsRow.swift** (1.5h) — Weather pills
78. **ThemeWhereToBar.swift** (2h) — Where-to search
79. **ThemeCompassPlusIcon.swift** (1h) — Compass rose
80. **ThemeEnrichmentStatusIndicator.swift** (2h) — Enrichment status
81. **ThemeEnrichedRouteCard.swift** (3h) — Enriched route card
82. **ThemeWaypointCard.swift** (3h) — Waypoint card with actions
83. **ThemeWaypointList.swift** (2h) — Reorderable waypoint list
84. **ThemeVoiceAssistantOverlay.swift** (3h) — Voice assistant UI
85. **ThemeTeacherTabBar.swift** (2h) — Teacher mode tabs
86. **ThemeTeacherTabViewLayout.swift** (2h) — Teacher tab view
87. **ThemeTeacherSimpleViewLayout.swift** (1h) — Teacher simple view
88. **ThemeTopographicBackground.swift** (2h) — Topographic background
89. **ThemeAuthCard.swift** (1.5h) — Auth card container
90. **ThemeAuthScreenLayout.swift** (2h) — Auth screen layout
91. **ThemeErrorMessage.swift** (1h) — Error message display
92. **ThemeTypingIndicator.swift** (1h) — Chat typing indicator
93. **ThemeErrorBoundary.swift** (2h) — Error boundary

### Phase 5: Template Layouts (12 hours)
94. **MenuLayout.swift** (4h) — Drawer menu layout
95. **SubpageLayout.swift** (3h) — Subpage layout with gradient
96. **BaseViewLayout.swift** (2h) — Base view layout
97. **Header.swift** (1h) — Header component
98. **TeacherTabViewLayout.swift** (2h) — Teacher tab layout

### Phase 6: Screen Compositions (16 hours)
99. **MapScreen.swift** (5h) — Main map screen
100. **SettingsScreen.swift** (2h) — Settings screen
101. **SavedRoutesScreen.swift** (2h) — Saved routes screen
102. **SessionScreen.swift** (3h) — Session detail screen
103. **AuthScreen.swift** (2h) — Authentication screens
104. **OfflineScreen.swift** (1h) — Offline status screen
105. **ProfileScreen.swift** (1h) — User profile screen

**Total Estimated Time: ~132 hours**

---

## Critical Implementation Notes

### 1. SwiftUI-Specific Patterns

**Use `@Observable` instead of `@Published`** (iOS 17+):
```swift
@Observable
class RouteViewModel {
    var routes: [Route] = []
    var isLoading: Bool = false
}
```

**Use `.task` for async operations**:
```swift
List(routes) { route in
    RouteRow(route: route)
}
.task {
    await loadRoutes()
}
```

**Use `@Environment` for shared dependencies**:
```swift
@Environment(\.theme) var theme
@Environment(\.convex) var convex
@Environment(\.clerk) var clerk
```

### 2. Mapbox Integration

Use `UIViewRepresentable` to wrap Mapbox's `MapView`:
```swift
struct MapboxMapView: UIViewRepresentable {
    let styleURI: URL
    let camera: MapCameraOptions
    let onStyleLoaded: (() -> Void)?
    
    func makeUIView(context: Context) -> MapView {
        MapView(frame: .zero, styleURI: styleURI)
    }
    
    func updateUIView(_ uiView: MapView, context: Context) {
        // Update map state
    }
}
```

### 3. Bottom Sheet Keyboard Handling

For sheets with text inputs, observe keyboard height:
```swift
struct KeyboardAwareSheet<Content: View>: View {
    @State private var keyboardHeight: CGFloat = 0
    
    var body: some View {
        Content()
            .padding(.bottom, keyboardHeight)
            .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)) { notification in
                keyboardHeight = (notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect)?.height ?? 0
            }
            .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)) { _ in
                keyboardHeight = 0
            }
    }
}
```

### 4. Animation System

Use SwiftUI's implicit animations:
```swift
withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
    isExpanded.toggle()
}
```

For complex animations, use `.matchedGeometryEffect`:
```swift
@Namespace private var animation

if isExpanded {
    DetailView()
        .matchedGeometryEffect(id: "hero", in: animation)
} else {
    ThumbnailView()
        .matchedGeometryEffect(id: "hero", in: animation)
}
```

### 5. Custom Button Styles

Define reusable button styles:
```swift
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(theme.colors.primary)
            .cornerRadius(theme.radius.md)
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
    }
}

// Usage
Button("Submit") { }
    .buttonStyle(PrimaryButtonStyle())
```

### 6. Environment Values

Inject theme via Environment:
```swift
@main
struct LaneShadowApp: App {
    @State private var theme = AppTheme.current
    
    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(\.theme, theme)
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                    theme = AppTheme.current
                }
        }
    }
}
```

---

## Success Metrics

- ☐ All 105 components mapped with exact naming parity to Android
- ☐ All semantic tokens accessible via SwiftUI Environment
- ☐ Dark/light mode automatic resolution via `.colorScheme`
- ☐ No hardcoded colors in component code
- ☐ All components use SF Symbols or custom assets
- ☐ Snapshot tests for all atomic components
- ☐ Keyboard avoidance working in all sheets with inputs
- ☐ Mapbox custom styling matching app theme
- ☐ Build order reflects actual dependency graph
- ☐ Total estimate within ±20% of actual implementation time
