import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kamboguide.app",
  appName: "KamboGuide",
  webDir: "dist",
  backgroundColor: "#faf8f4",
  ios: {
    // Draw the web content edge-to-edge (under the status bar) so the app's own
    // themed header fills the notch area. "always" would inset the content and
    // expose the webview's light background as a band at the top.
    contentInset: "never",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#2f5e46",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    Keyboard: {
      resize: "native" as any,
    },
  },
};

export default config;
