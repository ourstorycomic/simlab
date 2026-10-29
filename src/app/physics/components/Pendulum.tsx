"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Tour, TourStep } from "@/components/Tour";
import { Target, SlidersHorizontal, BarChart2, Maximize2, Minimize2, Lightbulb, X, Tv, Play, Pause, RotateCcw } from "lucide-react";

const InfoTooltip = ({ title, content }: { title: string; content: React.ReactNode }) => (
    <div className="relative group ml-2 inline-block">
        <svg className="w-4 h-4 text-slate-400 hover:text-indigo-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-slate-200 text-xs rounded-xl shadow-2xl border border-slate-700 z-50">
            <p className="font-bold text-indigo-400 mb-1">{title}</p>
            {content}
            <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-slate-800" />
        </div>
    </div>
);

export default function Pendulum() {
    const [tourOpen, setTourOpen] = useState(false);
    const [mobileTab, setMobileTab] = useState<"sim" | "controls" | "energy">("sim");
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);

    const tourSteps: TourStep[] = [
        { target: "#pendulum-canvas", title: "Kéo thả quả nặng", description: "Bấm giữ và kéo quả bóng này để thay đổi góc lệch ban đầu (Biên độ), sau đó thả tay ra để con lắc TỰ ĐỘNG dao động." },
        { target: "#pendulum-stats", title: "Thông số Trực tiếp", description: "Theo dõi Góc lệch, Chu kỳ, Vận tốc thay đổi liên tục khi con lắc chuyển động." },
        { target: "#pendulum-controls", title: "Bảng Điều khiển", description: "Bạn có thể thay đổi Chiều dài dây, Khối lượng, Lực cản không khí và Hành tinh để quan sát sự thay đổi." },
        { target: "#pendulum-energy", title: "Bảo toàn Cơ năng", description: "Biểu đồ này cho thấy sự chuyển hóa liên tục giữa Động năng và Thế năng. Tổng Cơ năng luôn được bảo toàn nếu không có lực cản." }
    ];

    // Physics Parameters
    const [length, setLength] = useState(2); // Length in meters (1 to 5)
    const [gravity, setGravity] = useState(9.8); // Gravity in m/s^2
    const [mass, setMass] = useState(2); // Mass in kg
    const [friction, setFriction] = useState(0); // Friction/Damping factor
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [showVectors, setShowVectors] = useState(true);
    const [showEnergy, setShowEnergy] = useState(true);

    // Dynamic State
    const [angle, setAngle] = useState(Math.PI / 4);
    const [velocity, setVelocity] = useState(0);
    const [energy, setEnergy] = useState({ kinetic: 0, potential: 0, total: 0 });
    
    // Refs for animation and interaction
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>();
    const isDraggingRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    
    // History trace
    const traceRef = useRef<{x: number, y: number}[]>([]);

    const scale = 70; // 1 meter = 70 pixels
    const originX = 300;
    const originY = 60;

    const resetSimulation = useCallback(() => {
        setIsPlaying(false);
        setAngle(Math.PI / 4);
        setVelocity(0);
        traceRef.current = [];
    }, []);

    // Calculate energies
    const updateEnergies = useCallback((currentAngle: number, currentVelocity: number) => {
        // v = omega * L
        const linearVel = currentVelocity * length;
        const kinetic = 0.5 * mass * linearVel * linearVel;
        
        // h = L - L * cos(theta)
        const height = length * (1 - Math.cos(currentAngle));
        const potential = mass * gravity * height;
        
        setEnergy({ kinetic, potential, total: kinetic + potential });
    }, [length, mass, gravity]);

    // Initial energy update
    useEffect(() => {
        if (!isPlaying) {
            updateEnergies(angle, velocity);
        }
    }, [length, mass, gravity, angle, velocity, isPlaying, updateEnergies]);

    const animate = useCallback((time: number) => {
        if (lastTimeRef.current != undefined && !isDraggingRef.current) {
            const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.05); // cap at 50ms
            
            setAngle(prevAngle => {
                let newVelocity = 0;
                setVelocity(prevVelocity => {
                    const angularAccel = -(gravity / length) * Math.sin(prevAngle);
                    newVelocity = prevVelocity + angularAccel * deltaTime;
                    
                    // Apply damping
                    if (friction > 0) {
                        newVelocity *= (1 - friction * deltaTime);
                    }
                    return newVelocity;
                });
                
                const newAngle = prevAngle + newVelocity * deltaTime;
                updateEnergies(newAngle, newVelocity);
                return newAngle;
            });
        }
        
        lastTimeRef.current = time;
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
    }, [gravity, length, friction, isPlaying, updateEnergies]);

    useEffect(() => {
        if (isPlaying && !isDraggingRef.current) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            lastTimeRef.current = undefined;
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);

    // Drawing Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Protractor
        ctx.beginPath();
        ctx.arc(originX, originY, 200, 0, Math.PI); // Half circle at bottom
        ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        for (let a = -Math.PI / 2; a <= Math.PI / 2; a += Math.PI / 12) {
            const isMajor = Math.abs(a % (Math.PI / 6)) < 0.01;
            const r1 = isMajor ? 190 : 195;
            const r2 = 200;
            ctx.beginPath();
            ctx.moveTo(originX + r1 * Math.sin(a), originY + r1 * Math.cos(a));
            ctx.lineTo(originX + r2 * Math.sin(a), originY + r2 * Math.cos(a));
            ctx.strokeStyle = isMajor ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.2)";
            ctx.stroke();

            if (isMajor) {
                const deg = Math.round(a * 180 / Math.PI);
                ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
                ctx.font = "10px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`${deg}°`, originX + 215 * Math.sin(a), originY + 215 * Math.cos(a));
            }
        }

        // Draw Support/Anchor
        ctx.fillStyle = "#334155";
        ctx.fillRect(originX - 40, originY - 10, 80, 10);
        ctx.beginPath();
        ctx.arc(originX, originY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#94a3b8";
        ctx.fill();
        ctx.stroke();

        const bobX = originX + length * scale * Math.sin(angle);
        const bobY = originY + length * scale * Math.cos(angle);

        // Store trace
        if (isPlaying) {
            traceRef.current.push({x: bobX, y: bobY});
            if (traceRef.current.length > 80) traceRef.current.shift(); // Keep last 80 points
        } else if (isDraggingRef.current) {
            traceRef.current = [];
        }

        // Draw solid smooth trace
        if (traceRef.current.length > 1) {
            ctx.beginPath();
            ctx.moveTo(traceRef.current[0].x, traceRef.current[0].y);
            for (let i = 1; i < traceRef.current.length; i++) {
                ctx.lineTo(traceRef.current[i].x, traceRef.current[i].y);
            }
            ctx.strokeStyle = "rgba(99, 102, 241, 0.5)"; // indigo-500 with opacity
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        }

        // Draw string
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(bobX, bobY);
        ctx.strokeStyle = "#cbd5e1"; // light gray string
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw bob
        const radius = 15 + Math.sqrt(mass) * 6;
        ctx.beginPath();
        ctx.arc(bobX, bobY, radius, 0, 2 * Math.PI);
        
        // Premium 3D gradient for Bob
        const gradient = ctx.createRadialGradient(bobX - radius*0.3, bobY - radius*0.3, radius*0.1, bobX, bobY, radius);
        gradient.addColorStop(0, "#818cf8");
        gradient.addColorStop(0.7, "#4f46e5");
        gradient.addColorStop(1, "#312e81");
        
        ctx.fillStyle = gradient;
        // Shadow
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.fill();
        ctx.shadowColor = "transparent"; // reset shadow

        // Glow indicator when dragging
        if (isDraggingRef.current) {
            ctx.beginPath();
            ctx.arc(bobX, bobY, radius + 8, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(129, 140, 248, 0.9)";
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Vectors
        if (showVectors) {
            // Velocity Vector (Green)
            const vScale = 30; // visual scaling
            const linearVel = velocity * length; // omega * r
            if (Math.abs(linearVel) > 0.1) {
                const vx = Math.cos(angle) * linearVel * vScale;
                const vy = -Math.sin(angle) * linearVel * vScale;
                
                ctx.beginPath();
                ctx.moveTo(bobX, bobY);
                ctx.lineTo(bobX + vx, bobY + vy);
                ctx.strokeStyle = "#10b981"; // emerald
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Arrowhead
                const headlen = 10;
                const angleArrow = Math.atan2(vy, vx);
                ctx.beginPath();
                ctx.moveTo(bobX + vx, bobY + vy);
                ctx.lineTo(bobX + vx - headlen * Math.cos(angleArrow - Math.PI / 6), bobY + vy - headlen * Math.sin(angleArrow - Math.PI / 6));
                ctx.lineTo(bobX + vx - headlen * Math.cos(angleArrow + Math.PI / 6), bobY + vy - headlen * Math.sin(angleArrow + Math.PI / 6));
                ctx.lineTo(bobX + vx, bobY + vy);
                ctx.fillStyle = "#10b981";
                ctx.fill();
            }

            // Gravity Vector (Red)
            const mgScale = 2; // visual scaling for weight
            const weight = mass * gravity * mgScale;
            ctx.beginPath();
            ctx.moveTo(bobX, bobY);
            ctx.lineTo(bobX, bobY + weight);
            ctx.strokeStyle = "#ef4444"; // red
            ctx.lineWidth = 3;
            ctx.stroke();

            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(bobX, bobY + weight);
            ctx.lineTo(bobX - 6, bobY + weight - 10);
            ctx.lineTo(bobX + 6, bobY + weight - 10);
            ctx.fillStyle = "#ef4444";
            ctx.fill();
        }

    }, [angle, length, mass, velocity, showVectors, isPlaying, gravity]);

    // Coordinate scaling helper for mouse & touch
    const getCanvasCoords = (clientX: number, clientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const scaleX = 600 / rect.width;
        const scaleY = 600 / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    // Helper to calculate and constrain angle from client coordinates
    const updateAngleFromCoords = useCallback((clientX: number, clientY: number) => {
        const coords = getCanvasCoords(clientX, clientY);
        if (!coords) return;

        let newAngle = Math.atan2(coords.x - originX, coords.y - originY);
        if (newAngle > Math.PI / 2) newAngle = Math.PI / 2;
        if (newAngle < -Math.PI / 2) newAngle = -Math.PI / 2;

        setAngle(newAngle);
        updateEnergies(newAngle, 0);
    }, [originX, originY]);

    // Mouse Interaction
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        if (!coords) return;

        const bobX = originX + length * scale * Math.sin(angle);
        const bobY = originY + length * scale * Math.cos(angle);
        const radius = 15 + Math.sqrt(mass) * 6;

        // Check if clicked inside bob
        const dist = Math.sqrt((coords.x - bobX)**2 + (coords.y - bobY)**2);
        if (dist <= radius * 2.5) {
            isDraggingRef.current = true;
            setIsDragging(true);
            setIsPlaying(false); // Pause when grabbing
            setVelocity(0); // Reset velocity
            traceRef.current = [];
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDraggingRef.current) return;
        updateAngleFromCoords(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            setIsDragging(false);
            setIsPlaying(true); // Automatically start playing when dropped
        }
    };

    // Touch Interaction for mobile screens
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 0) return;
        const touch = e.touches[0];
        const coords = getCanvasCoords(touch.clientX, touch.clientY);
        if (!coords) return;

        const bobX = originX + length * scale * Math.sin(angle);
        const bobY = originY + length * scale * Math.cos(angle);
        const radius = 15 + Math.sqrt(mass) * 6;

        const dist = Math.sqrt((coords.x - bobX)**2 + (coords.y - bobY)**2);
        // Generous touch tolerance on mobile (at least 75px)
        const touchThreshold = Math.max(radius * 3.5, 75);

        if (dist <= touchThreshold) {
            if (e.cancelable) e.preventDefault();
            isDraggingRef.current = true;
            setIsDragging(true);
            setIsPlaying(false);
            setVelocity(0);
            traceRef.current = [];
            if (typeof window !== "undefined" && navigator.vibrate) {
                navigator.vibrate(25);
            }
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDraggingRef.current || e.touches.length === 0) return;
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0];
        updateAngleFromCoords(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            setIsDragging(false);
            setIsPlaying(true);
        }
    };

    // Window-level event listeners to ensure dragging continues seamlessly even if finger/mouse moves outside the canvas
    useEffect(() => {
        if (!isDragging) return;

        const handleWinTouchMove = (e: TouchEvent) => {
            if (!isDraggingRef.current || e.touches.length === 0) return;
            if (e.cancelable) e.preventDefault();
            const touch = e.touches[0];
            updateAngleFromCoords(touch.clientX, touch.clientY);
        };

        const handleWinTouchEnd = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                setIsDragging(false);
                setIsPlaying(true);
            }
        };

        const handleWinMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            updateAngleFromCoords(e.clientX, e.clientY);
        };

        const handleWinMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                setIsDragging(false);
                setIsPlaying(true);
            }
        };

        window.addEventListener("touchmove", handleWinTouchMove, { passive: false });
        window.addEventListener("touchend", handleWinTouchEnd);
        window.addEventListener("touchcancel", handleWinTouchEnd);
        window.addEventListener("mousemove", handleWinMouseMove);
        window.addEventListener("mouseup", handleWinMouseUp);

        return () => {
            window.removeEventListener("touchmove", handleWinTouchMove);
            window.removeEventListener("touchend", handleWinTouchEnd);
            window.removeEventListener("touchcancel", handleWinTouchEnd);
            window.removeEventListener("mousemove", handleWinMouseMove);
            window.removeEventListener("mouseup", handleWinMouseUp);
        };
    }, [isDragging, updateAngleFromCoords]);

    const period = 2 * Math.PI * Math.sqrt(length / gravity);
    
    // Max energy for charts
    const maxEnergy = Math.max(0.1, energy.total); // Prevent NaN or Infinity

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full w-full relative overflow-hidden">
            <Tour steps={tourSteps} isOpen={tourOpen} onClose={() => setTourOpen(false)} />

            {/* Mobile Tab Switcher (visible only on screens < lg) */}
            <div className="lg:hidden flex items-center justify-around bg-slate-800/95 border-b border-slate-700/80 p-1.5 z-20 shrink-0">
                <button
                    onClick={() => setMobileTab("sim")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center transition-all ${
                        mobileTab === "sim"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-white"
                    }`}
                >
                    <span className="inline-flex items-center justify-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        Con lắc
                    </span>
                </button>
                <button
                    onClick={() => setMobileTab("controls")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center transition-all ${
                        mobileTab === "controls"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-white"
                    }`}
                >
                    <span className="inline-flex items-center justify-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Bảng điều khiển
                    </span>
                </button>
                {showEnergy && (
                    <button
                        onClick={() => setMobileTab("energy")}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center transition-all ${
                            mobileTab === "energy"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <span className="inline-flex items-center justify-center gap-1.5">
                            <BarChart2 className="w-3.5 h-3.5" />
                            Năng lượng
                        </span>
                    </button>
                )}
            </div>

            {/* Control Panel (Left on Desktop, Tab on Mobile) */}
            <div
                id="pendulum-controls"
                className={`w-full lg:w-96 bg-slate-800/50 border-r border-slate-700 p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar backdrop-blur-sm z-10 shadow-2xl transition-all duration-300 ${
                    mobileTab === "controls" ? "flex flex-1" : isTheaterMode ? "hidden" : "hidden lg:flex"
                }`}
            >
                <div>
                    <h2 className="font-bold text-base sm:text-lg text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Bảng Điều Khiển
                    </h2>
                    
                    <div className="space-y-4 sm:space-y-6">
                        {/* Length */}
                        <div className="bg-slate-800/80 p-3 sm:p-4 rounded-xl border border-slate-700/50">
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-xs sm:text-sm font-semibold text-slate-300">
                                    Chiều dài dây ($l$)
                                    <InfoTooltip title="Chiều dài (l)" content="Tăng chiều dài dây làm tăng chu kỳ dao động (T = 2π√(l/g)). Quả nặng sẽ lắc chậm hơn." />
                                </label>
                                <span className="text-base sm:text-lg font-mono font-bold text-indigo-400">{length.toFixed(1)} m</span>
                            </div>
                            <input 
                                type="range" min="1" max="5" step="0.1" 
                                value={length} onChange={(e) => setLength(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        {/* Gravity */}
                        <div className="bg-slate-800/80 p-3 sm:p-4 rounded-xl border border-slate-700/50">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                                Gia tốc trọng trường ($g$)
                                <InfoTooltip title="Gia tốc trọng trường (g)" content="Thay đổi môi trường hành tinh. Gia tốc càng lớn, lực kéo xuống càng mạnh, chu kỳ càng nhỏ (lắc nhanh hơn)." />
                            </label>
                            <div className="relative">
                                <select 
                                    value={gravity} 
                                    onChange={(e) => setGravity(parseFloat(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="9.8">Trái Đất (9.8 m/s²)</option>
                                    <option value="1.62">Mặt Trăng (1.62 m/s²)</option>
                                    <option value="24.79">Sao Mộc (24.79 m/s²)</option>
                                    <option value="3.72">Sao Hỏa (3.72 m/s²)</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        {/* Mass */}
                        <div className="bg-slate-800/80 p-3 sm:p-4 rounded-xl border border-slate-700/50">
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-xs sm:text-sm font-semibold text-slate-300">
                                    Khối lượng quả nặng ($m$)
                                    <InfoTooltip title="Khối lượng (m)" content="Không làm thay đổi chu kỳ dao động của con lắc lý tưởng! Tuy nhiên, nó tỉ lệ thuận với Động năng và Thế năng." />
                                </label>
                                <span className="text-base sm:text-lg font-mono font-bold text-cyan-400">{mass.toFixed(1)} kg</span>
                            </div>
                            <input 
                                type="range" min="0.5" max="10" step="0.5" 
                                value={mass} onChange={(e) => setMass(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>

                        {/* Damping */}
                        <div className="bg-slate-800/80 p-3 sm:p-4 rounded-xl border border-slate-700/50">
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-xs sm:text-sm font-semibold text-slate-300">
                                    Lực cản môi trường
                                    <InfoTooltip title="Lực cản (Damping)" content="Mô phỏng lực cản không khí. Làm tiêu hao cơ năng, khiến biên độ dao động giảm dần theo thời gian (Dao động tắt dần)." />
                                </label>
                                <span className="text-xs sm:text-sm font-mono font-bold text-rose-400">{friction.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" min="0" max="0.5" step="0.01" 
                                value={friction} onChange={(e) => setFriction(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                            />
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-col gap-2.5">
                            <label className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                                <span className="text-xs sm:text-sm font-medium">Hiển thị Vectors (v, P)</span>
                                <input type="checkbox" checked={showVectors} onChange={() => setShowVectors(!showVectors)} className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                            </label>
                            <label className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                                <span className="text-xs sm:text-sm font-medium">Hiển thị Biểu đồ Năng lượng</span>
                                <input type="checkbox" checked={showEnergy} onChange={() => setShowEnergy(!showEnergy)} className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="pt-4 mt-auto">
                    <div className="flex gap-2 sm:gap-3">
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm text-white flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-xl ${
                                isPlaying ? "bg-rose-500 hover:bg-rose-600 border border-rose-400" : "bg-indigo-600 hover:bg-indigo-500 border border-indigo-400"
                            }`}
                        >
                            {isPlaying ? (
                                <>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                                    Tạm dừng
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                                    Bắt đầu dao động
                                </>
                            )}
                        </button>
                        <button 
                            onClick={resetSimulation}
                            className="px-3.5 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white rounded-xl shadow-lg transition-colors flex items-center justify-center"
                            title="Làm lại từ đầu"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>
                    <button 
                        onClick={() => setTourOpen(true)}
                        className="mt-2.5 w-full py-2 bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 text-indigo-300 rounded-xl transition-colors text-xs font-semibold flex justify-center items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Mở Hướng dẫn (Tour)
                    </button>
                </div>
            </div>

            {/* Simulation Area (Con lắc canvas) */}
            <div
                className={`flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black overflow-hidden ${
                    mobileTab === "sim" ? "flex" : "hidden lg:flex"
                }`}
            >
                {/* Live Data Overlays (Responsive compact pills) */}
                <div id="pendulum-stats" className="absolute top-2.5 left-2.5 sm:top-6 sm:left-6 z-10 flex flex-wrap gap-1.5 sm:gap-3 pointer-events-none max-w-[85%] sm:max-w-none">
                    <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-2 sm:p-3.5 rounded-xl shadow-xl">
                        <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Góc ($\alpha$)</p>
                        <p className="text-base sm:text-2xl font-mono font-bold text-white">{(Math.abs(angle) * 180 / Math.PI).toFixed(1)}<span className="text-xs font-sans text-slate-500 ml-0.5">°</span></p>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-2 sm:p-3.5 rounded-xl shadow-xl">
                        <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Chu kỳ (T)</p>
                        <p className="text-base sm:text-2xl font-mono font-bold text-white">{period.toFixed(2)}<span className="text-xs font-sans text-slate-500 ml-0.5">s</span></p>
                    </div>
                    <div className="hidden sm:block bg-slate-900/80 backdrop-blur border border-slate-700 p-2 sm:p-3.5 rounded-xl shadow-xl">
                        <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Tần số góc ($\omega$)</p>
                        <p className="text-base sm:text-2xl font-mono font-bold text-white">{Math.sqrt(gravity/length).toFixed(2)}<span className="text-xs font-sans text-slate-500 ml-0.5">rad/s</span></p>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-2 sm:p-3.5 rounded-xl shadow-xl">
                        <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Vận tốc ($v$)</p>
                        <p className="text-base sm:text-2xl font-mono font-bold text-emerald-400">{Math.abs(velocity * length).toFixed(2)}<span className="text-xs font-sans text-slate-500 ml-0.5">m/s</span></p>
                    </div>
                </div>

                {/* Top Action Buttons (Guide & Theater Mode) */}
                <div className="absolute top-2.5 right-2.5 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
                    <button
                        onClick={() => setIsTheaterMode(!isTheaterMode)}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur transition-all active:scale-95 border ${
                            isTheaterMode 
                                ? "bg-indigo-600 border-indigo-400 text-white shadow-indigo-600/30 ring-2 ring-indigo-400/30"
                                : "bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-indigo-300"
                        }`}
                        title={isTheaterMode ? "Thu nhỏ lại chế độ tiêu chuẩn" : "Phóng to toàn màn hình thí nghiệm cho khán giả"}
                    >
                        {isTheaterMode ? (
                            <>
                                <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Thu nhỏ</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Phóng to Trình chiếu</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => setShowGuideModal(!showGuideModal)}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur"
                        title="Hướng dẫn làm thí nghiệm"
                    >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Hướng dẫn</span>
                    </button>
                </div>

                {/* Instruction Guide Modal/Card (toggled via button to avoid obscuring canvas) */}
                {showGuideModal && (
                    <div className="absolute top-12 right-2.5 sm:top-20 sm:right-6 z-30 w-72 sm:w-80 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-700">
                            <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                                <Lightbulb className="w-4 h-4 text-amber-400" />
                                Hướng dẫn Thí nghiệm
                            </h3>
                            <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-white text-xs p-1 flex items-center gap-1">
                                <X className="w-3.5 h-3.5" />
                                Đóng
                            </button>
                        </div>
                        <ul className="text-xs sm:text-sm text-slate-300 space-y-2">
                            <li className="flex items-start gap-1.5">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span><strong>Kéo thả quả nặng:</strong> Chạm ngón tay (hoặc chuột) giữ quả bóng để kéo lệch góc ban đầu rồi buông tay.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span><strong>Vectors:</strong> Mũi tên <span className="text-emerald-400">Xanh (Vận tốc v)</span>, <span className="text-rose-400">Đỏ (Trọng lực P)</span>.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span><strong>Bảo toàn cơ năng:</strong> Xem tab Năng lượng để thấy Động năng ⇄ Thế năng.</span>
                            </li>
                        </ul>
                    </div>
                )}

                {/* Theater Mode Floating Settings Trigger (Desktop only) */}
                {isTheaterMode && (
                    <div className="hidden lg:flex absolute top-6 left-6 z-20 items-center gap-2">
                        <button
                            onClick={() => setIsTheaterMode(false)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800/95 hover:bg-slate-700 border border-slate-600 text-indigo-300 text-xs font-semibold flex items-center gap-2 shadow-xl backdrop-blur transition-all"
                        >
                            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                            <span>Hiện bảng cài đặt ({length.toFixed(1)}m, {gravity}m/s²)</span>
                        </button>
                        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                            <Tv className="w-3 h-3 text-indigo-400" />
                            Chế độ Trình chiếu
                        </span>
                    </div>
                )}

                {/* Canvas Container */}
                <div id="pendulum-canvas" className="flex-1 flex justify-center items-center relative p-2 overflow-hidden">
                    <canvas 
                        ref={canvasRef} 
                        width={600} 
                        height={600} 
                        className={`w-full ${
                            isTheaterMode 
                                ? "max-w-[650px] sm:max-w-[750px] lg:max-w-[850px] max-h-[82vh]" 
                                : "max-w-[340px] xs:max-w-[380px] sm:max-w-[500px]"
                        } h-auto aspect-square bg-transparent cursor-grab active:cursor-grabbing z-0 touch-none select-none transition-all duration-300`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                    />

                    {/* Ruler markings (left side) */}
                    <div className="hidden sm:flex absolute left-1/2 -translate-x-[260px] top-1/2 -translate-y-[200px] h-[300px] w-8 border-r border-slate-700/50 flex-col justify-between items-end pr-2 pointer-events-none">
                        <span className="text-[10px] font-mono text-slate-500">0m</span>
                        <span className="text-[10px] font-mono text-slate-500">1m</span>
                        <span className="text-[10px] font-mono text-slate-500">2m</span>
                        <span className="text-[10px] font-mono text-slate-500">3m</span>
                        <span className="text-[10px] font-mono text-slate-500">4m</span>
                        <span className="text-[10px] font-mono text-slate-500">5m</span>
                    </div>
                </div>

                {/* Mobile Quick Action Floating Bar */}
                <div className="lg:hidden p-2.5 bg-slate-900/95 border-t border-slate-700/80 flex items-center gap-2 z-20 shrink-0">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white flex justify-center items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                            isPlaying ? "bg-rose-500 hover:bg-rose-600" : "bg-indigo-600 hover:bg-indigo-500"
                        }`}
                    >
                        {isPlaying ? (
                            <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>Tạm dừng</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Bắt đầu dao động</span>
                            </>
                        )}
                    </button>
                    <button 
                        onClick={resetSimulation}
                        className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-95"
                        title="Làm lại từ đầu"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={() => setMobileTab("controls")}
                        className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-indigo-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Cài đặt</span>
                    </button>
                </div>

                {/* Desktop Energy Chart Panel (Rendered only on Desktop >= lg inside Simulation Area) */}
                {showEnergy && (
                    <div id="pendulum-energy" className="hidden lg:flex h-40 bg-slate-900/80 backdrop-blur-md border-t border-slate-700 p-4 flex-col justify-center relative z-10 shrink-0">
                        <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Biểu đồ Năng lượng Thời gian thực (Cơ năng bảo toàn)
                        </h3>
                        <div className="flex-1 flex items-end gap-6 pl-4">
                            {/* Kinetic */}
                            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                <div className="w-full bg-slate-800 rounded-t-lg h-full flex items-end relative overflow-hidden">
                                    <div 
                                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-75 rounded-t-lg"
                                        style={{ height: `${(energy.kinetic / maxEnergy) * 100}%` }}
                                    />
                                    <span className="absolute bottom-1 w-full text-center text-[10px] font-mono font-bold text-white drop-shadow-md z-10">
                                        {energy.kinetic.toFixed(1)} J
                                    </span>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-400">Động năng ($W_d$)</span>
                            </div>
                            {/* Potential */}
                            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                <div className="w-full bg-slate-800 rounded-t-lg h-full flex items-end relative overflow-hidden">
                                    <div 
                                        className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-75 rounded-t-lg"
                                        style={{ height: `${(energy.potential / maxEnergy) * 100}%` }}
                                    />
                                    <span className="absolute bottom-1 w-full text-center text-[10px] font-mono font-bold text-white drop-shadow-md z-10">
                                        {energy.potential.toFixed(1)} J
                                    </span>
                                </div>
                                <span className="text-[11px] font-bold text-cyan-400">Thế năng ($W_t$)</span>
                            </div>
                            {/* Total */}
                            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                <div className="w-full bg-slate-800 rounded-t-lg h-full flex items-end relative overflow-hidden">
                                    <div 
                                        className="w-full bg-slate-600 transition-all duration-75 rounded-t-lg"
                                        style={{ height: `100%` }}
                                    />
                                    <span className="absolute bottom-1 w-full text-center text-[10px] font-mono font-bold text-white drop-shadow-md z-10">
                                        {energy.total.toFixed(1)} J
                                    </span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400">Cơ năng ($W$)</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Energy View (Rendered when mobileTab === "energy") */}
            {mobileTab === "energy" && (
                <div className="lg:hidden flex-1 bg-slate-900 p-4 flex flex-col justify-between overflow-y-auto">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Biểu đồ Năng lượng Thời gian thực
                        </h3>
                        <p className="text-xs text-slate-400 mb-6">Động năng chuyển hóa thành Thế năng liên tục. Tổng cơ năng được bảo toàn khi không có lực cản.</p>
                        
                        <div className="h-64 flex items-end gap-4 p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
                            {/* Kinetic */}
                            <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <div className="w-full bg-slate-800 rounded-t-lg h-full flex items-end relative overflow-hidden">
                                    <div 
                                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-75 rounded-t-lg"
                                        style={{ height: `${(energy.kinetic / maxEnergy) * 100}%` }}
                                    />
                                    <span className="absolute bottom-2 w-full text-center text-xs font-mono font-bold text-white z-10">
                                        {energy.kinetic.toFixed(1)} J
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-emerald-400">Động năng</span>
                            </div>
                            {/* Potential */}
                            <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <div className="w-full bg-slate-800 rounded-t-lg h-full flex items-end relative overflow-hidden">
                                    <div 
                                        className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-75 rounded-t-lg"
                                        style={{ height: `${(energy.potential / maxEnergy) * 100}%` }}
                                    />
                                    <span className="absolute bottom-2 w-full text-center text-xs font-mono font-bold text-white z-10">
                                        {energy.potential.toFixed(1)} J
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-cyan-400">Thế năng</span>
                            </div>
                            {/* Total */}
                            <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <div className="w-full bg-slate-800 rounded-t-lg h-full flex items-end relative overflow-hidden">
                                    <div 
                                        className="w-full bg-slate-600 transition-all duration-75 rounded-t-lg"
                                        style={{ height: `100%` }}
                                    />
                                    <span className="absolute bottom-2 w-full text-center text-xs font-mono font-bold text-white z-10">
                                        {energy.total.toFixed(1)} J
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-slate-400">Cơ năng</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setMobileTab("sim")}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg mt-4"
                    >
                        Quay lại mô phỏng con lắc
                    </button>
                </div>
            )}
        </div>
    );
}
