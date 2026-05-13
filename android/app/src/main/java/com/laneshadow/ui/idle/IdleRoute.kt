package com.laneshadow.ui.idle

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
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
) {
    val viewModel: IdleViewModel = hiltViewModel()
    val uiState by viewModel.state.collectAsStateWithLifecycle()
    val capsuleState by viewModel.capsuleState.collectAsStateWithLifecycle()
    val lastKnownLocation by viewModel.lastKnownLocationFlow.collectAsStateWithLifecycle()
    val mapCameraController = remember { LSMapCameraController(initialZoom = 10.8) }

    // First-fix auto-recenter: when FusedLocationProvider yields its first real
    // fix, animate the map from the Bay Area fallback camera to the user puck.
    LaunchedEffect(lastKnownLocation) {
        if (lastKnownLocation != null) {
            mapCameraController.recenterToUserLocation()
        }
    }

    IdleScreen(
        state = uiState.toMockState(),
        capsuleState = capsuleState,
        inputValue = uiState.inputValue,
        mapCameraController = mapCameraController,
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
    )

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
