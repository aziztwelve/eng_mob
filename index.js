// Hold the native splash before Expo Router evaluates the application modules.
// The root releases it once fonts and the first React screen are ready.
const SplashScreen = require('expo-splash-screen');
globalThis.__lingoiqStartupAt = Date.now();
if (__DEV__) console.info('[startup] entry');
void SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 0, fade: false });
require('expo-router/entry');
