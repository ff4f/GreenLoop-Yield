import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowLeft, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { useWallet } from "@/hooks/use-wallet";

import Marketplace from "@/components/marketplace";
import Orders from "@/components/orders";
import ProjectSheets from "@/components/project-sheets";
import ProofFeed from "@/components/proof-feed";
import ClaimsHelper from "@/components/claims-helper";

type TabType = 'marketplace' | 'orders' | 'project-sheets' | 'proof-feed' | 'claims-helper';

const tabs = [
  { id: 'marketplace', label: 'Marketplace', icon: 'shopping-cart' },
  { id: 'orders', label: 'Orders', icon: 'package' },
  { id: 'project-sheets', label: 'Project Sheets', icon: 'file-plus' },
  { id: 'proof-feed', label: 'Proof Feed', icon: 'activity' },
  { id: 'claims-helper', label: 'Claims Helper', icon: 'award' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('marketplace');
  const [, navigate] = useLocation();
  const { isConnected, account, connect, isConnecting } = useWallet();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'marketplace':
        return <Marketplace />;
      case 'orders':
        return <Orders />;
      case 'project-sheets':
        return <ProjectSheets />;
      case 'proof-feed':
        return <ProofFeed />;
      case 'claims-helper':
        return <ClaimsHelper />;
      default:
        return <Marketplace />;
    }
  };

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

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-card border-r border-border p-4" data-testid="sidebar-navigation">
          <div className="space-y-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(tab.id as TabType)}
                data-testid={`tab-${tab.id}`}
              >
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto" data-testid="main-content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
