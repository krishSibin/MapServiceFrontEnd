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
                        <Search size={14} /> SEARCH PANCHAYATH
                    </label>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Enter panchayath name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="drawer-input"
                        />
                    </div>
                    {searchTerm && filteredPanchayats.length > 0 && (
                        <div className="search-results">
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

                {/* Filter Section */}
                <div className="drawer-section">
                    <label className="section-label">
                        <Filter size={14} /> RISK INTENSITY (DN)
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

                {/* Info Section */}
                <div className="drawer-section info-box">
                    <div className="info-header">
                        <Info size={16} /> <span>Quick Guide</span>
                    </div>
                    <p>Use the search tool to quickly locate specific administrative boundaries. The map will automatically zoom and center on the selected panchayath.</p>
                </div>
            </div>

            <div className="drawer-footer">
                <span className="text-xs text-slate-500">MapService v1.0.4 • Live Data Feed</span>
            </div>
        </div>
    );
};

export default SideDrawer;
