import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alaysho.pizzavision.ionic',
  appName: 'PizzaVision',
  webDir: 'build',
  bundledWebRuntime: false,
  ios: {
    scheme: 'PizzaVision'
  }
};

export default config;
