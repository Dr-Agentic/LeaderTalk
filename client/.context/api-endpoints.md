# Web Client API Endpoints Documentation

This document details all API endpoints used by the LeaderTalk web client, their usage context, and implementation locations.

## Authentication & Session Management

### `GET /api/auth/auth-parameters`
**Purpose:** Fetch authentication configuration (Supabase credentials)  
**Usage:** Initialize Supabase client configuration  
**Location:** `src/supabase.ts:13`  
**Called from:** App initialization  
**Response:** `{ supabaseUrl, supabaseAnonKey }`

### `GET /api/auth/force-login`
**Purpose:** Force authentication flow for debugging/development  
**Usage:** Development authentication bypass  
**Location:** `src/components/onboarding/GoogleSignUp.tsx:102`, `src/pages/Login.tsx:57`, `src/lib/queryClient.ts:78,260`  
**Called from:** Login flows and error recovery  
**Response:** Authentication redirect

### `POST /api/auth/supabase-callback`
**Purpose:** Handle Supabase authentication callback  
**Usage:** Process auth tokens after OAuth login  
**Location:** `src/pages/AuthCallback.tsx:50`  
**Called from:** OAuth callback handling  
**Payload:** `{ access_token, refresh_token, ... }`

### `GET /api/auth/logout`
**Purpose:** Server-side logout and session cleanup  
**Usage:** User logout with cache busting  
**Location:** `src/components/Sidebar.tsx:160`  
**Called from:** Logout button  
**Query Params:** `?_=${cacheBuster}` for cache invalidation

### `GET /api/debug/session`
**Purpose:** Debug session state for development  
**Usage:** Development debugging of authentication state  
**Location:** `src/lib/queryClient.ts:12`  
**Called from:** Query client debugging  
**Query Params:** `?t=${timestamp}` for cache busting

## User Management

### `GET /api/users/me`
**Purpose:** Get current user profile and settings  
**Usage:** Display user info, check authentication status  
**Location:** `src/components/AppLayout.tsx:27`, `src/components/onboarding/GoogleSignUp.tsx:30`, `src/pages/Dashboard.tsx:45`  
**Called from:** App layout, user profile sections  
**Response:** User object with profile data and preferences

### `GET /api/users/word-usage`
**Purpose:** Get user's word usage statistics  
**Usage:** Display usage metrics in recording section  
**Location:** `src/components/RecordingSection.tsx:52`  
**Called from:** Recording interface  
**Response:** Word usage data and limits

### `GET /api/users/me/selected-leaders`
**Purpose:** Get user's selected leadership mentors  
**Usage:** Display chosen leaders for personalized advice  
**Location:** `src/pages/TranscriptView.tsx:134`  
**Called from:** Transcript analysis view  
**Response:** Array of selected leader profiles

## Recording Management

### `GET /api/recordings`
**Purpose:** Fetch user's recordings list  
**Usage:** Display recordings in dashboard and transcript views  
**Location:** `src/pages/Dashboard.tsx:49`, `src/pages/AllTranscripts.tsx:48`, `src/components/dashboard/CurrentCycleUsageChart.tsx:214`  
**Called from:** Dashboard, transcript listing pages  
**Response:** `Recording[]` with metadata and analysis

### `GET /api/recordings/{id}`
**Purpose:** Fetch specific recording with full analysis  
**Usage:** Display detailed transcript and leadership insights  
**Location:** `src/pages/TranscriptView.tsx:83`  
**Called from:** Individual transcript view  
**Response:** Complete recording object with analysis data

### `POST /api/recordings/upload`
**Purpose:** Upload audio recording for processing  
**Usage:** Submit recorded audio for transcription and analysis  
**Location:** `src/components/RecordingSection.tsx:366`  
**Called from:** Recording upload flow  
**Payload:** FormData with audio file and metadata

### `GET /api/recordings/current-cycle`
**Purpose:** Get recordings from current billing cycle  
**Usage:** Display current cycle usage in dashboard charts  
**Location:** `src/components/dashboard/WordUsageStats.tsx:25`  
**Called from:** Usage statistics display  
**Response:** Recordings array with word counts for current cycle

## Leadership & Training System

### `GET /api/leaders`
**Purpose:** Fetch available leadership mentors  
**Usage:** Display leader selection and inspiration content  
**Location:** `src/pages/Dashboard.tsx:53`, `src/pages/LeadershipInspirations.tsx:35`  
**Called from:** Leader selection, inspirations page  
**Response:** Array of leader profiles with expertise areas

### `GET /api/leaders/{leaderId}/alternatives`
**Purpose:** Get alternative phrasings from specific leader  
**Usage:** Provide leadership-style suggestions for transcript text  
**Location:** `src/pages/TranscriptView.tsx:687`  
**Called from:** Transcript analysis - alternative suggestions  
**Query Params:** `?text=${encodeURIComponent(instance.text)}`  
**Response:** Alternative phrasings in leader's style

### `GET /api/training/chapters`
**Purpose:** Get available training chapters  
**Usage:** Display training module structure  
**Location:** `src/pages/Training.tsx:21`  
**Called from:** Training overview page  
**Response:** Training chapter hierarchy

### `GET /api/training/progress`
**Purpose:** Get user's training progress  
**Usage:** Track completion status across modules  
**Location:** `src/pages/Training.tsx:27`  
**Called from:** Training progress tracking  
**Response:** Progress data with completion percentages

### `GET /api/training/next-situation-direct`
**Purpose:** Get next recommended training situation  
**Usage:** Provide personalized training recommendations  
**Location:** `src/pages/NextSituation.tsx:64`, `src/pages/Training.tsx:33`  
**Called from:** Training flow navigation  
**Response:** Next situation recommendation

### `GET /api/training/chapters/{chapterId}/modules/{moduleId}`
**Purpose:** Get specific training module content  
**Usage:** Display module details and content  
**Location:** `src/pages/ModuleView.tsx:71`  
**Called from:** Module detail view  
**Response:** Module content and structure

### `GET /api/training/module/{moduleId}/stats`
**Purpose:** Get statistics for specific training module  
**Usage:** Display module completion and performance stats  
**Location:** `src/pages/ModuleView.tsx:78`  
**Called from:** Module statistics view  
**Query Params:** `?chapterId=${chapterId}`  
**Response:** Module performance statistics

### `GET /api/training/chapters/{chapterId}/modules/{moduleId}/situations/{situationId}`
**Purpose:** Get specific training situation content  
**Usage:** Display situation-based training scenarios  
**Location:** `src/pages/SituationView.tsx:87`  
**Called from:** Situation training view  
**Response:** Situation content and scenarios

### `GET /api/training/attempts`
**Purpose:** Get user's training attempt history  
**Usage:** Track training performance and attempts  
**Location:** `src/pages/SituationView.tsx:93`  
**Called from:** Training attempt tracking  
**Response:** Training attempt history and scores

## Billing & Subscription Management

### `GET /api/billing/subscriptions/current`
**Purpose:** Get current subscription status and details  
**Usage:** Display subscription info and manage billing  
**Location:** `src/components/subscription/SecureSubscription.tsx:332`, `src/components/subscription/SubscriptionTimeline.tsx:39`, `src/components/dashboard/BillingCycleHistory.tsx:62`  
**Called from:** Subscription management, billing history  
**Response:** Current subscription with plan details and billing info

### `GET /api/billing/products`
**Purpose:** Fetch available subscription plans  
**Usage:** Display pricing options for plan selection  
**Location:** `src/components/subscription/SecureSubscription.tsx:339`  
**Called from:** Subscription plan selection  
**Response:** Available billing products with pricing

### `GET /api/billing/subscription/scheduled`
**Purpose:** Get scheduled subscription changes  
**Usage:** Display pending plan changes and cancellations  
**Location:** `src/components/subscription/SecureSubscription.tsx:346`  
**Called from:** Subscription management interface  
**Response:** Scheduled changes and effective dates

### `POST /api/billing/subscriptions/update`
**Purpose:** Update subscription plan  
**Usage:** Change subscription tier or billing frequency  
**Location:** `src/components/subscription/SecureSubscription.tsx:353,140`  
**Called from:** Plan change flow  
**Payload:** `{ stripePriceId }`  
**Response:** Updated subscription details

### `POST /api/billing/subscriptions/cancel`
**Purpose:** Cancel active subscription  
**Usage:** Process subscription cancellation  
**Location:** `src/components/subscription/SecureSubscription.tsx:410`  
**Called from:** Cancellation flow  
**Response:** Cancellation confirmation

### `POST /api/billing/subscription/scheduled/cancel`
**Purpose:** Cancel scheduled subscription changes  
**Usage:** Revert pending plan changes  
**Location:** `src/components/subscription/SecureSubscription.tsx:445`  
**Called from:** Cancel scheduled changes  
**Response:** Cancellation confirmation

### `POST /api/billing/subscription/preview`
**Purpose:** Preview subscription change costs  
**Usage:** Show prorated amounts before plan changes  
**Location:** `src/components/subscription/SecureSubscription.tsx:525`  
**Called from:** Plan change preview  
**Payload:** Plan change details  
**Response:** Cost preview and proration details

### `POST /api/billing/subscription/change`
**Purpose:** Execute subscription plan change  
**Usage:** Finalize plan change with payment processing  
**Location:** `src/components/subscription/SecureSubscription.tsx:595`  
**Called from:** Plan change confirmation  
**Payload:** Plan change and payment details  
**Response:** Updated subscription

## Payment Methods

### `GET /api/billing/payment-methods`
**Purpose:** Get user's saved payment methods  
**Usage:** Display and manage payment methods  
**Location:** `src/components/subscription/PaymentMethodSelector.tsx:195`  
**Called from:** Payment method management  
**Response:** Array of payment methods with details

### `POST /api/billing/payment-methods/setup`
**Purpose:** Set up new payment method  
**Usage:** Add new credit card or payment method  
**Location:** `src/components/subscription/PaymentMethodSelector.tsx:202`  
**Called from:** Add payment method flow  
**Payload:** Payment method setup data  
**Response:** Setup confirmation and method details

### `POST /api/billing/payment-methods/set-default`
**Purpose:** Set default payment method  
**Usage:** Change primary payment method for billing  
**Location:** `src/components/subscription/PaymentMethodSelector.tsx:230`  
**Called from:** Payment method selection  
**Payload:** `{ paymentMethodId }`  
**Response:** Update confirmation

## Usage Analytics

### `GET /api/usage/billing-cycle`
**Purpose:** Get current billing cycle usage statistics  
**Usage:** Display word usage, limits, and billing cycle info  
**Location:** `src/components/dashboard/WordUsageStats.tsx:19`, `src/lib/wordLimitChecker.ts:17`  
**Called from:** Dashboard usage display, word limit checking  
**Response:** `{ currentUsage, wordLimit, usagePercentage, hasExceededLimit, billingCycle: { startDate, endDate, daysRemaining } }`

### `GET /api/usage/billing-cycle?monthlyCycles=6`
**Purpose:** Get historical billing cycle data  
**Usage:** Display usage trends and billing history  
**Location:** `src/components/dashboard/BillingCycleHistory.tsx:68`  
**Called from:** Billing cycle history charts  
**Query Params:** `monthlyCycles=6` for 6 months of history  
**Response:** Historical usage data across multiple cycles

### `GET /api/usage/words`
**Purpose:** Get detailed word usage analytics  
**Usage:** Display word usage charts and breakdowns  
**Location:** `src/components/dashboard/CurrentCycleUsageChart.tsx:209`  
**Called from:** Usage analytics dashboard  
**Response:** Detailed word usage statistics

## Static Assets

### `GET /assets/quotes.json`
**Purpose:** Fetch inspirational quotes for dashboard  
**Usage:** Display motivational content  
**Location:** `src/components/dashboard/QuoteDisplay.tsx:16`  
**Called from:** Dashboard quote display  
**Response:** Array of inspirational quotes

## API Architecture Notes

### URL Configuration
- All endpoints use relative URLs (e.g., `/api/...`)
- Web client relies on same-origin requests
- No need for full URLs like mobile client

### Authentication
- Session-based authentication using cookies
- Most endpoints require authentication
- Auth parameters endpoint is public
- Force-login endpoints for development

### Error Handling
- Custom query client with retry logic
- Automatic session refresh on auth errors
- User-friendly error messages in UI
- Development debugging endpoints

### Caching Strategy
- React Query handles response caching
- Cache invalidation after mutations
- Timestamp-based cache busting for critical endpoints
- Background refetching for real-time data

### Performance Optimizations
- Query deduplication
- Background updates
- Optimistic updates for mutations
- Proper loading and error states

## Usage Patterns

### Data Fetching
- React Query (`useQuery`) for GET requests
- React Query (`useMutation`) for POST/PUT/DELETE
- Custom query client with enhanced error handling

### State Management
- React Query for server state
- Local component state for UI
- Global auth state through session management

### Development Features
- Debug session endpoint for troubleshooting
- Force-login for development workflows
- Cache busting for reliable testing

## Key Differences from Mobile Client

### Authentication Flow
- Web uses session-based auth (cookies)
- Mobile uses token-based auth
- Different callback handling mechanisms

### API Endpoints
- Web has more billing/subscription endpoints
- Web includes training system APIs
- Web has payment method management
- Mobile focuses on RevenueCat integration

### Error Handling
- Web has more sophisticated retry logic
- Web includes development debugging tools
- Different session management approaches

### Caching
- Web uses more aggressive caching
- Web has timestamp-based cache invalidation
- Different cache key strategies
