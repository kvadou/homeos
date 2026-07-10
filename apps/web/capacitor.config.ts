import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "com.homeos.app",
  appName: "HomeOS",
  webDir: "out",
  server: {
    url: "https://homebase-ai-omega.vercel.app",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0A2E4D",
      androidSpinnerStyle: "small",
      spinnerColor: "#00B4A0",
      showSpinner: true,
      launchShowDuration: 2000,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0A2E4D",
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
