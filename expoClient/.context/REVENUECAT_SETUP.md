# RevenueCat Setup Guide for LeaderTalk Mobile

## SDK Installation Complete ✅

**Package Installed:** `react-native-purchases@8.11.7`
- Compatible with React Native 0.79.3
- Installed with legacy peer deps to resolve version conflicts

## Required Setup Steps

### 1. RevenueCat Dashboard Configuration

1. **Create RevenueCat Project**
   - Sign up at https://app.revenuecat.com
   - Create new project: "LeaderTalk Mobile"
   - Get API keys (sandbox and production)

2. **Configure Products**
   ```
   Product IDs to create:
   - leadertalk_starter_monthly ($9.99/month)
   - leadertalk_premium_monthly ($19.99/month) 
   - leadertalk_premium_annual ($199.99/year)
   ```

3. **Set Up Entitlements**
   ```
   Entitlement: "premium_features"
   - Word limit: 5000+ words
   - Advanced analytics
   - Leader library access
   - Priority support
   ```

### 2. App Store Connect Configuration (iOS)

1. **Create In-App Purchases**
   - Auto-renewable subscriptions
   - Match product IDs from RevenueCat
   - Set pricing tiers

2. **Add Subscription Groups**
   - Group: "LeaderTalk Subscriptions"
   - Levels: Starter → Premium

### 3. Google Play Console Configuration (Android)

1. **Create Subscription Products**
   - Base plans with same product IDs
   - Set pricing and billing periods
   - Configure free trials if needed

### 4. Environment Variables

Add to `.env` file:
```bash
EXPO_PUBLIC_REVENUECAT_API_KEY=rc_prod_your_production_key
EXPO_PUBLIC_REVENUECAT_API_KEY_SANDBOX=rc_test_your_sandbox_key
```

### 5. Usage in App

```typescript
import { revenueCatService } from './src/services/revenueCatService';

// Initialize when user logs in
await revenueCatService.initialize(userId);

// Get subscription status
const subscription = await revenueCatService.getCurrentSubscription();

// Purchase a product
const result = await revenueCatService.purchasePackage(selectedPackage);
```

## Testing Flow

1. **Sandbox Testing**
   - Use test Apple ID or Google test account
   - Verify all purchase flows work
   - Test restore purchases functionality

2. **Production Testing**
   - Upload to TestFlight/Internal Testing
   - Test with real payment methods
   - Verify webhook integration

## Integration Points

**Server API Endpoints:**
- `POST /api/mobile/billing/purchase` - Validates purchases
- `GET /api/mobile/billing/subscription` - Gets current subscription
- `POST /api/mobile/billing/restore` - Restores purchases

**React Query Hooks:**
- `useMobileSubscription()` - Current subscription data
- `useMobileProducts()` - Available products
- `useMobilePurchase()` - Purchase flow
- `useMobileRestore()` - Restore purchases

## Next Steps

1. Configure RevenueCat dashboard with products
2. Set up App Store Connect and Google Play Console
3. Add environment variables with API keys
4. Test purchase flows in sandbox mode
5. Deploy to app stores for review