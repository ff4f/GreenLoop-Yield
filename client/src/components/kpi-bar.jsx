import { cn } from "@/lib/utils";

const KpiBar = ({ kpiData = [] }) => {
  if (!kpiData.length) return null;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      {kpiData.map((kpi, index) => (
        <div
          key={index}
          className="card-base p-4 hover:shadow-sm transition-all duration-200"
        >
          <div className="stat-container">
            <div className="stat-label">{kpi.label}</div>
            <div className="stat-value tabular-nums">{kpi.value}</div>
            {kpi.change && (
              <div className={cn(
                "stat-change tabular-nums",
                kpi.change.startsWith('+') ? "text-emerald-600" : "text-red-600"
              )}>
                {kpi.change}
              </div>
            )}
            {kpi.subtitle && (
              <div className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiBar;