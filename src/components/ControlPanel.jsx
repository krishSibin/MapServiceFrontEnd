import React from 'react';
import { CloudRain, AlertTriangle, Zap, Info } from 'lucide-react';

const ControlPanel = ({ scenario, setScenario }) => {
    const scenarios = [
        { id: 'normal', label: 'NORMAL', icon: CloudRain, color: '#38bdf8' },
        { id: 'heavy', label: 'HEAVY RAIN', icon: AlertTriangle, color: '#fb923c' },
        { id: 'extreme', label: 'EXTREME', icon: Zap, color: '#f43f5e' }
    ];

    return (
        <div className="control-panel">
            <div className="panel-header">
                <h3>SIMULATION ENGINE</h3>
                <Info size={14} className="info-icon" />
            </div>

            <div className="scenario-grid">
                {scenarios.map((s) => {
                    const Icon = s.icon;
                    const isActive = scenario === s.id;
                    return (
                        <button
                            key={s.id}
                            className={`scenario-btn ${isActive ? 'active' : ''}`}
                            onClick={() => setScenario(s.id)}
                            style={{ '--btn-accent': s.color }}
                        >
                            <Icon size={20} />
                            <span>{s.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="panel-info">
                <p className="description">
                    {scenario === 'normal' && "Current water levels are stable. No immediate threats detected."}
                    {scenario === 'heavy' && "Simulating +150mm rainfall. Low-lying areas near Periyar basin at risk."}
                    {scenario === 'extreme' && "Simulating +350mm rainfall. Massive inundation expected. Evacuation recommended."}
                </p>
            </div>
        </div>
    );
};

export default ControlPanel;
