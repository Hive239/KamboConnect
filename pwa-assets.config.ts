import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

/** Generates PWA icons (pwa-64/192/512, maskable, apple-touch) from the source SVG. */
export default defineConfig({
  preset: minimal2023Preset,
  images: ["public/icon.svg"],
});
