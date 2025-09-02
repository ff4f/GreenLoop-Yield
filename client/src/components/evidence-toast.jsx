import { useState, useEffect, useRef } from "react";
import { X, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProofStore } from '@/contexts/proof-store';

const EvidenceToast = () => {
  const { evidence, getEvidenceIcon } = useProofStore();
  const [visibleToasts, setVisibleToasts] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const lastSeenIdRef = useRef(null);

  useEffect(() => {
    // Monitor evidence changes and show toast for new items
    const newest = evidence[0];
    if (!newest) return;

    // Hindari duplikasi jika evidence yang sama sudah diproses
    if (lastSeenIdRef.current === newest.id) return;
    lastSeenIdRef.current = newest.id;

    const uiId = `${newest.id}-${Date.now()}`;
    setVisibleToasts((prev) => [...prev, { ...newest, uiId }]);

    // Auto-hide setelah 6 detik
    setTimeout(() => {
      setVisibleToasts((prev) => prev.filter((t) => t.uiId !== uiId));
    }, 6000);
  }, [evidence]);

  const handleCopy = async (text, uiId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(uiId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = (uiId) => {
    setVisibleToasts(prev => prev.filter(toast => toast.uiId !== uiId));
  };

  const getMicrocopy = (kind, meta) => {
    switch (kind) {
      case 'tx':
        return meta?.action ? `Transaction ${meta.action}` : 'Transaction completed';
      case 'file':
        return meta?.action ? `File ${meta.action}` : 'File stored on HFS';
      case 'topic':
        return meta?.action ? `Message ${meta.action}` : 'Message submitted to HCS';
      case 'token':
        return meta?.action ? `Token ${meta.action}` : 'Token minted';
      default:
        return 'Evidence recorded';
    }
  };

  const getSuccessMessage = (kind) => {
    switch (kind) {
      case 'tx':
        return 'Transaction verified on Hedera';
      case 'file':
        return 'File secured on Hedera File Service';
      case 'topic':
        return 'Message anchored on Hedera Consensus Service';
      case 'token':
        return 'Token created on Hedera Token Service';
      default:
        return 'Evidence recorded successfully';
    }
  };

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 space-y-2">
      {visibleToasts.map((toast) => (
        <div
          key={toast.uiId}
          className="bg-card border border-border rounded-2xl shadow-lg p-4 min-w-80 max-w-96 animate-in slide-in-from-right-full duration-300"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg" aria-hidden="true">{getEvidenceIcon(toast.kind)}</span>
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  {toast.label}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {getMicrocopy(toast.kind, toast.meta)}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  {getSuccessMessage(toast.kind)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClose(toast.uiId)}
              className="h-6 w-6 p-0 hover:bg-muted"
              aria-label="Close evidence notification"
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(toast.hashscanUrl, '_blank')}
              className="flex items-center space-x-1 text-xs"
              aria-label={`View ${toast.kind} on Hashscan`}
            >
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
              <span>View Proof</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(toast.evidenceId, toast.uiId)}
              className="flex items-center space-x-1 text-xs"
              aria-label={`Copy ${toast.kind} ID to clipboard`}
            >
              {copiedId === toast.uiId ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" aria-hidden="true" />
                  <span className="text-green-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" aria-hidden="true" />
                  <span>Copy ID</span>
                </>
              )}
            </Button>
          </div>
          
          {toast.source && (
            <div className="mt-2 text-xs text-muted-foreground">
              Source: {toast.source}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EvidenceToast;