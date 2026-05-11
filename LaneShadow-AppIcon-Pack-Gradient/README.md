# LaneShadow App Icon Pack — Gradient Version

This package preserves the copper-to-deep-ink gradient in the route/shadow mark. The primary app icon uses the warm paper-toned background, no grid overlay, and the gradient route + companion-shadow symbol.

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

Copy the contents of `android/res/` into `android/app/src/main/res/`. This includes legacy launcher PNGs and Android adaptive icon XML/assets.

## Web/PWA

Use `web/favicon.ico`, the PNG favicons, `apple-touch-icon.png`, and `site.webmanifest`.

## Contents

- `expo/` — Expo-ready icon, adaptive foreground/background, splash icon, optional dark icon
- `ios/AppIcon.appiconset/` — complete iOS/iPadOS asset catalog including 1024 marketing icon
- `android/res/` — Android legacy + adaptive launcher assets
- `web/` — favicon, Apple touch icon, PWA manifest icons
- `source/` — original references, extracted transparent gradient mark, 1024 source icons
- `variants/` — light/dark/one-color previews and transparent mark assets

## Design notes

- The grid overlay is intentionally removed.
- The route/shadow symbol keeps the gradient transition between copper and deep ink.
- The dark-mode preview uses a subtle warm keyline so the ink companion line remains visible on deep ink.
- iOS/App Store PNGs are opaque and square, as required.
- Android adaptive foreground is transparent and centered within the safe zone.
