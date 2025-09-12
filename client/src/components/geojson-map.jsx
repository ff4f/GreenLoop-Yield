import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  MapIcon, 
  LayersIcon, 
  ZoomInIcon, 
  ZoomOutIcon, 
  LocateIcon, 
  DownloadIcon,
  FilterIcon,
  InfoIcon,
  TrendingUpIcon,
  LeafIcon,
  DollarSignIcon,
  UsersIcon
} from 'lucide-react';

// Mock Leaflet-like map implementation for demonstration
const MapContainer = ({ children, center, zoom, style }) => {
  const mapRef = useRef(null);
  
  return (
    <div 
      ref={mapRef}
      style={{
        ...style,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="rounded-lg border"
    >
      {children}
    </div>
  );
};

const Marker = ({ position, children, onClick }) => {
  const [lat, lng] = position;
  // Convert lat/lng to pixel position (simplified)
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: 1000
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const Popup = ({ children, isOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-0 left-0 bg-white p-2 rounded shadow-lg border z-[1001] min-w-[200px]">
      {children}
    </div>
  );
};

const PROJECT_TYPES = {
  AGRICULTURE: { color: '#22c55e', icon: '🌱', label: 'Agriculture' },
  FORESTRY: { color: '#16a34a', icon: '🌲', label: 'Forestry' },
  RENEWABLE_ENERGY: { color: '#eab308', icon: '⚡', label: 'Renewable Energy' },
  WATER_MANAGEMENT: { color: '#3b82f6', icon: '💧', label: 'Water Management' },
  WASTE_MANAGEMENT: { color: '#8b5cf6', icon: '♻️', label: 'Waste Management' },
  CARBON_OFFSET: { color: '#06b6d4', icon: '🌍', label: 'Carbon Offset' }
};

const PERFORMANCE_COLORS = {
  excellent: '#22c55e',
  good: '#3b82f6',
  fair: '#eab308',
  poor: '#ef4444'
};

const AFRICAN_REGIONS = {
  'North Africa': { center: [25, 15], projects: [] },
  'West Africa': { center: [10, -5], projects: [] },
  'Central Africa': { center: [0, 20], projects: [] },
  'East Africa': { center: [0, 35], projects: [] },
  'Southern Africa': { center: [-25, 25], projects: [] }
};

export default function GeoJSONMap({ projects = [], onProjectSelect, selectedProject }) {
  const [mapCenter, setMapCenter] = useState([0, 20]); // Center of Africa
  const [mapZoom, setMapZoom] = useState(3);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [layerFilters, setLayerFilters] = useState({
    projectTypes: Object.keys(PROJECT_TYPES),
    performanceLevels: ['excellent', 'good', 'fair', 'poor'],
    showHeatmap: false,
    showClusters: true
  });
  const [mapStyle, setMapStyle] = useState('satellite');
  const [statistics, setStatistics] = useState({
    totalProjects: 0,
    totalInvestment: 0,
    avgPerformance: 0,
    activeRegions: 0
  });

  useEffect(() => {
    calculateStatistics();
  }, [projects]);

  const calculateStatistics = () => {
    const totalProjects = projects.length;
    const totalInvestment = projects.reduce((sum, p) => sum + (p.investment_amount || 0), 0);
    const performances = projects.map(p => calculateProjectPerformance(p)).filter(p => p > 0);
    const avgPerformance = performances.length > 0 ? 
      performances.reduce((a, b) => a + b, 0) / performances.length : 0;
    const activeRegions = new Set(projects.map(p => p.region).filter(Boolean)).size;

    setStatistics({
      totalProjects,
      totalInvestment,
      avgPerformance: Math.round(avgPerformance),
      activeRegions
    });
  };

  const calculateProjectPerformance = (project) => {
    if (!project.pdi_data) return 0;
    
    const allScores = [];
    Object.values(project.pdi_data).forEach(category => {
      Object.values(category).forEach(value => {
        if (typeof value === 'number') {
          allScores.push(value);
        }
      });
    });
    
    return allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  };

  const getPerformanceLevel = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const getMarkerColor = (project) => {
    const performance = calculateProjectPerformance(project);
    const level = getPerformanceLevel(performance);
    return PERFORMANCE_COLORS[level];
  };

  const getMarkerSize = (project) => {
    const investment = project.investment_amount || 0;
    if (investment > 1000000) return 20;
    if (investment > 500000) return 16;
    if (investment > 100000) return 12;
    return 8;
  };

  const filteredProjects = projects.filter(project => {
    const projectType = project.type || 'AGRICULTURE';
    const performance = calculateProjectPerformance(project);
    const performanceLevel = getPerformanceLevel(performance);
    
    return layerFilters.projectTypes.includes(projectType) &&
           layerFilters.performanceLevels.includes(performanceLevel);
  });

  const handleMarkerClick = (project) => {
    setSelectedMarker(project);
    setShowPopup(true);
    onProjectSelect?.(project);
  };

  const zoomIn = () => setMapZoom(prev => Math.min(prev + 1, 10));
  const zoomOut = () => setMapZoom(prev => Math.max(prev - 1, 1));
  const centerMap = () => {
    setMapCenter([0, 20]);
    setMapZoom(3);
  };

  const exportMapData = () => {
    const geoJSON = {
      type: 'FeatureCollection',
      features: filteredProjects.map(project => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [project.longitude || 0, project.latitude || 0]
        },
        properties: {
          id: project.id,
          name: project.name,
          type: project.type,
          performance: calculateProjectPerformance(project),
          investment: project.investment_amount,
          region: project.region,
          status: project.status
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenloop-projects-${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Map Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{statistics.totalProjects}</p>
              </div>
              <MapIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Investment</p>
                <p className="text-2xl font-bold">${(statistics.totalInvestment / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSignIcon className="h-8 w-8 text-green-500" />
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
              <TrendingUpIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Regions</p>
                <p className="text-2xl font-bold">{statistics.activeRegions}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Container */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              GreenLoop Projects Map
            </CardTitle>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <LayersIcon className="h-4 w-4 mr-2" />
                    Layers
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Map Layers & Filters</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Project Types</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.entries(PROJECT_TYPES).map(([key, type]) => (
                          <label key={key} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={layerFilters.projectTypes.includes(key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setLayerFilters(prev => ({
                                    ...prev,
                                    projectTypes: [...prev.projectTypes, key]
                                  }));
                                } else {
                                  setLayerFilters(prev => ({
                                    ...prev,
                                    projectTypes: prev.projectTypes.filter(t => t !== key)
                                  }));
                                }
                              }}
                            />
                            <span className="text-sm">{type.icon} {type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Performance Levels</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['excellent', 'good', 'fair', 'poor'].map(level => (
                          <label key={level} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={layerFilters.performanceLevels.includes(level)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setLayerFilters(prev => ({
                                    ...prev,
                                    performanceLevels: [...prev.performanceLevels, level]
                                  }));
                                } else {
                                  setLayerFilters(prev => ({
                                    ...prev,
                                    performanceLevels: prev.performanceLevels.filter(l => l !== level)
                                  }));
                                }
                              }}
                            />
                            <span className="text-sm capitalize">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="sm" onClick={exportMapData}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export GeoJSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <Button size="sm" variant="outline" onClick={zoomIn}>
                <ZoomInIcon className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={zoomOut}>
                <ZoomOutIcon className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={centerMap}>
                <LocateIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Map Style Selector */}
            <div className="absolute top-4 left-4 z-[1000]">
              <Select value={mapStyle} onValueChange={setMapStyle}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="satellite">Satellite</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                  <SelectItem value="street">Street</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Map */}
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '500px', width: '100%' }}
            >
              {/* Project Markers */}
              {filteredProjects.map(project => {
                const lat = project.latitude || (Math.random() * 60 - 30); // Random for demo
                const lng = project.longitude || (Math.random() * 60 - 30);
                const markerColor = getMarkerColor(project);
                const markerSize = getMarkerSize(project);
                
                return (
                  <Marker
                    key={project.id}
                    position={[lat, lng]}
                    onClick={() => handleMarkerClick(project)}
                  >
                    <div
                      style={{
                        backgroundColor: markerColor,
                        width: markerSize,
                        height: markerSize,
                        borderRadius: '50%',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}
                    >
                      {PROJECT_TYPES[project.type]?.icon || '📍'}
                    </div>
                    
                    <Popup isOpen={selectedMarker?.id === project.id && showPopup}>
                      <div className="space-y-2">
                        <h4 className="font-semibold">{project.name}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{project.type}</Badge>
                            <Badge 
                              style={{ 
                                backgroundColor: getMarkerColor(project),
                                color: 'white'
                              }}
                            >
                              {getPerformanceLevel(calculateProjectPerformance(project))}
                            </Badge>
                          </div>
                          <p><strong>Region:</strong> {project.region}</p>
                          <p><strong>Investment:</strong> ${(project.investment_amount || 0).toLocaleString()}</p>
                          <p><strong>Performance:</strong> {calculateProjectPerformance(project).toFixed(1)}%</p>
                          <p><strong>Status:</strong> {project.status}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => onProjectSelect?.(project)}>
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setShowPopup(false)}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border z-[1000]">
                <h4 className="font-semibold text-sm mb-2">Legend</h4>
                <div className="space-y-1">
                  <div className="text-xs"><strong>Performance:</strong></div>
                  {Object.entries(PERFORMANCE_COLORS).map(([level, color]) => (
                    <div key={level} className="flex items-center gap-2 text-xs">
                      <div 
                        style={{ backgroundColor: color }}
                        className="w-3 h-3 rounded-full"
                      />
                      <span className="capitalize">{level}</span>
                    </div>
                  ))}
                  <div className="text-xs mt-2"><strong>Size = Investment Amount</strong></div>
                </div>
              </div>
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Regional Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="investment">Investment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(AFRICAN_REGIONS).map(([region, data]) => {
                  const regionProjects = projects.filter(p => p.region === region);
                  const totalInvestment = regionProjects.reduce((sum, p) => sum + (p.investment_amount || 0), 0);
                  const avgPerformance = regionProjects.length > 0 ?
                    regionProjects.reduce((sum, p) => sum + calculateProjectPerformance(p), 0) / regionProjects.length : 0;
                  
                  return (
                    <Card key={region}>
                      <CardContent className="p-4">
                        <h4 className="font-semibold">{region}</h4>
                        <div className="space-y-2 mt-2 text-sm">
                          <div className="flex justify-between">
                            <span>Projects:</span>
                            <span className="font-medium">{regionProjects.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Investment:</span>
                            <span className="font-medium">${(totalInvestment / 1000000).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Performance:</span>
                            <span className="font-medium">{avgPerformance.toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="performance">
              <div className="text-center py-8 text-muted-foreground">
                Performance analytics charts would be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="investment">
              <div className="text-center py-8 text-muted-foreground">
                Investment flow visualization would be displayed here
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}