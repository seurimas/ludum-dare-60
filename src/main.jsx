import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import EnergyPage from "./EnergyPage.jsx";
import ReferencePage from "./ReferencePage.jsx";
import RelicsPage from "./RelicsPage.jsx";
import "./styles.css";

function Routed() {
  if (/^\/energy\/?$/.test(window.location.pathname)) return <EnergyPage />;
  if (/^\/reference\/?$/.test(window.location.pathname)) return <ReferencePage />;
  if (/^\/relics\/?$/.test(window.location.pathname)) return <RelicsPage />;
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Routed />
  </React.StrictMode>,
);
