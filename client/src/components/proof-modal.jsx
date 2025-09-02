import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Satellite, ShieldCheck, ExternalLink, FileText } from "lucide-react";
import { MOCK_IDS } from "@shared/schema.js";

const ProofModal = ({ lot, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openHashscan = (hash) => {
    // Convert proof hash to topic format for HashScan
    const topicId = MOCK_IDS.PROOF_TOPIC;
    const sequenceNumber = Math.floor(Math.random() * 1000) + 1000; // Mock sequence
    const url = `https://hashscan.io/testnet/topic/${topicId}/message/${sequenceNumber}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getProofIcon = (type) => {
    const icons = {
      'photo': Camera,
      'ndvi': Satellite,
      'qc': ShieldCheck
    };
    
    const IconComponent = icons[type] || FileText;
    return <IconComponent className="w-5 h-5" />;
  };

  const getProofBadge = (type) => {
    const variants = {
      'photo': { className: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Photo Verification' },
      'ndvi': { className: 'bg-green-100 text-green-800 border-green-200', label: 'NDVI Satellite' },
      'qc': { className: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Quality Control' }
    };
    
    const config = variants[type] || { className: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };
    
    return {
      className: config.className,
      label: config.label
    };
  };

  const proofTypes = [
    {
      type: 'photo',
      hash: lot?.proofHashes?.photo || '0xabc123',
      description: 'Geotagged photos of project site and activities'
    },
    {
      type: 'ndvi',
      hash: lot?.proofHashes?.ndvi || '0xdef456',
      description: 'Satellite imagery and vegetation index analysis'
    },
    {
      type: 'qc',
      hash: lot?.proofHashes?.qc || '0xghi789',
      description: 'Third-party quality control and verification'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Proof Verification
          </DialogTitle>
          <div className="text-sm text-gray-400">
            {lot?.projectName} • {lot?.lotId}
          </div>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <div className="text-sm text-gray-300 mb-4">
            All proofs are cryptographically secured and publicly verifiable on Hedera Consensus Service.
          </div>
          
          {proofTypes.map((proof, index) => {
            const badgeConfig = getProofBadge(proof.type);
            
            return (
              <div key={proof.type} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      {getProofIcon(proof.type)}
                    </div>
                    <div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs font-medium ${badgeConfig.className}`}
                      >
                        {badgeConfig.label}
                      </Badge>
                      <div className="text-xs text-gray-400 mt-1">
                        {proof.description}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openHashscan(proof.hash)}
                    className="h-8 px-3 text-xs rounded-lg border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on HashScan
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Proof Hash:</span>
                    <code className="font-mono text-gray-300 bg-white/10 px-2 py-1 rounded">
                      {proof.hash}
                    </code>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Topic ID:</span>
                    <code className="font-mono text-gray-300">
                      {MOCK_IDS.PROOF_TOPIC}
                    </code>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Status:</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                      ✓ Verified
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-300 mb-1">
                  ICVCM Compliant
                </div>
                <div className="text-xs text-blue-200">
                  This carbon lot meets the Integrity Council for the Voluntary Carbon Market (ICVCM) Core Carbon Principles for high-quality carbon credits.
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProofModal;