import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sitemap from "vite-plugin-sitemap";
import devApiPlugin from "./dev-api-plugin.js";

// Update hostname before deploying.
const hostname = "https://solimareventrentals.com";

export default defineConfig({
  // Pin the dev port so it always matches VITE_SITE_URL (the Stripe redirect base).
  // strictPort makes a port conflict fail loudly instead of silently hopping to 5174+.
  server: { port: 5173, strictPort: true },
  plugins: [
    react(),
    devApiPlugin(),
    sitemap({
      hostname,
      dynamicRoutes: ["/", "/rentals", "/about", "/gallery"],
    }),
  ],
});
