import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 've.voltech.store',
  appName: 'Voltech Store',
  webDir: 'public',
  server: {
    url: 'https://voltechstoreve-6nuj.vercel.app/?apk=1',
    androidScheme: 'https'
  }
};

export default config;