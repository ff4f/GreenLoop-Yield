import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, FilterIcon, RefreshCwIcon, DownloadIcon, TrendingUpIcon, TrendingDownIcon, BarChart3Icon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const PDI_CATEGORIES = {
  ENVIRONMENTAL: 'environmental',
  SOCIAL: 'social',
  ECONOMIC: 'economic',
  GOVERNANCE: 'governance'
};

const PDI_INDICATORS = {
  [PDI_CATEGORIES.ENVIRONMENTAL]: [
    { id: 'carbon_footprint', name: 'Carbon Footprint', unit: 'tCO2e', target: 'minimize' },
    { id: 'water_usage', name: 'Water Usage', unit: 'L/kg', target: 'minimize' },
    { id: 'renewable_energy', name: 'Renewable Energy', unit: '%', target: 'maximize' },
    { id: 'waste_reduction', name: 'Waste Reduction', unit: '%', target: 'maximize' },
    { id: 'biodiversity_score', name: 'Biodiversity Score', unit: 'index', target: 'maximize' }
  ],
  [PDI_CATEGORIES.SOCIAL]: [
    { id: 'farmer_income', name: 'Farmer Income Increase', unit: '%', target: 'maximize' },
    { id: 'job_creation', name: 'Job Creation', unit: 'jobs', target: 'maximize' },
    { id: 'community_investment', name: 'Community Investment', unit: 'USD', target: 'maximize' },
    { id: 'training_hours', name: 'Training Hours', unit: 'hours', target: 'maximize' },
    { id: 'gender_equality', name: 'Gender Equality Score', unit: 'index', target: 'maximize' }
  ],
  [PDI_CATEGORIES.ECONOMIC]: [
    { id: 'yield_improvement', name: 'Yield Improvement', unit: '%', target: 'maximize' },
    { id: 'cost_efficiency', name: 'Cost Efficiency', unit: '%', target: 'maximize' },
    { id: 'market_access', name: 'Market Access Score', unit: 'index', target: 'maximize' },
    { id: 'price_premium', name: 'Price Premium', unit: '%', target: 'maximize' },
    { id: 'roi', name: 'Return on Investment', unit: '%', target: 'maximize' }
  ],
  [PDI_CATEGORIES.GOVERNANCE]: [
    { id: 'transparency_score', name: 'Transparency Score', unit: 'index', target: 'maximize' },
    { id: 'compliance_rate', name: 'Compliance Rate', unit: '%', target: 'maximize' },
    { id: 'stakeholder_engagement', name: 'Stakeholder Engagement', unit: 'index', target: 'maximize' },
    { id: 'audit_frequency', name: 'Audit Frequency', unit: 'audits/year', target: 'maximize' },
    { id: 'grievance_resolution', name: 'Grievance Resolution Time', unit: 'days', target: 'minimize' }
  ]
};

const PERFORMANCE_LEVELS = {
  EXCELLENT: { min: 90, color: 'bg-green-500', label: 'Excellent' },
  GOOD: { min: 70, color: 'bg-blue-500', label: 'Good' },
  FAIR: { min: 50, color: 'bg-yellow-500', label: 'Fair' },
  POOR: { min: 0, color: 'bg-red-500', label: 'Poor' }
};

export default function PDIFilter({ onFilterChange, projects = [] }) {
  const [filters, setFilters] = useState({
    categories: [],
    indicators: [],
    performanceRange: [0, 100],
    dateRange: { from: null, to: null },
    projectTypes: [],
    regions: [],
    certifications: [],
    minInvestment: '',
    maxInvestment: '',
    searchQuery: ''
  });

  const [activeFilters, setActiveFilters] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [statistics, setStatistics] = useState({
    totalProjects: 0,
    avgPerformance: 0,
    topPerformers: 0,
    improvementNeeded: 0
  });

  // Get unique values from projects for filter options
  const projectTypes = [...new Set(projects.map(p => p.type).filter(Boolean))];
  const regions = [...new Set(projects.map(p => p.region).filter(Boolean))];
  const certifications = [...new Set(projects.flatMap(p => p.certifications || []))];

  useEffect(() => {
    applyFilters();
  }, [filters, projects]);

  const applyFilters = () => {
    let filtered = [...projects];

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(project => 
        project.pdi_data && filters.categories.some(cat => 
          Object.keys(project.pdi_data).includes(cat)
        )
      );
    }

    // Indicator filter
    if (filters.indicators.length > 0) {
      filtered = filtered.filter(project => 
        project.pdi_data && filters.indicators.some(indicator => 
          Object.values(project.pdi_data).some(category => 
            category[indicator] !== undefined
          )
        )
      );
    }

    // Performance range filter
    filtered = filtered.filter(project => {
      const performance = calculateOverallPerformance(project.pdi_data);
      return performance >= filters.performanceRange[0] && performance <= filters.performanceRange[1];
    });

    // Date range filter
    if (filters.dateRange.from && filters.dateRange.to) {
      filtered = filtered.filter(project => {
        const projectDate = new Date(project.created_at || project.start_date);
        return projectDate >= filters.dateRange.from && projectDate <= filters.dateRange.to;
      });
    }

    // Project type filter
    if (filters.projectTypes.length > 0) {
      filtered = filtered.filter(project => 
        filters.projectTypes.includes(project.type)
      );
    }

    // Region filter
    if (filters.regions.length > 0) {
      filtered = filtered.filter(project => 
        filters.regions.includes(project.region)
      );
    }

    // Certification filter
    if (filters.certifications.length > 0) {
      filtered = filtered.filter(project => 
        project.certifications && filters.certifications.some(cert => 
          project.certifications.includes(cert)
        )
      );
    }

    // Investment range filter
    if (filters.minInvestment || filters.maxInvestment) {
      filtered = filtered.filter(project => {
        const investment = project.investment_amount || 0;
        const min = parseFloat(filters.minInvestment) || 0;
        const max = parseFloat(filters.maxInvestment) || Infinity;
        return investment >= min && investment <= max;
      });
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.name?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query)
      );
    }

    setFilteredProjects(filtered);
    calculateStatistics(filtered);
    onFilterChange?.(filtered, filters);
  };

  const calculateOverallPerformance = (pdiData) => {
    if (!pdiData) return 0;
    
    const allScores = [];
    Object.values(pdiData).forEach(category => {
      Object.values(category).forEach(value => {
        if (typeof value === 'number') {
          allScores.push(value);
        }
      });
    });
    
    return allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  };

  const calculateStatistics = (filtered) => {
    const totalProjects = filtered.length;
    const performances = filtered.map(p => calculateOverallPerformance(p.pdi_data));
    const avgPerformance = performances.length > 0 ? 
      performances.reduce((a, b) => a + b, 0) / performances.length : 0;
    const topPerformers = performances.filter(p => p >= 80).length;
    const improvementNeeded = performances.filter(p => p < 50).length;

    setStatistics({
      totalProjects,
      avgPerformance: Math.round(avgPerformance),
      topPerformers,
      improvementNeeded
    });
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      indicators: [],
      performanceRange: [0, 100],
      dateRange: { from: null, to: null },
      projectTypes: [],
      regions: [],
      certifications: [],
      minInvestment: '',
      maxInvestment: '',
      searchQuery: ''
    });
  };

  const exportResults = () => {
    const csvContent = [
      ['Project Name', 'Type', 'Region', 'Performance Score', 'Investment Amount'],
      ...filteredProjects.map(project => [
        project.name,
        project.type,
        project.region,
        calculateOverallPerformance(project.pdi_data),
        project.investment_amount
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdi-filtered-projects-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{statistics.totalProjects}</p>
              </div>
              <BarChart3Icon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold">{statistics.avgPerformance}%</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Performers</p>
                <p className="text-2xl font-bold">{statistics.topPerformers}</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Need Improvement</p>
                <p className="text-2xl font-bold">{statistics.improvementNeeded}</p>
              </div>
              <TrendingDownIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5" />
              PDI Filter & Analytics
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? 'Simple' : 'Advanced'} Filters
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={exportResults}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search Projects</Label>
            <Input
              id="search"
              placeholder="Search by name, description, or location..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
            />
          </div>

          {/* PDI Categories */}
          <div>
            <Label>PDI Categories</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(PDI_CATEGORIES).map(([key, value]) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={value}
                    checked={filters.categories.includes(value)}
                    onCheckedChange={() => toggleArrayFilter('categories', value)}
                  />
                  <Label htmlFor={value} className="capitalize">{value}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Range */}
          <div>
            <Label>Performance Score Range: {filters.performanceRange[0]}% - {filters.performanceRange[1]}%</Label>
            <Slider
              value={filters.performanceRange}
              onValueChange={(value) => updateFilter('performanceRange', value)}
              max={100}
              min={0}
              step={5}
              className="mt-2"
            />
          </div>

          {showAdvanced && (
            <>
              {/* Specific Indicators */}
              <div>
                <Label>Specific Indicators</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {Object.values(PDI_INDICATORS).flat().map(indicator => (
                    <div key={indicator.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={indicator.id}
                        checked={filters.indicators.includes(indicator.id)}
                        onCheckedChange={() => toggleArrayFilter('indicators', indicator.id)}
                      />
                      <Label htmlFor={indicator.id} className="text-sm">{indicator.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? format(filters.dateRange.from, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.to ? format(filters.dateRange.to, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Project Types */}
              {projectTypes.length > 0 && (
                <div>
                  <Label>Project Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {projectTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={filters.projectTypes.includes(type)}
                          onCheckedChange={() => toggleArrayFilter('projectTypes', type)}
                        />
                        <Label htmlFor={type}>{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regions */}
              {regions.length > 0 && (
                <div>
                  <Label>Regions</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {regions.map(region => (
                      <div key={region} className="flex items-center space-x-2">
                        <Checkbox
                          id={region}
                          checked={filters.regions.includes(region)}
                          onCheckedChange={() => toggleArrayFilter('regions', region)}
                        />
                        <Label htmlFor={region}>{region}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Investment Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minInvestment">Min Investment (USD)</Label>
                  <Input
                    id="minInvestment"
                    type="number"
                    placeholder="0"
                    value={filters.minInvestment}
                    onChange={(e) => updateFilter('minInvestment', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxInvestment">Max Investment (USD)</Label>
                  <Input
                    id="maxInvestment"
                    type="number"
                    placeholder="No limit"
                    value={filters.maxInvestment}
                    onChange={(e) => updateFilter('maxInvestment', e.target.value)}
                  />
                </div>
              </div>

              {/* Certifications */}
              {certifications.length > 0 && (
                <div>
                  <Label>Certifications</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {certifications.map(cert => (
                      <div key={cert} className="flex items-center space-x-2">
                        <Checkbox
                          id={cert}
                          checked={filters.certifications.includes(cert)}
                          onCheckedChange={() => toggleArrayFilter('certifications', cert)}
                        />
                        <Label htmlFor={cert}>{cert}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Active Filters:</span>
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="secondary">
                  {filter}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}