# Mobile Client API Endpoints Documentation

This document details all API endpoints used by the LeaderTalk mobile client, their usage context, and implementation locations.

## Authentication Endpoints

### `GET /api/auth/auth-parameters`
**Purpose:** Fetch authentication configuration (Supabase URL, RevenueCat keys) without hardcoding credentials  
**Usage:** App initialization to configure auth services  
**Location:** `src/lib/api.ts:16` - `fetchAuthParameters()`  
**Called from:** `app/_layout.tsx:144` - App startup  
**Response:** `{ supabaseUrl, supabaseAnonKey, revenueCatIos, revenueCatAndroid }`

### `POST /api/auth/supabase-callback`
**Purpose:** Handle Supabase authentication callback  
**Usage:** Process auth tokens after login  
**Location:** `src/lib/api.ts:64` - `handleSupabaseCallback()`  
**Called from:** Auth flow completion  
**Payload:** `{ access_token, refresh_token }`

### `POST /api/auth/logout`
**Purpose:** Server-side logout and session cleanup  
**Usage:** User logout action  
**Location:** `src/lib/api.ts:93` - `logout()`  
**Called from:** Logout button/action  
**Response:** `{ success: boolean }`

## Recording Management

### `GET /api/recordings`
**Purpose:** Fetch user's recordings list  
**Usage:** Display recordings in transcripts tab  
**Location:** `src/hooks/useRecordings.ts:29` - `fetchRecordings()`  
**Called from:** `app/(tabs)/transcripts.tsx`, `app/transcripts.tsx`  
**Response:** `Recording[]` with metadata and analysis results

### `POST /api/recordings/upload`
**Purpose:** Upload new audio recording for processing  
**Usage:** Submit recorded audio for transcription and analysis  
**Location:** `src/hooks/useRecordings.ts:63` - `uploadRecording()`  
**Also:** `src/services/recordingService.ts:33` - `uploadRecording()`  
**Called from:** Recording completion flow  
**Payload:** FormData with audio file and metadata

### `GET /api/recordings/{id}`
**Purpose:** Fetch specific recording details  
**Usage:** Display individual recording analysis  
**Location:** `src/services/recordingService.ts:72` - `getRecording()`  
**Called from:** Recording detail views  
**Response:** Full recording object with analysis

### `DELETE /api/recordings/{id}`
**Purpose:** Delete a recording  
**Usage:** Remove recording from user's library  
**Location:** `src/services/recordingService.ts:90` - `deleteRecording()`  
**Called from:** Recording management actions  
**Response:** `{ success: boolean }`

## Training System

### `GET /api/training/modules`
**Purpose:** Fetch available training modules  
**Usage:** Display training content library  
**Location:** `src/services/trainingService.ts:37` - `getTrainingModules()`  
**Called from:** Training/learning sections  
**Response:** `TrainingModule[]` with module metadata

### `GET /api/training/modules/{moduleId}/chapters`
**Purpose:** Get chapters for a specific training module  
**Usage:** Display module content structure  
**Location:** `src/services/trainingService.ts:55` - `getModuleChapters()`  
**Called from:** Module detail views  
**Response:** `Chapter[]` with chapter content

### `GET /api/training/modules/{moduleId}/progress`
**Purpose:** Track user progress through training modules  
**Usage:** Show completion status and resume points  
**Location:** `src/services/trainingService.ts:73` - `getModuleProgress()`  
**Called from:** `app/progress.tsx` - Progress tracking  
**Response:** Progress data with completion percentages

## Mobile Billing (RevenueCat Integration)

### `GET /api/mobile/billing/subscription`
**Purpose:** Get current user subscription status  
**Usage:** Display subscription info on subscription page  
**Location:** `src/hooks/useMobileBilling.ts:32` - `useMobileSubscription()`  
**Called from:** `app/subscription.tsx`  
**Response:** `{ hasSubscription: boolean, subscription: MobileSubscriptionData }`

### `GET /api/mobile/billing/products`
**Purpose:** Fetch available subscription plans  
**Usage:** Display pricing options for purchase  
**Location:** `src/hooks/useMobileBilling.ts:60` - `useMobileProducts()`  
**Called from:** `app/subscription.tsx` - Plan selection  
**Response:** `MobileBillingProduct[]` with pricing and features

### `POST /api/mobile/billing/purchase`
**Purpose:** Process in-app purchase validation  
**Usage:** Complete subscription purchase flow  
**Location:** `src/hooks/useMobileBilling.ts:94` - `useMobilePurchase()`  
**Called from:** `app/subscription.tsx` - Purchase button  
**Payload:** `{ productId, transactionId?, receipt? }`  
**Response:** `{ success: boolean, subscription?: MobileSubscriptionData }`

### `POST /api/mobile/billing/restore`
**Purpose:** Restore previous purchases  
**Usage:** Account recovery and purchase restoration  
**Location:** `src/hooks/useMobileBilling.ts:132` - `useMobileRestore()`  
**Called from:** `app/subscription.tsx` - Restore button  
**Response:** `{ success: boolean, subscription?: MobileSubscriptionData }`

### `POST /api/mobile/billing/cancel`
**Purpose:** Cancel active subscription  
**Usage:** Subscription cancellation flow  
**Location:** `src/hooks/useMobileBilling.ts:166` - `useMobileCancelSubscription()`  
**Called from:** `app/subscription.tsx` - Cancel button  
**Response:** `{ success: boolean }`

## Usage Analytics

### `GET /api/usage/billing-cycle`
**Purpose:** Get current billing cycle usage statistics  
**Usage:** Display word usage and limits on subscription page  
**Location:** `src/hooks/useMobileBilling.ts:209` - `useMobileBillingUsage()`  
**Called from:** `app/subscription.tsx` - Usage display  
**Query Params:** `?cycleId={id}` (optional for historical data)  
**Response:** `{ currentUsage, wordLimit, usagePercentage, hasExceededLimit, billingCycle: { startDate, endDate, daysRemaining } }`

## API Architecture Notes

### URL Configuration
- All endpoints use `${API_URL}` prefix for full server URLs
- `API_URL` is configured per environment (development/production)
- Mobile client requires absolute URLs (not relative paths)

### Authentication
- Most endpoints require `credentials: 'include'` for session-based auth
- Auth parameters endpoint is public (no auth required)
- Mobile billing endpoints use session authentication

### Error Handling
- All endpoints implement proper error handling with try-catch
- React Query provides automatic retry and caching
- User-friendly error messages displayed in UI

### Caching Strategy
- React Query handles response caching automatically
- Subscription data cached for 5 minutes
- Usage data cached for 2 minutes
- Training content cached longer for performance

## Usage Patterns

### Data Fetching
- Uses React Query (`useQuery`) for GET requests
- Uses React Query (`useMutation`) for POST/DELETE requests
- Automatic cache invalidation after mutations

### State Management
- React Query manages server state
- Local component state for UI interactions
- Global auth state through Supabase context

### Performance Optimizations
- Stale-while-revalidate caching
- Background refetching
- Optimistic updates for mutations
- Proper loading and error states
