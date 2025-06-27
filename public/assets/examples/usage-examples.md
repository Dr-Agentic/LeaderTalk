# Asset Usage Examples

## Web Client Usage

```jsx
// Import the asset utilities
import { useBrandAsset, useLeaderAsset, getLeaderImagePath } from '@/lib/assets';

// Use predefined brand assets
function Header() {
  return (
    <img 
      src={useBrandAsset('logo')} 
      alt="LeaderTalk" 
      className="h-8"
    />
  );
}

// Use predefined leader assets
function LeaderProfile() {
  return (
    <img 
      src={useLeaderAsset('abrahamLincoln')} 
      alt="Abraham Lincoln"
      className="w-16 h-16"
    />
  );
}

// Dynamic leader image resolution
function DynamicLeader({ leaderName }: { leaderName: string }) {
  return (
    <img 
      src={getLeaderImagePath(leaderName, true)} // isClean = true
      alt={leaderName}
      className="w-12 h-12"
    />
  );
}
```

## Expo Client Usage

```jsx
// Import the asset utilities
import { useBrandAsset, useLeaderAsset, getLeaderImagePath } from '../src/lib/assets';
import { Image } from 'react-native';

// Use predefined brand assets
function Header() {
  return (
    <Image 
      source={{ uri: useBrandAsset('logoNoLabel') }} 
      style={{ width: 32, height: 32 }}
    />
  );
}

// Use predefined leader assets
function LeaderProfile() {
  return (
    <Image 
      source={{ uri: useLeaderAsset('barackObama') }} 
      style={{ width: 64, height: 64 }}
    />
  );
}

// Dynamic leader image resolution
function DynamicLeader({ leaderName }: { leaderName: string }) {
  return (
    <Image 
      source={{ uri: getLeaderImagePath(leaderName, false) }}
      style={{ width: 48, height: 48 }}
    />
  );
}
```

## Benefits of This Approach

1. **Type Safety**: Full TypeScript support with asset key validation
2. **Platform Agnostic**: Same API works for both web and mobile
3. **Centralized Management**: All asset paths defined in one place
4. **Dynamic Resolution**: Smart fallbacks for unknown assets
5. **Performance**: Optimized bundling and caching strategies