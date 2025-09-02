import React from 'react';
import ClaimsWizard from "./claims-wizard";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { SEED_LOTS } from '@shared/seed-data.js';

export default function ClaimsHelper() {
  const { isConnected, isConnecting, connect } = useWallet();
  // Transform SEED_LOTS data for ClaimsWizard component
  const lots = SEED_LOTS.map(lot => ({
    id: lot.id,
    title: `${lot.projectName} - ${lot.id}`,
    project: lot.projectName,
    quantity: lot.availableTons || lot.totalTons,
    status: lot.status,
    location: lot.location
  }));

  return (
    <>
      {!isConnected && (
        <Card className="border-sky-200 bg-sky-50/50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Connect Wallet for Claims</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Connect your Hedera wallet to access the claims workflow and manage your tokenized carbon lots.
                </p>
                <Button
                  onClick={connect}
                  disabled={isConnecting}
                  size="sm"
                  className="h-8 text-sm rounded-lg"
                >
                  {isConnecting ? 'Connecting…' : 'Connect Wallet'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Claims Helper</h1>
        <p className="text-muted-foreground text-sm">8-step workflow with HCS integration for immutable anchoring and NFT badge minting for permanent verification</p>
      </div>

      {lots.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">No Carbon Credit Lots Available</h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Claims verification requires existing carbon credit lots. Create projects and generate lots first to start the 8-step verification workflow.
            </p>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>📋 <strong>Claims Workflow:</strong> 8-step process with HCS integration</p>
                <p>🏆 <strong>NFT Badges:</strong> Permanent verification tokens</p>
                <p>⚡ <strong>Immutable:</strong> Blockchain-anchored proof trail</p>
              </div>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">💡 Tip: Visit Project Sheets → Marketplace to create and list carbon credits</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ClaimsWizard lots={lots} />
      )}
    </>
  );
}
