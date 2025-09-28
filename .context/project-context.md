# Project Context Documentation

This document tracks major design decisions, architecture choices, and libraries used in the LeaderTalk project.

## Authentication Architecture

### Design Decision: Unified Session-Based Authentication

**Architecture**: Both web and mobile clients use identical session-based authentication, not Bearer tokens.

### Authentication Flow

#### 1. Client Authentication
- **Web**: Supabase Auth → `/api/auth/supabase-callback`
- **Mobile**: Supabase Auth → `/api/auth/supabase-callback` 
- **Demo**: Direct → `/api/auth/demo-login`

#### 2. Session Establishment
- Server creates `req.session.userId` after successful authentication
- Session cookie sent to client with `credentials: 'include'`
- All subsequent API calls include session cookie automatically

#### 3. API Route Protection
- **Standard Pattern**: All routes use identical `requireAuth` middleware
- **Implementation**: `if (!(req.session as any)?.userId) return 401`
- **Consistency**: Same middleware across all route modules

### Critical Implementation Details

#### 1. Mobile Client Session Usage
```typescript
// Mobile client uses session cookies, NOT Bearer tokens
fetch('/api/mobile/billing/subscription', {
  credentials: 'include'  // Sends session cookie
});
```

#### 2. Standard requireAuth Middleware
```typescript
// Used by ALL route modules (billing.ts, users.ts, recordings.ts, etc.)
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!(req.session as any)?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};
```

#### 3. Session Cookie Configuration
- Cookie name: `leadertalk.sid`
- HttpOnly: true for security
- SameSite: 'lax' for cross-origin compatibility
- Secure: true in production

### Architecture Benefits

#### 1. Unified Authentication
- **Single auth flow**: Web and mobile use identical server endpoints
- **Consistent middleware**: All API routes protected identically
- **Simplified debugging**: Same session mechanism across platforms

#### 2. Security & Compliance
- **HttpOnly cookies**: Prevents XSS attacks on session tokens
- **Server-side sessions**: Session data stored server-side, not in JWT
- **Automatic expiration**: Express-session handles timeout and cleanup

#### 3. Development Efficiency
- **No token management**: No JWT signing, validation, or refresh logic
- **Platform agnostic**: Same authentication code works web and mobile
- **Express.js standard**: Uses built-in express-session middleware

### Common Pitfall Avoided

**Issue**: Custom authentication middleware per route module creates inconsistency and bugs.

**Solution**: All route modules use identical `requireAuth` pattern checking `req.session.userId`.

**Result**: Authentication works consistently across all endpoints, preventing HTML responses when expecting JSON.

## Subscription Data Transformation Architecture

### Design Decision: Server-Side Data Transformation

**Problem**: Raw subscription plan JSON contains multi-platform data that needs formatting for client consumption.

**Solution**: Two-layer transformation in server before sending to clients.

### Transformation Layers

#### Layer 1: Platform Selection (`subscriptionPlanService.getPlansForPlatform()`)
- Input: Raw JSON from `server/config/subscriptionPlans.json`
- Process: Adds platform-specific `platformId` fields
- Output: Platform-filtered plans with correct product IDs

#### Layer 2: UI Formatting (`mobileSubscriptionController.getMobileBillingProducts()`)
- Input: Platform-filtered plans
- Process: Transforms to UI-ready format
- Output: Client-consumable `BillingProduct[]`

### Value of Server Transformation

#### 1. Platform Abstraction
- **Raw JSON**: Contains all platforms (Stripe, RevenueCat, Google Play)
- **Transformed**: Only iOS RevenueCat product IDs
- **Value**: Client doesn't need platform selection logic

#### 2. UI-Ready Data
- **Raw JSON**: `"amount": 9.99`
- **Transformed**: `"formattedPrice": "$9.99"`, `"amount": 999` (cents)
- **Value**: Direct display without client-side formatting

#### 3. Business Logic Centralization
- **Raw JSON**: Client calculates savings percentages
- **Transformed**: `"formattedSavings": "Save 17%"`
- **Value**: Complex pricing calculations server-side for consistency

#### 4. Client Simplification
- **Eliminates**: Platform ID selection, currency formatting, savings calculation, interval display conversion
- **Value**: Faster development, fewer bugs, reduced client complexity

#### 5. RevenueCat Integration
- **Raw JSON**: Generic structure
- **Transformed**: `productId` directly usable with RevenueCat SDK
- **Value**: Seamless purchase flow

### Data Flow
```
subscriptionPlans.json → subscriptionPlanService → mobileSubscriptionController → expoClient
```

**Result**: Configuration data becomes UI-ready, platform-specific data that eliminates client-side business logic and ensures consistent user experience across platforms.

## RevenueCat Mobile Payment Integration

### Implementation Status: 85% Complete

**Architecture Decision**: Dual payment system supporting both web (Stripe) and mobile (RevenueCat) platforms with unified subscription management.

### Key Components

#### 1. Server-Side RevenueCat Integration
- **Handler**: `server/services/revenueCatPaymentHandler.ts`
- **Controller**: `server/controllers/mobileSubscriptionController.ts`
- **API**: V2 RevenueCat API with proper error handling
- **Endpoints**: `/api/mobile/billing/*` for mobile-specific operations

#### 2. Client-Side SDK Integration
- **Service**: `expoClient/src/services/revenueCatService.ts`
- **Hooks**: `expoClient/src/hooks/useMobileBilling.ts`
- **SDK**: `react-native-purchases@9.2.1`
- **Configuration**: Server-provided API keys (no hardcoded credentials)

#### 3. Platform Detection & Routing
- **Web**: Uses existing Stripe integration
- **iOS/Android**: Routes to RevenueCat purchase flow
- **Detection**: `Platform.OS` with `x-platform` header
- **Unified UI**: Same subscription screen for all platforms

### Technical Decisions

#### 1. Email-Based Customer Identification
- **Problem**: Avoid database ID synchronization between RevenueCat and internal system
- **Solution**: Use email as RevenueCat app_user_id
- **Benefit**: Simplified customer lookup and management

#### 2. Server-Side Webhook Processing
- **Problem**: Client-side purchase validation is insecure
- **Solution**: RevenueCat webhooks update server-side subscription state
- **Flow**: Purchase → RevenueCat → Webhook → Server → Database

#### 3. Default Subscription Creation
- **Problem**: New users need immediate access to free tier
- **Solution**: Auto-create "LeaderTalk Starter" subscription for new users
- **Implementation**: Server-side default subscription logic

### Pending Configuration

#### External Services Required:
1. **RevenueCat Dashboard**: Project creation, product configuration, API keys
2. **App Store Connect**: In-app purchase products, subscription groups
3. **Environment Variables**: API keys and project IDs
4. **Webhook Setup**: RevenueCat → Server webhook configuration

#### Environment Variables Needed:
```bash
RC_SECRET_KEY=sk_your_secret_key_here
RC_PROJECT_ID=proj_your_project_id_here
REVENUECAT_IOS_API_KEY=appl_your_ios_api_key_here
REVENUECAT_ANDROID_API_KEY=goog_your_android_api_key_here
```

### Code Quality Standards Applied

#### 1. Enterprise Architecture Patterns
- **Handler/Controller separation**: Business logic isolated from HTTP concerns
- **Service layer abstraction**: RevenueCat SDK wrapped in service layer
- **Repository pattern**: Subscription data access through dedicated methods

#### 2. Error Handling & Resilience
- **Graceful degradation**: Falls back to default subscription on API failures
- **Comprehensive logging**: All RevenueCat interactions logged for debugging
- **Type safety**: Full TypeScript interfaces for all RevenueCat data structures

#### 3. Security Best Practices
- **Server-side validation**: All purchases validated server-side via webhooks
- **No client secrets**: API keys fetched from server, not hardcoded
- **Session-based auth**: Existing authentication system extended to mobile billing

### Integration Benefits

#### 1. Unified Subscription Management
- **Single database**: All subscriptions (Stripe + RevenueCat) in same tables
- **Consistent API**: Same subscription endpoints work for web and mobile
- **Shared business logic**: Word limits, features, billing cycles unified

#### 2. Platform-Appropriate Payment Processing
- **Web**: Stripe for credit card processing
- **Mobile**: RevenueCat for App Store/Google Play compliance
- **Automatic routing**: Platform detection handles payment method selection

#### 3. Future-Proof Architecture
- **Multi-platform ready**: Android support requires only environment variables
- **Scalable**: RevenueCat handles App Store review requirements
- **Maintainable**: Clear separation between payment processing and business logic

**Status**: Implementation complete, requires external service configuration to activate.

## Security & Production Readiness TODOs

### CRITICAL: Remove Development Authentication Endpoints

**Issue**: `force-login` endpoint is a major security vulnerability in production.

**Current Risk**:
- `/api/auth/force-login` bypasses all authentication
- Anyone can access user ID 1's account without credentials
- No password or verification required
- Live on production server `app.leadertalk.app`

**Required Actions**:
1. **Immediate**: Environment-gate the endpoint to development only
2. **Before production**: Remove `force-login` entirely
3. **Security audit**: Check for unauthorized usage in logs
4. **Code review**: Ensure no other authentication bypasses exist

**Safe Implementation Pattern**:
```typescript
if (process.env.NODE_ENV === "production") {
  return res.status(404).json({ error: "Not found" });
}
```

**Alternative**: Keep `demo-login` (safer) and proper OAuth flows only.

**Priority**: CRITICAL - Security vulnerability affecting production users.
