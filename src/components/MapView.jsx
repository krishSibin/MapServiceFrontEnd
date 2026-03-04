import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const SOCKET_URL = 'http://localhost:4000';

const MapView = ({ scenario }) => {
    const [geoKey, setGeoKey] = useState(0);
    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to map service backend');
        });

        socket.on('geojson-update', (data) => {
            console.log('Received map update:', data);
            setGeoData(data);
            setGeoKey(prev => prev + 1); // Force re-render of GeoJSON layer
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Also update when scenario changes
    useEffect(() => {
        setGeoKey(prev => prev + 1);
    }, [scenario]);

    const getWardStyle = (feature) => {
        // Fallback for features without base_risk
        const baseRisk = feature.properties?.base_risk || 0.5;
        let multiplier = 1;
        if (scenario === 'heavy') multiplier = 1.5;
        if (scenario === 'extreme') multiplier = 2.5;

        const risk = baseRisk * multiplier;

        let color = '#38bdf8'; // Default blue for custom data
        if (feature.properties?.base_risk) {
            color = '#22c55e'; // Low
            if (risk > 1.5) color = '#f43f5e'; // Extreme
            else if (risk > 0.8) color = '#fb923c'; // High
            else if (risk > 0.5) color = '#eab308'; // Medium
        }

        return {
            fillColor: color,
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: scenario === 'normal' ? 0.3 : 0.6
        };
    };

    return (
        <div className="map-wrapper">
            <MapContainer
                center={[10.08, 76.3]}
                zoom={11}
                scrollWheelZoom={true}
                className="main-map"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {geoData && (
                    <GeoJSON
                        key={geoKey}
                        data={geoData}
                        style={getWardStyle}
                        onEachFeature={(feature, layer) => {
                            const name = feature.properties?.name || 'Unnamed Feature';
                            layer.bindPopup(`
                                <div class="custom-popup">
                                    <strong>${name}</strong><br/>
                                    ${feature.properties?.base_risk ? `
                                        Risk Level: <span style="color: ${getWardStyle(feature).fillColor}">
                                            ${scenario === 'extreme' ? 'CRITICAL' : scenario === 'heavy' ? 'WARNING' : 'STABLE'}
                                        </span>
                                    ` : 'Custom Surface Data'}
                                </div>
                            `);
                        }}
                    />
                )}

            </MapContainer>
        </div>
    );
};

export default MapView;

