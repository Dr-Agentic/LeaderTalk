# LeaderTalk Server API Architecture Analysis

**Analysis Date:** September 27, 2025  
**Git Commit:** `e6233f47` - "Ensure user subscriptions are created only after the HTTP response is fully sent"  
**Analysis Version:** 1.0

## Executive Summary

The LeaderTalk server implements a modular REST API architecture with 8 route modules, 67 total endpoints, and unified session-based authentication. The API supports both web and mobile clients with separate billing systems (Stripe/RevenueCat) and comprehensive user management, recording analysis, and training functionality.

## Architecture Overview

### Modular Route Structure
```
server/routes/
├── index.ts           # Central route registration
├── auth.ts            # Authentication & session management
├── users.ts           # User profile & account management
├── recordings.ts      # Audio recording & analysis
├── training.ts        # Learning modules & progress tracking
├── leaders.ts         # Leadership style references
├── billing.ts         # Web payment processing (Stripe)
├── mobile-billing.ts  # Mobile payment processing (RevenueCat)
├── usage.ts           # Word usage & billing analytics
├── debug.ts           # Debug & health check endpoints
└── admin.ts           # Admin management endpoints
```

### Authentication Architecture
- **Middleware:** Shared `requireAuth` from `middleware/auth.ts`
- **Session Management:** Express-session with MemoryStore
- **Cookie:** `leadertalk.sid` with 7-day expiration
- **Multi-Platform:** Web (Supabase OAuth) + Mobile (session-based)

## Complete API Reference

### 🔐 Authentication Endpoints
**File:** `routes/auth.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/auth/auth-parameters` | GET | None | Inline | Get Supabase/RevenueCat config |
| `/api/auth/logout` | GET | None | Inline | Destroy user session |
| `/api/auth/force-login` | GET | None | Inline | **⚠️ DEV ONLY** - Bypass auth |
| `/api/login` | POST | None | Inline | Basic email/password login |
| `/api/auth/supabase-callback` | POST | None | Inline | OAuth callback handler |
| `/api/auth/demo-login` | POST | None | Inline | Demo user authentication |
| `/api/auth/test-session-save` | POST | None | Inline | **⚠️ DEBUG** - Session testing |

**Dependencies:** `storage`, `config/environment`  
**Security Issues:** `force-login` is a critical vulnerability in production

### 👤 User Management Endpoints
**File:** `routes/users.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/users/me` | GET | Optional | Inline | Get current user profile |
| `/api/users/me/selected-leaders` | GET | Required | Inline | Get user's selected leaders |
| `/api/users/me` | PATCH | Required | Inline | Update user profile |
| `/api/users/word-usage` | GET | None | Inline | Get word usage analytics |
| `/api/users/delete-records` | POST | Required | Inline | Delete user recordings |
| `/api/users/delete-account` | POST | Required | Inline | Complete account deletion |
| `/api/users` | POST | None | Inline | Create new user account |

**Dependencies:** `storage`, `getBillingCycleWordUsageAnalytics`  
**Data Flow:** Route → Storage → Database

### 🎙️ Recording Management Endpoints
**File:** `routes/recordings.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/recordings` | GET | Required | Inline | List user recordings |
| `/api/recordings/current-cycle` | GET | Required | Inline | Current billing cycle recordings |
| `/api/recordings/:id` | GET | Required | Inline | Get specific recording |
| `/api/recordings` | POST | Required | Inline | Create new recording |
| `/api/recordings/upload` | POST | Required | Multer + Inline | Upload audio file |
| `/api/recordings/:id` | PUT | Required | Inline | Update recording metadata |
| `/api/recordings/:id` | DELETE | Required | Inline | Delete recording |

**Dependencies:** `storage`, `transcribeAndAnalyzeAudio`, `multer`  
**Data Flow:** Route → Background Processing → OpenAI → Storage  
**File Handling:** Multer memory storage, 10MB limit

### 📚 Training System Endpoints
**File:** `routes/training.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/training/chapters` | GET | Required | Inline | List all chapters |
| `/api/training/chapters/:chapterId` | GET | Required | Inline | Get chapter details |
| `/api/training/chapters/:chapterId/modules/:moduleId` | GET | Required | Inline | Get module content |
| `/api/training/chapters/:chapterId/modules/:moduleId/situations/:situationId` | GET | Required | Inline | Get situation exercise |
| `/api/training/submit-with-ai-evaluation` | POST | Required | Inline | Submit with AI feedback |
| `/api/training/submit` | POST | Required | Inline | Submit training attempt |
| `/api/training/attempts` | GET | Required | Inline | Get attempt history |
| `/api/training/progress` | GET | Required | Inline | Get user progress |
| `/api/training/situation/:situationId/stats` | GET | Required | Inline | Situation statistics |
| `/api/training/module/:moduleId/stats` | GET | Required | Inline | Module statistics |
| `/api/training/chapter/:chapterId/stats` | GET | Required | Inline | Chapter statistics |
| `/api/training/progress` | POST | Required | Inline | Update progress |

**Dependencies:** `db`, `situationAttempts`, `userProgress`, JSON files  
**Data Flow:** Route → Drizzle ORM → PostgreSQL  
**Content Source:** Static JSON files in `attached_assets/`

### 👑 Leadership Reference Endpoints
**File:** `routes/leaders.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/leaders` | GET | None | Inline | List all leaders |
| `/api/leaders/:id` | GET | None | Inline | Get leader details |
| `/api/leaders/:id/alternatives` | GET | Required | Inline | Get leader alternatives |
| `/api/leaders/:id/all-alternatives` | GET | Required | Inline | Get all cached alternatives |

**Dependencies:** `storage`, OpenAI integration  
**Data Flow:** Route → Storage → OpenAI → Cache

### 💳 Web Billing Endpoints (Stripe)
**File:** `routes/billing.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/billing/webhooks/revenuecat` | POST | None | `handleRevenueCatWebhook` | RevenueCat webhook |
| `/api/billing/webhooks/stripe` | POST | None | Inline | Stripe webhook |
| `/api/billing/products` | GET | None | `spc.getBillingProducts` | Available products |
| `/api/billing/subscriptions/current` | GET | Required | `getCurrentSubscriptionFormatted` | Current subscription |
| `/api/billing/subscriptions/create` | POST | Required | Inline | Create subscription |
| `/api/billing/subscriptions/cancel` | POST | Required | `cancelSubscription` | Cancel subscription |
| `/api/billing/subscriptions/update` | POST | Required | Inline | Update subscription |
| `/api/billing/subscriptions/history` | GET | Required | Inline | Billing history |
| `/api/billing/payment-methods` | GET | Required | Inline | List payment methods |
| `/api/billing/payment-methods/setup` | POST | Required | Inline | Setup payment method |
| `/api/billing/payment-methods/set-default` | POST | Required | Inline | Set default payment |
| `/api/billing/subscription/preview` | POST | Required | Inline | Preview changes |
| `/api/billing/subscription/change` | POST | Required | Inline | Execute changes |
| `/api/billing/subscription/scheduled` | GET | Required | Inline | Scheduled changes |
| `/api/billing/subscription/scheduled/cancel` | POST | Required | Inline | Cancel scheduled |
| `/api/billing/subscription/scheduled/:id` | DELETE | Required | Inline | Delete scheduled |

**Dependencies:** Stripe SDK, `paymentServiceHandler`, `subscriptionController`  
**Data Flow:** Route → Stripe API → Database

#### **Detailed Analysis: `/api/billing/products` Endpoint**

**Exact Flow:**
```
GET /api/billing/products → spc.getBillingProducts() → subscriptionPlanService.getPlansForPlatform() → JSON file
```

**Modules & Files Involved:**
1. **Route Handler:** `/server/routes/billing.ts` - `app.get('/api/billing/products', spc.getBillingProducts)`
2. **Controller:** `/server/controllers/subscriptionPlansController.ts` - `spc.getBillingProducts(req, res)`
3. **Service Layer:** `/server/services/subscriptionPlanService.ts` - `subscriptionPlanService.getPlansForPlatform(platform)`
4. **Data Source:** `/server/config/subscriptionPlans.json` - Raw subscription plan definitions

**Processing Steps:**
1. **Platform Detection:** Extracts platform from `x-platform` header (defaults to 'web')
2. **Load Plans:** Reads `/server/config/subscriptionPlans.json`
3. **Platform Filtering:** Adds platform-specific product IDs (Stripe for web, RevenueCat for mobile)
4. **Data Transformation:** Converts plans to billing products with monthly/yearly variants, formatted prices, savings calculations
5. **Sorting:** Orders by `displayOrder` from metadata
6. **Response:** Returns JSON array of formatted billing products

**Key Dependencies:** subscriptionPlanService (singleton), platform detection, JSON configuration, price formatting utilities

#### **Client Subscription Retrieval Patterns**

**Web Client (React):**
- **Primary Endpoint:** `/api/billing/subscriptions/current` (Stripe-based)
- **Implementation:** React Query with `queryKey: ["/api/billing/subscriptions/current"]`
- **Usage:** SecureSubscription.tsx for main subscription management
- **Caching:** Single query key, invalidated after mutations (create/update/cancel)
- **Polling:** Direct fetch calls for payment status verification

**Mobile Client (React Native):**
- **Primary Endpoint:** `/api/mobile/billing/subscription` (RevenueCat-based)
- **Hook:** `useMobileSubscription()` with `queryKey: [API_BASE, 'subscription']`
- **Fallback Usage:** Some components use `/api/billing/subscriptions/current` for compatibility
- **Components:** SubscriptionTimeline.tsx, BillingCycleHistory.tsx use web endpoint
- **Caching:** Separate query keys for mobile vs web endpoints

**Authentication Pattern:** Both platforms use `credentials: 'include'` for session-based auth

**Architecture Benefits:**
- Platform-appropriate billing systems (Stripe vs RevenueCat)
- Shared component compatibility (mobile can use web endpoints)
- Unified subscription data model on backend
- Independent caching strategies per platform

### 📱 Mobile Billing Endpoints (RevenueCat)
**File:** `routes/mobile-billing.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/mobile/billing/subscription` | GET | Required | `getMobileUserSubscription` | Current mobile subscription |
| `/api/mobile/billing/products` | GET | Required | `getMobileBillingProducts` | Available mobile products |
| `/api/mobile/billing/purchase` | POST | Required | `validateMobilePurchase` | Process mobile app purchase |
| `/api/mobile/billing/validate-purchase` | POST | Required | `validateMobilePurchase` | Validate app purchase (alias) |
| `/api/mobile/billing/webhooks/revenuecat` | POST | None | Inline | RevenueCat webhook |

**Dependencies:** `mobileSubscriptionController`, RevenueCat API  
**Data Flow:** Route → RevenueCat API → Database

#### **Mobile Billing Architecture Analysis**

**Dual Endpoint Strategy:**
- **Mobile-Specific:** `/api/mobile/billing/subscription` - RevenueCat subscription data
- **Web Compatibility:** Mobile components can fallback to `/api/billing/subscriptions/current`

**Client Integration:**
- **Primary Hook:** `useMobileSubscription()` for RevenueCat data
- **Query Key:** `[API_BASE, 'subscription']` with 5-minute stale time
- **Error Handling:** Custom error logging with detailed response tracking
- **Cache Invalidation:** After purchase, restore, and cancellation operations

**Cross-Platform Compatibility:**
- SubscriptionTimeline.tsx and BillingCycleHistory.tsx use web billing endpoint
- Enables shared components between web and mobile clients
- Maintains platform-specific billing while allowing component reuse

## Subscription Upgrade Flow Analysis

### **Web Client Upgrade Flow (Stripe-based)**

**Call Flow Map:**
```
1. User clicks "Select Plan" → handleSubscribe(plan)
2. GET /api/billing/subscription/preview → Validate change
3. setPendingSubscriptionChange() → Store selection
4. setShowPaymentMethodSelector(true) → Show payment UI
5. POST /api/billing/subscription/change → Execute change
6. POST /api/billing/subscriptions/update → Update subscription
7. Server Response:
   - requiresPayment: Show Stripe payment setup
   - success: Immediate subscription update
8. Cache invalidation → Refresh subscription data
```

**Key Implementation Details:**
- **Preview System:** Gets change preview before committing
- **Payment Method Management:** Handles payment setup if required
- **Immediate Processing:** Server processes subscription change immediately
- **Retry Mechanism:** Retries after payment method setup
- **Complex State Management:** Multiple UI states for different scenarios

### **Mobile Client Upgrade Flow (RevenueCat-based)**

**Call Flow Map:**
```
1. User selects plan → RevenueCat SDK purchase flow
2. revenueCatService.purchasePackage(package)
3. Purchases.purchasePackage() → Native RevenueCat SDK
4. App Store/Google Play purchase dialog
5. Purchase completion callback
6. useMobilePurchase() → POST /api/mobile/billing/purchase
7. Server validates purchase with RevenueCat
8. Cache invalidation → Refresh subscription data
```

**Key Implementation Details:**
- **Native Purchase Flow:** Uses platform-native purchase dialogs
- **Simplified Flow:** RevenueCat handles payment processing
- **Webhook-Based:** Server gets notified via RevenueCat webhooks
- **Platform Compliance:** Follows App Store/Google Play guidelines
- **Limited UI Control:** Platform controls purchase experience

### **Architecture Comparison**

| Aspect | Web Client (Stripe) | Mobile Client (RevenueCat) |
|--------|-------------------|---------------------------|
| **Control** | High - Full UI control | Limited - Platform-dependent |
| **Complexity** | High - Multiple states | Low - SDK handles complexity |
| **Processing** | Immediate server processing | Webhook-based processing |
| **Payment** | Requires payment method setup | Platform handles payment |
| **Preview** | Change preview system | No preview (direct purchase) |
| **Retry Logic** | Built-in retry mechanisms | Platform handles retries |

## Mobile Workflow Assessment

### **❌ Critical Issues with Current Implementation**

#### **1. Fundamentally Broken Purchase Flow**
**Current (Incorrect):**
```
Client → RevenueCat SDK → App Store → Client calls /api/mobile/billing/purchase
```

**RevenueCat Best Practice:**
```
Client → RevenueCat SDK → App Store → RevenueCat Webhook → Server
```

#### **2. Missing Server-Side Validation**
- `validateMobilePurchase()` performs NO actual validation
- Returns success without verifying purchase with RevenueCat API
- Violates security best practices

#### **3. Placeholder Webhook Implementation**
- Webhook only logs events, performs no business logic
- Missing signature verification
- No subscription state updates

### **🏗️ Required Fixes for Server-Centric Architecture**

#### **Priority 1: Implement Proper Webhook Processing**
- Add RevenueCat signature verification
- Implement actual business logic for subscription events
- Update user subscription state based on webhook events

#### **Priority 2: Remove Client-Side Purchase Validation**
- Remove unreliable client-to-server purchase calls
- Make webhooks the primary source of truth
- Add receipt validation as backup mechanism

#### **Priority 3: Add Server-Side Receipt Validation**
- Validate purchases with RevenueCat API
- Implement purchase recovery mechanisms
- Add proper error handling and retry logic

### **Alignment with Server-Centric Design Principle**

**Current State:** ❌ Client-heavy, unreliable architecture
**Target State:** ✅ Server-centric, webhook-driven architecture

**Recommendation:** Complete rewrite of mobile purchase flow to follow RevenueCat best practices and server-side logic principle.

### 📊 Usage Analytics Endpoints
**File:** `routes/usage.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/usage/billing-cycle` | GET | Required | Inline | Billing cycle info |
| `/api/usage/words` | GET | Required | Inline | Word usage statistics |
| `/api/usage/history` | GET | Required | Inline | Usage history |

**Dependencies:** `subscriptionController`, `paymentServiceHandler`  
**Data Flow:** Route → Analytics Functions → Database

### 🔍 Debug & Health Check Endpoints
**File:** `routes/debug.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/debug/session` | GET | None | Inline | Session debugging info |
| `/api/debug/env` | GET | None | Inline | Environment information |
| `/api/debug/headers` | GET | None | Inline | Request headers debug |
| `/api/health` | GET | None | Inline | Health check endpoint |

**Dependencies:** Session middleware  
**Security:** Development debugging and monitoring

### ⚙️ Admin Management Endpoints
**File:** `routes/admin.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/admin/import-leaders` | POST | None | `importLeadersFromFile` | Import leaders from JSON |
| `/api/admin/update-leader-images` | POST | None | `updateLeaderImages` | Update leader images |
| `/api/admin/import-training-data` | POST | None | `importTrainingData` | Import training data |
| `/api/admin/update-leaders` | POST | None | Inline | Batch update leaders |
| `/api/admin/stats` | GET | None | Inline | System statistics |

**Dependencies:** `storage`, import utilities  
**Security:** Admin operations, no authentication (should be added)

## Data Flow Architecture

### Request Processing Pipeline
```
Client Request
    ↓
Express Middleware Stack
    ├── CORS Configuration
    ├── Session Management
    ├── JSON/URL Parsing
    └── Route Registration
    ↓
Route-Specific Middleware
    ├── requireAuth (if protected)
    ├── Multer (for uploads)
    └── Raw body (for webhooks)
    ↓
Handler Function
    ├── Input Validation
    ├── Business Logic
    └── Response Generation
    ↓
Dependencies
    ├── Storage Layer
    ├── External APIs
    └── Database Operations
```

### Authentication Flow
```
1. Client → /api/auth/supabase-callback
2. Server validates OAuth token
3. Server creates/updates user in database
4. Server sets req.session.userId
5. Server sends session cookie
6. Client includes cookie in subsequent requests
7. requireAuth middleware validates session
```

### File Upload Flow
```
1. Client → /api/recordings/upload (multipart/form-data)
2. Multer processes file to memory
3. Server creates recording record
4. Background process transcribes audio
5. OpenAI analyzes transcription
6. Results stored in database
```

## Service Dependencies

### External Services
- **Supabase:** OAuth authentication
- **OpenAI:** Audio transcription & analysis
- **Stripe:** Web payment processing
- **RevenueCat:** Mobile payment processing

### Internal Services
- **Storage:** Database abstraction layer
- **PaymentServiceHandler:** Stripe integration
- **RevenueCatHandler:** Mobile payment integration
- **SubscriptionController:** Billing logic
- **SubscriptionPlanService:** Plan configuration

### Database Schema
- **Users:** Profile, authentication, preferences
- **Recordings:** Audio files, transcriptions, analysis
- **Training:** Progress, attempts, statistics
- **Leaders:** Reference data, alternatives cache
- **Subscriptions:** Billing, usage tracking

## Security Analysis

### Authentication Patterns
- ✅ **Unified Middleware:** All routes use shared `requireAuth`
- ✅ **Session Security:** HttpOnly cookies, secure in production
- ⚠️ **Development Endpoints:** `force-login` is a security vulnerability

### Authorization Levels
- **Public:** Auth parameters, leader data, product listings, debug endpoints, admin endpoints
- **Authenticated:** User data, recordings, training, billing
- **Webhook:** Raw body parsing, no authentication

### Input Validation
- **Zod Schemas:** Used in users, training modules
- **Multer Limits:** 10MB file size limit
- **Parameter Validation:** ID parsing, query validation

## Performance Considerations

### Caching Strategy
- **Leader Alternatives:** Cached in database
- **Training Content:** Static JSON files
- **Session Storage:** In-memory store

### Background Processing
- **Audio Analysis:** Asynchronous processing
- **Webhook Handling:** Immediate response, background processing

### Database Optimization
- **Drizzle ORM:** Type-safe database queries
- **Connection Pooling:** Configured in database layer

## Deployment Architecture

### Route Registration Order
1. CORS & Session middleware
2. JSON/URL parsing
3. **API routes** (via `registerAllRoutes`)
4. API catch-all (404 handler)
5. Static file serving

### Environment Configuration
- **Development:** Force-login enabled, detailed logging
- **Production:** Secure cookies, webhook validation

## Recommendations

### Immediate Actions
1. **Remove `force-login`** - Critical security vulnerability
2. **Clean up deprecated endpoints** - Remove `_delete` suffixed routes
3. **Add rate limiting** - Protect against abuse
4. **Implement request validation** - Consistent input validation
5. **Secure admin endpoints** - Add authentication to admin routes
6. **Environment-gate debug endpoints** - Restrict to development only

### Architecture Improvements
1. **Extract shared middleware** - Validation, error handling
2. **Implement caching layer** - Redis for session storage
3. **Add API versioning** - Future-proof API changes
4. **Enhance monitoring** - Request logging, performance metrics

### Security Enhancements
1. **Add CSRF protection** - Prevent cross-site attacks
2. **Implement API keys** - For webhook endpoints
3. **Add request signing** - Verify webhook authenticity
4. **Audit logging** - Track sensitive operations

---

**Total Endpoints:** 70  
**Protected Endpoints:** 43 (61%)  
**Public Endpoints:** 27 (39%)  
**Webhook Endpoints:** 3  
**Deprecated Endpoints:** 0
