import React from 'react';
import { Map, Layers, BarChart3, ArrowRight, Radio } from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ onStart }) => {
    return (
        <div className="landing-container">
            <div className="background-grid"></div>
            <div className="glow glow-1"></div>
            <div className="glow glow-2"></div>

            <nav className="landing-nav">
                <div className="brand-badge">
                    <img src="/logo.jpg" alt="Nexira Logo" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                    <span>NEXIRA SPATIAL</span>
                </div>
            </nav>

            <main className="landing-content">
                <h1 className="hero-title">
                    Real-Time <span className="gradient-text">Flood Intelligence</span> <br />
                    & Monitoring Platform
                </h1>

                <p className="hero-description">
                    Advanced geospatial analytics powered by real-time satellite telemetry.
                    Monitor critical infrastructure, assess agricultural impact, and coordinate
                    emergency responses with millisecond precision.
                </p>

                <div className="feature-cards">
                    <div className="feature-card">
                        <div className="icon-box green">
                            <Map size={24} />
                        </div>
                        <h3>Interactive Live Map</h3>
                        <p>Hardware-accelerated map interface to simultaneously monitor floods, crops, roads, and panchayat boundaries.</p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-box blue">
                            <Layers size={24} />
                        </div>
                        <h3>Data Integration</h3>
                        <p>Seamlessly filter real-time geo-data based on risk index (DN) and deeply inspect administrative properties.</p>
                    </div>

                    <div className="feature-card">
                        <div className="icon-box orange">
                            <Radio size={24} />
                        </div>
                        <h3>Boundary Analysis</h3>
                        <p>Detailed inspection of Taluk and Panchayat boundaries with real-time fly-to search and property overlays.</p>
                    </div>
                </div>

                <button className="initialize-btn" onClick={onStart}>
                    <span>GET STARTED</span>
                    <ArrowRight size={20} />
                </button>
            </main>

            <footer className="landing-footer">
                <p>© 2026 NEXIRA SPATIAL SYSTEMS. ALL RIGHTS RESERVED.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
