// Mock HashConnect wallet integration
export interface WalletAccount {
  accountId: string;
  publicKey: string;
}

export interface WalletState {
  isConnected: boolean;
  account: WalletAccount | null;
  isConnecting: boolean;
}

class MockHashConnect {
  private connected = false;
  private account: WalletAccount | null = null;

  async connect(): Promise<WalletAccount> {
    // Mock connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.connected = true;
    this.account = {
      accountId: `0.0.${Math.floor(Math.random() * 900000) + 100000}`,
      publicKey: `0x${Math.random().toString(16).substring(2, 66)}`
    };

    return this.account;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.account = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getAccount(): WalletAccount | null {
    return this.account;
  }

  async signTransaction(transaction: any): Promise<string> {
    // Mock transaction signing
    await new Promise(resolve => setTimeout(resolve, 500));
    return `0x${Math.random().toString(16).substring(2, 66)}`;
  }
}

export const hashConnect = new MockHashConnect();
