import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.quoteitai.app',
  appName: 'Quote-it AI',
  webDir: 'dist',
  // Remove server config for production - app will use bundled files
  // During development, you can add back the server URL for live reload:
  // server: {
  //   url: 'https://84bc8b24-61a5-4785-9ea1-c7a592fbd3fd.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
