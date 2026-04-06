"use client"

import React, { useRef, useMemo } from "react"
import RotatingEarth from "./ui/wireframe-dotted-globe"
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, useSpring } from "framer-motion"
import { ArrowRight, Globe, Waves, Flame, Mountain, Wind } from "lucide-react"
import "./LandingPage.css"

interface LandingPageProps {
    onStart: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const heroRef = useRef<HTMLDivElement>(null)
    const [selectedId, setSelectedId] = React.useState("flood")

    const { scrollYProgress: globalScroll } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    const { scrollYProgress: heroScroll } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    })

    // Very snappy smoothing for immediate 'locked-in' feel
    const smoothProgress = useSpring(heroScroll, {
        stiffness: 500,
        damping: 40,
        restDelta: 0.001
    })

    // Hero & Globe (Immersive Parallax Scaling)
    const globeScale = useTransform(smoothProgress, [0, 1], [1, 0.4])
    const globeOpacity = useTransform(smoothProgress, [0, 1], [1, 0.3]) // Stays translucent
    const globeY = useTransform(smoothProgress, [0, 1], [0, 150]) // Moves slower for parallax

    const heroOpacity = useTransform(smoothProgress, [0, 0.5], [1, 0])
    const heroY = useTransform(smoothProgress, [0, 0.5], [0, -150])

    // Global Scroll Parallax (Depth)
    const bgY = useTransform(globalScroll, [0, 1], ["0%", "20%"])
    const starY = useTransform(globalScroll, [0, 1], ["0%", "-10%"])
    const fastY = useTransform(globalScroll, [0, 1], ["0%", "40%"])

    const dashboards = [
        { id: "flood", title: "Flood", desc: "Real-time inundation mapping and risk assessment.", icon: <Waves /> },
        { id: "forest-fire", title: "Forest Fire", desc: "Thermal hotspot detection and spread prediction.", icon: <Flame />, isSoon: true },
        { id: "landslide", title: "Landslide", desc: "Terrain stability analysis and early warning systems.", icon: <Mountain />, isSoon: true },
        { id: "cyclone", title: "Cyclone", desc: "Trajector mapping and wind speed intensity tracking.", icon: <Wind />, isSoon: true }
    ]

    return (
        <div ref={containerRef} className="dark min-h-screen bg-black text-white selection:bg-[#00cfbf] font-inter relative overflow-x-hidden">

            {/* Premium Multi-Layered Depth Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden mesh-background">
                {/* Slow Layer: Grid */}
                <motion.div
                    style={{ y: bgY }}
                    className="absolute inset-0 dot-grid opacity-40 will-change-transform"
                />

                {/* Mid Layer: Stars/Points */}
                <motion.div
                    style={{ y: starY }}
                    className="absolute inset-0 opacity-20 will-change-transform"
                >
                    <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                    <div className="absolute top-[60%] left-[80%] w-1.5 h-1.5 bg-[#00cfbf] rounded-full shadow-[0_0_15px_#00cfbf]"></div>
                    <div className="absolute top-[10%] left-[70%] w-1 h-1 bg-blue-400 rounded-full"></div>
                    <div className="absolute top-[80%] left-[30%] w-2 h-2 bg-white/20 rounded-full blur-[1px]"></div>
                </motion.div>

                {/* Fast Layer: Glows */}
                <motion.div style={{ y: fastY }} className="absolute inset-0 will-change-transform">
                    <motion.div
                        animate={{ opacity: [0.03, 0.08, 0.03], scale: [1, 1.1, 1] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-[#00cfbf]/5 blur-[150px] rounded-full"
                    />
                    <motion.div
                        animate={{ opacity: [0.03, 0.06, 0.03], scale: [1.1, 1, 1.1] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-[-10%] right-[0%] w-[700px] h-[700px] bg-blue-500/5 blur-[200px] rounded-full"
                    />
                </motion.div>

                {/* Fixed Overlay */}
                <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(transparent_50%,#fff_50%)] bg-[length:100%_4px]"></div>
            </div>

            {/* Global Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 md:px-12 py-4 md:py-5 backdrop-blur-xl bg-black/40 border-b border-white/5">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl flex items-center justify-center btn-glow overflow-hidden p-1">
                        <img src="/nexira-spatial-logo.jpg" alt="Nexira Spatial Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-lg md:text-2xl font-outfit font-black uppercase tracking-tighter">Nexira <span className="text-[#00cfbf]">Spatial</span></span>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] text-[#00cfbf]">Ready for {selectedId.replace('-', ' ')}</span>
                    <button
                        onClick={onStart}
                        className="px-4 md:px-8 py-2 md:py-3 relative overflow-hidden bg-[#00cfbf]/10 border border-[#00cfbf]/50 text-[#00cfbf] rounded-full font-bold text-sm md:text-base transition-all duration-300 hover:bg-[#00cfbf] hover:text-black hover:shadow-[0_0_30px_rgba(0,207,191,0.5)] active:scale-95 group flex items-center gap-2"
                    >
                        <span className="relative z-10">Launch</span>
                        <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    </button>
                </div>
            </nav>

            {/* Pinned Hero & Globe Section */}
            <section ref={heroRef} className="relative h-[120vh] z-10">
                <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-6 pt-20">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ opacity: heroOpacity, y: heroY }}
                        className="z-20 text-center px-4 relative top-[-4vh] md:top-[-6vh]"
                    >
                        <div className="inline-block px-2 md:px-4 py-0.5 md:py-1 rounded-full bg-neutral-900/80 backdrop-blur-md border border-white/10 text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-4 md:mb-8 text-[#00cfbf]">
                            Global Infrastructure v2.0
                        </div>
                        <h1 className="text-[3.5rem] sm:text-[5rem] md:text-[8rem] font-outfit font-black tracking-tighter leading-[0.85] mb-6 md:mb-10 text-gradient-premium">
                            Intelligence, <br /> <span className="bg-gradient-to-r from-[#00cfbf] to-blue-500 bg-clip-text text-transparent italic">Mapped.</span>
                        </h1>
                        <p className="text-xs md:text-2xl text-neutral-400 max-w-[280px] md:max-w-2xl mx-auto leading-relaxed font-medium text-balance opacity-60 mt-4 md:mt-0">
                            The world's most advanced spatial analytics engine for high-fidelity asset monitoring.
                        </p>
                    </motion.div>

                    {/* Globe Container - Zero-Clipping Framing */}
                    <motion.div
                        style={{ scale: globeScale, opacity: globeOpacity, y: globeY }}
                        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none will-change-transform top-[-2vh] md:top-[-4vh]"
                    >
                        <div className="absolute inset-0 bg-[#00cfbf]/5 blur-[80px] md:blur-[200px] rounded-full scale-110 md:scale-75"></div>
                        <RotatingEarth width={window.innerWidth < 768 ? 680 : 900} height={window.innerWidth < 768 ? 680 : 900} className="max-w-[100vw] max-h-screen" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="absolute bottom-[18%] md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-neutral-500"
                    >
                        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Explore</span>
                        <motion.div
                            animate={{ y: [0, 4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ArrowRight className="w-4 h-4 rotate-90 opacity-50" />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Dashboards Section */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                    hidden: { opacity: 0, scale: 0.9, y: 100, filter: "blur(10px)" },
                    visible: {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        filter: "blur(0px)",
                        transition: {
                            type: "spring",
                            stiffness: 100,
                            damping: 20,
                            staggerChildren: 0.15,
                            delayChildren: 0.1
                        }
                    }
                }}
                className="relative z-30 min-h-screen flex flex-col items-center justify-center py-32 px-6 max-w-7xl mx-auto perspective-2000"
            >
                {/* Decorative Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00cfbf]/5 blur-[120px] rounded-full opacity-50"></div>
                </div>

                <div className="flex flex-col items-center w-full relative z-10">
                    <div className="text-center mb-12 md:mb-20">
                        <motion.h2
                            variants={{
                                hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    filter: "blur(0px)",
                                    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
                                }
                            }}
                            className="text-3xl md:text-6xl font-outfit font-black tracking-tighter mb-3 md:mb-4"
                        >
                            Select Your <span className="text-[#00cfbf]">Interface.</span>
                        </motion.h2>
                        <p className="text-neutral-400 max-w-xl mx-auto text-sm md:text-xl font-medium tracking-tight opacity-60">
                            Deploy specialized mission-critical monitoring systems tailored to the objective.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 w-full">
                        {dashboards.map((db) => (
                            <FeatureCard
                                key={db.id}
                                icon={db.icon}
                                title={db.title}
                                desc={db.desc}
                                isSoon={db.isSoon}
                                isSelected={selectedId === db.id}
                                onClick={() => setSelectedId(db.id)}
                            />
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Footer / Final CTA - Symmetric Sequential Layout */}
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative z-30 min-h-screen flex flex-col items-center justify-center text-center border-t border-white/5 bg-gradient-to-b from-transparent to-neutral-950 px-6"
            >
                <div className="flex flex-col items-center justify-center flex-grow">
                    <div className="inline-block px-3 py-1 rounded-full bg-[#00cfbf]/10 border border-[#00cfbf]/20 text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] mb-6 md:mb-12 text-[#00cfbf] animate-pulse">
                        Engine v2.0
                    </div>
                    <h2 className="text-4xl md:text-[10rem] font-outfit font-black mb-8 md:mb-16 tracking-tighter leading-[0.85] uppercase text-gradient-premium">
                        MAP THE <br /> <span className="text-[#00cfbf]">UNSEEN DATA.</span>
                    </h2>
                    <button
                        onClick={onStart}
                        className="px-10 py-5 md:px-32 md:py-10 relative overflow-hidden bg-[#00cfbf]/10 border border-[#00cfbf]/50 text-[#00cfbf] rounded-full font-black text-lg md:text-3xl transition-all duration-500 hover:bg-[#00cfbf] hover:text-black hover:shadow-[0_0_80px_rgba(0,207,191,0.6)] active:scale-95 group flex items-center gap-4 mb-16 md:mb-24"
                    >
                        <span className="relative z-10 tracking-widest uppercase">LAUNCH PLATFORM</span>
                        <ArrowRight className="w-6 h-6 md:w-10 md:h-10 relative z-10 group-hover:translate-x-2 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    </button>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-24 text-center opacity-40 hover:opacity-100 transition-opacity duration-1000 px-4">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-5xl font-outfit font-bold">1.2s</span>
                            <span className="text-[8px] md:text-xs uppercase tracking-[0.3em] font-black text-[#00cfbf] mt-1 md:mt-2">Live Sync</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-5xl font-outfit font-bold">32+</span>
                            <span className="text-[8px] md:text-xs uppercase tracking-[0.3em] font-black text-[#00cfbf] mt-1 md:mt-2">Active Layers</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-5xl font-outfit font-bold">98%</span>
                            <span className="text-[8px] md:text-xs uppercase tracking-[0.3em] font-black text-[#00cfbf] mt-1 md:mt-2">Accuracy</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-5xl font-outfit font-bold">Inst.</span>
                            <span className="text-[8px] md:text-xs uppercase tracking-[0.3em] font-black text-[#00cfbf] mt-1 md:mt-2">Response</span>
                        </div>
                    </div>
                </div>
                <footer className="absolute bottom-6 md:bottom-12 left-0 right-0 text-center text-neutral-700 text-[7px] md:text-[9px] tracking-[0.3em] md:tracking-[0.6em] font-black uppercase font-inter opacity-40">
                    &copy; 2026 Nexira Spatial &bull; Systems <span className="text-[#00cfbf]">Active</span>
                </footer>
            </motion.section>
        </div>
    )
}

const FeatureCard = ({ icon, title, desc, isSoon, isSelected, onClick }: { icon: React.ReactElement, title: string, desc: string, isSoon?: boolean, isSelected: boolean, onClick: () => void }) => {
    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`p-3 md:p-12 min-h-[200px] md:min-h-[420px] rounded-[1.5rem] md:rounded-[3rem] border transition-all duration-500 cursor-pointer flex flex-col items-start group relative overflow-hidden ${isSelected
                ? 'border-[#00cfbf] bg-neutral-900/60 shadow-[0_40px_100px_-20px_rgba(0,207,191,0.25)]'
                : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-neutral-900/40'
                }`}
        >
            {/* Smooth Atmospheric Selection Sweep */}
            {isSelected && (
                <motion.div
                    key={`sweep-${title}`}
                    initial={{ x: "-120%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute inset-y-0 w-64 blur-[100px] opacity-20 z-30 pointer-events-none ${isSoon ? 'bg-amber-500' : 'bg-[#00cfbf]'}`}
                    style={{ mixBlendMode: 'screen', skewX: '-30deg' }}
                />
            )}

            {/* Active Marker - Persistent Bottom Glow (Retained after wave) */}
            <motion.div
                initial={false}
                animate={{ opacity: isSelected ? 1 : 0, scaleX: isSelected ? 1 : 0 }}
                transition={{ duration: 1, ease: [0.13, 1, 0.32, 1] }}
                className={`absolute bottom-0 left-12 right-12 h-[2px] rounded-full z-20 ${isSoon ? 'bg-amber-500 shadow-[0_-8px_15px_rgba(245,158,11,0.8)]' : 'bg-[#00cfbf] shadow-[0_-8px_15px_rgba(0,207,191,0.8)]'}`}
            />

            <div className={`w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-12 transition-all duration-500 ${isSelected ? (isSoon ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 'bg-[#00cfbf] text-black shadow-lg shadow-[#00cfbf]/30') : 'bg-neutral-800 text-white/30'
                }`}>
                {React.cloneElement(icon, { className: "w-6 h-6 md:w-10 md:h-10" } as any)}
            </div>

            <h3 className={`text-xl md:text-4xl font-outfit font-black tracking-tighter mb-2 md:mb-6 uppercase transition-colors ${isSelected ? 'text-white' : 'text-neutral-700'
                }`}>
                {title}
            </h3>
            <p className={`text-[10px] md:text-xl font-medium leading-relaxed transition-colors ${isSelected ? 'text-neutral-400' : 'text-neutral-800'
                }`}>
                {desc}
            </p>

            {/* Stable Footer - Always rendered to prevent height jumps */}
            <div className="mt-auto w-full pt-4 md:pt-10">
                <motion.div
                    initial={false}
                    animate={{ opacity: isSelected ? 1 : 0, y: isSelected ? 0 : 10 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-between"
                >
                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] animate-pulse ${isSoon ? 'text-amber-500' : 'text-[#00cfbf]'}`}>
                        {isSoon ? 'Coming Soon' : 'Active'}
                    </span>
                    <ArrowRight className={`w-3 h-3 md:w-6 md:h-6 ${isSoon ? 'text-amber-500 opacity-50' : 'text-[#00cfbf]'}`} />
                </motion.div>
            </div>
        </motion.div>
    )
}

export default LandingPage
