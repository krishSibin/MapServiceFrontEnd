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
  const [visibleLayers, setVisibleLayers] = useState(['taluk', 'village', 'flood']);
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
    const floodLayer = layers?.flood;
    if (!floodLayer || !floodLayer.features || floodLayer.features.length === 0) {
      return ["2018-09-01"];
    }

    const dateSet = new Set();
    const features = floodLayer.features;
    for (let i = 0; i < features.length; i++) {
      const d = features[i].properties?.date;
      if (d) dateSet.add(d);
    }

    if (dateSet.size === 0) return ["2018-09-01"];
    return Array.from(dateSet).sort();
  }, [layers?.flood]);

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
    // START PRE-FETCHING: As soon as user is authenticated (while they are on the landing page)
    if (!isAuthenticated) return;

    let isLive = false;

    const processIncomingData = (data) => {
      if (!data || Object.keys(data).length === 0) return;

      console.time("🗺️ Data Processing");
      const freshData = { ...layers }; // Start with existing to avoid blank out

      // Process in small batches or direct assignment to prevent blocking
      Object.entries(data).forEach(([layerName, layerData]) => {
        // Skip re-processing if it hasn't changed (simple reference check for speed)
        if (layers[layerName] === layerData) return;

        freshData[layerName] = {
          ...layerData,
          features: (layerData.features || []).map((f, idx) => {
            // Only add _uid if it doesn't exist to save processing
            if (f.properties?._uid) return f;
            return {
              ...f,
              properties: { ...f.properties, _uid: `${layerName}-${idx}` }
            };
          })
        };
      });

      setLayers(freshData);
      setIsInitialLoad(false);
      console.timeEnd("🗺️ Data Processing");

      // Save to cache in background
      localforage.setItem('map-layers-cache', freshData).catch(err => console.error("Cache Error:", err));

      // Auto-discover NEW non-standard layers
      const incomingLayerKeys = Object.keys(freshData);
      setVisibleLayers(prev => {
        const predefinedLayers = ['panchayat', 'taluk', 'flood', 'crop', 'roads', 'village', 'settlement'];
        const newKeys = incomingLayerKeys.filter(k =>
          k.toLowerCase() !== 'boundary' &&
          !predefinedLayers.includes(k.toLowerCase()) &&
          !prev.includes(k)
        );
        return newKeys.length > 0 ? [...prev, ...newKeys] : prev;
      });
    };

    // 1. Load from Persistent Cache First (IMMEDIATE)
    localforage.getItem('map-layers-cache').then((cachedData) => {
      if (!isLive && cachedData && Object.keys(cachedData).length > 0) {
        console.log("💾 Cache: Restoring spatial data...");
        processIncomingData(cachedData);
      }
    });

    // 2. Fetch Fresh Data (Parallel / Background)
    const fetchData = async () => {
      try {
        const res = await fetch(`${SOCKET_URL}/api/geojson`);
        const data = await res.json();
        if (!isLive) {
          console.log("🚀 HTTP: Fresh sync complete");
          processIncomingData(data);
        }
      } catch (err) {
        console.error("❌ Fetch Error:", err);
      }
    };

    fetchData();

    // 3. Setup Socket
    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 20,
      reconnectionDelay: 3000
    });

    socket.on("geojson-update", (data) => {
      console.log("📡 SOCKET: Update received");
      isLive = true;
      processIncomingData(data);
    });

    return () => {
      isLive = true;
      socket.disconnect();
    };
  }, [isAuthenticated, SOCKET_URL]);

  // Final Filtered Layers for Map - Now includes temporal filtering
  const finalLayersForMap = React.useMemo(() => {
    const filteredByVisibility = Object.entries(layers).filter(([name]) =>
      name.toLowerCase() !== 'boundary' &&
      visibleLayers.includes(name)
    );

    return Object.fromEntries(
      filteredByVisibility.map(([name, data]) => {
        // Only apply date filtering to certain layers if they have dates
        if (['flood', 'crop', 'roads', 'settlement', 'village'].includes(name)) {
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
    const villageCount = layers.village ? layers.village.features.filter(f => f.properties?.date === activeDate).length : 0;

    return [
      { label: "Flooded Area", value: Math.round(floodArea).toLocaleString(), unit: "ha", icon: Waves, color: "#00cfbf" },
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



  const handleSpatialSearch = React.useCallback((name) => {
    // Search across all administrative/village layers
    const targetLayers = [
      { data: layers.village, field: 'VILLAGE' },
      { data: layers.panchayat, field: 'PANCHAYAT' }
    ].filter(l => l.data && l.data.features);

    let foundFeature = null;
    for (const layer of targetLayers) {
      foundFeature = layer.data.features.find(
        f => (
          f.properties[layer.field] ||
          f.properties.PANCHAYATH ||
          f.properties.NAME ||
          f.properties.name
        )?.toLowerCase() === name.toLowerCase()
      );
      if (foundFeature) break;
    }

    if (foundFeature) {
      setSearchTarget({ ...foundFeature, _searchId: Date.now() });
      setIsDrawerOpen(false);
    }
  }, [layers.panchayat, layers.taluk, layers.village]);

  const clearSearchTarget = React.useCallback(() => {
    setSearchTarget(null);
  }, []);

  // Step 1: Show login first (Protected entry)
  if (!isAuthenticated) {
    return (
      <AuthPage
        onAuth={() => setIsAuthenticated(true)}
      />
    );
  }

  // Step 2: Show landing page after successful login
  if (!hasStarted) {
    return (
      <LandingPage
        onStart={() => setHasStarted(true)}
        onLogin={() => setHasStarted(true)} // Can be reused for Launch
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
          <section className="grid grid-cols-4 gap-2 md:gap-3 flex-shrink-0 h-fit">
            {stats.map((stat, i) => (
              <div key={i} className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/10 p-2 md:p-3 rounded-lg md:rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 hover:border-white/30 transition-all group">
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-md md:rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" style={{ color: stat.color, background: `${stat.color}10` }}>
                  <stat.icon size={14} className="md:w-5 md:h-5" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-center md:items-start min-w-0 text-center md:text-left">
                  <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.05em] md:tracking-[0.15em] text-neutral-500 mb-0.5 md:mb-0.5 truncate w-full">{stat.label.split(' ')[0]}</span>
                  <div className="flex items-baseline gap-0.5 md:gap-1">
                    <span className="text-[10px] md:text-xl font-black text-white">{stat.value}</span>
                    <span className="text-[6px] md:text-[10px] font-bold text-neutral-500">{stat.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <main className="relative flex-1 min-h-[250px] md:min-h-0">
            <div className={`absolute inset-0 bg-[#0b1219] border border-white/10 rounded-2xl overflow-hidden shadow-2xl ${mapTheme}-theme`}>
              <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000] bg-[#0b1219]/80 backdrop-blur-md border border-white/10 p-1 rounded-lg md:rounded-xl flex gap-1 shadow-2xl">
                <button
                  className={`px-2 py-1 md:px-4 md:py-1.5 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mapTheme === 'dark' ? 'bg-[#00cfbf] text-white shadow-[0_0_15px_rgba(0,207,191,0.3)]' : 'text-neutral-500 hover:text-white'}`}
                  onClick={() => setMapTheme('dark')}
                >
                  Dark
                </button>
                <button
                  className={`px-2 py-1 md:px-4 md:py-1.5 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mapTheme === 'light' ? 'bg-[#00cfbf] text-white shadow-[0_0_15px_rgba(0,207,191,0.3)]' : 'text-neutral-500 hover:text-white'}`}
                  onClick={() => setMapTheme('light')}
                >
                  White
                </button>
                <div className="w-px h-4 bg-white/10 mx-1 md:mx-2 my-auto" />
                <button
                  className={`p-1 md:p-1.5 rounded-md transition-all ${showLegend ? 'text-[#00cfbf] bg-[#00cfbf]/10' : 'text-neutral-500 hover:text-white'}`}
                  onClick={() => setShowLegend(!showLegend)}
                  title={showLegend ? "Hide Legend" : "Show Legend"}
                >
                  {showLegend ? <Eye size={14} className="md:w-5 md:h-5" /> : <EyeOff size={14} className="md:w-5 md:h-5" />}
                </button>
                <div className="w-px h-4 bg-white/10 mx-1 md:mx-1 my-auto" />
                <button
                  className={`p-1 md:p-1.5 rounded-md transition-all ${showBottomPanel ? 'text-[#00cfbf] bg-[#00cfbf]/10' : 'text-neutral-500 hover:text-white'}`}
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
                      <div className="legend-color rounded border-2 border-[#00cfbf] bg-[#00cfbf]/10"></div>
                      <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Village Layer</span>
                    </div>
                    <div className="legend-item flex items-center">
                      <div className="legend-color rounded border-2 border-[#e11d48] border-dashed"></div>
                      <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Panchayath Boundary</span>
                    </div>
                    <div className="legend-item flex items-center">
                      <div className="legend-color rounded border-2 border-[#ffffff]"></div>
                      <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Taluk Boundary</span>
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
                      className="bg-[#0b1219]/90 backdrop-blur-md border border-white/10 p-1.5 md:p-2.5 px-3 md:px-5 rounded-[1rem] shadow-[0_15px_50px_rgba(0,0,0,0.7)] flex items-center gap-2 md:gap-4 w-full pointer-events-auto"
                    >
                      <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0 border-r border-white/10 pr-2 md:pr-4 h-4 md:h-5">
                        <Calendar size={11} className="text-[#00cfbf] md:w-3.5 md:h-3.5" />
                        <span className="text-[10px] md:text-[13px] font-black text-white whitespace-nowrap drop-shadow-md">{formatDateDisplay(availableDates[sliderIndex] || availableDates[0])}</span>
                      </div>

                      <div className="flex-1 relative h-6 md:h-8 flex items-center min-w-[120px] md:min-w-[180px]">
                        {/* Background Ticks */}
                        <div className="absolute inset-0 flex justify-between items-center px-[2px] pointer-events-none z-[5]">
                          {availableDates.map((_, i) => (
                            <div
                              key={i}
                              className={`timeline-tick ${i === sliderIndex ? 'active' : 'highlighted'}`}
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

                        <div className="absolute left-0 right-0 h-[2px] md:h-[3px] bg-[#00cfbf]/30 rounded-full pointer-events-none z-0 shadow-[0_0_8px_#00cfbf22]">
                          {/* Highlight Glow Line */}
                          <div className="absolute inset-0 bg-[#00cfbf]/50 blur-[1px]"></div>
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
                      className="bg-[#0b1219]/90 backdrop-blur-md border border-white/10 p-2 md:p-2.5 px-4 md:px-5 rounded-[1rem] shadow-2xl text-[#38bdf8] transition-all group pointer-events-auto flex items-center gap-2.5"
                      title="Open Timeline"
                    >
                      <Clock size={14} className="md:w-3.5 md:h-3.5 text-[#00cfbf]" />
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
                  {/* Mobile Sheet Handle */}
                  <div className="md:hidden w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 -mb-2"></div>

                  <div className="overlay-header py-4 px-6">
                    <div className="title-group">
                      <span className="source-tag text-[#00cfbf]">
                        {selectedFeature._layerName === 'panchayat' ? 'PANCHAYAT NAME' :
                          selectedFeature._layerName === 'taluk' ? 'TALUK NAME' :
                            'VILLAGE NAME'}
                      </span>
                      <div className="flex flex-col gap-1 mt-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                          {(() => {
                            const p = selectedFeature.properties;

                            // Try exact matches first
                            let engName = p.name || p.NAME || p.NAME_EN || p.PANCHAYAT || p.PANCHAYATH || p.VILL_NAME || p['VILL NAME'] || p.VILLAGE || p.VILLAGE_EN || p.TALUK || p.TALUK_NAM || p.TALUK_NA || p.V_NAME || p.V_name || p.VNAME;

                            // Try case-insensitive fuzzy match if exact match fails
                            if (!engName) {
                              const nameKeys = Object.keys(p).filter(k => {
                                const lower = k.toLowerCase();
                                return (lower.includes('name') || lower.includes('vill') || lower.includes('panchayat') || lower.includes('taluk')) &&
                                  !['id', 'code', 'uid', 'source', 'attr', 'shape', 'area', 'length'].some(bad => lower.includes(bad));
                              });
                              if (nameKeys.length > 0) {
                                // Prefer a string value that isn't just a number
                                const stringKey = nameKeys.find(k => typeof p[k] === 'string' && isNaN(Number(p[k])) && p[k].trim() !== '');
                                if (stringKey) engName = p[stringKey];
                              }
                            }

                            // Try the heuristic fallback
                            if (!engName) {
                              const fallback = Object.entries(p).find(([k, v]) =>
                                typeof v === 'string' && isNaN(Number(v)) && v.length > 0 && !/[\u0D00-\u0D7F]/.test(v) &&
                                !['UID', 'SOURCE', 'ID', 'ATTR', 'CODE'].some(s => k.toUpperCase().includes(s))
                              );
                              if (fallback) engName = fallback[1];
                            }

                            const collectionName = layers[selectedFeature._layerName]?.name;

                            // If we still get 'KERALA' but have a better collection name, use that instead
                            if ((!engName || engName === 'KERALA') && collectionName) {
                              engName = collectionName;
                            }

                            if (!engName) engName = selectedFeature.name || "Selected Region";

                            return typeof engName === 'string' ? engName.replace(/_/g, ' ') : String(engName);
                          })()}
                        </h3>
                        <span className="text-sm font-bold text-[#00cfbf]/80 block mt-0.5">
                          {(() => {
                            const p = selectedFeature.properties;
                            const malEntry = Object.entries(p).find(([k, v]) =>
                              typeof v === 'string' && /[\u0D00-\u0D7F]/.test(v)
                            );
                            return malEntry ? malEntry[1] : (p.MAL_NAME || p.NAME_MAL || p.VILL_MAL || p.VILLAGE_MA || "");
                          })()}
                        </span>
                      </div>
                      <div className="h-0.5 w-12 bg-[#00cfbf] mt-2 rounded-full shadow-[0_0_10px_#00cfbf]"></div>
                    </div>
                    <button className="close-overlay" onClick={() => setSelectedFeature(null)}>×</button>
                  </div>
                </div>
              )}
              <AiAssistant />
            </div>
          </main>

          {showBottomPanel && (
            <section className="grid grid-cols-3 gap-2 md:gap-4 flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/10 p-2 md:p-4 rounded-lg md:rounded-2xl flex flex-col gap-2 md:gap-3 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5 md:gap-3">
                  <Waves size={12} className="text-[#ef4444] md:w-5 md:h-5" />
                  <span className="text-[6px] md:text-xs font-black uppercase tracking-widest text-neutral-400 truncate">FLOOD IMPACT</span>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 py-1 md:py-2 w-full">
                  <div className="flex items-end justify-center gap-1 md:gap-2 lg:gap-3 h-[50px] md:h-[75px] xl:h-[100px] w-full px-1 lg:px-4 relative mb-2 text-center">
                    {floodTimeSeries.map((point, i) => {
                      const isActive = point.date === activeDate;
                      return (
                        <div key={i} className="h-full flex flex-shrink-0 items-end justify-center relative group w-[14px] md:w-[24px] lg:w-[36px] xl:w-[48px]">
                          {/* Value on Top */}
                          <span
                            className={`absolute left-1/2 -translate-x-1/2 text-[4px] md:text-[8px] font-black tracking-wider transition-all duration-300 w-max text-center ${isActive ? 'text-white z-10 scale-110' : 'text-neutral-600 group-hover:text-neutral-400 z-0'}`}
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
                            className={`absolute left-1/2 -translate-x-1/2 -bottom-4 md:-bottom-5 text-[4px] md:text-[7px] font-bold uppercase tracking-wider transition-all duration-300 w-max text-center whitespace-nowrap ${isActive ? 'text-[#ef4444] drop-shadow-md z-10 scale-110' : 'text-neutral-600 group-hover:text-neutral-400 z-0'}`}
                          >
                            {formatDateDisplay(point.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/10 p-2 md:p-4 rounded-lg md:rounded-2xl flex flex-col gap-2 md:gap-3 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5 md:gap-3">
                  <TrafficCone size={12} className="text-orange-400 md:w-5 md:h-5" />
                  <span className="text-[6px] md:text-xs font-black uppercase tracking-widest text-neutral-400 truncate">INFRASTRUCTURE</span>
                </div>
                <ul className="flex flex-col gap-1 md:gap-2">
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

              <div className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/10 p-1.5 md:p-4 rounded-lg md:rounded-2xl flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col">
                    <span className="text-[4px] md:text-[8px] font-black uppercase tracking-widest text-[#38bdf8]/80">CONDITION</span>
                    <span className="text-[6px] md:text-sm font-bold text-white tracking-wide mt-0.5 md:mt-1">Basin Warning</span>
                  </div>
                  <div className="px-1 py-0.5 md:px-2 md:py-1 rounded bg-[#0f766e]/30 border border-[#0f766e] flex items-center gap-0.5 md:gap-1.5">
                    <div className="w-[3px] h-[3px] md:w-1.5 md:h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></div>
                    <span className="text-[4px] md:text-[7px] font-black uppercase tracking-widest text-[#2dd4bf]">LIVE</span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col items-center justify-center w-full mt-1 md:mt-4">
                  <div className="flex items-baseline gap-0.5 md:gap-1">
                    <span className="text-sm md:text-4xl font-bold text-white tracking-tighter">184</span>
                    <span className="text-[5px] md:text-xs font-bold text-neutral-400">mm</span>
                  </div>
                  <span className="text-[3px] md:text-[7px] font-black uppercase tracking-[0.2em] text-neutral-500 mt-0.5 md:mt-1">HOURLY RAINFALL</span>

                  {/* Wave Graphic */}
                  <div className="w-full h-[12px] md:h-[40px] relative my-1 md:my-2 overflow-hidden flex items-center justify-center opacity-80">
                    <svg viewBox="0 0 200 40" className="absolute w-full h-full stroke-[#38bdf8]/60 fill-none" strokeWidth="1">
                      <path d="M0,20 C20,10 30,30 50,20 C70,10 80,30 100,20 C120,10 130,30 150,20 C170,10 180,30 200,20" />
                      <path d="M0,20 C20,15 30,25 50,20 C70,15 80,25 100,20 C120,15 130,25 150,20 C170,15 180,25 200,20" className="stroke-[#2dd4bf]/40" strokeDasharray="2, 2" />
                      <path d="M0,20 C20,25 30,15 50,20 C70,25 80,15 100,20 C120,25 130,15 150,20 C170,25 180,15 200,20" className="stroke-[#38bdf8]/30" strokeDasharray="2, 2" />
                    </svg>
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="w-full grid grid-cols-3 bg-[#0b1219]/80 rounded md:rounded-lg p-1 md:p-2 border border-white/5 mt-auto">
                  <div className="flex flex-col items-center justify-center border-r border-white/10">
                    <span className="text-[3px] md:text-[6px] font-black uppercase tracking-widest text-neutral-500 mb-0.5 md:mb-1">WATER LVL</span>
                    <span className="text-[5px] md:text-[10px] font-bold text-[#38bdf8]">8.4m</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-r border-white/10">
                    <span className="text-[3px] md:text-[6px] font-black uppercase tracking-widest text-neutral-500 mb-0.5 md:mb-1">INFLOW</span>
                    <span className="text-[5px] md:text-[10px] font-bold text-[#38bdf8]">4k c/s</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[3px] md:text-[6px] font-black uppercase tracking-widest text-neutral-500 mb-0.5 md:mb-1">RISK</span>
                    <span className="text-[5px] md:text-[10px] font-bold text-[#ef4444]">SEVERE</span>
                  </div>
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
          onSearch={handleSpatialSearch}
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