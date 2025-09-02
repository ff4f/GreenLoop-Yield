import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, AlertCircle } from 'lucide-react';
import { GUARDS } from '@/constants/microcopy';
import { useWallet } from '@/contexts/wallet-context';

/**
 * WalletGuard component that blocks actions requiring wallet connection
 * Shows a guard UI when wallet is not connected, otherwise renders children
 */
export const WalletGuard = ({ 
  children, 
  action = "proceed",
  showCard = true,
  className = ""
}) => {
  const { isConnected, connect, isConnecting } = useWallet();

  // If wallet is connected, render children
  if (isConnected) {
    return children;
  }

  // Guard content
  const guardContent = (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="flex items-center space-x-2 text-amber-600">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">{GUARDS.WALLET_REQUIRED.title}</span>
      </div>
      
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {GUARDS.WALLET_REQUIRED.description.replace('this action', action)}
      </p>
      
      <Button 
        onClick={connect}
        disabled={isConnecting}
        className="flex items-center space-x-2"
      >
        <Wallet className="h-4 w-4" />
        <span>
          {isConnecting ? 'Connecting...' : GUARDS.WALLET_REQUIRED.action}
        </span>
      </Button>
    </div>
  );

  // Return with or without card wrapper
  if (showCard) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Wallet Required</span>
          </CardTitle>
          <CardDescription>
            Connect your Hedera wallet to {action}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {guardContent}
        </CardContent>
      </Card>
    );
  }

  return guardContent;
};

/**
 * Hook to check wallet connection status and provide guard utilities
 */
export const useWalletGuard = () => {
  const { isConnected, connect, isConnecting } = useWallet();

  const requireWallet = (callback, action = "proceed") => {
    if (!isConnected) {
      // Could trigger a toast or modal here
      console.warn(`Wallet required to ${action}`);
      return false;
    }
    callback();
    return true;
  };

  return {
    isConnected,
    connect,
    isConnecting,
    requireWallet,
    WalletGuard: (props) => <WalletGuard {...props} />
  };
};

/**
 * Higher-order component that wraps a component with wallet guard
 */
export const withWalletGuard = (WrappedComponent, guardProps = {}) => {
  return function WalletGuardedComponent(props) {
    return (
      <WalletGuard {...guardProps}>
        <WrappedComponent {...props} />
      </WalletGuard>
    );
  };
};

export default WalletGuard;