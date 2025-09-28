# RevenueCat Environment Setup

## Current Status
✅ RevenueCat products configured:
- `com.leadertalk.app.ios.subscription.executive.monthly` ($9.99/month)
- `com.leadertalk.app.ios.subscription.executive.yearly` ($99.99/year)

❌ Missing environment variables for API access

## Required Environment Variables

Set these in your server environment:

```bash
# From RevenueCat Dashboard → Project Settings → API Keys
RC_SECRET_KEY=sk_your_secret_key_here
RC_PROJECT_ID=proj_your_project_id_here
REVENUECAT_IOS_API_KEY=appl_your_ios_api_key_here
```

## How to Get API Keys

1. **Login to RevenueCat Dashboard**: https://app.revenuecat.com
2. **Go to Project Settings** → API Keys
3. **Copy the values:**
   - Secret Key (starts with `sk_`) → `RC_SECRET_KEY`
   - iOS Public Key (starts with `appl_`) → `REVENUECAT_IOS_API_KEY`
4. **Get Project ID** from Project Settings → `RC_PROJECT_ID`

## Test Connection

After setting environment variables:

```bash
cd /Users/Morsy/Documents/dev/LeaderTalk
export RC_SECRET_KEY=sk_your_key_here
export RC_PROJECT_ID=proj_your_project_id
export REVENUECAT_IOS_API_KEY=appl_your_ios_key

# Test the connection
node -e "
const { revenueCatHandler } = require('./server/services/revenueCatPaymentHandler.ts');
revenueCatHandler.testConnection().then(result => {
  console.log('Connection test:', result ? '✅ Success' : '❌ Failed');
}).catch(err => console.error('Error:', err.message));
"
```

## Next Steps

1. Set environment variables
2. Test RevenueCat API connection  
3. Test mobile app purchase flow
4. Configure webhooks (optional for testing)

The code is ready - just needs API credentials!
