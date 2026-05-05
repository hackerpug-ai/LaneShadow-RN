package com.laneshadow.ui.idle

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.favorites.FavoritesRepository
import com.laneshadow.data.location.LocationCoordinate
import com.laneshadow.data.location.LocationRepository
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.data.user.UserRepository
import com.laneshadow.data.weather.WeatherRepository
import com.laneshadow.services.ConvexClientProvider
import dagger.hilt.android.lifecycle.HiltViewModel
import java.time.DayOfWeek
import java.time.LocalTime
import javax.inject.Inject
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
    private val timeProvider: () -> LocalTime = { LocalTime.now() },
) : ViewModel() {
    private val _state = MutableStateFlow(IdleUiState())
    val state: StateFlow<IdleUiState> = _state.asStateFlow()

    init {
        observeCurrentUser()
        observeSessions()
        observeWeather()
        observeFavorites()
        observeLocation()
    }

    fun onInputChange(value: String) {
        _state.update { current ->
            current.copy(
                inputValue = value,
                errorToast = null,
            )
        }
    }

    fun onSuggestionTap(suggestion: SuggestionChip) {
        onInputChange(suggestion.text)
        onSend(suggestion.text)
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
            // Get current location
            val locationResult = locationRepository.getCurrentLocation()
            if (locationResult.isFailure) {
                _state.update { current ->
                    current.copy(
                        isLoading = false,
                        subscriptionError = "Unable to get current location.",
                    )
                }
                return@launch
            }

            val location: LocationCoordinate = locationResult.getOrThrow()

            // Reverse geocode to get place name
            val geocodeResult = convexClientProvider.reverseGeocode(
                location.latitude,
                location.longitude,
            )
            if (geocodeResult.isFailure) {
                _state.update { current ->
                    current.copy(
                        isLoading = false,
                        subscriptionError = "Unable to resolve location.",
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
                    isLoading = false,
                )
            }
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
}

private fun String.split_whitespace(): List<String> = this.split(Regex("\\s+"))
