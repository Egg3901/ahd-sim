# Mobile builds

Margin of Victory uses the existing Tauri 2 shell for desktop, Android, and
iOS. The simulation and interface remain shared with the web edition.

## Android

The Android Studio project under `src-tauri/gen/android` is generated and can
be built on Linux. Set `ANDROID_HOME` and `NDK_HOME` to installed SDK and NDK
directories, then run:

```text
npm run tauri:android:build
```

The Android build uses Vite mode `android`. That mode disables every external
Lakeside store link and checkout action. Google Play Billing and purchase
restoration are not implemented yet. The free base app may be tested, but pack
sales must not launch until the adapter is complete and tested with Play
Console products.

## iOS

The shared Rust and web code supports Tauri's iOS target, but generating,
building, signing, and testing the Xcode project requires macOS with Xcode.
Run `npm run tauri:ios:init` on that host, then `npm run tauri:ios:build`.

The iOS build uses Vite mode `ios`, which removes external checkout. StoreKit
purchase and restoration are not implemented. They must be tested through
StoreKit Testing and TestFlight before release.

## Release gates

- No external web checkout appears in Android or iOS builds.
- Every non-consumable purchase has a working Restore Purchases path.
- A purchase, refund, reinstall, and offline entitlement refresh are tested.
- Phone layouts pass at 390 by 844 CSS pixels without horizontal overflow.
- App Store and Play Store privacy declarations match actual telemetry.
