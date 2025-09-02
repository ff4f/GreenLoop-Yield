import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Percent, Clock, Zap } from 'lucide-react';
import { 
  SEED_YIELD_POSITIONS, 
  SEED_STAKING_POSITIONS, 
  SEED_LIQUIDITY_POOLS, 
  SEED_LP_POSITIONS 
} from '@shared/seed-data.js';
import { 
  calculateYield, 
  calculateStakingRewards, 
  calculateLPRewards 
} from '@shared/schema.js';

const YieldDashboard = () => {
  const [yieldPositions, setYieldPositions] = useState(SEED_YIELD_POSITIONS);
  const [stakingPositions, setStakingPositions] = useState(SEED_STAKING_POSITIONS);
  const [liquidityPools, setLiquidityPools] = useState(SEED_LIQUIDITY_POOLS);
  const [lpPositions, setLpPositions] = useState(SEED_LP_POSITIONS);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [totalYieldEarned, setTotalYieldEarned] = useState(0);
  const [averageAPY, setAverageAPY] = useState(0);

  useEffect(() => {
    // Calculate portfolio metrics
    const totalValue = yieldPositions.reduce((sum, pos) => sum + pos.currentValue, 0) +
                      stakingPositions.reduce((sum, pos) => sum + pos.stakedAmount + pos.pendingRewards, 0) +
                      lpPositions.reduce((sum, pos) => sum + pos.liquidityProvided + pos.feesEarned, 0);
    
    const totalYield = yieldPositions.reduce((sum, pos) => sum + pos.yieldEarned, 0) +
                      stakingPositions.reduce((sum, pos) => sum + pos.totalRewardsClaimed + pos.pendingRewards, 0) +
                      lpPositions.reduce((sum, pos) => sum + pos.feesEarned, 0);
    
    const weightedAPY = (
      yieldPositions.reduce((sum, pos) => sum + (pos.apy * pos.currentValue), 0) +
      stakingPositions.reduce((sum, pos) => sum + (pos.rewardRate * pos.stakedAmount), 0) +
      lpPositions.reduce((sum, pos) => {
        const pool = liquidityPools.find(p => p.id === pos.poolId);
        return sum + ((pool?.apy || 0) * pos.liquidityProvided);
      }, 0)
    ) / totalValue;

    setTotalPortfolioValue(totalValue);
    setTotalYieldEarned(totalYield);
    setAverageAPY(weightedAPY || 0);
  }, [yieldPositions, stakingPositions, lpPositions, liquidityPools]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (rate) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const YieldPositionCard = ({ position }) => {
    const yieldPercentage = (position.yieldEarned / position.principal) * 100;
    const isPositive = position.yieldEarned > 0;

    return (
      <div className="card-base hover:shadow-md transition-all duration-200">
        <div className="card-header">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">Carbon Lot #{position.lotId.slice(-3)}</h3>
              <p className="text-sm text-muted-foreground">Carbon Credit Appreciation</p>
            </div>
            <div className={isPositive ? "badge-success" : "badge-destructive"}>
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {formatPercentage(position.apy)}
            </div>
          </div>
        </div>
        <div className="p-6 pt-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Principal</span>
                <span className="font-medium">{formatCurrency(position.principal)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Current Value</span>
                <span className="font-medium">{formatCurrency(position.currentValue)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Yield Earned</span>
              <span className={`font-medium text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(position.yieldEarned)}
              </span>
            </div>
            <Progress value={Math.min(yieldPercentage, 100)} className="h-1.5" />
            <div className="text-xs text-muted-foreground text-center">
              {yieldPercentage.toFixed(2)}% return since {new Date(position.startDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StakingPositionCard = ({ position }) => {
    const stakingRewards = calculateStakingRewards(
      position.stakedAmount, 
      position.rewardRate, 
      Math.floor((new Date() - new Date(position.stakingStartDate)) / (1000 * 60 * 60 * 24))
    );

    return (
      <div className="card-base hover:shadow-md transition-all duration-200">
        <div className="card-header">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">Staking Position</h3>
              <p className="text-sm text-muted-foreground">Token ID: {position.tokenId}</p>
            </div>
            <div className="badge-base">
              <Zap className="w-3 h-3 mr-1" />
              {formatPercentage(position.rewardRate)} APY
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Staked Amount</span>
              <span className="font-medium">{formatCurrency(position.stakedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending Rewards</span>
              <span className="font-medium text-green-600">{formatCurrency(position.pendingRewards)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Claimed</span>
              <span className="font-medium">{formatCurrency(position.totalRewardsClaimed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Lock Period</span>
              <span className="font-medium">{position.lockPeriod} days</span>
            </div>
            <button className="btn-sm w-full">
              Claim Rewards ({formatCurrency(position.pendingRewards)})
            </button>
          </div>
        </div>
      </div>
    );
  };

  const LiquidityPositionCard = ({ position }) => {
    const pool = liquidityPools.find(p => p.id === position.poolId);
    const lpRewards = calculateLPRewards(
      position.liquidityProvided,
      pool?.totalValueLocked || 0,
      pool?.dailyVolume || 0,
      pool?.feeRate || 0.003
    );

    return (
      <div className="card-base hover:shadow-md transition-all duration-200">
        <div className="card-header">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">LP Position</h3>
              <p className="text-sm text-muted-foreground">Pool: {pool?.tokenA} / {pool?.tokenB}</p>
            </div>
            <div className="badge-base">
              <DollarSign className="w-3 h-3 mr-1" />
              {formatPercentage(pool?.apy || 0)} APY
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Liquidity Provided</span>
              <span className="font-medium">{formatCurrency(position.liquidityProvided)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">LP Tokens</span>
              <span className="font-medium">{position.lpTokens.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fees Earned</span>
              <span className="font-medium text-green-600">{formatCurrency(position.feesEarned)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pool Share</span>
              <span className="font-medium">{lpRewards.poolShare}%</span>
            </div>
            {position.impermanentLoss < 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Impermanent Loss</span>
                <span className="font-medium text-red-600">{formatCurrency(position.impermanentLoss)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <TrendingUp className="h-6 w-6" aria-hidden="true" />
        <h2 className="text-2xl font-bold" aria-label="DeFi yield performance dashboard">Yield Dashboard</h2>
      </div>
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="region" aria-label="Portfolio overview">
        <div className="card-base">
          <div className="stat-container">
            <div className="flex items-center justify-between">
              <div className="stat-label">Total Portfolio Value</div>
              <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="stat-value" aria-label={`Total portfolio value: ${formatCurrency(totalPortfolioValue)}`}>{formatCurrency(totalPortfolioValue)}</div>
            <p className="text-xs text-muted-foreground" aria-label="Calculated across all positions">Across all positions</p>
          </div>
        </div>
        
        <div className="card-base">
          <div className="stat-container">
            <div className="flex items-center justify-between">
              <div className="stat-label">Total Yield Earned</div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="stat-value text-green-600" aria-label={`Total yield earned: ${formatCurrency(totalYieldEarned)}`}>{formatCurrency(totalYieldEarned)}</div>
            <p className="text-xs text-muted-foreground" aria-label="Lifetime earnings summary">Lifetime earnings</p>
          </div>
        </div>
        
        <div className="card-base">
          <div className="stat-container">
            <div className="flex items-center justify-between">
              <div className="stat-label">Average APY</div>
              <Percent className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="stat-value" aria-label={`Average annual percentage yield: ${formatPercentage(averageAPY)}`}>{formatPercentage(averageAPY)}</div>
            <p className="text-xs text-muted-foreground" aria-label="Weighted average across all positions">Weighted average</p>
          </div>
        </div>
      </div>

      {/* Yield Positions Tabs */}
      <Tabs defaultValue="carbon-yield" className="w-full" role="region" aria-label="Yield positions by category">
        <TabsList className="grid w-full grid-cols-3" role="tablist" aria-label="Yield position categories">
          <TabsTrigger value="carbon-yield" aria-label="Carbon credit yield positions">Carbon Yield</TabsTrigger>
          <TabsTrigger value="staking" aria-label="Token staking positions">Staking</TabsTrigger>
          <TabsTrigger value="liquidity" aria-label="Liquidity mining positions">Liquidity Mining</TabsTrigger>
        </TabsList>
        
        <TabsContent value="carbon-yield" className="space-y-6" role="tabpanel" aria-label="Carbon yield positions">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Carbon Credit Yield Positions</h3>
            <button className="btn-sm" aria-label="Add new carbon yield position">Add Position</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {yieldPositions.map((position) => (
              <YieldPositionCard key={position.id} position={position} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="staking" className="space-y-6" role="tabpanel" aria-label="Staking positions">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Staking Positions</h3>
            <button className="btn-sm" aria-label="Stake new tokens">Stake Tokens</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stakingPositions.map((position) => (
              <StakingPositionCard key={position.id} position={position} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="liquidity" className="space-y-6" role="tabpanel" aria-label="Liquidity mining positions">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Liquidity Mining Positions</h3>
            <button className="btn-sm" aria-label="Add liquidity to pool">Add Liquidity</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lpPositions.map((position) => (
              <LiquidityPositionCard key={position.id} position={position} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default YieldDashboard;