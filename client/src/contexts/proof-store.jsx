import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink } from 'lucide-react';

// Evidence types: 'tx', 'file', 'topic', 'token'
const STORAGE_KEY = 'greenloop_proof_store';
const MAX_EVIDENCE_ITEMS = 100;
const MIRROR_API_BASE = '/api';

// Helper function to fetch live proof feed from Mirror Node
async function fetchLiveProofFeed() {
  try {
    const response = await fetch(`${MIRROR_API_BASE}/mirror-feed`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.proofFeed || [];
  } catch (error) {
    console.warn('Failed to fetch live proof feed:', error);
    return [];
  }
}

// Create context
const ProofStoreContext = createContext();

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

// Load evidence from localStorage
function loadEvidenceFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load evidence from localStorage:', error);
    return [];
  }
}

// Save evidence to localStorage
function saveEvidenceToStorage(evidence) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evidence));
  } catch (error) {
    console.warn('Failed to save evidence to localStorage:', error);
  }
}

// Provider component
export function ProofStoreProvider({ children }) {
  const [evidence, setEvidence] = useState(() => loadEvidenceFromStorage());
  const [liveProofFeed, setLiveProofFeed] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(true);
  const { toast } = useToast();

  // Save to localStorage whenever evidence changes
  useEffect(() => {
    saveEvidenceToStorage(evidence);
  }, [evidence]);

  // Fetch live proof feed on mount and periodically
  useEffect(() => {
    const fetchFeed = async () => {
      setIsLoadingFeed(true);
      const feed = await fetchLiveProofFeed();
      setLiveProofFeed(feed);
      setIsLoadingFeed(false);
    };

    // Initial fetch
    fetchFeed();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchFeed, 30000);

    return () => clearInterval(interval);
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

    // Add to store and keep only last MAX_EVIDENCE_ITEMS
    setEvidence(prev => {
      const updated = [newEvidence, ...prev];
      return updated.slice(0, MAX_EVIDENCE_ITEMS);
    });

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
  }, [toast]);

  // Refresh live proof feed manually
  const refreshProofFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    const feed = await fetchLiveProofFeed();
    setLiveProofFeed(feed);
    setIsLoadingFeed(false);
    
    toast({
      title: "Proof feed refreshed",
      description: `Loaded ${feed.length} live proofs from Hedera network`,
    });
  }, [toast]);

  // Clear all evidence
  const clearEvidence = useCallback(() => {
    setEvidence([]);
    toast({
      title: "Evidence cleared",
      description: "All proof evidence has been removed.",
    });
  }, [toast]);

  // Get evidence by type
  const getEvidenceByType = useCallback((kind) => {
    return evidence.filter(item => item.kind === kind);
  }, [evidence]);

  // Get evidence by source
  const getEvidenceBySource = useCallback((source) => {
    return evidence.filter(item => item.source === source);
  }, [evidence]);

  // Inspector controls
  const toggleInspector = useCallback(() => {
    setIsInspectorCollapsed(prev => !prev);
  }, []);

  const value = {
    // Evidence data
    evidence,
    addEvidence,
    clearEvidence,
    getEvidenceByType,
    getEvidenceBySource,
    
    // Live proof feed
    liveProofFeed,
    isLoadingFeed,
    refreshProofFeed,
    
    // Inspector state
    isInspectorCollapsed,
    toggleInspector,
    
    // Utility functions
    getHashscanUrl,
    getEvidenceIcon,
    getEvidenceDescription
  };

  return (
    <ProofStoreContext.Provider value={value}>
      {children}
    </ProofStoreContext.Provider>
  );
}

// Hook to use the proof store
export function useProofStore() {
  const context = useContext(ProofStoreContext);
  if (!context) {
    throw new Error('useProofStore must be used within a ProofStoreProvider');
  }
  return context;
}

// Export utility functions for direct use
export { getHashscanUrl, getEvidenceIcon, getEvidenceDescription };