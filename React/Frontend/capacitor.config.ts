import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mimu.app',
  appName: "Mimu Arts",
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1E1A1C',
      showSpinner: true,
      spinnerColor: '#BB8A5E',
    },
  },
};

export default config;