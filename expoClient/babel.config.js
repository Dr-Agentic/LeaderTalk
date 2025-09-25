module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Removed 'expo-router/babel' as it's deprecated in SDK 50
      // Removed 'nativewind/babel' to fix the Babel plugin error
      'react-native-reanimated/plugin', // Must be last!
    ],
  };
};
