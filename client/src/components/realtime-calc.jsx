import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calculator, Info } from "lucide-react";

const RealtimeCalc = ({ formData }) => {
  const [calculations, setCalculations] = useState({
    expected: 0,
    afterBuffer: 0,
    listed: 0,
    value: 0,
  });

  useEffect(() => {
    if (formData) {
      const expected = formData.area * formData.rate;
      const afterBuffer = expected * (1 - formData.buffer / 100);
      const listed = afterBuffer * (formData.forward / 100);
      const value = listed * formData.pricePerTon;
      
      setCalculations({
        expected,
        afterBuffer,
        listed,
        value
      });
    }
  }, [formData]);

  const proofLinks = [
    {
      label: "Mirror Node API",
      url: "https://mainnet-public.mirrornode.hedera.com",
      description: "Real-time transaction data"
    },
    {
      label: "Hashscan Explorer",
      url: "https://hashscan.io/mainnet",
      description: "Blockchain explorer"
    },
    {
      label: "HFS File Storage",
      url: "https://docs.hedera.com/hedera/sdks-and-apis/sdks/file-service",
      description: "Decentralized file storage"
    }
  ];



  return (
    <div className="space-y-4">
      {/* Real-time Calculations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Real-time Calculations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-xs text-muted-foreground">Expected tCO2e</div>
              <div className="text-lg font-semibold tabular-nums text-foreground">
                {calculations.expected.toFixed(1)}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-xs text-muted-foreground">After Buffer</div>
              <div className="text-lg font-semibold tabular-nums text-foreground">
                {calculations.afterBuffer.toFixed(1)}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-xs text-muted-foreground">Listed tCO2e</div>
              <div className="text-lg font-semibold tabular-nums text-emerald-600">
                {calculations.listed.toFixed(1)}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-xs text-muted-foreground">Total Value</div>
              <div className="text-lg font-semibold tabular-nums text-emerald-600">
                ${calculations.value.toLocaleString()}
              </div>
            </div>
          </div>
          
          {formData?.area > 0 && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Area: {formData.area} ha × Rate: {formData.rate} tCO2e/ha/yr</div>
              <div>• Buffer: -{formData.buffer}% | Forward: {formData.forward}%</div>
              <div>• Price: ${formData.pricePerTon}/tCO2e</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proof Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Proof Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {proofLinks.map((link, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={() => window.open(link.url, '_blank')}
              className="w-full h-auto p-3 justify-start text-left hover:bg-white/10 rounded-xl"
            >
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground flex items-center gap-2">
                  {link.label}
                  <ExternalLink className="w-3 h-3" />
                </div>
                <div className="text-xs text-muted-foreground">{link.description}</div>
              </div>
            </Button>
          ))}
          
          {/* Proof Pills Footer */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200">
                HCS
              </Badge>
              <Badge variant="outline" className="text-xs font-mono bg-green-50 text-green-700 border-green-200">
                HFS
              </Badge>
              <Badge variant="outline" className="text-xs font-mono bg-orange-50 text-orange-700 border-orange-200">
                HTS
              </Badge>
              <Badge variant="outline" className="text-xs font-mono bg-purple-50 text-purple-700 border-purple-200">
                HSCS
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeCalc;