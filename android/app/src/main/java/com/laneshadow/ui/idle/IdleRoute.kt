package com.laneshadow.ui.idle

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
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
import com.laneshadow.ui.templates.IdleScreen

@Composable
fun IdleRoute(
    navController: NavHostController,
) {
    val viewModel: IdleViewModel = hiltViewModel()
    val uiState by viewModel.state.collectAsStateWithLifecycle()

    IdleScreen(
        state = uiState.toMockState(),
        onMenuTap = { navController.navigate(Route.Sessions) },
        onSuggestionTap = { chip ->
            viewModel.onSuggestionTap(SuggestionChip(text = chip.label))
        },
        onSend = viewModel::onSend,
        onCollapse = { viewModel.onInputChange("") },
        onFilter = { navController.navigate(Route.Sessions) },
        onValueChange = viewModel::onInputChange,
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
        suggestions = suggestions.mapIndexed { index, chip ->
            MockSuggestionChip(
                id = "idle-chip-${index + 1}",
                label = chip.text,
            )
        },
        locationContext = LocationContext(
            label = locationLabel ?: "Near Santa Cruz, CA",
            mode = locationMode,
        ),
    )
}
