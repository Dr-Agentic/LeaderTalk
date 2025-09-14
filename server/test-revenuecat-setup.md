# RevenueCat Testing Setup Guide

## Environment Variables Required

Add these to your `.env` file:

```bash
# RevenueCat Configuration
REVENUECAT_SECRET_KEY=sk_test_your_secret_key_here
REVENUECAT_PUBLIC_KEY=pk_test_your_public_key_here
```

## Getting RevenueCat API Keys

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Navigate to your project
3. Go to **Settings** → **API Keys**
4. Copy the **Secret Key** (starts with `sk_test_` for sandbox)
5. Copy the **Public Key** (starts with `pk_test_` for sandbox)

## Test Commands

Once environment variables are set:

```bash
# Test basic connectivity
tsx server/test-revenuecat.ts test-connection

# Get all available offerings/products
tsx server/test-revenuecat.ts get-offerings

# Test customer lookup (should return null for new email)
tsx server/test-revenuecat.ts get-customer test@example.com

# Create a test customer
tsx server/test-revenuecat.ts create-customer test@example.com

# Check customer subscriptions
tsx server/test-revenuecat.ts get-subscriptions test@example.com
```

## Expected Results

- **test-connection**: Should return ✅ if API keys are valid
- **get-offerings**: Should list your configured products/packages
- **get-customer**: Should return ❌ for non-existent customers
- **create-customer**: Should create new customer successfully

## Troubleshooting

- **401 Unauthorized**: Check your secret key
- **404 Not Found**: Customer doesn't exist (expected for new emails)
- **Network errors**: Check internet connection and RevenueCat status