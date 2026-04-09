import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import Header from './components/Header';
import SideDrawer from './components/SideDrawer';
import LandingPage from './components/LandingPage';
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
  Menu
} from 'lucide-react';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [mapTheme, setMapTheme] = useState('dark');
  const [riskFilter, setRiskFilter] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [layers, setLayers] = useState({});
  const [visibleLayers, setVisibleLayers] = useState(['panchayat', 'admin', 'flood', 'crop', 'roads', 'settlement']);
  const [searchTarget, setSearchTarget] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

  const filteredLayers = React.useMemo(() => {
    return Object.fromEntries(
      Object.entries(layers).filter(([name]) => visibleLayers.includes(name))
    );
  }, [layers, visibleLayers]);

  const stats = React.useMemo(() => [
    { label: "Flooded Area", value: "3250", unit: "ha", icon: Waves, color: "#38bdf8" },
    { label: "Crops Affected", value: "1800", unit: "ha", icon: Sprout, color: "#22c55e" },
    { label: "Roads Impacted", value: "12", unit: "", icon: MapPin, color: "#f59e0b" },
    { label: "Villages Affected", value: "8", unit: "", icon: Home, color: "#ef4444" }
  ], []);

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

  if (!hasStarted) {
    return <LandingPage onStart={() => setHasStarted(true)} />;
  }

  return (
    <div className="app-container h-[100dvh] overflow-hidden flex flex-col bg-[#070c14]">
      <Header onOpenMenu={() => setIsDrawerOpen(true)} />

      <div className="main-content-wrapper flex-1 overflow-hidden relative">
        <div className="dashboard-container">
          <section className="grid grid-cols-4 gap-2 md:gap-3 flex-shrink-0">
            {stats.map((stat, i) => (
              <div key={i} className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/5 p-2 md:p-4 rounded-lg md:rounded-xl flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 hover:border-[#38bdf8]/30 transition-all group">
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
            <div className={`absolute inset-0 bg-[#0b1219] border border-white/5 rounded-2xl overflow-hidden shadow-2xl ${mapTheme}-theme`}>
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
              </div>

              <MapView
                theme={mapTheme}
                layers={filteredLayers}
                isInitialLoad={isInitialLoad}
                riskFilter={riskFilter}
                searchTarget={searchTarget}
                selectedFeature={selectedFeature}
                onSelect={handleSelect}
                onSearchComplete={clearSearchTarget}
              />

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
                    <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Road Infrastructure</span>
                  </div>
                  <div className="legend-item flex items-center">
                    <div className="legend-color rounded bg-[#0ea5e9] shadow-[0_0_10px_rgba(14,165,233,0.4)]"></div>
                    <span className="text-[7px] md:text-[11px] font-black uppercase tracking-widest text-neutral-400">Settlement Areas</span>
                  </div>
                </div>
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
            </div>
          </main>

          <section className="grid grid-cols-3 gap-2 md:gap-4 flex-shrink-0">
            <div className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/5 p-2 md:p-6 rounded-lg md:rounded-2xl flex flex-col gap-2 md:gap-6 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 md:gap-3">
                <BarChart3 size={12} className="text-[#38bdf8] md:w-5 md:h-5" />
                <span className="text-[6px] md:text-xs font-black uppercase tracking-widest text-neutral-400 truncate">AGRICULTURAL</span>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 py-1 md:py-4">
                <div className="flex items-end gap-1 md:gap-3 h-[40px] md:h-[80px]">
                  {[40, 90, 60, 45, 75].map((h, i) => (
                    <div key={i} className="w-2 md:w-5 rounded-t-sm md:rounded-t-lg transition-all duration-500" style={{ height: `${h}%`, background: i === 1 ? '#22c55e' : (i === 4 ? '#ef4444' : '#22c55e40') }}></div>
                  ))}
                </div>
                <span className="text-[5px] md:text-[10px] font-bold text-neutral-600 mt-2 md:mt-6 tracking-widest uppercase truncate w-full text-center">Loss: $1.5M</span>
              </div>
            </div>

            <div className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/5 p-2 md:p-6 rounded-lg md:rounded-2xl flex flex-col gap-2 md:gap-6 min-w-0 overflow-hidden">
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
                  <span className="font-bold text-neutral-400 truncate w-full text-center md:text-left">4 Roads</span>
                  <span className="px-1 py-0 shadow-sm rounded-sm bg-orange-500/10 text-orange-500 text-[5px] md:text-[8px] font-black uppercase">BLOCKED</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#0b1219]/60 backdrop-blur-sm border border-white/5 p-2 md:p-6 rounded-lg md:rounded-2xl flex flex-col gap-2 md:gap-6 min-w-0 overflow-hidden">
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
        </div>

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