# Complete Setup Guide - Kosher App Store

This guide walks you through setting up all components of the Kosher App Store system.

## Prerequisites

### Backend
- Node.js 18+ and npm
- Supabase account (free tier is fine)

### Admin Dashboard
- Node.js 18+ and npm

### Android Client
- Android Studio Hedgehog (2023.1.1) or later
- Android SDK 23+
- JDK 17

## Step 1: Database Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com and sign up/log in
2. Click "New Project"
3. Choose an organization and set:
   - Project name: `kosher-appstore`
   - Database password: (generate a strong password)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 1.2 Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `database/schema.sql`
4. Paste into the editor and click "Run"
5. Verify success (you should see "Success. No rows returned")

### 1.3 Get API Credentials

1. In Supabase dashboard, go to **Project Settings** → **API**
2. Note down:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` `public` key
   - `service_role` `secret` key (keep this secret!)

## Step 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

### 2.2 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# From Supabase dashboard
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# Server config
PORT=3000
NODE_ENV=development

# Generate a random secret (use: openssl rand -hex 32)
API_SECRET=your_random_secret_here

# Backend URL (for download tokens)
BACKEND_URL=http://localhost:3000
```

### 2.3 Start Backend Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

### 2.4 Verify Backend is Running

Open http://localhost:3000/health in your browser. You should see:
```json
{"status":"ok","timestamp":"..."}
```

## Step 3: Admin Dashboard Setup

### 3.1 Install Dependencies

```bash
cd web-admin
npm install
```

### 3.2 Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Point to your backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase (optional, for future auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3.3 Start Dashboard

**Development:**
```bash
npm run dev
```

Open http://localhost:3001 (or the port shown in terminal)

**Production:**
```bash
npm run build
npm start
```

### 3.4 Test Adding an App

1. Open the dashboard at http://localhost:3001
2. Click "Add App"
3. Try adding a test app:
   - Enter: `com.android.chrome` (package name)
   - Or: A Google Play URL like `https://play.google.com/store/apps/details?id=com.android.chrome`
4. Click "Add App"

**Note:** The scraping providers (APKMirror, APKPure) are stubs. They will return "not implemented" errors. To test the full flow, you'll need to implement the scraping logic (see backend README) or use a custom mirror.

## Step 4: Android Client Setup

### 4.1 Open in Android Studio

1. Launch Android Studio
2. Select **File** → **Open**
3. Navigate to `android-client` directory
4. Click **OK**
5. Wait for Gradle sync to complete (may take several minutes on first run)

### 4.2 Configure Backend URL

Edit `android-client/app/build.gradle.kts`:

**For Android Emulator:**
```kotlin
buildConfigField("String", "API_URL", "\"http://10.0.2.2:3000\"")
```

**For Physical Device:**
1. Find your computer's local IP:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
2. Update to:
```kotlin
buildConfigField("String", "API_URL", "\"http://YOUR_IP:3000\"")
```

Example: `http://192.168.1.100:3000`

### 4.3 Sync Gradle

Click **File** → **Sync Project with Gradle Files**

### 4.4 Run the App

1. Connect an Android device via USB (with USB debugging enabled)
   - OR start an Android emulator (API 23+)
2. Click the green **Run** button (or press Shift+F10)
3. Select your device
4. Wait for app to build and install

### 4.5 First Run

When the app launches:
- It generates a random device ID
- Registers with the backend
- Loads the app list from backend
- Shows device ID at bottom of screen

## Step 5: Testing the Complete Flow

### 5.1 Add a Test App (Using Custom Mirror Stub)

Since APKMirror/APKPure scrapers are not fully implemented, we'll test with direct database insertion:

1. Go to Supabase dashboard → **SQL Editor**
2. Run this query to add a test app:

```sql
-- Insert test app
INSERT INTO apps (package_name, display_name, short_description, icon_url, current_version_name, current_version_code)
VALUES (
  'com.example.testapp',
  'Test App',
  'A test application for the app store',
  'https://via.placeholder.com/512',
  '1.0.0',
  1
);

-- Get the app ID (note it down)
SELECT id, display_name FROM apps WHERE package_name = 'com.example.testapp';

-- Insert a version
INSERT INTO app_versions (app_id, version_name, version_code)
VALUES (
  'YOUR_APP_ID_FROM_ABOVE',  -- Replace with actual app ID
  '1.0.0',
  1
);

-- Get the version ID
SELECT id FROM app_versions WHERE app_id = 'YOUR_APP_ID_FROM_ABOVE';

-- Get a source ID (use APKPure or custom)
SELECT id, name FROM app_sources WHERE enabled = true;

-- Link version to source with a dummy download URL
-- NOTE: This URL must be HTTPS and from an allowed domain
INSERT INTO app_source_versions (app_version_id, app_source_id, download_url, last_checked_at, last_status)
VALUES (
  'YOUR_VERSION_ID_FROM_ABOVE',  -- Replace with actual version ID
  'YOUR_SOURCE_ID_FROM_ABOVE',   -- Replace with actual source ID
  'https://apkpure.com/example.apk',  -- Dummy URL (won't work but validates)
  NOW(),
  'ok'
);
```

### 5.2 View App in Dashboard

1. Open admin dashboard at http://localhost:3001
2. You should see your test app in the list
3. Click "Details" to view full information

### 5.3 View App on Android

1. Open the Android app
2. Pull down to refresh (or tap refresh icon)
3. Your test app should appear in the list

### 5.4 Test Download Flow (Will Fail Without Real APK)

1. Tap "Install" on the test app
2. The app will:
   - Call backend to request download
   - Backend creates a signed download token
   - Returns download URL to app
   - App uses DownloadManager to download
3. **Note:** The download will fail because the URL doesn't point to a real APK

## Step 6: Production Deployment

### 6.1 Backend Deployment

**Option A: Deploy to a VPS (DigitalOcean, AWS EC2, etc.)**

1. Clone repository to server
2. Install Node.js 18+
3. Set environment variables
4. Run:
```bash
cd backend
npm install --production
npm run build
npm start
```

5. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start dist/index.js --name kosher-appstore-backend
pm2 save
pm2 startup
```

6. Set up reverse proxy (nginx) for HTTPS

**Option B: Deploy to Vercel/Railway/Render**

Most Node.js hosting platforms support deploying the backend. Update environment variables in their dashboard.

### 6.2 Admin Dashboard Deployment

**Deploy to Vercel:**

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd web-admin
vercel
```

3. Set environment variables in Vercel dashboard
4. Update `NEXT_PUBLIC_API_URL` to your production backend URL

### 6.3 Android Production Build

1. Update backend URL in `app/build.gradle.kts`:
```kotlin
buildConfigField("String", "API_URL", "\"https://your-production-backend.com\"")
```

2. Generate signed APK:
   - **Build** → **Generate Signed Bundle / APK**
   - Create/select a keystore
   - Choose "release" build variant
   - Build

3. Distribute the APK to your devices

## Security Checklist

Before going to production:

- [ ] Update all environment variables with production values
- [ ] Change `API_SECRET` to a strong random value
- [ ] Enable HTTPS on backend (use Let's Encrypt)
- [ ] Update Android network security config to remove localhost cleartext
- [ ] Consider adding certificate pinning in Android app
- [ ] Implement authentication for admin dashboard
- [ ] Review Supabase RLS policies
- [ ] Set up monitoring and error logging
- [ ] Implement rate limiting on backend

## Troubleshooting

### Backend won't start
- Check that Supabase credentials are correct
- Verify Node.js version (18+)
- Check port 3000 is not in use: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)

### Android app can't connect to backend
- Verify backend is running and accessible
- Check backend URL in `build.gradle.kts`
- For emulator, use `10.0.2.2` instead of `localhost`
- For physical device, ensure both are on same network
- Check firewall settings

### Apps not showing in Android app
- Check backend logs for errors
- Verify apps exist in database
- Check device registration succeeded
- Use Logcat in Android Studio to see app logs

### Download fails
- The test URLs are fake - you need real APKs
- Implement APKMirror/APKPure scrapers OR
- Set up a custom mirror with real APK files
- Verify URLs are HTTPS and from allowed domains

## Next Steps

1. **Implement APK Source Scrapers:**
   - See `backend/src/sources/` for stub implementations
   - APKMirror and APKPure need web scraping logic
   - Or set up your own custom mirror

2. **Add Authentication:**
   - Implement Supabase Auth in admin dashboard
   - Add auth middleware to admin API routes

3. **Enhance Android App:**
   - Add download progress indicator
   - Implement automatic installation prompts
   - Add update checking for installed apps
   - Implement search and filtering

4. **Monitoring & Analytics:**
   - Add error tracking (Sentry, Bugsnag)
   - Implement download analytics
   - Set up uptime monitoring

## Support

For issues:
1. Check the README in each component directory
2. Review TODO comments in the code
3. Check Supabase logs for database issues
4. Review backend logs for API errors
5. Use Android Studio Logcat for app issues

