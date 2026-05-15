package com.laneshadow.ui.idle

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.text.font.FontStyle
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.laneshadow.navigation.Route
import com.laneshadow.navigation.planningRoute
import com.laneshadow.sandbox.mockproviders.IdleScreenState
import com.laneshadow.sandbox.mockproviders.LocationContext
import com.laneshadow.sandbox.mockproviders.SuggestionChip as MockSuggestionChip
import com.laneshadow.ui.atoms.LSMapCameraController
import com.laneshadow.ui.molecules.AutocompleteRecommendation
import com.laneshadow.ui.templates.IdleScreen

@Composable
fun IdleRoute(
    navController: NavHostController,
    mapCameraController: LSMapCameraController? = null,
    skipMapRendering: Boolean = false,
) {
    val viewModel: IdleViewModel = hiltViewModel()
    val uiState by viewModel.state.collectAsStateWithLifecycle()
    val capsuleState by viewModel.capsuleState.collectAsStateWithLifecycle()
    val lastKnownLocation by viewModel.lastKnownLocationFlow.collectAsStateWithLifecycle()
    val localMapCameraController = mapCameraController ?: remember { LSMapCameraController(initialZoom = 10.8) }

    // First-fix auto-recenter: when FusedLocationProvider yields its first real
    // fix, animate the map from the Bay Area fallback camera to the user puck.
    LaunchedEffect(lastKnownLocation) {
        if (lastKnownLocation != null) {
            localMapCameraController.recenterToUserLocation()
        }
    }

    // When skipMapRendering is true (e.g., when called from MapApp), render only
    // the overlay content without mounting LSMapLayer. MapApp mounts the persistent
    // LSMapLayer + LSMap once.
    // Otherwise, render the full IdleScreen with map, overlays, and controls.
    if (skipMapRendering) {
        // Overlay-only rendering: render chat input directly without LSMapLayer
        val mockState = uiState.toMockState()
        com.laneshadow.ui.molecules.LSChatInput(
            value = uiState.inputValue,
            onValueChange = viewModel::onInputChange,
            placeholder = "Where should we ride?",
            onSend = viewModel::onSend,
            onCollapse = { viewModel.onInputChange("") },
            onFilter = { navController.navigate(Route.Sessions) },
            suggestions = mockState.suggestions.map { mockChip ->
                com.laneshadow.ui.molecules.SuggestionChip(label = mockChip.label)
            },
            autocompleteRecommendations = uiState.placeSuggestions.map { suggestion ->
                AutocompleteRecommendation(
                    id = suggestion.id,
                    title = suggestion.name,
                    supportingText = suggestion.label,
                    contentDescription = suggestion.label,
                )
            },
            autocompleteError = uiState.autocompleteError,
            onAutocompleteRecommendationTap = { recommendation ->
                uiState.placeSuggestions
                    .firstOrNull { it.id == recommendation.id }
                    ?.let(viewModel::onAutocompleteSuggestionTap)
            },
            onSuggestionTap = { uiChip ->
                val originalChip = mockState.suggestions.firstOrNull { it.label == uiChip.label }
                viewModel.onSuggestionTap(SuggestionChip(text = originalChip?.label ?: uiChip.label))
            },
            locationBadge = mockState.locationContext.let { mockCtx ->
                com.laneshadow.ui.molecules.LocationContext(
                    label = mockCtx.label,
                    mode = when (mockCtx.mode.lowercase()) {
                        "manual" -> com.laneshadow.ui.molecules.LocationMode.Manual
                        "auto" -> com.laneshadow.ui.molecules.LocationMode.Auto
                        else -> com.laneshadow.ui.molecules.LocationMode.Approximate
                    }
                )
            },
            onLocationModeChange = { mode ->
                viewModel.onLocationModeChange(mode.name.lowercase())
            },
            isAutocompleteLoading = uiState.isAutocompleteLoading,
            isEnabled = !mockState.isNoLocation,
            modifier = Modifier.testTag("chat-input"),
        )
    } else {
        // Full-screen rendering: IdleScreen with map, overlays, controls
        IdleScreen(
            state = uiState.toMockState(),
            capsuleState = capsuleState,
            inputValue = uiState.inputValue,
            mapCameraController = localMapCameraController,
            // Menu chip now opens an in-place leading drawer (parity with iOS).
            // The standalone Sessions route remains available via the chat-input
            // filter chip (`onFilter`) below until product decides whether to
            // retire it or keep both surfaces.
            onMenuTap = { /* drawer state owned by IdleScreen */ },
            onNewTap = { viewModel.startNewSession() },
            onSuggestionTap = { chip ->
                viewModel.onSuggestionTap(SuggestionChip(text = chip.label))
            },
            onSend = viewModel::onSend,
            onCollapse = { viewModel.onInputChange("") },
            onFilter = { navController.navigate(Route.Sessions) },
            onValueChange = viewModel::onInputChange,
            autocompleteRecommendations = uiState.placeSuggestions.map { suggestion ->
                AutocompleteRecommendation(
                    id = suggestion.id,
                    title = suggestion.name,
                    supportingText = suggestion.label,
                    contentDescription = suggestion.label,
                )
            },
            autocompleteError = uiState.autocompleteError,
            isAutocompleteLoading = uiState.isAutocompleteLoading,
            onAutocompleteRecommendationTap = { recommendation ->
                uiState.placeSuggestions
                    .firstOrNull { it.id == recommendation.id }
                    ?.let(viewModel::onAutocompleteSuggestionTap)
            },
            onLocationModeChange = viewModel::onLocationModeChange,
            mapContent = { screenState: IdleScreenState ->
                com.laneshadow.ui.atoms.LSMap(
                    mode = com.laneshadow.ui.atoms.MapMode.Interactive,
                    camera = com.laneshadow.ui.atoms.CameraPosition(
                        center = com.laneshadow.ui.atoms.LatLng(37.8104, -122.4752),
                        zoom = 10.8,
                    ),
                    favoriteLocations = screenState.favoriteLocations,
                    cameraController = localMapCameraController,
                    modifier = Modifier
                        .fillMaxSize()
                        .testTag("idlescreen-map"),
                )
            },
        )
    }

    LaunchedEffect(uiState.navigateTo) {
        when (val destination = uiState.navigateTo) {
            is IdleNavTarget.Planning -> {
                navController.navigate(planningRoute(destination.sessionId))
                viewModel.consumeNavigation()
            }
            null -> Unit
        }
    }
}

internal fun IdleUiState.toMockState(): IdleScreenState {
    val scopeWord = greetingScope.name.lowercase() // "today" or "tonight"
    val headline = buildAnnotatedString {
        append("Where are we riding ")
        withStyle(SpanStyle(fontStyle = FontStyle.Italic)) {
            append(scopeWord)
        }
        append(", $firstName?")
    }

    return IdleScreenState(
        greeting = IdleGreeting(
            meta = metaRow.ifBlank { greetingMeta },
            headline = headline,
            emphasis = scopeWord,
        ).toMockGreeting(),
        suggestions = if (showStaticSuggestions) {
            suggestions.mapIndexed { index, chip ->
                MockSuggestionChip(
                    id = "idle-chip-${index + 1}",
                    label = chip.text,
                )
            }
        } else {
            emptyList()
        },
        locationContext = LocationContext(
            label = locationLabel ?: "Tap to set start",
            mode = locationMode,
        ),
        showAdvisoryCard = showAdvisoryCard,
        advisoryMessage = advisoryMessage,
        isNoLocation = locationUnavailable || !isLocationEnabled,
        favoriteLocations = favoriteLocations,
    )
}
