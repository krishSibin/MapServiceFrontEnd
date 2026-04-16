import React, { useEffect, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper component to handle map movement
const MapController = ({ searchTarget }) => {
    const map = useMap();

    useEffect(() => {
        if (searchTarget && searchTarget.geometry) {
            try {
                const layer = L.geoJSON(searchTarget);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    map.flyToBounds(bounds, {
                        padding: [100, 100],
                        duration: 1.5,
                        easeLinearity: 0.25
                    });
                }
            } catch (err) {
                console.warn("Bounds error:", err);
            }
        }
    }, [searchTarget, map]);

    return null;
};

// Optimized individual GeoJSON layer component
const OptimizedLayer = React.memo(({ name, data, riskFilter, getStyle, onSelect, forceUpdateKey }) => {
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
                l.setStyle({ weight: 4 });
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
            key={`${name}-${riskFilter}-${forceUpdateKey}`}
            data={layerData}
            style={(f) => getStyle(name, f)}
            onEachFeature={onEachFeature}
            renderer={L.canvas()}
            interactive={onSelect !== null}
        />
    );
});

const MapView = ({ layers, riskFilter, searchTarget, selectedFeature, onSelect, onSearchComplete }) => {

    const isFeatureMatch = (f1, f2) => {
        if (!f1 || !f2) return false;
        // Check standard IDs or names
        const name1 = f1.properties?.PANCHAYAT || f1.properties?.TALUK || f1.properties?.name;
        const name2 = f2.properties?.PANCHAYAT || f2.properties?.TALUK || f2.properties?.name;
        if (name1 && name2 && name1 === name2) return true;

        // Fallback to string match of geometry/properties if names missing
        return JSON.stringify(f1.properties) === JSON.stringify(f2.properties);
    };

    const getStyle = useCallback((layerName, feature) => {
        const isHighlighted = isFeatureMatch(feature, selectedFeature) || isFeatureMatch(feature, searchTarget);

        if (isHighlighted) {
            return {
                color: "#f8fafc",
                weight: 6,
                fillColor: "transparent",
                fillOpacity: 0,
                dashArray: null
            };
        }

        if (layerName === "flood") {
            const dn = feature.properties?.DN;
            if (dn >= 4) return { fillColor: "#ef4444", fillOpacity: 0.6, weight: 1, color: "#991b1b" };
            if (dn === 3) return { fillColor: "#fb923c", fillOpacity: 0.6, weight: 1, color: "#9a3412" };
            if (dn === 2) return { fillColor: "#eab308", fillOpacity: 0.6, weight: 1, color: "#854d0e" };
            return { fillColor: "#22c55e", fillOpacity: 0.6, weight: 1, color: "#166534" };
        }

        if (layerName === "taluk") {
            return {
                color: "#fb923c",
                weight: 3,
                fillColor: "transparent",
                dashArray: "10, 10"
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
    }, [selectedFeature, searchTarget]);

    // Force update key to ensure GeoJSON redraws when selection changes
    const forceUpdateKey = useMemo(() => {
        return `${selectedFeature?.properties?.PANCHAYAT || ''}-${searchTarget?.properties?.PANCHAYAT || ''}-${Date.now()}`;
    }, [selectedFeature, searchTarget]);

    const popupPosition = useMemo(() => {
        if (selectedFeature && selectedFeature.geometry) {
            try {
                return L.geoJSON(selectedFeature).getBounds().getCenter();
            } catch (e) { return null; }
        }
        return null;
    }, [selectedFeature]);

    return (
        <MapContainer
            center={[10.2, 76.45]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            preferCanvas={true}
            zoomSnap={0.5}
            zoomDelta={0.5}
            wheelPxPerZoomLevel={120}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

            <MapController searchTarget={searchTarget} />

            {/* Render layers in specific order for correct stacking and selection */}
            {['flood', 'taluk', 'panchayat'].map(name => {
                const data = layers[name];
                if (!data) return null;
                return (
                    <OptimizedLayer
                        key={name}
                        name={name}
                        data={data}
                        riskFilter={riskFilter}
                        getStyle={getStyle}
                        onSelect={name === 'flood' ? null : onSelect}
                        forceUpdateKey={forceUpdateKey}
                    />
                );
            })}
        </MapContainer>
    );
};

export default MapView;