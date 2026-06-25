import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sitemap from "vite-plugin-sitemap";

// Update hostname before deploying.
const hostname = "https://sunshinepartyrentals.com";

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname,
      dynamicRoutes: ["/", "/rentals", "/about", "/gallery"],
    }),
  ],
});
