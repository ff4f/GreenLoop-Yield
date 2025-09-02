import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, ShoppingCart, Package, Camera, Award } from "lucide-react";

// Icon mapping for tab types
const iconMap = {
  "project-sheets": FileText,
  "marketplace": ShoppingCart,
  "orders": Package,
  "proof-feed": Camera,
  "claims-helper": Award,
  projects: FileText,
  market: ShoppingCart,
  evidence: Camera
};

const TopTabs = ({ tabs = [], activeTab, onTabChange }) => {
  // Fallback for empty tabs
  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2">
      {tabs.map((tab) => {
        const Icon = iconMap[tab.value] || tab.icon || FileText;
        
        return (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "default" : "ghost"}
            onClick={() => onTabChange?.(tab.value)}
            className={cn(
              "h-9 text-sm rounded-xl justify-start transition-all focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2",
              activeTab === tab.value
                ? "bg-emerald-500 text-white border border-emerald-400/50"
                : "hover:bg-white/5 text-muted-foreground hover:text-foreground border border-white/10 bg-white/5"
            )}
          >
            <Icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
};

export default TopTabs;