import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from './components/MapView';
import Header from './components/Header';
import SideDrawer from './components/SideDrawer';
import AnalyticsOverlay from './components/AnalyticsOverlay';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import AiAssistant from './components/AiAssistant';
import { io } from "socket.io-client";
import localforage from 'localforage';
import {
  Waves,
  Sprout,
  MapPin,
  Home,
  Activity,
  TrafficCone,
  TrendingUp,
  BarChart3,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Calendar,
  BarChart2,
  Clock,
  X
} from 'lucide-react';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [mapTheme, setMapTheme] = useState('dark');
  const [riskFilter, setRiskFilter] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [layers, setLayers] = useState({});
  const [visibleLayers, setVisibleLayers] = useState(['panchayat', 'admin', 'flood', 'crop', 'roads', 'settlement']);
  const [searchTarget, setSearchTarget] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [showSlider, setShowSlider] = useState(true);

  useEffect(() => {
    setSliderIndex(currentTimeIndex);
  }, [currentTimeIndex]);

  // Dynamic date extraction from flood data
  const availableDates = React.useMemo(() => {
    if (!layers || !layers.flood || !layers.flood.features) return ["2018-09-01"]; // Fallback or loading state
    const dateSet = new Set();
    layers.flood.features.forEach(f => {
      if (f.properties?.date) dateSet.add(f.properties.date);
    });
    if (dateSet.size === 0) return ["2018-09-01"];
    return Array.from(dateSet).sort();
  }, [layers]);

  const activeDate = availableDates[currentTimeIndex] || availableDates[0];

  // Formatting for display (e.g., 2018-09-01 -> 01 Sep)
  const formatDateDisplay = (dateStr) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${d} ${months[parseInt(m) - 1]}`;
    } catch (e) { return dateStr; }
  };

  // Calculate flood area dynamic time series for the mini-chart
  const floodTimeSeries = React.useMemo(() => {
    if (!layers || !layers.flood || !layers.flood.features) return [];

    const mapped = availableDates.map(date => {
      const area = layers.flood.features
        .filter(f => f.properties?.date === date)
        .reduce((sum, f) => sum + (f.properties?.area_ha || 0), 0);
      return { date, area };
    });

    const maxArea = Math.max(...mapped.map(m => m.area), 1);

    return mapped.map(m => ({
      ...m,
      heightPercent: Math.max((m.area / maxArea) * 100, 2) // Minimum 2% height for visibility
    }));
  }, [layers, availableDates]);

  /* ---------------- DATA SYNC (Pre-loading) ---------------- */
  useEffect(() => {
    // 1. Load from Persistent Cache First
    localforage.getItem('map-layers-cache').then((cachedData) => {
      if (cachedData && Object.keys(cachedData).length > 0) {
        setLayers(cachedData);
      }
    });

    // 2. Setup Socket
    const socket = io(SOCKET_URL);

    socket.on("geojson-update", (data) => {
      if (data && Object.keys(data).length > 0) {
        setLayers(data);
        localforage.setItem('map-layers-cache', data);
        // Only mark as loaded if the user has actually entered the app
        if (hasStarted) {
          setIsInitialLoad(false);
        }
      }
    });

    // Handle initial state if pre-loaded data is already there when user clicks Start
    if (hasStarted && Object.keys(layers).length > 0) {
      // Small delay for smooth transition cinematic
      const timer = setTimeout(() => setIsInitialLoad(false), 1000);
      return () => clearTimeout(timer);
    }

    // Safety timeout: Always hide loader eventually after user starts
    if (hasStarted) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      socket.disconnect();
    };
  }, [hasStarted]);

  // Final Filtered Layers for Map - Now includes temporal filtering
  const finalLayersForMap = React.useMemo(() => {
    const filteredByVisibility = Object.entries(layers).filter(([name]) => visibleLayers.includes(name));

    return Object.fromEntries(
      filteredByVisibility.map(([name, data]) => {
        // Only apply date filtering to certain layers if they have dates
        if (['flood', 'crop', 'roads', 'settlement'].includes(name)) {
          return [name, {
            ...data,
            features: data.features.filter(f => f.properties?.date === activeDate)
          }];
        }
        return [name, data];
      })
    );
  }, [layers, visibleLayers, activeDate]);

  const stats = React.useMemo(() => {
    // Helper to sum properties for the active date
    const sumField = (layerName, field) => {
      if (!layers[layerName]) return 0;
      return layers[layerName].features
        .filter(f => f.properties?.date === activeDate)
        .reduce((sum, f) => sum + (f.properties[field] || 0), 0);
    };

    const floodArea = sumField('flood', 'area_ha');
    const cropArea = sumField('crop', 'area_ha');
    const roadLength = sumField('roads', 'length_km');
    const villageCount = layers.settlement ? layers.settlement.features.filter(f => f.properties?.date === activeDate).length : 0;

    return [
      { label: "Flooded Area", value: Math.round(floodArea).toLocaleString(), unit: "ha", icon: Waves, color: "#38bdf8" },
      { label: "Crops Affected", value: Math.round(cropArea).toLocaleString(), unit: "ha", icon: Sprout, color: "#22c55e" },
      { label: "Roads Impacted", value: Math.round(roadLength).toLocaleString(), unit: "km", icon: MapPin, color: "#f59e0b" },
      { label: "Villages Affected", value: villageCount.toString(), unit: "", icon: Home, color: "#ef4444" }
    ];
  }, [layers, activeDate]);

  const getRiskColor = (dn) => {
    if (dn >= 4) return "#ef4444";
    if (dn === 3) return "#fb923c";
    if (dn === 2) return "#eab308";
    return "#22c55e";
  };

  const handleSelect = React.useCallback((feature) => {
    setSelectedFeature(feature);
  }, []);

  const handleSearchPanchayat = React.useCallback((panchayatName) => {
    if (!layers.panchayat) return;
    const feature = layers.panchayat.features.find(
      f => f.properties.PANCHAYAT?.toLowerCase() === panchayatName.toLowerCase()
    );
    if (feature) {
      setSearchTarget({ ...feature, _searchId: Date.now() });
      setIsDrawerOpen(false);
    }
  }, [layers.panchayat]);

  const clearSearchTarget = React.useCallback(() => {
    setSearchTarget(null);
  }, []);

  // Step 1: Show landing page first (publicly visible)
  if (!hasStarted) {
    return (
      <LandingPage
        onStart={() => setHasStarted(true)}
        onLogin={() => setHasStarted(true)}
      />
    );
  }

  // Step 2: Show login if not yet authenticated
  if (!isAuthenticated) {
    return (
      <AuthPage
        onAuth={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="app-container h-[100dvh] overflow-hidden flex flex-col bg-[#070c14]">
      <Header
        onOpenMenu={() => setIsDrawerOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onGoHome={() => setHasStarted(false)}
      />

      <div className="main-content-wrapper flex-1 overflow-hidden relative">
        <div className="dashboard-container">
          <section className="grid grid-cols-4 gap-2 md:gap-3 flex-shrink-0">
            {stats.map((stat, i) => (
              <div key={i} className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/10 p-2 md:p-4 rounded-lg md:rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 hover:border-white/30 transition-all group">
                <div className="w-6 h-6 md:w-12 md:h-12 rounded-md md:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ color: stat.color, background: `${stat.color}10` }}>
                  <stat.icon size={14} className="md:w-6 md:h-6" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-center md:items-start min-w-0 text-center md:text-left">
                  <span className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.05em] md:tracking-[0.2em] text-neutral-500 mb-0.5 md:mb-1 truncate w-full">{stat.label.split(' ')[0]}</span>
                  <div className="flex items-baseline gap-0.5 md:gap-1">
                    <span className="text-[10px] md:text-2xl font-black text-white">{stat.value}</span>
                    <span className="text-[6px] md:text-xs font-bold text-neutral-500">{stat.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <main className="relative flex-1 min-h-[300px] md:min-h-[400px]">
            <div className={`absolute inset-0 bg-[#0b1219] border border-white/10 rounded-2xl overflow-hidden shadow-2xl ${mapTheme}-theme`}>
              <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000] bg-[#0b1219]/80 backdrop-blur-md border border-white/10 p-1 rounded-lg md:rounded-xl flex gap-1 shadow-2xl">
                <button
                  className={`px-2 py-1 md:px-4 md:py-1.5 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mapTheme === 'dark' ? 'bg-[#38bdf8] text-white shadow-[0_0_15px_rgba(56,189,248,0.3)]' : 'text-neutral-500 hover:text-white'}`}
                  onClick={() => setMapTheme('dark')}
                >
                  Dark
                </button>
                <button
                  className={`px-2 py-1 md:px-4 md:py-1.5 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mapTheme === 'light' ? 'bg-[#38bdf8] text-white shadow-[0_0_15px_rgba(56,189,248,0.3)]' : 'text-neutral-500 hover:text-white'}`}
                  onClick={() => setMapTheme('light')}
                >
                  White
                </button>
                <div className="w-px h-4 bg-white/10 mx-1 md:mx-2 my-auto" />
                <button
                  className={`p-1 md:p-1.5 rounded-md transition-all ${showLegend ? 'text-[#38bdf8] bg-[#38bdf8]/10' : 'text-neutral-500 hover:text-white'}`}
                  onClick={() => setShowLegend(!showLegend)}
                  title={showLegend ? "Hide Legend" : "Show Legend"}
                >
                  {showLegend ? <Eye size={14} className="md:w-5 md:h-5" /> : <EyeOff size={14} className="md:w-5 md:h-5" />}
                </button>
                <div className="w-px h-4 bg-white/10 mx-1 md:mx-1 my-auto" />
                <button
                  className={`p-1 md:p-1.5 rounded-md transition-all ${showBottomPanel ? 'text-[#38bdf8] bg-[#38bdf8]/10' : 'text-neutral-500 hover:text-white'}`}
                  onClick={() => setShowBottomPanel(!showBottomPanel)}
                  title={showBottomPanel ? "Minimize Dashboard" : "Maximize Map"}
                >
                  {showBottomPanel ? <ChevronDown size={14} className="md:w-5 md:h-5" /> : <ChevronUp size={14} className="md:w-5 md:h-5" />}
                </button>
              </div>

              <MapView
                theme={mapTheme}
                layers={finalLayersForMap}
                isInitialLoad={isInitialLoad}
                riskFilter={riskFilter}
                searchTarget={searchTarget}
                selectedFeature={selectedFeature}
                onSelect={handleSelect}
                onSearchComplete={clearSearchTarget}
              />

              {showLegend && (
                <div className="map-legend absolute z-[1000] pointer-events-none">
                  <div className="flex flex-col">
                    <div className="legend-item flex items-center">
                      <div className="legend-color rounded border-2 border-[#38bdf8]"></div>
                      <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Land Boundaries</span>
                    </div>
                    <div className="legend-item flex items-center">
                      <div className="legend-color rounded border-2 border-[#a855f7]/50 bg-[#a855f7]/10"></div>
                      <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Admin Boundaries</span>
                    </div>
                    <div className="legend-item flex items-center">
                      <div className="legend-color rounded bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.4)]"></div>
                      <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Flood Inundation</span>
                    </div>
                    <div className="legend-item flex items-center">
                      <div className="legend-color rounded bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                      <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Agricultural Zones</span>
                    </div>
                    <div className="legend-item flex items-center">
                      <div className="legend-color rounded bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.4)]"></div>
                      <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Inundated Roads</span>
                    </div>
                    <div className="legend-item flex items-center">
                      <div className="legend-color rounded bg-[#0ea5e9] shadow-[0_0_10px_rgba(14,165,233,0.4)]"></div>
                      <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Settlement Areas</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Premium Responsive Date Timeline Slider with Optimized Animation */}
              <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center pointer-events-none w-max max-w-[calc(100%-116px)] md:max-w-[400px]">
                <AnimatePresence mode="wait">
                  {showSlider ? (
                    <motion.div
                      key="slider"
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: "circOut" }}
                      style={{ willChange: "transform, opacity" }}
                      className="bg-black/20 backdrop-blur-[14px] border border-white/10 p-1.5 md:p-2.5 px-3 md:px-5 rounded-[1rem] shadow-[0_15px_50px_rgba(0,0,0,0.7)] flex items-center gap-2 md:gap-4 w-full pointer-events-auto"
                    >
                      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0 border-r border-white/10 pr-2 md:pr-4 h-4 md:h-5">
                        <Calendar size={11} className="text-[#38bdf8] md:w-3.5 md:h-3.5" />
                        <span className="text-[10px] md:text-[13px] font-black text-white whitespace-nowrap drop-shadow-md">{formatDateDisplay(availableDates[sliderIndex] || availableDates[0])}</span>
                      </div>

                      <div className="flex-1 relative h-6 md:h-8 flex items-center min-w-[120px] md:min-w-[180px]">
                        {/* Background Ticks */}
                        <div className="absolute inset-0 flex justify-between items-center px-[2px] pointer-events-none">
                          {availableDates.map((_, i) => (
                            <div
                              key={i}
                              className={`timeline-tick ${i <= sliderIndex ? 'active' : ''}`}
                              style={{ left: `${(i / Math.max(1, availableDates.length - 1)) * 100}%` }}
                            />
                          ))}
                        </div>

                        <input
                          type="range"
                          min="0"
                          max={availableDates.length - 1}
                          value={sliderIndex || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setSliderIndex(val);
                            React.startTransition(() => {
                              setCurrentTimeIndex(val);
                            });
                          }}
                          className="timeline-slider relative z-10"
                        />

                        {/* Active Track Highlight */}
                        <div className="absolute left-0 right-0 h-[1px] bg-white/5 pointer-events-none">
                          <div
                            className="h-full bg-gradient-to-r from-transparent to-[#38bdf8] shadow-[0_0_10px_#38bdf8]"
                            style={{ width: `${((sliderIndex || 0) / Math.max(1, availableDates.length - 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowSlider(false)}
                        className="ml-1 md:ml-2 p-1 text-neutral-500 hover:text-white transition-colors"
                      >
                        <X size={12} className="md:w-3.5 md:h-3.5" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="toggle"
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      transition={{ duration: 0.15, ease: "circOut" }}
                      style={{ willChange: "transform, opacity" }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSlider(true)}
                      className="bg-black/20 backdrop-blur-[14px] border border-white/10 p-2 md:p-2.5 px-4 md:px-5 rounded-[1rem] shadow-2xl text-[#38bdf8] transition-all group pointer-events-auto flex items-center gap-2.5"
                      title="Open Timeline"
                    >
                      <Clock size={14} className="md:w-3.5 md:h-3.5 text-[#38bdf8]" />
                      <div className="flex flex-col items-start -space-y-1">
                        <span className="text-[7px] font-black uppercase tracking-tighter text-[#38bdf8]">Active Date</span>
                        <span className="text-[11px] md:text-[13px] font-black text-white whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{formatDateDisplay(availableDates[currentTimeIndex])}</span>
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {selectedFeature && (
                <div className="map-info-overlay">
                  <div className="overlay-header">
                    <div className="title-group">
                      <span className="source-tag">
                        {selectedFeature.properties.PANCHAYAT ? 'ADMINISTRATIVE AREA' : (selectedFeature._layerName || 'ANALYSIS AREA').toUpperCase()}
                      </span>
                      <h3>{selectedFeature.properties.PANCHAYAT || `Feature Details`}</h3>
                    </div>
                    <button className="close-overlay" onClick={() => setSelectedFeature(null)}>×</button>
                  </div>
                  <div className="overlay-content">
                    {selectedFeature.properties.PANCHAYAT ? (
                      <div className="info-grid">
                        <div className="info-item"><label>District</label><span>{selectedFeature.properties.DISTRICT}</span></div>
                        <div className="info-item"><label>Block</label><span>{selectedFeature.properties.BLOCK}</span></div>
                      </div>
                    ) : (
                      <div className="info-grid">
                        <div className="info-item"><label>Layer</label><span>{selectedFeature._layerName}</span></div>
                        {selectedFeature.properties.DN && <div className="info-item"><label>DN</label><span style={{ color: getRiskColor(selectedFeature.properties.DN) }}>{selectedFeature.properties.DN}</span></div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <AiAssistant />
            </div>
          </main>

          {showBottomPanel && (
            <section className="grid grid-cols-3 gap-2 md:gap-4 flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/10 p-2 md:p-6 rounded-lg md:rounded-2xl flex flex-col gap-2 md:gap-6 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5 md:gap-3">
                  <Waves size={12} className="text-[#ef4444] md:w-5 md:h-5" />
                  <span className="text-[6px] md:text-xs font-black uppercase tracking-widest text-neutral-400 truncate">FLOOD IMPACT</span>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 py-3 md:py-6 w-full">
                  <div className="flex items-end justify-center gap-2 md:gap-8 lg:gap-12 h-[45px] md:h-[60px] xl:h-[80px] w-full px-1 lg:px-4 relative mb-2 text-center">
                    {floodTimeSeries.map((point, i) => {
                      const isActive = point.date === activeDate;
                      return (
                        <div key={i} className="h-full flex flex-shrink-0 items-end justify-center relative group w-[14px] md:w-[24px] lg:w-[36px] xl:w-[48px]">
                          {/* Value on Top */}
                          <span
                            className={`absolute text-[6px] md:text-[8px] font-black tracking-wider transition-all duration-300 w-[150%] text-center ${isActive ? 'text-white' : 'text-neutral-600 group-hover:text-neutral-400'}`}
                            style={{ bottom: `calc(${point.heightPercent}% + 4px)` }}
                          >
                            {Math.round(point.area).toLocaleString()}
                          </span>

                          <div
                            className="w-full rounded-t-sm md:rounded-t-md transition-all duration-500"
                            style={{
                              height: `${point.heightPercent}%`,
                              background: isActive ? '#ef4444' : '#38bdf8',
                              boxShadow: isActive ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
                            }}
                          ></div>

                          {/* Date on Bottom */}
                          <span
                            className={`absolute -bottom-4 md:-bottom-5 text-[5px] md:text-[7px] font-bold uppercase tracking-wider transition-all duration-300 w-[150%] text-center whitespace-nowrap ${isActive ? 'text-[#ef4444] drop-shadow-md' : 'text-neutral-600 group-hover:text-neutral-400'}`}
                          >
                            {formatDateDisplay(point.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[5px] md:text-[10px] font-bold text-neutral-600 mt-4 md:mt-6 tracking-widest uppercase truncate w-full text-center">Peak: {Math.round(Math.max(...floodTimeSeries.map(d => d.area), 0)).toLocaleString()} ha</span>
                </div>
              </div>

              <div className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/10 p-2 md:p-6 rounded-lg md:rounded-2xl flex flex-col gap-2 md:gap-6 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5 md:gap-3">
                  <TrafficCone size={12} className="text-orange-400 md:w-5 md:h-5" />
                  <span className="text-[6px] md:text-xs font-black uppercase tracking-widest text-neutral-400 truncate">INFRASTRUCTURE</span>
                </div>
                <ul className="flex flex-col gap-1 md:gap-4">
                  <li className="flex flex-col md:flex-row justify-between items-center py-0.5 border-b border-white/5 text-[6px] md:text-xs">
                    <span className="font-bold text-neutral-400 truncate w-full text-center md:text-left">HW 24</span>
                    <span className="px-1 py-0 shadow-sm rounded-sm bg-red-500/10 text-red-500 text-[5px] md:text-[8px] font-black uppercase">CLOSED</span>
                  </li>
                  <li className="flex flex-col md:flex-row justify-between items-center py-0.5 border-b border-white/5 text-[6px] md:text-xs">
                    <span className="font-bold text-neutral-400 truncate w-full text-center md:text-left">{stats[2].value || 0} km</span>
                    <span className="px-1 py-0 shadow-sm rounded-sm bg-orange-500/10 text-orange-500 text-[5px] md:text-[8px] font-black uppercase">BLOCKED</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/10 p-2 md:p-6 rounded-lg md:rounded-2xl flex flex-col gap-2 md:gap-6 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5 md:gap-3">
                  <TrendingUp size={12} className="text-[#38bdf8] md:w-5 md:h-5" />
                  <span className="text-[6px] md:text-xs font-black uppercase tracking-widest text-neutral-400 truncate">INTENSITY</span>
                </div>
                <div className="flex-1 flex items-center justify-center relative min-h-[40px] md:min-h-0">
                  <Activity size={20} className="md:w-10 md:h-10 text-[#38bdf8]/20 animate-pulse" />
                  <span className="absolute bottom-0 text-[5px] md:text-[8px] font-bold text-neutral-600 tracking-widest uppercase">Live</span>
                </div>
              </div>
            </section>
          )}
        </div>

        <AnalyticsOverlay
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          stats={stats}
          layers={layers}
          availableDates={availableDates}
          currentTimeIndex={currentTimeIndex}
          setCurrentTimeIndex={setCurrentTimeIndex}
          setSliderIndex={setSliderIndex}
          floodTimeSeries={floodTimeSeries}
        />

        <SideDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          layers={layers}
          onSearch={handleSearchPanchayat}
          riskFilter={riskFilter}
          setRiskFilter={setRiskFilter}
          visibleLayers={visibleLayers}
          setVisibleLayers={setVisibleLayers}
        />
      </div>
    </div>
  );
}

export default App;