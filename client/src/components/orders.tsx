import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hederaService } from "@/lib/hedera-mock";

const mockOrders = [
  {
    orderId: "GLY-2025-0001",
    lotId: "PBCL-MG-IDN-001",
    quantity: 240,
    pricePerTon: 10,
    totalValue: 2400,
    status: "DELIVERED",
    progress: 75,
    escrowTxHash: "0x111aaa",
    deliveryTxHash: "0x222bbb",
    payoutTxHash: null,
  }
];

export default function Orders() {
  const { toast } = useToast();

  const handleMarkDelivered = async (orderId: string) => {
    try {
      const tx = await hederaService.transferToken("0.0.600111", "escrow", "buyer", 240);
      
      toast({
        title: "Escrow Released",
        description: `Escrow released • Tx ${tx.txHash}`,
      });
    } catch (error) {
      toast({
        title: "Release Failed",
        description: "Failed to release escrow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadContract = async (orderId: string) => {
    try {
      const file = await hederaService.createFile(`Contract for ${orderId}`);
      
      toast({
        title: "Contract Downloaded",
        description: `Contract downloaded • HFS ${file.fileId}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download contract. Please try again.",
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
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground">Finance & Settlement tracking with blockchain evidence</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OrderID</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Qty (t)</TableHead>
                <TableHead>Price/t</TableHead>
                <TableHead>Value ($)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.orderId} data-testid={`order-row-${order.orderId}`}>
                  <TableCell>
                    <span className="font-mono text-sm">{order.orderId}</span>
                  </TableCell>
                  <TableCell>{order.lotId}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>${order.pricePerTon}</TableCell>
                  <TableCell>${order.totalValue.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Progress value={order.progress} className="flex-1" />
                        <span className="text-sm text-muted-foreground">{order.progress}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{order.status}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleMarkDelivered(order.orderId)}
                        data-testid={`button-release-escrow-${order.orderId}`}
                      >
                        Release Escrow
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadContract(order.orderId)}
                        data-testid={`button-download-contract-${order.orderId}`}
                      >
                        Contract PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Escrow Lock</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => openHashscan("0x111aaa")}
                className="font-mono text-sm p-0 h-auto"
                data-testid="tx-escrow-lock"
              >
                0x111aaa <ExternalLink className="ml-1 w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Delivery Tx</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => openHashscan("0x222bbb")}
                className="font-mono text-sm p-0 h-auto"
                data-testid="tx-delivery"
              >
                0x222bbb <ExternalLink className="ml-1 w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Payout Tx</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => openHashscan("0x333ccc")}
                className="font-mono text-sm p-0 h-auto"
                data-testid="tx-payout"
              >
                0x333ccc <ExternalLink className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
