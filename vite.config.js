import { defineConfig } from "vite";

export default defineConfig({
  // Set the root directory to your OpenLayersWebMap folder
  root: "OpenLayersWebMap",

  // IMPORTANT: Set base path for GitHub Pages
  // Replace 'RunEveryStreetTutorial' with your actual repository name
  base: "/RunEveryStreet_RPP/",

  // Configure the build output directory
  build: {
    outDir: "../dist",
    // Ensure assets are correctly referenced
    assetsDir: "assets",
  },

  // Configure the development server
  server: {
    port: 3000,
    open: true, // Automatically open browser
  },

  // Resolve options for imports
  resolve: {
    // You can add aliases if needed
    alias: {
      // Example: '@': '/src'
    },
  },

  // Configure how JavaScript is processed
  esbuild: {
    // Support JSX if needed
    jsxFactory: "h",
    jsxFragment: "Fragment",
  },
});
