import React from 'react';
import { ShieldAlert, Menu, Bell, FileText } from 'lucide-react';

const Header = ({ onOpenMenu }) => {
    return (
        <header className="px-4 md:px-8 py-4 md:py-5 flex items-center justify-between backdrop-blur-md bg-[#0b1219]/80 border-b border-white/5 sticky top-0 z-[1000]">
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl flex items-center justify-center overflow-hidden p-1 border border-white/10 shadow-lg">
                    <img src="/nexira-spatial-logo.jpg" alt="Nexira Spatial Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="flex items-center gap-2 md:gap-4 leading-none font-outfit">
                    <div className="flex items-center gap-2">
                        <span className="text-white text-lg md:text-2xl font-black uppercase tracking-tighter">Nexira</span>
                        <span className="text-[#38bdf8] text-lg md:text-2xl font-black uppercase tracking-tighter">Spatial</span>
                    </div>
                    <div className="hidden md:block w-px h-6 bg-white/20" />
                    <span className="text-white/40 text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] hidden md:block mt-1">
                        Flood Monitoring System
                    </span>
                </h1>
            </div>

            <div className="flex items-center gap-2">
                <button className="flex items-center justify-center w-7 h-7 md:w-auto md:px-4 md:py-2 rounded-lg md:rounded-xl bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/10">
                    <Bell size={12} className="md:w-4 md:h-4" />
                </button>
                <button className="flex items-center justify-center w-7 h-7 md:w-auto md:px-4 md:py-2 rounded-lg md:rounded-xl bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/10">
                    <FileText size={12} className="md:w-4 md:h-4" />
                </button>
                <button
                    onClick={onOpenMenu}
                    className="flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2 rounded-lg md:rounded-xl bg-[#152e3d] text-[#0ea5e9] md:bg-[#0ea5e9] md:text-white transition-all font-black text-[8px] md:text-[9px] tracking-widest uppercase border border-[#0ea5e9]/30 md:border-none"
                >
                    <Menu size={14} className="md:w-4 md:h-4" />
                    <span>Tools</span>
                </button>
            </div>
        </header>
    );
};

export default Header;