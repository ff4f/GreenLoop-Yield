import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet } from "@/hooks/use-wallet";
import { SEED_LOTS } from '@shared/seed-data.js';
import LotCard from "./lot-card";

export default function Marketplace() {
  const { isConnected, isConnecting, connect } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });

  // Filter lots based on search and filter criteria
  const filteredLots = SEED_LOTS.filter(lot => {
    const matchesSearch = lot.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lot.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || lot.projectType === typeFilter;
    const matchesStatus = statusFilter === 'all' || lot.status === statusFilter;
    const matchesPrice = lot.pricePerTon >= priceRange.min && lot.pricePerTon <= priceRange.max;
    
    return matchesSearch && matchesType && matchesStatus && matchesPrice;
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Marketplace</h1>
        <p className="text-muted-foreground text-sm">Decentralized marketplace with HTS token transfers and escrow smart contracts for secure transactions</p>
      </div>

      {!isConnected && (
        <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 flex items-center justify-between">
          <p className="text-sm text-cyan-200">
            You can browse freely. Connect your Hedera wallet to purchase or reserve credits.
          </p>
          <Button
            onClick={connect}
            disabled={isConnecting}
            className="h-8 text-sm rounded-lg"
          >
            {isConnecting ? 'Connecting…' : 'Connect Wallet'}
          </Button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="sticky top-24 z-10 bg-background/80 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          <Input
            placeholder="Search lots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 text-sm bg-white/5 border-white/10"
            data-testid="search-input"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 text-sm bg-white/5 border-white/10" data-testid="type-filter">
              <SelectValue placeholder="Project Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="nature">Nature-based</SelectItem>
              <SelectItem value="cookstove">Cookstoves</SelectItem>
              <SelectItem value="agroforestry">Agroforestry</SelectItem>
              <SelectItem value="methane">Methane Capture</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-sm bg-white/5 border-white/10" data-testid="status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="RESERVED">Reserved</SelectItem>
              <SelectItem value="SOLD">Sold</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min $"
              value={priceRange.min || ''}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseFloat(e.target.value) || 0 }))}
              className="h-9 text-sm bg-white/5 border-white/10 w-20"
              data-testid="price-min"
            />
            <Input
              type="number"
              placeholder="Max $"
              value={priceRange.max || ''}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseFloat(e.target.value) || 100 }))}
              className="h-9 text-sm bg-white/5 border-white/10 w-20"
              data-testid="price-max"
            />
          </div>
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
        {filteredLots.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {SEED_LOTS.length === 0 ? 'No Carbon Credits Available' : 'No Results Found'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                {SEED_LOTS.length === 0 
                  ? 'The marketplace is currently empty. Carbon credit lots will appear here once projects generate tokenized credits.'
                  : 'Try adjusting your search criteria or filters to find carbon credits that match your requirements.'
                }
              </p>
              {SEED_LOTS.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  <p>💡 Tip: Visit the Project Sheets tab to create new carbon credit projects</p>
                </div>
              ) : (
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setPriceRange({ min: 0, max: 100 });
                  }}
                  variant="outline"
                  className="border-white/20 hover:bg-white/5"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          filteredLots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))
        )}
      </div>
    </>
  );
}
