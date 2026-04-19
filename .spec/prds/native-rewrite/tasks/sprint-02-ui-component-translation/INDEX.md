# Sprint 2 Task Index

**Last Updated:** 2026-04-18
**Total Tasks:** 399 (388 UI + 11 MDL)
**Status:** Atomized for parallel execution

## Task Counts by Category

| Category | Components | Platforms | Tasks |
|----------|-----------|-----------|-------|
| Atoms | 31 | Android + iOS | 62 |
| Molecules | 108 | Android + iOS | 216 |
| Organisms | 23 | Android + iOS | 46 |
| Compositions | 32 | Android + iOS | 64 |
| Models | 11 | Kotlin only | 11 |
| **Total** | **194** | **—** | **399** |

## Dependency Graph

### Foundation Dependencies (External)

All UI and MDL tasks depend on these FND tasks completing first:
- **FND-001** — Atom matrices (`matrices/ui/atoms/*.md`)
- **FND-002** — Molecule matrices (`matrices/ui/molecules/*.md`)
- **FND-003** — Organism matrices (`matrices/ui/organisms/*.md`)
- **FND-004** — Composition matrices (`matrices/ui/{templates,screens,delta}/*.md`)
- **FND-005** — Model inventory (`matrices/models/INVENTORY.md`)
- **FND-006** — MODEL translation plans (`matrices/models/MODEL-*.md`)

### Internal Dependencies

**UI tasks are leaf nodes** — they do not block other UI tasks. All 388 UI tasks can execute in parallel subject to:
- Platform agent capacity (kotlin-implementer, swift-implementer)
- Working tree isolation (use worktrees for parallel dispatch)

**MDL tasks are leaf nodes** — they do not block UI tasks. All 11 MDL tasks can execute in parallel on kotlin-implementer.

## Task Listing

### Atoms (UI-001 through UI-062)

| ID | Component | Android | iOS | Matrix File |
|----|-----------|---------|-----|-------------|
| UI-001 | Avatar | UI-001-android-avatar.md | UI-001-ios-avatar.md | matrices/ui/atoms/Avatar.md |
| UI-002 | Badge | UI-002-android-badge.md | UI-002-ios-badge.md | matrices/ui/atoms/Badge.md |
| UI-003 | BottomSheetInput | UI-003-android-bottomsheetinput.md | UI-003-ios-bottomsheetinput.md | matrices/ui/atoms/BottomSheetInput.md |
| UI-004 | Button | UI-004-android-button.md | UI-004-ios-button.md | matrices/ui/atoms/Button.md |
| UI-005 | Card | UI-005-android-card.md | UI-005-ios-card.md | matrices/ui/atoms/Card.md |
| UI-006 | Checkbox | UI-006-android-checkbox.md | UI-006-ios-checkbox.md | matrices/ui/atoms/Checkbox.md |
| UI-007 | Chip | UI-007-android-chip.md | UI-007-ios-chip.md | matrices/ui/atoms/Chip.md |
| UI-008 | Collapsible | UI-008-android-collapsible.md | UI-008-ios-collapsible.md | matrices/ui/atoms/Collapsible.md |
| UI-009 | CompassPlusIcon | UI-009-android-compassplusicon.md | UI-009-ios-compassplusicon.md | matrices/ui/atoms/CompassPlusIcon.md |
| UI-010 | DeviationPolyline | UI-010-android-deviationpolyline.md | UI-010-ios-deviationpolyline.md | matrices/ui/atoms/DeviationPolyline.md |
| UI-011 | DragHandle | UI-011-android-draghandle.md | UI-011-ios-draghandle.md | matrices/ui/atoms/DragHandle.md |
| UI-012 | FAB | UI-012-android-fab.md | UI-012-ios-fab.md | matrices/ui/atoms/FAB.md |
| UI-013 | IconSymbol | UI-013-android-iconsymbol.md | UI-013-ios-iconsymbol.md | matrices/ui/atoms/IconSymbol.md |
| UI-014 | IconSymbol-iOS | UI-014-android-iconsymbol-ios.md | UI-014-ios-iconsymbol-ios.md | matrices/ui/atoms/IconSymbol-iOS.md |
| UI-015 | Input | UI-015-android-input.md | UI-015-ios-input.md | matrices/ui/atoms/Input.md |
| UI-016 | LaneShadowLogo | UI-016-android-laneshadowlogo.md | UI-016-ios-laneshadowlogo.md | matrices/ui/atoms/LaneShadowLogo.md |
| UI-017 | MotorcyclePlusIcon | UI-017-android-motorcycleplusicon.md | UI-017-ios-motorcycleplusicon.md | matrices/ui/atoms/MotorcyclePlusIcon.md |
| UI-018 | PrimaryButton | UI-018-android-primarybutton.md | UI-018-ios-primarybutton.md | matrices/ui/atoms/PrimaryButton.md |
| UI-019 | Progress | UI-019-android-progress.md | UI-019-ios-progress.md | matrices/ui/atoms/Progress.md |
| UI-020 | RoutePolyline | UI-020-android-routepolyline.md | UI-020-ios-routepolyline.md | matrices/ui/atoms/RoutePolyline.md |
| UI-021 | RoutePolylineComponent | UI-021-android-routepolylinecomponent.md | UI-021-ios-routepolylinecomponent.md | matrices/ui/atoms/RoutePolylineComponent.md |
| UI-022 | Separator | UI-022-android-separator.md | UI-022-ios-separator.md | matrices/ui/atoms/Separator.md |
| UI-023 | SheetHandle | UI-023-android-sheethandle.md | UI-023-ios-sheethandle.md | matrices/ui/atoms/SheetHandle.md |
| UI-024 | Skeleton | UI-024-android-skeleton.md | UI-024-ios-skeleton.md | matrices/ui/atoms/Skeleton.md |
| UI-025 | Slider | UI-025-android-slider.md | UI-025-ios-slider.md | matrices/ui/atoms/Slider.md |
| UI-026 | Switch | UI-026-android-switch.md | UI-026-ios-switch.md | matrices/ui/atoms/Switch.md |
| UI-027 | Textarea | UI-027-android-textarea.md | UI-027-ios-textarea.md | matrices/ui/atoms/Textarea.md |
| UI-028 | ThemedText | UI-028-android-themedtext.md | UI-028-ios-themedtext.md | matrices/ui/atoms/ThemedText.md |
| UI-029 | ThemedView | UI-029-android-themedview.md | UI-029-ios-themedview.md | matrices/ui/atoms/ThemedView.md |
| UI-030 | Toggle | UI-030-android-toggle.md | UI-030-ios-toggle.md | matrices/ui/atoms/Toggle.md |
| UI-031 | TypingIndicator | UI-031-android-typingindicator.md | UI-031-ios-typingindicator.md | matrices/ui/atoms/TypingIndicator.md |

### Molecules (UI-063 through UI-278)

| ID | Component | Android | iOS | Matrix File |
|----|-----------|---------|-----|-------------|
| UI-063 | AppHeader | UI-063-android-appheader.md | UI-063-ios-appheader.md | matrices/ui/molecules/AppHeader.md |
| UI-064 | AuthCard | UI-064-android-authcard.md | UI-064-ios-authcard.md | matrices/ui/molecules/AuthCard.md |
| UI-065 | Banner | UI-065-android-banner.md | UI-065-ios-banner.md | matrices/ui/molecules/Banner.md |
| UI-066 | CaptionInput | UI-066-android-captioninput.md | UI-066-ios-captioninput.md | matrices/ui/molecules/CaptionInput.md |
| UI-067 | CardSkeleton | UI-067-android-cardskeleton.md | UI-067-ios-cardskeleton.md | matrices/ui/molecules/CardSkeleton.md |
| UI-068 | ChatTranscript | UI-068-android-chattranscript.md | UI-068-ios-chattranscript.md | matrices/ui/molecules/ChatTranscript.md |
| UI-069 | ConnectionBanner | UI-069-android-connectionbanner.md | UI-069-ios-connectionbanner.md | matrices/ui/molecules/ConnectionBanner.md |
| UI-070 | CreativeLabelFadeIn | UI-070-android-creativelabelfadein.md | UI-070-ios-creativelabelfadein.md | matrices/ui/molecules/CreativeLabelFadeIn.md |
| UI-071 | DateRangePicker | UI-071-android-daterangepicker.md | UI-071-ios-daterangepicker.md | matrices/ui/molecules/DateRangePicker.md |
| UI-072 | DeleteConfirmationDialog | UI-072-android-deleteconfirmationdialog.md | UI-072-ios-deleteconfirmationdialog.md | matrices/ui/molecules/DeleteConfirmationDialog.md |
| UI-073 | DeleteFavoriteDialog | UI-073-android-deletefavoritedialog.md | UI-073-ios-deletefavoritedialog.md | matrices/ui/molecules/DeleteFavoriteDialog.md |
| UI-074 | DeleteRouteDialog | UI-074-android-deleteroutedialog.md | UI-074-ios-deleteroutedialog.md | matrices/ui/molecules/DeleteRouteDialog.md |
| UI-075 | DepartureTimeSelector | UI-075-android-departuretimeselector.md | UI-075-ios-departuretimeselector.md | matrices/ui/molecules/DepartureTimeSelector.md |
| UI-076 | DiscoveryEmptyOverlay | UI-076-android-discoveryemptyoverlay.md | UI-076-ios-discoveryemptyoverlay.md | matrices/ui/molecules/DiscoveryEmptyOverlay.md |
| UI-077 | DiscoveryFilterBar | UI-077-android-discoveryfilterbar.md | UI-077-ios-discoveryfilterbar.md | matrices/ui/molecules/DiscoveryFilterBar.md |
| UI-078 | DiscoveryLoadingOverlay | UI-078-android-discoveryloadingoverlay.md | UI-078-ios-discoveryloadingoverlay.md | matrices/ui/molecules/DiscoveryLoadingOverlay.md |
| UI-079 | DiscoverySortToggle | UI-079-android-discoverysorttoggle.md | UI-079-ios-discoverysorttoggle.md | matrices/ui/molecules/DiscoverySortToggle.md |
| UI-080 | DownloadErrorSheet | UI-080-android-downloaderrorsheet.md | UI-080-ios-downloaderrorsheet.md | matrices/ui/molecules/DownloadErrorSheet.md |
| UI-081 | DownloadProgressBanner | UI-081-android-downloadprogressbanner.md | UI-081-ios-downloadprogressbanner.md | matrices/ui/molecules/DownloadProgressBanner.md |
| UI-082 | DownloadProgressIndicator | UI-082-android-downloadprogressindicator.md | UI-082-ios-downloadprogressindicator.md | matrices/ui/molecules/DownloadProgressIndicator.md |
| UI-083 | EmptyState | UI-083-android-emptystate.md | UI-083-ios-emptystate.md | matrices/ui/molecules/EmptyState.md |
| UI-084 | EnrichmentStatusBadge | UI-084-android-enrichmentstatusbadge.md | UI-084-ios-enrichmentstatusbadge.md | matrices/ui/molecules/EnrichmentStatusBadge.md |
| UI-085 | ErrorMessage | UI-085-android-errormessage.md | UI-085-ios-errormessage.md | matrices/ui/molecules/ErrorMessage.md |
| UI-086 | ErrorToast | UI-086-android-errortoast.md | UI-086-ios-errortoast.md | matrices/ui/molecules/ErrorToast.md |
| UI-087 | FavoriteExclusionAlert | UI-087-android-favoriteexclusionalert.md | UI-087-ios-favoriteexclusionalert.md | matrices/ui/molecules/FavoriteExclusionAlert.md |
| UI-088 | FavoriteRoadCard | UI-088-android-favoriteroadcard.md | UI-088-ios-favoriteroadcard.md | matrices/ui/molecules/FavoriteRoadCard.md |
| UI-089 | FavoritesInfoSheet | UI-089-android-favoritesinfosheet.md | UI-089-ios-favoritesinfosheet.md | matrices/ui/molecules/FavoritesInfoSheet.md |
| UI-090 | FloatingSearchInput | UI-090-android-floatingsearchinput.md | UI-090-ios-floatingsearchinput.md | matrices/ui/molecules/FloatingSearchInput.md |
| UI-091 | Header | UI-091-android-header.md | UI-091-ios-header.md | matrices/ui/molecules/Header.md |
| UI-092 | HighlightTagsStagger | UI-092-android-highlighttagsstagger.md | UI-092-ios-highlighttagsstagger.md | matrices/ui/molecules/HighlightTagsStagger.md |
| UI-093 | InfoToast | UI-093-android-infotoast.md | UI-093-ios-infotoast.md | matrices/ui/molecules/InfoToast.md |
| UI-094 | IntentSearchSheet | UI-094-android-intentsearchsheet.md | UI-094-ios-intentsearchsheet.md | matrices/ui/molecules/IntentSearchSheet.md |
| UI-095 | IntentSummaryPill | UI-095-android-intentsummarypill.md | UI-095-ios-intentsummarypill.md | matrices/ui/molecules/IntentSummaryPill.md |
| UI-096 | KeyboardAvoidingInput | UI-096-android-keyboardavoidinginput.md | UI-096-ios-keyboardavoidinginput.md | matrices/ui/molecules/KeyboardAvoidingInput.md |
| UI-097 | LabelSkeleton | UI-097-android-labelskeleton.md | UI-097-ios-labelskeleton.md | matrices/ui/molecules/LabelSkeleton.md |
| UI-098 | LocationInput | UI-098-android-locationinput.md | UI-098-ios-locationinput.md | matrices/ui/molecules/LocationInput.md |
| UI-099 | LocationSearchCard | UI-099-android-locationsearchcard.md | UI-099-ios-locationsearchcard.md | matrices/ui/molecules/LocationSearchCard.md |
| UI-100 | MapControls | UI-100-android-mapcontrols.md | UI-100-ios-mapcontrols.md | matrices/ui/molecules/MapControls.md |
| UI-101 | MapHeaderOverlay | UI-101-android-mapheaderoverlay.md | UI-101-ios-mapheaderoverlay.md | matrices/ui/molecules/MapHeaderOverlay.md |
| UI-102 | MapPlanningIndicator | UI-102-android-mapplanningindicator.md | UI-102-ios-mapplanningindicator.md | matrices/ui/molecules/MapPlanningIndicator.md |
| UI-103 | MarkdownText | UI-103-android-markdowntext.md | UI-103-ios-markdowntext.md | matrices/ui/molecules/MarkdownText.md |
| UI-104 | MinimalOverlayWidget | UI-104-android-minimaloverlaywidget.md | UI-104-ios-minimaloverlaywidget.md | matrices/ui/molecules/MinimalOverlayWidget.md |
| UI-105 | MinimalOverlayWidgetPreview | UI-105-android-minimaloverlaywidgetpreview.md | UI-105-ios-minimaloverlaywidgetpreview.md | matrices/ui/molecules/MinimalOverlayWidgetPreview.md |
| UI-106 | NewSessionButton | UI-106-android-newsessionbutton.md | UI-106-ios-newsessionbutton.md | matrices/ui/molecules/NewSessionButton.md |
| UI-107 | OverlayPill | UI-107-android-overlaypill.md | UI-107-ios-overlaypill.md | matrices/ui/molecules/OverlayPill.md |
| UI-108 | OverlayToggle | UI-108-android-overlaytoggle.md | UI-108-ios-overlaytoggle.md | matrices/ui/molecules/OverlayToggle.md |
| UI-109 | PermissionNotification | UI-109-android-permissionnotification.md | UI-109-ios-permissionnotification.md | matrices/ui/molecules/PermissionNotification.md |
| UI-110 | PlanFAB | UI-110-android-planfab.md | UI-110-ios-planfab.md | matrices/ui/molecules/PlanFAB.md |
| UI-111 | PlanningCard | UI-111-android-planningcard.md | UI-111-ios-planningcard.md | matrices/ui/molecules/PlanningCard.md |
| UI-112 | PlanningErrorSheet | UI-112-android-planningerrorsheet.md | UI-112-ios-planningerrorsheet.md | matrices/ui/molecules/PlanningErrorSheet.md |
| UI-113 | PlanningLoading | UI-113-android-planningloading.md | UI-113-ios-planningloading.md | matrices/ui/molecules/PlanningLoading.md |
| UI-114 | PlanningProgressIndicator | UI-114-android-planningprogressindicator.md | UI-114-ios-planningprogressindicator.md | matrices/ui/molecules/PlanningProgressIndicator.md |
| UI-115 | PlanningStatusTab | UI-115-android-planningstatustab.md | UI-115-ios-planningstatustab.md | matrices/ui/molecules/PlanningStatusTab.md |
| UI-116 | PreferencesRow | UI-116-android-preferencesrow.md | UI-116-ios-preferencesrow.md | matrices/ui/molecules/PreferencesRow.md |
| UI-117 | ProgressiveEnhancementToast | UI-117-android-progressiveenhancementtoast.md | UI-117-ios-progressiveenhancementtoast.md | matrices/ui/molecules/ProgressiveEnhancementToast.md |
| UI-118 | RainBadge | UI-118-android-rainbadge.md | UI-118-ios-rainbadge.md | matrices/ui/molecules/RainBadge.md |
| UI-119 | RainTimingSummary | UI-119-android-raintimingsummary.md | UI-119-ios-raintimingsummary.md | matrices/ui/molecules/RainTimingSummary.md |
| UI-120 | RationaleReveal | UI-120-android-rationalereveal.md | UI-120-ios-rationalereveal.md | matrices/ui/molecules/RationaleReveal.md |
| UI-121 | ReasoningCard | UI-121-android-reasoningcard.md | UI-121-ios-reasoningcard.md | matrices/ui/molecules/ReasoningCard.md |
| UI-122 | RegionListItem | UI-122-android-regionlistitem.md | UI-122-ios-regionlistitem.md | matrices/ui/molecules/RegionListItem.md |
| UI-123 | RegionNameBottomSheet | UI-123-android-regionnamebottomsheet.md | UI-123-ios-regionnamebottomsheet.md | matrices/ui/molecules/RegionNameBottomSheet.md |
| UI-124 | RenameRegionBottomSheet | UI-124-android-renameregionbottomsheet.md | UI-124-ios-renameregionbottomsheet.md | matrices/ui/molecules/RenameRegionBottomSheet.md |
| UI-125 | RenameRouteDialog | UI-125-android-renameroutedialog.md | UI-125-ios-renameroutedialog.md | matrices/ui/molecules/RenameRouteDialog.md |
| UI-126 | RouteAttachmentCard | UI-126-android-routeattachmentcard.md | UI-126-ios-routeattachmentcard.md | matrices/ui/molecules/RouteAttachmentCard.md |
| UI-127 | RouteBadge | UI-127-android-routebadge.md | UI-127-ios-routebadge.md | matrices/ui/molecules/RouteBadge.md |
| UI-128 | RouteLegTimeline | UI-128-android-routelegt timeline.md | UI-128-ios-routelegt timeline.md | matrices/ui/molecules/RouteLegTimeline.md |
| UI-129 | RouteMiniMap | UI-129-android-routeminimap.md | UI-129-ios-routeminimap.md | matrices/ui/molecules/RouteMiniMap.md |
| UI-130 | RouteOptionCard-Planning | UI-130-android-routeoptioncard-planning.md | UI-130-ios-routeoptioncard-planning.md | matrices/ui/molecules/RouteOptionCard-Planning.md |
| UI-131 | RouteOptionCard | UI-131-android-routeoptioncard.md | UI-131-ios-routeoptioncard.md | matrices/ui/molecules/RouteOptionCard.md |
| UI-132 | RoutePin | UI-132-android-routepin.md | UI-132-ios-routepin.md | matrices/ui/molecules/RoutePin.md |
| UI-133 | RouteThumbnail | UI-133-android-routethumbnail.md | UI-133-ios-routethumbnail.md | matrices/ui/molecules/RouteThumbnail.md |
| UI-134 | RoutingCard | UI-134-android-routingcard.md | UI-134-ios-routingcard.md | matrices/ui/molecules/RoutingCard.md |
| UI-135 | SavedRouteCard | UI-135-android-savedroutecard.md | UI-135-ios-savedroutecard.md | matrices/ui/molecules/SavedRouteCard.md |
| UI-136 | SaveFavoriteSheet | UI-136-android-savefavoritesheet.md | UI-136-ios-savefavoritesheet.md | matrices/ui/molecules/SaveFavoriteSheet.md |
| UI-137 | ScenicBiasSegmented | UI-137-android-scenicbiassegmented.md | UI-137-ios-scenicbiassegmented.md | matrices/ui/molecules/ScenicBiasSegmented.md |
| UI-138 | SearchBar | UI-138-android-searchbar.md | UI-138-ios-searchbar.md | matrices/ui/molecules/SearchBar.md |
| UI-139 | SearchResultMarker | UI-139-android-searchresultmarker.md | UI-139-ios-searchresultmarker.md | matrices/ui/molecules/SearchResultMarker.md |
| UI-140 | SectionHeader | UI-140-android-sectionheader.md | UI-140-ios-sectionheader.md | matrices/ui/molecules/SectionHeader.md |
| UI-141 | SegmentDetailView | UI-141-android-segmentdetailview.md | UI-141-ios-segmentdetailview.md | matrices/ui/molecules/SegmentDetailView.md |
| UI-142 | SessionCard | UI-142-android-sessioncard.md | UI-142-ios-sessioncard.md | matrices/ui/molecules/SessionCard.md |
| UI-143 | SessionContextMenu | UI-143-android-sessioncontextmenu.md | UI-143-ios-sessioncontextmenu.md | matrices/ui/molecules/SessionContextMenu.md |
| UI-144 | SkeletonWrapper | UI-144-android-skeletonwrapper.md | UI-144-ios-skeletonwrapper.md | matrices/ui/molecules/SkeletonWrapper.md |
| UI-145 | StateFilterSheet | UI-145-android-statefiltersheet.md | UI-145-ios-statefiltersheet.md | matrices/ui/molecules/StateFilterSheet.md |
| UI-146 | StateListItem | UI-146-android-statelistitem.md | UI-146-ios-statelistitem.md | matrices/ui/molecules/StateListItem.md |
| UI-147 | StatRow | UI-147-android-statrow.md | UI-147-ios-statrow.md | matrices/ui/molecules/StatRow.md |
| UI-148 | SuccessToast | UI-148-android-successtoast.md | UI-148-ios-successtoast.md | matrices/ui/molecules/SuccessToast.md |
| UI-149 | SuggestionChips | UI-149-android-suggestionchips.md | UI-149-ios-suggestionchips.md | matrices/ui/molecules/SuggestionChips.md |
| UI-150 | TeacherTabBar | UI-150-android-teachertabbar.md | UI-150-ios-teachertabbar.md | matrices/ui/molecules/TeacherTabBar.md |
| UI-151 | TemperatureBadge | UI-151-android-temperaturebadge.md | UI-151-ios-temperaturebadge.md | matrices/ui/molecules/TemperatureBadge.md |
| UI-152 | TempRangeSummary | UI-152-android-temprangesummary.md | UI-152-ios-temprangesummary.md | matrices/ui/molecules/TempRangeSummary.md |
| UI-153 | ThemePicker | UI-153-android-themepicker.md | UI-153-ios-themepicker.md | matrices/ui/molecules/ThemePicker.md |
| UI-154 | ThinkingCard | UI-154-android-thinkingcard.md | UI-154-ios-thinkingcard.md | matrices/ui/molecules/ThinkingCard.md |
| UI-155 | ToggleGroup | UI-155-android-togglegroup.md | UI-155-ios-togglegroup.md | matrices/ui/molecules/ToggleGroup.md |
| UI-156 | TogglesContainer | UI-156-android-togglescontainer.md | UI-156-ios-togglescontainer.md | matrices/ui/molecules/TogglesContainer.md |
| UI-157 | TopographicBackground | UI-157-android-topographicbackground.md | UI-157-ios-topographicbackground.md | matrices/ui/molecules/TopographicBackground.md |
| UI-158 | TypingIndicator | UI-158-android-typingindicator.md | UI-158-ios-typingindicator.md | matrices/ui/molecules/TypingIndicator.md |
| UI-159 | WarningToast | UI-159-android-warningtoast.md | UI-159-ios-warningtoast.md | matrices/ui/molecules/WarningToast.md |
| UI-160 | WaypointCard | UI-160-android-waypointcard.md | UI-160-ios-waypointcard.md | matrices/ui/molecules/WaypointCard.md |
| UI-161 | WaypointMarker | UI-161-android-waypointmarker.md | UI-161-ios-waypointmarker.md | matrices/ui/molecules/WaypointMarker.md |
| UI-162 | WeatherBadgeSkeleton | UI-162-android-weatherbadgeskeleton.md | UI-162-ios-weatherbadgeskeleton.md | matrices/ui/molecules/WeatherBadgeSkeleton.md |
| UI-163 | WeatherGauge | UI-163-android-weathergauge.md | UI-163-ios-weathergauge.md | matrices/ui/molecules/WeatherGauge.md |
| UI-164 | WeatherOverlay | UI-164-android-weatheroverlay.md | UI-164-ios-weatheroverlay.md | matrices/ui/molecules/WeatherOverlay.md |
| UI-165 | WeatherPill | UI-165-android-weatherpill.md | UI-165-ios-weatherpill.md | matrices/ui/molecules/WeatherPill.md |
| UI-166 | WeatherPillsRow | UI-166-android-weatherpillsrow.md | UI-166-ios-weatherpillsrow.md | matrices/ui/molecules/WeatherPillsRow.md |
| UI-167 | WeatherStrip | UI-167-android-weatherstrip.md | UI-167-ios-weatherstrip.md | matrices/ui/molecules/WeatherStrip.md |
| UI-168 | WhereToBar | UI-168-android-wheretobar.md | UI-168-ios-wheretobar.md | matrices/ui/molecules/WhereToBar.md |
| UI-169 | WifiRequiredSheet | UI-169-android-wifirequiredsheet.md | UI-169-ios-wifirequiredsheet.md | matrices/ui/molecules/WifiRequiredSheet.md |
| UI-170 | WindBadge | UI-170-android-windbadge.md | UI-170-ios-windbadge.md | matrices/ui/molecules/WindBadge.md |

### Organisms (UI-279 through UI-324)

| ID | Component | Android | iOS | Matrix File |
|----|-----------|---------|-----|-------------|
| UI-279 | ChatInput | UI-279-android-chatinput.md | UI-279-ios-chatinput.md | matrices/ui/organisms/ChatInput.md |
| UI-280 | ChatTranscript | UI-280-android-chattranscript.md | UI-280-ios-chattranscript.md | matrices/ui/organisms/ChatTranscript.md |
| UI-281 | DevMenu | UI-281-android-devmenu.md | UI-281-ios-devmenu.md | matrices/ui/organisms/DevMenu.md |
| UI-282 | DrawerMenu | UI-282-android-drawermenu.md | UI-282-ios-drawermenu.md | matrices/ui/organisms/DrawerMenu.md |
| UI-283 | EnrichedRouteCard | UI-283-android-enrichedroutecard.md | UI-283-ios-enrichedroutecard.md | matrices/ui/organisms/EnrichedRouteCard.md |
| UI-284 | EnrichmentProgressProvider | UI-284-android-enrichmentprogressprovider.md | UI-284-ios-enrichmentprogressprovider.md | matrices/ui/organisms/EnrichmentProgressProvider.md |
| UI-285 | FavoriteRoadsSection | UI-285-android-favoriteroadssection.md | UI-285-ios-favoriteroadssection.md | matrices/ui/organisms/FavoriteRoadsSection.md |
| UI-286 | IntentSearchSheet | UI-286-android-intentsearchsheet.md | UI-286-ios-intentsearchsheet.md | matrices/ui/organisms/IntentSearchSheet.md |
| UI-287 | MapboxMapView | UI-287-android-mapboxmapview.md | UI-287-ios-mapboxmapview.md | matrices/ui/organisms/MapboxMapView.md |
| UI-288 | MapToastStack | UI-288-android-mapt toaststack.md | UI-288-ios-mapt toaststack.md | matrices/ui/organisms/MapToastStack.md |
| UI-289 | MapViewWrapper | UI-289-android-mapviewwrapper.md | UI-289-ios-mapviewwrapper.md | matrices/ui/organisms/MapViewWrapper.md |
| UI-290 | ModelManagerSection | UI-290-android-modelmanagersection.md | UI-290-ios-modelmanagersection.md | matrices/ui/organisms/ModelManagerSection.md |
| UI-291 | PlanningBottomSheet | UI-291-android-planningbottomsheet.md | UI-291-ios-planningbottomsheet.md | matrices/ui/organisms/PlanningBottomSheet.md |
| UI-292 | PlanRideSheet | UI-292-android-planridesheet.md | UI-292-ios-planridesheet.md | matrices/ui/organisms/PlanRideSheet.md |
| UI-293 | RouteDetailsSheet | UI-293-android-routedetailssheet.md | UI-293-ios-routedetailssheet.md | matrices/ui/organisms/RouteDetailsSheet.md |
| UI-294 | RouteDetailsSkeleton | UI-294-android-routedetailsskeleton.md | UI-294-ios-routedetailsskeleton.md | matrices/ui/organisms/RouteDetailsSkeleton.md |
| UI-295 | RouteDirectionsSheet | UI-295-android-routedirectionssheet.md | UI-295-ios-routedirectionssheet.md | matrices/ui/organisms/RouteDirectionsSheet.md |
| UI-296 | RouteOptionsSheet | UI-296-android-routeoptionssheet.md | UI-296-ios-routeoptionssheet.md | matrices/ui/organisms/RouteOptionsSheet.md |
| UI-297 | RouteTimeline | UI-297-android-routetimeline.md | UI-297-ios-routetimeline.md | matrices/ui/organisms/RouteTimeline.md |
| UI-298 | SessionSidebar | UI-298-android-sessionsidebar.md | UI-298-ios-sessionsidebar.md | matrices/ui/organisms/SessionSidebar.md |
| UI-299 | StateFilterSheet | UI-299-android-statefiltersheet.md | UI-299-ios-statefiltersheet.md | matrices/ui/organisms/StateFilterSheet.md |
| UI-300 | VoiceAssistantOverlay | UI-300-android-voiceassistantoverlay.md | UI-300-ios-voiceassistantoverlay.md | matrices/ui/organisms/VoiceAssistantOverlay.md |
| UI-301 | WaypointList | UI-301-android-waypointlist.md | UI-301-ios-waypointlist.md | matrices/ui/organisms/WaypointList.md |

### Compositions (UI-325 through UI-388)

| ID | Component | Android | iOS | Matrix File |
|----|-----------|---------|-----|-------------|
| UI-325 | AuthScreenLayout | UI-325-android-authscreenlayout.md | UI-325-ios-authscreenlayout.md | matrices/ui/screens/AuthScreenLayout.md |
| UI-326 | BaseViewLayout | UI-326-android-baseviewlayout.md | UI-326-ios-baseviewlayout.md | matrices/ui/screens/BaseViewLayout.md |
| UI-327 | BottomActionSheet | UI-327-android-bottomactionsheet.md | UI-327-ios-bottomactionsheet.md | matrices/ui/screens/BottomActionSheet.md |
| UI-328 | BottomNavigation | UI-328-android-bottomnavigation.md | UI-328-ios-bottomnavigation.md | matrices/ui/screens/BottomNavigation.md |
| UI-329 | BottomSheetWrapper | UI-329-android-bottomsheetwrapper.md | UI-329-ios-bottomsheetwrapper.md | matrices/ui/screens/BottomSheetWrapper.md |
| UI-330 | BoundingBoxOverlay | UI-330-android-boundingboxoverlay.md | UI-330-ios-boundingboxoverlay.md | matrices/ui/screens/BoundingBoxOverlay.md |
| UI-331 | ButtonUsage | UI-331-android-buttonusage.md | UI-331-ios-buttonusage.md | matrices/ui/screens/ButtonUsage.md |
| UI-332 | CompletionScreen | UI-332-android-completionscreen.md | UI-332-ios-completionscreen.md | matrices/ui/screens/CompletionScreen.md |
| UI-333 | CompletionSummaryCard | UI-333-android-completionsummarycard.md | UI-333-ios-completionsummarycard.md | matrices/ui/screens/CompletionSummaryCard.md |
| UI-334 | DownloadProgressScreen | UI-334-android-downloadprogressscreen.md | UI-334-ios-downloadprogressscreen.md | matrices/ui/screens/DownloadProgressScreen.md |
| UI-335 | ElevationProfileChart | UI-335-android-elevationprofilechart.md | UI-335-ios-elevationprofilechart.md | matrices/ui/screens/ElevationProfileChart.md |
| UI-336 | ErrorBoundary | UI-336-android-errorboundary.md | UI-336-ios-errorboundary.md | matrices/ui/screens/ErrorBoundary.md |
| UI-337 | GatekeeperUpgradePrompt | UI-337-android-gatekeeperupgradeprompt.md | UI-337-ios-gatekeeperupgradeprompt.md | matrices/ui/screens/GatekeeperUpgradePrompt.md |
| UI-338 | MenuLayout | UI-338-android-menulayout.md | UI-338-ios-menulayout.md | matrices/ui/screens/MenuLayout.md |
| UI-339 | ModelDownloadScreen | UI-339-android-modeldownloadscreen.md | UI-339-ios-modeldownloadscreen.md | matrices/ui/screens/ModelDownloadScreen.md |
| UI-340 | ModelGatekeeperProvider | UI-340-android-modelgatekeeperprovider.md | UI-340-ios-modelgatekeeperprovider.md | matrices/ui/screens/ModelGatekeeperProvider.md |
| UI-341 | PlatformNotificationTemplate | UI-341-android-platformnotificationtemplate.md | UI-341-ios-platformnotificationtemplate.md | matrices/ui/screens/PlatformNotificationTemplate.md |
| UI-342 | RegionBoundsPreview | UI-342-android-regionboundspreview.md | UI-342-ios-regionboundspreview.md | matrices/ui/screens/RegionBoundsPreview.md |
| UI-343 | RideCompletionScreen | UI-343-android-ridecompletionscreen.md | UI-343-ios-ridecompletionscreen.md | matrices/ui/screens/RideCompletionScreen.md |
| UI-344 | RideShareSheet | UI-344-android-ridesharesheet.md | UI-344-ios-ridesharesheet.md | matrices/ui/screens/RideShareSheet.md |
| UI-345 | RouteComparisonView | UI-345-android-routecomparisonview.md | UI-345-ios-routecomparisonview.md | matrices/ui/screens/RouteComparisonView.md |
| UI-346 | RouteDiscoveryScreen | UI-346-android-routediscoveryscreen.md | UI-346-ios-routediscoveryscreen.md | matrices/ui/screens/RouteDiscoveryScreen.md |
| UI-347 | RouteOptionsScreen | UI-347-android-routeoptionsscreen.md | UI-347-ios-routeoptionsscreen.md | matrices/ui/screens/RouteOptionsScreen.md |
| UI-348 | SavedRoutesScreen | UI-348-android-savedroutesscreen.md | UI-348-ios-savedroutesscreen.md | matrices/ui/screens/SavedRoutesScreen.md |
| UI-349 | SetupRequiredScreen | UI-349-android-setuprequiredscreen.md | UI-349-ios-setuprequiredscreen.md | matrices/ui/screens/SetupRequiredScreen.md |
| UI-350 | Speedometer | UI-350-android-speedometer.md | UI-350-ios-speedometer.md | matrices/ui/screens/Speedometer.md |
| UI-351 | SubpageLayout | UI-351-android-subpagelayout.md | UI-351-ios-subpagelayout.md | matrices/ui/screens/SubpageLayout.md |
| UI-352 | TeacherSimpleViewLayout | UI-352-android-teachersimpleviewlayout.md | UI-352-ios-teachersimpleviewlayout.md | matrices/ui/screens/TeacherSimpleViewLayout.md |
| UI-353 | TeacherTabViewLayout | UI-353-android-teachertabviewlayout.md | UI-353-ios-teachertabviewlayout.md | matrices/ui/screens/TeacherTabViewLayout.md |
| UI-354 | TurnInstructionCard | UI-354-android-turninstructioncard.md | UI-354-ios-turninstructioncard.md | matrices/ui/screens/TurnInstructionCard.md |
| UI-355 | VoiceListeningVisualizer | UI-355-android-voicelisteningvisualizer.md | UI-355-ios-voicelisteningvisualizer.md | matrices/ui/screens/VoiceListeningVisualizer.md |
| UI-356 | WelcomeScreen | UI-356-android-welcomescreen.md | UI-356-ios-welcomescreen.md | matrices/ui/screens/WelcomeScreen.md |

### Model Translations (MDL-001 through MDL-011)

| ID | Model | Task File | Matrix File |
|----|-------|-----------|-------------|
| MDL-001 | atomic-write | MDL-001-atomic-write.md | matrices/models/MODEL-atomic-write.md |
| MDL-002 | auth-tokens | MDL-002-auth-tokens.md | matrices/models/MODEL-auth-tokens.md |
| MDL-003 | camera-quick | MDL-003-camera-quick.md | matrices/models/MODEL-camera-quick.md |
| MDL-004 | checksum | MDL-004-checksum.md | matrices/models/MODEL-checksum.md |
| MDL-005 | download-queue | MDL-005-download-queue.md | matrices/models/MODEL-download-queue.md |
| MDL-006 | gatekeeper-download-manager | MDL-006-gatekeeper-download-manager.md | matrices/models/MODEL-gatekeeper-download-manager.md |
| MDL-007 | model-download | MDL-007-model-download.md | matrices/models/MODEL-model-download.md |
| MDL-008 | model-manifest | MDL-008-model-manifest.md | matrices/models/MODEL-model-manifest.md |
| MDL-009 | storage-utils | MDL-009-storage-utils.md | matrices/models/MODEL-storage-utils.md |
| MDL-010 | weather-optimization | MDL-010-weather-optimization.md | matrices/models/MODEL-weather-optimization.md |
| MDL-011 | wifi-validator | MDL-011-wifi-validator.md | matrices/models/MODEL-wifi-validator.md |

## Execution Strategy

### Parallel Batches

**Recommended execution order:**

1. **Wave 1 — Atoms (62 tasks):** All 31 atoms × 2 platforms in parallel
2. **Wave 2 — Molecules (216 tasks):** All 108 molecules × 2 platforms in parallel
3. **Wave 3 — Organisms (46 tasks):** All 23 organisms × 2 platforms in parallel
4. **Wave 4 — Compositions (64 tasks):** All 32 compositions × 2 platforms in parallel
5. **Wave 5 — Models (11 tasks):** All 11 model translations on kotlin-implementer

### Worktree Protocol

When dispatching parallel agents:
1. Verify clean working tree: `git status --porcelain`
2. Create worktrees: `git worktree add .claude/worktrees/{task-id}/ -b task/{task-id}`
3. Pass worktree path in subagent prompt
4. Verify commits: `git -C {worktree} log main..HEAD`
5. Merge to main: `git merge --no-ff task/{task-id}`
6. Cleanup: `git worktree remove {worktree}` (only after successful merge)

### Resource Requirements

- **Agent capacity:** 2-4 kotlin-implementer, 2-4 swift-implementer
- **Token budget:** ~1M tokens per task (including context files)
- **Time estimate:** 0.5-1h per task = 200-400 agent-hours total
- **Calendar time:** 20-40 hours with sufficient parallel capacity

## Verification

### Evidence Gates

Run these commands to verify completion:

```bash
# 1. Archived tasks
ls _archived/*.md | wc -l  # Expected: 86

# 2. UI tasks generated
ls UI-*.md | wc -l  # Expected: 388

# 3. MDL tasks generated
ls MDL-*.md | wc -l  # Expected: 11

# 4. SPRINT.md updated
grep -q 'atomized' SPRINT.md && grep -q 'parallel' SPRINT.md

# 5. INDEX.md present
test -f INDEX.md && wc -l INDEX.md  # Expected: > 200

# 6. Template compliance
for f in UI-*.md MDL-*.md; do
  grep -q 'GOAL' "$f" && grep -q 'DELIVERABLE' "$f" || echo "Non-compliant: $f"
done
```

### Quality Sampling

Random sample of 10 tasks should score >= 80/115:
- [ ] References specific matrix file (10 pts)
- [ ] One component × one platform (15 pts)
- [ ] Effort S or M (10 pts)
- [ ] All required sections (40 pts)
- [ ] DEPENDENCIES populated (10 pts)
- [ ] READING LIST ≤ 5 files (10 pts)
- [ ] GUARDRAILS complete (20 pts)

---

**Index generated:** 2026-04-18
**Total tasks:** 399 (388 UI + 11 MDL)
**Atomized from:** 85 original tasks (archived in `_archived/`)
