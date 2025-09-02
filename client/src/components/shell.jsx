import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import TopTabs from "./top-tabs";
import { useWallet } from "@/hooks/use-wallet";
import { HelpCircle } from "lucide-react";

// Mock HCS Topic ID untuk demo
const mockHcsTopicId = "0.0.123456";

const Shell = ({ children, kpiData = [], activeTab, onTabChange, tabs = [], useCustomTabs = false }) => {
  const { isConnected, isConnecting, connect } = useWallet();
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header with Blur */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container-app mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
          {/* Left: Brand + Product Name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">GLY</span>
            </div>
            <h1 className="text-base font-semibold text-foreground">GreenLoop Yield</h1>
          </div>
          
          {/* Right: Small chips, Wallet chip, Help icon */}
          <div className="flex items-center gap-2">
            <Badge variant="testnet" className="h-6 px-2">
              Testnet
            </Badge>
            <Badge variant="network" className="h-6 px-2">
              HCS: {mockHcsTopicId}
            </Badge>
            <Button 
              variant={isConnected ? "eco-outline" : "eco-green"} 
              size="sm"
              onClick={isConnected ? disconnect : connect}
              disabled={isConnecting}
              className="transition-all duration-200"
            >
              {isConnecting ? 'Connecting...' : (isConnected ? `Connected: ${walletData?.accountId}` : 'Connect Wallet')}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        {/* Primary Tabs (Strip 2) - Compact segmented control */}
        <div className="border-t border-border">
          <div className="container-app mx-auto px-4 sm:px-6 lg:px-8 w-full py-1">
            {tabs && tabs.length > 0 && (
              <TabsList className="grid w-full grid-cols-5 bg-transparent p-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "py-1 px-3 text-sm font-medium",
                      "data-[state=active]:bg-white/10 data-[state=active]:ring-1 data-[state=active]:ring-emerald-400/40",
                      "data-[state=active]:text-foreground text-muted-foreground"
                    )}
                    onClick={() => onTabChange(tab.value)}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}
          </div>
        </div>

      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <div className="container-app mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="py-4">
            {/* Full-width Main Content */}
            <div className="space-y-4">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Shell;