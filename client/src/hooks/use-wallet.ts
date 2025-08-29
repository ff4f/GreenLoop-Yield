import { useState, useEffect } from 'react';
import { hashConnect, type WalletState } from '@/lib/wallet';
import { useToast } from '@/hooks/use-toast';

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    account: null,
    isConnecting: false,
  });
  const { toast } = useToast();

  const connect = async () => {
    setState(prev => ({ ...prev, isConnecting: true }));
    
    try {
      const account = await hashConnect.connect();
      setState({
        isConnected: true,
        account,
        isConnecting: false,
      });
      
      toast({
        title: "Wallet Connected",
        description: `HashConnect wallet connected • Account ${account.accountId}`,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isConnecting: false }));
      toast({
        title: "Connection Failed",
        description: "Failed to connect HashConnect wallet",
        variant: "destructive",
      });
    }
  };

  const disconnect = async () => {
    await hashConnect.disconnect();
    setState({
      isConnected: false,
      account: null,
      isConnecting: false,
    });
    
    toast({
      title: "Wallet Disconnected",
      description: "HashConnect wallet disconnected",
    });
  };

  useEffect(() => {
    // Check if already connected on mount
    if (hashConnect.isConnected()) {
      const account = hashConnect.getAccount();
      setState({
        isConnected: true,
        account,
        isConnecting: false,
      });
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
  };
}
