package com.laneshadow

import android.app.Application
import android.util.Log
import com.clerk.api.Clerk
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class LaneShadowApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        val publishableKey = BuildConfig.CLERK_PUBLISHABLE_KEY
        if (publishableKey.isBlank()) {
            return
        }

        try {
            Clerk.initialize(this, publishableKey = publishableKey)
        } catch (error: IllegalArgumentException) {
            Log.w(TAG, "Skipping Clerk initialization because CLERK_PUBLISHABLE_KEY is invalid.", error)
        }
    }

    private companion object {
        private const val TAG = "LaneShadowApplication"
    }
}
