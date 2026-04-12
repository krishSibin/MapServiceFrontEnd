import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, Pane } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Activity, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper component to handle map movement
const MapController = ({ searchTarget, selectedFeature, onSearchComplete, allLayers }) => {
    const map = useMap();
    const initialZoomRef = useRef(false);
    const lastLayerKeys = useRef("");

    // Aggressive Auto-Fit when data arrives/changes
    useEffect(() => {
        if (!allLayers || Object.keys(allLayers).length === 0) return;

        // USER FIX: Only auto-fit once during the initial startup.
        // Once the map has focused on the data, ignore any further layer toggles.
        if (initialZoomRef.current) {
            return;
        }

        const handleFit = () => {
            try {
                // Focus on panchayat or taluk as the main administrative unit
                const targetLayer = allLayers.panchayat || allLayers.taluk || allLayers.village || Object.values(allLayers).find(l => l.features?.length > 0);

                if (targetLayer && targetLayer.features?.length > 0) {
                    const layer = L.geoJSON(targetLayer);
                    const bounds = layer.getBounds();

                    if (bounds.isValid()) {
                        map.invalidateSize();
                        map.flyToBounds(bounds, {
                            padding: [50, 50],
                            duration: initialZoomRef.current ? 1.5 : 2.5,
                            easeLinearity: 0.1
                        });
                        initialZoomRef.current = true;
                    }
                }
            } catch (err) {
                console.warn("Auto-fit error:", err);
            }
        };

        handleFit();
    }, [allLayers, map]);

    // Focus on Search Target
    useEffect(() => {
        if (searchTarget && searchTarget.geometry) {
            try {
                const layer = L.geoJSON(searchTarget);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    map.flyToBounds(bounds, {
                        padding: [80, 80],
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

    // Focus on selection (Manual Clicks)
    const lastSelectedId = useRef(null);
    useEffect(() => {
        if (selectedFeature && selectedFeature.geometry) {
            const currentId = selectedFeature.properties?._uid ||
                selectedFeature.properties?.VILL_NAME ||
                selectedFeature.properties?.VILLAGE ||
                selectedFeature.properties?.NAME;

            if (currentId === lastSelectedId.current) return;
            lastSelectedId.current = currentId;

            try {
                const layer = L.geoJSON(selectedFeature);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    map.flyToBounds(bounds, {
                        padding: [100, 100],
                        duration: 1.2,
                        easeLinearity: 0.2
                    });
                }
            } catch (err) {
                console.warn("Selection bounds error:", err);
            }
        } else if (!selectedFeature) {
            lastSelectedId.current = null;
        }
    }, [selectedFeature, map]);

    // Ensure Leaflet resizes properly if the dashboard flex layout changes
    useEffect(() => {
        if (!map) return;
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(map.getContainer());
        return () => resizeObserver.disconnect();
    }, [map]);

    return null;
};

// Optimized individual GeoJSON layer component
const OptimizedLayer = React.memo(({ name, data, riskFilter, selectedFeature, getStyle, onSelect, interactive = true }) => {
    const geoJsonRef = useRef(null);

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

    useEffect(() => {
        if (geoJsonRef.current) {
            geoJsonRef.current.clearLayers();
            // Only add data if there are features
            if (layerData.features && layerData.features.length > 0) {
                geoJsonRef.current.addData(layerData);
            }
        }
    }, [layerData]);

    // Efficiency: Manually update styles when selection changes without re-creating the layer
    useEffect(() => {
        if (geoJsonRef.current) {
            geoJsonRef.current.setStyle((f) => getStyle(name, f, selectedFeature));
        }
    }, [selectedFeature, getStyle, name]);

    const selectedFeatureRef = useRef(selectedFeature);
    useEffect(() => {
        selectedFeatureRef.current = selectedFeature;
    }, [selectedFeature]);

    const onEachFeature = useCallback((feature, layer) => {
        if (!interactive) return;

        layer.on({
            click: (e) => {
                onSelect && onSelect({ ...feature, _layerName: name });
            },
            mouseover: (e) => {
                const l = e.target;
                const getMatchId = (f) => f?.properties?._uid || f?.properties?.PANCHAYAT || f?.properties?.PANCHAYATH || f?.properties?.TALUK || f?.properties?.VILLAGE || f?.properties?.VILL_NAME || f?.properties?.NAME || f?.properties?.VILLAGE_NA;
                const isSelected = selectedFeatureRef.current && (
                    name === selectedFeatureRef.current._layerName &&
                    getMatchId(feature) === getMatchId(selectedFeatureRef.current)
                );

                if (!isSelected) {
                    l.setStyle({ weight: 2.5, color: "#facc15" });
                }
            },
            mouseout: (e) => {
                const l = e.target;
                l.setStyle(getStyle(name, feature, selectedFeatureRef.current));
            }
        });
    }, [onSelect, name, getStyle, interactive]);

    return (
        <GeoJSON
            ref={geoJsonRef}
            key={`${name}-${riskFilter}`}
            data={layerData}
            style={(f) => getStyle(name, f, selectedFeature)}
            onEachFeature={interactive ? onEachFeature : undefined}
            interactive={interactive}
        />
    );
});

const MapView = ({ theme, layers, isInitialLoad, riskFilter, searchTarget, selectedFeature, onSelect, onSearchComplete }) => {
    const isDataLoading = isInitialLoad;

    const getStyle = React.useCallback((layerName, feature, selectedFeature) => {
        // ROBUST MATCHING FOR ALL ADMINISTRATIVE LEVELS
        const getId = (f) => f?.properties?._uid || f?.properties?.PANCHAYAT || f?.properties?.PANCHAYATH || f?.properties?.TALUK || f?.properties?.VILLAGE || f?.properties?.VILL_NAME || f?.properties?.NAME || f?.properties?.VILLAGE_NA;

        const targetId = getId(selectedFeature);
        const currentId = getId(feature);

        const isSelected = selectedFeature && (
            layerName === selectedFeature._layerName && (
                (feature.properties?._uid && feature.properties?._uid === selectedFeature.properties?._uid) ||
                (targetId && targetId === currentId)
            )
        );

        if (isSelected) {
            let shouldHighlight = true;
            if (layerName === 'taluk' && layers) {
                const activeLayers = Object.keys(layers).filter(k => layers[k]);
                if (activeLayers.length > 1) {
                    shouldHighlight = false;
                }
            }

            if (shouldHighlight) {
                return {
                    fillColor: "transparent",
                    color: layerName === 'panchayat' ? '#1e40af' : "#facc15",
                    weight: layerName === 'panchayat' ? 4.5 : 5,
                    opacity: 1,
                    dashArray: null
                };
            }
        }

        // --- Standard Layer Styles ---
        if (layerName === "flood") {
            return { fillColor: "#ef4444", fillOpacity: 0.7, weight: 1, color: "#991b1b" };
        }
        if (layerName === "crop") {
            return { fillColor: "#22c55e", fillOpacity: 0.5, color: "#166534", weight: 1 };
        }
        if (layerName === "taluk") {
            return { color: "#ffffff", weight: 4, fillColor: "transparent", fillOpacity: 0, opacity: 1 };
        }
        if (layerName === "panchayat") {
            return {
                color: "#e11d48",
                weight: 4.5,
                fillColor: "transparent",
                fillOpacity: 0,
                opacity: 0.8,
                dashArray: "5, 5"
            };
        }
        if (layerName === "village") {
            return { color: "#38bdf8", weight: 1.8, fillColor: "#38bdf8", fillOpacity: 0.01, opacity: 0.9 };
        }
        if (layerName === "roads") {
            return { color: "#f59e0b", weight: 3, opacity: 0.8 };
        }
        if (layerName === "settlement") {
            return { fillColor: "#0ea5e9", fillOpacity: 0.4, color: "#0369a1", weight: 1 };
        }

        return { color: "#94a3b8", weight: 1, fillOpacity: 0.1 };
    }, []);

    const layerOrder = ['taluk', 'crop', 'settlement', 'roads', 'flood', 'village', 'panchayat'];

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

                <MapController searchTarget={searchTarget} selectedFeature={selectedFeature} onSearchComplete={onSearchComplete} allLayers={layers} />

                {sortedLayers.map(([name, data]) => (
                    <Pane
                        name={`${name}-pane`}
                        key={`${name}-pane`}
                        style={{ zIndex: 200 + (layerOrder.indexOf(name) * 10) }}
                    >
                        <OptimizedLayer
                            name={name}
                            data={data}
                            riskFilter={riskFilter}
                            selectedFeature={selectedFeature}
                            getStyle={getStyle}
                            onSelect={onSelect}
                            interactive={['village', 'panchayat'].includes(name)}
                        />
                    </Pane>
                ))}


            </MapContainer>
        </div>
    );
};

export default React.memo(MapView);