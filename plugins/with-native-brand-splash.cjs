// Test full-screen launch artwork on Android 11 and earlier. Android 12+
// retains the platform splash API and its icon sizing rules.
const fs = require('node:fs');
const path = require('node:path');
const { withAndroidStyles, withMainActivity, withDangerousMod } = require('expo/config-plugins');

module.exports = function withNativeBrandSplash(config) {
  config = withAndroidStyles(config, mod => {
    const theme = mod.modResults.resources.style.find(style => style.$.name === 'Theme.App.SplashScreen');
    const replaced = ['android:windowBackground', 'windowSplashScreenBackground', 'windowSplashScreenAnimatedIcon'];
    theme.item = (theme.item || []).filter(item => !replaced.includes(item.$.name));
    theme.item.push({ $: { name: 'android:windowBackground' }, _: '@drawable/lingoiq_launch_background' });
    // The compat exit overlay must not flash the old logo over the full scene.
    theme.item.push({ $: { name: 'windowSplashScreenBackground' }, _: '@color/lingoiq_splash_overlay_background' });
    theme.item.push({ $: { name: 'windowSplashScreenAnimatedIcon' }, _: '@drawable/lingoiq_launch_icon' });
    return mod;
  });
  config = withMainActivity(config, mod => {
    const addition = '\n    // LingoIQ: keep the launch artwork behind React while it initializes.\n    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {\n      window.setBackgroundDrawableResource(R.drawable.lingoiq_launch_background)\n    }';
    if (!mod.modResults.contents.includes('// LingoIQ: keep the launch artwork')) {
      mod.modResults.contents = mod.modResults.contents.replace('SplashScreenManager.registerOnActivity(this)', 'SplashScreenManager.registerOnActivity(this)' + addition);
    }
    return mod;
  });
  return withDangerousMod(config, ['android', async mod => {
    const res = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res');
    for (const name of ['drawable-nodpi', 'drawable', 'drawable-v31', 'values', 'values-v31']) fs.mkdirSync(path.join(res, name), { recursive: true });
    fs.copyFileSync(path.join(mod.modRequest.projectRoot, 'assets/images/lingoiq-native-splash.png'), path.join(res, 'drawable-nodpi/lingoiq_native_splash.png'));
    fs.writeFileSync(path.join(res, 'drawable/lingoiq_launch_background.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<bitmap xmlns:android="http://schemas.android.com/apk/res/android" android:src="@drawable/lingoiq_native_splash" android:gravity="fill" android:filter="true" />\n');
    fs.writeFileSync(path.join(res, 'drawable-v31/lingoiq_launch_background.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android"><solid android:color="@color/splashscreen_background" /></shape>\n');
    fs.writeFileSync(path.join(res, 'drawable/lingoiq_launch_icon.xml'), '<shape xmlns:android="http://schemas.android.com/apk/res/android"><solid android:color="@android:color/transparent" /></shape>\n');
    fs.writeFileSync(path.join(res, 'drawable-v31/lingoiq_launch_icon.xml'), '<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@drawable/splashscreen_logo" /></layer-list>\n');
    fs.writeFileSync(path.join(res, 'values/lingoiq_splash.xml'), '<resources><color name="lingoiq_splash_overlay_background">#00000000</color></resources>\n');
    fs.writeFileSync(path.join(res, 'values-v31/lingoiq_splash.xml'), '<resources><color name="lingoiq_splash_overlay_background">#FAFAFA</color></resources>\n');
    return mod;
  }]);
};
