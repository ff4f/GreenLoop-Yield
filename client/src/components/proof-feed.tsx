import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Satellite, ShieldCheck, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hederaService, mockProofEntries } from "@/lib/hedera-mock";

export default function ProofFeed() {
  const { toast } = useToast();

  const handleAddProofEntry = async () => {
    const types = ['Photo geotag', 'NDVI update', 'QC check'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    try {
      // Mock HFS FileCreate for proof file
      const file = await hederaService.createFile(`Proof file: ${type}`);
      
      // Mock HCS TopicMessageSubmit with file hash
      const topicId = "0.0.900123";
      const hcsResult = await hederaService.submitMessage(topicId, file.hash);
      
      toast({
        title: "Proof Added",
        description: `Proof added • ${type} • HCS ${topicId} • seq #${hcsResult.sequenceNumber}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Add Proof",
        description: "Failed to add proof entry. Please try again.",
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

  const getProofIcon = (proofType: string) => {
    switch (proofType) {
      case 'Photo geotag':
        return <Camera className="w-6 h-6 text-primary" />;
      case 'NDVI update':
        return <Satellite className="w-6 h-6 text-primary" />;
      case 'QC check':
        return <ShieldCheck className="w-6 h-6 text-primary" />;
      default:
        return <Camera className="w-6 h-6 text-primary" />;
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proof-of-Impact Feed</h1>
          <p className="text-muted-foreground">Timeline evidence with immutable audit trail</p>
        </div>
        <Button 
          onClick={handleAddProofEntry}
          className="bg-primary text-primary-foreground hover:opacity-90"
          data-testid="button-add-proof"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Proof Entry
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProofEntries.map((entry) => (
          <Card key={entry.id} data-testid={`proof-entry-${entry.id}`} className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getProofIcon(entry.proofType)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground" data-testid={`proof-type-${entry.id}`}>
                      {entry.proofType}
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid={`proof-timestamp-${entry.id}`}>
                      {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Lot:</span>
                    <span className="font-mono">{entry.lotId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Topic:</span>
                    <span className="font-mono">{entry.topicId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Seq:</span>
                    <span className="font-mono">#{entry.sequenceNumber}</span>
                  </div>
                </div>
                
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => openHashscan(entry.hash)}
                  className="font-mono text-xs p-0 h-auto w-full text-left justify-start"
                  data-testid={`proof-hash-${entry.id}`}
                >
                  {entry.hash} <ExternalLink className="ml-1 w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <Button variant="link" data-testid="button-load-more">
          Load More Entries
        </Button>
      </div>
    </div>
  );
}
