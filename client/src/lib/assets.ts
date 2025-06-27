/**
 * Asset utilities for Web client
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

// Web-specific asset functions
export const useBrandAsset = (asset: BrandAssetKey) => {
  return getBrandAsset(asset, 'web');
};

export const useLeaderAsset = (asset: LeaderAssetKey) => {
  return getLeaderAsset(asset, 'web');
};

export const useDocumentAsset = (asset: DocumentAssetKey) => {
  return getDocumentAsset(asset, 'web');
};

// Dynamic leader asset resolver for web
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
    return getLeaderAsset(assetKey as LeaderAssetKey, 'web');
  }
  
  // Fallback to constructed path for web
  const cleanPath = isClean ? '-clean' : '';
  const fileName = leaderName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
  return `/assets/images/leaders/${fileName}${cleanPath}.svg`;
};

// Export types for use in components
export type { BrandAssetKey, LeaderAssetKey, DocumentAssetKey };