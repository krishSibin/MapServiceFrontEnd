import React, { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper component to handle map movement
const MapController = ({ searchTarget, onSearchComplete }) => {
    const map = useMap();

    useEffect(() => {
        if (searchTarget && searchTarget.geometry) {
            const bounds = L.geoJSON(searchTarget).getBounds();
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
            if (onSearchComplete) onSearchComplete();
        }
    }, [searchTarget, map, onSearchComplete]);

    return null;
};

const MapView = ({ layers, riskFilter, searchTarget, onSelect, onSearchComplete }) => {

    const getStyle = (layerName, feature) => {
        if (layerName === "flood") {
            const dn = feature.properties?.DN;
            if (dn >= 4) return { fillColor: "#ef4444", fillOpacity: 0.7, weight: 1, color: "#991b1b" };
            if (dn === 3) return { fillColor: "#fb923c", fillOpacity: 0.7, weight: 1, color: "#9a3412" };
            if (dn === 2) return { fillColor: "#eab308", fillOpacity: 0.7, weight: 1, color: "#854d0e" };
            return { fillColor: "#22c55e", fillOpacity: 0.7, weight: 1, color: "#166534" };
        }

        if (layerName === "crop") {
            return {
                fillColor: "#84cc16",
                fillOpacity: 0.5,
                color: "#365314",
                weight: 1
            };
        }

        if (layerName === "roads") {
            return {
                color: "#f97316",
                weight: 3,
                opacity: 0.8
            };
        }

        if (layerName === "settlement") {
            return {
                fillColor: "#38bdf8",
                fillOpacity: 0.4,
                color: "#075985",
                weight: 1
            };
        }

        if (layerName === "panchayat") {
            return {
                color: "#38bdf8",
                weight: 2,
                fillColor: "transparent",
                dashArray: "5, 5"
            }
        }

        return { color: "#94a3b8", weight: 1, fillOpacity: 0.1 };
    };

    return (
        <MapContainer
            center={[10.2, 76.45]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

            <MapController searchTarget={searchTarget} onSearchComplete={onSearchComplete} />

            {Object.entries(layers).map(([name, data]) => {
                if (!data) return null;

                // Apply risk filter to flood layer
                let filteredData = data;
                if (name === "flood" && riskFilter !== "all") {
                    filteredData = {
                        ...data,
                        features: data.features.filter(f => f.properties.DN.toString() === riskFilter)
                    };
                }

                return (
                    <GeoJSON
                        key={`${name}-${riskFilter}`}
                        data={filteredData}
                        style={(f) => getStyle(name, f)}
                        onEachFeature={(feature, layer) => {
                            layer.on({
                                click: () => onSelect && onSelect(feature)
                            });
                        }}
                    />
                );
            })}
        </MapContainer>
    );
};

export default MapView;