// Mock HashConnect wallet integration

class MockHashConnect {
  constructor() {
    this.connected = false;
    this.account = null;
  }

  async connect() {
    // Mock connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.connected = true;
    this.account = {
      accountId: `0.0.${Math.floor(Math.random() * 900000) + 100000}`,
      publicKey: `0x${Math.random().toString(16).substring(2, 66)}`
    };

    return this.account;
  }

  async disconnect() {
    this.connected = false;
    this.account = null;
  }

  isConnected() {
    return this.connected;
  }

  getAccount() {
    return this.account;
  }

  async signTransaction(transaction) {
    // Mock transaction signing
    await new Promise(resolve => setTimeout(resolve, 500));
    return `0x${Math.random().toString(16).substring(2, 66)}`;
  }
}

export const hashConnect = new MockHashConnect();
