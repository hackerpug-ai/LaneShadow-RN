package com.laneshadow.ui.idle

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.withStyle
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.favorites.FavoritesRepository
import com.laneshadow.data.location.LocationCoordinate
import com.laneshadow.data.location.LocationRepository
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.data.user.UserRepository
import com.laneshadow.data.weather.WeatherRepository
import com.laneshadow.data.weather.WeatherSeverity
import com.laneshadow.services.ConvexClientProvider
import com.laneshadow.services.PlaceAutocompleteProximity
import com.laneshadow.services.PlaceSuggestionResult
import com.laneshadow.services.SelectedPlaceResult
import com.laneshadow.ui.molecules.CapsuleState
import com.laneshadow.ui.molecules.IdleScope
import dagger.hilt.android.lifecycle.HiltViewModel
import java.time.DayOfWeek
import java.time.LocalTime
import java.util.UUID
import javax.inject.Inject
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@HiltViewModel
class IdleViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val sessionRepository: SessionRepository,
    private val chatRepository: ChatRepository,
    private val weatherRepository: WeatherRepository,
    private val favoritesRepository: FavoritesRepository,
    private val locationRepository: LocationRepository,
    private val convexClientProvider: ConvexClientProvider,
) : ViewModel() {
    internal constructor(
        userRepository: UserRepository,
        sessionRepository: SessionRepository,
        chatRepository: ChatRepository,
        weatherRepository: WeatherRepository,
        favoritesRepository: FavoritesRepository,
        locationRepository: LocationRepository,
        convexClientProvider: ConvexClientProvider,
        timeProvider: () -> LocalTime = { LocalTime.now() },
        autocompleteDebounceMs: Long = 300L,
        autocompleteDispatcher: CoroutineDispatcher = Dispatchers.Main,
    ) : this(
        userRepository = userRepository,
        sessionRepository = sessionRepository,
        chatRepository = chatRepository,
        weatherRepository = weatherRepository,
        favoritesRepository = favoritesRepository,
        locationRepository = locationRepository,
        convexClientProvider = convexClientProvider,
    ) {
        this.timeProvider = timeProvider
        this.autocompleteDebounceMs = autocompleteDebounceMs
        this.autocompleteDispatcher = autocompleteDispatcher
    }

    private val _state = MutableStateFlow(IdleUiState())
    val state: StateFlow<IdleUiState> = _state.asStateFlow()

    private val _capsuleState = MutableStateFlow<CapsuleState>(
        CapsuleState.Idle(
            scope = IdleScope.TODAY,
            headline = "Where are we riding today?",
            emphasizedWord = "today",
            metaItems = emptyList(),
            isWarning = false,
        )
    )
    val capsuleState: StateFlow<CapsuleState> = _capsuleState.asStateFlow()

    private var timeProvider: () -> LocalTime = { LocalTime.now() }
    private var autocompleteDebounceMs: Long = 300L
    private var autocompleteDispatcher: CoroutineDispatcher = Dispatchers.Main
    private var autocompleteJob: Job? = null
    private var autocompleteSessionToken: String? = null
    private var latestAutocompleteRequestId: Long = 0L
    private var lastKnownLocation: LocationCoordinate? = null

    init {
        observeCurrentUser()
        observeSessions()
        observeWeather()
        observeFavorites()
        observeLocation()
        observeCapsuleState()
    }

    fun onInputChange(value: String) {
        val trimmedValue = value.trim()
        _state.update { current ->
            current.copy(
                inputValue = value,
                errorToast = null,
                navigateTo = null,
                selectedPlace = null,
            )
        }

        if (trimmedValue.length < MinimumAutocompleteQueryLength) {
            resetAutocompleteToStaticSuggestions()
            return
        }

        scheduleAutocomplete(trimmedValue)
    }

    fun onSuggestionTap(suggestion: SuggestionChip) {
        resetAutocompleteToStaticSuggestions()
        _state.update { current ->
            current.copy(
                inputValue = suggestion.text,
                errorToast = null,
                navigateTo = null,
            )
        }
    }

    fun onAutocompleteSuggestionTap(suggestion: IdlePlaceSuggestion) {
        autocompleteJob?.cancel()
        val sessionToken = ensureAutocompleteSessionToken()

        viewModelScope.launch {
            val retrieveResult = convexClientProvider.retrievePlace(
                mapboxId = suggestion.id,
                sessionToken = sessionToken,
            )

            retrieveResult
                .onSuccess { selectedPlace ->
                    _state.update { current ->
                        current.copy(
                            inputValue = selectedPlace.label,
                            placeSuggestions = emptyList(),
                            selectedPlace = selectedPlace.toUiState(),
                            autocompleteError = null,
                            isAutocompleteLoading = false,
                            showStaticSuggestions = false,
                            navigateTo = null,
                        )
                    }
                }
                .onFailure { error ->
                    _state.update { current ->
                        current.copy(
                            autocompleteError = error.message ?: "Unable to load that place right now.",
                            isAutocompleteLoading = false,
                            navigateTo = null,
                        )
                    }
                }
        }
    }

    fun onLocationModeChange(mode: String) {
        _state.update { current ->
            current.copy(locationMode = mode)
        }
        if (mode == "auto") {
            observeLocation()
        }
    }

    fun onSend(content: String) {
        if (content.isBlank()) {
            return
        }

        viewModelScope.launch {
            val createResult = sessionRepository.createSession(content)
            if (createResult.isFailure) {
                _state.update { current ->
                    current.copy(
                        errorToast = createResult.exceptionOrNull()?.message
                            ?: "Unable to start planning.",
                        navigateTo = null,
                    )
                }
                return@launch
            }

            val sessionId = createResult.getOrThrow()
            val sendResult = chatRepository.sendMessage(sessionId, content)
            if (sendResult.isFailure) {
                _state.update { current ->
                    current.copy(
                        errorToast = sendResult.exceptionOrNull()?.message
                            ?: "Unable to send planning request.",
                        navigateTo = null,
                    )
                }
                return@launch
            }

            _state.update { current ->
                current.copy(
                    inputValue = "",
                    errorToast = null,
                    navigateTo = IdleNavTarget.Planning(sessionId),
                )
            }
        }
    }

    fun consumeNavigation() {
        _state.update { current ->
            current.copy(navigateTo = null)
        }
    }

    fun consumeErrorToast() {
        _state.update { current ->
            current.copy(errorToast = null)
        }
    }

    private fun observeCurrentUser() {
        viewModelScope.launch {
            userRepository.subscribeToCurrentUser()
                .catch { error ->
                    _state.update { current ->
                        current.copy(
                            isLoading = false,
                            subscriptionError = error.message ?: "Unable to load rider profile.",
                        )
                    }
                }
                .collect { user ->
                    val displayName = user?.displayName?.takeIf { it.isNotBlank() } ?: "Rider"
                    val firstName = extractFirstName(displayName)
                    val currentHour = timeProvider().hour
                    val scope = computeGreetingScope(currentHour)
                    val timeOfDay = timeOfDayLabel(currentHour)
                    _state.update { current ->
                        current.copy(
                            firstName = firstName,
                            greetingScope = scope,
                            greeting = buildGreeting(timeOfDay, displayName),
                            greetingMeta = "READY TO RIDE",
                            greetingEmphasis = displayName,
                            isLoading = false,
                        )
                    }
                }
        }
    }

    private fun observeSessions() {
        viewModelScope.launch {
            sessionRepository.subscribeToSessions()
                .catch { error ->
                    _state.update { current ->
                        current.copy(
                            isLoading = false,
                            subscriptionError = error.message ?: "Unable to load recent sessions.",
                        )
                    }
                }
                .collect { sessions ->
                    _state.update { current ->
                        current.copy(
                            recentSessions = sessions,
                        )
                    }
                }
        }
    }

    private fun observeWeather() {
        viewModelScope.launch {
            weatherRepository.subscribeToCurrentWeather()
                .catch { error ->
                    _state.update { current ->
                        current.copy(
                            isLoading = false,
                            subscriptionError = error.message ?: "Unable to load weather data.",
                        )
                    }
                }
                .collect { weather ->
                    val metaRow = weather?.let { buildMetaRow(it) } ?: ""
                    val showAdvisory = weather?.severity == com.laneshadow.data.weather.WeatherSeverity.ADVISORY
                    _state.update { current ->
                        current.copy(
                            weatherSummary = weather,
                            metaRow = metaRow,
                            showAdvisoryCard = showAdvisory,
                            advisoryMessage = if (showAdvisory) "Weather advisory in effect" else null,
                        )
                    }
                }
        }
    }

    private fun observeFavorites() {
        viewModelScope.launch {
            favoritesRepository.subscribeToFavoriteLocations()
                .catch { error ->
                    _state.update { current ->
                        current.copy(
                            isLoading = false,
                            subscriptionError = error.message ?: "Unable to load favorite locations.",
                        )
                    }
                }
                .collect { favorites ->
                    _state.update { current ->
                        current.copy(
                            favoriteLocations = favorites,
                        )
                    }
                }
        }
    }

    private fun observeLocation() {
        viewModelScope.launch {
            val locationResult = locationRepository.getCurrentLocation()
            if (locationResult.isFailure) {
                _state.update { current ->
                    current.copy(
                        isLoading = false,
                        subscriptionError = "Unable to get current location.",
                        locationUnavailable = true,
                        isLocationEnabled = false,
                    )
                }
                return@launch
            }

            val location: LocationCoordinate = locationResult.getOrThrow()
            lastKnownLocation = location
            val geocodeResult = convexClientProvider.reverseGeocode(
                location.latitude,
                location.longitude,
            )
            if (geocodeResult.isFailure) {
                _state.update { current ->
                    current.copy(
                        isLoading = false,
                        subscriptionError = "Unable to resolve location.",
                        locationLabel = null,
                        locationUnavailable = true,
                        isLocationEnabled = false,
                    )
                }
                return@launch
            }

            val geocode = geocodeResult.getOrThrow()
            _state.update { current ->
                current.copy(
                    locationLabel = geocode.label,
                    locationMode = "auto",
                    isLocationEnabled = true,
                    locationUnavailable = false,
                    subscriptionError = current.subscriptionError
                        ?.takeUnless { it == "Unable to resolve location." || it == "Unable to get current location." },
                    isLoading = false,
                )
            }
        }
    }

    private fun observeCapsuleState() {
        viewModelScope.launch {
            state.collect { uiState ->
                _capsuleState.update { deriveCapsuleState(uiState) }
            }
        }
    }

    private fun deriveCapsuleState(state: IdleUiState): CapsuleState {
        val scopeWord = state.greetingScope.name.lowercase() // "today" or "tonight"
        val firstName = state.firstName.ifBlank { "Rider" }
        val metaItems = state.metaRow
            .split(" · ")
            .filter { it.isNotBlank() }

        val isWarning = state.weatherSummary?.severity == WeatherSeverity.ADVISORY

        val headline = buildAnnotatedString {
            append("Where are we riding ")
            withStyle(SpanStyle(fontStyle = FontStyle.Italic)) {
                append(scopeWord)
            }
            append(", $firstName?")
        }

        return CapsuleState.Idle(
            scope = if (state.greetingScope == GreetingScope.TONIGHT) IdleScope.TONIGHT else IdleScope.TODAY,
            headline = headline.text,
            emphasizedWord = scopeWord,
            metaItems = metaItems,
            isWarning = isWarning,
        )
    }

    private fun scheduleAutocomplete(query: String) {
        autocompleteJob?.cancel()
        val requestId = ++latestAutocompleteRequestId
        val proximity = lastKnownLocation?.toAutocompleteProximity()
        val sessionToken = ensureAutocompleteSessionToken()

        _state.update { current ->
            current.copy(
                showStaticSuggestions = false,
                placeSuggestions = emptyList(),
                autocompleteError = null,
                isAutocompleteLoading = true,
            )
        }

        autocompleteJob = viewModelScope.launch(autocompleteDispatcher) {
            delay(autocompleteDebounceMs)

            val suggestionsResult = convexClientProvider.suggestPlaces(
                query = query,
                proximity = proximity,
                sessionToken = sessionToken,
            )

            if (requestId != latestAutocompleteRequestId || _state.value.inputValue.trim() != query) {
                return@launch
            }

            suggestionsResult
                .onSuccess { suggestions ->
                    _state.update { current ->
                        current.copy(
                            placeSuggestions = suggestions
                                .take(MaxAutocompleteSuggestions)
                                .map { it.toUiState() },
                            autocompleteError = null,
                            isAutocompleteLoading = false,
                            showStaticSuggestions = false,
                        )
                    }
                }
                .onFailure { error ->
                    _state.update { current ->
                        current.copy(
                            placeSuggestions = emptyList(),
                            autocompleteError = error.message ?: "Autocomplete unavailable.",
                            isAutocompleteLoading = false,
                            showStaticSuggestions = false,
                        )
                    }
                }
        }
    }

    private fun resetAutocompleteToStaticSuggestions() {
        autocompleteJob?.cancel()
        latestAutocompleteRequestId++
        autocompleteSessionToken = null
        _state.update { current ->
            current.copy(
                placeSuggestions = emptyList(),
                autocompleteError = null,
                isAutocompleteLoading = false,
                showStaticSuggestions = true,
            )
        }
    }

    private fun ensureAutocompleteSessionToken(): String {
        return autocompleteSessionToken ?: UUID.randomUUID().toString().also {
            autocompleteSessionToken = it
        }
    }

    private fun extractFirstName(displayName: String): String {
        if (displayName.isBlank()) return "Rider"
        return displayName.split_whitespace().firstOrNull { it.isNotBlank() } ?: "Rider"
    }

    private fun computeGreetingScope(hour: Int): GreetingScope {
        return if (hour in 18..23 || hour in 0..4) {
            GreetingScope.TONIGHT
        } else {
            GreetingScope.TODAY
        }
    }

    private fun buildMetaRow(weather: com.laneshadow.data.weather.WeatherSummary): String {
        val day = weather.dayOfWeek.name // FRIDAY, MONDAY, etc.
        val temp = weather.tempFahrenheit.toInt()
        val condition = weather.conditionLabel.uppercase()
        return "$day · $temp°F · $condition"
    }

    private fun LocationCoordinate.toAutocompleteProximity(): PlaceAutocompleteProximity =
        PlaceAutocompleteProximity(
            lat = latitude,
            lng = longitude,
        )

    private fun PlaceSuggestionResult.toUiState(): IdlePlaceSuggestion =
        IdlePlaceSuggestion(
            id = id,
            name = name,
            label = label,
            secondaryText = secondaryText,
            featureType = featureType,
            distanceMeters = distanceMeters,
        )

    private fun SelectedPlaceResult.toUiState(): IdleSelectedPlace =
        IdleSelectedPlace(
            id = id,
            name = name,
            label = label,
            lat = lat,
            lng = lng,
            featureType = featureType,
        )

    private companion object {
        const val MinimumAutocompleteQueryLength = 2
        const val MaxAutocompleteSuggestions = 3
    }
}

private fun String.split_whitespace(): List<String> = this.split(Regex("\\s+"))
