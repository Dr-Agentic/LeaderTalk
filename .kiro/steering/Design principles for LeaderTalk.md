---
inclusion: always
---

# LeaderTalk Development Guidelines

## Architecture Patterns

### Handler/Controller Pattern
- Handler files: `*Handler.ts` (e.g., `PaymentProviderHandler.ts`)
- Controller files: `*Controller.ts` (e.g., `dbStorageController.ts`)
- Handlers only interact within their domain responsibility
- Export functions via default object, import with 3-5 letter namespace alias

### Function Standards
- Max 30 lines per function (smartphone screen limit)
- Private functions prefixed with `_` (e.g., `_retrieveUserFromDatabase()`)
- Exported functions at top, private at bottom
- Strong typing throughout, avoid `any`
- No default/fake data - prefer failures for proper debugging

### Backend-First Approach
- Implement logic server-side when possible
- Check existing APIs before creating new ones
- Reuse existing functions and modules

## CSS Architecture

### 5-Layer Hierarchy
1. `tokens.css` - Design tokens (colors, spacing, shadows)
2. `base.css` - HTML element defaults  
3. `themes.css` - Visual effects (glass morphism, gradients)
4. `layout.css` - Layout utilities (flex, grid, spacing)
5. `index.css` - Global overrides (last resort)

### Glass Morphism Rules
- Apply `.glass-card` only to leaf components, never containers
- Keep containers transparent for proper visual hierarchy
- Use `[role="tab"]` selectors for tab triggers
- Avoid broad `[data-state]` selectors without role specification

### CSS Conflict Resolution
1. **Diagnostic**: Use DevTools to identify overriding rules
2. **Root Cause**: Look for aggressive selectors (`html body`, `[class*="..."]`)
3. **Fix Strategy**: 
   - Remove `html body` prefixes
   - Use semantic classes over complex attribute selectors
   - Scope glass effects to specific components
4. **Validation**: Test changes, verify no new conflicts

### Naming Conventions
- Semantic classes: `.transcript-card`, `.user-profile`, `.stats-panel`
- Avoid generic: `.container`, `.wrapper`, `.box`
- Never use `!important` unless absolutely necessary

## Code Quality Standards
- Production-grade code only, no hacks or quick fixes
- Ask questions when uncertain (95% confidence rule)
- Be concise in communication, avoid repetition
- Test responsiveness and all component states