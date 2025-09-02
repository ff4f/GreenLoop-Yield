import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowLeft, Wallet, ShoppingCart, Package, FilePlus, Activity, Award } from "lucide-react";
import { useLocation } from "wouter";
import { useWallet } from "@/hooks/use-wallet";

export default function NavTabsHorizontal({ activeTab, onTabChange }) {
  const [, navigate] = useLocation();
  const { isConnected, account, connect, isConnecting } = useWallet();

  // Mock environment and role detection
  const environment = "Testnet"; // Could be "Mainnet" in production
  const userRole = "Developer"; // Could be "Buyer", "Admin", "Auditor"

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Brand Section - Left */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            data-testid="button-back-to-landing"
            className="hover:bg-muted"
            aria-label="Back to landing page"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Button>
          <div className="flex items-center space-x-2">
            <Leaf className="w-6 h-6 text-primary" aria-hidden="true" />
            <span className="text-xl font-bold text-foreground">GLY Dashboard</span>
          </div>
        </div>
        
        {/* Tabs Section - Center */}
        <div className="flex-1 max-w-4xl mx-8">
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-muted">
              <TabsTrigger 
                value="project-sheets" 
                className="flex items-center space-x-2 data-[state=active]:bg-background" 
                data-testid="tab-project-sheets"
                aria-label="Project sheets tab"
              >
                <FilePlus className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Project Sheets</span>
              </TabsTrigger>
              <TabsTrigger 
                value="marketplace" 
                className="flex items-center space-x-2 data-[state=active]:bg-background" 
                data-testid="tab-marketplace"
                aria-label="Marketplace tab"
              >
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Marketplace</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="flex items-center space-x-2 data-[state=active]:bg-background" 
                data-testid="tab-orders"
                aria-label="Orders tab"
              >
                <Package className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger 
                value="proof-feed" 
                className="flex items-center space-x-2 data-[state=active]:bg-background" 
                data-testid="tab-proof-feed"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Proof Feed</span>
              </TabsTrigger>
              <TabsTrigger 
                value="claims-helper" 
                className="flex items-center space-x-2 data-[state=active]:bg-background" 
                data-testid="tab-claims-helper"
              >
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Claims Helper</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Right Rail - Environment, Role, Wallet Chips */}
        <div className="flex items-center space-x-3">
          {/* Environment Chip */}
          <Badge 
            variant={environment === "Mainnet" ? "default" : "secondary"}
            className={`px-2 py-1 text-xs font-medium ${
              environment === "Mainnet" 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-orange-100 text-orange-800 border-orange-200"
            }`}
          >
            {environment}
          </Badge>
          
          {/* Role Chip */}
          <Badge 
            variant="outline"
            className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200"
          >
            {userRole}
          </Badge>
          
          {/* Wallet Chip */}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-border bg-background/50">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {isConnected ? `Connected: ${account?.accountId}` : 'Disconnected'}
            </span>
          </div>
          
          {/* Connect Button */}
          <Button 
            onClick={connect}
            disabled={isConnecting}
            variant={isConnected ? "outline" : "default"}
            size="sm"
            className="flex items-center space-x-2"
            data-testid="button-connect-wallet"
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden md:inline">
              {isConnecting ? 'Connecting...' : isConnected ? 'HashConnect' : 'Connect Wallet'}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}