import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashConnect } from '@hashgraph/hashconnect';
import { toast } from 'sonner';
import { SUCCESS_MESSAGES } from '@/constants/microcopy';

// Create wallet context
const WalletContext = createContext(null);

/**
 * Wallet Provider component that manages Hedera wallet connection state
 */
export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [error, setError] = useState(null);
  const [hashConnect, setHashConnect] = useState(null);
  const [availableExtensions, setAvailableExtensions] = useState([]);

  // Initialize HashConnect on mount
  useEffect(() => {
    initializeHashConnect();
  }, []);

  const initializeHashConnect = async () => {
    try {
      const hashConnectInstance = new HashConnect(true); // true for debug mode
      setHashConnect(hashConnectInstance);

      // Set up event listeners
      hashConnectInstance.connectionStatusChangeEvent.on((connectionStatus) => {
        console.log('HashConnect connection status:', connectionStatus);
      });

      hashConnectInstance.pairingEvent.on((pairingData) => {
        console.log('HashConnect pairing event:', pairingData);
        if (pairingData.accountIds && pairingData.accountIds.length > 0) {
          const walletInfo = {
            accountId: pairingData.accountIds[0],
            publicKey: pairingData.publicKey,
            network: pairingData.network || 'testnet',
            connectedAt: new Date().toISOString(),
            walletType: pairingData.metadata?.name || 'HashPack',
            topic: pairingData.topic
          };
          
          setWalletData(walletInfo);
          setIsConnected(true);
          setIsConnecting(false);
          
          // Persist connection
          localStorage.setItem('hedera_wallet_data', JSON.stringify(walletInfo));
          localStorage.setItem('hashconnect_topic', pairingData.topic);
          
          toast.success(SUCCESS_MESSAGES.ACTIONS.WALLET_CONNECTED);
        }
      });

      // Initialize HashConnect
      const appMetadata = {
        name: 'GreenLoop Yield',
        description: 'Parcel-backed carbon credits with blockchain verification',
        icon: 'https://greenloop-yield.vercel.app/favicon.ico',
        url: 'https://greenloop-yield.vercel.app'
      };

      await hashConnectInstance.init(appMetadata, 'testnet', false);
      
      // Check for available extensions
      const extensions = hashConnectInstance.findLocalWallets();
      setAvailableExtensions(extensions);
      
      // Check for existing connection
      await checkExistingConnection(hashConnectInstance);
      
    } catch (error) {
      console.error('Failed to initialize HashConnect:', error);
      setError('Failed to initialize wallet connection');
    }
  };

  const checkExistingConnection = async (hashConnectInstance) => {
    try {
      const savedTopic = localStorage.getItem('hashconnect_topic');
      const savedWallet = localStorage.getItem('hedera_wallet_data');
      
      if (savedTopic && savedWallet && hashConnectInstance) {
        const walletInfo = JSON.parse(savedWallet);
        
        // Try to reconnect using saved topic
        const connectionState = await hashConnectInstance.connect(savedTopic);
        
        if (connectionState && connectionState.accountIds && connectionState.accountIds.length > 0) {
          setWalletData(walletInfo);
          setIsConnected(true);
          console.log('Reconnected to existing wallet session');
        } else {
          // Clear invalid saved data
          localStorage.removeItem('hedera_wallet_data');
          localStorage.removeItem('hashconnect_topic');
        }
      }
    } catch (error) {
      console.error('Error checking existing wallet connection:', error);
      localStorage.removeItem('hedera_wallet_data');
      localStorage.removeItem('hashconnect_topic');
    }
  };

  const connect = async () => {
    if (isConnecting || !hashConnect) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      // Check if any wallet extensions are available
      if (availableExtensions.length === 0) {
        // Tetap lanjutkan: beberapa wallet extension mendukung connect walau tidak terdeteksi melalui findLocalWallets
        console.warn('No Hedera wallet extensions found by detection. Proceeding to open wallet if available...');
      }

      // Create or resume a pairing topic then generate pairing string (HashConnect v1 flow)
      const state = await hashConnect.connect();
      const pairingString = hashConnect.generatePairingString(state, 'testnet', false);

      // Store topic to allow reconnection later
      if (state?.topic) {
        localStorage.setItem('hashconnect_topic', state.topic);
      }

      // Prompt local wallet (HashPack extension) to pair
      await hashConnect.connectToLocalWallet(pairingString);
      
      // The actual connection will be handled by the pairingEvent listener
      // which was set up in initializeHashConnect
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      const message = (error && (error.message || error.toString())) || 'Failed to connect wallet';
      setError(message);
      toast.error(message || 'Failed to connect wallet. Please try again.');
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (hashConnect && walletData?.topic) {
        await hashConnect.disconnect(walletData.topic);
      }
      
      setWalletData(null);
      setIsConnected(false);
      setError(null);
      
      // Clear persisted connection
      localStorage.removeItem('hedera_wallet_data');
      localStorage.removeItem('hashconnect_topic');
      
      toast.success('Wallet disconnected successfully');
      
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  const getAccountId = () => {
    return walletData?.accountId || null;
  };

  const getPublicKey = () => {
    return walletData?.publicKey || null;
  };

  const getNetwork = () => {
    return walletData?.network || 'testnet';
  };

  const value = {
    // Connection state
    isConnected,
    isConnecting,
    walletData,
    error,
    availableExtensions,
    
    // Actions
    connect,
    disconnect,
    
    // Getters
    getAccountId,
    getPublicKey,
    getNetwork,
    
    // HashConnect instance for advanced operations
    hashConnect,
    
    // Utilities
    isReady: isConnected && !isConnecting && !error
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Hook to use wallet context
 */
export const useWallet = () => {
  const context = useContext(WalletContext);
  
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
};

/**
 * Hook for wallet-dependent operations
 */
export const useWalletOperation = () => {
  const wallet = useWallet();
  
  const executeWithWallet = async (operation, operationName = 'operation') => {
    if (!wallet.isConnected) {
      toast.error(`Please connect your wallet to ${operationName}`);
      return null;
    }
    
    if (!wallet.isReady) {
      toast.error('Wallet is not ready. Please try again.');
      return null;
    }
    
    try {
      return await operation(wallet);
    } catch (error) {
      console.error(`Wallet operation failed (${operationName}):`, error);
      toast.error(`Failed to ${operationName}. Please try again.`);
      throw error;
    }
  };
  
  return {
    ...wallet,
    executeWithWallet
  };
};

export default WalletContext;