import React from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { ExternalLink, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { ProofLink } from '@shared/schema.js';

// Proof status colors and icons
const proofStatusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pending'
  },
  verified: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Verified'
  },
  rejected: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    label: 'Rejected'
  },
  none: {
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Upload,
    label: 'No Proof'
  }
};

const proofTypeLabels = {
  photo: 'Photo',
  ndvi: 'NDVI',
  qc: 'QC'
};

export function ProofPill({ 
  proofs = [], 
  type, 
  showLinks = true, 
  compact = false,
  onUploadClick = null 
}) {
  // Find proof of specific type
  const proof = proofs.find(p => p.type === type);
  const status = proof ? proof.status : 'none';
  const config = proofStatusConfig[status];
  const Icon = config.icon;
  
  const typeLabel = proofTypeLabels[type] || type.toUpperCase();
  
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        <Badge 
          variant="outline" 
          className={`text-xs px-1 py-0 ${config.color}`}
        >
          {typeLabel}
        </Badge>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border bg-white">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${
          status === 'verified' ? 'text-green-600' :
          status === 'pending' ? 'text-yellow-600' :
          status === 'rejected' ? 'text-red-600' :
          'text-gray-400'
        }`} />
        
        <div className="flex flex-col">
          <span className="text-sm font-medium">{typeLabel} Proof</span>
          <Badge 
            variant="outline" 
            className={`text-xs w-fit ${config.color}`}
          >
            {config.label}
          </Badge>
        </div>
      </div>
      
      {showLinks && proof && (
        <div className="flex items-center gap-1 ml-auto">
          {proof.fileId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => window.open(ProofLink.buildFileLink(proof.fileId), '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              File
            </Button>
          )}
          
          {proof.hcsTransactionId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => window.open(ProofLink.buildTransactionLink(proof.hcsTransactionId), '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              HCS
            </Button>
          )}
        </div>
      )}
      
      {status === 'none' && onUploadClick && (
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs ml-auto"
          onClick={() => onUploadClick(type)}
        >
          <Upload className="h-3 w-3 mr-1" />
          Upload
        </Button>
      )}
    </div>
  );
}

// Component to show all proof types for a lot/project
export function ProofPillGroup({ 
  proofs = [], 
  compact = false, 
  showLinks = true,
  onUploadClick = null,
  className = ""
}) {
  const proofTypes = ['photo', 'ndvi', 'qc'];
  
  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {proofTypes.map(type => (
          <ProofPill
            key={type}
            proofs={proofs}
            type={type}
            compact={true}
            showLinks={false}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {proofTypes.map(type => (
        <ProofPill
          key={type}
          proofs={proofs}
          type={type}
          showLinks={showLinks}
          onUploadClick={onUploadClick}
        />
      ))}
    </div>
  );
}

// PDI indicator component
export function PDIIndicator({ pdi = 0, className = "" }) {
  const getColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  const getLabel = (score) => {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">PDI:</span>
      <Badge 
        variant="outline" 
        className={`text-xs ${getColor(pdi)}`}
      >
        {pdi}% ({getLabel(pdi)})
      </Badge>
    </div>
  );
}

export default ProofPill;