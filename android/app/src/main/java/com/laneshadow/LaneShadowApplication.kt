package com.laneshadow

import android.app.Application
import com.clerk.api.Clerk
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class LaneShadowApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.CLERK_PUBLISHABLE_KEY.isNotBlank()) {
            Clerk.initialize(this, publishableKey = BuildConfig.CLERK_PUBLISHABLE_KEY)
        }
    }
}
