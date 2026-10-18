# Native LingoIQ splash test

The full-screen test currently targets Android API 24–30, including the connected
Redmi 8A (API 29). Android 12+ and iOS retain the React BrandSplash fallback.

- `assets/images/lingoiq-native-splash.png` is the native artwork, based on the
  existing Figma scene and Nunito text. The battery baked into the original SVG
  has been removed; Android draws its real status bar.
- `plugins/with-native-brand-splash.cjs` preserves the Android styles, drawable,
  and MainActivity background across Expo prebuilds. Native sources are ignored
  by Git in this project.
- `src/app/_layout.tsx` holds the native splash until fonts/i18n are ready and
  skips the second React splash only for this test's Android versions.
- `src/components/brand-splash.tsx` is retained. Set `useNativeBrandSplash` to
  `false` to show that screen again while investigating the native variant.

Build with `cd android && ./gradlew assembleDebug`; install with
`adb install -r -d android/app/build/outputs/apk/debug/app-debug.apk` from the app
root. Do not run `gradlew clean` before building (see `docs/mob/connect.md` in
 the parent workspace). Changes to native resources need a rebuilt APK.

To remove the native experiment completely, remove the custom plugin from
`app.json`, regenerate the Android project, and rebuild. Keep other native
customizations when regenerating.

## Startup investigation (16 October 2026)

The old `splashscreen_logo` was still the green notebook. The native plugin now
uses a transparent compat exit layer on API 24–30 and a bear/plane icon on API
31+, so the compat exit cannot show the obsolete artwork. The rebuilt APK still
needs a successful installation if the phone returns INSTALL_FAILED_USER_RESTRICTED.

The React root also waits for the local tabs-session check before releasing the
native picture. This covers the previous purple authentication spinner. It does
not wait for lesson/catalog API requests. BrandSplash remains available.

Observed debug timings after the JavaScript entry point began:
- Synchronous routes: root mounted at 26.8 s; fonts ready at 27.8 s.
- Experimental Android development async routes: root mounted at 35.1 s on a
  subsequent launch (first compilation was slower). This experiment was reverted.

The timing markers are development-only. These are debug-device measurements,
not release performance claims or full launcher-to-interactive measurements.
