import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, ArrowLeft, Wallet, ShoppingCart, Package, FilePlus, Activity, Award } from "lucide-react";
import { useLocation } from "wouter";
import { useWallet } from "@/hooks/use-wallet";

import Marketplace from "@/components/marketplace";
import Orders from "@/components/orders";
import ProjectSheets from "@/components/project-sheets";
import ProofFeed from "@/components/proof-feed";
import ClaimsHelper from "@/components/claims-helper";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { isConnected, account, connect, isConnecting } = useWallet();

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <header className="bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              data-testid="button-back-to-landing"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Leaf className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">GLY Dashboard</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={connect}
              disabled={isConnecting}
              className="bg-primary text-primary-foreground hover:opacity-90 flex items-center space-x-2"
              data-testid="button-connect-wallet"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting...' : isConnected ? account?.accountId : 'Connect HashConnect'}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="marketplace" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="marketplace" className="flex items-center space-x-2" data-testid="tab-marketplace">
              <ShoppingCart className="w-4 h-4" />
              <span>Marketplace</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2" data-testid="tab-orders">
              <Package className="w-4 h-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="project-sheets" className="flex items-center space-x-2" data-testid="tab-project-sheets">
              <FilePlus className="w-4 h-4" />
              <span>Project Sheets</span>
            </TabsTrigger>
            <TabsTrigger value="proof-feed" className="flex items-center space-x-2" data-testid="tab-proof-feed">
              <Activity className="w-4 h-4" />
              <span>Proof Feed</span>
            </TabsTrigger>
            <TabsTrigger value="claims-helper" className="flex items-center space-x-2" data-testid="tab-claims-helper">
              <Award className="w-4 h-4" />
              <span>Claims Helper</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="mt-0">
            <Marketplace />
          </TabsContent>
          
          <TabsContent value="orders" className="mt-0">
            <Orders />
          </TabsContent>
          
          <TabsContent value="project-sheets" className="mt-0">
            <ProjectSheets />
          </TabsContent>
          
          <TabsContent value="proof-feed" className="mt-0">
            <ProofFeed />
          </TabsContent>
          
          <TabsContent value="claims-helper" className="mt-0">
            <ClaimsHelper />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
