package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

object Glyphs {
    object Default {
        val Add: ImageVector = glyph("add")
        val ArrowBack: ImageVector = glyph("arrowBack")
        val ArrowDropDown: ImageVector = glyph("arrowDropDown")
        val Close: ImageVector = glyph("close")
        val Create: ImageVector = glyph("create")
        val Delete: ImageVector = glyph("delete")
        val Email: ImageVector = glyph("email")
        val Favorite: ImageVector = glyph("favorite")
        val Home: ImageVector = glyph("home")
        val Info: ImageVector = glyph("info")
        val Menu: ImageVector = glyph("menu")
        val Person: ImageVector = glyph("person")
        val Search: ImageVector = glyph("search")
        val Settings: ImageVector = glyph("settings")
        val Star: ImageVector = glyph("star")
        val Warning: ImageVector = glyph("warning")
    }

    object Filled {
        val AccountCircle: ImageVector = glyph("accountCircle")
        val Add: ImageVector = glyph("add")
        val AddCircle: ImageVector = glyph("addCircle")
        val Call: ImageVector = glyph("call")
        val Check: ImageVector = glyph("check")
        val CheckCircle: ImageVector = glyph("checkCircle")
        val Clear: ImageVector = glyph("clear")
        val Close: ImageVector = glyph("close")
        val DateRange: ImageVector = glyph("dateRange")
        val Delete: ImageVector = glyph("delete")
        val Edit: ImageVector = glyph("edit")
        val Email: ImageVector = glyph("email")
        val Favorite: ImageVector = glyph("favorite")
        val Home: ImageVector = glyph("home")
        val Info: ImageVector = glyph("info")
        val LocationOn: ImageVector = glyph("locationOn")
        val Lock: ImageVector = glyph("lock")
        val Menu: ImageVector = glyph("menu")
        val MoreVert: ImageVector = glyph("moreVert")
        val Person: ImageVector = glyph("person")
        val Place: ImageVector = glyph("place")
        val PlayArrow: ImageVector = glyph("playArrow")
        val Refresh: ImageVector = glyph("refresh")
        val Search: ImageVector = glyph("search")
        val Send: ImageVector = glyph("send")
        val Settings: ImageVector = glyph("settings")
        val Share: ImageVector = glyph("share")
        val Star: ImageVector = glyph("star")
        val ThumbUp: ImageVector = glyph("thumbUp")
    }

    object AutoMirrored {
        object Filled {
            val ArrowBack: ImageVector = glyph("autoArrowBack")
            val KeyboardArrowLeft: ImageVector = glyph("keyboardArrowLeft")
            val KeyboardArrowRight: ImageVector = glyph("keyboardArrowRight")
            val List: ImageVector = glyph("list")
            val Send: ImageVector = glyph("autoSend")
        }
    }
}

private fun glyph(name: String): ImageVector =
    ImageVector.Builder(
        name = name,
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f,
    ).apply {
        path(
            fill = null,
            stroke = SolidColor(Color.Black),
            strokeLineWidth = 1.8f,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
        ) {
            moveTo(5f, 12f)
            lineTo(19f, 12f)
            moveTo(12f, 5f)
            lineTo(12f, 19f)
        }
    }.build()
