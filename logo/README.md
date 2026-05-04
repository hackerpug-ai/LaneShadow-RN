# LaneShadow App Icon Pack

Generated from the no-grid route + shadow companion mark.

## Recommended Expo config

```json
{
  "expo": {
    "icon": "./assets/icons/laneshadow/expo/icon.png",
    "splash": {
      "image": "./assets/icons/laneshadow/expo/splash-icon.png",
      "backgroundColor": "#FDFBF8"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icons/laneshadow/expo/adaptive-icon-foreground.png",
        "backgroundColor": "#FDFBF8"
      }
    },
    "web": {
      "favicon": "./assets/icons/laneshadow/web/favicon.ico"
    }
  }
}
```

## Native iOS

Copy `ios/AppIcon.appiconset` into `ios/<YourApp>/Images.xcassets/` and select `AppIcon` as the app icon set in Xcode.

## Native Android

Copy the contents of `android/res/` into `android/app/src/main/res/`. This includes legacy launcher PNGs plus Android adaptive icon XML/assets.

## Web/PWA

Use `web/favicon.ico`, the PNG favicons, `apple-touch-icon.png`, and `site.webmanifest`.

## Contents

- `expo/` — Expo-ready icon, adaptive foreground/background, splash icon
- `ios/AppIcon.appiconset/` — complete iOS/iPadOS asset catalog including 1024 marketing icon
- `android/res/` — Android legacy + adaptive launcher assets
- `web/` — favicon, Apple touch icon, PWA manifest icons
- `source/` — editable 1024 sources, transparent mark, original generated reference
- `variants/` — light, dark, one-color, transparent adaptive preview

## Notes

- iOS/App Store PNGs are opaque and square, as required.
- The Android adaptive foreground is transparent and centered within the safe zone.
- The primary app icon uses the paper-cream background with the copper route and deep-ink companion shadow.
