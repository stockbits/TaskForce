import React from "react";
import ReactDOM from "react-dom/client";
import Application from "@application/Application";
import "@styles/global.css";

const applicationRoot = document.getElementById("root");

if (!applicationRoot) {
  throw new Error("Application root element was not found.");
}

ReactDOM.createRoot(applicationRoot).render(
  <React.StrictMode>
    <Application />
  </React.StrictMode>
);
