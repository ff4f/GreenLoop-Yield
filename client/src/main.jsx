import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

// Add loading state
const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading GreenLoop Yield...</p>
    </div>
  </div>
);

// Prevent MetaMask conflicts
if (typeof window !== 'undefined') {
  // Disable MetaMask auto-injection if present
  if (window.ethereum && window.ethereum.isMetaMask) {
    console.warn('MetaMask detected. Using HashPack for Hedera integration.');
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
