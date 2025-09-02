import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink } from 'lucide-react';

// Evidence types: 'tx', 'file', 'topic', 'token'
const evidenceStore = {
  items: [],
  listeners: []
};

export function useEvidence() {
  const [evidence, setEvidence] = useState(evidenceStore.items);
  const { toast } = useToast();

  // Subscribe to evidence store changes
  const subscribe = useCallback((listener) => {
    evidenceStore.listeners.push(listener);
    return () => {
      const index = evidenceStore.listeners.indexOf(listener);
      if (index > -1) {
        evidenceStore.listeners.splice(index, 1);
      }
    };
  }, []);

  // Notify all listeners of changes
  const notifyListeners = useCallback(() => {
    evidenceStore.listeners.forEach(listener => listener(evidenceStore.items));
  }, []);

  // Add evidence to store and show toast
  const addEvidence = useCallback((evidenceData) => {
    const { kind, id, label, meta = {}, source = 'Unknown' } = evidenceData;
    
    const newEvidence = {
      id: `${kind}_${id}_${Date.now()}`,
      kind, // 'tx', 'file', 'topic', 'token'
      evidenceId: id, // actual blockchain ID
      label,
      meta,
      source,
      timestamp: new Date().toISOString(),
      hashscanUrl: getHashscanUrl(kind, id)
    };

    // Add to store
    evidenceStore.items.unshift(newEvidence);
    
    // Keep only last 50 items
    if (evidenceStore.items.length > 50) {
      evidenceStore.items = evidenceStore.items.slice(0, 50);
    }

    // Update local state
    setEvidence([...evidenceStore.items]);
    
    // Notify other components
    notifyListeners();

    // Show toast with Hashscan link
    toast({
      title: `${getEvidenceIcon(kind)} ${label}`,
      description: (
        <div className="space-y-1">
          <p className="text-sm">{getEvidenceDescription(kind, id, meta)}</p>
          <button 
            onClick={() => window.open(newEvidence.hashscanUrl, '_blank')}
            className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
          >
            Open in Hashscan <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      ),
    });

    return newEvidence;
  }, [toast, notifyListeners]);

  // Clear all evidence
  const clearEvidence = useCallback(() => {
    evidenceStore.items = [];
    setEvidence([]);
    notifyListeners();
  }, [notifyListeners]);

  // Get evidence by type
  const getEvidenceByType = useCallback((kind) => {
    return evidenceStore.items.filter(item => item.kind === kind);
  }, []);

  // Get evidence by source
  const getEvidenceBySource = useCallback((source) => {
    return evidenceStore.items.filter(item => item.source === source);
  }, []);

  return {
    evidence,
    addEvidence,
    clearEvidence,
    getEvidenceByType,
    getEvidenceBySource,
    subscribe
  };
}

// Helper functions
function getHashscanUrl(kind, id) {
  const baseUrl = 'https://hashscan.io/testnet';
  switch (kind) {
    case 'tx':
      return `${baseUrl}/transaction/${id}`;
    case 'file':
      return `${baseUrl}/file/${id}`;
    case 'topic':
      return `${baseUrl}/topic/${id}`;
    case 'token':
      return `${baseUrl}/token/${id}`;
    default:
      return baseUrl;
  }
}

function getEvidenceIcon(kind) {
  switch (kind) {
    case 'tx':
      return '💳';
    case 'file':
      return '📄';
    case 'topic':
      return '📡';
    case 'token':
      return '🪙';
    default:
      return '🔗';
  }
}

function getEvidenceDescription(kind, id, meta) {
  const shortId = id.length > 20 ? `${id.slice(0, 8)}...${id.slice(-6)}` : id;
  
  switch (kind) {
    case 'tx':
      return `Transaction ${shortId} ${meta.action || 'completed'}`;
    case 'file':
      return `File ${shortId} ${meta.action || 'stored on HFS'}`;
    case 'topic':
      return `Message ${shortId}${meta.sequence ? `#${meta.sequence}` : ''} ${meta.action || 'submitted to HCS'}`;
    case 'token':
      return `Token ${shortId} ${meta.action || 'minted'}`;
    default:
      return `Evidence ${shortId} recorded`;
  }
}

// Export utility functions for direct use
export { getHashscanUrl, getEvidenceIcon, getEvidenceDescription };