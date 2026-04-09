import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    AlertTriangle
} from 'lucide-react';

const AnalyticsOverlay = ({ isOpen, onClose, stats }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[2000] bg-[#0b1219]/95 backdrop-blur-2xl overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 px-6 py-8 flex items-center justify-between border-b border-white/5 bg-[#0b1219]/50 backdrop-blur-md">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-outfit font-black text-white uppercase tracking-tight">Spatial Analytics</h2>
                            <p className="text-neutral-500 text-xs md:text-sm font-medium tracking-widest uppercase mt-1">Real-time Environmental Insights</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-[#ef4444] transition-all group"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
                        {/* Top Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-3xl hover:border-[#38bdf8]/50 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#38bdf8]/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-[#38bdf8]/20 transition-all opacity-0 group-hover:opacity-100" />

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
                                                className="w-full bg-white/10 rounded-t-xl group-hover:bg-[#38bdf8]/50 transition-all duration-500 relative"
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
                                    <button className="text-[#38bdf8] text-[10px] font-black uppercase tracking-widest hover:underline">Full Report</button>
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
                                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="440" strokeDashoffset="110" className="text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
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
