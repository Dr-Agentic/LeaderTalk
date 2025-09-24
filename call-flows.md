# Call Flows Documentation

This document describes how each API endpoint and event is handled in the backend, showing the flow of calls and modules used.

## Server Startup & Route Registration

### Mobile Billing Routes Registration Flow

**Entry Point**: `server/index.ts` line 36
```
registerRoutes(app) 
```

**Flow**:
1. `server/index.ts:36` → `server/routes.ts:registerRoutes()`
2. `server/routes.ts:11` → imports `{ registerAllRoutes } from "./routes/index"`
3. `server/routes.ts:95` → calls `registerAllRoutes(app)`
4. `server/routes/index.ts:12` → imports `{ registerMobileBillingRoutes } from "./mobile-billing"`
5. `server/routes/index.ts:37` → calls `registerMobileBillingRoutes(app)`
6. `server/routes/mobile-billing.ts` → registers endpoints:
   - `GET /api/mobile/billing/subscription`
   - `GET /api/mobile/billing/products` 
   - `POST /api/mobile/billing/validate-purchase`
   - `POST /api/mobile/billing/webhooks/revenuecat`

**Result**: Mobile billing routes are accessible at `/api/mobile/billing/*`

## Mobile Billing API Endpoints

### GET /api/mobile/billing/subscription

**Flow**:
1. `server/routes/mobile-billing.ts:19` → `getMobileUserSubscription()`
2. `server/controllers/mobileSubscriptionController.ts:validateUserAccess()` → validates session
3. `server/controllers/mobileSubscriptionController.ts:ensureMobileUserHasValidSubscription()` → gets user subscription
4. `server/services/revenueCatPaymentHandler.ts:retrieveUserSubscription()` → calls RevenueCat API
5. Returns subscription data or creates default starter subscription

**Modules Used**:
- `mobileSubscriptionController.ts`
- `revenueCatPaymentHandler.ts`
- `storage.ts` (for user lookup)

### GET /api/mobile/billing/products

**Flow**:
1. `server/routes/mobile-billing.ts:22` → `getMobileBillingProducts()`
2. `server/controllers/mobileSubscriptionController.ts` → loads subscription plans from JSON
3. `server/config/subscriptionPlans.json` → returns available plans with RevenueCat product IDs

**Modules Used**:
- `mobileSubscriptionController.ts`
- `config/subscriptionPlans.json`

### POST /api/mobile/billing/validate-purchase

**Flow**:
1. `server/routes/mobile-billing.ts:25` → `validateMobilePurchase()`
2. `server/controllers/mobileSubscriptionController.ts` → validates purchase with RevenueCat
3. `server/services/revenueCatPaymentHandler.ts` → calls RevenueCat validation API

**Modules Used**:
- `mobileSubscriptionController.ts`
- `revenueCatPaymentHandler.ts`

### POST /api/mobile/billing/webhooks/revenuecat

**Flow**:
1. `server/routes/mobile-billing.ts:28` → webhook handler
2. Logs webhook event type
3. **TODO**: Process subscription state changes

**Current Status**: Only logs events, no processing implemented
