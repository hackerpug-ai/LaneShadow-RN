package com.laneshadow.ui.atoms

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import com.laneshadow.R
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

    Image(
        painter = painterResource(id = name.drawableRes),
        contentDescription = contentDescription,
        contentScale = ContentScale.Fit,
        colorFilter = ColorFilter.tint(resolvedColor),
        modifier = modifier
            .size(resolvedSize)
            .semantics {
                lsIconName = name.value
                lsIconStrokeWidth = theme.icon.stroke.width
                lsIconColor = resolvedColor
            },
    )
}

@get:DrawableRes
private val IconName.drawableRes: Int
    get() =
        when (this) {
            IconName.Bike -> R.drawable.ic_bike
            IconName.Bookmark -> R.drawable.ic_bookmark
            IconName.BookmarkFill -> R.drawable.ic_bookmark_fill
            IconName.ChevL -> R.drawable.ic_chev_l
            IconName.ChevR -> R.drawable.ic_chev_r
            IconName.Clock -> R.drawable.ic_clock
            IconName.Close -> R.drawable.ic_close
            IconName.Collapse -> R.drawable.ic_collapse
            IconName.Compass -> R.drawable.ic_compass
            IconName.Edit -> R.drawable.ic_edit
            IconName.Expand -> R.drawable.ic_expand
            IconName.Heart -> R.drawable.ic_heart
            IconName.HeartFill -> R.drawable.ic_heart_fill
            IconName.Layers -> R.drawable.ic_layers
            IconName.Map -> R.drawable.ic_map
            IconName.Menu -> R.drawable.ic_menu
            IconName.Pin -> R.drawable.ic_pin
            IconName.Plus -> R.drawable.ic_plus
            IconName.Rain -> R.drawable.ic_rain
            IconName.Route -> R.drawable.ic_route
            IconName.Send -> R.drawable.ic_send
            IconName.Share -> R.drawable.ic_share
            IconName.Sliders -> R.drawable.ic_sliders
            IconName.Sparkle -> R.drawable.ic_sparkle
            IconName.Star -> R.drawable.ic_star
            IconName.StarFill -> R.drawable.ic_star_fill
            IconName.Storm -> R.drawable.ic_storm
            IconName.Sun -> R.drawable.ic_sun
            IconName.Therm -> R.drawable.ic_therm
            IconName.Trash -> R.drawable.ic_trash
            IconName.Wind -> R.drawable.ic_wind
        }
