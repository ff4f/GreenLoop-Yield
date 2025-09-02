import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, FileText, Camera, Satellite, CheckCircle, DollarSign, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MOCK_IDS } from "@shared/schema.js";
import { SEED_PROOFS } from '@shared/seed-data.js';
import { useProofStore } from '@/contexts/proof-store';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, SheetTrigger } from '@/components/ui/sheet';

const ProofTimeline = ({ proofs = [], showLiveFeed = false }) => {
  const [selectedProof, setSelectedProof] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const { liveProofFeed, isLoadingFeed, refreshProofFeed } = useProofStore();

  // Use live feed if enabled, otherwise use provided proofs
  const displayProofs = showLiveFeed ? liveProofFeed : proofs;

  const openHashscan = (topicId, sequenceNumber) => {
    const url = `https://hashscan.io/testnet/topic/${topicId}/message/${sequenceNumber}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getProofIcon = (type) => {
    const icons = {
      'photo': Camera,
      'NDVI': Satellite,
      'QC': CheckCircle,
      'settlement': DollarSign,
      'document': FileText
    };
    
    const IconComponent = icons[type] || FileText;
    return <IconComponent className="w-4 h-4" />;
  };

  const getProofBadge = (type) => {
    const variants = {
      'photo': { className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'NDVI': { className: 'bg-green-100 text-green-800 border-green-200' },
      'QC': { className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'settlement': { className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      'document': { className: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    
    const config = variants[type] || variants['document'];
    
    return (
      <Badge variant="secondary" className={`text-xs font-medium ${config.className}`}>
        {getProofIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleViewJson = (proof) => {
    setSelectedProof(proof);
    setIsDetailsOpen(true);
  };

  const mockJsonData = {
    "messageId": "0.0.123456@1642678901.123456789",
    "topicId": "0.0.123456",
    "sequenceNumber": 42,
    "runningHash": "0x1234567890abcdef...",
    "consensusTimestamp": "2025-01-20T14:30:00.123456789Z",
    "message": {
      "type": "carbon_credit_proof",
      "projectId": "GLY-001",
      "lotId": "LOT-2025-001",
      "proofType": "NDVI_satellite",
      "data": {
        "coordinates": {
          "lat": -6.2088,
          "lng": 106.8456
        },
        "area_hectares": 150.5,
        "ndvi_value": 0.82,
        "capture_date": "2025-01-20",
        "satellite_source": "Sentinel-2",
        "verification_status": "verified"
      },
      "fileReferences": [
        {
          "fileId": "0.0.789012",
          "type": "satellite_image",
          "hash": "QmX1Y2Z3..."
        }
      ],
      "signatures": [
        {
          "signer": "0.0.345678",
          "signature": "0xabcdef123456...",
          "timestamp": "2025-01-20T14:30:00Z"
        }
      ]
    }
  };

  return (
    <>
      {showLiveFeed && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Live feed from Hedera network ({displayProofs.length} proofs)
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshProofFeed}
            disabled={isLoadingFeed}
            className="h-8 px-3 text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingFeed ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}
      <div className="space-y-4">
        {displayProofs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {showLiveFeed 
                ? (isLoadingFeed ? 'Loading live proofs...' : 'No live proofs available from Hedera network.')
                : 'No proofs match your filters.'
              }
            </p>
            {!showLiveFeed && <Button variant="ghost" className="mt-2">Reset filters</Button>}
            {showLiveFeed && !isLoadingFeed && (
              <Button variant="ghost" className="mt-2" onClick={refreshProofFeed}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh feed
              </Button>
            )}
          </div>
        ) : (
          displayProofs.map((proof, index) => (
            <Sheet key={index} open={isDetailsOpen && selectedProof?.id === proof.id} onOpenChange={(open) => {
              if (open) setSelectedProof(proof);
              setIsDetailsOpen(open);
            }}>
              <SheetTrigger asChild>
                <div 
                  className="min-h-[72px] flex items-center bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for proof ${proof.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedProof(proof);
                      setIsDetailsOpen(true);
                    }
                  }}
                >
                  <div className="flex items-center flex-1 min-w-0 gap-4">
                    {/* Left: status dot + type chip */}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                      {getProofBadge(proof.type)}
                    </div>
                    {/* Middle: title/lot + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{proof.title} / {proof.lotId}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {proof.topicId}#{proof.sequenceNumber} • {formatTimestamp(proof.timestamp)} • {proof.source || 'Hedera'} • {proof.operator || 'System'}
                        {showLiveFeed && proof.consensusTimestamp && (
                          <span className="ml-2 text-green-600">• Live from network</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Right: actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewJson(proof); }} className="h-8 px-3 text-xs">
                      View JSON
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openHashscan(proof.topicId, proof.sequenceNumber); }} className="h-8 px-3 text-xs">
                      Hashscan
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); toast({ title: 'Copied', description: 'Tx/Seq copied' }); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-[520px] max-w-[520px]">
                <SheetHeader>
                  <SheetTitle>{proof.title}</SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-4">
                  {/* Media preview placeholder */}
                  <div className="h-48 bg-white/5 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Media Preview (if applicable)</p>
                  </div>
                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <p><strong>Type:</strong> {proof.type}</p>
                    <p><strong>Lot:</strong> {proof.lotId}</p>
                    <p><strong>Timestamp:</strong> {formatTimestamp(proof.timestamp)}</p>
                    {proof.consensusTimestamp && (
                      <p><strong>Consensus:</strong> {formatTimestamp(proof.consensusTimestamp)}</p>
                    )}
                    <p><strong>Description:</strong> {proof.description}</p>
                    {showLiveFeed && (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>Live from Hedera network</span>
                      </div>
                    )}
                  </div>
                  {/* JSON view */}
                  <div className="bg-black/50 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-green-400">
                      {JSON.stringify(showLiveFeed && proof.rawMessage ? proof.rawMessage : mockJsonData, null, 2)}
                    </pre>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ))
        )}
      </div>
    </>
  );
};

export default ProofTimeline;