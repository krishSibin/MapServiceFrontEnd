import React from 'react';
import { ShieldAlert, Menu, Bell, FileText } from 'lucide-react';

const Header = ({ onOpenMenu }) => {
    return (
        <header className="dashboard-header">
            <div className="logo-section">
                <div className="logo-icon-container overflow-hidden rounded-lg bg-white p-0.5">
                    <img src="/nexira-spatial-logo.jpg" alt="Nexira Spatial Logo" className="w-[28px] h-[28px] object-contain" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                    Real-Time <span className="text-blue-400">Flood</span> Monitoring System
                </h1>
            </div>

            <nav className="status-indicators">
                <div className="status-item cursor-pointer hover:bg-slate-800 transition-colors">
                    <Bell size={16} className="text-red-400" />
                    <span>ALERTS</span>
                </div>
                <div className="status-item cursor-pointer hover:bg-slate-800 transition-colors">
                    <FileText size={16} className="text-blue-400" />
                    <span>REPORTS</span>
                </div>

                {/* Premium Side Drawer Toggle */}
                <button
                    onClick={onOpenMenu}
                    className="drawer-trigger-btn"
                    title="Analysis Tools"
                >
                    <Menu size={20} />
                    <span className="text-xs font-bold ml-2">TOOLS</span>
                </button>
            </nav>
        </header>
    );
};

export default Header;