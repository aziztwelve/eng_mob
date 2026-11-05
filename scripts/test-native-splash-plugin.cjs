const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('native splash patch survives running before or after the Expo splash plugin and is idempotent', () => {
  let activityMod;
  const mod = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../plugins/with-native-brand-splash.cjs'), 'utf8'), {
    module: mod,
    require(name) {
      if (name === 'node:fs') return fs;
      if (name === 'node:path') return path;
      if (name === 'expo/config-plugins') return {
        withAndroidStyles: config => config,
        withMainActivity: (config, callback) => { activityMod = callback; return config; },
        withDangerousMod: config => config,
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  mod.exports({});
  for (const prefix of ['', 'SplashScreenManager.registerOnActivity(this)\n']) {
    const ctx = { modResults: { contents: `class MainActivity { override fun onCreate(savedInstanceState: Bundle?) { ${prefix}super.onCreate(null) } }` } };
    activityMod(ctx);
    assert.match(ctx.modResults.contents, /super\.onCreate\(null\)[\s\S]*window\.setBackgroundDrawableResource\(R\.drawable\.lingoiq_launch_background\)/);
    const once = ctx.modResults.contents;
    activityMod(ctx);
    assert.equal(ctx.modResults.contents, once);
  }
});
