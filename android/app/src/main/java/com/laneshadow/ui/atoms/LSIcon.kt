package com.laneshadow.ui.atoms

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName

val LSIconStrokeWidthKey = SemanticsPropertyKey<Dp>("LSIconStrokeWidth")
val LSIconColorKey = SemanticsPropertyKey<Color>("LSIconColor")
val LSIconNameKey = SemanticsPropertyKey<String>("LSIconName")

private var SemanticsPropertyReceiver.lsIconStrokeWidth by LSIconStrokeWidthKey
private var SemanticsPropertyReceiver.lsIconColor by LSIconColorKey
private var SemanticsPropertyReceiver.lsIconName by LSIconNameKey

@Composable
fun LSIcon(
    name: IconName,
    size: IconSize = IconSize.Md,
    color: IconColor = IconColor.Content(ContentColor.Primary),
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val resolvedSize = size.resolve(theme)
    val resolvedColor = color.resolve(theme)
    val paths = remember(name) { name.pathSpecs.map(IconPathSpec::parse) }

    Canvas(
        modifier = modifier
            .size(resolvedSize)
            .semantics {
                lsIconName = name.value
                lsIconStrokeWidth = theme.icon.stroke.width
                lsIconColor = resolvedColor
                contentDescription?.let { this.contentDescription = it }
            },
    ) {
        val scale = minOf(this.size.width, this.size.height) / IconViewportSize
        val strokeWidth = theme.icon.stroke.width.toPx()

        withTransform({
            scale(scaleX = scale, scaleY = scale)
        }) {
            paths.forEach { path ->
                if (path.fill) {
                    drawPath(
                        path = path.path,
                        color = resolvedColor,
                        style = Fill,
                    )
                }
                if (path.stroke) {
                    drawPath(
                        path = path.path,
                        color = resolvedColor,
                        style = Stroke(
                            width = strokeWidth,
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round,
                        ),
                    )
                }
            }
        }
    }
}

private const val IconViewportSize = 24f

private data class IconPathSpec(
    val pathData: String,
    val fill: Boolean,
    val stroke: Boolean,
) {
    fun parse(): ParsedIconPath =
        ParsedIconPath(
            path = PathParser().parsePathString(pathData).toPath(),
            fill = fill,
            stroke = stroke,
        )
}

private data class ParsedIconPath(
    val path: Path,
    val fill: Boolean,
    val stroke: Boolean,
)

private val IconName.pathSpecs: List<IconPathSpec>
    get() =
        when (this) {
            IconName.Bike -> listOf(
                IconPathSpec("M3 17.5 A2.5 2.5 0 1 0 8 17.5 A2.5 2.5 0 1 0 3 17.5", fill = false, stroke = true),
                IconPathSpec("M16 17.5 A2.5 2.5 0 1 0 21 17.5 A2.5 2.5 0 1 0 16 17.5", fill = false, stroke = true),
                IconPathSpec("M15 6H9L6 14h12l-2-7z", fill = false, stroke = true),
                IconPathSpec("M6 14H3l-.5 1.5", fill = false, stroke = true),
                IconPathSpec("M18 14h2l.5 1.5", fill = false, stroke = true),
            )
            IconName.Bookmark -> listOf(
                IconPathSpec("M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z", fill = false, stroke = true),
            )
            IconName.BookmarkFill -> listOf(
                IconPathSpec("M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z", fill = true, stroke = true),
            )
            IconName.ChevL -> listOf(
                IconPathSpec("M15 18 L9 12 L15 6", fill = false, stroke = true),
            )
            IconName.ChevR -> listOf(
                IconPathSpec("M9 18 L15 12 L9 6", fill = false, stroke = true),
            )
            IconName.Clock -> listOf(
                IconPathSpec("M2 12 A10 10 0 1 0 22 12 A10 10 0 1 0 2 12", fill = false, stroke = true),
                IconPathSpec("M12 6 L12 12 L16 14", fill = false, stroke = true),
            )
            IconName.Circle -> listOf(
                IconPathSpec("M4 12 A8 8 0 1 0 20 12 A8 8 0 1 0 4 12", fill = false, stroke = true),
            )
            IconName.CircleFill -> listOf(
                IconPathSpec("M4 12 A8 8 0 1 0 20 12 A8 8 0 1 0 4 12", fill = true, stroke = true),
            )
            IconName.Close -> listOf(
                IconPathSpec("M18 6 L6 18", fill = false, stroke = true),
                IconPathSpec("M6 6 L18 18", fill = false, stroke = true),
            )
            IconName.Collapse -> listOf(
                IconPathSpec("M4 14 L10 14 L10 20", fill = false, stroke = true),
                IconPathSpec("M20 10 L14 10 L14 4", fill = false, stroke = true),
                IconPathSpec("M10 14 L3 21", fill = false, stroke = true),
                IconPathSpec("M21 3 L14 10", fill = false, stroke = true),
            )
            IconName.Compass -> listOf(
                IconPathSpec("M2 12 A10 10 0 1 0 22 12 A10 10 0 1 0 2 12", fill = false, stroke = true),
                IconPathSpec("M16.24 7.76 L14.12 14.12 L7.76 16.24 L9.88 9.88 L16.24 7.76 Z", fill = false, stroke = true),
            )
            IconName.Edit -> listOf(
                IconPathSpec("M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", fill = false, stroke = true),
                IconPathSpec("M18.5 2.5a2.121 2.121 2 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z", fill = false, stroke = true),
            )
            IconName.Expand -> listOf(
                IconPathSpec("M15 3 L21 3 L21 9", fill = false, stroke = true),
                IconPathSpec("M9 21 L3 21 L3 15", fill = false, stroke = true),
                IconPathSpec("M21 3 L14 10", fill = false, stroke = true),
                IconPathSpec("M3 21 L10 14", fill = false, stroke = true),
            )
            IconName.Heart -> listOf(
                IconPathSpec("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill = false, stroke = true),
            )
            IconName.HeartFill -> listOf(
                IconPathSpec("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill = true, stroke = true),
            )
            IconName.Layers -> listOf(
                IconPathSpec("M12 2 L2 7 L12 12 L22 7 L12 2 Z", fill = false, stroke = true),
                IconPathSpec("M2 17 L12 22 L22 17", fill = false, stroke = true),
                IconPathSpec("M2 12 L12 17 L22 12", fill = false, stroke = true),
            )
            IconName.Map -> listOf(
                IconPathSpec("M1 6 L1 22 L8 18 L16 22 L23 18 L23 2 L16 6 L8 2 L1 6 Z", fill = false, stroke = true),
                IconPathSpec("M8 2 L8 18", fill = false, stroke = true),
                IconPathSpec("M16 6 L16 22", fill = false, stroke = true),
            )
            IconName.Menu -> listOf(
                IconPathSpec("M3 6 L21 6", fill = false, stroke = true),
                IconPathSpec("M3 12 L21 12", fill = false, stroke = true),
                IconPathSpec("M3 18 L21 18", fill = false, stroke = true),
            )
            IconName.Pin -> listOf(
                // Lucide map-pin inset 1 unit on each side of the 24-unit viewBox so
                // the stroke fits inside the canvas at small (16dp) sizes — original
                // path occupied x:3-21 y:1-23 (no stroke margin) and clipped at the
                // tip and crown, making the pin look "collapsed" at small sizes.
                IconPathSpec("M20 10C20 16.3 12 22 12 22C12 22 4 16.3 4 10A8 8 0 0 1 20 10Z", fill = false, stroke = true),
                IconPathSpec("M9.5 10 A2.5 2.5 0 1 0 14.5 10 A2.5 2.5 0 1 0 9.5 10", fill = false, stroke = true),
            )
            IconName.Plus -> listOf(
                IconPathSpec("M12 5 L12 19", fill = false, stroke = true),
                IconPathSpec("M5 12 L19 12", fill = false, stroke = true),
            )
            IconName.Minus -> listOf(
                IconPathSpec("M5 12 L19 12", fill = false, stroke = true),
            )
            IconName.Rain -> listOf(
                IconPathSpec("M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25", fill = false, stroke = true),
                IconPathSpec("M8 19 L8 21", fill = false, stroke = true),
                IconPathSpec("M12 21 L12 23", fill = false, stroke = true),
                IconPathSpec("M16 19 L16 21", fill = false, stroke = true),
            )
            IconName.Route -> listOf(
                IconPathSpec("M3 17l4-8 4 4 4-6 4 10", fill = false, stroke = true),
            )
            IconName.Send -> listOf(
                IconPathSpec("M22 2 L11 13", fill = false, stroke = true),
                IconPathSpec("M22 2 L15 22 L11 13 L2 9 L22 2 Z", fill = false, stroke = true),
            )
            IconName.Share -> listOf(
                IconPathSpec("M15 5 A3 3 0 1 0 21 5 A3 3 0 1 0 15 5", fill = false, stroke = true),
                IconPathSpec("M3 12 A3 3 0 1 0 9 12 A3 3 0 1 0 3 12", fill = false, stroke = true),
                IconPathSpec("M15 19 A3 3 0 1 0 21 19 A3 3 0 1 0 15 19", fill = false, stroke = true),
                IconPathSpec("M8.59 13.51 L15.42 17.49", fill = false, stroke = true),
                IconPathSpec("M15.41 6.51 L8.59 10.49", fill = false, stroke = true),
            )
            IconName.Sliders -> listOf(
                IconPathSpec("M4 6 L20 6", fill = false, stroke = true),
                IconPathSpec("M4 12 L20 12", fill = false, stroke = true),
                IconPathSpec("M4 18 L20 18", fill = false, stroke = true),
                IconPathSpec("M6 6 A2 2 0 1 0 10 6 A2 2 0 1 0 6 6", fill = true, stroke = false),
                IconPathSpec("M14 12 A2 2 0 1 0 18 12 A2 2 0 1 0 14 12", fill = true, stroke = false),
                IconPathSpec("M8 18 A2 2 0 1 0 12 18 A2 2 0 1 0 8 18", fill = true, stroke = false),
            )
            IconName.Sparkle -> listOf(
                IconPathSpec("M12 3L13.5 8.5L19 8.5L14.75 11.5L16.5 17L12 14L7.5 17L9.25 11.5L5 8.5L10.5 8.5Z", fill = false, stroke = true),
            )
            IconName.Star -> listOf(
                IconPathSpec("M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2 Z", fill = false, stroke = true),
            )
            IconName.StarFill -> listOf(
                IconPathSpec("M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2 Z", fill = true, stroke = true),
            )
            IconName.Storm -> listOf(
                IconPathSpec("M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9", fill = false, stroke = true),
                IconPathSpec("M13 11 L9 17 L15 17 L11 23", fill = false, stroke = true),
            )
            IconName.Sun -> listOf(
                IconPathSpec("M7 12 A5 5 0 1 0 17 12 A5 5 0 1 0 7 12", fill = false, stroke = true),
                IconPathSpec("M12 1 L12 3", fill = false, stroke = true),
                IconPathSpec("M12 21 L12 23", fill = false, stroke = true),
                IconPathSpec("M4.22 4.22 L5.64 5.64", fill = false, stroke = true),
                IconPathSpec("M18.36 18.36 L19.78 19.78", fill = false, stroke = true),
                IconPathSpec("M1 12 L3 12", fill = false, stroke = true),
                IconPathSpec("M21 12 L23 12", fill = false, stroke = true),
                IconPathSpec("M4.22 19.78 L5.64 18.36", fill = false, stroke = true),
                IconPathSpec("M18.36 5.64 L19.78 4.22", fill = false, stroke = true),
            )
            IconName.Therm -> listOf(
                IconPathSpec("M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z", fill = false, stroke = true),
            )
            IconName.Trash -> listOf(
                IconPathSpec("M3 6 L5 6 L21 6", fill = false, stroke = true),
                IconPathSpec("M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", fill = false, stroke = true),
            )
            IconName.Wind -> listOf(
                IconPathSpec("M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2", fill = false, stroke = true),
            )
        }
