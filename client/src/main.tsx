import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeRevenueCat } from "./lib/revenuecat";

// Initialize RevenueCat SDK
initializeRevenueCat().catch(error => {
  console.error("Failed to initialize RevenueCat:", error);
});

createRoot(document.getElementById("root")!).render(<App />);
