import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hederaService, mockOrders } from "@/lib/hedera-mock";

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
                <TableHead>Buyer</TableHead>
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
                    <span className="font-mono text-xs">{order.orderId}</span>
                  </TableCell>
                  <TableCell className="text-sm">{order.lotId}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{order.buyerAccount}</span>
                  </TableCell>
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
                    <div className="flex space-x-1">
                      {order.status !== "SETTLED" && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleMarkDelivered(order.orderId)}
                          data-testid={`button-release-escrow-${order.orderId}`}
                        >
                          {order.status === "ESCROWED" ? "Mark Delivered" : "Release Escrow"}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadContract(order.orderId)}
                        data-testid={`button-download-contract-${order.orderId}`}
                      >
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["0x111aaa", "0x222bbb", "0x333ccc", "0x444ddd", "0x555eee"].map((hash, index) => (
                <div key={hash} className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">
                    {index === 0 ? "Escrow Lock" : index === 1 ? "Delivery" : index === 2 ? "Payout" : index === 3 ? "Settlement" : "Contract"}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => openHashscan(hash)}
                    className="font-mono text-xs p-0 h-auto"
                    data-testid={`tx-${hash}`}
                  >
                    {hash} <ExternalLink className="ml-1 w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>File Storage (HFS)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["0.0.700111", "0.0.700112", "0.0.700113", "0.0.700114", "0.0.700115"].map((fileId, index) => (
                <div key={fileId} className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">
                    {index === 0 ? "Contract PDF" : index === 1 ? "Delivery Cert" : index === 2 ? "KYC Doc" : index === 3 ? "Invoice" : "Receipt"}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => openHashscan(fileId)}
                    className="font-mono text-xs p-0 h-auto text-primary"
                    data-testid={`file-${fileId}`}
                  >
                    {fileId} <ExternalLink className="ml-1 w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
