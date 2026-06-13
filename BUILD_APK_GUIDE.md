# Building the Android APK for Mimi's Social App

## Prerequisites
- Node.js 18+ 
- Java 17+ (JDK)
- Android Studio with Android SDK
- Android SDK Build Tools 34+
- Gradle (comes with the project)

## Step 1: Install Android SDK

1. Download and install [Android Studio](https://developer.android.com/studio)
2. Open Android Studio → SDK Manager → Install:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34+
3. Set environment variable:
   ```
   ANDROID_HOME = C:\Users\<YourUser>\AppData\Local\Android\Sdk
   ```
   Add to PATH:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\cmdline-tools\latest\bin
   ```

## Step 2: Configure Backend URL

For **development** (local testing):
- The app defaults to `http://10.0.2.2:5000` (Android emulator → host machine)
- Or `http://localhost:5000` (browser)

For **production** (real server):
1. Edit `DProjectsPersonal IdeasMimis website/React/Frontend/src/api/api.js`
2. Change the `getApiBase()` function to return your server URL
3. Or set `window.__API_BASE__` via env variable during build

## Step 3: Build the Frontend

```bash
cd "D:\Projects\Personal Ideas\Mimis website\React\Frontend"
npm install
npx vite build
```

## Step 4: Sync with Capacitor

```bash
npx cap copy android
npx cap sync android
```

## Step 5: Build the APK

### Debug APK (for testing):
```bash
cd android
gradlew assembleDebug
```
Output: `android\app\build\outputs\apk\debug\app-debug.apk`

### Release APK (for publishing):
```bash
cd android
gradlew assembleRelease
```
Output: `android\app\build\outputs\apk\release\app-release-unsigned.apk`

### Sign the Release APK:
```bash
# Generate a keystore (only once)
keytool -genkey -v -keystore mimis-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mimis

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore mimis-keystore.jks app-release-unsigned.apk mimis

# Align the APK (optimize)
zipalign -v 4 app-release-unsigned.apk MimiApp.apk
```

## Step 6: Install on Phone

### Via USB:
1. Enable Developer Options on Android phone
2. Enable USB Debugging
3. Connect phone to computer
4. Run: `adb install app-debug.apk`

### Via file transfer:
1. Copy the APK to your phone
2. Enable "Install from unknown sources" in settings
3. Tap the APK file to install

## Step 7: Run the Backend Server

```bash
cd "D:\Projects\Personal Ideas\Mimis website\backend"
# Set JWT_SECRET for production (REQUIRED!)
set JWT_SECRET=your-super-secure-random-key
set NODE_ENV=production
npm install
npm start
```

The server will run on port 5000. Make sure your phone can reach this server (same Wi-Fi network or public IP).

## Quick Build Script

Create `build-apk.bat` in the `React\Frontend` directory:

```batch
@echo off
echo Building Mimi's Android APK...
cd /d "D:\Projects\Personal Ideas\Mimis website\React\Frontend"
call npm install
call npx vite build
call npx cap copy android
call npx cap sync android
cd android
call gradlew assembleDebug
echo APK built at: android\app\build\outputs\apk\debug\app-debug.apk
pause