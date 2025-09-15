import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import LotCard from "./lot-card";
import { MOCK_USERS } from "@shared/seed-data.js";
import { calcPDI } from "@shared/schema.js";

export default function Marketplace() {
  const { isConnected, isConnecting, connect, account } = useWallet();
  // Map Hedera wallet accountId -> internal buyerId used by SEED_ORDERS
  const buyerUserId = (() => {
    const wallet = account?.accountId;
    if (!wallet) return undefined;
    const users = Object.values(MOCK_USERS || {});
    const found = users.find((u) => u?.wallet === wallet);
    return found?.id;
  })();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [pdiRange, setPdiRange] = useState([0]); // PDI filter (0-100)

  // Fetch lots from API (with fallback handled in queryClient for /api/lots)
  const { data: resp, isLoading, error } = useQuery({ queryKey: ["/api", "lots"] });
  const lots = Array.isArray(resp?.data) ? resp.data : [];

  const LOT_STATUS_GROUPS = {
    AVAILABLE: ["listed"],
    RESERVED: ["partially_sold"],
    SOLD: ["sold_out", "retired"],
  };

  // Filter lots based on search and filter criteria
  const filteredLots = lots.filter((lot) => {
    const matchesSearch =
      lot.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || lot.type === typeFilter;

    const allowedStatuses = statusMap[statusFilter] || [];
    const matchesStatus = statusFilter === "all" || allowedStatuses.includes(lot.status);

    const price = Number(lot.pricePerTon ?? 0);
    const matchesPrice = price >= (priceRange.min ?? 0) && price <= (priceRange.max ?? 100);

    // PDI filter
    const lotPDI = calcPDI(lot.proofs || []);
    const matchesPDI = lotPDI >= pdiRange[0];

    return matchesSearch && matchesType && matchesStatus && matchesPrice && matchesPDI;
  });

  // Handle purchase updates: adjust available/listed tons and status in cache
  const handlePurchase = (lotRef, orderId, qty) => {
    // Update Lots cache optimistically
    queryClient.setQueryData(["/api", "lots"], (prev) => {
      if (!prev || !Array.isArray(prev.data)) return prev;
      const updatedData = prev.data.map((l) => {
        const isSame = (l.id && lotRef.id && l.id === lotRef.id) || (l.lotId && lotRef.lotId && l.lotId === lotRef.lotId);
        if (!isSame) return l;
        const current = Number(l.availableTons ?? l.listedTons ?? 0);
        const remaining = Math.max(current - Number(qty || 0), 0);
        const nextStatus = remaining === 0 ? "sold_out" : "partially_sold";
        const updated = { ...l, status: nextStatus };
        if (Object.prototype.hasOwnProperty.call(l, "availableTons")) {
          updated.availableTons = remaining;
        } else {
          updated.listedTons = remaining;
        }
        return updated;
      });
      return { ...prev, data: updatedData };
    });

    // Compose a minimal order for UI
    const newOrder = {
      id: orderId,
      lotId: lotRef.lotId || lotRef.id,
      buyerId: buyerUserId || "",
      tons: Number(qty || 0),
      pricePerTon: Number(lotRef.pricePerTon || 0),
      totalAmount: Number(qty || 0) * Number(lotRef.pricePerTon || 0),
      status: "escrow",
      yieldStrategy: lotRef.yieldType === 'staking' ? 'staking_only' : 'carbon_appreciation',
      yieldEarned: 0,
      currentValue: Number(qty || 0) * Number(lotRef.pricePerTon || 0),
      expectedAPY: Number(lotRef.stakingAPY || 0),
      createdAt: new Date().toISOString(),
    };

    // Update Orders (all) cache
    queryClient.setQueryData(["/api", "orders"], (prev) => {
      if (!prev) return { data: [newOrder] };
      if (!Array.isArray(prev.data)) return prev;
      // Prevent duplicates
      if (prev.data.some((o) => o.id === newOrder.id)) return prev;
      return { ...prev, data: [newOrder, ...prev.data] };
    });

    // Update Orders filtered by buyer cache
    if (buyerUserId) {
      const key = ["/api", `orders?buyerId=${encodeURIComponent(buyerUserId)}`];
      queryClient.setQueryData(key, (prev) => {
        if (!prev) return { data: [newOrder] };
        if (!Array.isArray(prev.data)) return prev;
        if (prev.data.some((o) => o.id === newOrder.id)) return prev;
        return { ...prev, data: [newOrder, ...prev.data] };
      });
    }

    // Invalidate to refetch from API when available
    queryClient.invalidateQueries({ queryKey: ["/api", "orders"], exact: false });
    if (buyerUserId) {
      queryClient.invalidateQueries({ queryKey: ["/api", `orders?buyerId=${encodeURIComponent(buyerUserId)}`], exact: true });
    }
  };

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
          <Button onClick={connect} disabled={isConnecting} className="h-8 text-sm rounded-lg">
            {isConnecting ? "Connecting…" : "Connect Wallet"}
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
              value={priceRange.min || ""}
              onChange={(e) => setPriceRange((prev) => ({ ...prev, min: parseFloat(e.target.value) || 0 }))}
              className="h-9 text-sm bg-white/5 border-white/10 w-20"
              data-testid="price-min"
            />
            <Input
              type="number"
              placeholder="Max $"
              value={priceRange.max || ""}
              onChange={(e) => setPriceRange((prev) => ({ ...prev, max: parseFloat(e.target.value) || 100 }))}
              className="h-9 text-sm bg-white/5 border-white/10 w-20"
              data-testid="price-max"
            />
          </div>
          {/* PDI Filter */}
          <div className="col-span-full">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-200">Proof Density Index (PDI)</label>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                ≥{pdiRange[0]}%
              </Badge>
            </div>
            <Slider
              value={pdiRange}
              onValueChange={setPdiRange}
              max={100}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading / Error States */}
      {isLoading && (
        <div className="text-center text-muted-foreground py-12">Loading marketplace…</div>
      )}
      {error && !isLoading && (
        <div className="text-center text-red-300 py-12">Failed to load marketplace.</div>
      )}

      {/* Marketplace Grid */}
      {!isLoading && (
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
                  {lots.length === 0 ? "No Carbon Credits Available" : "No Results Found"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  {lots.length === 0
                    ? "The marketplace is currently empty. Carbon credit lots will appear here once projects generate tokenized credits."
                    : "Try adjusting your search criteria or filters to find carbon credits that match your requirements."}
                </p>
                {lots.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    <p>💡 Tip: Visit the Project Sheets tab to create new carbon credit projects</p>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setTypeFilter("all");
                      setStatusFilter("all");
                      setPriceRange({ min: 0, max: 100 });
                      setPdiRange([0]);
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
              <LotCard
                key={lot.id || lot.lotId}
                lot={lot}
                onPurchase={(orderId, quantity) => handlePurchase(lot, orderId, quantity)}
              />
            ))
          )}
        </div>
      )}
    </>
  );
}
