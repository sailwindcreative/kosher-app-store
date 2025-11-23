# Local Testing Guide

## ✅ System Status

Your Kosher App Store is running locally!

### Running Services

| Service | Port | URL | Status |
|---------|------|-----|--------|
| **Backend API** | 3000 | http://localhost:3000 | ✅ Running |
| **Admin Dashboard** | 3001 | http://localhost:3001 | ✅ Running |
| **Database** | - | Supabase Cloud | ✅ Connected |

## 🌐 Access URLs

### Backend API
- **Health Check**: http://localhost:3000/health
- **API Base**: http://localhost:3000/api

### Admin Dashboard
- **Home Page**: http://localhost:3001
- **Apps Page**: http://localhost:3001
- **Sources Page**: http://localhost:3001/sources

## 🧪 Test the System

### 1. Test Backend Health

Open in browser: http://localhost:3000/health

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T23:27:36.607Z"
}
```

### 2. Test Admin Dashboard

1. **Open**: http://localhost:3001
2. You should see the "Apps" page (currently empty)
3. Click "Sources" tab to see configured APK sources (APKMirror, APKPure, Custom Mirror)

### 3. Test API Endpoints

Open PowerShell and run:

```powershell
# Get all apps (should be empty array)
curl http://localhost:3000/api/admin/apps

# Get all sources
curl http://localhost:3000/api/admin/sources
```

### 4. Test Adding an App ✅ **NOW WORKS!**

1. Open admin dashboard: http://localhost:3001
2. Click "Add App" button
3. Enter a package name: `com.android.chrome` or `com.whatsapp`
4. Click "Add App"
5. **Success!** The app will be fetched from Google Play Store with:
   - App name
   - Icon
   - Description
   - Version info

**Note:** The Play Store scraper gets metadata only. APK download URLs would come from APKMirror/APKPure (not yet implemented) or can be added manually later.

## 📊 Database Verification

Your Supabase database has:

| Table | Records |
|-------|---------|
| apps | 0 (empty) |
| app_versions | 0 (empty) |
| app_sources | 3 (APKMirror, APKPure, Custom Mirror) |
| devices | 0 (empty) |
| installs | 0 (empty) |
| download_events | 0 (empty) |

## 🔧 Development Commands

### Backend (in `backend/` directory)

```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

### Admin Dashboard (in `web-admin/` directory)

```powershell
# Start development server
$env:PORT=3001; npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## 🛑 Stop Servers

To stop the background servers:

```powershell
# Find the processes
Get-Process | Where-Object {$_.Path -like "*node*"} | Select-Object Id, ProcessName, Path

# Kill specific processes (replace PID with actual process IDs)
Stop-Process -Id 85016  # Admin dashboard
Stop-Process -Id 86996  # Backend
```

Or simply close the terminal window.

## 📝 Test Scenarios

### Scenario 1: Add Apps from Google Play Store ✅ **WORKS NOW!**

You can now add any app from the Google Play Store using its package name!

**Try these popular apps:**
```powershell
# Add apps via API
$packages = @("com.spotify.music", "com.netflix.mediaclient", "com.instagram.android", "com.twitter.android")
foreach ($pkg in $packages) {
    $body = @{package_name = $pkg} | ConvertTo-Json
    Invoke-RestMethod -Uri http://localhost:3000/api/admin/apps -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Added $pkg"
    Start-Sleep -Seconds 2
}
```

Or use the admin dashboard at http://localhost:3001 and click "Add App"!

### Scenario 1b: Manual App Addition (Via SQL)

If you need to add an app that's not on Play Store:

1. Go to Supabase dashboard: https://supabase.com
2. Open SQL Editor
3. Run this query:

```sql
-- Insert test app
INSERT INTO apps (
    package_name,
    display_name,
    short_description,
    icon_url,
    current_version_name,
    current_version_code
) VALUES (
    'com.example.testapp',
    'Test Application',
    'A test app for demonstration',
    'https://via.placeholder.com/512',
    '1.0.0',
    1
);
```

4. Refresh admin dashboard at http://localhost:3001
5. You should see the test app!

### Scenario 2: Test Device Registration

Use PowerShell to simulate a device:

```powershell
$deviceId = [guid]::NewGuid().ToString()
$body = @{
    device_id = $deviceId
    app_version = "1.0.0"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:3000/api/devices/register -Method POST -Body $body -ContentType "application/json"

Write-Host "Device registered: $deviceId"
$response.Content
```

Check Supabase `devices` table - you should see the new device!

### Scenario 3: Test Getting Apps List

```powershell
# As a device
$deviceId = "YOUR-DEVICE-ID-FROM-ABOVE"
curl "http://localhost:3000/api/apps?device_id=$deviceId"
```

## 🐛 Troubleshooting

### Port Already in Use

If you see "port already in use":

```powershell
# Find what's using the port
Get-NetTCPConnection | Where-Object {$_.LocalPort -eq 3000} | Select-Object OwningProcess
Get-Process -Id PROCESS_ID_FROM_ABOVE
Stop-Process -Id PROCESS_ID
```

### Backend Won't Start

1. Check `.env` file exists in `backend/`
2. Verify Supabase credentials are correct
3. Check `npm install` ran successfully

### Admin Dashboard Won't Start

1. Check `.env.local` file exists in `web-admin/`
2. Verify `NEXT_PUBLIC_API_URL=http://localhost:3000`
3. Try clearing Next.js cache: `rm -rf .next`

### Database Connection Errors

1. Verify Supabase project is active: https://supabase.com
2. Check credentials in `.env`:
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY
   - SUPABASE_ANON_KEY

## 📱 Android Client (Optional)

To test the Android client:

1. Open Android Studio
2. Open `android-client/` directory
3. Update `app/build.gradle.kts`:
   ```kotlin
   buildConfigField("String", "API_URL", "\"http://10.0.2.2:3000\"")
   ```
   (10.0.2.2 is localhost for Android emulator)

4. Run on emulator
5. The app will register as a device and fetch apps

## 🎯 Next Steps

1. ✅ **Backend & Admin Running**: Both servers work!
2. ✅ **Database Connected**: Supabase is accessible
3. ⏳ **Add Test Data**: Use SQL to add test apps
4. ⏳ **Implement Scrapers**: Complete APKMirror/APKPure providers
5. ⏳ **Deploy to Production**: Use Railway or Render (see ALTERNATIVE_DEPLOYMENT.md)

## 📚 Documentation

- **Setup Guide**: SETUP_GUIDE.md
- **Architecture**: ARCHITECTURE.md
- **Deployment**: ALTERNATIVE_DEPLOYMENT.md
- **Project Summary**: PROJECT_SUMMARY.md

## 🆘 Need Help?

- Backend code: `backend/src/`
- Admin code: `web-admin/src/`
- Database schema: `database/schema.sql`
- API routes: `backend/src/routes/`

---

**🎉 Your local development environment is ready!**

Visit http://localhost:3001 to start using the admin dashboard!

