import React, { useEffect, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper component to handle map movement
const MapController = ({ searchTarget, onSearchComplete }) => {
    const map = useMap();

    useEffect(() => {
        if (searchTarget && searchTarget.geometry) {
            try {
                const layer = L.geoJSON(searchTarget);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    map.flyToBounds(bounds, {
                        padding: [50, 50],
                        duration: 1.5,
                        easeLinearity: 0.25
                    });
                }
            } catch (err) {
                console.warn("Bounds error:", err);
            }
            if (onSearchComplete) onSearchComplete();
        }
    }, [searchTarget, map, onSearchComplete]);

    return null;
};

// Optimized individual GeoJSON layer component to prevent unnecessary re-renders
const OptimizedLayer = React.memo(({ name, data, riskFilter, getStyle, onSelect }) => {
    const filteredFeatures = useMemo(() => {
        if (!data || !data.features) return [];
        if (riskFilter === "all") return data.features;

        return data.features.filter(f => {
            const dn = f.properties?.DN;
            if (dn !== undefined && dn !== null) {
                return dn.toString() === riskFilter;
            }
            return true;
        });
    }, [data, riskFilter]);

    const layerData = useMemo(() => ({
        type: "FeatureCollection",
        features: filteredFeatures
    }), [filteredFeatures]);

    const onEachFeature = useCallback((feature, layer) => {
        layer.on({
            click: (e) => {
                L.DomEvent.stopPropagation(e);
                onSelect && onSelect({ ...feature, _layerName: name });
            },
            mouseover: (e) => {
                const l = e.target;
                l.setStyle({ fillOpacity: 0.9, weight: 2 });
            },
            mouseout: (e) => {
                const l = e.target;
                l.setStyle(getStyle(name, feature));
            }
        });
    }, [onSelect, name, getStyle]);

    if (filteredFeatures.length === 0) return null;

    return (
        <GeoJSON
            key={`${name}-${riskFilter}`}
            data={layerData}
            style={(f) => getStyle(name, f)}
            onEachFeature={onEachFeature}
            // Use canvas for better performance with large sets
            renderer={L.canvas()}
        />
    );
});

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
            preferCanvas={true} // Boost performance by using canvas instead of SVG
            zoomSnap={0.5}
            zoomDelta={0.5}
            wheelPxPerZoomLevel={120} // Make zooming feel smoother
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

            <MapController searchTarget={searchTarget} onSearchComplete={onSearchComplete} />

            {Object.entries(layers).map(([name, data]) => (
                <OptimizedLayer
                    key={name}
                    name={name}
                    data={data}
                    riskFilter={riskFilter}
                    getStyle={getStyle}
                    onSelect={onSelect}
                />
            ))}
        </MapContainer>
    );
};

export default MapView;