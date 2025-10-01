# 📱 Mobile App Deployment Guide - Quote-it

This guide will help you deploy Quote-it as a native mobile app to Android and iOS app stores.

## Prerequisites

- Node.js and npm installed
- Git repository connected (use "Export to Github" in Lovable)
- For iOS: Mac with Xcode installed
- For Android: Android Studio installed

## Initial Setup

Capacitor has already been configured in this project with the following settings:
- **App ID**: `app.lovable.84bc8b2461a547859ea1c7a592fbd3fd`
- **App Name**: Quote-it
- **Web Directory**: dist

## Step-by-Step Deployment

### 1. Export and Clone Your Project

1. In Lovable, click the "Export to Github" button to push your code to GitHub
2. Clone your repository locally:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Add Mobile Platforms

Choose the platform(s) you want to deploy to:

**For Android:**
```bash
npx cap add android
```

**For iOS:**
```bash
npx cap add ios
```

### 4. Build Your Web App

```bash
npm run build
```

### 5. Sync with Native Projects

```bash
npx cap sync
```

This command copies your web assets to the native projects and updates native dependencies.

### 6. Open in Native IDE

**For Android:**
```bash
npx cap open android
```
This opens Android Studio where you can:
- Build the APK
- Run on emulator or physical device
- Sign and publish to Google Play Store

**For iOS:**
```bash
npx cap open ios
```
This opens Xcode where you can:
- Configure signing certificates
- Run on simulator or physical device
- Archive and upload to App Store Connect

## Running on Devices

### Android Device/Emulator
```bash
npx cap run android
```

### iOS Simulator/Device
```bash
npx cap run ios
```

## Development Workflow

When making changes to your app:

1. Make code changes in Lovable or your local editor
2. If local, commit and push to GitHub
3. If using Lovable, pull latest changes: `git pull`
4. Rebuild: `npm run build`
5. Sync: `npx cap sync`
6. Run: `npx cap run android` or `npx cap run ios`

## Hot Reload During Development

The app is configured to connect to your Lovable sandbox for hot reload:
- URL: `https://84bc8b24-61a5-4785-9ea1-c7a592fbd3fd.lovableproject.com`
- This allows you to see changes instantly without rebuilding

To disable hot reload and use local build:
1. Open `capacitor.config.ts`
2. Remove or comment out the `server` section
3. Run `npx cap sync`

## Publishing to App Stores

### Google Play Store (Android)
1. Open Android Studio
2. Build > Generate Signed Bundle/APK
3. Follow the signing process
4. Upload to Google Play Console
5. Complete store listing and submit for review

### Apple App Store (iOS)
1. Open Xcode
2. Configure signing with your Apple Developer account
3. Product > Archive
4. Distribute App > App Store Connect
5. Complete App Store Connect listing and submit for review

## App Icons and Splash Screens

Generate app icons and splash screens:
1. Create a 1024x1024 icon (PNG)
2. Use a generator like:
   - https://capacitorjs.com/docs/guides/splash-screens-and-icons
   - https://www.appicon.co/

Replace the generated assets in:
- `android/app/src/main/res/` (Android)
- `ios/App/App/Assets.xcassets/` (iOS)

## Offline Functionality

Quote-it uses localStorage for data persistence, which works offline automatically. All data is stored locally on the device.

## Premium Features & Monetization

To add in-app purchases:
- Android: Use Google Play Billing
- iOS: Use StoreKit

Consider Capacitor plugins:
- `@capacitor-community/in-app-purchases`
- Or native implementation in Android Studio/Xcode

## Troubleshooting

**Build errors after changes:**
```bash
npm run build
npx cap sync
npx cap update android  # or ios
```

**Can't connect to development server:**
- Check capacitor.config.ts server URL
- Ensure device is on same network
- Try using IP address instead of .lovableproject.com

**Native dependencies not updating:**
```bash
npx cap sync
npx cap update android  # or ios
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Publishing Guide](https://developer.android.com/studio/publish)
- [iOS Publishing Guide](https://developer.apple.com/app-store/submissions/)
- [Lovable Mobile Development Blog](https://lovable.dev/blogs)

## Support

For issues specific to:
- Capacitor: https://capacitorjs.com/docs
- Lovable: https://discord.gg/lovable
- Android: https://developer.android.com/studio
- iOS: https://developer.apple.com/support/
