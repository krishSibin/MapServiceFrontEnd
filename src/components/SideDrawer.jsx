import React, { useState, useMemo, useCallback } from 'react';
import { X, Search, Filter, Map as MapIcon, Info, ChevronRight, Layers, Waves, Sprout, MapPin, Home } from 'lucide-react';

const SideDrawer = ({ isOpen, onClose, layers, onSearch, riskFilter, setRiskFilter, visibleLayers, setVisibleLayers }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPanchayats = useMemo(() => {
        if (!layers?.panchayat?.features) return [];

        const term = searchTerm.toLowerCase();
        // Extract names once
        const names = layers.panchayat.features.map(f => f.properties.PANCHAYAT).filter(Boolean);

        if (!term) return names.slice(0, 10);

        return names
            .filter(name => name.toLowerCase().includes(term))
            .slice(0, 10);
    }, [layers?.panchayat?.features, searchTerm]);

    const toggleLayer = useCallback((layerName) => {
        setVisibleLayers(prev =>
            prev.includes(layerName)
                ? prev.filter(l => l !== layerName)
                : [...prev, layerName]
        );
    }, [setVisibleLayers]);

    const layerItems = [
        { id: 'panchayat', label: 'Land Boundaries', icon: MapIcon, color: '#38bdf8' },
        { id: 'flood', label: 'Flood Risk (DN)', icon: Waves, color: '#ef4444' },
        { id: 'crop', label: 'Agricultural Areas', icon: Sprout, color: '#10b981' },
        { id: 'roads', label: 'Road Infrastructure', icon: MapPin, color: '#fb923c' },
        { id: 'settlement', label: 'Human Settlements', icon: Home, color: '#818cf8' }
    ];

    return (
        <div className={`side-drawer ${isOpen ? 'open' : ''}`}>
            <div className="drawer-header">
                <div className="drawer-title">
                    <MapIcon size={20} className="text-blue-400" />
                    <span>ANALYSIS TOOLS</span>
                </div>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <div className="drawer-content">
                {/* Search Section */}
                <div className="drawer-section">
                    <label className="section-label">
                        <Search size={14} className="text-blue-400" /> SEARCH PANCHAYATH
                    </label>
                    <div className="search-input-wrapper relative">
                        <input
                            type="text"
                            placeholder="Type panchayath name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="drawer-input w-full bg-slate-800/50 border-2 border-slate-700 focus:border-blue-500 text-white p-3 rounded-xl outline-none transition-all placeholder:text-slate-500"
                        />
                        {searchTerm && filteredPanchayats.length > 0 && (
                            <div className="search-results absolute left-0 right-0 mt-2 z-50">
                                {filteredPanchayats.map((name, i) => (
                                    <div
                                        key={i}
                                        className="result-item"
                                        onClick={() => {
                                            onSearch(name);
                                            setSearchTerm('');
                                        }}
                                    >
                                        <ChevronRight size={14} className="text-slate-500" />
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
                        <Layers size={14} className="text-blue-400" /> ACTIVE DATA LAYERS
                    </label>
                    <div className="layer-stack">
                        {layerItems.map(item => (
                            <div
                                key={item.id}
                                className={`layer-toggle-row ${visibleLayers.includes(item.id) ? 'active' : ''}`}
                                onClick={() => toggleLayer(item.id)}
                            >
                                <div className="layer-info">
                                    <item.icon size={16} style={{ color: item.color }} />
                                    <span>{item.label}</span>
                                </div>
                                <div className={`custom-checkbox ${visibleLayers.includes(item.id) ? 'checked' : ''}`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter Section - Specifically for Flood Risk */}
                {visibleLayers.includes('flood') && (
                    <div className="drawer-section">
                        <label className="section-label">
                            <Filter size={14} className="text-blue-400" /> FLOOD INTENSITY (DN)
                        </label>
                        <div className="filter-grid">
                            {[
                                { id: 'all', label: 'All Risks', color: '#94a3b8' },
                                { id: '4', label: 'High (4+)', color: '#ef4444' },
                                { id: '3', label: 'Moderate (3)', color: '#fb923c' },
                                { id: '2', label: 'Low (2)', color: '#eab308' },
                                { id: '1', label: 'Minimal (1)', color: '#22c55e' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    className={`filter-chip ${riskFilter === item.id ? 'active' : ''}`}
                                    onClick={() => setRiskFilter(item.id)}
                                    style={{ '--chip-color': item.color }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-auto">
                    {/* Info Section */}
                    <div className="drawer-section guide-box">
                        <div className="guide-header">
                            <Info size={16} /> <span>Quick Guide</span>
                        </div>
                        <p>Toggle layers to view different analysis data. Use the intensity filter to drill down into flood hazard zones.</p>
                    </div>
                </div>
            </div>

            <div className="drawer-footer">
                <span className="text-xs text-slate-500">MapService VR Analytics • Live Data</span>
            </div>
        </div>
    );
};

export default React.memo(SideDrawer);
