import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Camera, Satellite, ShieldCheck, ExternalLink, ShoppingCart, TrendingUp, Percent, Zap, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { hederaService } from "@/lib/hedera-mock";
import { MOCK_IDS } from "@shared/schema.js";
import { SUCCESS_MESSAGES, GUARDS } from "@/constants/microcopy";
import { useProofStore } from "@/contexts/proof-store";
import ProofModal from "./proof-modal";

const LotCard = ({ lot, onPurchase }) => {
  const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);
  const [quantity, setQuantity] = useState([Math.min(10, lot.availableTons || lot.listedTons || 0)]);
  const { toast } = useToast();
  const { isConnected, connect } = useWallet();
  const { addEvidence } = useProofStore();

  const totalPrice = quantity[0] * lot.pricePerTon;
  const platformFee = totalPrice * 0.03;
  const escrowAmount = totalPrice + platformFee;
  
  // Use availableTons from SEED_LOTS data structure
  const listedTons = lot.availableTons || lot.listedTons || 0;
  
  // Add fallback values for missing properties
  const lotId = lot.lotId || lot.id || 'Unknown';
  const projectImage = lot.projectImage || '/images/default-project.jpg';
  const deliveryWindow = lot.deliveryWindow || 'Q2 2024';
  const proofCount = lot.proofCount || 3;
  const proofHashes = lot.proofHashes || ['0x123abc', '0x456def', '0x789ghi'];
  
  // DeFi yield properties
  const expectedYield = lot.expectedYield || 0;
  const currentPrice = lot.currentPrice || lot.pricePerTon;
  const initialPrice = lot.initialPrice || lot.pricePerTon;
  const riskRating = lot.riskRating || 'medium';
  const stakingEnabled = lot.stakingEnabled || false;
  const stakingAPY = lot.stakingAPY || 0;
  const yieldType = lot.yieldType || 'appreciation';
  
  const formatPercentage = (rate) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const calculatePriceAppreciation = () => {
    if (initialPrice && currentPrice && initialPrice > 0) {
      return ((currentPrice - initialPrice) / initialPrice) * 100;
    }
    return 0;
  };

  const priceAppreciation = calculatePriceAppreciation();
  const isAppreciating = priceAppreciation > 0;

  const handleQuickBuy = async () => {
    if (!isConnected) {
      toast({
        title: GUARDS.WALLET_CONNECTION.title,
        description: GUARDS.WALLET_CONNECTION.description,
        variant: "destructive",
      });
      await connect();
      return;
    }
    
    try {
      const orderId = `GLY-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      
      // Use dedicated escrow transfer method
      const escrowResult = await hederaService.escrowTransfer(
        lot.lotId,
        quantity[0],
        "0.0.123456" // buyer account
      );
      
      // Create HFS file for purchase contract
      const contractData = {
        orderId,
        lotId: lot.lotId,
        quantity: quantity[0],
        pricePerTon: lot.pricePerTon,
        totalValue: totalPrice,
        buyer: "0.0.123456",
        seller: "0.0.456789",
        timestamp: new Date().toISOString(),
        escrowTxHash: escrowResult.transactionId,
        status: "ESCROWED"
      };
      const contractFile = await hederaService.createFile(JSON.stringify(contractData));
      
      // Add evidence to proof store
      addEvidence({
        kind: 'transaction',
        id: escrowResult.transactionId,
        type: 'escrow',
        lotId: lot.lotId,
        orderId: orderId,
        quantity: quantity[0],
        totalValue: totalPrice,
        action: 'buy',
        timestamp: escrowResult.timestamp
      });
      
      addEvidence({
        kind: 'file',
        id: contractFile.fileId,
        type: 'contract',
        filename: `purchase-contract-${orderId}.json`,
        lotId: lot.lotId,
        orderId: orderId,
        action: 'create',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: SUCCESS_MESSAGES.ACTIONS.ORDER_CREATED,
        description: `Order ${orderId} • ${quantity[0]} tons • $${totalPrice.toLocaleString()}`,
      });
      
      setIsQuickBuyOpen(false);
      if (onPurchase) onPurchase(orderId, quantity[0]);
      
    } catch (error) {
      toast({
        title: "Purchase Transaction Failed",
        description: "Unable to complete escrow transaction. Please check your wallet connection and try again.",
        variant: "destructive",
      });
    }
  };

  const openHashscan = (hash) => {
    const url = hederaService.getHashscanUrl(hash);
    window.open(url, '_blank');
  };

  const getProofIcon = (type) => {
    switch (type) {
      case 'photo': return <Camera className="w-3 h-3" />;
      case 'ndvi': return <Satellite className="w-3 h-3" />;
      case 'qc': return <ShieldCheck className="w-3 h-3" />;
      default: return <Camera className="w-3 h-3" />;
    }
  };

  return (
    <div className="card-base group hover:shadow-lg transition-all duration-300">
      {/* Image Header */}
      <div className="relative">
        <img 
          src={projectImage} 
          alt={`${lot.projectName} carbon credit project`}
          className="w-full h-32 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <div className="badge-success text-xs">
            ICVCM-ready
          </div>
          <div className="badge-info text-xs">
            Proofs: {proofCount}
          </div>
          {expectedYield > 0 && (
            <div className="badge-base bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3" />
              {formatPercentage(expectedYield)} APY
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="text-white text-sm font-medium">
            {lot.projectName} - {lot.location}
          </p>
        </div>
      </div>

      <div className="card-header p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" aria-label={`Carbon lot: ${lotId}`}
>        {lotId}
          </h3>
          <div className="flex gap-1">
            <div className="badge-info font-mono text-xs" aria-label="Hedera Consensus Service verified">
              HCS
            </div>
            <div className="badge-success font-mono text-xs" aria-label="Hedera File Service stored">
              HFS
            </div>
          </div>
        </div>
      </div>

      <div className="card-content space-y-3 p-3">
        {/* Meta Row - Compact */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span aria-label={`Project type: ${lot.type || 'Nature-based'}`}
>          {lot.type || 'Nature'}
            </span>
            <span aria-hidden="true">•</span>
            <span aria-label={`Project area: ${lot.area || Math.round(listedTons / 10)} hectares`}
>          {lot.area || Math.round(listedTons / 10)} ha
            </span>
            <span aria-hidden="true">•</span>
            <span aria-label={`Delivery window: ${deliveryWindow}`}
>          {deliveryWindow}
            </span>
          </div>
          <span aria-label={`Location: ${lot.location}`}
>        {lot.location?.includes('Brazil') ? '🇧🇷' : 
           lot.location?.includes('Kenya') ? '🇰🇪' : 
           lot.location?.includes('India') ? '🇮🇳' : '🌍'}
          </span>
        </div>
        
        {/* Buffer/Forward Chips - Compact */}
        <div className="flex gap-1">
          <div className="badge-warning text-xs">
            Buffer {lot.bufferPercent}%
          </div>
          {lot.forwardPercent && (
            <div className="badge-info text-xs">
              Forward {lot.forwardPercent}%
            </div>
          )}
        </div>

        {/* DeFi Yield Information */}
        {expectedYield > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-2 rounded-lg space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Expected Yield
              </span>
              <span className="font-semibold text-purple-600 text-xs">{formatPercentage(expectedYield)}</span>
            </div>
            
            {currentPrice > 0 && initialPrice > 0 && currentPrice !== initialPrice && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Price Appreciation</span>
                <span className={`text-xs font-medium ${isAppreciating ? 'text-green-600' : 'text-red-600'}`}
>              {isAppreciating ? '+' : ''}{priceAppreciation.toFixed(2)}%
                </span>
              </div>
            )}
            
            {stakingEnabled && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Staking APY
                </span>
                <span className="text-xs font-medium text-blue-600">{formatPercentage(stakingAPY)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Risk Rating</span>
              <Badge variant={riskRating === 'low' ? 'default' : riskRating === 'medium' ? 'secondary' : 'destructive'} className="text-xs">
                {riskRating}
              </Badge>
            </div>
          </div>
        )}

        {/* Quantity and Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold tabular-nums text-foreground" aria-label={`Available quantity: ${listedTons.toFixed(1)} tonnes CO2 equivalent`}
>          {listedTons.toFixed(1)} tCO2e
            </div>
            <div className="text-xs text-muted-foreground" aria-label="Availability status">
              Available for purchase
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-bold tabular-nums text-primary" aria-label={`Price per tonne: $${lot.pricePerTon.toFixed(2)}`}
>          ${lot.pricePerTon.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground" aria-label="Price unit">
              per tCO2e
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotCard;