# Feature Parity TODO: Web App vs Mobile App

**Date Created:** September 27, 2025  
**Based on Commit:** `e24297d` - Add documentation outlining options for handling quote data  
**Analysis Scope:** Complete API endpoint comparison between `/client/` (web) and `/expoClient/` (mobile)

## **🚨 Critical Missing Features in Mobile**

### **Leadership Mentors System (Major Gap)**
- **Web has:** `/api/leaders` (mentor selection), `/api/leaders/{id}/alternatives` (advice)
- **Mobile missing:** No leadership mentor integration at all
- **Impact:** Mobile users can't get personalized leadership advice
- **Priority:** HIGH
- **Effort:** Medium - Need to port existing web components

### **Advanced Training System (Major Gap)**
- **Web has:** 10 training endpoints (chapters, progress, situations, attempts)
- **Mobile has:** Only 3 basic training endpoints
- **Impact:** Mobile users get inferior learning experience
- **Priority:** HIGH
- **Effort:** High - Significant feature development

### **User Profile Management (Medium Gap)**
- **Web has:** `/api/users/me/selected-leaders`, `/api/users/word-usage`
- **Mobile missing:** No user profile/settings management
- **Impact:** No personalization or user preferences
- **Priority:** MEDIUM
- **Effort:** Medium - UI development needed

### **Advanced Usage Analytics (Medium Gap)**
- **Web has:** Historical billing cycles, detailed word usage, current cycle recordings
- **Mobile has:** Only basic current cycle usage
- **Impact:** Mobile users can't track usage trends
- **Priority:** MEDIUM
- **Effort:** Low - API integration mainly

## **🔧 Technical Architecture Gaps**

### **Payment Method Management (Architecture Decision)**
- **Web has:** Full Stripe integration (payment methods, plan changes, previews)
- **Mobile has:** Only RevenueCat app store billing
- **Decision needed:** Should mobile support web-style billing or stay app-store-only?
- **Priority:** TBD
- **Effort:** High if unified, Low if separate systems accepted

### **Development & Debug Tools (Low Priority)**
- **Web has:** Debug session, force-login endpoints
- **Mobile missing:** No development debugging tools
- **Priority:** LOW
- **Effort:** Low - Development utilities

## **📋 Implementation Roadmap**

### **Phase 1: Core Feature Parity (Sprint 1-2)**
- [ ] **Add leadership mentors to mobile**
  - Port `/api/leaders` integration
  - Create mentor selection UI
  - Add advice/alternatives feature
- [ ] **Expand basic training system**
  - Add missing training endpoints
  - Create training progress UI
- [ ] **Add user profile management**
  - Settings screen
  - User preferences

### **Phase 2: Advanced Features (Sprint 3-4)**
- [ ] **Enhanced usage analytics**
  - Historical billing cycle data
  - Detailed usage breakdowns
  - Usage trend charts
- [ ] **Training system completion**
  - Full chapter/situation system
  - Progress tracking
  - Cross-platform sync

### **Phase 3: Technical Improvements (Sprint 5-6)**
- [ ] **Enhanced error handling**
  - Match web's retry logic
  - Better session management
- [ ] **Development tools**
  - Mobile debugging utilities
  - Force-login for development

### **Phase 4: Billing Strategy (Future)**
- [ ] **Billing architecture decision**
  - Evaluate unified vs separate billing
  - Implement chosen approach
- [ ] **Payment method management** (if unified billing chosen)

## **🎯 Success Metrics**

### **Feature Completeness**
- [ ] Mobile has 90%+ of web features
- [ ] No major functionality gaps
- [ ] Consistent user experience across platforms

### **API Parity**
- [ ] Mobile uses equivalent API endpoints
- [ ] Same data available on both platforms
- [ ] Cross-platform data consistency

### **User Experience**
- [ ] Users can switch between platforms seamlessly
- [ ] No feature lock-in to web platform
- [ ] Mobile adoption increases

## **⚠️ Risks & Considerations**

### **Technical Risks**
- **Mobile UI complexity** - Some web features may not translate well to mobile
- **Performance impact** - Adding features may slow mobile app
- **Maintenance burden** - More features = more code to maintain

### **Business Considerations**
- **Development resources** - Significant effort required
- **Platform differences** - Some features may need mobile-specific adaptations
- **User expectations** - Mobile users may prefer simpler experience

### **Architectural Decisions**
- **Billing system unification** - Major technical and business decision
- **Cross-platform sync** - Data consistency challenges
- **Feature prioritization** - Not all web features may be needed on mobile

## **📊 Current State Summary**

**Web App APIs:** 50+ endpoints across 8 categories  
**Mobile App APIs:** 16 endpoints across 6 categories  
**Feature Gap:** Mobile has ~30% of web functionality  
**Priority Focus:** Leadership mentors, training system, usage analytics

## **Next Steps**

1. **Stakeholder review** - Confirm feature priorities and business requirements
2. **Technical planning** - Detailed implementation plans for Phase 1
3. **Resource allocation** - Assign development team and timeline
4. **Architecture decisions** - Resolve billing system strategy
5. **Implementation start** - Begin with highest priority features

---

**Note:** This analysis is based on comprehensive API endpoint comparison conducted on September 27, 2025. Regular updates needed as both platforms evolve.
