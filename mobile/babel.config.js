/**
 * Babel config for Expo. Path alias @/ is resolved by Metro when
 * experiments.tsConfigPaths is true (Expo 50+). This file exists so that
 * we can add babel-plugin-module-resolver later if needed for consistency
 * (e.g. Jest or other tools that don't read tsconfig paths).
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
