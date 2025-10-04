import { defineConfig } from "vite";

export default defineConfig({
  // Set the root directory to your OpenLayersWebMap folder
  root: "OpenLayersWebMap",

  // Set base path for GitHub Pages
  base: "/RunEveryStreet_RPP/",

  // Configure the build output directory
  build: {
    outDir: "../dist",
    // Ensure assets are correctly referenced
    assetsDir: "assets",
    // Make sure the build is clean
    emptyOutDir: true,
  },

  // Configure the development server
  server: {
    port: 3000,
    open: true,
  },

  // Resolve options for imports
  resolve: {
    alias: {
      // Add aliases if needed
    },
  },

  // Configure how JavaScript is processed
  esbuild: {
    jsxFactory: "h",
    jsxFragment: "Fragment",
  },
});
