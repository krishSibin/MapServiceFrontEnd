import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Search,
    Filter,
    Layers,
    Waves,
    Sprout,
    MapPin,
    Home,
    Layout,
    Activity,
    Menu,
    Check
} from 'lucide-react';

const layerItems = [
    { id: 'panchayat', label: 'Land Boundaries', icon: MapPin, color: '#38bdf8' },
    { id: 'admin', label: 'Admin Boundaries', icon: Layout, color: '#a855f7' },
    { id: 'flood', label: 'Flood Inundation', icon: Waves, color: '#ef4444' },
    { id: 'crop', label: 'Agricultural Zones', icon: Sprout, color: '#22c55e' },
    { id: 'roads', label: 'Road Infrastructure', icon: MapPin, color: '#f59e0b' },
    { id: 'settlement', label: 'Settlement Areas', icon: Home, color: '#0ea5e9' },
];

const SideDrawer = ({
    isOpen,
    onClose,
    layers,
    onSearch,
    riskFilter,
    setRiskFilter,
    visibleLayers,
    setVisibleLayers
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const toggleLayer = (layerId) => {
        setVisibleLayers(prev =>
            prev.includes(layerId) ? prev.filter(id => id !== layerId) : [...prev, layerId]
        );
    };

    const panchayatNames = useMemo(() => (
        layers?.panchayat
            ? [...new Set(layers.panchayat.features.map(f => f.properties.PANCHAYAT))].filter(Boolean).sort()
            : []
    ), [layers?.panchayat]);

    const filteredPanchayats = useMemo(() => (
        searchTerm
            ? panchayatNames.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
            : []
    ), [searchTerm, panchayatNames]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="side-drawer-new"
                >
                    {/* Drawer Header matching target image style */}
                    <div className="p-6 flex items-center justify-between border-b border-white/5 bg-[#141b26]">
                        <div className="flex items-center gap-3">
                            <Layers size={18} className="text-[#38bdf8]" />
                            <span className="font-outfit font-black uppercase tracking-[0.2em] text-xs text-white">Analysis Tools</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X size={18} className="text-neutral-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-8 scrollbar-hide">
                        {/* Search Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
                                <Search size={12} /> Search Panchayath
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Type panchayath name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-[#161f2c] border border-white/5 p-4 rounded-xl outline-none text-white text-xs placeholder:text-neutral-600"
                                />
                                {searchTerm && filteredPanchayats.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-2 bg-[#1a2433] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                        {filteredPanchayats.map((name, i) => (
                                            <button
                                                key={i}
                                                className="w-full text-left p-3 hover:bg-[#38bdf8]/10 text-white/70 text-xs hover:text-white border-b border-white/5 last:border-0"
                                                onClick={() => {
                                                    onSearch(name);
                                                    setSearchTerm('');
                                                }}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Layer Control Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
                                <Layers size={12} /> Active Data Layers
                            </div>
                            <div className="space-y-2">
                                {layerItems.map(item => (
                                    <button
                                        key={item.id}
                                        className="w-full flex items-center justify-between p-4 rounded-xl bg-[#161f2c] border border-white/5 transition-all hover:bg-[#1c2636]"
                                        onClick={() => toggleLayer(item.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15`, color: item.color }}>
                                                <item.icon size={16} />
                                            </div>
                                            <span className="font-bold text-xs text-white/90">{item.label}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${visibleLayers.includes(item.id)
                                            ? 'bg-[#00cfbf] border-[#00cfbf]'
                                            : 'border-white/10'
                                            }`}>
                                            {visibleLayers.includes(item.id) && <Check size={14} className="text-black font-black" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filter Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
                                <Filter size={12} /> Flood Intensity (DN)
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'all', label: 'All Risks' },
                                    { id: '4', label: 'High (4+)' },
                                    { id: '3', label: 'Moderate (3)' },
                                    { id: '2', label: 'Low (2)' },
                                    { id: '1', label: 'Minimal (1)' },
                                ].map((item, idx) => (
                                    <button
                                        key={item.id}
                                        className={`p-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${riskFilter === item.id
                                            ? 'bg-[#3e4a5d] text-white shadow-lg'
                                            : 'bg-[#161f2c] text-neutral-500 hover:text-neutral-300'
                                            } ${idx === 0 ? 'col-span-1' : ''}`}
                                        onClick={() => setRiskFilter(item.id)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Guide Section */}
                        <div className="p-5 rounded-2xl bg-[#0d141d] border border-white/5 space-y-3">
                            <div className="flex items-center gap-2 text-[#00cfbf]">
                                <Activity size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Quick Guide</span>
                            </div>
                            <p className="text-[10px] text-neutral-500 leading-relaxed italic">
                                Toggle layers to view different analysis data. Use filters to narrow down specific flood intensity risk zones.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/5 flex items-center justify-center">
                        <span className="text-[9px] uppercase tracking-[0.4em] text-neutral-700 font-bold">
                            MapService VR Analytics • Live Data
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default React.memo(SideDrawer);
