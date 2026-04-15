import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3-shape';
import {
    X,
    Waves,
    Sprout,
    TrafficCone,
    Activity,
    BarChart3,
    TrendingUp,
    Zap,
    Target,
    AlertTriangle,
    Clock,
    MapPin,
    Home
} from 'lucide-react';

const AnalyticsOverlay = ({ isOpen, onClose, stats, layers, availableDates, currentTimeIndex, setCurrentTimeIndex, setSliderIndex, floodTimeSeries }) => {
    // Local index — fully decoupled from the map to prevent expensive re-renders on every date click
    const [localIndex, setLocalIndex] = useState(currentTimeIndex || 0);

    // Sync local index when overlay opens (pick up whatever date the map is on)
    useEffect(() => {
        if (isOpen) setLocalIndex(currentTimeIndex || 0);
    }, [isOpen]);

    // Apply to map only when the overlay closes
    const handleClose = () => {
        if (setCurrentTimeIndex) setCurrentTimeIndex(localIndex);
        if (setSliderIndex) setSliderIndex(localIndex);
        onClose();
    };

    // Compute stats locally based on localIndex so they update instantly on date change
    const localStats = React.useMemo(() => {
        const localDate = (availableDates || [])[localIndex];
        if (!localDate || !layers) return stats; // fallback to props

        const sumField = (layerName, field) => {
            if (!layers[layerName]) return 0;
            // Note: We could technically pass visibleLayers here if we want the big modal 
            // to also respond to the sidebar toggles. usually Analytics shows everything.
            // but for consistency with the main dashboard, I'll pass visibleLayers to the component.
            return layers[layerName].features
                .filter(f => f.properties?.date === localDate)
                .reduce((sum, f) => sum + (f.properties[field] || 0), 0);
        };

        const floodArea = sumField('flood', 'area_ha');
        const cropArea = sumField('crop', 'area_ha');
        const roadLength = sumField('roads', 'length_km');
        const villageCount = layers.village
            ? layers.village.features.filter(f => f.properties?.date === localDate).length
            : 0;

        return [
            { label: "Flooded Area", value: Math.round(floodArea).toLocaleString(), unit: "ha", icon: Waves, color: "#00cfbf" },
            { label: "Crops Affected", value: Math.round(cropArea).toLocaleString(), unit: "ha", icon: Sprout, color: "#22c55e" },
            { label: "Roads Impacted", value: Math.round(roadLength).toLocaleString(), unit: "km", icon: MapPin, color: "#f59e0b" },
            { label: "Villages Affected", value: villageCount.toString(), unit: "", icon: Home, color: "#ef4444" }
        ];
    }, [localIndex, availableDates, layers]);
    // Chart generators
    const chartData = floodTimeSeries || [];
    let curveAreaPath = "";
    let curveLinePath = "";
    let dashedLinePath = "";

    if (chartData.length > 0) {
        const maxA = Math.max(...chartData.map(d => d.area), 1);
        const areaGen = d3.area()
            .x((d, i) => (i / Math.max(1, chartData.length - 1)) * 1000)
            .y0(200)
            .y1(d => 200 - (d.area / maxA) * 160)
            .curve(d3.curveMonotoneX);

        const lineGen = d3.line()
            .x((d, i) => (i / Math.max(1, chartData.length - 1)) * 1000)
            .y(d => 200 - (d.area / maxA) * 160)
            .curve(d3.curveMonotoneX);

        const dashedGen = d3.line()
            .x((d, i) => (i / Math.max(1, chartData.length - 1)) * 1000)
            .y(d => 200 - ((d.area * 0.6 + maxA * 0.2) / maxA) * 160)
            .curve(d3.curveMonotoneX);

        curveAreaPath = areaGen(chartData);
        curveLinePath = lineGen(chartData);
        dashedLinePath = dashedGen(chartData);
    }

    const formatDateDisplay = (dateStr) => {
        try {
            const [y, m, d] = dateStr.split('-');
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${d} ${months[parseInt(m) - 1]}`;
        } catch (e) { return dateStr; }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[2000] bg-[#0b1219]/95 backdrop-blur-2xl overflow-y-auto"
                >
                    {/* Header with Sticky Global Date Picker */}
                    <div className="sticky top-0 z-50 flex flex-col border-b border-white/5 bg-[#0b1219]/90 backdrop-blur-xl shadow-2xl">
                        <div className="px-6 py-6 md:py-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-outfit font-black text-white uppercase tracking-tight">Spatial Analytics</h2>
                                <p className="text-neutral-500 text-xs md:text-sm font-medium tracking-widest uppercase mt-1">The Operational Choice</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-[#ef4444] transition-all group shrink-0 ml-4 border border-white/10 hover:border-[#ef4444]/50"
                            >
                                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Global Date Picker — Local state only, syncs to map on close */}
                        <div className="w-full bg-[#0b1219]/90 border-t border-white/5 py-3 backdrop-blur-xl relative z-50 shadow-md shrink-0">
                            <style>{`
                                .no-scrollbar::-webkit-scrollbar { display: none; }
                                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                            `}</style>
                            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-[#00cfbf] text-[10px] md:text-xs font-black tracking-widest uppercase shrink-0 w-full md:w-auto justify-center md:justify-start">
                                    <Clock size={14} />
                                    <span>Observation</span>
                                </div>

                                <div className="w-full md:max-w-[500px] lg:max-w-[700px] bg-black/50 border border-white/10 rounded-full p-1 flex">
                                    <div className="flex w-full overflow-x-auto snap-x no-scrollbar items-center gap-1 scroll-smooth">
                                        {(availableDates || []).map((date, i) => {
                                            const isSelected = i === localIndex;
                                            const dateObj = new Date(date);
                                            const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
                                            return (
                                                <button
                                                    key={date}
                                                    onClick={() => setLocalIndex(i)}
                                                    className={`snap-center shrink-0 min-w-[70px] md:min-w-[80px] py-1.5 px-3 rounded-full text-[9px] md:text-xs font-black transition-all duration-150 ${isSelected
                                                        ? 'bg-[#00cfbf] text-[#0b1219] shadow-[0_2px_12px_rgba(0,207,191,0.4)]'
                                                        : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    {formatted}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>


                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
                        {/* Enhanced Detailed Bar Graph Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-2xl group"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00cfbf]/10 blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-[#00cfbf]/20 transition-all duration-700" />

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#00cfbf]/10 flex items-center justify-center text-[#00cfbf]">
                                        <BarChart3 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-2xl uppercase tracking-wider">Flood Impact History</h3>
                                        <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">Detailed Daily Inundation Area</p>
                                    </div>
                                </div>
                                <div className="bg-[#0b1219] border border-white/10 px-4 py-2 rounded-lg flex gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#00cfbf]"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Recorded Area</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#ef4444] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Active Date</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Bar Chart */}
                            <div className="w-full h-[250px] md:h-[300px] relative z-10 flex items-end justify-between gap-2 md:gap-4 px-2 mt-8 pb-8 border-b border-white/10">
                                {chartData.map((d, i) => {
                                    const isSelected = i === localIndex;
                                    const maxA = Math.max(...chartData.map(c => c.area), 1);
                                    const heightPercent = Math.max((d.area / maxA) * 100, 2);
                                    const formattedDate = formatDateDisplay(d.date).split(' ')[0] + ' ' + formatDateDisplay(d.date).split(' ')[1];

                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 w-full h-full flex flex-col justify-end items-center group relative cursor-pointer"
                                            onClick={() => setLocalIndex(i)}
                                        >
                                            {/* Bar Container - Ensures correct bottom alignment */}
                                            <div className="w-full h-[80%] flex flex-col justify-end relative">
                                                {/* Tooltip locked exactly above the bar */}
                                                <div
                                                    className={`absolute w-full flex justify-center -translate-y-full pb-2 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 -translate-y-[120%]'} z-20 pointer-events-none`}
                                                    style={{ bottom: `${heightPercent}%` }}
                                                >
                                                    <div className={`px-2 py-1 rounded bg-[#0b1219] border ${isSelected ? 'border-[#ef4444]' : 'border-[#00cfbf]/50'} shadow-xl flex flex-col items-center whitespace-nowrap`}>
                                                        <span className={`font-black tracking-widest text-[10px] md:text-xs ${isSelected ? 'text-[#ef4444]' : 'text-white'}`}>
                                                            {Math.round(d.area).toLocaleString()}
                                                        </span>
                                                        <span className="text-[7px] text-neutral-500 uppercase tracking-widest">Hectares</span>
                                                    </div>
                                                </div>

                                                {/* The Bar Itself - using App.jsx w-full styling */}
                                                <div
                                                    className={`w-full max-w-[30px] mx-auto rounded-t-md md:rounded-t-lg transition-all duration-500 relative overflow-hidden group-hover:opacity-100 ${isSelected ? 'bg-[#ef4444] opacity-100' : 'bg-[#00cfbf] opacity-70 group-hover:bg-[#00cfbf]'
                                                        }`}
                                                    style={{
                                                        height: `${heightPercent}%`,
                                                        boxShadow: isSelected ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'none'
                                                    }}
                                                >
                                                    {/* Gloss overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                                                </div>
                                            </div>

                                            {/* Bottom Date Label */}
                                            <span className={`absolute -bottom-8 text-[8px] md:text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${isSelected ? 'text-[#ef4444]' : 'text-neutral-500 group-hover:text-white'
                                                }`}>
                                                {formattedDate}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Top Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                            {localStats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-3xl hover:border-[#00cfbf]/50 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00cfbf]/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-[#00cfbf]/20 transition-all opacity-0 group-hover:opacity-100" />

                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: `${stat.color}15`, color: stat.color }}>
                                        <stat.icon size={24} className="md:w-8 md:h-8" />
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-neutral-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">{stat.label}</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl md:text-4xl font-black text-white tabular-nums">{stat.value}</span>
                                            <span className="text-neutral-500 text-xs md:text-sm font-bold">{stat.unit}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Detailed Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Agricultural Impact */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/5 border border-white/10 p-8 rounded-3xl lg:col-span-2"
                            >
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                            <Sprout size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black text-lg uppercase tracking-wider">Agricultural Resilience</h3>
                                            <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">Crop-specific Risk Assessment</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                            <Zap size={12} />
                                            High Yield
                                        </div>
                                    </div>
                                </div>

                                <div className="h-64 flex items-end justify-between gap-4 px-4">
                                    {[20, 60, 45, 90, 35, 75, 40, 85, 55, 70].map((h, i) => (
                                        <div key={i} className="flex-1 group relative">
                                            <div
                                                className="w-full bg-white/10 rounded-t-xl group-hover:bg-[#00cfbf]/50 transition-all duration-500 relative"
                                                style={{ height: `${h}%`, background: i === 3 ? 'rgba(34, 197, 94, 0.4)' : (i === 7 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.05)') }}
                                            >
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0ea5e9] text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {h}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em]">Regional Loss Est: <span className="text-white ml-2">$1.48M</span></span>
                                    <button className="text-[#00cfbf] text-[10px] font-black uppercase tracking-widest hover:underline">Full Report</button>
                                </div>
                            </motion.div>

                            {/* Intensity Hub */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col"
                            >
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-lg uppercase tracking-wider">Inundation Hub</h3>
                                        <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">Live System Intensity</p>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                                    <div className="relative w-40 h-40 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="440" strokeDashoffset="110" className="text-[#00cfbf] drop-shadow-[0_0_8px_rgba(0,207,191,0.4)]" />
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-3xl font-black text-white">75%</span>
                                            <span className="text-[10px] font-black text-neutral-500 uppercase">Critical</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Peak</span>
                                            <span className="text-lg font-black text-white">4.2m</span>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Trend</span>
                                            <span className="text-lg font-black text-[#10b981]">+2.1%</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Infrastructure Alerts Row */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/5 border border-white/10 p-8 rounded-3xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <TrafficCone size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-lg uppercase tracking-wider">Infrastructure Status</h3>
                                        <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">Network Accessibility Monitor</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: "State Highway 24", status: "Critical", info: "Inundation Level: 1.2m", color: "#ef4444" },
                                    { label: "Panchayat Road #9", status: "Blocked", info: "Debris Accumulation", color: "#f59e0b" },
                                    { label: "Bridge Connectivity", status: "Operational", info: "Height Clear: 2.5m", color: "#10b981" }
                                ].map((item, i) => (
                                    <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <span className="text-sm font-bold text-white leading-tight">{item.label}</span>
                                            <span className="px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter" style={{ background: `${item.color}20`, color: item.color }}>{item.status}</span>
                                        </div>
                                        <span className="text-neutral-500 text-[10px] font-medium">{item.info}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AnalyticsOverlay;
