# LeaderTalk Landing Page

This directory contains the static landing page for leadertalk.app, designed to replace the current Next.js hosted solution and save $300/year in hosting costs.

## Features

- **Exact visual match** to current leadertalk.app design
- **Modern glass morphism design** matching the client app theme
- **Mobile-first responsive** design
- **SEO optimized** with proper meta tags and structured data
- **Fast loading** - optimized CSS and minimal JavaScript
- **Accessibility compliant** (WCAG AA)
- **Contact form integration** with server API

## File Structure

```
landing/
├── index.html          # Main landing page
├── styles.css          # CSS with design tokens from client
├── script.js           # Interactive functionality
├── assets/
│   └── images/         # Landing page images
└── README.md           # This file
```

## Design System

The landing page uses the same design system as the main client application:

- **Colors**: Deep space theme (#0f0f23 background, #8A2BE2 purple, #FF6B6B coral)
- **Typography**: Inter, Libre Franklin, Playfair Display fonts
- **Glass Morphism**: Consistent with client app styling
- **Spacing**: 4pt base spacing system
- **Components**: Matching button styles, cards, and interactions

## Server Integration

The landing page is served through the Express server with domain-based routing:

- `leadertalk.app` → Static landing page
- `app.leadertalk.app` → Client application (Vite/React)

### Route Configuration

Routes are configured in `/server/routes/landing.ts`:

```typescript
// Main domain serves landing page
router.get('/', (req, res) => {
  if (hostname.startsWith('app.')) {
    // Let client app handle app subdomain
    return next();
  }
  // Serve static landing page for main domain
  res.sendFile(landingPagePath);
});
```

## Deployment Instructions

### 1. DNS Configuration

Update DNS settings to point both domains to your server:

```
A     leadertalk.app           → YOUR_SERVER_IP
A     app.leadertalk.app       → YOUR_SERVER_IP
CNAME www.leadertalk.app       → leadertalk.app
```

### 2. Server Configuration

The landing page is automatically served when the server starts. No additional configuration needed.

### 3. SSL Certificate

Ensure SSL certificates cover both domains:
- `leadertalk.app`
- `app.leadertalk.app`
- `www.leadertalk.app`

### 4. Assets Setup

Add the following images to `/server/landing/assets/images/`:

- `favicon.png` - Site favicon (32x32 or 16x16)
- `og-image.png` - Open Graph image for social sharing (1200x630)

### 5. Analytics Configuration

Update Google Analytics ID in `index.html`:

```html
<script>
  gtag('config', 'YOUR_GA_MEASUREMENT_ID');
</script>
```

## Content Sections

The landing page includes all sections from the current site:

1. **Hero Section** - Main value proposition with CTA
2. **About Section** - Company description and mission
3. **Features Section** - Three key features with icons
4. **Testimonials** - Rotating customer testimonials
5. **Contact Form** - Integrated with server API
6. **Footer** - Links and company information

## API Endpoints

### Contact Form

- **Endpoint**: `POST /api/contact`
- **Body**: `{ name, email, message }`
- **Response**: `{ success: boolean, message: string }`

The contact form submissions are logged to the console. In production, implement:
- Email sending (SendGrid, Mailgun, etc.)
- Database storage
- Spam protection (reCAPTCHA)

## Performance Optimizations

- **Critical CSS inlined** for above-the-fold content
- **Font preloading** for faster text rendering
- **Image optimization** with proper caching headers
- **Minimal JavaScript** for fast loading
- **Gzip compression** enabled on server

## SEO Features

- **Meta tags** for title, description, keywords
- **Open Graph** tags for social sharing
- **Twitter Card** support
- **Structured data** for search engines
- **Canonical URLs** to prevent duplicate content
- **Sitemap** generation (add to robots.txt)

## Accessibility Features

- **WCAG AA compliant** color contrast
- **Keyboard navigation** support
- **Screen reader** friendly markup
- **Focus indicators** for interactive elements
- **Alt text** for all images
- **Semantic HTML** structure

## Browser Support

- **Modern browsers** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Mobile browsers** (iOS Safari 14+, Chrome Mobile 90+)
- **Graceful degradation** for older browsers

## Maintenance

### Regular Updates

1. **Content updates** - Edit `index.html` directly
2. **Style changes** - Modify `styles.css`
3. **Functionality** - Update `script.js`
4. **Images** - Replace files in `assets/images/`

### Monitoring

- **Analytics** - Monitor traffic and conversions
- **Performance** - Check Core Web Vitals
- **Uptime** - Monitor server availability
- **Contact form** - Check submission logs

## Cost Savings

**Before**: $25/month Durable.co hosting = $300/year
**After**: $0/month (served from existing server) = $0/year

**Annual Savings**: $300

## Testing

### Local Testing

1. Start the server: `npm run dev`
2. Visit `http://localhost:8080` (adjust port as needed)
3. Test all interactive elements
4. Verify contact form submission

### Production Testing

1. Deploy to server
2. Test both domains work correctly
3. Verify SSL certificates
4. Check mobile responsiveness
5. Test contact form in production

## Troubleshooting

### Common Issues

1. **404 errors** - Check route registration order
2. **CSS not loading** - Verify static file serving
3. **Contact form fails** - Check API endpoint and CORS
4. **Mobile layout issues** - Test responsive breakpoints

### Debug Mode

Enable debug logging in the server to troubleshoot routing issues:

```javascript
console.log(`Landing route accessed - hostname: ${hostname}, url: ${req.url}`);
```

## Future Enhancements

- **Blog integration** - Add `/blog` route
- **A/B testing** - Test different hero messages
- **Lead magnets** - Add downloadable resources
- **Live chat** - Integrate customer support
- **Testimonial management** - Admin interface for testimonials
