import React, { useEffect, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const MapView = ({
    theme = 'dark',
    riskFilter = 'all',
    panchayatData,
    floodData,
    searchTarget,
    selectedFeature,
    onSelect,
    onSearchComplete
}) => {

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
                maxZoom: 18,
                animate: true,
                duration: 1.5
            });

            // Automatically select and highlight searched panchayat
            onSelect(searchTarget);

            // Clear the search target so it doesn't conflict with manual clicks
            if (onSearchComplete) onSearchComplete();
        }
    }, [searchTarget, map, onSelect, onSearchComplete]);

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

    const panchayatStyle = useCallback((feature) => {
        const isSelected = selectedFeature && feature.properties?.PANCHAYAT === selectedFeature.properties?.PANCHAYAT;
        return {
            color: isSelected ? "#38bdf8" : "rgba(56, 189, 248, 0.5)",
            weight: isSelected ? 4 : 2,
            fillColor: isSelected ? "#38bdf8" : "transparent",
            fillOpacity: isSelected ? 0.2 : 0,
            dashArray: isSelected ? "" : "3"
        };
    }, [selectedFeature]);

    /* ---------------- CLICK EVENTS ---------------- */
    const floodClick = useCallback((feature, layer) => {
        layer.on({
            click: () => {
                onSelect(feature);
            }
        });
    }, [onSelect]);

    const panchayatClick = useCallback((feature, layer) => {
        const p = feature.properties;
        // Premium popup removed in favor of side overlay

        layer.on({
            click: (e) => {
                onSelect(feature);

                const mapInstance = e.target._map;
                if (mapInstance) {
                    mapInstance.fitBounds(e.target.getBounds(), {
                        padding: [50, 50],
                        maxZoom: 18,
                        animate: true
                    });
                }
            }
        });
    }, [onSelect]);

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
                        key={`panchayat-${panchayatData.features?.length || 0}-${selectedFeature?.properties?.PANCHAYAT || 'none'}`}
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