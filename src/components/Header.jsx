import React from 'react';
import { Menu, Bell, BarChart2, FileText } from 'lucide-react';

const Header = ({ onOpenMenu, onOpenAnalytics, onGoHome }) => {
    return (
        <header className="px-4 md:px-8 h-14 md:h-16 flex items-center justify-between bg-[#070c14]/95 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-[1000]">

            {/* Left — Logo + Brand */}
            <button
                onClick={onGoHome}
                title="Back to Home"
                className="flex items-center gap-2.5 group"
            >
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-md group-hover:shadow-[0_0_18px_rgba(56,189,248,0.35)] transition-shadow duration-300">
                    <img src="/nexira-spatial-logo.jpg" alt="Nexira Spatial Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col items-start leading-none">
                    <div className="flex items-center gap-1.5">
                        <span className="text-white text-[15px] md:text-[20px] font-black uppercase tracking-tight">Nexira</span>
                        <span className="text-[#38bdf8] text-[15px] md:text-[20px] font-black uppercase tracking-tight">Spatial</span>
                    </div>
                    <span className="hidden md:block text-[9px] text-white/30 font-semibold uppercase tracking-[0.18em] mt-0.5">Flood Monitoring System</span>
                </div>
            </button>



            {/* Right — Action buttons */}
            <div className="flex items-center gap-1 md:gap-1.5">
                {/* Notification */}
                <button className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-all">
                    <Bell size={14} className="md:w-4 md:h-4" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#10b981] ring-2 ring-[#070c14]"></span>
                </button>

                {/* Report */}
                <button className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-all">
                    <FileText size={14} className="md:w-4 md:h-4" />
                </button>

                <div className="w-px h-5 bg-white/[0.07] mx-1" />

                {/* Analytics */}
                <button
                    onClick={onOpenAnalytics}
                    className="flex items-center gap-1.5 px-3 md:px-4 h-8 md:h-9 rounded-lg bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/20 hover:border-[#38bdf8]/40 transition-all"
                >
                    <BarChart2 size={13} className="md:w-[15px] md:h-[15px]" />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest hidden sm:inline">Analytics</span>
                </button>

                {/* Tools / Menu */}
                <button
                    onClick={onOpenMenu}
                    className="flex items-center gap-1.5 px-3 md:px-4 h-8 md:h-9 rounded-lg bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#070c14] transition-all font-black text-[9px] md:text-[10px] tracking-widest uppercase shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_28px_rgba(56,189,248,0.4)]"
                >
                    <Menu size={13} />
                    <span className="hidden sm:inline">Tools</span>
                </button>
            </div>
        </header>
    );
};

export default Header;