/**
 * Shared asset paths and utilities for both web and mobile clients
 * Provides consistent asset references across platforms
 */

// Asset base paths for different platforms
export const ASSET_BASE_PATHS = {
  web: '/assets',
  expo: '../public/assets',
} as const;

// Brand assets
export const BRAND_ASSETS = {
  logo: 'images/brand/leadertalk-logo.png',
  logoNoLabel: 'images/brand/leadertalk-logo-no-label.png',
} as const;

// Leader portrait assets
export const LEADER_ASSETS = {
  abrahamLincoln: 'images/leaders/abraham-lincoln.svg',
  abrahamLincolnClean: 'images/leaders/abraham-lincoln-clean.svg',
  barackObama: 'images/leaders/barack-obama.svg',
  barackObamaClean: 'images/leaders/barack-obama-clean.svg',
  brianMoynihan: 'images/leaders/brian-moynihan.svg',
  // Add more leaders as needed
} as const;

// Document assets
export const DOCUMENT_ASSETS = {
  quotes: 'documents/quotes.json',
} as const;

// Platform-specific asset URL generators
export const getAssetUrl = (assetPath: string, platform: 'web' | 'expo' = 'web'): string => {
  const basePath = ASSET_BASE_PATHS[platform];
  return `${basePath}/${assetPath}`;
};

// Convenience functions for common assets
export const getBrandAsset = (asset: keyof typeof BRAND_ASSETS, platform: 'web' | 'expo' = 'web'): string => {
  return getAssetUrl(BRAND_ASSETS[asset], platform);
};

export const getLeaderAsset = (asset: keyof typeof LEADER_ASSETS, platform: 'web' | 'expo' = 'web'): string => {
  return getAssetUrl(LEADER_ASSETS[asset], platform);
};

export const getDocumentAsset = (asset: keyof typeof DOCUMENT_ASSETS, platform: 'web' | 'expo' = 'web'): string => {
  return getAssetUrl(DOCUMENT_ASSETS[asset], platform);
};

// Type definitions for asset usage
export type AssetPlatform = 'web' | 'expo';
export type BrandAssetKey = keyof typeof BRAND_ASSETS;
export type LeaderAssetKey = keyof typeof LEADER_ASSETS;
export type DocumentAssetKey = keyof typeof DOCUMENT_ASSETS;