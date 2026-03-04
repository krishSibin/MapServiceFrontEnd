import React, { useState } from 'react';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import './App.css';

function App() {
  const [scenario, setScenario] = useState('normal'); // normal, heavy, extreme

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <MapView scenario={scenario} />
        <ControlPanel scenario={scenario} setScenario={setScenario} />
      </main>



      {/* Visual Overlay for Heavy/Extreme Rain */}
      {scenario !== 'normal' && (
        <div className={`rain-overlay ${scenario}-rain`}></div>
      )}
    </div>
  );
}

export default App;
