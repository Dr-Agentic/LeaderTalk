const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add shared assets directory to watch folders
config.watchFolders = [
  path.resolve(__dirname, '../public')
];

// Configure path aliases for clean imports
config.resolver = {
  ...config.resolver,
  alias: {
    '@shared-assets': path.resolve(__dirname, '../public/assets'),
  },
};

module.exports = config;
