import React, { useState } from 'react';
import MapView from './components/MapView';
import Header from './components/Header';
import {
  Waves,
  Sprout,
  MapPin,
  Home,
  Activity,
  TrafficCone,
  Zap,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import './App.css';

function App() {
  const [mapTheme, setMapTheme] = useState('dark');
  const [riskFilter, setRiskFilter] = useState('all');

  const stats = [
    { label: "Flooded Area", value: "3250", unit: "ha", icon: Waves, color: "#38bdf8" },
    { label: "Crops Affected", value: "1800", unit: "ha", icon: Sprout, color: "#10b981" },
    { label: "Roads Impacted", value: "12", unit: "", icon: MapPin, color: "#fb923c" },
    { label: "Villages Affected", value: "8", unit: "", icon: Home, color: "#f43f5e" }
  ];

  return (
    <div className="app-container">
      <Header />

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
        <div className="map-section">
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
            <select
              className="theme-btn ml-2 bg-slate-800"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{ border: '1px solid var(--glass-border)' }}
            >
              <option value="all">All Risks</option>
              <option value="4">High Risk (DN 4+)</option>
              <option value="3">Moderate (DN 3)</option>
              <option value="2">Low Risk (DN 2)</option>
              <option value="1">Minimal (DN 1)</option>
            </select>
          </div>

          <MapView theme={mapTheme} riskFilter={riskFilter} />


          {/* Map Overlay Legend */}
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#38bdf8' }}></div>
              <span>Panchayat Boundaries (Administrative)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ef4444' }}></div>
              <span>Flooded Areas (Sentinel-1 SAR)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#fb923c' }}></div>
              <span>Cropland Impact (Dynamic World)</span>
            </div>
          </div>
        </div>
      </main>

      <section className="bottom-widgets">
        <div className="widget-card">
          <div className="panel-header">
            <BarChart3 size={18} className="text-blue-400" />
            <span className="text-sm font-bold tracking-wider">AGRICULTURAL IMPACT</span>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              <div className="chart-bar" style={{ height: '40px', background: '#10b981' }}></div>
              <div className="chart-bar" style={{ height: '60px', background: '#eab308' }}></div>
              <div className="chart-bar" style={{ height: '35px', background: '#fb923c' }}></div>
              <div className="chart-bar" style={{ height: '25px', background: '#f43f5e' }}></div>
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
            <li className="infra-item">
              <span>Highway 24</span>
              <span className="infra-status status-closed">CLOSED</span>
            </li>
            <li className="infra-item">
              <span>4 Roads</span>
              <span className="infra-status status-blocked">BLOCKED</span>
            </li>
            <li className="infra-item">
              <span>6 Buildings</span>
              <span className="infra-status status-damaged">DAMAGED</span>
            </li>
          </ul>
        </div>

        <div className="widget-card">
          <div className="panel-header">
            <TrendingUp size={18} className="text-emerald-400" />
            <span className="text-sm font-bold tracking-wider">FLOOD INTENSITY TREND</span>
          </div>
          <div className="chart-placeholder">
            <Activity size={32} className="opacity-20" />
            <span className="ml-2">Live Trend Feed...</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
