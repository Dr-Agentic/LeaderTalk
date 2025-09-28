# Color Mapping Guide

**Purpose:** Map hardcoded colors to semantic theme tokens based on **color proximity** and **functional intent**.

## 🎯 **Mapping Strategy**

### **1. Functional Intent (Primary)**
- **What does this color DO?** → Error, success, disabled, highlight, background, etc.
- **Context matters** → Same hex can map to different tokens based on usage

### **2. Color Proximity (Secondary)**  
- **Visual similarity** → Find closest theme color when function is unclear
- **Opacity preservation** → Maintain transparency levels with appropriate tokens

---

## 📋 **Complete Mapping Table**

### **Primary Brand Colors**
| Hardcoded Color | Theme Token | Usage Context |
|---|---|---|
| `#8A2BE2` | `theme.colors.primary` | Main brand, CTAs, active states |
| `#9A3BE2` | `theme.colors.primaryHover` | Button hover/pressed states |
| `rgba(138, 43, 226, 0.1)` | `theme.colors.glow.faint` | Subtle primary backgrounds |
| `rgba(138, 43, 226, 0.2)` | `theme.colors.glow.subtle` | Primary overlays, gradients |
| `rgba(138, 43, 226, 0.3)` | `theme.colors.glow.medium` | Medium primary effects |
| `rgba(138, 43, 226, 0.4)` | `theme.colors.glow.primary` | Strong primary glows |

### **Status Colors**
| Hardcoded Color | Theme Token | Usage Context |
|---|---|---|
| `#10B981` | `theme.colors.success` | Success messages, checkmarks |
| `#22c55e` | `theme.colors.success` | Alternative success green |
| `#EF4444` | `theme.colors.error` | Error messages, destructive actions |
| `#ef4444` | `theme.colors.error` | Error (lowercase variant) |
| `#F59E0B` | `theme.colors.warning` | Warning messages, caution |
| `#3B82F6` | `theme.colors.info` | Info messages, neutral actions |
| `#60A5FA` | `theme.colors.info` | Lighter info blue |
| `#93C5FD` | `theme.colors.info` | Very light info blue |
| `#DBEAFE` | `theme.colors.info` | Pale info blue |

### **Surface & Background Colors**
| Hardcoded Color | Theme Token | Usage Context |
|---|---|---|
| `#0A0A0A` | `theme.colors.background` | Main app background |
| `#0f0f23` | `theme.colors.background` | Dark background variant |
| `#1A1A1A` | `theme.colors.surface` | Card backgrounds, elevated surfaces |
| `#000000` | `theme.colors.background` | Pure black → semantic background |
| `#FFFFFF` | `theme.colors.foreground` | White text/icons on dark |

### **Text & Foreground Colors**
| Hardcoded Color | Theme Token | Usage Context |
|---|---|---|
| `#FFFFFF` | `theme.colors.foreground` | Primary text, high contrast |
| `rgba(255, 255, 255, 0.9)` | `theme.colors.foreground` | Near-opaque text |
| `rgba(255, 255, 255, 0.7)` | `theme.colors.muted` | Secondary text, captions |
| `rgba(255, 255, 255, 0.5)` | `theme.colors.disabled` | Disabled text, placeholders |
| `rgba(255, 255, 255, 0.3)` | `theme.colors.disabled` | Very dim text |
| `#666666` | `theme.colors.disabled` | Disabled elements |
| `#999999` | `theme.colors.muted` | Muted text (lighter) |

### **Glass Morphism & Effects**
| Hardcoded Color | Theme Token | Usage Context |
|---|---|---|
| `rgba(255, 255, 255, 0.05)` | `theme.colors.glass.light` | Subtle glass backgrounds |
| `rgba(255, 255, 255, 0.1)` | `theme.colors.glass.medium` | Standard glass effects |
| `rgba(255, 255, 255, 0.15)` | `theme.colors.border` | Glass borders, dividers |
| `rgba(255, 255, 255, 0.2)` | `theme.colors.glass.heavy` | Strong glass effects |

### **Overlays & Modals**
| Hardcoded Color | Theme Token | Usage Context |
|---|---|---|
| `rgba(0, 0, 0, 0.3)` | `theme.colors.overlay` | Modal backdrops |
| `rgba(0, 0, 0, 0.5)` | `theme.colors.overlay` | Darker modal backdrops |
| `rgba(0, 0, 0, 0.7)` | `theme.colors.overlay` | Heavy overlays |

### **Accent & Secondary Colors**
| Hardcoded Color | Theme Token | Usage Context |
|---|---|---|
| `#4ECDC4` | `theme.colors.secondary` | Secondary brand color |
| `#FF6B6B` | `theme.colors.accent` | Accent highlights, coral |
| `#FF6B6B` | `theme.colors.coral` | Coral-specific usage |
| `#4ECDC4` | `theme.colors.teal` | Teal-specific usage |

### **Score & Rating Colors**
| Hardcoded Color | Theme Token | Usage Context | Score Range |
|---|---|---|---|
| `#22c55e` | `theme.colors.success` | Good scores, positive ratings | 80-100% |
| `#84cc16` | `theme.colors.success` | Above average (lime variant) | 60-79% |
| `#eab308` | `theme.colors.warning` | Average scores, caution | 40-59% |
| `#f97316` | `theme.colors.warning` | Below average (orange variant) | 20-39% |
| `#ef4444` | `theme.colors.error` | Poor scores, negative ratings | 0-19% |

### **Chart & Data Visualization**
| Hardcoded Color | Theme Token | Usage Context |
|---|---|---|
| `#3B82F6` | `theme.colors.info` | Chart lines, data points |
| `rgba(255, 255, 255, 0.8)` | `theme.colors.foreground` | Chart labels, high contrast |
| `rgba(255, 255, 255, 0.3)` | `theme.colors.disabled` | Chart grid lines, axes |
| `rgba(255, 255, 255, 0.1)` | `theme.colors.border` | Subtle chart borders |

---

## 📊 **Chart Styling Strategy**

### **Victory Charts Theme Pattern**
```typescript
// ✅ CORRECT: Create chart theme object
const chartTheme = useMemo(() => ({
  axis: { stroke: theme.colors.disabled },
  grid: { stroke: theme.colors.border },
  tickLabels: { fill: theme.colors.muted },
  data: { stroke: theme.colors.info },
}), [theme]);

// Usage in Victory components
<VictoryChart theme={chartTheme}>
  <VictoryLine data={data} />
</VictoryChart>
```

### **Score Color Function Pattern**
```typescript
// ✅ CORRECT: Theme-aware score colors
const getScoreColor = useCallback((score: number) => {
  if (score >= 80) return theme.colors.success;
  if (score >= 60) return theme.colors.success; // Could use success variant
  if (score >= 40) return theme.colors.warning;
  if (score >= 20) return theme.colors.warning; // Could use warning variant  
  return theme.colors.error;
}, [theme]);
```

---

### **Same Color, Different Tokens**
```typescript
// ❌ WRONG: One-size-fits-all
'rgba(255, 255, 255, 0.1)' → theme.colors.glass.medium (always)

// ✅ CORRECT: Context-aware mapping
// Progress bar background
'rgba(255, 255, 255, 0.1)' → theme.colors.glass.medium

// Button border  
'rgba(255, 255, 255, 0.1)' → theme.colors.border

// Disabled text
'rgba(255, 255, 255, 0.1)' → theme.colors.disabled
```

### **Gradient Mapping**
```typescript
// ❌ WRONG: Replace with transparent
colors: ['transparent', 'transparent', 'transparent']

// ✅ CORRECT: Map each color semantically
colors: [
  theme.colors.glow.subtle,  // rgba(138, 43, 226, 0.2)
  theme.colors.background,   // #0f0f23
  theme.colors.glow.faint,   // rgba(138, 43, 226, 0.1)
]
```

---

## 🛠 **Implementation Guidelines**

### **Step 1: Identify Function**
1. **What is this color doing?**
   - Showing error? → `theme.colors.error`
   - Disabled state? → `theme.colors.disabled`  
   - Background? → `theme.colors.background` or `theme.colors.surface`
   - Primary action? → `theme.colors.primary`

### **Step 2: Check Proximity**
2. **If function unclear, find closest color:**
   - Red tones → `error` or `accent`
   - Blue tones → `info` or `primary` (if purple-ish)
   - Green tones → `success`
   - Gray/White tones → `muted`, `disabled`, or `foreground`

### **Step 3: Preserve Opacity Intent**
3. **Maintain transparency purpose:**
   - `0.05-0.1` → Subtle backgrounds (`glass.light`, `glass.medium`)
   - `0.2-0.3` → Overlays, effects (`glow.subtle`, `glass.heavy`)
   - `0.5-0.7` → Secondary text, muted content (`muted`, `disabled`)
   - `0.8-0.9` → Near-opaque content (`foreground`)

### **Step 5: Chart & Data Visualization**
5. **For Victory Charts and data viz:**
   - Create `chartTheme` object with `useMemo`
   - Use semantic tokens: `info` for data, `disabled` for axes, `border` for grids
   - Score colors follow 5-tier system: success (80%+), warning (20-79%), error (<20%)

### **Step 6: Dynamic Color Functions**
6. **For score/rating colors:**
   - Use `useCallback` with theme dependency
   - Map score ranges to semantic tokens
   - Avoid hardcoded thresholds in color logic

---

## ⚠️ **Common Mistakes to Avoid**

### **❌ Don't Do This:**
- **Blind regex replacement** → Breaks gradients and functional colors
- **One hex → one token** → Ignores context and usage
- **Replace with transparent** → Destroys visual effects
- **Ignore opacity levels** → Loses subtle design intent

### **✅ Do This Instead:**
- **Manual review each color** → Understand its purpose
- **Context-aware mapping** → Same color can map to different tokens
- **Preserve visual effects** → Gradients, glows, glass effects
- **Test the result** → Verify it looks and functions correctly

---

## 📚 **Quick Reference**

### **Most Common Mappings:**
- `#8A2BE2` → `theme.colors.primary`
- `rgba(255, 255, 255, 0.7)` → `theme.colors.muted`
- `rgba(255, 255, 255, 0.1)` → `theme.colors.glass.medium`
- `rgba(138, 43, 226, 0.2)` → `theme.colors.glow.subtle`
- `#EF4444` → `theme.colors.error`
- `#10B981` → `theme.colors.success`

### **When in Doubt:**
1. **Check the component's purpose** → Error message, success state, etc.
2. **Look at surrounding code** → What is this element trying to communicate?
3. **Test both themes** → Does it work in light and dark mode?
4. **Ask: "What would break if I changed this?"** → Critical vs. decorative

---

*Last updated: September 25, 2025*  
*Use this guide to ensure consistent, semantic color usage across the app.*
