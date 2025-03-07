import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import NewsMediaDashboard from "./NewsMediaDashboard.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NewsMediaDashboard />
  </StrictMode>
);
