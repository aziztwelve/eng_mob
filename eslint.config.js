// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["**/.expo/**", "dist/**", "web-build/**", "android/**", "ios/**", "store-assets/**", "design-explorations/**", "docs/qa/**", "scripts/wordbank-preview/**"],
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: { __dirname: "readonly", module: "readonly", require: "readonly", exports: "readonly", process: "readonly", Buffer: "readonly" },
    },
  },
  {
    files: ["scripts/test-*.cjs"],
    rules: { "react-hooks/rules-of-hooks": "off", "react/display-name": "off" },
  },
]);
