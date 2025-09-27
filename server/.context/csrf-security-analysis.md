# CSRF Security Analysis & Implementation Guide

**Analysis Date:** September 27, 2025  
**Git Commit:** `e6233f47` - "Ensure user subscriptions are created only after the HTTP response is fully sent"  
**Security Assessment Version:** 1.0

## Executive Summary

LeaderTalk's current authentication system is vulnerable to Cross-Site Request Forgery (CSRF) attacks. While partial protection exists via `sameSite: 'lax'` cookies, comprehensive CSRF protection is needed for all state-changing operations. Implementation requires careful consideration of OAuth flows to avoid breaking Supabase/Google authentication.

## CSRF Vulnerability Assessment

### Current Protection Status
- ✅ **Partial Protection:** `sameSite: 'lax'` cookies
- ❌ **Missing:** CSRF tokens for state-changing operations
- ❌ **Missing:** Origin/Referer validation
- ❌ **Missing:** Double-submit cookie pattern

### Attack Surface Analysis

#### High-Risk Endpoints (State-Changing Operations)
```
POST /api/users/delete-account          # Account deletion
POST /api/users/delete-records          # Data deletion
POST /api/billing/subscriptions/create  # Financial transactions
POST /api/billing/subscriptions/cancel  # Subscription changes
POST /api/recordings/upload             # File uploads
PUT  /api/recordings/:id                # Data modification
DELETE /api/recordings/:id              # Data deletion
PATCH /api/users/me                     # Profile changes
POST /api/training/submit               # Progress manipulation
```

#### Medium-Risk Endpoints
```
POST /api/billing/payment-methods/setup     # Payment setup
POST /api/billing/subscription/change       # Plan changes
POST /api/mobile/billing/validate-purchase  # Mobile transactions
```

#### Low-Risk Endpoints (Read-Only)
```
GET /api/users/me                       # Profile viewing
GET /api/recordings                     # Data viewing
GET /api/billing/subscriptions/current  # Status checking
```

## CSRF Attack Scenarios

### Scenario 1: Account Deletion Attack
```html
<!-- Malicious website: evil-site.com -->
<form action="https://app.leadertalk.app/api/users/delete-account" method="POST">
  <input type="hidden" name="confirm" value="yes">
</form>
<script>
  // Auto-submit when user visits page
  document.forms[0].submit();
</script>
```

**Impact:** Complete account deletion without user consent

### Scenario 2: Subscription Manipulation
```html
<!-- Hidden iframe attack -->
<iframe src="https://app.leadertalk.app/api/billing/subscriptions/cancel" 
        style="display:none"></iframe>
```

**Impact:** Unauthorized subscription cancellation, revenue loss

### Scenario 3: Data Exfiltration via Upload
```javascript
// Malicious JavaScript on compromised site
fetch('https://app.leadertalk.app/api/recordings/upload', {
  method: 'POST',
  credentials: 'include',
  body: maliciousFormData
});
```

**Impact:** Unauthorized file uploads, potential data corruption

## Current Authentication Flow Analysis

### Supabase OAuth Integration
```
1. User clicks "Sign in with Google"
2. Redirect to Supabase OAuth endpoint
3. Google authentication & consent
4. Supabase callback with auth code
5. POST /api/auth/supabase-callback
6. Server creates session & sets cookie
7. Client receives session cookie
```

### Critical Integration Points
- **OAuth Callback:** `/api/auth/supabase-callback` (POST)
- **Session Creation:** `req.session.userId = user.id`
- **Cookie Setting:** `leadertalk.sid` with `sameSite: 'lax'`
- **Cross-Origin:** OAuth redirects from `supabase.co` domain

## CSRF Protection Implementation Strategy

### 1. CSRF Token Implementation

#### Token Generation & Storage
```javascript
// Add to session middleware
app.use(session({
  // ... existing config
  genid: () => {
    return {
      sessionId: generateSessionId(),
      csrfToken: crypto.randomBytes(32).toString('hex')
    };
  }
}));

// CSRF middleware
const csrfProtection = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({ 
        error: 'CSRF token validation failed',
        code: 'CSRF_INVALID'
      });
    }
  }
  next();
};
```

#### Client-Side Token Handling
```javascript
// Get CSRF token endpoint
app.get('/api/csrf-token', requireAuth, (req, res) => {
  res.json({ csrfToken: req.session.csrfToken });
});

// Client includes token in requests
fetch('/api/users/delete-account', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify(data)
});
```

### 2. OAuth Flow Protection Strategy

#### Critical Consideration: Supabase Callback
```javascript
// EXEMPT OAuth callback from CSRF protection
app.post('/api/auth/supabase-callback', (req, res, next) => {
  // Skip CSRF for OAuth callback
  req.skipCSRF = true;
  next();
}, csrfProtection, async (req, res) => {
  // OAuth callback logic
});

// Modified CSRF middleware
const csrfProtection = (req, res, next) => {
  if (req.skipCSRF) return next();
  
  // CSRF validation logic
};
```

#### OAuth State Parameter Validation
```javascript
// Enhanced OAuth security
app.post('/api/auth/supabase-callback', async (req, res) => {
  const { state, code } = req.body;
  
  // Validate OAuth state parameter (prevents CSRF on OAuth flow)
  if (!state || !validateOAuthState(state, req.session)) {
    return res.status(400).json({ error: 'Invalid OAuth state' });
  }
  
  // Continue with OAuth processing
});
```

### 3. SameSite Cookie Enhancement

#### Current Configuration
```javascript
cookie: {
  sameSite: 'lax'  // Allows OAuth redirects but not full CSRF protection
}
```

#### Enhanced Configuration
```javascript
cookie: {
  sameSite: 'strict',  // Maximum protection
  secure: true,        // HTTPS only
  httpOnly: true,      // Prevent XSS
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

**⚠️ CRITICAL RISK:** `sameSite: 'strict'` will break OAuth flows from external domains (Supabase/Google)

### 4. Origin Validation Implementation

```javascript
const validateOrigin = (req, res, next) => {
  const allowedOrigins = [
    'https://app.leadertalk.app',
    'https://leadertalk.app',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
  ].filter(Boolean);
  
  const origin = req.get('Origin') || req.get('Referer');
  
  if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    return res.status(403).json({ 
      error: 'Invalid request origin',
      code: 'ORIGIN_INVALID'
    });
  }
  
  next();
};
```

## Implementation Phases

### Phase 1: Foundation (Low Risk)
1. **Add CSRF token generation** to session middleware
2. **Create token endpoint** `/api/csrf-token`
3. **Implement token validation** middleware
4. **Test with non-critical endpoints**

### Phase 2: Critical Endpoints (Medium Risk)
1. **Apply CSRF protection** to high-risk endpoints
2. **Update client-side** to include tokens
3. **Test OAuth flows** thoroughly
4. **Monitor for authentication breaks**

### Phase 3: Full Protection (High Risk)
1. **Enable origin validation**
2. **Consider `sameSite: 'strict'`** with OAuth exemptions
3. **Implement double-submit** cookie pattern
4. **Full security audit**

## OAuth Integration Risks

### Critical Risk: Authentication Flow Breakage

#### Potential Failure Points
1. **Supabase Callback Rejection**
   - CSRF token missing in OAuth redirect
   - Origin validation fails for `supabase.co`
   - `sameSite: 'strict'` blocks cross-site cookies

2. **Google OAuth Disruption**
   - Third-party cookie restrictions
   - Cross-origin request blocking
   - State parameter conflicts

3. **Mobile App Impact**
   - React Native WebView limitations
   - Cookie handling differences
   - Deep link authentication flows

#### Mitigation Strategies
```javascript
// OAuth-aware CSRF exemptions
const oauthExemptions = [
  '/api/auth/supabase-callback',
  '/api/auth/google-callback',
  '/api/auth/oauth/*'
];

const csrfProtection = (req, res, next) => {
  // Skip CSRF for OAuth endpoints
  if (oauthExemptions.some(path => req.path.match(path))) {
    return next();
  }
  
  // Apply CSRF protection
};
```

### Testing Requirements

#### Pre-Implementation Testing
1. **Document current OAuth flow** step-by-step
2. **Test OAuth in development** environment
3. **Verify mobile authentication** works
4. **Create rollback plan** for authentication failures

#### Post-Implementation Validation
1. **OAuth flow regression testing**
2. **Cross-browser compatibility**
3. **Mobile app authentication**
4. **Load testing with CSRF tokens**

## Security Monitoring

### Attack Detection
```javascript
// Log CSRF violations
const csrfProtection = (req, res, next) => {
  if (csrfValidationFails) {
    console.error('CSRF Attack Detected:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      endpoint: req.path,
      timestamp: new Date().toISOString()
    });
    
    // Consider rate limiting the IP
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }
  next();
};
```

### Metrics to Track
- **CSRF token validation failures**
- **OAuth flow completion rates**
- **Authentication error rates**
- **Cross-origin request patterns**

## Rollback Strategy

### Emergency Rollback Plan
1. **Disable CSRF middleware** via feature flag
2. **Revert to `sameSite: 'lax'`** cookies
3. **Remove origin validation**
4. **Monitor authentication recovery**

### Feature Flag Implementation
```javascript
const ENABLE_CSRF = process.env.ENABLE_CSRF_PROTECTION === 'true';

app.use((req, res, next) => {
  if (ENABLE_CSRF) {
    return csrfProtection(req, res, next);
  }
  next();
});
```

## Recommendations

### Immediate Actions (Week 1)
1. **Implement CSRF token generation** and endpoint
2. **Create comprehensive test suite** for OAuth flows
3. **Document current authentication behavior**
4. **Set up monitoring for authentication failures**

### Short-term Implementation (Month 1)
1. **Apply CSRF protection** to high-risk endpoints
2. **Update client applications** to handle tokens
3. **Implement gradual rollout** with feature flags
4. **Monitor authentication success rates**

### Long-term Security (Quarter 1)
1. **Full CSRF protection** across all endpoints
2. **Enhanced origin validation**
3. **Security audit** and penetration testing
4. **Documentation** and team training

## Conclusion

CSRF protection is essential for LeaderTalk's security posture, but implementation must be carefully orchestrated to avoid breaking the critical Supabase/Google OAuth integration. A phased approach with comprehensive testing and rollback capabilities is recommended to ensure both security and authentication reliability.

**Priority Level:** HIGH  
**Implementation Risk:** MEDIUM-HIGH (OAuth integration complexity)  
**Security Impact:** CRITICAL (Account takeover prevention)
