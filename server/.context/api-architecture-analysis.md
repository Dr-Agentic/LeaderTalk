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
└── subscriptions.ts   # Legacy subscription endpoints (deprecated)
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

### 📱 Mobile Billing Endpoints (RevenueCat)
**File:** `routes/mobile-billing.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/mobile/billing/subscription` | GET | Required | `getMobileUserSubscription` | Current mobile subscription |
| `/api/mobile/billing/products` | GET | Required | `getMobileBillingProducts` | Available mobile products |
| `/api/mobile/billing/validate-purchase` | POST | Required | `validateMobilePurchase` | Validate app purchase |
| `/api/mobile/billing/webhooks/revenuecat` | POST | None | Inline | RevenueCat webhook |

**Dependencies:** `mobileSubscriptionController`, RevenueCat API  
**Data Flow:** Route → RevenueCat API → Database

### 📊 Usage Analytics Endpoints
**File:** `routes/usage.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/usage/billing-cycle` | GET | Required | Inline | Billing cycle info |
| `/api/usage/words` | GET | Required | Inline | Word usage statistics |
| `/api/usage/history` | GET | Required | Inline | Usage history |

**Dependencies:** `subscriptionController`, `paymentServiceHandler`  
**Data Flow:** Route → Analytics Functions → Database

### 🗑️ Legacy Endpoints (Deprecated)
**File:** `routes/subscriptions.ts`

| Endpoint | Method | Auth | Handler | Purpose |
|----------|--------|------|---------|---------|
| `/api/current-subscription_delete` | GET | Required | Inline | **DEPRECATED** |
| `/api/subscription-plans_delete` | GET | None | Inline | **DEPRECATED** |
| `/api/stripe-products_delete` | GET | None | Inline | **DEPRECATED** |
| `/api/create-stripe-subscription_delete` | POST | Required | Inline | **DEPRECATED** |

**Status:** Marked for deletion, replaced by `/api/billing/*` endpoints

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
- **Public:** Auth parameters, leader data, product listings
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

**Total Endpoints:** 67  
**Protected Endpoints:** 45 (67%)  
**Public Endpoints:** 22 (33%)  
**Webhook Endpoints:** 3  
**Deprecated Endpoints:** 4
