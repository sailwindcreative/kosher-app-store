# Deployment Configuration

## Supabase Credentials

Your Supabase project has been set up successfully!

**Project:** app store  
**Project ID:** `ueliamaggkdnsuoanlgu`  
**Region:** us-east-1  
**Status:** ✅ ACTIVE_HEALTHY

### Environment Variables

Copy these to your deployment platforms:

#### Backend (.env)
```env
SUPABASE_URL=https://ueliamaggkdnsuoanlgu.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbGlhbWFnZ2tkbnN1b2FubGd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzkzODAwMywiZXhwIjoyMDc5NTE0MDAzfQ.QdElHPbL-_H1E4a_yUSU_5W4d5vOZawhcJqB40Hh8DM
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbGlhbWFnZ2tkbnN1b2FubGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgwMDMsImV4cCI6MjA3OTUxNDAwM30.-3iEjV2HcCB2TXAd_UFAtWdvOlZMoZhgW-IYZq1PQ6k
PORT=3000
NODE_ENV=production
API_SECRET=a7f8e3c4b2d6f1e5a9c8b7d4e2f3a1c5b8d7e4f2a9c6b3d8e5f1a7c4b9d2e6f3
BACKEND_URL=https://your-backend-url.vercel.app
```

#### Web Admin (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://ueliamaggkdnsuoanlgu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbGlhbWFnZ2tkbnN1b2FubGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgwMDMsImV4cCI6MjA3OTUxNDAwM30.-3iEjV2HcCB2TXAd_UFAtWdvOlZMoZhgW-IYZq1PQ6k
```

#### Android (app/build.gradle.kts)
```kotlin
buildConfigField("String", "API_URL", "\"https://your-backend-url.vercel.app\"")
```

## Local Setup

1. **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Paste the Backend env vars above into .env
   npm install
   npm run dev
   ```

2. **Web Admin:**
   ```bash
   cd web-admin
   cp .env.local.example .env.local
   # Paste the Web Admin env vars above into .env.local
   npm install
   npm run dev
   ```

## Database Status

✅ All tables created:
- apps (0 rows)
- app_versions (0 rows)
- app_sources (3 rows - default sources)
- app_source_versions (0 rows)
- devices (0 rows)
- installs (0 rows)
- download_events (0 rows)

## Vercel Deployment

### Backend Deployment

1. Push to GitHub (see instructions below)
2. Go to https://vercel.com
3. Import your repository
4. Set **Root Directory** to `backend`
5. Set **Build Command** to `npm run build`
6. Set **Output Directory** to `dist`
7. Add environment variables from Backend section above
8. Deploy!

### Web Admin Deployment

1. In Vercel, import the same repository again
2. Set **Root Directory** to `web-admin`
3. Framework Preset should auto-detect as **Next.js**
4. Add environment variables from Web Admin section above
5. Update `NEXT_PUBLIC_API_URL` with your backend URL from step 1
6. Deploy!

## Next Steps

1. ✅ Database created
2. ⏳ Push to GitHub (see below)
3. ⏳ Deploy backend to Vercel
4. ⏳ Deploy admin to Vercel
5. ⏳ Test the system

