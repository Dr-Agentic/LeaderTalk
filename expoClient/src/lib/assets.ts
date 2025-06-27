/**
 * Asset utilities for Expo client
 * Provides platform-specific asset resolution using shared asset definitions
 */

import {
  getBrandAsset,
  getLeaderAsset,
  getDocumentAsset,
  type BrandAssetKey,
  type LeaderAssetKey,
  type DocumentAssetKey,
} from '../../../shared/assets';

// Expo-specific asset functions
export const useBrandAsset = (asset: BrandAssetKey) => {
  return getBrandAsset(asset, 'expo');
};

export const useLeaderAsset = (asset: LeaderAssetKey) => {
  return getLeaderAsset(asset, 'expo');
};

export const useDocumentAsset = (asset: DocumentAssetKey) => {
  return getDocumentAsset(asset, 'expo');
};

// Dynamic leader asset resolver
export const getLeaderImagePath = (leaderName: string, isClean: boolean = false): string => {
  const cleanSuffix = isClean ? 'Clean' : '';
  const normalizedName = leaderName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z]/g, '');
  
  // Map common leader names to asset keys
  const leaderNameMap: Record<string, string> = {
    'abrahamlincoln': `abrahamLincoln${cleanSuffix}`,
    'barackobama': `barackObama${cleanSuffix}`,
    'brianmoynihan': 'brianMoynihan',
  };
  
  const assetKey = leaderNameMap[normalizedName];
  if (assetKey && assetKey in getLeaderAsset as any) {
    return getLeaderAsset(assetKey as LeaderAssetKey, 'expo');
  }
  
  // Fallback to constructed path
  const cleanPath = isClean ? '-clean' : '';
  const fileName = leaderName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
  return `../public/assets/images/leaders/${fileName}${cleanPath}.svg`;
};

// Export types for use in components
export type { BrandAssetKey, LeaderAssetKey, DocumentAssetKey };