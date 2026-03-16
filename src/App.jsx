import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import Header from './components/Header';
import SideDrawer from './components/SideDrawer';
import { io } from "socket.io-client";
import {
  Waves,
  Sprout,
  MapPin,
  Home,
  Activity,
  TrafficCone,
  Zap,
  TrendingUp,
  BarChart3,
  Menu
} from 'lucide-react';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

function App() {
  const [mapTheme, setMapTheme] = useState('dark');
  const [riskFilter, setRiskFilter] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [panchayatData, setPanchayatData] = useState(null);
  const [floodData, setFloodData] = useState(null);
  const [searchTarget, setSearchTarget] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  /* ---------------- SOCKET CONNECTION ---------------- */
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on("geojson-update", (data) => {
      if (data.panchayat) setPanchayatData(data.panchayat);
      if (data.flood) setFloodData(data.flood);
    });
    return () => socket.disconnect();
  }, []);

  const stats = [
    { label: "Flooded Area", value: "3250", unit: "ha", icon: Waves, color: "#38bdf8" },
    { label: "Crops Affected", value: "1800", unit: "ha", icon: Sprout, color: "#10b981" },
    { label: "Roads Impacted", value: "12", unit: "", icon: MapPin, color: "#fb923c" },
    { label: "Villages Affected", value: "8", unit: "", icon: Home, color: "#f43f5e" }
  ];

  /* ---------------- HANDLERS ---------------- */
  const handleSelect = React.useCallback((feature) => {
    setSelectedFeature(feature);
  }, []);

  const handleSearchPanchayat = (panchayatName) => {
    if (!panchayatData) return;
    const feature = panchayatData.features.find(
      f => f.properties.PANCHAYAT?.toLowerCase() === panchayatName.toLowerCase()
    );
    if (feature) {
      // Create a fresh object to force useEffect in MapView to trigger
      setSearchTarget({ ...feature, _searchId: Date.now() });
      setIsDrawerOpen(false); // Close drawer on search
    }
  };

  const clearSearchTarget = React.useCallback(() => {
    setSearchTarget(null);
  }, []);

  const getRiskColor = (dn) => {
    if (dn >= 4) return "#ef4444"
    if (dn === 3) return "#fb923c"
    if (dn === 2) return "#eab308"
    return "#22c55e"
  }

  return (
    <div className="app-container">
      <Header onOpenMenu={() => setIsDrawerOpen(true)} />

      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        panchayatData={panchayatData}
        onSearch={handleSearchPanchayat}
        riskFilter={riskFilter}
        setRiskFilter={setRiskFilter}
      />

      <section className="stats-row">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon-wrapper" style={{ color: stat.color, background: `${stat.color}15` }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <div className="stat-value">
                {stat.value}<span className="stat-unit">{stat.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      <main className="main-dashboard-grid">
        <div className={`map-section ${mapTheme}-theme`}>
          {/* Theme Toggle */}
          <div className="theme-toggle">
            <button
              className={`theme-btn ${mapTheme === 'dark' ? 'active' : ''}`}
              onClick={() => setMapTheme('dark')}
            > Dark </button>
            <button
              className={`theme-btn ${mapTheme === 'light' ? 'active' : ''}`}
              onClick={() => setMapTheme('light')}
            > WHITE </button>
          </div>

          <MapView
            theme={mapTheme}
            riskFilter={riskFilter}
            panchayatData={panchayatData}
            floodData={floodData}
            searchTarget={searchTarget}
            selectedFeature={selectedFeature}
            onSelect={handleSelect}
            onSearchComplete={clearSearchTarget}
          />

          {/* Map Overlay Legend */}
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#38bdf8' }}></div>
              <span>Panchayat Boundaries</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ef4444' }}></div>
              <span>High Risk (Flood)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#fb923c' }}></div>
              <span>Moderate Risk</span>
            </div>
          </div>

          {/* Map Info Overlay (Floating on Desktop) */}
          {selectedFeature && (
            <div className="map-info-overlay desktop-only">
              <div className="overlay-header">
                <div className="title-group">
                  <span className="source-tag">
                    {selectedFeature.properties.PANCHAYAT ? 'ADMINISTRATIVE AREA' : 'FLOOD ANALYSIS'}
                  </span>
                  <h3>{selectedFeature.properties.PANCHAYAT || `Risk Zone (DN: ${selectedFeature.properties.DN})`}</h3>
                </div>
                <button className="close-overlay" onClick={() => setSelectedFeature(null)}>
                  ×
                </button>
              </div>

              <div className="overlay-content">
                {selectedFeature.properties.PANCHAYAT ? (
                  <>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>District</label>
                        <span>{selectedFeature.properties.DISTRICT || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Block</label>
                        <span>{selectedFeature.properties.BLOCK || 'N/A'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Risk Index</label>
                        <span style={{ color: getRiskColor(selectedFeature.properties.DN) }}>{selectedFeature.properties.DN}</span>
                      </div>
                      <div className="info-item">
                        <label>Severity</label>
                        <span>{selectedFeature.properties.DN >= 4 ? 'CRITICAL' : selectedFeature.properties.DN === 3 ? 'HIGH' : 'MODERATE'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Selection Card (Flowing below map) */}
        {selectedFeature && (
          <div className="mobile-selection-card mobile-only">
            <div className="card-header">
              <span className="source-tag">{selectedFeature.properties.PANCHAYAT ? 'PANCHAYAT ANALYSIS' : 'FLOOD RISK'}</span>
              <div className="header-main">
                <h3>{selectedFeature.properties.PANCHAYAT || `Risk Level ${selectedFeature.properties.DN}`}</h3>
                <button className="close-btn" onClick={() => setSelectedFeature(null)}>×</button>
              </div>
            </div>
            <div className="card-body">
              {selectedFeature.properties.PANCHAYAT ? (
                <div className="mobile-info-row">
                  <div className="mobile-info-col">
                    <label>District</label>
                    <p>{selectedFeature.properties.DISTRICT}</p>
                  </div>
                  <div className="mobile-info-col">
                    <label>Block</label>
                    <p>{selectedFeature.properties.BLOCK}</p>
                  </div>
                </div>
              ) : (
                <div className="mobile-info-row">
                  <div className="mobile-info-col">
                    <label>Severity</label>
                    <p style={{ color: getRiskColor(selectedFeature.properties.DN) }}>{selectedFeature.properties.DN >= 4 ? 'CRITICAL' : 'MODERATE'}</p>
                  </div>
                  <div className="mobile-info-col">
                    <label>Action</label>
                    <p>High Alert</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <section className="bottom-widgets">
        <div className="widget-card">
          <div className="panel-header">
            <BarChart3 size={18} className="text-blue-400" />
            <span className="text-sm font-bold tracking-wider">AGRICULTURAL IMPACT</span>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {[40, 60, 35, 25].map((h, i) => (
                <div key={i} className="chart-bar" style={{ height: `${h}px`, background: i === 0 ? '#10b981' : i === 1 ? '#eab308' : i === 2 ? '#fb923c' : '#f43f5e' }}></div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center">Loss Estimate: $1.5M</p>
        </div>

        <div className="widget-card">
          <div className="panel-header">
            <TrafficCone size={18} className="text-orange-400" />
            <span className="text-sm font-bold tracking-wider">INFRASTRUCTURE STATUS</span>
          </div>
          <ul className="infra-list">
            <li className="infra-item"><span>Highway 24</span><span className="infra-status status-closed">CLOSED</span></li>
            <li className="infra-item"><span>4 Roads</span><span className="infra-status status-blocked">BLOCKED</span></li>
            <li className="infra-item"><span>6 Buildings</span><span className="infra-status status-damaged">DAMAGED</span></li>
          </ul>
        </div>

        <div className="widget-card">
          <div className="panel-header">
            <TrendingUp size={18} className="text-emerald-400" />
            <span className="text-sm font-bold tracking-wider">FLOOD INTENSITY TREND</span>
          </div>
          <div className="chart-placeholder">
            <Activity size={32} className="opacity-20 pulsate" />
            <span className="ml-2">Live Trend Feed...</span>
          </div>
        </div>
      </section>
    </div >
  );
}

export default App;
