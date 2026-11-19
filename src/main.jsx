import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App";
import { initAds } from "./lib/analytics";

// Before the router mounts, so an ad click id in the landing URL is read as-is.
initAds();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
