"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as d3 from "d3"

interface RotatingEarthProps {
    className?: string
}

// The globe always fills 100% of its container's width & height.
// The parent is responsible for sizing the container.
export default function RotatingEarth({ className = "" }: RotatingEarthProps) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // These refs keep canvas-related state alive across renders and ResizeObserver callbacks
    const projectionRef = useRef<d3.GeoProjection | null>(null)
    const rotationRef = useRef<[number, number]>([0, 0])
    const timerRef = useRef<d3.Timer | null>(null)
    const landFeaturesRef = useRef<any>(null)
    const allDotsRef = useRef<{ lng: number; lat: number }[]>([])
    const sizeRef = useRef({ w: 0, h: 0, radius: 0 })
    const dataLoadedRef = useRef(false)

    // ── Drawing ────────────────────────────────────────────────────────────────
    const render = useCallback(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        const projection = projectionRef.current
        if (!canvas || !ctx || !projection) return

        const { w, h, radius } = sizeRef.current
        const currentScale = projection.scale()
        const scaleFactor = currentScale / radius

        ctx.clearRect(0, 0, w, h)

        // Globe fill
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, currentScale, 0, 2 * Math.PI)
        ctx.fillStyle = "#000000"
        ctx.fill()

        // Globe edge
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, currentScale, 0, 2 * Math.PI)
        ctx.strokeStyle = "#00cfbf"
        ctx.lineWidth = 1 * scaleFactor
        ctx.globalAlpha = 0.4
        ctx.stroke()
        ctx.globalAlpha = 1

        if (landFeaturesRef.current) {
            const path = d3.geoPath().projection(projection).context(ctx)

            // Graticule
            const graticule = d3.geoGraticule()
            ctx.beginPath()
            path(graticule())
            ctx.strokeStyle = "#ffffff"
            ctx.lineWidth = 0.5 * scaleFactor
            ctx.globalAlpha = 0.15
            ctx.stroke()
            ctx.globalAlpha = 1

            // Land outlines
            ctx.beginPath()
            landFeaturesRef.current.features.forEach((feature: any) => path(feature))
            ctx.strokeStyle = "#ffffff"
            ctx.lineWidth = 0.8 * scaleFactor
            ctx.globalAlpha = 0.3
            ctx.stroke()
            ctx.globalAlpha = 1

            // Halftone dots
            ctx.fillStyle = "#00cfbf"
            allDotsRef.current.forEach((dot) => {
                const projected = projection([dot.lng, dot.lat])
                if (
                    projected &&
                    projected[0] >= 0 && projected[0] <= w &&
                    projected[1] >= 0 && projected[1] <= h
                ) {
                    ctx.beginPath()
                    ctx.arc(projected[0], projected[1], 1 * scaleFactor, 0, 2 * Math.PI)
                    ctx.fill()
                }
            })
        }
    }, [])

    // ── Resize: recalculate canvas size & projection center ──────────────────
    const applySize = useCallback((w: number, h: number) => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) return

        // Use the smaller dimension so the globe never clips
        const radius = Math.min(w, h) / 2.15
        const dpr = window.devicePixelRatio || 1

        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        ctx.scale(dpr, dpr)

        sizeRef.current = { w, h, radius }

        if (!projectionRef.current) {
            projectionRef.current = d3
                .geoOrthographic()
                .scale(radius)
                .translate([w / 2, h / 2])
                .clipAngle(90)
        } else {
            projectionRef.current
                .scale(radius)
                .translate([w / 2, h / 2])
        }

        render()
    }, [render])

    // ── Dot generation helpers ─────────────────────────────────────────────────
    const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
        const [x, y] = point
        let inside = false
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i]
            const [xj, yj] = polygon[j]
            if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                inside = !inside
            }
        }
        return inside
    }

    const pointInFeature = (point: [number, number], feature: any): boolean => {
        const { type, coordinates } = feature.geometry
        if (type === "Polygon") {
            if (!pointInPolygon(point, coordinates[0])) return false
            for (let i = 1; i < coordinates.length; i++) {
                if (pointInPolygon(point, coordinates[i])) return false
            }
            return true
        }
        if (type === "MultiPolygon") {
            for (const poly of coordinates) {
                if (pointInPolygon(point, poly[0])) {
                    const inHole = poly.slice(1).some((ring: number[][]) => pointInPolygon(point, ring))
                    if (!inHole) return true
                }
            }
        }
        return false
    }

    const generateDots = (feature: any, dotSpacing = 24) => {
        const dots: [number, number][] = []
        const [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds(feature)
        const step = dotSpacing * 0.08
        for (let lng = minLng; lng <= maxLng; lng += step) {
            for (let lat = minLat; lat <= maxLat; lat += step) {
                const pt: [number, number] = [lng, lat]
                if (pointInFeature(pt, feature)) dots.push(pt)
            }
        }
        return dots
    }

    // ── Load GeoJSON once ─────────────────────────────────────────────────────
    useEffect(() => {
        if (dataLoadedRef.current) return
        dataLoadedRef.current = true

        const load = async () => {
            try {
                const res = await fetch(
                    "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json"
                )
                if (!res.ok) throw new Error("Failed to load land data")
                const json = await res.json()
                landFeaturesRef.current = json

                const dots: { lng: number; lat: number }[] = []
                json.features.forEach((feature: any) => {
                    generateDots(feature).forEach(([lng, lat]) => dots.push({ lng, lat }))
                })
                allDotsRef.current = dots

                setIsLoading(false)
                render()
            } catch {
                setError("Failed to load land map data")
                setIsLoading(false)
            }
        }

        load()
    }, [render])

    // ── ResizeObserver: drives canvas re-sizing on every container resize ──────
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return

        const ro = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            const { width, height } = entry.contentRect
            if (width > 0 && height > 0) {
                applySize(Math.floor(width), Math.floor(height))
            }
        })
        ro.observe(wrapper)

        // Run once immediately in case ResizeObserver fires late
        const { width, height } = wrapper.getBoundingClientRect()
        if (width > 0 && height > 0) applySize(Math.floor(width), Math.floor(height))

        return () => ro.disconnect()
    }, [applySize])

    // ── Animation loop ─────────────────────────────────────────────────────────
    useEffect(() => {
        let autoRotate = true

        const tick = () => {
            if (autoRotate && projectionRef.current) {
                rotationRef.current[0] += 0.5
                projectionRef.current.rotate(rotationRef.current)
                render()
            }
        }

        timerRef.current = d3.timer(tick)

        // Mouse drag to rotate
        const canvas = canvasRef.current
        if (!canvas) return

        const onMouseDown = (e: MouseEvent) => {
            autoRotate = false
            const startX = e.clientX
            const startY = e.clientY
            const startRot = [...rotationRef.current] as [number, number]

            const onMove = (me: MouseEvent) => {
                const dx = me.clientX - startX
                const dy = me.clientY - startY
                rotationRef.current[0] = startRot[0] + dx * 0.5
                rotationRef.current[1] = Math.max(-90, Math.min(90, startRot[1] - dy * 0.5))
                projectionRef.current?.rotate(rotationRef.current)
                render()
            }

            const onUp = () => {
                document.removeEventListener("mousemove", onMove)
                document.removeEventListener("mouseup", onUp)
                setTimeout(() => { autoRotate = true }, 10)
            }

            document.addEventListener("mousemove", onMove)
            document.addEventListener("mouseup", onUp)
        }

        canvas.addEventListener("mousedown", onMouseDown)

        return () => {
            timerRef.current?.stop()
            canvas.removeEventListener("mousedown", onMouseDown)
        }
    }, [render])

    if (error) {
        return (
            <div className={`flex items-center justify-center ${className}`}>
                <p className="text-red-400 text-sm">Earth visualization unavailable</p>
            </div>
        )
    }

    return (
        // wrapperRef fills 100% — parent controls the size
        <div
            ref={wrapperRef}
            className={`relative w-full h-full ${className}`}
        >
            <canvas
                ref={canvasRef}
                className={`block transition-[opacity,filter] duration-1000 ${isLoading ? "opacity-20 blur-sm" : "opacity-100 blur-0"}`}
            />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-1/2 h-1/2 bg-[#00cfbf]/10 blur-[100px] rounded-full animate-pulse text-[#00cfbf] text-[10px] flex items-center justify-center tracking-[0.5em] font-black capitalize">
                        Initializing Spatial Mesh
                    </div>
                </div>
            )}
        </div>
    )
}