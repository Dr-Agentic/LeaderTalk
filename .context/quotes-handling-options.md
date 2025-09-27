# Quotes Handling Options

## Current Issue
`quotes.json` is stuck in `attached_assets/` due to vite config restrictions. Need to move it to proper server-side location.

## Option A: API Endpoint (RECOMMENDED)
**Implementation:**
- Move: `quotes.json` → `server/data/quotes.json`
- Add: `/api/quotes` Express endpoint
- Update: `QuoteDisplay.tsx` to use React Query fetch

**Benefits:**
- Consistent with existing API patterns (`/api/training/*`, `/api/recordings/*`)
- Enables future enhancements (user preferences, analytics, dynamic quotes)
- Proper separation: data as server resources vs UI assets
- Aligns with current architecture using React Query for data fetching

## Option B: Static File Serving
**Implementation:**
- Move: `quotes.json` → public directory
- Serve via Express static middleware at `/quotes.json`
- Update: `QuoteDisplay.tsx` to fetch from static path

**Benefits:**
- Simpler implementation
- Traditional static file approach
- No server processing needed

## World-Class Analysis
**Recommended Choice: Option A**

**Architecture Reasoning:**
- Quotes are content data, not UI assets (like Google logo)
- Existing pattern: all data flows through `/api/*` endpoints
- Future-proof: enables personalization, tracking, dynamic content
- Consistency: matches training chapters, leaders data handling

**Evidence from Codebase:**
- Training data served via `/api/training/chapters`
- Leaders data imported into database, served via APIs
- React Query used throughout for data fetching
- Clear separation: `server/data/` for content, `client/src/assets/` for UI resources