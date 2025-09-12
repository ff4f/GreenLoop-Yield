import { useState } from "react";
import { SEED_PROJECTS } from '@shared/seed-data.js';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import FormNewProject from "./form-new-project";
import RealtimeCalc from "./realtime-calc";
import Tips from "./tips";
import PDIFilter from "./pdi-filter";

export default function ProjectSheets() {
  const { isConnected, isConnecting, connect } = useWallet();
  const [formData, setFormData] = useState({
    projectName: "",
    location: "",
    type: "",
    area: 0,
    rate: 0,
    buffer: 0,
    forward: 0,
    pricePerTon: 10
  });

  const [filters, setFilters] = useState({
    type: "All Types",
    status: "All Status"
  });

  const [filteredProjects, setFilteredProjects] = useState(SEED_PROJECTS);
  const [showPDIFilter, setShowPDIFilter] = useState(false);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handlePDIFilterChange = (filtered, pdiFilters) => {
    setFilteredProjects(filtered);
  };

  const handleNewProject = () => {
    console.log('New Project clicked');
  };

  return (
    <div className="space-y-6">
        {/* Section Card: Project Sheets */}
        <div className="card-base">
          <div className="card-header">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-foreground mb-3">Project Sheets</h1>
                <p className="text-muted-foreground text-sm">Project creation, monitoring, and lot generation with HTS integration for tokenized carbon credits</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger className="h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Types">All Types</SelectItem>
                    <SelectItem value="Mangrove">Mangrove</SelectItem>
                    <SelectItem value="Forest">Forest</SelectItem>
                    <SelectItem value="Wetland">Wetland</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Status">All Status</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Generated">Generated</SelectItem>
                    <SelectItem value="Listed">Listed</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => setShowPDIFilter(!showPDIFilter)}
                  className="h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40 flex items-center gap-2"
                  variant="outline"
                >
                  <Filter className="w-4 h-4" />
                  PDI Filter
                </Button>
                <Button 
                  onClick={handleNewProject}
                  className="h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40 flex items-center gap-2"
                  variant="outline"
                  disabled={!isConnected}
                  title={!isConnected ? 'Connect wallet to create a new project' : undefined}
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </div>
            </div>
          </div>
          {!isConnected && (
            <div className="mx-5 mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between">
              <p className="text-sm text-amber-200">
                Connect your Hedera wallet to create projects and generate tokenized lots.
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
          
          {/* PDI Filter Section */}
          {showPDIFilter && (
            <div className="border-t border-white/10 p-5 sm:p-6">
              <PDIFilter 
                projects={SEED_PROJECTS} 
                onFilterChange={handlePDIFilterChange}
              />
            </div>
          )}
          
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-w-0">
              {/* Left inner: New Project Form */}
              <div className="xl:col-span-7 min-w-0 w-full">
                <FormNewProject formData={formData} setFormData={setFormData} />
              </div>
              
              {/* Right inner: Real-time Calculations + Tips */}
              <div className="xl:col-span-5 min-w-0 w-full">
                <div className="xl:sticky xl:top-24 space-y-4">
                  <RealtimeCalc formData={formData} />
                  <Tips />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Generated Project Sheets */}
        <div className="card-base">
          <div className="card-header">
            <h3 className="text-base font-semibold mb-3">Generated Project Sheets</h3>
          </div>
          <div className="p-4">
            {SEED_PROJECTS.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Project Sheets Yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Create your first carbon credit project to start generating tokenized lots for the marketplace.
                  </p>
                  <Button 
                    onClick={handleNewProject}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Project
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                {SEED_PROJECTS.map((sheet) => (
                  <div key={sheet.id} className="card-base hover:shadow-md transition-shadow">
                    <div className="p-3">
                      <div className="space-y-1.5">
                        <h4 className="font-semibold text-sm text-foreground">{sheet.projectName}</h4>
                        <p className="text-xs text-muted-foreground">{sheet.location}</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Area:</span>
                          <span className="font-mono tabular-nums">{sheet.area} ha</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Rate:</span>
                          <span className="font-mono tabular-nums">{sheet.rate} t/ha/yr</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-mono font-bold text-primary tabular-nums">{sheet.totalTons} t</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Value:</span>
                          <span className="font-mono font-bold text-primary tabular-nums">${(sheet.totalTons * sheet.pricePerTon).toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-white/10">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Status:</span>
                            <span className="badge-base bg-emerald-500/10 text-emerald-400">
                              ACTIVE
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}