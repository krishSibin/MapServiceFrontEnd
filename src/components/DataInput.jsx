import React, { useState } from 'react';
import axios from 'axios';
import { Send, FileJson, AlertCircle, CheckCircle } from 'lucide-react';

const DataInput = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!jsonInput.trim()) {
            setStatus({ type: 'error', message: 'Please enter GeoJSON data' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const parsedData = JSON.parse(jsonInput);

            // Basic GeoJSON Validation
            if (!parsedData.type || (parsedData.type !== 'Feature' && parsedData.type !== 'FeatureCollection')) {
                throw new Error('Invalid GeoJSON: Must be a Feature or FeatureCollection');
            }

            const response = await axios.post('http://localhost:4000/api/geojson', parsedData);

            setStatus({ type: 'success', message: 'Map updated successfully!' });
            // clear after success? Maybe not, so the user can see what they sent.
        } catch (error) {
            console.error('Error submitting GeoJSON:', error);
            setStatus({
                type: 'error',
                message: error instanceof SyntaxError ? 'Invalid JSON format' : error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="data-input-panel">
            <div className="panel-header">
                <FileJson size={20} className="text-secondary" />
                <h3 className="panel-title">GeoData Input</h3>
            </div>

            <p className="panel-description">
                Paste GeoJSON to update the map in real-time.
            </p>

            <div className="input-group">
                <textarea
                    className="geojson-textarea"
                    placeholder='{ "type": "FeatureCollection", "features": [...] }'
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    rows={10}
                />
            </div>

            {status.message && (
                <div className={`status-message ${status.type}`}>
                    {status.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    <span>{status.message}</span>
                </div>
            )}

            <button
                className={`submit-btn ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={handleSubmit}
                disabled={loading}
            >
                <Send size={18} />
                {loading ? 'Updating...' : 'Refresh Map'}
            </button>

            <div className="helper-links">
                <small>Need GeoJSON? Try <a href="https://geojson.io" target="_blank" rel="noopener noreferrer">geojson.io</a></small>
            </div>
        </div>
    );
};

export default DataInput;
