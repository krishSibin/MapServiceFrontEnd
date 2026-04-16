import React, { useState, useMemo, useCallback } from 'react';
import { X, Search, Filter, Map as MapIcon, Info, ChevronRight, Layers, Waves } from 'lucide-react';

const SideDrawer = ({ isOpen, onClose, layers, onSearch, riskFilter, setRiskFilter, visibleLayers, setVisibleLayers }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const suggestions = useMemo(() => {
        if (!layers?.panchayat?.features || !searchTerm) return [];

        const term = searchTerm.toLowerCase();
        const results = [];
        const seen = new Set();

        for (const feature of layers.panchayat.features) {
            const name = feature.properties?.PANCHAYAT || feature.properties?.name;
            if (name && name.toLowerCase().includes(term) && !seen.has(name)) {
                results.push(name);
                seen.add(name);
                if (results.length >= 6) break;
            }
        }
        return results;
    }, [layers?.panchayat, searchTerm]);

    const toggleLayer = useCallback((layerName) => {
        setVisibleLayers(prev =>
            prev.includes(layerName)
                ? prev.filter(l => l !== layerName)
                : [...prev, layerName]
        );
    }, [setVisibleLayers]);

    const layerItems = [
        { id: 'taluk', label: 'Taluk Boundaries', icon: MapIcon, color: '#fb923c' },
        { id: 'panchayat', label: 'Panchayat Areas', icon: MapIcon, color: '#38bdf8' },
        { id: 'flood', label: 'Flood Hazard Zone', icon: Waves, color: '#f43f5e' }
    ];

    return (
        <div className={`side-drawer ${isOpen ? 'open' : ''}`}>
            <div className="drawer-header">
                <div className="drawer-title">
                    <MapIcon size={20} className="text-blue-400" />
                    <span>SYSTEM TOOLS</span>
                </div>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <div className="drawer-content">
                {/* Search Section */}
                <div className="drawer-section">
                    <label className="section-label">
                        <Search size={14} /> Search Panchayat
                    </label>
                    <div className="drawer-input-container">
                        <input
                            type="text"
                            placeholder="Type boundary name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="drawer-input"
                        />
                        <Search size={18} className="search-icon-inside" />

                        {suggestions.length > 0 && (
                            <div className="search-results">
                                {suggestions.map((name, i) => (
                                    <div
                                        key={i}
                                        className="result-item"
                                        onClick={() => {
                                            onSearch(name);
                                            setSearchTerm('');
                                        }}
                                    >
                                        <ChevronRight size={14} />
                                        <span>{name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Layer Control Section */}
                <div className="drawer-section">
                    <label className="section-label">
                        <Layers size={14} /> Data Layers
                    </label>
                    <div className="layer-stack">
                        {layerItems.map(item => (
                            <div
                                key={item.id}
                                className={`layer-toggle-row ${visibleLayers.includes(item.id) ? 'active' : ''}`}
                                onClick={() => toggleLayer(item.id)}
                            >
                                <div className="layer-info">
                                    <item.icon size={18} style={{ color: item.color }} />
                                    <span>{item.label}</span>
                                </div>
                                <div className="checkbox-visual">
                                    {visibleLayers.includes(item.id) && <ChevronRight size={14} color="white" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Flood Risk Filter (Conditional) */}
                {visibleLayers.includes('flood') && (
                    <div className="drawer-section">
                        <label className="section-label">
                            <Filter size={14} /> INTENSITY FILTER
                        </label>
                        <div className="filter-grid">
                            {[
                                { id: 'all', label: 'All Hazards', color: '#94a3b8', shadow: 'rgba(148, 163, 184, 0.2)' },
                                { id: '4', label: 'Extreme (4+)', color: '#f43f5e', shadow: 'rgba(244, 63, 94, 0.3)' },
                                { id: '3', label: 'High (3)', color: '#fb923c', shadow: 'rgba(251, 146, 60, 0.3)' },
                                { id: '2', label: 'Moderate (2)', color: '#eab308', shadow: 'rgba(234, 179, 8, 0.3)' },
                                { id: '1', label: 'Low (1)', color: '#22c55e', shadow: 'rgba(34, 197, 94, 0.3)' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    className={`filter-pill ${riskFilter === item.id ? 'active' : ''}`}
                                    onClick={() => setRiskFilter(item.id)}
                                    style={{
                                        '--active-color': item.color,
                                        '--active-shadow': item.shadow
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-auto">
                    <div className="guide-box">
                        <div className="guide-header">
                            <Info size={16} /> <span>System Overview</span>
                        </div>
                        <p>Analyze spatial metrics by toggling environmental layers. Use the search to zoom into specific administrative boundaries.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(SideDrawer);
