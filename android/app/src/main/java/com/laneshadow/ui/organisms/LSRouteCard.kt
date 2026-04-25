package com.laneshadow.ui.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.Annotation
import com.laneshadow.ui.atoms.AnnotationKind
import com.laneshadow.ui.atoms.CameraFit
import com.laneshadow.ui.atoms.CameraPosition
import com.laneshadow.ui.atoms.ColorToken
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.LSCard
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSMap
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.MapMode
import com.laneshadow.ui.atoms.PolylineData
import com.laneshadow.ui.atoms.SpacingToken
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.molecules.LSTagPill

// Private constants for hardcoded values
private val mapPreviewHeight = 160.dp

@Composable
fun LSRouteCard(
    route: RouteCardRoute,
    modifier: Modifier = Modifier,
    mapContent: @Composable () -> Unit = {
        DefaultRouteCardMap(route)
    },
) {
    val theme = LocalLaneShadowTheme.current

    LSCard(
        modifier = modifier,
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(theme.space.sm),
        ) {
            // Map preview
            Box(
                modifier = Modifier
                    .testTag("ls-map-preview")
                    .height(mapPreviewHeight)
            ) {
                mapContent()
            }

            // Title row
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                LSText(
                    text = route.title,
                    variant = TypographyVariant.Ui.Title.Md,
                    color = ContentColor.Primary,
                )

                if (route.isSaved) {
                    LSIcon(
                        name = IconName.HeartFill,
                        size = IconSize.Sm,
                        color = IconColor.Content(ContentColor.Primary),
                        contentDescription = "Saved route",
                    )
                }
            }

            // Subtitle row
            Row(
                horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
            ) {
                LSText(
                    text = route.distance,
                    variant = TypographyVariant.Instrument.Sm,
                    color = ContentColor.Secondary,
                )

                Spacer(Modifier.width(GeneratedTokens.sizing.stroke.sm))

                LSText(
                    text = route.estimatedTime,
                    variant = TypographyVariant.Instrument.Sm,
                    color = ContentColor.Secondary,
                )
            }

            // Difficulty tag
            LSText(
                text = route.difficulty.name,
                variant = TypographyVariant.Ui.Label.Md,
                color = ContentColor.Secondary,
            )
        }
    }
}

@Composable
private fun DefaultRouteCardMap(route: RouteCardRoute) {
    LSMap(
        mode = MapMode.Preview,
        camera = CameraPosition(
            center = route.polyline?.firstOrNull() ?: LatLng(37.7749, -122.4194),
            zoom = 12.0,
        ),
        cameraFit = CameraFit.Polyline(padding = SpacingToken.Spacing3),
        polylines = route.polyline?.let {
            listOf(
                PolylineData(
                    coordinates = it,
                    variant = route.variant,
                )
            )
        } ?: emptyList(),
        annotations = if (route.polyline != null && route.polyline.isNotEmpty()) {
            listOf(
                Annotation(
                    kind = AnnotationKind.Start,
                    coordinate = route.polyline.first(),
                ),
                Annotation(
                    kind = AnnotationKind.End,
                    coordinate = route.polyline.last(),
                ),
            )
        } else {
            emptyList()
        },
    )
}
