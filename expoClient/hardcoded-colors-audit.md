# Hardcoded Colors Audit - ExpoClient App

| Filename | Hardcoded Color | Proposed Theme Color |
|----------|----------------|---------------------|
| `src/components/ui/Button.tsx` | `#8A2BE2` | `var(--color-primary)` |
| `src/components/ui/Button.tsx` | `#FF6B6B` | `var(--color-accent)` |
| `src/components/ui/Button.tsx` | `#7B1FA2` | `var(--color-primary-dark)` |
| `src/components/ui/Button.tsx` | `white` | `var(--color-text-inverse)` |
| `src/components/ThemedView.tsx` | `#121212` | `var(--color-surface-dark)` |
| `src/components/ThemedView.tsx` | `#ff0f0f` | `var(--color-surface-light)` |
| `src/components/ThemedText.tsx` | `#ffffff` | `var(--color-text-primary)` |
| `src/components/ThemedText.tsx` | `#000000` | `var(--color-text-primary)` |
| `constants/Colors.ts` | `#0070f3` | `var(--color-primary)` |
| `constants/Colors.ts` | `#000` | `var(--color-text-primary)` |
| `constants/Colors.ts` | `#fff` | `var(--color-text-inverse)` |
| `constants/Colors.ts` | `#121212` | `var(--color-surface-dark)` |
| `constants/Colors.ts` | `#ccc` | `var(--color-text-muted)` |
| `src/styles/theme.js` | `#0f0f23` | `var(--color-background)` |
| `src/styles/theme.js` | `#ffffff` | `var(--color-text-primary)` |
| `src/styles/theme.js` | `#8A2BE2` | `var(--color-primary)` |
| `src/styles/theme.js` | `#e11d48` | `var(--color-destructive)` |
| `src/styles/theme.js` | `#3b82f6` | `var(--color-chart-1)` |
| `src/styles/theme.js` | `#22c55e` | `var(--color-chart-2)` |
| `src/styles/theme.js` | `#f59e0b` | `var(--color-chart-3)` |
| `src/styles/theme.js` | `#8b5cf6` | `var(--color-chart-4)` |
| `src/styles/theme.js` | `#ec4899` | `var(--color-chart-5)` |
| `app/_layout.tsx` | `#0f0f23` | `var(--color-background)` |
| `app/_layout.tsx` | `#8A2BE2` | `var(--color-primary)` |
| `app/_layout.tsx` | `#fff` | `var(--color-text-inverse)` |

**Total Violations: 25 hardcoded colors**

**Recommendation: Complete CSS architecture rebuild required (>20 violations detected)**
