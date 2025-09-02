import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Shield, 
  Info,
  Percent,
  Clock,
  Award
} from 'lucide-react';
import { 
  calculateDynamicPricing,
  calculateTieredFees,
  calculatePayoutSplit,
  calculateEscrowTerms,
  calculateCarbonPricing
} from '@shared/schema.js';

const PricingCalculator = () => {
  const [results, setResults] = useState({});
  const [formData, setFormData] = useState({
    // Dynamic Pricing
    basePrice: 25,
    demand: 1000,
    supply: 800,
    volatilityMultiplier: 1.0,
    seasonalAdjustment: 1.1,
    qualityPremium: 1.15,
    urgencyMultiplier: 1.0,
    
    // Tiered Fees
    orderAmount: 5000,
    userTier: 'standard',
    
    // Payout Split
    totalAmount: 10000,
    projectDeveloper: 70,
    platform: 15,
    verifier: 8,
    registry: 5,
    insurance: 2,
    
    // Escrow Terms
    escrowAmount: 15000,
    riskLevel: 'medium',
    
    // Carbon Pricing
    projectType: 'forestry',
    vintage: 2024,
    quality: 'verified',
    location: 'developing',
    certifications: ['vcs']
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateDynamic = () => {
    try {
      const result = calculateDynamicPricing(
        formData.basePrice,
        formData.demand,
        formData.supply,
        {
          volatilityMultiplier: formData.volatilityMultiplier,
          seasonalAdjustment: formData.seasonalAdjustment,
          qualityPremium: formData.qualityPremium,
          urgencyMultiplier: formData.urgencyMultiplier
        }
      );
      setResults(prev => ({ ...prev, dynamic: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, dynamic: { error: error.message } }));
    }
  };

  const calculateFees = () => {
    try {
      const result = calculateTieredFees(formData.orderAmount, formData.userTier);
      setResults(prev => ({ ...prev, fees: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, fees: { error: error.message } }));
    }
  };

  const calculatePayout = () => {
    try {
      const stakeholders = {
        projectDeveloper: formData.projectDeveloper / 100,
        platform: formData.platform / 100,
        verifier: formData.verifier / 100,
        registry: formData.registry / 100,
        insurance: formData.insurance / 100
      };
      const result = calculatePayoutSplit(formData.totalAmount, stakeholders);
      setResults(prev => ({ ...prev, payout: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, payout: { error: error.message } }));
    }
  };

  const calculateEscrow = () => {
    try {
      const result = calculateEscrowTerms(formData.escrowAmount, formData.riskLevel);
      setResults(prev => ({ ...prev, escrow: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, escrow: { error: error.message } }));
    }
  };

  const calculateCarbon = () => {
    try {
      const result = calculateCarbonPricing(
        formData.projectType,
        formData.vintage,
        formData.quality,
        formData.location,
        formData.certifications
      );
      setResults(prev => ({ ...prev, carbon: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, carbon: { error: error.message } }));
    }
  };

  // Auto-calculate when form data changes
  useEffect(() => {
    calculateDynamic();
    calculateFees();
    calculatePayout();
    calculateEscrow();
    calculateCarbon();
  }, [formData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const { toast } = useToast();

  const ResultCard = ({ title, icon: Icon, result, error }) => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm">
            Error: {error}
          </div>
        )}
        {!error && result}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Pricing & Fees Calculator</h2>
      </div>

      <Tabs defaultValue="dynamic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dynamic">Dynamic Pricing</TabsTrigger>
          <TabsTrigger value="fees">Tiered Fees</TabsTrigger>
          <TabsTrigger value="payout">Payout Split</TabsTrigger>
          <TabsTrigger value="escrow">Escrow Terms</TabsTrigger>
          <TabsTrigger value="carbon">Carbon Pricing</TabsTrigger>
        </TabsList>

        {/* Dynamic Pricing Tab */}
        <TabsContent value="dynamic" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Parameters</CardTitle>
                <CardDescription>
                  Configure market conditions for dynamic pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="basePrice">Base Price ($)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value))}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="demand">Demand (units)</Label>
                    <Input
                      id="demand"
                      type="number"
                      value={formData.demand}
                      onChange={(e) => handleInputChange('demand', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supply">Supply (units)</Label>
                    <Input
                      id="supply"
                      type="number"
                      value={formData.supply}
                      onChange={(e) => handleInputChange('supply', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="volatilityMultiplier">Volatility</Label>
                    <Input
                      id="volatilityMultiplier"
                      type="number"
                      value={formData.volatilityMultiplier}
                      onChange={(e) => handleInputChange('volatilityMultiplier', parseFloat(e.target.value))}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seasonalAdjustment">Seasonal</Label>
                    <Input
                      id="seasonalAdjustment"
                      type="number"
                      value={formData.seasonalAdjustment}
                      onChange={(e) => handleInputChange('seasonalAdjustment', parseFloat(e.target.value))}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="qualityPremium">Quality</Label>
                    <Input
                      id="qualityPremium"
                      type="number"
                      value={formData.qualityPremium}
                      onChange={(e) => handleInputChange('qualityPremium', parseFloat(e.target.value))}
                      step="0.1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <ResultCard
              title="Dynamic Pricing Result"
              icon={TrendingUp}
              error={results.dynamic?.error}
              result={results.dynamic && !results.dynamic.error && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Base Price:</span>
                    <span className="font-mono">{formatCurrency(results.dynamic.basePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Adjusted Price:</span>
                    <span className="font-mono font-bold text-lg">{formatCurrency(results.dynamic.adjustedPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Price Change:</span>
                    <Badge variant={results.dynamic.priceChange >= 0 ? 'default' : 'destructive'}>
                      {results.dynamic.priceChange >= 0 ? '+' : ''}{formatCurrency(results.dynamic.priceChange)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Change %:</span>
                    <Badge variant={results.dynamic.priceChangePercent >= 0 ? 'default' : 'destructive'}>
                      {results.dynamic.priceChangePercent >= 0 ? '+' : ''}{results.dynamic.priceChangePercent.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Demand/Supply Ratio:</span>
                    <span className="font-mono">{results.dynamic.demandSupplyRatio.toFixed(2)}</span>
                  </div>
                </div>
              )}
            />
          </div>
        </TabsContent>

        {/* Tiered Fees Tab */}
        <TabsContent value="fees" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Parameters</CardTitle>
                <CardDescription>
                  Configure order amount and user tier for fee calculation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="orderAmount">Order Amount ($)</Label>
                  <Input
                    id="orderAmount"
                    type="number"
                    value={formData.orderAmount}
                    onChange={(e) => handleInputChange('orderAmount', parseFloat(e.target.value))}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="userTier">User Tier</Label>
                  <Select value={formData.userTier} onValueChange={(value) => handleInputChange('userTier', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <ResultCard
              title="Fee Calculation"
              icon={Percent}
              error={results.fees?.error}
              result={results.fees && !results.fees.error && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Platform Fee:</span>
                    <span className="font-mono">{formatCurrency(results.fees.platformFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Retirement Fee:</span>
                    <span className="font-mono">{formatCurrency(results.fees.retirementFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Transaction Fee:</span>
                    <span className="font-mono">{formatCurrency(results.fees.transactionFee)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-semibold">Total Fees:</span>
                    <span className="font-mono font-bold">{formatCurrency(results.fees.totalFees)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Volume Discount:</span>
                    <Badge variant="outline">{formatPercentage(results.fees.volumeDiscount)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>User Tier:</span>
                    <Badge>{results.fees.userTier}</Badge>
                  </div>
                </div>
              )}
            />
          </div>
        </TabsContent>

        {/* Payout Split Tab */}
        <TabsContent value="payout" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stakeholder Percentages</CardTitle>
                <CardDescription>
                  Configure payout distribution among stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="totalAmount">Total Amount ($)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value))}
                    step="0.01"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectDeveloper">Project Developer (%)</Label>
                    <Input
                      id="projectDeveloper"
                      type="number"
                      value={formData.projectDeveloper}
                      onChange={(e) => handleInputChange('projectDeveloper', parseInt(e.target.value))}
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform">Platform (%)</Label>
                    <Input
                      id="platform"
                      type="number"
                      value={formData.platform}
                      onChange={(e) => handleInputChange('platform', parseInt(e.target.value))}
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="verifier">Verifier (%)</Label>
                    <Input
                      id="verifier"
                      type="number"
                      value={formData.verifier}
                      onChange={(e) => handleInputChange('verifier', parseInt(e.target.value))}
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registry">Registry (%)</Label>
                    <Input
                      id="registry"
                      type="number"
                      value={formData.registry}
                      onChange={(e) => handleInputChange('registry', parseInt(e.target.value))}
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance">Insurance (%)</Label>
                    <Input
                      id="insurance"
                      type="number"
                      value={formData.insurance}
                      onChange={(e) => handleInputChange('insurance', parseInt(e.target.value))}
                      max="100"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Total: {formData.projectDeveloper + formData.platform + formData.verifier + formData.registry + formData.insurance}%
                </div>
              </CardContent>
            </Card>

            <ResultCard
              title="Payout Distribution"
              icon={Users}
              error={results.payout?.error}
              result={results.payout && !results.payout.error && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Project Developer:</span>
                    <span className="font-mono">{formatCurrency(results.payout.payouts.projectDeveloper)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Platform:</span>
                    <span className="font-mono">{formatCurrency(results.payout.payouts.platform)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Verifier:</span>
                    <span className="font-mono">{formatCurrency(results.payout.payouts.verifier)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Registry:</span>
                    <span className="font-mono">{formatCurrency(results.payout.payouts.registry)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Insurance:</span>
                    <span className="font-mono">{formatCurrency(results.payout.payouts.insurance)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-semibold">Total Payout:</span>
                    <span className="font-mono font-bold">{formatCurrency(results.payout.verification.totalPayout)}</span>
                  </div>
                  {Math.abs(results.payout.verification.difference) > 0.01 && (
                    <div className="text-sm text-amber-600">
                      Rounding difference: {formatCurrency(results.payout.verification.difference)}
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </TabsContent>

        {/* Escrow Terms Tab */}
        <TabsContent value="escrow" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Escrow Parameters</CardTitle>
                <CardDescription>
                  Configure escrow terms based on risk level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="escrowAmount">Escrow Amount ($)</Label>
                  <Input
                    id="escrowAmount"
                    type="number"
                    value={formData.escrowAmount}
                    onChange={(e) => handleInputChange('escrowAmount', parseFloat(e.target.value))}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <Select value={formData.riskLevel} onValueChange={(value) => handleInputChange('riskLevel', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="critical">Critical Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <ResultCard
              title="Escrow Terms"
              icon={Shield}
              error={results.escrow?.error}
              result={results.escrow && !results.escrow.error && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Hold Period:</span>
                    <span className="font-mono">{results.escrow.holdPeriodDays} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Collateral Required:</span>
                    <span className="font-mono">{formatCurrency(results.escrow.collateralRequired)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Penalty Rate:</span>
                    <span className="font-mono">{formatPercentage(results.escrow.penaltyRate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Max Penalty:</span>
                    <span className="font-mono">{formatCurrency(results.escrow.maxPenalty)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Escrow Fee:</span>
                    <span className="font-mono">{formatCurrency(results.escrow.escrowFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Release Date:</span>
                    <span className="font-mono text-sm">{results.escrow.releaseDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Risk Level:</span>
                    <Badge variant={results.escrow.riskLevel === 'low' ? 'default' : 
                                   results.escrow.riskLevel === 'medium' ? 'secondary' :
                                   results.escrow.riskLevel === 'high' ? 'destructive' : 'destructive'}>
                      {results.escrow.riskLevel}
                    </Badge>
                  </div>
                </div>
              )}
            />
          </div>
        </TabsContent>

        {/* Carbon Pricing Tab */}
        <TabsContent value="carbon" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Carbon Credit Parameters</CardTitle>
                <CardDescription>
                  Configure carbon credit characteristics for pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="projectType">Project Type</Label>
                  <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forestry">Forestry</SelectItem>
                      <SelectItem value="renewable-energy">Renewable Energy</SelectItem>
                      <SelectItem value="energy-efficiency">Energy Efficiency</SelectItem>
                      <SelectItem value="methane-capture">Methane Capture</SelectItem>
                      <SelectItem value="direct-air-capture">Direct Air Capture</SelectItem>
                      <SelectItem value="blue-carbon">Blue Carbon</SelectItem>
                      <SelectItem value="soil-carbon">Soil Carbon</SelectItem>
                      <SelectItem value="biochar">Biochar</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vintage">Vintage Year</Label>
                    <Input
                      id="vintage"
                      type="number"
                      value={formData.vintage}
                      onChange={(e) => handleInputChange('vintage', parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quality">Quality</Label>
                    <Select value={formData.quality} onValueChange={(value) => handleInputChange('quality', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developed">Developed Countries</SelectItem>
                      <SelectItem value="developing">Developing Countries</SelectItem>
                      <SelectItem value="ldcs">Least Developed Countries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <ResultCard
              title="Carbon Credit Pricing"
              icon={Award}
              error={results.carbon?.error}
              result={results.carbon && !results.carbon.error && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Base Price:</span>
                    <span className="font-mono">{formatCurrency(results.carbon.basePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Final Price:</span>
                    <span className="font-mono font-bold text-lg">{formatCurrency(results.carbon.finalPrice)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Adjustments:</div>
                    <div className="ml-4 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Vintage:</span>
                        <span>+{formatPercentage(results.carbon.adjustments.vintage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality:</span>
                        <span>×{results.carbon.adjustments.quality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span>×{results.carbon.adjustments.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Certifications:</span>
                        <span>+{formatPercentage(results.carbon.adjustments.certifications)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Project Type:</span>
                    <Badge variant="outline">{results.carbon.breakdown.projectType}</Badge>
                  </div>
                </div>
              )}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PricingCalculator;