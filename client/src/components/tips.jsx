import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Lightbulb } from "lucide-react";

const Tips = () => {
  const tips = [
    {
      title: "Buffer Percentage",
      content: "Industry standard is 10-30%. Higher buffer reduces risk but lowers marketable credits."
    },
    {
      title: "Forward Sales",
      content: "Forward selling 0-50% provides upfront capital but locks in current prices."
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Tips & Best Practices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip, index) => (
          <div key={index} className="bg-white/5 rounded-xl p-4">
            <div className="text-xs font-medium text-foreground mb-1">{tip.title}</div>
            <div className="text-xs text-muted-foreground">{tip.content}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default Tips;