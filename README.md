# Kosher App Store

A secure, proxy-based app store system for AOSP Android devices without Google Play Services.

## Project Structure

```
├── backend/           # Node.js/TypeScript API server
├── web-admin/        # React/Next.js admin dashboard
├── android-client/   # Kotlin/Jetpack Compose Android app
├── database/         # SQL migrations for Supabase
└── README.md
```

## Components

### Backend API
- Node.js + TypeScript + Fastify
- Source providers for APKMirror, APKPure, and custom mirrors
- Secure APK download proxy
- Device and install tracking

### Admin Dashboard
- Next.js + React + TypeScript + Tailwind CSS
- App management interface
- Source configuration and monitoring

### Android Client
- Kotlin + Jetpack Compose
- Simple linear app list
- Secure APK download and installation

## Setup Instructions

See individual component READMEs:
- [Backend Setup](./backend/README.md)
- [Admin Dashboard Setup](./web-admin/README.md)
- [Android Client Setup](./android-client/README.md)

## Security Features

- No arbitrary APK URLs from clients
- Whitelist-based source validation
- APK file validation (MIME type, magic bytes)
- HTTPS everywhere
- Device identity tracking
- Admin authentication via Supabase Auth

