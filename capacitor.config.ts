import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omega.app',
  appName: 'omega',
  webDir: 'public',
  server: {
    url: 'http://localhost:3000',
    cleartext: true,
  },
};

export default config;
