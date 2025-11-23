# Admin Dashboard

Next.js + React + Tailwind CSS admin dashboard for the Kosher App Store.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and set:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., `http://localhost:3000`)
   - Supabase credentials (optional, for auth)

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Dashboard will be available at `http://localhost:3000`

## Production Build

```bash
npm run build
npm start
```

## Features

### Apps Tab

- **List View**: Shows all apps with icons, names, package names, versions
- **Add App**: Modal to add new apps by Google Play URL or package name
- **Detail View**: 
  - App metadata and descriptions
  - Version history with source links
  - Test Fetch button to verify download sources
  - Recent download events

### Sources Tab

- **Source Management**:
  - Enable/disable sources
  - Set priority (lower = higher priority)
  - View source types and base URLs

## TODO

- **Authentication**: Add Supabase Auth for admin login
- **Real-time Updates**: Use Supabase realtime subscriptions for live updates
- **Advanced Features**:
  - Device management page
  - Download analytics
  - Bulk app operations
  - Source health monitoring

