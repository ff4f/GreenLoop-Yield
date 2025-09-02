import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
// ScrollArea component not available, using regular div with overflow
import { ChevronRight, ChevronLeft, Search, Filter, ExternalLink, Copy, Trash2 } from 'lucide-react';
import { useProofStore } from '@/contexts/proof-store';
import { useToast } from '@/hooks/use-toast';

export default function ProofInspector() {
  const { 
    evidence, 
    clearEvidence, 
    getEvidenceByType, 
    getEvidenceBySource, 
    isInspectorCollapsed, 
    toggleInspector,
    getEvidenceIcon 
  } = useProofStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Filter evidence based on search and filters
  const filteredEvidence = evidence.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.evidenceId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || item.kind === typeFilter;
    const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
    
    return matchesSearch && matchesType && matchesSource;
  });

  // Get unique sources for filter
  const uniqueSources = [...new Set(evidence.map(item => item.source))];

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    toast({
      title: "Copied to clipboard",
      description: `Evidence ID ${id} copied successfully`,
    });
  };

  const handleOpenHashscan = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const shortenId = (id) => {
    if (id.length <= 16) return id;
    return `${id.slice(0, 8)}...${id.slice(-6)}`;
  };

  if (isInspectorCollapsed) {
    return (
      <div className="fixed right-0 top-[73px] bottom-0 w-12 bg-card border-l border-border z-30">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleInspector}
          className="w-full h-12 rounded-none border-b border-border"
          aria-label="Expand proof inspector"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Button>
        <div className="p-2 text-center">
          <div className="text-xs text-muted-foreground writing-mode-vertical">
            Proof Inspector
          </div>
          <Badge variant="secondary" className="mt-2 text-xs">
            {evidence.length}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-[73px] bottom-0 w-96 bg-card border-l border-border z-30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-foreground">Proof Inspector</h3>
          <Badge variant="secondary" className="text-xs">
            {filteredEvidence.length}/{evidence.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleInspector}
          aria-label="Collapse proof inspector"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search evidence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8"
            aria-label="Search evidence"
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="tx">Transactions</SelectItem>
            <SelectItem value="file">Files</SelectItem>
            <SelectItem value="topic">Topics</SelectItem>
            <SelectItem value="token">Tokens</SelectItem>
          </SelectContent>
        </Select>

        {/* Source Filter */}
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {uniqueSources.map(source => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear All */}
        {evidence.length > 0 && (
          <div className="flex flex-col">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearEvidence}
              disabled={evidence.length === 0}
              className="w-full flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={evidence.length > 0 ? "Clear all evidence" : "No evidence to clear"}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Clear All</span>
            </Button>
            {evidence.length === 0 && (
              <div className="mt-1 text-xs text-muted-foreground text-center">
                No evidence to clear
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evidence List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {filteredEvidence.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm text-muted-foreground">
                {evidence.length === 0 
                  ? "No evidence recorded yet"
                  : "No evidence matches your filters"
                }
              </p>
            </div>
          ) : (
            filteredEvidence.map((item) => (
              <Card key={item.id} className="p-3 hover:bg-muted/50 transition-colors">
                <div className="space-y-2">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg" aria-hidden="true">{getEvidenceIcon(item.kind)}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          item.kind === 'tx' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          item.kind === 'file' ? 'bg-green-50 text-green-700 border-green-200' :
                          item.kind === 'topic' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        {item.kind.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>

                  {/* Label */}
                  <div className="text-sm font-medium text-foreground">
                    {item.label}
                  </div>

                  {/* ID Row */}
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {shortenId(item.evidenceId)}
                    </code>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyId(item.evidenceId)}
                        className="h-6 w-6 p-0"
                        aria-label="Copy evidence ID to clipboard"
                      >
                        <Copy className="w-3 h-3" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenHashscan(item.hashscanUrl)}
                        className="h-6 w-6 p-0"
                        aria-label="View on Hashscan"
                      >
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="text-xs text-muted-foreground">
                    Source: {item.source}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}