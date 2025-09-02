// Wrapper untuk WalletContext - satu sumber kebenaran untuk wallet state
import { useWallet as useWalletContext } from '@/contexts/wallet-context';

/**
 * Hook wrapper yang menggunakan WalletContext sebagai sumber kebenaran
 * Menjaga kompatibilitas dengan komponen yang sudah mengimpor dari hooks/use-wallet
 */
export function useWallet() {
  const walletContext = useWalletContext();
  
  // Map context API ke format yang diharapkan komponen lama
  return {
    isConnected: walletContext.isConnected,
    isConnecting: walletContext.isConnecting,
    account: walletContext.walletData ? {
      accountId: walletContext.walletData.accountId,
      publicKey: walletContext.walletData.publicKey
    } : null,
    connect: walletContext.connect,
    disconnect: walletContext.disconnect,
    // Expose semua properti context untuk fleksibilitas
    ...walletContext
  };
}
