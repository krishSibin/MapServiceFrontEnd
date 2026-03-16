import React, { useState } from 'react';
import { X, Search, Filter, Map as MapIcon, Info, ChevronRight } from 'lucide-react';

const SideDrawer = ({ isOpen, onClose, panchayatData, onSearch, riskFilter, setRiskFilter }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPanchayats = panchayatData?.features
        ? panchayatData.features
            .map(f => f.properties.PANCHAYAT)
            .filter(name => name?.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 10)
        : [];

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

                {/* Filter Section */}
                <div className="drawer-section">
                    <label className="section-label">
                        <Filter size={14} className="text-blue-400" /> RISK INTENSITY (DN)
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

                <div className="mt-auto">
                    {/* Info Section */}
                    <div className="drawer-section guide-box">
                        <div className="guide-header">
                            <Info size={16} /> <span>Quick Guide</span>
                        </div>
                        <p>Search for a panchayath to focus the map. Use filters to identify areas by flood intensity level (DN).</p>
                    </div>
                </div>
            </div>

            <div className="drawer-footer">
                <span className="text-xs text-slate-500">MapService v1.0.5 • Live Data Feed</span>
            </div>
        </div>
    );
};

export default SideDrawer;
