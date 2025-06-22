# Google OAuth Theming Implementation

## Google Account Selector Theming Options

Google's OAuth consent screen and account selector provides limited but effective theming options that we've implemented to match our dark space theme.

## Available Customization Options

### 1. Dark Theme Support
**Parameter**: `theme: 'dark'`
- Applies Google's dark theme to the OAuth consent screen
- Dark background with light text
- Better visual consistency with our deep space theme
- Automatically adjusts button colors and UI elements

### 2. Language Localization
**Parameter**: `hl: 'en'`
- Sets the interface language to English
- Ensures consistent user experience
- Can be changed to other language codes if needed

### 3. Additional OAuth Parameters
Google OAuth supports these additional customization options:

#### Access Control
- `access_type: 'offline'` - Requests refresh token
- `prompt: 'consent'` - Forces consent screen display

#### UI Behavior
- `include_granted_scopes: true` - Incremental authorization
- `state` - Custom state parameter for security

## Implementation Details

### Web Application (Supabase Auth)
```typescript
const { data, error } = await getSupabase().auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: window.location.origin + "/auth/callback",
    queryParams: {
      access_type: "offline",
      prompt: "consent",
      theme: "dark",        // Dark theme for account selector
      hl: "en",            // English language
    },
  },
});
```

### Mobile Application (React Native/Expo)
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo,
    skipBrowserRedirect: true,
    queryParams: {
      theme: 'dark',       // Dark theme for mobile OAuth
      hl: 'en',           // English language
    },
  },
});
```

## Visual Impact

### Before Implementation
- Google's default light theme with white background
- Jarring contrast when transitioning from our dark app
- Inconsistent visual experience

### After Implementation
- Dark background matching our space theme
- Smooth visual transition from app to OAuth flow
- Professional, cohesive user experience

## Limitations

Google's OAuth theming has intentional limitations for security and branding reasons:

### Cannot Customize:
- Background colors beyond light/dark theme
- Button colors (Google maintains brand consistency)
- Layout or positioning of elements
- Custom logos or branding on the consent screen

### Can Customize:
- Light/dark theme selection
- Language localization
- Prompt behavior and consent flow
- Redirect handling and state management

## Browser Compatibility

The dark theme parameter is supported across all modern browsers:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Security Considerations

All theming parameters are client-side only and don't affect:
- OAuth security mechanisms
- Token generation or validation
- Redirect URI validation
- Scope permissions

## Testing

To verify the dark theme implementation:
1. Navigate to the login page
2. Click "Sign in with Google"
3. Observe the OAuth consent screen uses dark theme
4. Verify smooth visual transition back to the app

The implementation provides the best possible visual consistency within Google's security and branding constraints.