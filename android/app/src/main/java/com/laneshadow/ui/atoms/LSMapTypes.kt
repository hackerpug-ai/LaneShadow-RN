package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.data.favorites.FavoriteLocation
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens

/**
 * Cross-platform map coordinate.
 */
data class LatLng(
    val lat: Double,
    val lon: Double,
)

/**
 * Token-gated color reference for RouteVariant.custom.
 * Never a raw hex color — always a design token path.
 */
data class ColorToken(
    val path: String,
)

/**
 * Stroke size token for polylines.
 */
enum class StrokeSize {
    Sm,
    Md,
    Lg,
}

/**
 * Spacing token for camera fit padding.
 */
enum class SpacingToken {
    Spacing3,
    Spacing4,
    Spacing5,
}

/**
 * Map camera position.
 */
data class CameraPosition(
    val center: LatLng,
    val zoom: Double,
    val pitch: Double? = null,
    val bearing: Double? = null,
)

/**
 * Annotation marker kind.
 */
enum class AnnotationKind {
    Start,
    End,
    Waypoint,
}

/**
 * Map annotation marker.
 */
data class Annotation(
    val kind: AnnotationKind,
    val coordinate: LatLng,
    val label: String? = null,
)

/**
 * Route variant for polyline styling.
 */
sealed class RouteVariant {
    data object Best : RouteVariant()
    data object Alt1 : RouteVariant()
    data object Alt2 : RouteVariant()
    data class Custom(val color: ColorToken) : RouteVariant()
}

/**
 * Polyline data for rendering route lines.
 *
 * @param coordinates List of map coordinates for the polyline path
 * @param variant Route variant (color scheme)
 * @param strokeWidth Stroke width size token
 * @param drawProgress Progress of path drawing animation (0f = none, 1f = full) - used for sketch animation
 */
data class PolylineData(
    val coordinates: List<LatLng>,
    val variant: RouteVariant,
    val strokeWidth: StrokeSize? = StrokeSize.Md,
    val drawProgress: Float = 1f,
)

/**
 * Map interaction mode.
 */
enum class MapMode {
    Preview,
    Interactive,
}

/**
 * Camera fit mode.
 */
sealed class CameraFit {
    data object Static : CameraFit()
    data class Polyline(val padding: SpacingToken) : CameraFit()
    data class Polylines(val padding: SpacingToken) : CameraFit()
}

/**
 * Map error states.
 */
enum class MapError {
    MissingToken,
    NetworkUnavailable,
    StyleLoadFailed,
}

internal const val LSMapCameraEaseDurationMs = 400

internal data class LSMapPolylineSpec(
    val coordinates: List<LatLng>,
    val color: Color,
    val strokeWidth: Dp,
    val drawProgress: Float = 1f,
)

internal data class LSMapAnnotationVisualSpec(
    val outerDiameter: Dp,
    val borderWidth: Dp = 0.dp,
    val innerDiameter: Dp? = null,
)

internal data class LSMapAnnotationSpec(
    val kind: AnnotationKind,
    val coordinate: LatLng,
    val color: Color,
    val visual: LSMapAnnotationVisualSpec,
    val label: String?,
)

internal data class LSMapCameraFitSpec(
    val kind: String,
    val padding: Dp?,
    val durationMs: Int?,
)

internal data class LSMapFallbackSpec(
    val error: MapError,
    val title: String,
    val message: String,
)

internal data class LSMapInteractionSpec(
    val gesturesEnabled: Boolean,
    val nestedScrollEnabled: Boolean,
)

internal data class LSMapFavoritePinSpec(
    val coordinate: LatLng,
    val fillColor: Color,
    val ringColor: Color,
    val label: String,
)

internal data class LSMapRenderModel(
    val camera: CameraPosition,
    val styleUri: String?,
    val shouldReloadStyle: Boolean,
    val interaction: LSMapInteractionSpec,
    val cameraFit: LSMapCameraFitSpec,
    val polylines: List<LSMapPolylineSpec>,
    val annotations: List<LSMapAnnotationSpec>,
    val fallback: LSMapFallbackSpec?,
)

internal fun resolveLSMapRenderModel(
    mode: MapMode,
    camera: CameraPosition,
    cameraFit: CameraFit = CameraFit.Static,
    polylines: List<PolylineData> = emptyList(),
    annotations: List<Annotation> = emptyList(),
    isDarkTheme: Boolean = false,
    hasAccessToken: Boolean = true,
    isNetworkAvailable: Boolean = true,
    previousStyleUri: String? = null,
): LSMapRenderModel {
    val interaction = resolveLSMapInteractionSpec(mode)
    val cameraFitSpec = resolveLSMapCameraFitSpec(cameraFit)

    val fallback =
        when {
            !hasAccessToken -> resolveLSMapFallbackSpec(MapError.MissingToken)
            !isNetworkAvailable -> resolveLSMapFallbackSpec(MapError.NetworkUnavailable)
            else -> null
        }

    if (fallback != null) {
        return LSMapRenderModel(
            camera = camera,
            styleUri = null,
            shouldReloadStyle = false,
            interaction = interaction,
            cameraFit = cameraFitSpec,
            polylines = emptyList(),
            annotations = emptyList(),
            fallback = fallback,
        )
    }

    val styleUri = resolveLSMapStyleUri(isDarkTheme)
    return LSMapRenderModel(
        camera = camera,
        styleUri = styleUri,
        shouldReloadStyle = previousStyleUri != null && previousStyleUri != styleUri,
        interaction = interaction,
        cameraFit = cameraFitSpec,
        polylines = polylines.map { resolveLSMapPolylineSpec(it, isDarkTheme) },
        annotations = annotations.map { resolveLSMapAnnotationSpec(it, isDarkTheme) },
        fallback = null,
    )
}

internal fun resolveLSMapPolylineSpec(
    polyline: PolylineData,
    isDarkTheme: Boolean,
): LSMapPolylineSpec =
    LSMapPolylineSpec(
        coordinates = polyline.coordinates,
        color = resolveLSMapRouteColor(polyline.variant, isDarkTheme),
        strokeWidth = resolveLSMapStrokeWidth(polyline.strokeWidth ?: StrokeSize.Md),
        drawProgress = polyline.drawProgress,
    )

internal fun resolveLSMapAnnotationSpec(
    annotation: Annotation,
    isDarkTheme: Boolean,
): LSMapAnnotationSpec =
    LSMapAnnotationSpec(
        kind = annotation.kind,
        coordinate = annotation.coordinate,
        color = resolveLSMapAnnotationColor(annotation.kind, isDarkTheme),
        visual = resolveLSMapAnnotationVisual(annotation.kind),
        label = annotation.label,
    )

internal fun resolveLSMapCameraFitSpec(cameraFit: CameraFit): LSMapCameraFitSpec =
    when (cameraFit) {
        CameraFit.Static ->
            LSMapCameraFitSpec(
                kind = "static",
                padding = null,
                durationMs = null,
            )

        is CameraFit.Polyline ->
            LSMapCameraFitSpec(
                kind = "polyline",
                padding = resolveLSMapSpacing(cameraFit.padding),
                durationMs = LSMapCameraEaseDurationMs,
            )

        is CameraFit.Polylines ->
            LSMapCameraFitSpec(
                kind = "polylines",
                padding = resolveLSMapSpacing(cameraFit.padding),
                durationMs = LSMapCameraEaseDurationMs,
            )
    }

internal fun resolveLSMapCameraPadding(cameraFit: CameraFit): Dp? =
    resolveLSMapCameraFitSpec(cameraFit).padding

internal fun resolveLSMapInteractionSpec(mode: MapMode): LSMapInteractionSpec =
    LSMapInteractionSpec(
        gesturesEnabled = mode == MapMode.Interactive,
        nestedScrollEnabled = true,
    )

internal fun resolveLSMapStyleUri(isDarkTheme: Boolean): String =
    if (isDarkTheme) {
        GeneratedTokens.map.style.dark
    } else {
        GeneratedTokens.map.style.light
    }

internal fun resolveLSMapFallbackSpec(error: MapError): LSMapFallbackSpec =
    when (error) {
        MapError.MissingToken ->
            LSMapFallbackSpec(
                error = error,
                title = "Map unavailable",
                message = "Mapbox access token is missing.",
            )

        MapError.NetworkUnavailable ->
            LSMapFallbackSpec(
                error = error,
                title = "Network unavailable",
                message = "A network connection is required to load the map.",
            )

        MapError.StyleLoadFailed ->
            LSMapFallbackSpec(
                error = error,
                title = "Map style unavailable",
                message = "The map style could not be loaded.",
            )
    }

private fun resolveLSMapRouteColor(
    variant: RouteVariant,
    isDarkTheme: Boolean,
): Color =
    when (variant) {
        RouteVariant.Best ->
            if (isDarkTheme) GeneratedTokens.color.Route.dark.best else GeneratedTokens.color.Route.best

        RouteVariant.Alt1 ->
            if (isDarkTheme) GeneratedTokens.color.Route.dark.alt1 else GeneratedTokens.color.Route.alt1

        RouteVariant.Alt2 ->
            if (isDarkTheme) GeneratedTokens.color.Route.dark.alt2 else GeneratedTokens.color.Route.alt2

        is RouteVariant.Custom -> resolveLSMapColorToken(variant.color, isDarkTheme)
    }

private fun resolveLSMapColorToken(
    token: ColorToken,
    isDarkTheme: Boolean,
): Color =
    when (token.path) {
        "color.route.best" ->
            if (isDarkTheme) GeneratedTokens.color.Route.dark.best else GeneratedTokens.color.Route.best

        "color.route.alt1" ->
            if (isDarkTheme) GeneratedTokens.color.Route.dark.alt1 else GeneratedTokens.color.Route.alt1

        "color.route.alt2" ->
            if (isDarkTheme) GeneratedTokens.color.Route.dark.alt2 else GeneratedTokens.color.Route.alt2

        else ->
            if (isDarkTheme) GeneratedTokens.color.Route.dark.best else GeneratedTokens.color.Route.best
    }

private fun resolveLSMapStrokeWidth(strokeSize: StrokeSize): Dp =
    when (strokeSize) {
        StrokeSize.Sm -> GeneratedTokens.sizing.stroke.sm
        StrokeSize.Md -> GeneratedTokens.sizing.stroke.md
        StrokeSize.Lg -> GeneratedTokens.sizing.stroke.lg
    }

private fun resolveLSMapAnnotationColor(
    kind: AnnotationKind,
    isDarkTheme: Boolean,
): Color =
    when (kind) {
        AnnotationKind.Start ->
            if (isDarkTheme) {
                GeneratedTokens.color.Status.dark.Success.default
            } else {
                GeneratedTokens.color.Status.Success.default
            }

        AnnotationKind.End ->
            if (isDarkTheme) GeneratedTokens.color.Status.dark.recording else GeneratedTokens.color.Status.recording

        AnnotationKind.Waypoint ->
            if (isDarkTheme) {
                GeneratedTokens.color.Status.dark.Info.default
            } else {
                GeneratedTokens.color.Status.Info.default
            }
    }

private fun resolveLSMapAnnotationVisual(kind: AnnotationKind): LSMapAnnotationVisualSpec =
    when (kind) {
        AnnotationKind.Start ->
            LSMapAnnotationVisualSpec(
                outerDiameter = 14.dp,
                borderWidth = 2.5.dp,
            )

        AnnotationKind.End ->
            LSMapAnnotationVisualSpec(
                outerDiameter = 18.dp,
                innerDiameter = 6.dp,
            )

        AnnotationKind.Waypoint ->
            LSMapAnnotationVisualSpec(
                outerDiameter = 12.dp,
            )
    }

private fun resolveLSMapSpacing(token: SpacingToken): Dp =
    when (token) {
        SpacingToken.Spacing3 -> 12.dp
        SpacingToken.Spacing4 -> 16.dp
        SpacingToken.Spacing5 -> 24.dp
    }

internal fun resolveLSMapFavoritePinSpecs(
    favorites: List<FavoriteLocation>,
    isDarkTheme: Boolean,
): List<LSMapFavoritePinSpec> =
    favorites.map { favorite ->
        LSMapFavoritePinSpec(
            coordinate = LatLng(favorite.lat, favorite.lon),
            fillColor = GeneratedTokens.color.Signal.default,
            ringColor = GeneratedTokens.color.Surface.card,
            label = favorite.label,
        )
    }
