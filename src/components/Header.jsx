import React from 'react';
import { ShieldAlert, Map as MapIcon, Activity, Bell, FileText } from 'lucide-react';

const Header = () => {
    return (
        <header className="dashboard-header">
            <div className="logo-section">
                <ShieldAlert className="logo-icon pulse-red" size={28} />
                <h1 className="text-xl font-bold tracking-tight">Real-Time <span className="text-blue-400">Flood</span> Monitoring System</h1>
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
            </nav>
        </header>
    );
};

export default Header;
