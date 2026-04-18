package com.laneshadow.sandbox.stories

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object AppStories {
    val all: List<Story> = listOf(
        Story(
            id = "atoms.hello.world",
            tier = ComponentTier.Atom,
            component = "HelloWorld",
            name = "Hello World",
            summary = "Your first sandbox story.",
        ) {
            Text("Hello from App!")
        }
    )
}
