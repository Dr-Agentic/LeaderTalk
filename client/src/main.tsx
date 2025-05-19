import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeRevenueCat } from "./lib/revenuecat";

// Initialize RevenueCat SDK after a short delay to ensure scripts are loaded
setTimeout(() => {
  console.log("Initializing RevenueCat...");
  initializeRevenueCat().catch(error => {
    console.error("Failed to initialize RevenueCat:", error);
  });
}, 1000);

createRoot(document.getElementById("root")!).render(<App />);
