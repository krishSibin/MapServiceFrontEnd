import React, { useEffect, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const MapView = ({ theme = 'dark', riskFilter = 'all', panchayatData, floodData, searchTarget }) => {

    const [selected, setSelected] = useState(null)
    const [map, setMap] = useState(null)

    /* ---------------- FILTER LOGIC ---------------- */
    const filterFloodData = useCallback((feature) => {
        if (riskFilter === 'all') return true;
        const dn = feature.properties?.DN;
        if (riskFilter === '4') return dn >= 4;
        return dn === parseInt(riskFilter);
    }, [riskFilter]);

    // Map Tiles URLs
    const tiles = {
        dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    }

    /* ---------------- SEARCH CENTERING ---------------- */
    useEffect(() => {
        if (searchTarget && map) {
            const targetBounds = L.geoJSON(searchTarget).getBounds();
            map.fitBounds(targetBounds, {
                padding: [50, 50],
                maxZoom: 14,
                animate: true,
                duration: 1.5
            });

            // Automatically open popup for searched panchayat
            map.eachLayer((layer) => {
                if (layer.feature && layer.feature.properties?.PANCHAYAT === searchTarget.properties?.PANCHAYAT) {
                    layer.openPopup();
                }
            });
        }
    }, [searchTarget, map]);

    /* ---------------- FLOOD COLOR ---------------- */
    const getRiskColor = (dn) => {
        if (dn >= 4) return "#ef4444"
        if (dn === 3) return "#fb923c"
        if (dn === 2) return "#eab308"
        return "#22c55e"
    }

    const floodStyle = useCallback((feature) => {
        return {
            fillColor: getRiskColor(feature.properties?.DN),
            weight: 1,
            color: "white",
            fillOpacity: 0.7
        };
    }, []);

    const panchayatStyle = useMemo(() => ({
        color: "#38bdf8",
        weight: 2,
        fillOpacity: 0
    }), []);

    /* ---------------- CLICK EVENTS ---------------- */
    const floodClick = useCallback((feature, layer) => {
        layer.on({
            click: () => {
                setSelected(feature.properties);
            }
        });
    }, []);

    const panchayatClick = useCallback((feature, layer) => {
        const p = feature.properties;
        layer.bindPopup(`
            <div class="premium-popup">
                <div class="popup-header">
                    <span class="popup-tag">ADMINISTRATIVE BOUNDARY</span>
                    <h3>${p.PANCHAYAT || 'Unknown Panchayat'}</h3>
                </div>
                <div class="popup-body">
                    <div class="popup-row">
                        <span class="popup-label">District</span>
                        <span class="popup-val">${p.DISTRICT || 'N/A'}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Block</span>
                        <span class="popup-val">${p.BLOCK || 'N/A'}</span>
                    </div>
                </div>
                <div class="popup-footer">
                    <div class="zoom-hint">Click to focus area</div>
                </div>
            </div>
        `, {
            className: 'premium-leaflet-popup',
            maxWidth: 300
        });

        layer.on({
            click: (e) => {
                const mapInstance = e.target._map;
                if (mapInstance) {
                    mapInstance.fitBounds(e.target.getBounds(), {
                        padding: [50, 50],
                        maxZoom: 14,
                        animate: true
                    });
                }
            }
        });
    }, []);

    /* ---------------- MAP ---------------- */
    return (
        <div style={{ height: "100%" }}>
            <MapContainer
                center={[10.2, 76.45]}
                zoom={10}
                style={{ height: "100%" }}
                preferCanvas={true}
                ref={setMap}
            >
                <TileLayer
                    url={tiles[theme]}
                />

                {/* Panchayat Boundaries */}
                {panchayatData && (
                    <GeoJSON
                        key={`panchayat-${panchayatData.features?.length || 0}`}
                        data={panchayatData}
                        style={panchayatStyle}
                        onEachFeature={panchayatClick}
                    />
                )}

                {/* Flood Zones */}
                {floodData && (
                    <GeoJSON
                        key={`flood-${riskFilter}-${floodData.features?.length || 0}`}
                        data={floodData}
                        style={floodStyle}
                        onEachFeature={floodClick}
                        filter={filterFloodData}
                    />
                )}
            </MapContainer>
        </div>
    )
}

export default MapView;