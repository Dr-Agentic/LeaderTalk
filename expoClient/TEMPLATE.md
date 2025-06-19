# LeaderTalk Mobile App Template

This template implements the design specifications from the web client into the Expo mobile app. It provides a consistent look and feel across platforms while optimizing for mobile experiences.

## Design System

The template includes:

- **Dark theme** with glass-like UI elements
- **Gradient accents** for buttons and highlights
- **Custom components** that match the web client's aesthetic
- **Responsive layouts** optimized for mobile devices

## Components

### UI Components

- `Button` - Primary, secondary, outline, and ghost variants with gradient support
- `Card` - Glass-effect cards with various styling options
- `Text` - Typography system with consistent sizing and weights
- `GradientText` - Text with gradient color effects
- `GlassBackground` - Blurred background with gradient overlay

### Layout

The template uses a consistent layout system with:
- Proper spacing between elements
- Safe area handling for different devices
- Scrollable content areas
- Responsive sizing

## Theme Configuration

The theme is defined in `src/styles/theme.js` and includes:

- Color palette with dark mode focus
- Typography scales
- Spacing system
- Border radius values
- Shadow styles

## Usage

Import components from the UI library:

```jsx
import { Button, Card, Text, GradientText } from '../src/components/ui';
```

Use them in your screens:

```jsx
<Card variant="glass">
  <Text variant="h3">Card Title</Text>
  <Text variant="body">Card content goes here</Text>
  <Button title="Action" onPress={() => {}} />
</Card>
```

## Tailwind Integration

The template uses NativeWind (Tailwind CSS for React Native) for styling consistency with the web client. The configuration is in `tailwind.config.js`.
