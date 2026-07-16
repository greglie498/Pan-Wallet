const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix CSS handling for NativeWind v4
config.resolver.sourceExts = [
  ...config.resolver.sourceExts.filter((ext) => ext !== "css"),
  "css",
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});