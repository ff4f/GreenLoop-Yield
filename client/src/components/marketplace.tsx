import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Satellite, ShieldCheck, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { mockCarbonLots, hederaService } from "@/lib/hedera-mock";

export default function Marketplace() {
  const { toast } = useToast();
  const { isConnected, connect } = useWallet();

  const handleViewProof = (lotId: string) => {
    toast({
      title: "Proof Chain Loaded",
      description: "Proof loaded. Click any hash to verify.",
    });
  };

  const handleBuyEscrow = async (lotId: string, tons: number, pricePerTon: number) => {
    if (!isConnected) {
      await connect();
      return;
    }
    
    try {
      const totalValue = tons * pricePerTon;
      const orderId = `GLY-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      
      // Mock HTS Transfer to escrow smart contract
      const escrowTx = await hederaService.transferToken(
        "0.0.600111", 
        "0.0.123456", // buyer account
        "0.0.789012", // escrow smart contract
        tons
      );
      
      // Create HFS file for purchase contract
      const contractData = {
        orderId,
        lotId,
        quantity: tons,
        pricePerTon,
        totalValue,
        buyer: "0.0.123456",
        seller: "0.0.456789",
        timestamp: new Date().toISOString(),
        escrowTxHash: escrowTx.txHash,
        status: "ESCROWED"
      };
      const contractFile = await hederaService.createFile(JSON.stringify(contractData));
      
      toast({
        title: "Purchase Successful",
        description: `OrderID: ${orderId} • EscrowTx: ${escrowTx.txHash} • Contract: ${contractFile.fileId}`,
      });
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Failed to lock escrow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openHashscan = (hash: string) => {
    const url = hederaService.getHashscanUrl(hash);
    toast({
      title: "Opening Hashscan",
      description: `Opening Hashscan for ${hash}`,
    });
    // In a real app: window.open(url, '_blank');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <p className="text-muted-foreground">Parcel-Backed Carbon Credit Lots (PBCL) with proof chains</p>
      </div>
      
      <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockCarbonLots.map((lot) => (
          <Card key={lot.id} className="dense-grid" data-testid={`lot-card-${lot.lotId}`}>
            <div className="relative">
              <img 
                src={lot.projectImage} 
                alt={lot.projectName}
                className="w-full h-32 object-cover rounded-t-lg"
              />
              <Badge className="absolute top-2 right-2 proof-badge">ICVCM-ready</Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{lot.lotId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-foreground font-medium text-sm">{lot.projectName}</div>
                <div className="text-xs text-muted-foreground">{lot.location}</div>
                <div className="text-muted-foreground text-xs">
                  {lot.listedTons} t @ ${lot.pricePerTon}/t • {lot.deliveryWindow}
                </div>
                <div className="flex space-x-2 text-xs text-muted-foreground">
                  <span>Buffer: {lot.bufferPercent}%</span>
                  {lot.forwardPercent && <span>Forward: {lot.forwardPercent}%</span>}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewProof(lot.lotId)}
                      data-testid={`button-view-proof-${lot.lotId}`}
                    >
                      Proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid={`proof-dialog-${lot.lotId}`}>
                    <DialogHeader>
                      <DialogTitle>Proof Chain - {lot.lotId}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                        <Camera className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Photo geotag</div>
                          <div className="text-sm text-muted-foreground">2025-07-01 09:10Z</div>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => openHashscan(lot.proofHashes.photo)}
                          className="font-mono text-sm p-0 h-auto"
                          data-testid={`hash-photo-${lot.lotId}`}
                        >
                          {lot.proofHashes.photo} <ExternalLink className="ml-1 w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                        <Satellite className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium text-foreground">NDVI delta</div>
                          <div className="text-sm text-muted-foreground">2025-07-15 00:00Z</div>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => openHashscan(lot.proofHashes.ndvi)}
                          className="font-mono text-sm p-0 h-auto"
                          data-testid={`hash-ndvi-${lot.lotId}`}
                        >
                          {lot.proofHashes.ndvi} <ExternalLink className="ml-1 w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium text-foreground">QC check</div>
                          <div className="text-sm text-muted-foreground">2025-07-20 14:00Z</div>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => openHashscan(lot.proofHashes.qc)}
                          className="font-mono text-sm p-0 h-auto"
                          data-testid={`hash-qc-${lot.lotId}`}
                        >
                          {lot.proofHashes.qc} <ExternalLink className="ml-1 w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm"
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
                  onClick={() => handleBuyEscrow(lot.lotId, parseInt(lot.listedTons), parseInt(lot.pricePerTon))}
                  data-testid={`button-buy-escrow-${lot.lotId}`}
                >
                  Buy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
