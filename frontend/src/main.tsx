import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { visualEffects } from "./effects";

// Экспорт для отладки в консоли браузера
declare global {
  interface Window {
    visualEffects: typeof visualEffects;
  }
}
window.visualEffects = visualEffects;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
