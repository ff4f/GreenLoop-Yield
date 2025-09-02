import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Filter, Plus, RefreshCw } from "lucide-react";

const tabConfigs = {
  // Projects workspace sub-tabs
  "project-sheets": {
    kpis: [
      { label: "Projects", value: "5", unit: "" },
      { label: "Valid Lots", value: "12", unit: "" },
      { label: "Avg Price", value: "$45", unit: "/t" },
      { label: "Ready to List", value: "3", unit: "lots" }
    ],
    filters: [
      { type: "select", placeholder: "All Types", options: ["Mangrove", "Forest", "Wetland"] },
      { type: "select", placeholder: "All Status", options: ["Draft", "Generated", "Listed"] }
    ],
    actions: [
      { label: "New Project", icon: Plus, variant: "default" }
    ]
  },
  "pricing-calculator": {
    kpis: [
      { label: "Base Price", value: "$42", unit: "/t" },
      { label: "Buffer Range", value: "10-30", unit: "%" },
      { label: "Est. Revenue", value: "$52K", unit: "" },
      { label: "Margin", value: "18", unit: "%" }
    ],
    filters: [
      { type: "select", placeholder: "All Scenarios", options: ["Conservative", "Moderate", "Aggressive"] }
    ],
    actions: [
      { label: "Save Scenario", icon: Plus, variant: "default" }
    ]
  },
  "state-machine": {
    kpis: [
      { label: "Active States", value: "8", unit: "" },
      { label: "Transitions", value: "24", unit: "today" },
      { label: "Avg Duration", value: "4.2", unit: "days" },
      { label: "Success Rate", value: "94", unit: "%" }
    ],
    filters: [
      { type: "select", placeholder: "All States", options: ["DRAFT", "GENERATED", "LISTED", "ESCROWED"] }
    ],
    actions: [
      { label: "Refresh States", icon: RefreshCw, variant: "outline" }
    ]
  },
  "proof-first": {
    kpis: [
      { label: "Operations", value: "156", unit: "" },
      { label: "Files Created", value: "89", unit: "HFS" },
      { label: "Topics Active", value: "12", unit: "HCS" },
      { label: "Tokens Minted", value: "1.2K", unit: "HTS" }
    ],
    filters: [
      { type: "select", placeholder: "All Operations", options: ["Token", "File", "Topic"] }
    ],
    actions: [
      { label: "New Operation", icon: Plus, variant: "default" }
    ]
  },
  
  // Market workspace sub-tabs
  marketplace: {
    kpis: [
      { label: "Lots Listed", value: "12", unit: "" },
      { label: "Median Price", value: "$42", unit: "/t" },
      { label: "Avg Proofs", value: "3.2", unit: "/lot" },
      { label: "Escrow Volume", value: "$125K", unit: "(7d)" }
    ],
    filters: [
      { type: "select", placeholder: "All Types", options: ["Mangrove", "Forest", "Wetland"] },
      { type: "select", placeholder: "All Regions", options: ["Indonesia", "Kenya", "Brazil"] }
    ],
    actions: [
      { label: "Refresh Market", icon: RefreshCw, variant: "outline" }
    ]
  },
  orders: {
    kpis: [
      { label: "Open Orders", value: "8", unit: "" },
      { label: "25% Progress", value: "3", unit: "orders" },
      { label: "75% Progress", value: "2", unit: "orders" },
      { label: "Avg Cycle", value: "12", unit: "days" }
    ],
    filters: [
      { type: "select", placeholder: "All Status", options: ["ESCROWED", "DELIVERED", "SETTLED"] },
      { type: "search", placeholder: "Search Order ID..." }
    ],
    actions: [
      { label: "Export Report", icon: Plus, variant: "outline" }
    ]
  },
  
  // Evidence workspace sub-tabs
  "proof-feed": {
    kpis: [
      { label: "Total Proofs", value: "156", unit: "" },
      { label: "This Week", value: "23", unit: "proofs" },
      { label: "Avg/Lot", value: "3.2", unit: "proofs" },
      { label: "HCS Topics", value: "4", unit: "active" }
    ],
    filters: [
      { type: "select", placeholder: "All Types", options: ["Photo", "NDVI", "QC Check"] },
      { type: "select", placeholder: "All Lots", options: ["LOT-001", "LOT-002", "LOT-003"] },
      { type: "search", placeholder: "Search by hash..." }
    ],
    actions: [
      { label: "Add Proof", icon: Plus, variant: "default" }
    ]
  },
  "claims-helper": {
    kpis: [
      { label: "Eligible Lots", value: "8", unit: "" },
      { label: "Total Tons", value: "840", unit: "t" },
      { label: "Est. Value", value: "$37K", unit: "" },
      { label: "Last Claim", value: "3", unit: "days ago" }
    ],
    filters: [
      { type: "select", placeholder: "All Years", options: ["2025", "2024", "2023"] },
      { type: "select", placeholder: "All Status", options: ["SETTLED", "RETIRED"] }
    ],
    actions: [
      { label: "Start Claim", icon: Plus, variant: "default" }
    ]
  },
  "hedera-integration": {
    kpis: [
      { label: "Network", value: "Testnet", unit: "" },
      { label: "Account ID", value: "0.0.123", unit: "" },
      { label: "Balance", value: "1,250", unit: "ℏ" },
      { label: "Last Tx", value: "2", unit: "min ago" }
    ],
    filters: [
      { type: "select", placeholder: "All Services", options: ["HTS", "HFS", "HCS"] }
    ],
    actions: [
      { label: "Connect Wallet", icon: Plus, variant: "default" }
    ]
  }
};

export default function SubheaderStrip({ activeTab, onFilterChange, onActionClick, onPrimaryAction, disabled = false }) {
  const config = tabConfigs[activeTab] || tabConfigs.marketplace;

  // Guardrails logic - disable actions based on acceptance criteria
  const getActionDisabled = (actionLabel) => {
    if (disabled) return true;
    
    // Example guardrails based on acceptance criteria
    switch (activeTab) {
      case 'project-sheets':
        return actionLabel === 'New Project' && config.kpis[3].value === '0'; // No ready lots
      case 'marketplace':
        return actionLabel === 'Refresh Market' && config.kpis[0].value === '0'; // No lots listed
      case 'orders':
        return actionLabel === 'Export Report' && config.kpis[0].value === '0'; // No open orders
      case 'proof-feed':
        return actionLabel === 'Add Proof' && config.kpis[3].value === '0'; // No active topics
      case 'claims-helper':
        return actionLabel === 'Start Claim' && config.kpis[0].value === '0'; // No eligible lots
      default:
        return false;
    }
  };

  const getTooltipMessage = (actionLabel) => {
    switch (activeTab) {
      case 'project-sheets':
        return actionLabel === 'New Project' && config.kpis[3].value === '0' 
          ? 'No lots ready to list. Complete project validation first.'
          : '';
      case 'marketplace':
        return actionLabel === 'Refresh Market' && config.kpis[0].value === '0'
          ? 'No lots available in marketplace.'
          : '';
      case 'orders':
        return actionLabel === 'Export Report' && config.kpis[0].value === '0'
          ? 'No orders to export. Create orders first.'
          : '';
      case 'proof-feed':
        return actionLabel === 'Add Proof' && config.kpis[3].value === '0'
          ? 'No active HCS topics. Initialize proof system first.'
          : '';
      case 'claims-helper':
        return actionLabel === 'Start Claim' && config.kpis[0].value === '0'
          ? 'No eligible lots for claims. Complete settlements first.'
          : '';
      default:
        return '';
    }
  };

  return (
    <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container-app py-4">
        <div className="flex items-center justify-between gap-6">
          {/* KPIs Section */}
          <div className="flex items-center gap-8">
            {config.kpis.map((kpi, index) => (
              <div key={index} className="stat-container text-center">
                <div className="stat-value">
                  {kpi.value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {kpi.unit}
                  </span>
                </div>
                <div className="stat-label">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Filters & Actions Section */}
          <div className="flex items-center gap-4">
            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              {config.filters.map((filter, index) => (
                filter.type === "search" ? (
                  <div key={index} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      placeholder={filter.placeholder}
                      className="input-base pl-9 w-48"
                      onChange={(e) => onFilterChange?.(filter.type, e.target.value)}
                      aria-label={filter.placeholder}
                    />
                  </div>
                ) : (
                  <Select key={index} onValueChange={(value) => onFilterChange?.(filter.type, value)}>
                    <SelectTrigger className="input-base w-32">
                      <SelectValue placeholder={filter.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              ))}
            </div>

            {/* Actions */}
            <TooltipProvider>
              <div className="flex items-center gap-3">
                {config.actions.map((action, index) => {
                  const Icon = action.icon;
                  const isDisabled = getActionDisabled(action.label);
                  const tooltipMessage = getTooltipMessage(action.label);
                  
                  const buttonElement = (
                    <Button
                      key={index}
                      variant={action.variant}
                      className="btn-sm flex items-center gap-2"
                      onClick={() => {
                        if (!isDisabled) {
                          onPrimaryAction?.();
                          onActionClick?.(action.label);
                        }
                      }}
                      disabled={isDisabled}
                      aria-label={action.label}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{action.label}</span>
                    </Button>
                  );

                  // Wrap with tooltip if there's a message
                  if (tooltipMessage) {
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          {buttonElement}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tooltipMessage}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return buttonElement;
                })}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}