import React from 'react';
import { ShieldAlert, Map as MapIcon, Activity } from 'lucide-react';

const Header = () => {
    return (
        <header className="app-header">
            <div className="logo-section">
                <ShieldAlert className="logo-icon pulse-red" size={28} />
                <h1>FLOODGUARD <span className="highlight">X</span></h1>
            </div>

            <nav className="status-indicators">
                <div className="status-item">
                    <Activity size={16} />
                    <span>LIVE ANALYSIS</span>
                    <div className="live-dot"></div>
                </div>
                <div className="location-tag">
                    <MapIcon size={16} />
                    <span>KOCHI, KERALA</span>
                </div>
            </nav>
        </header>
    );
};

export default Header;
