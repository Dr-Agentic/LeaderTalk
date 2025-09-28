# LeaderTalk App Store Submission Checklist

## ✅ Completed Items

### Technical Setup
- [x] EAS CLI installed and configured
- [x] Production environment variables set (.env)
- [x] eas.json configuration created
- [x] iOS bundle identifier set: com.leadertalk.app
- [x] Android package name set: com.leadertalk.app
- [x] Permissions configured (microphone, camera)
- [x] App icons and splash screen assets present

### App Configuration
- [x] App name: LeaderTalk
- [x] Version: 1.0.0
- [x] Bundle ID: com.leadertalk.app
- [x] Orientation: Portrait
- [x] Tablet support enabled

## 🔄 Next Steps Required

### 1. Apple Developer Account Setup
```bash
# You need to:
# - Have an active Apple Developer Program membership ($99/year)
# - Create App Store Connect app listing
# - Generate signing certificates and provisioning profiles
```

### 2. App Store Connect Configuration
- [ ] Create new app in App Store Connect
- [ ] Set app metadata:
  - [ ] App description
  - [ ] Keywords
  - [ ] Support URL
  - [ ] Marketing URL
  - [ ] Privacy Policy URL
  - [ ] Category: Business or Productivity
  - [ ] Age rating
  - [ ] Pricing (Free/Paid)

### 3. Required Screenshots (iOS)
- [ ] iPhone 6.7" (iPhone 15 Pro Max): 1290x2796 pixels
- [ ] iPhone 6.5" (iPhone 14 Plus): 1242x2688 pixels  
- [ ] iPhone 5.5" (iPhone 8 Plus): 1242x2208 pixels
- [ ] iPad Pro 12.9" (6th gen): 2048x2732 pixels
- [ ] iPad Pro 12.9" (2nd gen): 2048x2732 pixels

### 4. Legal Requirements
- [ ] Privacy Policy (required for App Store)
- [ ] Terms of Service
- [ ] Data usage disclosure
- [ ] Third-party SDK disclosures

### 5. Build and Submit Commands

#### Development Build (for testing)
```bash
eas build --platform ios --profile development
```

#### Production Build
```bash
eas build --platform ios --profile production
```

#### Submit to App Store
```bash
eas submit --platform ios
```

### 6. App Store Review Preparation
- [ ] Test app thoroughly on physical devices
- [ ] Prepare demo account (if login required)
- [ ] Review Apple's App Store Review Guidelines
- [ ] Ensure app works without network (offline gracefully)
- [ ] Test all user flows and edge cases

## 📋 App Store Metadata Template

### App Description
```
LeaderTalk - AI-Powered Communication Coaching

Transform your leadership and speaking skills with intelligent, personalized coaching. LeaderTalk uses advanced AI to analyze your speech patterns, provide real-time feedback, and help you develop confident communication skills.

Features:
• Speech analysis and coaching
• Leadership style emulation
• Interactive training modules
• Progress tracking and insights
• Personalized practice scenarios

Perfect for executives, managers, public speakers, and anyone looking to improve their communication impact.
```

### Keywords
```
leadership, communication, speech coaching, public speaking, AI coach, presentation skills, business communication, executive coaching, speaking confidence, voice training
```

### Support Information
- Support URL: https://app.leadertalk.app/support
- Privacy Policy: https://app.leadertalk.app/privacy
- Terms of Service: https://app.leadertalk.app/terms

## 🚀 Ready to Build?

Once you have:
1. Apple Developer account active
2. App Store Connect app created
3. Screenshots prepared
4. Legal documents ready

Run these commands:
```bash
# Build for production
eas build --platform ios --profile production

# Submit to App Store (after build completes)
eas submit --platform ios
```

## 📱 Testing Before Submission

### Internal Testing
```bash
# Build for internal distribution
eas build --platform ios --profile preview
```

### TestFlight Beta Testing
- Upload build to TestFlight
- Add internal testers
- Collect feedback before public release

## 🔍 Common Rejection Reasons to Avoid

1. **Incomplete Information** - Ensure all metadata is complete
2. **Broken Links** - Test all URLs in app description
3. **Missing Privacy Policy** - Required for all apps
4. **Crashes** - Test thoroughly on multiple devices
5. **Misleading Screenshots** - Screenshots must represent actual app functionality
6. **Inappropriate Content** - Follow content guidelines
7. **Spam** - Avoid keyword stuffing in description

## 📞 Need Help?

- Expo Documentation: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/
- App Store Guidelines: https://developer.apple.com/app-store/review/guidelines/
