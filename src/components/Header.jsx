import React from 'react';
import { ShieldAlert, Menu, Bell, FileText, Activity } from 'lucide-react';

const Header = ({ onOpenMenu }) => {
    return (
        <header className="dashboard-header">
            <div className="logo-section">
                <div className="logo-icon-container">
                    <img src="/logo.jpg" alt="Nexira Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h1>
                    NEXIRA <span className="highlight">SPATIAL</span>
                </h1>
            </div>

            <nav className="status-indicators">
                <div className="status-item">
                    <Bell size={14} className="text-red-400" />
                    <span>ALERTS</span>
                </div>
                <div className="status-item">
                    <FileText size={14} className="text-blue-400" />
                    <span>REPORTS</span>
                </div>

                <button
                    onClick={onOpenMenu}
                    className="drawer-trigger-btn"
                >
                    <Menu size={20} />
                    <span>LAYERS</span>
                </button>
            </nav>
        </header>
    );
};

export default Header;
