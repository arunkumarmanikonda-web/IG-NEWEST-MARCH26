import type { ExpoConfig } from 'expo/config';

// These identifiers are provisional. Confirm ownership before the first store build;
// changing them after publication creates a different app in both stores.
const config: ExpoConfig = {
  name: 'India Gully',
  slug: 'india-gully',
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/icon.png',
  scheme: 'indiagully',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'com.indiagully.app',
    buildNumber: '1',
    supportsTablet: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: 'com.indiagully.app',
    versionCode: 1,
    allowBackup: false,
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#292821' },
    // Public browsing does not need camera, microphone, contacts, location or storage access.
    blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.CAMERA', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.READ_MEDIA_IMAGES', 'android.permission.READ_MEDIA_VIDEO'],
  },
  web: { favicon: './assets/icon.png', name: 'India Gully', shortName: 'India Gully', description: 'Explore India Gully properties, HORECA collections and Perspectives.' },
  plugins: ['expo-web-browser'],
  extra: { publicCatalogue: 'https://indiagully.com/api/mobile/catalogue' },
};
export default config;
