# Backend API

Node.js + TypeScript + Fastify backend for the Kosher App Store.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your Supabase credentials:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Service role key (keep secret!)
   - `SUPABASE_ANON_KEY`: Anonymous key
   - `BACKEND_URL`: Your backend URL (for download tokens)

3. **Run database migrations:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the SQL from `../database/schema.sql`

4. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Server will start on `http://localhost:3000`

## Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Client Endpoints (Android app)

- `POST /api/devices/register` - Register a device
- `GET /api/apps` - List all apps
- `POST /api/apps/:appId/download` - Request app download
- `GET /api/downloads/:token` - Download APK with signed token

### Admin Endpoints (Dashboard)

- `GET /api/admin/apps` - List all apps
- `GET /api/admin/apps/:id` - Get app details
- `POST /api/admin/apps` - Add new app
- `POST /api/admin/apps/:id/test-fetch` - Test fetch from sources
- `GET /api/admin/sources` - List sources
- `PATCH /api/admin/sources/:id` - Update source config

## Architecture

### Source Providers

The backend uses a pluggable source provider system:

- **BaseSourceProvider**: Abstract base class with common functionality
- **APKMirrorProvider**: APKMirror scraper (partial implementation)
- **APKPureProvider**: APKPure scraper (partial implementation)
- **CustomMirrorProvider**: For custom APK mirrors

Each provider implements:
- `fetchMetadata(packageName)`: Get app info and versions
- `getDownloadUrl(packageName, versionCode)`: Get download URL
- `verifyUrl(url)`: Verify URL is accessible

### Security Features

- **URL Validation**: All source URLs validated against whitelist
- **Download Tokens**: Short-lived signed tokens for APK downloads
- **Device Tracking**: All downloads logged per device
- **APK Validation**: Magic byte checking for APK files
- **HTTPS Enforcement**: All external requests use HTTPS

### TODOs

The source providers have placeholder implementations. To fully implement:

1. **APKMirror scraping:**
   - Parse search results HTML
   - Navigate to app pages
   - Extract version download links
   - Handle multi-step download flow

2. **APKPure scraping:**
   - Parse app pages
   - Extract version information
   - Get direct download links

3. **Authentication:**
   - Add Supabase Auth middleware to admin routes
   - Implement JWT verification

4. **Rate Limiting:**
   - Add rate limiting to prevent abuse
   - Implement retry logic for source fetching

## Development

- Source providers are in `src/sources/`
- Route handlers are in `src/routes/`
- Utilities are in `src/utils/`
- Type definitions are in `src/types/`

