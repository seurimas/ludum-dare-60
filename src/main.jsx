import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import EnergyPage from "./EnergyPage.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/^\/energy\/?$/.test(window.location.pathname) ? <EnergyPage /> : <App />}
  </React.StrictMode>,
);
