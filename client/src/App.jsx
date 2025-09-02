import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { WalletProvider } from "@/contexts/wallet-context";
import { ProofStoreProvider } from "@/contexts/proof-store";

import Landing from "@/pages/landing.jsx";
import Dashboard from "@/pages/dashboard.jsx";
import NotFound from "@/pages/not-found.jsx";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Set dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ProofStoreProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ProofStoreProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
