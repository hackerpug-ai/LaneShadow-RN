package com.laneshadow.ui.atoms

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.laneshadow.theme.LocalLaneShadowTheme

val LSAvatarSizeKey = SemanticsPropertyKey<Float>("LSAvatarSize")
val LSAvatarHasImageKey = SemanticsPropertyKey<Boolean>("LSAvatarHasImage")
val LSAvatarShapeKey = SemanticsPropertyKey<String>("LSAvatarShape")
val LSAvatarBackgroundColorKey = SemanticsPropertyKey<Color>("LSAvatarBackgroundColor")

private var SemanticsPropertyReceiver.lsAvatarSize by LSAvatarSizeKey
private var SemanticsPropertyReceiver.lsAvatarHasImage by LSAvatarHasImageKey
private var SemanticsPropertyReceiver.lsAvatarShape by LSAvatarShapeKey
private var SemanticsPropertyReceiver.lsAvatarBackgroundColor by LSAvatarBackgroundColorKey

@Composable
fun LSAvatar(
    image: Painter? = null,
    initials: String? = null,
    size: AvatarSize = AvatarSize.Md,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val resolvedSize = size.resolve(theme)
    val backgroundColor = theme.colors.card.default
    val accessibilityLabel = initials?.takeIf { it.isNotBlank() } ?: "Avatar"

    Box(
        modifier = modifier
            .size(resolvedSize)
            .clip(CircleShape)
            .background(backgroundColor)
            .semantics(mergeDescendants = true) {
                lsAvatarSize = resolvedSize.value
                lsAvatarHasImage = image != null
                lsAvatarShape = CircleShape.javaClass.simpleName
                lsAvatarBackgroundColor = backgroundColor
                contentDescription = accessibilityLabel
            },
        contentAlignment = Alignment.Center,
    ) {
        when {
            image != null -> {
                Image(
                    painter = image,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                )
            }
            !initials.isNullOrBlank() -> {
                LSText(
                    text = initials,
                    variant = size.initialsVariant(),
                    color = ContentColor.Primary,
                )
            }
        }
    }
}
