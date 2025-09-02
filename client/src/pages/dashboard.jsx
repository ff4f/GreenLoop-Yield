import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import Shell from "@/components/shell";
import SubheaderStrip from "@/components/subheader-strip";
import ProofInspector from "@/components/proof-inspector";
import { ProofStoreProvider, useProofStore } from "@/contexts/proof-store";
import EvidenceToast from "@/components/evidence-toast";
import Marketplace from "@/components/marketplace";
import Orders from "@/components/orders";
import ProjectSheets from "@/components/project-sheets";
import ProofFeed from "@/components/proof-feed";
import ClaimsHelper from "@/components/claims-helper";


// Mock Hedera IDs generator
function generateMockHederaId(type) {
  const timestamp = Date.now();
  switch (type) {
    case 'tx':
      return `0.0.${Math.floor(Math.random() * 1000000)}@${timestamp}.${Math.floor(Math.random() * 999999999)}`;
    case 'file':
      return `0.0.${Math.floor(Math.random() * 1000000)}`;
    case 'topic':
      return `0.0.${Math.floor(Math.random() * 1000000)}`;
    case 'token':
      return `0.0.${Math.floor(Math.random() * 1000000)}`;
    default:
      return `0.0.${Math.floor(Math.random() * 1000000)}`;
  }
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState("project-sheets");
  const { addEvidence } = useProofStore();

  const tabs = [
    { value: "project-sheets", label: "Project Sheets", icon: null },
    { value: "marketplace", label: "Marketplace", icon: null },
    { value: "orders", label: "Orders", icon: null },
    { value: "proof-feed", label: "Proof Feed", icon: null },
    { value: "claims-helper", label: "Claims Helper", icon: null }
  ];

  // Primary actions for each tab
  const handlePrimaryAction = (tabId) => {
    switch (tabId) {
      case 'project-sheets':
        addEvidence({
          kind: 'file',
          id: generateMockHederaId('file'),
          label: 'Project Sheet Created',
          meta: { action: 'uploaded to HFS', type: 'project-sheet' },
          source: 'Project Sheets'
        });
        break;
      case 'marketplace':
        addEvidence({
          kind: 'token',
          id: generateMockHederaId('token'),
          label: 'Carbon Credit Listed',
          meta: { action: 'minted', type: 'carbon-credit' },
          source: 'Marketplace'
        });
        break;
      case 'orders':
        addEvidence({
          kind: 'tx',
          id: generateMockHederaId('tx'),
          label: 'Order Executed',
          meta: { action: 'escrow created', type: 'purchase-order' },
          source: 'Orders'
        });
        break;
      case 'proof-feed':
        addEvidence({
          kind: 'topic',
          id: generateMockHederaId('topic'),
          label: 'Proof Submitted',
          meta: { action: 'submitted to HCS', sequence: Math.floor(Math.random() * 1000) },
          source: 'Proof Feed'
        });
        break;
      case 'claims-helper':
        addEvidence({
          kind: 'tx',
          id: generateMockHederaId('tx'),
          label: 'Claim Processed',
          meta: { action: 'claim verified', type: 'carbon-claim' },
          source: 'Claims Helper'
        });
        break;
    }
  };



  const handleFilterChange = (filterType, value) => {
    console.log('Filter changed:', filterType, value);
  };

  const handleActionClick = (actionLabel) => {
    console.log('Action clicked:', actionLabel);
  };

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" role="region" aria-label="Dashboard sections">
        <Shell activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} useCustomTabs={true}>
          
          {/* Project Sheets Tab */}
          <TabsContent value="project-sheets" className="space-y-6">
            <SubheaderStrip 
              activeTab={activeTab} 
              onPrimaryAction={() => handlePrimaryAction('project-sheets')}
            />
            <ProjectSheets />
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <SubheaderStrip 
              activeTab={activeTab} 
              onPrimaryAction={() => handlePrimaryAction('marketplace')}
            />
            <Marketplace />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <SubheaderStrip 
              activeTab={activeTab} 
              onPrimaryAction={() => handlePrimaryAction('orders')}
            />
            <Orders />
          </TabsContent>

          {/* Proof Feed Tab */}
          <TabsContent value="proof-feed" className="space-y-6">
            <SubheaderStrip 
              activeTab={activeTab} 
              onPrimaryAction={() => handlePrimaryAction('proof-feed')}
            />
            <ProofFeed />
          </TabsContent>

          {/* Claims Helper Tab */}
          <TabsContent value="claims-helper" className="space-y-6">
            <SubheaderStrip 
              activeTab={activeTab} 
              onPrimaryAction={() => handlePrimaryAction('claims-helper')}
            />
            <ClaimsHelper />
          </TabsContent>
        </Shell>

        {/* Evidence Toast Notifications */}
        <EvidenceToast />
        
        {/* Proof Inspector Modal */}
        <ProofInspector />
      </Tabs>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProofStoreProvider>
      <DashboardContent />
    </ProofStoreProvider>
  );
}
