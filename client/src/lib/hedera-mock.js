// Mock Hedera blockchain services for demonstration
import { MOCK_IDS } from '@shared/schema.js';

class HederaMockService {
  // Mock HTS (Hedera Token Service)
  async createToken(symbol, supply) {
    const tokenId = `0.0.6${Math.floor(Math.random() * 90000) + 10000}`;
    return {
      tokenId,
      symbol,
      supply: supply.toString(),
      decimals: 0,
    };
  }

  async transferToken(tokenId, from, to, amount) {
    const txHash = `0x${Math.random().toString(16).substring(2, 8)}${Math.random().toString(16).substring(2, 8)}`;
    return {
      txHash,
      timestamp: new Date().toISOString(),
      success: true,
    };
  }

  async burnToken(tokenId, amount) {
    const txHash = `0x${Math.random().toString(16).substring(2, 8)}burn`;
    return {
      txHash,
      timestamp: new Date().toISOString(),
      success: true,
    };
  }

  // Mock HFS (Hedera File Service)
  async createFile(content) {
    const fileId = `0.0.7${Math.floor(Math.random() * 90000) + 10000}`;
    const hash = `0x${Math.random().toString(16).substring(2, 16)}`;
    return {
      fileId,
      content,
      hash,
    };
  }

  // Mock HCS (Hedera Consensus Service)
  async submitMessage(topicId, message) {
    const sequenceNumber = Math.floor(Math.random() * 9000) + 1000;
    const hash = `0x${Math.random().toString(16).substring(2, 16)}`;
    return {
      topicId,
      sequenceNumber,
      message,
      hash,
    };
  }

  async createTopic() {
    return `0.0.9${Math.floor(Math.random() * 90000) + 10000}`;
  }

  // Mock NFT creation
  async createNFT(metadata) {
    const tokenId = `0.0.6${Math.floor(Math.random() * 90000) + 10000}`;
    return {
      tokenId: `${tokenId}#1`,
      symbol: "GLY-CLAIM",
      supply: "1",
      decimals: 0,
    };
  }

  // Generate mock Hashscan URLs
  getHashscanUrl(hash) {
    return `https://hashscan.io/mainnet/transaction/${hash}`;
  }

  getMirrorNodeUrl(id) {
    return `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${id}`;
  }

  // Specific helper functions for consistent transaction hashes
  async escrowTransfer(lotId, quantity, buyerId) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      transactionId: MOCK_IDS.TX_HASHES.ESCROW,
      status: 'SUCCESS',
      lotId,
      quantity,
      buyerId,
      timestamp: new Date().toISOString()
    };
  }

  async deliveryTransfer(orderId, buyerId) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const deliveryCertFileId = "0.0.700200";
    const topicId = MOCK_IDS.HCS_TOPICS.PROJECT_PROOFS;
    const sequenceNumber = Math.floor(Math.random() * 1000) + 2000;
    const topicTxHash = `0x${Math.random().toString(16).substr(2, 8)}delivery`;
    
    return {
       success: true,
       transactionHash: MOCK_IDS.TX_HASHES.DELIVERY,
       orderId,
       buyerId,
       timestamp: new Date().toISOString(),
       deliveryCertFileId,
       topicId,
       sequenceNumber,
       topicTxHash
     };
  }

  async payoutTransfer(orderId, developerId) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      transactionHash: MOCK_IDS.TX_HASHES.PAYOUT,
      orderId,
      developerId,
      timestamp: new Date().toISOString()
    };
  }

  // Generate Lot - Complete HTS create+mint, HFS file, HCS topic operations
  async generateLot(lotData) {
    // Simulate network delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Step 1: HTS Token Creation and Minting
      const lotId = `PBCL-${lotData.type.substring(0,2).toUpperCase()}-${lotData.location.substring(0,3).toUpperCase()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
      const tokenSymbol = `GLY-${lotId}`;
      
      const tokenResult = await this.createToken(tokenSymbol, Math.floor(lotData.listedTons));
      
      // Step 2: HFS File Creation (Project Sheet)
      const projectSheetContent = {
        lotId,
        projectName: lotData.projectName,
        location: lotData.location,
        type: lotData.type,
        area: lotData.area,
        rate: lotData.rate,
        buffer: lotData.buffer,
        forward: lotData.forward,
        pricePerTon: lotData.pricePerTon,
        expectedTons: lotData.expectedTons,
        listedTons: lotData.listedTons,
        value: lotData.value,
        uploadedFiles: lotData.uploadedFiles,
        timestamp: new Date().toISOString(),
        tokenId: tokenResult.tokenId
      };
      
      const fileResult = await this.createFile(JSON.stringify(projectSheetContent));
      
      // Step 3: HCS Topic Message (LOT_LISTED)
      const topicMessage = {
        action: 'LOT_LISTED',
        lotId,
        tokenId: tokenResult.tokenId,
        fileId: fileResult.fileId,
        projectName: lotData.projectName,
        listedTons: lotData.listedTons,
        pricePerTon: lotData.pricePerTon,
        timestamp: new Date().toISOString()
      };
      
      const topicResult = await this.submitMessage(
        MOCK_IDS.HCS_TOPICS.PROJECT_PROOFS,
        JSON.stringify(topicMessage)
      );
      
      // Return comprehensive result for evidence logging
      return {
        success: true,
        lotId,
        tokenId: tokenResult.tokenId,
        fileId: fileResult.fileId,
        topicId: MOCK_IDS.HCS_TOPICS.PROJECT_PROOFS,
        sequenceNumber: topicResult.sequenceNumber,
        transactionHashes: {
          tokenCreation: `0x${Math.random().toString(16).substring(2, 16)}token`,
          fileMint: `0x${Math.random().toString(16).substring(2, 16)}file`,
          topicSubmit: `0x${Math.random().toString(16).substring(2, 16)}topic`
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Lot generation failed: ${error.message}`);
    }
  }
}

export const hederaService = new HederaMockService();

// Expanded mock data for dense UI
export const mockCarbonLots = [
  {
    id: "1",
    lotId: "PBCL-MG-IDN-001",
    projectName: "Mangrove Restoration 100 ha",
    location: "West Java, Indonesia",
    area: "100",
    listedTons: "240",
    pricePerTon: "10",
    deliveryWindow: "Q1'26",
    bufferPercent: "20",
    forwardPercent: "25",
    status: "listed",
    tokenId: "0.0.600111",
    projectImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    proofHashes: {
      photo: "0xabc123",
      ndvi: "0xdef456",
      qc: "0xghi789"
    }
  },
  {
    id: "2",
    lotId: "PBCL-CC-KEN-002",
    projectName: "Clean Cookstove 500 units",
    location: "Nairobi, Kenya",
    units: 500,
    listedTons: "600",
    pricePerTon: "9",
    deliveryWindow: "Q2'26",
    bufferPercent: "15",
    forwardPercent: "30",
    status: "LISTED",
    tokenId: "0.0.600112",
    projectImage: "https://images.unsplash.com/photo-1626847637825-79692c4e9ff6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    proofHashes: {
      photo: "0xabc124",
      ndvi: "0xdef457",
      qc: "0xghi790"
    }
  },
  {
    id: "3",
    lotId: "PBCL-AG-UGA-003",
    projectName: "Agroforestry Program 50 ha",
    location: "Kampala, Uganda",
    area: "50",
    listedTons: "180",
    pricePerTon: "11",
    deliveryWindow: "Q3'26",
    bufferPercent: "20",
    forwardPercent: "35",
    status: "LISTED",
    tokenId: "0.0.600113",
    projectImage: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    proofHashes: {
      photo: "0xabc125",
      ndvi: "0xdef458",
      qc: "0xghi791"
    }
  },
  {
    id: "4",
    lotId: "PBCL-WM-NGA-004",
    projectName: "Methane Capture Digester",
    location: "Lagos, Nigeria",
    listedTons: "320",
    pricePerTon: "8",
    deliveryWindow: "Q4'26",
    bufferPercent: "10",
    forwardPercent: "20",
    status: "LISTED",
    tokenId: "0.0.600114",
    projectImage: "https://images.unsplash.com/photo-1497436072909-f5e4be769fe6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    proofHashes: {
      photo: "0xabc126",
      ndvi: "0xdef459",
      qc: "0xghi792"
    }
  },
  {
    id: "5",
    lotId: "PBCL-CC-GHA-005",
    projectName: "Community Cookstoves 300 units",
    location: "Tamale, Ghana",
    units: 300,
    listedTons: "540",
    pricePerTon: "8.5",
    deliveryWindow: "Q1'26",
    bufferPercent: "15",
    forwardPercent: "25",
    status: "LISTED",
    tokenId: "0.0.600115",
    projectImage: "https://images.unsplash.com/photo-1626847637825-79692c4e9ff6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    proofHashes: {
      photo: "0xabc127",
      ndvi: "0xdef460",
      qc: "0xghi793"
    }
  },
  {
    id: "6",
    lotId: "PBCL-RF-TZA-006",
    projectName: "Reforestation Initiative 75 ha",
    location: "Dar es Salaam, Tanzania",
    area: "75",
    listedTons: "285",
    pricePerTon: "9.5",
    deliveryWindow: "Q2'26",
    bufferPercent: "18",
    forwardPercent: "28",
    status: "LISTED",
    tokenId: "0.0.600116",
    projectImage: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    proofHashes: {
      photo: "0xabc128",
      ndvi: "0xdef461",
      qc: "0xghi794"
    }
  },
  {
    id: "7",
    lotId: "PBCL-BG-RWA-007",
    projectName: "Biogas Systems 150 units",
    location: "Kigali, Rwanda",
    units: 150,
    listedTons: "380",
    pricePerTon: "10.5",
    deliveryWindow: "Q3'26",
    bufferPercent: "12",
    forwardPercent: "33",
    status: "LISTED",
    tokenId: "0.0.600117",
    projectImage: "https://images.unsplash.com/photo-1497436072909-f5e4be769fe6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    proofHashes: {
      photo: "0xabc129",
      ndvi: "0xdef462",
      qc: "0xghi795"
    }
  },
  {
    id: "8",
    lotId: "PBCL-RC-ZAF-008",
    projectName: "Regenerative Agriculture 120 ha",
    location: "Western Cape, South Africa",
    area: "120",
    listedTons: "420",
    pricePerTon: "9.8",
    deliveryWindow: "Q4'26",
    bufferPercent: "18",
    forwardPercent: "32",
    status: "LISTED",
    tokenId: "0.0.600118",
    projectImage: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    proofHashes: {
      photo: "0xabc130",
      ndvi: "0xdef463",
      qc: "0xghi796"
    }
  }
];

export const mockProofEntries = [
  {
    id: "1",
    lotId: "PBCL-MG-IDN-001",
    proofType: "Photo geotag",
    hash: "0xabc111",
    timestamp: "2025-01-15T09:10:00Z",
    topicId: "0.0.900123",
    sequenceNumber: 1001,
  },
  {
    id: "2",
    lotId: "PBCL-MG-IDN-001",
    proofType: "NDVI update",
    hash: "0xdef222",
    timestamp: "2025-01-20T00:00:00Z",
    topicId: "0.0.900123",
    sequenceNumber: 1002,
  },
  {
    id: "3",
    lotId: "PBCL-MG-IDN-001",
    proofType: "QC check",
    hash: "0xghi333",
    timestamp: "2025-01-25T14:00:00Z",
    topicId: "0.0.900123",
    sequenceNumber: 1003,
  },
  {
    id: "4",
    lotId: "PBCL-CC-KEN-002",
    proofType: "Installation photo",
    hash: "0xjkl444",
    timestamp: "2025-01-12T11:30:00Z",
    topicId: "0.0.900124",
    sequenceNumber: 1004,
  },
  {
    id: "5",
    lotId: "PBCL-CC-KEN-002",
    proofType: "Usage verification",
    hash: "0xmno555",
    timestamp: "2025-01-18T16:45:00Z",
    topicId: "0.0.900124",
    sequenceNumber: 1005,
  },
  {
    id: "6",
    lotId: "PBCL-AG-UGA-003",
    proofType: "Drone survey",
    hash: "0xpqr666",
    timestamp: "2025-01-10T08:20:00Z",
    topicId: "0.0.900125",
    sequenceNumber: 1006,
  },
  {
    id: "7",
    lotId: "PBCL-AG-UGA-003",
    proofType: "Soil analysis",
    hash: "0xstu777",
    timestamp: "2025-01-22T13:15:00Z",
    topicId: "0.0.900125",
    sequenceNumber: 1007,
  },
  {
    id: "8",
    lotId: "PBCL-WM-NGA-004",
    proofType: "Methane measurement",
    hash: "0xvwx888",
    timestamp: "2025-01-14T10:00:00Z",
    topicId: "0.0.900126",
    sequenceNumber: 1008,
  },
  {
    id: "9",
    lotId: "PBCL-WM-NGA-004",
    proofType: "Equipment inspection",
    hash: "0xyzab99",
    timestamp: "2025-01-28T15:30:00Z",
    topicId: "0.0.900126",
    sequenceNumber: 1009,
  },
  {
    id: "10",
    lotId: "PBCL-CC-GHA-005",
    proofType: "Cookstove installation",
    hash: "0xcdef00",
    timestamp: "2025-01-08T07:45:00Z",
    topicId: "0.0.900127",
    sequenceNumber: 1010,
  },
  {
    id: "11",
    lotId: "PBCL-CC-GHA-005",
    proofType: "Usage monitoring",
    hash: "0xghij11",
    timestamp: "2025-01-26T12:00:00Z",
    topicId: "0.0.900127",
    sequenceNumber: 1011,
  },
  {
    id: "12",
    lotId: "PBCL-RF-TZA-006",
    proofType: "Seedling count",
    hash: "0xklmn22",
    timestamp: "2025-01-11T14:20:00Z",
    topicId: "0.0.900128",
    sequenceNumber: 1012,
  },
  {
    id: "13",
    lotId: "PBCL-RF-TZA-006",
    proofType: "Growth monitoring",
    hash: "0xopqr33",
    timestamp: "2025-01-24T09:30:00Z",
    topicId: "0.0.900128",
    sequenceNumber: 1013,
  },
  {
    id: "14",
    lotId: "PBCL-BG-RWA-007",
    proofType: "Biogas production",
    hash: "0xstuv44",
    timestamp: "2025-01-16T11:10:00Z",
    topicId: "0.0.900129",
    sequenceNumber: 1014,
  },
  {
    id: "15",
    lotId: "PBCL-BG-RWA-007",
    proofType: "Maintenance check",
    hash: "0xwxyz55",
    timestamp: "2025-01-29T16:00:00Z",
    topicId: "0.0.900129",
    sequenceNumber: 1015,
  },
  {
    id: "16",
    lotId: "PBCL-RC-ZAF-008",
    proofType: "Soil carbon analysis",
    hash: "0xabcd66",
    timestamp: "2025-01-13T06:30:00Z",
    topicId: "0.0.900130",
    sequenceNumber: 1016,
  },
  {
    id: "17",
    lotId: "PBCL-RC-ZAF-008",
    proofType: "Cover crop verification",
    hash: "0xefgh77",
    timestamp: "2025-01-27T18:45:00Z",
    topicId: "0.0.900130",
    sequenceNumber: 1017,
  }
];

// Expanded order data
export const mockOrders = [
  {
    orderId: "GLY-2025-0001",
    lotId: "PBCL-MG-IDN-001",
    quantity: 240,
    pricePerTon: 10,
    totalValue: 2400,
    status: "completed",
    progress: 75,
    escrowTxHash: "0x111aaa",
    deliveryTxHash: "0x222bbb",
    payoutTxHash: null,
    contractFileId: "0.0.700111",
    buyerAccount: "0.0.123456"
  },
  {
    orderId: "GLY-2025-0002",
    lotId: "PBCL-CC-KEN-002",
    quantity: 300,
    pricePerTon: 9,
    totalValue: 2700,
    status: "escrow",
    progress: 25,
    escrowTxHash: "0x333ccc",
    deliveryTxHash: null,
    payoutTxHash: null,
    contractFileId: "0.0.700112",
    buyerAccount: "0.0.234567"
  },
  {
    orderId: "GLY-2025-0003",
    lotId: "PBCL-AG-UGA-003",
    quantity: 180,
    pricePerTon: 11,
    totalValue: 1980,
    status: "completed",
    progress: 100,
    escrowTxHash: "0x444ddd",
    deliveryTxHash: "0x555eee",
    payoutTxHash: "0x666fff",
    contractFileId: "0.0.700113",
    buyerAccount: "0.0.345678"
  },
  {
    orderId: "GLY-2025-0004",
    lotId: "PBCL-WM-NGA-004",
    quantity: 160,
    pricePerTon: 8,
    totalValue: 1280,
    status: "DELIVERED",
    progress: 75,
    escrowTxHash: "0x777ggg",
    deliveryTxHash: "0x888hhh",
    payoutTxHash: null,
    contractFileId: "0.0.700114",
    buyerAccount: "0.0.456789"
  },
  {
    orderId: "GLY-2025-0005",
    lotId: "PBCL-CC-GHA-005",
    quantity: 270,
    pricePerTon: 8.5,
    totalValue: 2295,
    status: "ESCROWED",
    progress: 25,
    escrowTxHash: "0x999iii",
    deliveryTxHash: null,
    payoutTxHash: null,
    contractFileId: "0.0.700115",
    buyerAccount: "0.0.567890"
  },
  {
    orderId: "GLY-2025-0006",
    lotId: "PBCL-RF-TZA-006",
    quantity: 285,
    pricePerTon: 9.5,
    totalValue: 2707.5,
    status: "DELIVERED",
    progress: 75,
    escrowTxHash: "0xaaajjj",
    deliveryTxHash: "0xbbbkkk",
    payoutTxHash: null,
    contractFileId: "0.0.700116",
    buyerAccount: "0.0.678901"
  }
];

// Mock project sheet data
export const mockProjectSheets = [
  {
    id: "1",
    projectName: "Coastal Mangrove Restoration",
    location: "Sumatra, Indonesia",
    area: 150,
    ratePerHaPerYear: 3.2,
    bufferPercent: 20,
    forwardPercent: 30,
    expectedTons: 480,
    afterBufferTons: 384,
    listedTons: 115.2,
    estimatedValue: 1152,
    lotId: "PBCL-MG-IDN-009",
    tokenId: "0.0.600119",
    status: "GENERATED"
  },
  {
    id: "2",
    projectName: "Rural Cookstove Distribution",
    location: "Western Kenya",
    units: 800,
    ratePerUnit: 1.2,
    bufferPercent: 15,
    forwardPercent: 35,
    expectedTons: 960,
    afterBufferTons: 816,
    listedTons: 285.6,
    estimatedValue: 2856,
    lotId: "PBCL-CC-KEN-010",
    tokenId: "0.0.600120",
    status: "GENERATED"
  },
  {
    id: "3",
    projectName: "Wetland Restoration",
    location: "Northern Ghana",
    area: 85,
    ratePerHaPerYear: 4.8,
    bufferPercent: 22,
    forwardPercent: 30,
    expectedTons: 408,
    afterBufferTons: 318,
    listedTons: 95.4,
    estimatedValue: 954,
    lotId: "PBCL-WL-GHA-011",
    tokenId: "0.0.600121",
    status: "draft"
  }
];
