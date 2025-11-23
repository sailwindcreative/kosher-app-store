# Database Setup

## Supabase Setup

1. Create a new Supabase project at https://supabase.com

2. Run the schema migration:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the contents of `schema.sql`
   - Execute the query

3. Configure Row Level Security (RLS) policies as needed:
   - For development, you can disable RLS on tables
   - For production, implement proper RLS policies based on auth requirements

4. Note your credentials:
   - Supabase URL: `https://[project-ref].supabase.co`
   - Supabase Anon Key: Found in Project Settings > API
   - Supabase Service Role Key: Found in Project Settings > API (keep secret!)

## Environment Variables

Set these in your backend `.env` file:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## Tables

- **apps**: Core app metadata
- **app_versions**: Version history for each app
- **app_sources**: Configured APK sources (APKMirror, APKPure, etc.)
- **app_source_versions**: Links versions to sources with download URLs
- **devices**: Registered devices
- **installs**: Installation history per device
- **download_events**: Detailed download event logs

