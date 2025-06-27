# Assets Organization Guide

## Structure

```
public/assets/
├── images/
│   ├── brand/          # Company logos and branding
│   ├── leaders/        # Leadership figure portraits
│   └── icons/          # UI icons and interface elements
├── audio/              # Training audio and sound effects
├── videos/             # Training videos and demonstrations
├── documents/          # JSON data, guides, and references
└── index.json          # Asset catalog and usage guide
```

## Usage Guidelines

### Web Client (./client)
Use direct URL references in components:
```javascript
// Example usage
<img src="/assets/images/brand/leadertalk-logo.png" alt="LeaderTalk" />
<img src="/assets/images/leaders/abraham-lincoln.svg" alt="Abraham Lincoln" />
```

### Expo Client (./expoClient)
Use Metro bundler resolution with imports:
```javascript
// Example usage
import logo from '../public/assets/images/brand/leadertalk-logo.png';
import lincolnPortrait from '../public/assets/images/leaders/abraham-lincoln.svg';

<Image source={logo} />
<Image source={lincolnPortrait} />
```

## Asset Naming Convention

- Use kebab-case for all filenames
- Include descriptive suffixes where needed
- Examples:
  - `leadertalk-logo.png` (main logo)
  - `leadertalk-logo-no-label.png` (icon version)
  - `abraham-lincoln.svg` (leader portrait)
  - `icon-microphone-24.svg` (UI icon with size)

## Organization Benefits

1. **Shared Assets**: Both web and mobile clients access the same files
2. **Version Control**: Single source of truth for all visual assets
3. **Performance**: Optimized bundling and caching strategies
4. **Scalability**: Easy to add new asset types and categories
5. **Maintainability**: Clear organization and naming conventions