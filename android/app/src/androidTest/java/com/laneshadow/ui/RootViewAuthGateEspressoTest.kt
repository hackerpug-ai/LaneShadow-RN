package com.laneshadow.ui

import android.view.View
import androidx.test.core.app.ActivityScenario
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.isRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.MainActivity
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class RootViewAuthGateEspressoTest {
    @Test
    fun unauthenticatedLaunchHostsAuthGateActivityContent() {
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        try {
            onView(isRoot()).check(matches(isDisplayed()))

            scenario.onActivity { activity ->
                val content = activity.findViewById<View>(android.R.id.content)
                assertTrue(content.isShown)
                assertEquals("LaneShadow", activity.title.toString())
            }
        } finally {
            scenario.close()
        }
    }
}
