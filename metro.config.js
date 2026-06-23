const path = require('path');
const fs = require('fs');
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);
const { resolver: { sourceExts, assetExts } } = defaultConfig;

// @alphaquark/mobile-sdk lives outside this project root (../alphaquark-mobile-sdk
// — Alphanomy's parent layout differs from Alphab2bapp's two-level-up layout).
// npm installed it via the file: dep into node_modules/@alphaquark/mobile-sdk as a
// symlink, but Metro's default resolver doesn't follow symlinks across watchFolder
// boundaries — it returned "Unable to resolve module @alphaquark/mobile-sdk".
// Two-part fix:
//   1. extraNodeModules — direct path map so the import bypasses node_modules lookup.
//   2. watchFolders — Metro needs to file-watch the SDK's source/lib so the
//      project rebuilds when the SDK is re-tsc'd.
// Scoped to ONLY the SDK path (not the whole parent dir, which has 50+ unrelated
// projects and would tank Metro's startup).
//
// MACHINE-AGNOSTIC RESOLUTION (ported from feature/prince 5ddca4f): the SDK
// checkout sits at a different depth per machine — `../alphaquark-mobile-sdk`
// when this repo is a sibling of the SDK vs `../../alphaquark-mobile-sdk` when
// this repo lives one level deeper (e.g. AQ/App/Alphanomy with SDK at AQ/).
// Hardcoding either path breaks Metro startup on the other layout because
// watchFolders points at a non-existent directory and watchman crashes.
const SDK_PATH_CANDIDATES = [
  path.resolve(__dirname, '../alphaquark-mobile-sdk/packages/rn'),
  path.resolve(__dirname, '../../alphaquark-mobile-sdk/packages/rn'),
];
const SDK_PATH =
  SDK_PATH_CANDIDATES.find((p) => fs.existsSync(p)) || SDK_PATH_CANDIDATES[0];

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...sourceExts, "svg"],
    resolverMainFields: ["sbmodern", "react-native", "browser", "main"],
    // Direct path map for the SDK package itself, plus its peer deps —
    // when SDK files (sitting at SDK_PATH/lib/...) `require('react')`,
    // Metro must resolve to the HOST app's react copy, not look in the
    // SDK's parent directories. Without these, Metro errors with
    // "Unable to resolve module react" because the SDK lives outside
    // the project root.
    extraNodeModules: {
      '@alphaquark/mobile-sdk': SDK_PATH,
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
      'react-native-webview': path.resolve(
        __dirname,
        'node_modules/react-native-webview',
      ),
      // SDK is shipped as compiled JS with babel-transformed async/await
      // → require('@babel/runtime/helpers/asyncToGenerator') etc. Ensure
      // those resolve to the host app's @babel/runtime install.
      '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
    },
    blockList: [
      // ios/build can grow to tens of GB of Xcode artifacts (DerivedData,
      // intermediates). If Metro walks it during haste-map init, /index.bundle
      // requests hang indefinitely. Codegen outputs in ios/build/generated/
      // are still picked up by the native build via Xcode's own build phases.
      /[\\/]ios[\\/]build[\\/].*/,
    ],
  },
  watchFolders: [SDK_PATH],
};

module.exports = mergeConfig(defaultConfig, config);
