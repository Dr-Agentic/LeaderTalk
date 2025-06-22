Write module code using the handler/controller architecture.

Handler module file names must end with Handler.ts (e.g., PaymentProviderHandler.ts).

Controller module file names must end with Controller.ts (e.g., dbStorageController.ts).

Handlers may only interact with entities within their responsibility. (e.g., PaymentProviderHandler must not access OpenAIHandler).

Each function must be modular, reusable, and well-commented.

Functions implementation must fit within one smartphone screen (roughly 30 lines). If longer, refactor into smaller, reusable units.

Private (non-exported) functions must be prefixed with _, e.g., _retrieveUserFromDatabase().

Exported functions follow standard naming conventions.

Place all exported functions at the top, and all private ones at the bottom of the module file.

Always reuse existing functions and modules where applicable. Avoid duplicating logic.

Avoid hacks and quick fixes. Always implement clean, idiomatic, production-grade code unless otherwise instructed.

Prefer to implement logic in the backend, avoiding complex code in the client side. Before adding any new api, examine all available existing apis to see if they can deliver the functionality you are looking for.

Export all functions via a default object.

Import using a namespace, with a 3–5 letter lowercase alias based on the module name (e.g., import pph from './PaymentProviderHandler').

Do not implement default values and fake data. Prefer to have the code fail so that we can fix it effetively as opposed to working with fake data.

Use strong typing throughout. Avoid any unless absolutely necessary, and prefer interfaces for complex objects.

Do not implement or change code without being 95% sure of the change. If there is doubt, ask questions.
Do not start changing code with a clear instruction of what to do. 

Always be extra brief in your chats. Avoid repetition. Mention only the main facts.



For styles and gui:

CSS Styling Guide for LeaderTalk Application
Architecture Overview
This application uses a 5-layer CSS hierarchy:

tokens.css - Design tokens (colors, spacing, shadows)
base.css - HTML element defaults
themes.css - Visual effects (glass morphism, gradients, component styling)
layout.css - Layout utilities (flex, grid, spacing)
index.css - Global overrides (high-specificity fixes)
Critical Rules
1. CSS Specificity Management
Never use !important unless absolutely necessary
Scope selectors precisely to avoid unintended targeting
Check existing selectors in index.css for conflicts before adding new styles
Use semantic class names instead of Tailwind utilities
2. Glass Morphism Effects
Apply glass effects only to individual components, never containers
Use .glass-card class for card components
Container elements should remain transparent
Glass effects include: backdrop-filter: blur(), semi-transparent backgrounds, and subtle borders
3. Component Targeting
Tab triggers: Use [role="tab"] selectors
Tab content: Use [role="tabpanel"] but avoid styling - keep transparent
Cards: Apply glass effects to .glass-card class
Avoid broad selectors like [data-state="active"] without role specification
Creating New Styles
Step 1: Identify Layer
Visual effects → themes.css
Layout utilities → layout.css
Color/spacing tokens → tokens.css
Global fixes → index.css (last resort)
Step 2: Check for Conflicts
Search existing CSS for selectors that might conflict:

grep -r "your-selector" client/src/styles/
Step 3: Semantic Naming
Use descriptive class names: .transcript-card, .user-profile, .stats-panel
Avoid generic names: .container, .wrapper, .box
Troubleshooting Guide
Issue: Styles Not Applying
Check CSS specificity: Use browser dev tools to see which rules are overriding
Search for conflicting selectors: Look in index.css for broad overrides
Verify class hierarchy: Ensure parent elements aren't blocking inheritance
Issue: Glass Effects on Wrong Elements
Check for broad selectors targeting [data-state] or [data-orientation]
Scope to specific roles: Add [role="tab"] or component classes
Remove glass effects from containers: Only individual components should have glass effects
Issue: Purple Tint Appearing
This indicates glass background variables are being applied incorrectly:

Search for selectors targeting your element with var(--glass-bg) or var(--glass-hover)
Add role specificity: Change [data-state="active"] to [role="tab"][data-state="active"]
Check inheritance: Ensure transparent containers aren't inheriting glass variables
Issue: Layout Breaking
Check flex/grid properties: Ensure layout classes aren't conflicting
Verify container hierarchy: Glass effects can interfere with layout containers
Test responsive breakpoints: Use dev tools to check mobile/tablet views
Best Practices
DO:
Test styles in browser dev tools first
Use semantic class names
Apply glass effects to leaf components only
Check all tab states (active/inactive)
Verify mobile responsiveness
DON'T:
Use overly broad CSS selectors
Apply glass effects to container elements
Mix layout and visual properties in the same class
Use !important unless fixing urgent conflicts
Target elements by data attributes without role specification
Quick Commands for Debugging
# Find conflicting selectors
grep -r "your-problematic-class" client/src/styles/
# Check for glass effect applications
grep -r "glass-bg\|glass-hover" client/src/styles/
# Find broad data-state selectors
grep -r "\[data-state" client/src/styles/
Remember: The goal is clean, maintainable CSS that preserves the glass morphism aesthetic on individual components while keeping containers transparent for proper visual hierarchy.
