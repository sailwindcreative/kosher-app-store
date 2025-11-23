# Android Client

Kotlin + Jetpack Compose Android app for the Kosher App Store.

## Requirements

- Android Studio Hedgehog (2023.1.1) or later
- Android SDK 23+ (Android 6.0+)
- JDK 17

## Setup

1. **Open in Android Studio:**
   - Open Android Studio
   - Select "Open an Existing Project"
   - Navigate to `android-client` directory
   - Wait for Gradle sync to complete

2. **Configure Backend URL:**
   
   Edit `app/build.gradle.kts` and update the API URL:
   
   ```kotlin
   buildConfigField("String", "API_URL", "\"http://10.0.2.2:3000\"")
   ```
   
   - For emulator: `http://10.0.2.2:3000` (points to localhost)
   - For physical device: Use your computer's IP address
   - For production: Use your deployed backend URL

3. **Build and Run:**
   - Connect an Android device or start an emulator
   - Click "Run" (green play button) or press Shift+F10
   - Select your device

## Features

### Device Registration
- On first launch, generates a random UUID as device ID
- Registers with backend
- Device ID persisted in DataStore
- Device ID displayed at bottom of screen

### App List
- Loads apps from backend API
- Displays:
  - App icon (loaded with Coil)
  - App name
  - Short description
  - Current version
  - Install button

### APK Installation
- Install button requests download URL from backend
- Uses Android DownloadManager to download APK
- Downloads to cache directory
- Shows notification when download completes
- User taps notification to install

### Security
- HTTPS-only in production (configured in `network_security_config.xml`)
- Cleartext allowed only for localhost in development
- FileProvider for secure APK sharing
- No arbitrary URLs - only backend-provided URLs

## Project Structure

```
app/src/main/
├── kotlin/com/kosher/appstore/
│   ├── data/
│   │   ├── Api.kt                    # Retrofit API definitions
│   │   ├── ApiClient.kt              # Retrofit client setup
│   │   ├── AppRepository.kt          # Data repository
│   │   └── DeviceIdManager.kt        # Device ID management
│   ├── ui/
│   │   ├── theme/
│   │   │   └── Theme.kt              # Material 3 theme
│   │   ├── AppsViewModel.kt          # ViewModel for app list
│   │   └── AppListScreen.kt          # Main UI screen
│   ├── MainActivity.kt               # Main activity
│   └── AppStoreApplication.kt        # Application class
├── res/
│   ├── values/
│   │   ├── strings.xml
│   │   └── themes.xml
│   └── xml/
│       ├── network_security_config.xml  # HTTPS config
│       └── file_paths.xml               # FileProvider paths
└── AndroidManifest.xml
```

## Configuration

### Network Security

The app enforces HTTPS in production. For development:

- Localhost/10.0.2.2 allowed for cleartext (development backend)
- Production should use HTTPS only
- Consider adding certificate pinning for your backend domain

Edit `res/xml/network_security_config.xml` to configure.

### Permissions

Required permissions in `AndroidManifest.xml`:
- `INTERNET`: Network access
- `ACCESS_NETWORK_STATE`: Check network connectivity
- `REQUEST_INSTALL_PACKAGES`: Install downloaded APKs

## Building for Production

1. **Update backend URL** in `app/build.gradle.kts`:
   ```kotlin
   buildConfigField("String", "API_URL", "\"https://your-backend.com\"")
   ```

2. **Generate signed APK:**
   - Build → Generate Signed Bundle / APK
   - Follow the wizard to create/use a keystore
   - Select "release" build variant

3. **Enable ProGuard** (already configured in `build.gradle.kts`)

## Known Limitations

- No automatic installation after download (requires user interaction due to Android security)
- No update checking for already-installed apps
- No download progress indicator in UI
- No search or filtering

## TODO

- Implement BroadcastReceiver for automatic install prompt after download
- Add update checking (compare installed version with available version)
- Add download progress tracking
- Implement proper error handling with user-friendly messages
- Add app detail screen
- Implement uninstall tracking

