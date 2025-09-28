# LeaderTalk Server Technical Stack & Architecture

**Documentation Date:** September 28, 2025  
**Git Commit:** `cc91cb19` - "Add logging for subscription status verification"  
**Version:** 1.0

## Core Technology Stack

### Runtime & Framework
- **Runtime**: Node.js with TypeScript (ES Modules)
- **Framework**: Express.js 4.21.2
- **Build System**: ESBuild for production, TSX for development
- **Architecture Pattern**: Handler/Controller/Service separation

### Database Layer
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM 0.39.1 with TypeScript schema
- **Connection**: Connection pooling via `@neondatabase/serverless`
- **Migrations**: Drizzle Kit for schema management
- **Validation**: Zod integration for runtime type safety

### Authentication & Session Management
- **Strategy**: Session-based authentication (not JWT)
- **Session Store**: PostgreSQL in production, Memory in development
- **Session Library**: `express-session` with `connect-pg-simple`
- **OAuth Provider**: Supabase Auth for Google sign-in
- **Security**: HttpOnly cookies, CSRF protection planned, secure production config

## Payment Processing Architecture

### Dual Platform Strategy
- **Web Payments**: Stripe 18.1.1 with full webhook integration
- **Mobile Payments**: RevenueCat V2 API (85% complete)
- **Unified Backend**: Same subscription tables handle both platforms
- **Platform Detection**: Automatic routing based on client headers

### Design Rationale
- **Web**: Stripe for credit card processing and web compliance
- **Mobile**: RevenueCat for App Store/Google Play compliance
- **Unified**: Same database tables, same business logic, platform-aware routing

## AI & External Services

### AI Integration
- **AI Provider**: OpenAI 4.95.1
  - GPT-4o for communication analysis
  - Whisper for speech transcription
- **Processing**: Asynchronous background processing
- **Usage Tracking**: Word count billing integration

### File Processing
- **Upload Handler**: Multer for multipart uploads (10MB limit)
- **Storage**: Memory-based processing, no persistent file storage
- **WebSocket**: WS 8.18.0 for real-time features

## Configuration & Environment Management

### Environment Strategy
- **Configuration**: Centralized config with PROD_ prefix fallback
- **Secrets**: Environment-based with production/development separation
- **Validation**: Required vs optional config with startup validation

### Configuration Pattern
```typescript
function getConfigValue(key: string): string | undefined {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    return process.env[`PROD_${key}`] || process.env[key];
  }
  return process.env[key];
}
```

## Development & Production Architecture

### Development Setup
- **Hot Reloading**: Vite integration for client-side development
- **Database**: Local PostgreSQL or Neon development instance
- **Session Store**: Memory-based for faster development cycles
- **Logging**: Detailed request/response logging with performance metrics

### Production Configuration
- **Static Serving**: Deployment handler for optimized asset serving
- **Session Store**: PostgreSQL-backed persistent sessions
- **Port Strategy**: Single port (5000) for API and client serving
- **Build Process**: TypeScript compilation with ESBuild optimization

## Security Architecture

### Authentication Design Decisions

#### Session-Based Over JWT
- **Rationale**: Unified web/mobile authentication, server-side session control
- **Implementation**: PostgreSQL session store in production, memory in development
- **Security**: HttpOnly cookies prevent XSS, server-side revocation capability

#### Cookie Configuration
```typescript
cookie: {
  secure: isProduction,
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  sameSite: isProduction ? 'none' as const : 'lax' as const,
  path: '/'
}
```

### Security Considerations
- **CSRF Protection**: Planned implementation (see csrf-security-analysis.md)
- **CORS**: Configured for cross-origin requests
- **Error Handling**: Centralized middleware with session context logging

## Database Design Decisions

### ORM Choice: Drizzle Over Prisma/TypeORM
- **Benefits**: TypeScript-first, minimal runtime overhead, SQL-like syntax
- **Schema**: Shared schema between client/server, Zod validation integration
- **Performance**: Direct SQL generation, no query builder overhead

### Connection Management
```typescript
export const pool = new Pool({
  connectionString: config.database.url,
});

export const db = drizzle(pool, { schema });
```

## Service Layer Architecture

### Handler/Controller/Service Pattern
```
Routes → Controllers → Services → Database
```

### Separation of Concerns
- **Routes**: HTTP request/response handling
- **Controllers**: Business logic orchestration
- **Services**: External API integration (OpenAI, Stripe, RevenueCat)
- **Storage**: Database abstraction layer

### Example Service Integration
```typescript
// Route → Controller → Service → External API
app.post('/api/recordings/upload', requireAuth, async (req, res) => {
  const recording = await recordingController.createRecording(req.body);
  await openaiService.transcribeAudio(recording.audioData);
  res.json(recording);
});
```

## Performance & Scalability Considerations

### Connection Pooling
- **Database**: Neon serverless with connection pooling
- **Session Management**: PostgreSQL-backed sessions for horizontal scaling

### Caching Strategy
- **Leader Alternatives**: Database-cached OpenAI responses
- **Training Content**: Static JSON files for fast access
- **Session Storage**: Configurable memory/PostgreSQL based on environment

### Background Processing
- **Audio Analysis**: Asynchronous OpenAI processing
- **Webhook Handling**: Immediate response, background processing

## Monitoring & Observability

### Request Logging
```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});
```

### Error Handling
- **Centralized Middleware**: Comprehensive error context logging
- **Session Context**: User session information in error logs
- **Production Safety**: Sanitized error responses

## Deployment Strategy

### Route Registration Order
1. CORS & Session middleware
2. JSON/URL parsing
3. API routes (via `registerAllRoutes`)
4. API catch-all (404 handler)
5. Static file serving (production only)

### Environment Detection
```typescript
if (app.get("env") === "development") {
  await setupVite(app, server);
} else {
  dph.configureStaticServing(app);
}
```

## Future Architecture Considerations

### Planned Improvements
1. **CSRF Protection**: Full implementation across all endpoints
2. **Rate Limiting**: API abuse prevention
3. **Caching Layer**: Redis for session storage and response caching
4. **API Versioning**: Future-proof API evolution
5. **Enhanced Monitoring**: Request metrics and performance tracking

### Scalability Roadmap
1. **Horizontal Scaling**: Session store externalization complete
2. **Microservices**: Potential service extraction (AI processing, billing)
3. **CDN Integration**: Static asset optimization
4. **Database Optimization**: Query performance and indexing strategy

---

**Total API Endpoints**: 67  
**Authentication Strategy**: Session-based  
**Database**: PostgreSQL with Drizzle ORM  
**Payment Platforms**: Stripe (web) + RevenueCat (mobile)  
**AI Integration**: OpenAI GPT-4o + Whisper
