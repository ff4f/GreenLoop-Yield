// Mock Hedera blockchain services for demonstration
export interface HederaTransaction {
  txHash: string;
  timestamp: string;
  success: boolean;
}

export interface HederaFileService {
  fileId: string;
  content: string;
  hash: string;
}

export interface HederaConsensusService {
  topicId: string;
  sequenceNumber: number;
  message: string;
  hash: string;
}

export interface HederaTokenService {
  tokenId: string;
  symbol: string;
  supply: string;
  decimals: number;
}

class HederaMockService {
  // Mock HTS (Hedera Token Service)
  async createToken(symbol: string, supply: number): Promise<HederaTokenService> {
    const tokenId = `0.0.6${Math.floor(Math.random() * 90000) + 10000}`;
    return {
      tokenId,
      symbol,
      supply: supply.toString(),
      decimals: 0,
    };
  }

  async transferToken(tokenId: string, from: string, to: string, amount: number): Promise<HederaTransaction> {
    const txHash = `0x${Math.random().toString(16).substring(2, 8)}${Math.random().toString(16).substring(2, 8)}`;
    return {
      txHash,
      timestamp: new Date().toISOString(),
      success: true,
    };
  }

  async burnToken(tokenId: string, amount: number): Promise<HederaTransaction> {
    const txHash = `0x${Math.random().toString(16).substring(2, 8)}burn`;
    return {
      txHash,
      timestamp: new Date().toISOString(),
      success: true,
    };
  }

  // Mock HFS (Hedera File Service)
  async createFile(content: string): Promise<HederaFileService> {
    const fileId = `0.0.7${Math.floor(Math.random() * 90000) + 10000}`;
    const hash = `0x${Math.random().toString(16).substring(2, 16)}`;
    return {
      fileId,
      content,
      hash,
    };
  }

  // Mock HCS (Hedera Consensus Service)
  async submitMessage(topicId: string, message: string): Promise<HederaConsensusService> {
    const sequenceNumber = Math.floor(Math.random() * 9000) + 1000;
    const hash = `0x${Math.random().toString(16).substring(2, 16)}`;
    return {
      topicId,
      sequenceNumber,
      message,
      hash,
    };
  }

  async createTopic(): Promise<string> {
    return `0.0.9${Math.floor(Math.random() * 90000) + 10000}`;
  }

  // Mock NFT creation
  async createNFT(metadata: object): Promise<HederaTokenService> {
    const tokenId = `0.0.6${Math.floor(Math.random() * 90000) + 10000}`;
    return {
      tokenId: `${tokenId}#1`,
      symbol: "GLY-CLAIM",
      supply: "1",
      decimals: 0,
    };
  }

  // Generate mock Hashscan URLs
  getHashscanUrl(hash: string): string {
    return `https://hashscan.io/mainnet/transaction/${hash}`;
  }

  getMirrorNodeUrl(id: string): string {
    return `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${id}`;
  }
}

export const hederaService = new HederaMockService();

// Mock data for the 4 mandatory PBCL lots
export const mockCarbonLots = [
  {
    id: "1",
    lotId: "PBCL-MG-IDN-001",
    projectName: "Mangrove 100 ha",
    location: "Indonesia",
    area: "100",
    listedTons: "240",
    pricePerTon: "10",
    deliveryWindow: "Q1'26",
    bufferPercent: "20",
    forwardPercent: "25",
    status: "LISTED",
    tokenId: "0.0.600111",
    proofHashes: {
      photo: "0xabc123",
      ndvi: "0xdef456",
      qc: "0xghi789"
    }
  },
  {
    id: "2",
    lotId: "PBCL-CC-KEN-002",
    projectName: "Cookstove 500 units",
    location: "Kenya",
    units: 500,
    listedTons: "600",
    pricePerTon: "9",
    deliveryWindow: "Q2'26",
    bufferPercent: "15",
    status: "LISTED",
    tokenId: "0.0.600112",
    proofHashes: {
      photo: "0xabc124",
      ndvi: "0xdef457",
      qc: "0xghi790"
    }
  },
  {
    id: "3",
    lotId: "PBCL-AG-UGA-003",
    projectName: "Agroforestry 50 ha",
    location: "Uganda",
    area: "50",
    listedTons: "180",
    pricePerTon: "11",
    deliveryWindow: "Q3'26",
    bufferPercent: "20",
    status: "LISTED",
    tokenId: "0.0.600113",
    proofHashes: {
      photo: "0xabc125",
      ndvi: "0xdef458",
      qc: "0xghi791"
    }
  },
  {
    id: "4",
    lotId: "PBCL-WM-NGA-004",
    projectName: "Methane Digester",
    location: "Nigeria",
    listedTons: "320",
    pricePerTon: "8",
    deliveryWindow: "Q4'26",
    bufferPercent: "10",
    status: "LISTED",
    tokenId: "0.0.600114",
    proofHashes: {
      photo: "0xabc126",
      ndvi: "0xdef459",
      qc: "0xghi792"
    }
  }
];

export const mockProofEntries = [
  {
    id: "1",
    lotId: "PBCL-MG-IDN-001",
    proofType: "Photo geotag",
    hash: "0xabc111",
    timestamp: "2025-07-01T09:10:00Z",
    topicId: "0.0.900123",
    sequenceNumber: 1001,
  },
  {
    id: "2",
    lotId: "PBCL-MG-IDN-001",
    proofType: "NDVI update",
    hash: "0xdef222",
    timestamp: "2025-07-15T00:00:00Z",
    topicId: "0.0.900123",
    sequenceNumber: 1002,
  },
  {
    id: "3",
    lotId: "PBCL-MG-IDN-001",
    proofType: "QC check",
    hash: "0xghi333",
    timestamp: "2025-07-20T14:00:00Z",
    topicId: "0.0.900123",
    sequenceNumber: 1003,
  },
];
