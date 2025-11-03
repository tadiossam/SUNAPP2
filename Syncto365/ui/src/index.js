// ===============================
// index.js — React 18 entry point
// ===============================

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css"; // ✅ Import Bootstrap styles globally

// Get root container
const container = document.getElementById("root");

// Create React root
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    {/* BrowserRouter for routing */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
