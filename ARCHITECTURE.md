# System Architecture

## Overview

The Kosher App Store is a three-tier system designed to provide a secure, private app distribution platform for AOSP Android devices without Google Play Services.

```
┌─────────────────────┐
│   Android Client    │
│  (Kotlin/Compose)   │
└──────────┬──────────┘
           │ HTTPS/JSON
           │
┌──────────▼──────────┐      ┌─────────────────┐
│   Backend API       │◄─────┤  Admin Dashboard│
│ (Node.js/Fastify)   │      │  (Next.js/React)│
└──────────┬──────────┘      └─────────────────┘
           │
           │
┌──────────▼──────────┐      ┌─────────────────┐
│   Supabase DB       │      │  APK Sources    │
│   (PostgreSQL)      │      │  (Web Scraping) │
└─────────────────────┘      └─────────────────┘
```

## Component Architecture

### 1. Backend API (Node.js + TypeScript + Fastify)

#### Layers

**API Layer** (`src/routes/`)
- RESTful endpoints for client and admin
- Request validation using Zod
- Error handling middleware

**Business Logic** (`src/`)
- Device registration and tracking
- App metadata management
- Download token generation
- APK streaming proxy

**Data Access** (`src/config.ts`)
- Supabase client for database operations
- Type-safe queries

**Source Providers** (`src/sources/`)
- Pluggable architecture for APK sources
- Base provider with common functionality
- Implementations for APKMirror, APKPure, Custom Mirror

#### Security Measures

1. **URL Validation**: All source URLs validated against whitelist
2. **Download Tokens**: Short-lived (5 min) signed tokens with HMAC-SHA256
3. **Device Identity**: UUID-based device tracking
4. **APK Validation**: Magic byte checking for ZIP/APK files
5. **HTTPS Enforcement**: All external requests require HTTPS

#### Key Endpoints

**Client API:**
- `POST /api/devices/register` - Register/update device
- `GET /api/apps` - List available apps
- `POST /api/apps/:id/download` - Request download URL
- `GET /api/downloads/:token` - Stream APK with signed token

**Admin API:**
- `GET /api/admin/apps` - List all apps
- `POST /api/admin/apps` - Add app via scraping
- `GET /api/admin/sources` - List APK sources
- `PATCH /api/admin/sources/:id` - Update source config

### 2. Database Schema (Supabase/PostgreSQL)

#### Entity Relationships

```
apps (1) ──< (N) app_versions (N) ──< (1) app_source_versions (N) ──> (1) app_sources
                                    
devices (1) ──< (N) installs (N) ──> (1) apps
devices (1) ──< (N) download_events (N) ──> (1) apps
```

#### Key Tables

**apps**: Core app metadata
- Stores display info, descriptions, icons
- Tracks current version

**app_versions**: Version history
- Links to parent app
- Stores version name/code, checksum

**app_sources**: Configured APK sources
- Name, type, base_url
- Priority ordering (lower = higher priority)
- Enabled/disabled flag

**app_source_versions**: Junction table
- Links versions to sources
- Stores download URLs
- Tracks health status

**devices**: Registered devices
- UUID as primary key (client-generated)
- First/last seen timestamps
- Last known IP

**installs**: Installation tracking
- Links devices to apps
- Tracks installation status

**download_events**: Audit log
- Start/success/failure events
- Error messages
- Timestamp tracking

### 3. Admin Dashboard (Next.js + React + TypeScript)

#### Architecture

**App Router** (`src/app/`)
- Server components for initial render
- Client components for interactivity

**API Client** (`src/lib/api.ts`)
- Type-safe API wrapper
- Centralized error handling

**Components** (`src/components/`)
- Layout: Navigation and tabs
- AddAppModal: Form for adding apps
- Reusable UI components

#### Pages

1. **Apps Tab** (`/`)
   - List view with search capability
   - Add app modal
   - Detail view with versions and sources

2. **Sources Tab** (`/sources`)
   - Source configuration
   - Priority management
   - Enable/disable toggles

### 4. Android Client (Kotlin + Jetpack Compose)

#### Architecture (MVVM)

```
UI Layer (Compose) ──> ViewModel ──> Repository ──> API Client
                                   └──> DeviceIdManager (DataStore)
```

**UI Layer** (`ui/`)
- Jetpack Compose declarative UI
- Material Design 3
- State hoisting pattern

**ViewModel** (`ui/AppsViewModel.kt`)
- UI state management
- Business logic coordination
- Lifecycle-aware

**Repository** (`data/AppRepository.kt`)
- Data operations abstraction
- Error handling
- Coroutines for async operations

**Data Layer** (`data/`)
- Retrofit API client
- DeviceIdManager for persistence
- Data models

#### Key Features

**Device Registration**
- UUID generation on first launch
- Persisted in DataStore
- Sent with all API requests

**App List**
- LazyColumn for efficient scrolling
- Coil for image loading
- Pull-to-refresh

**APK Installation**
- DownloadManager for downloads
- FileProvider for secure file sharing
- PackageInstaller integration

**Security**
- Network Security Config enforces HTTPS
- Cleartext only for localhost (dev)
- No arbitrary URLs accepted

## Security Architecture

### Threat Model

**Protected Against:**
1. Arbitrary APK URLs from clients
2. Path traversal attacks
3. Man-in-the-middle attacks (HTTPS)
4. APK hijacking via file rename
5. Unauthorized admin access (TODO: auth)

**Assumptions:**
1. Supabase credentials kept secret
2. Admin dashboard access controlled (TODO: implement auth)
3. Device IDs are unique but not secret
4. Source domains are trustworthy

### Data Flow: APK Download

1. User taps "Install" in Android app
2. App sends device_id + app_id to backend
3. Backend validates device exists
4. Backend selects best source by priority
5. Backend generates signed download token (5 min TTL)
6. Backend returns token-based URL to app
7. App uses DownloadManager to download
8. Backend validates token
9. Backend streams APK from source to client
10. Backend logs success/failure event

### Security Controls

**Backend:**
- URL whitelist validation
- HMAC-SHA256 signed tokens
- APK magic byte validation
- Device ID format validation
- HTTPS-only source requests

**Android:**
- Network Security Config
- No cleartext in production
- FileProvider for APK sharing
- Package name validation (TODO)

**Database:**
- Prepared statements (Supabase SDK)
- Foreign key constraints
- Cascade deletes
- RLS policies (TODO)

## Scalability Considerations

### Current Limitations

- Single-server backend
- No caching layer
- Synchronous APK streaming
- No CDN for APKs

### Scaling Strategy

**Phase 1: Vertical Scaling**
- Increase backend server resources
- Add Redis for caching
- Connection pooling for database

**Phase 2: Horizontal Scaling**
- Load balancer for multiple backend instances
- Shared cache (Redis cluster)
- Session stickiness not required (stateless)

**Phase 3: CDN & Storage**
- Store popular APKs in object storage (S3, Supabase Storage)
- Serve via CDN
- Fallback to source streaming for less common apps

**Phase 4: Microservices** (if needed)
- Separate scraping service
- Separate download proxy service
- Message queue for async operations

## Source Provider Architecture

### Interface

```typescript
interface SourceProvider {
  name: string;
  type: 'apkmirror' | 'apkpure' | 'custom';
  
  fetchMetadata(packageName: string): Promise<AppMetadata | null>;
  getDownloadUrl(packageName: string, versionCode?: number): Promise<string | null>;
  verifyUrl(url: string): Promise<boolean>;
}
```

### Implementation Pattern

**BaseSourceProvider**: Abstract base class
- Common HTTP fetching
- URL validation
- Error handling

**Concrete Providers**: Implement specific logic
- APKMirrorProvider: Scrapes APKMirror HTML
- APKPureProvider: Scrapes APKPure HTML
- CustomMirrorProvider: Calls custom API

### Adding New Sources

1. Create new class extending `BaseSourceProvider`
2. Implement `fetchMetadata()` and `getDownloadUrl()`
3. Add to factory in `src/sources/index.ts`
4. Add new type to database enum
5. Insert into `app_sources` table

## Deployment Architecture

### Development

```
Localhost:3000 (Backend) ──> Supabase Cloud
Localhost:3001 (Admin)   ──┘
Android Emulator/Device  ──┘
```

### Production

```
                         ┌─> Backend (VPS/Cloud)
Load Balancer (HTTPS) ──┼─> Backend (VPS/Cloud)
                         └─> Backend (VPS/Cloud)
                                 │
                         ┌───────┴────────┐
                         │                │
                   Supabase           Admin Dashboard
                   (Cloud)            (Vercel/Netlify)
```

**Android Clients**: Distributed as APK, installed on devices

## Monitoring & Observability

### Logging Points

1. Device registration
2. App listing requests
3. Download requests
4. Download successes/failures
5. Source fetch attempts
6. Admin operations

### Metrics to Track

- Active devices (daily/monthly)
- Downloads per app
- Source success rates
- API response times
- Error rates

### Recommended Tools

- Application: Sentry, Bugsnag
- Infrastructure: DataDog, New Relic
- Uptime: UptimeRobot, Pingdom
- Database: Supabase built-in monitoring

## Future Enhancements

### High Priority
1. Implement APK scraping for APKMirror/APKPure
2. Add admin authentication (Supabase Auth)
3. Implement APK signature verification
4. Add download progress tracking in Android app
5. Automatic installation after download

### Medium Priority
1. Search and filtering in Android app
2. App categories
3. Update notifications
4. Device management UI in admin
5. Bulk app operations

### Low Priority
1. Multi-language support
2. Dark mode refinements
3. App screenshots
4. User reviews (private)
5. Usage analytics dashboard

## TODOs in Code

Search for `TODO` comments in:
- `backend/src/sources/` - Scraping implementations
- `backend/src/routes/admin/index.ts` - Authentication middleware
- `android-client/app/src/main/res/xml/network_security_config.xml` - Certificate pinning
- `web-admin/` - Authentication, real-time updates

## Contributing Guidelines

1. **Backend**: Add tests for new endpoints and providers
2. **Frontend**: Follow React best practices, use TypeScript strictly
3. **Android**: Follow Material Design guidelines, use Kotlin conventions
4. **Database**: Write migrations, don't modify schema.sql directly
5. **Security**: Always validate input, never trust client data

## License

Specify your license here.

