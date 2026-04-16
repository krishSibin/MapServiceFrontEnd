import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import Header from './components/Header';
import SideDrawer from './components/SideDrawer';
import LandingPage from './components/LandingPage';
import { io } from "socket.io-client";
import {
  X,
  Target,
  Maximize2
} from 'lucide-react';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [mapTheme, setMapTheme] = useState('dark');
  const [riskFilter, setRiskFilter] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [layers, setLayers] = useState({});
  const [visibleLayers, setVisibleLayers] = useState(['taluk', 'panchayat', 'flood']);
  const [searchTarget, setSearchTarget] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  /* ---------------- SOCKET LOGIC ---------------- */
  useEffect(() => {
    console.log("Connecting to:", SOCKET_URL);
    const socket = io(SOCKET_URL);

    socket.on("connect", () => console.log("✅ Socket Connected"));
    socket.on("geojson-update", (data) => {
      console.log("📥 GeoJSON Update Received:", Object.keys(data));
      setLayers(data);
    });

    return () => socket.disconnect();
  }, []);

  /* ---------------- MEMOS ---------------- */
  const filteredLayers = React.useMemo(() => {
    return Object.fromEntries(
      Object.entries(layers).filter(([name]) => visibleLayers.includes(name))
    );
  }, [layers, visibleLayers]);


  /* ---------------- HANDLERS ---------------- */
  const handleSelect = React.useCallback((feature) => {
    setSelectedFeature(feature);
  }, []);

  const handleSearchPanchayat = React.useCallback((panchayatName) => {
    if (!layers.panchayat) return;
    const feature = layers.panchayat.features.find(
      f => {
        const name = f.properties.PANCHAYAT || f.properties.name;
        return name?.toLowerCase() === panchayatName.toLowerCase();
      }
    );
    if (feature) {
      setSearchTarget({ ...feature, _searchId: Date.now() });
      setIsDrawerOpen(false);
    }
  }, [layers.panchayat]);

  const clearSearchTarget = React.useCallback(() => {
    setSearchTarget(null);
  }, []);

  if (!showDashboard) {
    return <LandingPage onStart={() => setShowDashboard(true)} />;
  }

  return (
    <div className="app-container">
      <Header onOpenMenu={() => setIsDrawerOpen(true)} />

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

      <main className="dashboard-layout">
        <div className={`map-section ${mapTheme}-theme`}>
          <MapView
            layers={filteredLayers}
            riskFilter={riskFilter}
            searchTarget={searchTarget}
            selectedFeature={selectedFeature}
            onSelect={handleSelect}
            onSearchComplete={clearSearchTarget}
          />

          {/* Map Overlay Controls */}
          <div className="map-controls-group">
            <div className="theme-toggle-glass">
              <button
                className={`theme-btn-mini ${mapTheme === 'dark' ? 'active' : ''}`}
                onClick={() => setMapTheme('dark')}
              >DARK</button>
              <button
                className={`theme-btn-mini ${mapTheme === 'light' ? 'active' : ''}`}
                onClick={() => setMapTheme('light')}
              >LIGHT</button>
              <button
                className="theme-btn-mini exit-btn-mini"
                onClick={() => setShowDashboard(false)}
              >EXIT</button>
            </div>
          </div>

          {/* Info Overlay (Feature Selection) */}
          {selectedFeature && (
            <div className="map-info-overlay">
              <div className="overlay-header">
                <div>
                  <span className="source-tag">ANALYSIS DATA: {selectedFeature._layerName?.toUpperCase()}</span>
                  <h3>{selectedFeature.properties.PANCHAYAT || selectedFeature.properties.TALUK || selectedFeature.properties.name || "Feature Detail"}</h3>
                </div>
                <button className="close-btn" onClick={() => setSelectedFeature(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="info-grid">
                {Object.entries(selectedFeature.properties)
                  .filter(([key]) => !key.startsWith('_') && key !== 'PANCHAYAT' && key !== 'TALUK')
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <div key={key} className="info-item">
                      <label>{key.replace(/_/g, ' ')}</label>
                      <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                  ))}
                {selectedFeature._layerName === 'flood' && (
                  <div className="info-item">
                    <label>RISK INDEX</label>
                    <span style={{ color: selectedFeature.properties.DN >= 3 ? '#f43f5e' : '#fb923c' }}>
                      {selectedFeature.properties.DN >= 4 ? 'EXTREME' : selectedFeature.properties.DN === 3 ? 'HIGH' : 'MODERATE'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="map-legend">
            <div className="legend-header">SPATIAL INDEX</div>
            {visibleLayers.includes('taluk') && (
              <div className="legend-item">
                <div className="legend-color" style={{ border: '2px dashed #fb923c', background: 'transparent' }}></div>
                <span>Taluk Boundary</span>
              </div>
            )}
            {visibleLayers.includes('panchayat') && (
              <div className="legend-item">
                <div className="legend-color" style={{ border: '2px dashed #38bdf8', background: 'transparent' }}></div>
                <span>Panchayat Area</span>
              </div>
            )}
            {visibleLayers.includes('flood') && (
              <>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#f43f5e' }}></div>
                  <span>High Risk (4+)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#fb923c' }}></div>
                  <span>Moderate (3)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#eab308' }}></div>
                  <span>Low Risk (2)</span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
