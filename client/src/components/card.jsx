import { cn } from "@/lib/utils";

const Card = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "bg-white/5 border border-white/10 rounded-2xl transition-colors hover:bg-white/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className, ...props }) => {
  return (
    <div
      className={cn("p-4 pb-2", className)}
      {...props}
    >
      {children}
    </div>
  );
};

const CardContent = ({ children, className, ...props }) => {
  return (
    <div
      className={cn("p-4 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className, ...props }) => {
  return (
    <h3
      className={cn("text-sm font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </h3>
  );
};

const CardDescription = ({ children, className, ...props }) => {
  return (
    <p
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
};

export { Card, CardHeader, CardContent, CardTitle, CardDescription };