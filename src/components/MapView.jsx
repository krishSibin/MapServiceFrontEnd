import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Activity, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper component to handle map movement
const MapController = ({ searchTarget, onSearchComplete, allLayers }) => {
    const map = useMap();
    const initialZoomRef = useRef(false);

    // Initial Auto-Fit when data arrives
    useEffect(() => {
        if (!allLayers || Object.keys(allLayers).length === 0 || initialZoomRef.current) return;

        const handleInitialFit = () => {
            try {
                // Focus on panchayat layer or any valid layer
                const targetLayer = allLayers.panchayat || Object.values(allLayers).find(l => l.features?.length > 0);

                if (targetLayer && targetLayer.features?.length > 0) {
                    const layer = L.geoJSON(targetLayer);
                    const bounds = layer.getBounds();

                    if (bounds.isValid()) {
                        setTimeout(() => {
                            map.invalidateSize();
                            map.flyToBounds(bounds, {
                                padding: [50, 50],
                                duration: 2.5,
                                easeLinearity: 0.1
                            });
                            initialZoomRef.current = true;
                        }, 800);
                    }
                }
            } catch (err) {
                console.warn("Auto-fit error:", err);
            }
        };

        handleInitialFit();
    }, [allLayers, map]);

    // Search focus fit
    useEffect(() => {
        if (searchTarget && searchTarget.geometry) {
            try {
                const layer = L.geoJSON(searchTarget);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    map.flyToBounds(bounds, {
                        padding: [60, 60],
                        duration: 1.5,
                        easeLinearity: 0.25
                    });
                }
            } catch (err) {
                console.warn("Search bounds error:", err);
            }
            if (onSearchComplete) onSearchComplete();
        }
    }, [searchTarget, map, onSearchComplete]);

    return null;
};

// Optimized individual GeoJSON layer component
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
            renderer={L.canvas()}
        />
    );
});

const MapView = ({ theme, layers, isInitialLoad, riskFilter, searchTarget, onSelect, onSearchComplete }) => {
    const isDataLoading = isInitialLoad;

    const getStyle = React.useCallback((layerName, feature) => {
        if (layerName === "flood") {
            return {
                fillColor: "#ef4444",
                fillOpacity: 0.7,
                weight: 1,
                color: "#991b1b"
            }
        }

        if (layerName === "crop") {
            return {
                fillColor: "#22c55e",
                fillOpacity: 0.5,
                color: "#166534",
                weight: 1
            };
        }

        if (layerName === "roads") {
            return {
                color: "#f59e0b",
                weight: 3,
                opacity: 0.8
            };
        }

        if (layerName === "settlement") {
            return {
                fillColor: "#0ea5e9",
                fillOpacity: 0.4,
                color: "#0369a1",
                weight: 1
            };
        }

        if (layerName === "panchayat") {
            return {
                color: "#38bdf8",
                weight: 2.5,
                fillColor: "transparent",
                opacity: 0.9
            }
        }

        if (layerName === "admin") {
            return {
                color: "#a855f7",
                weight: 2,
                fillColor: "transparent",
                opacity: 0.8,
                dashArray: "4, 8"
            }
        }

        return { color: "#94a3b8", weight: 1, fillOpacity: 0.1 };
    }, []);

    const layerOrder = ['settlement', 'crop', 'roads', 'flood', 'admin', 'panchayat'];

    const sortedLayers = useMemo(() => {
        if (!layers) return [];
        return Object.entries(layers).sort(([a], [b]) => {
            return layerOrder.indexOf(a) - layerOrder.indexOf(b);
        });
    }, [layers]);

    const tileUrl = theme === 'light'
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    return (
        <div className="relative w-full h-full">
            <AnimatePresence>
                {isDataLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[2000] bg-[#0b1219]/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-6"
                    >
                        <div className="relative w-24 h-24">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-2 border-t-[#38bdf8] border-r-transparent border-b-transparent border-l-transparent rounded-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Globe size={40} className="text-[#38bdf8] opacity-50 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="text-white font-outfit font-black uppercase tracking-[0.3em] text-xs">Initializing Regions</div>
                            <div className="text-neutral-500 text-[10px] font-medium tracking-[0.2em] uppercase flex items-center gap-2 justify-center">
                                <Loader2 size={10} className="animate-spin text-[#38bdf8]" /> Syncing Spatial Data Core
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <MapContainer
                center={[10.2, 76.45]}
                zoom={10}
                style={{ height: "100%", width: "100%" }}
                preferCanvas={true}
                zoomSnap={0.5}
                zoomDelta={0.5}
                wheelPxPerZoomLevel={120}
            >
                <TileLayer url={tileUrl} />

                <MapController searchTarget={searchTarget} onSearchComplete={onSearchComplete} allLayers={layers} />

                {sortedLayers.map(([name, data]) => (
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
        </div>
    );
};

export default React.memo(MapView);