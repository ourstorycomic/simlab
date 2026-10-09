"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Tour, TourStep } from "@/components/Tour";

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

    // Mouse Interaction
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const bobX = originX + length * scale * Math.sin(angle);
        const bobY = originY + length * scale * Math.cos(angle);
        const radius = 15 + Math.sqrt(mass) * 6;

        // Check if clicked inside bob
        const dist = Math.sqrt((mouseX - bobX)**2 + (mouseY - bobY)**2);
        if (dist <= radius * 1.5) {
            isDraggingRef.current = true;
            setIsPlaying(false); // Pause when grabbing
            setVelocity(0); // Reset velocity
            traceRef.current = [];
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDraggingRef.current) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate new angle based on mouse position relative to origin
        let newAngle = Math.atan2(mouseX - originX, mouseY - originY);
        
        // Constrain angle to realistic bounds (e.g., -pi/2 to pi/2)
        if (newAngle > Math.PI / 2) newAngle = Math.PI / 2;
        if (newAngle < -Math.PI / 2) newAngle = -Math.PI / 2;
        
        setAngle(newAngle);
        updateEnergies(newAngle, 0); // Update energy while dragging
    };

    const handleMouseUp = () => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            setIsPlaying(true); // Automatically start playing when dropped
        }
    };

    const period = 2 * Math.PI * Math.sqrt(length / gravity);
    
    // Max energy for charts
    const maxEnergy = Math.max(0.1, energy.total); // Prevent NaN or Infinity

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full w-full relative">
                <Tour steps={tourSteps} isOpen={tourOpen} onClose={() => setTourOpen(false)} />
                {/* Control Panel (Left) */}
                <div id="pendulum-controls" className="w-full lg:w-96 bg-slate-800/50 border-r border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar backdrop-blur-sm z-10 shadow-2xl">
                    <div>
                        <h2 className="font-bold text-lg text-white mb-5 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Bảng Điều Khiển
                        </h2>
                        
                        <div className="space-y-6">
                            {/* Length */}
                            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-sm font-semibold text-slate-300">
                                        Chiều dài dây ($l$)
                                        <InfoTooltip title="Chiều dài (l)" content="Tăng chiều dài dây làm tăng chu kỳ dao động (T = 2π√(l/g)). Quả nặng sẽ lắc chậm hơn." />
                                    </label>
                                    <span className="text-lg font-mono font-bold text-indigo-400">{length.toFixed(1)} m</span>
                                </div>
                                <input 
                                    type="range" min="1" max="5" step="0.1" 
                                    value={length} onChange={(e) => setLength(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            {/* Gravity */}
                            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Gia tốc trọng trường ($g$)
                                    <InfoTooltip title="Gia tốc trọng trường (g)" content="Thay đổi môi trường hành tinh. Gia tốc càng lớn, lực kéo xuống càng mạnh, chu kỳ càng nhỏ (lắc nhanh hơn)." />
                                </label>
                                <div className="relative">
                                    <select 
                                        value={gravity} 
                                        onChange={(e) => setGravity(parseFloat(e.target.value))}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm font-medium text-white appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-sm font-semibold text-slate-300">
                                        Khối lượng quả nặng ($m$)
                                        <InfoTooltip title="Khối lượng (m)" content="Không làm thay đổi chu kỳ dao động của con lắc lý tưởng! Tuy nhiên, nó tỉ lệ thuận với Động năng và Thế năng." />
                                    </label>
                                    <span className="text-lg font-mono font-bold text-cyan-400">{mass.toFixed(1)} kg</span>
                                </div>
                                <input 
                                    type="range" min="0.5" max="10" step="0.5" 
                                    value={mass} onChange={(e) => setMass(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>

                            {/* Damping */}
                            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-sm font-semibold text-slate-300">
                                        Lực cản môi trường
                                        <InfoTooltip title="Lực cản (Damping)" content="Mô phỏng lực cản không khí. Làm tiêu hao cơ năng, khiến biên độ dao động giảm dần theo thời gian (Dao động tắt dần)." />
                                    </label>
                                    <span className="text-sm font-mono font-bold text-rose-400">{friction.toFixed(2)}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="0.5" step="0.01" 
                                    value={friction} onChange={(e) => setFriction(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                />
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-col gap-3">
                                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                                    <span className="text-sm font-medium">Hiển thị Vectors (v, P)</span>
                                    <input type="checkbox" checked={showVectors} onChange={() => setShowVectors(!showVectors)} className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                                </label>
                                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                                    <span className="text-sm font-medium">Hiển thị Biểu đồ Năng lượng</span>
                                    <input type="checkbox" checked={showEnergy} onChange={() => setShowEnergy(!showEnergy)} className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-auto">
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`flex-1 py-3.5 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-xl ${
                                    isPlaying ? "bg-rose-500 hover:bg-rose-600 border border-rose-400" : "bg-indigo-600 hover:bg-indigo-500 border border-indigo-400"
                                }`}
                            >
                                {isPlaying ? (
                                    <>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                                        Tạm dừng
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                                        Bắt đầu dao động
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={resetSimulation}
                                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white rounded-xl shadow-lg transition-colors flex items-center justify-center"
                                title="Làm lại từ đầu"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        </div>
                        <button 
                            onClick={() => setTourOpen(true)}
                            className="mt-3 w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 text-indigo-300 rounded-xl transition-colors text-sm font-semibold flex justify-center items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Mở Hướng dẫn (Tour)
                        </button>
                    </div>
                </div>

                {/* Simulation Area */}
                <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
                    
                    {/* Live Data Overlays */}
                    <div id="pendulum-stats" className="absolute top-6 left-6 z-10 flex gap-4 pointer-events-none">
                        <div className="bg-slate-900/60 backdrop-blur border border-slate-700 p-4 rounded-2xl shadow-2xl">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Góc lệch ($\alpha$)</p>
                            <p className="text-3xl font-mono font-bold text-white">{(Math.abs(angle) * 180 / Math.PI).toFixed(1)}<span className="text-sm font-sans text-slate-500 ml-1">°</span></p>
                        </div>
                        <div className="bg-slate-900/60 backdrop-blur border border-slate-700 p-4 rounded-2xl shadow-2xl">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Chu kỳ (T)</p>
                            <p className="text-3xl font-mono font-bold text-white">{period.toFixed(2)}<span className="text-sm font-sans text-slate-500 ml-1">s</span></p>
                        </div>
                        <div className="bg-slate-900/60 backdrop-blur border border-slate-700 p-4 rounded-2xl shadow-2xl">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Tần số góc ($\omega$)</p>
                            <p className="text-3xl font-mono font-bold text-white">{Math.sqrt(gravity/length).toFixed(2)}<span className="text-sm font-sans text-slate-500 ml-1">rad/s</span></p>
                        </div>
                        <div className="bg-slate-900/60 backdrop-blur border border-slate-700 p-4 rounded-2xl shadow-2xl">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Vận tốc ($v$)</p>
                            <p className="text-3xl font-mono font-bold text-emerald-400">{Math.abs(velocity * length).toFixed(2)}<span className="text-sm font-sans text-slate-500 ml-1">m/s</span></p>
                        </div>
                    </div>

                    {/* Floating Instruction Guide */}
                    <div className="absolute top-6 right-6 z-10 w-80 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-5 overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            Hướng dẫn Thí nghiệm
                        </h3>
                        <ul className="text-sm text-slate-300 space-y-3">
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span><strong>Kéo thả quả nặng:</strong> Click và giữ quả nặng để thay đổi góc lệch ban đầu (Biên độ).</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span><strong>Quan sát Vectors:</strong> Mũi tên <span className="text-emerald-400">Xanh (Vận tốc v)</span> đổi chiều liên tục, <span className="text-rose-400">Đỏ (Trọng lực P)</span> luôn hướng xuống.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span><strong>Thước đo góc:</strong> Chú ý các mốc độ (°) mờ trên background để biết chính xác biên độ dao động.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Canvas */}
                    <div id="pendulum-canvas" className="flex-1 flex justify-center items-center relative">
                        <canvas 
                            ref={canvasRef} 
                            width={600} 
                            height={600} 
                            className="bg-transparent cursor-grab active:cursor-grabbing z-0"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />

                        {/* Ruler markings (left side) */}
                        <div className="absolute left-1/2 -translate-x-[320px] top-1/2 -translate-y-[240px] h-[350px] w-8 border-r border-slate-700/50 flex flex-col justify-between items-end pr-2 pointer-events-none">
                            <span className="text-xs font-mono text-slate-500">0m</span>
                            <span className="text-xs font-mono text-slate-500">1m</span>
                            <span className="text-xs font-mono text-slate-500">2m</span>
                            <span className="text-xs font-mono text-slate-500">3m</span>
                            <span className="text-xs font-mono text-slate-500">4m</span>
                            <span className="text-xs font-mono text-slate-500">5m</span>
                        </div>
                    </div>

                    {/* Energy Chart Panel */}
                    {showEnergy && (
                        <div id="pendulum-energy" className="h-48 bg-slate-900/80 backdrop-blur-md border-t border-slate-700 p-6 flex flex-col justify-center animate-slide-up relative z-10">
                            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Biểu đồ Năng lượng Thời gian thực (Cơ năng bảo toàn)
                            </h3>
                            <div className="flex-1 flex items-end gap-8 pl-4">
                                {/* Kinetic */}
                                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <div className="w-full bg-slate-800 rounded-t-lg h-full flex items-end relative overflow-hidden">
                                        <div 
                                            className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-75 rounded-t-lg"
                                            style={{ height: `${(energy.kinetic / maxEnergy) * 100}%` }}
                                        />
                                        <span className="absolute bottom-2 w-full text-center text-xs font-mono font-bold text-white drop-shadow-md z-10">
                                            {energy.kinetic.toFixed(1)} J
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400">Động năng ($W_d$)</span>
                                </div>
                                {/* Potential */}
                                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <div className="w-full bg-slate-800 rounded-t-lg h-full flex items-end relative overflow-hidden">
                                        <div 
                                            className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-75 rounded-t-lg"
                                            style={{ height: `${(energy.potential / maxEnergy) * 100}%` }}
                                        />
                                        <span className="absolute bottom-2 w-full text-center text-xs font-mono font-bold text-white drop-shadow-md z-10">
                                            {energy.potential.toFixed(1)} J
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-cyan-400">Thế năng ($W_t$)</span>
                                </div>
                                {/* Total */}
                                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <div className="w-full bg-slate-800 rounded-t-lg h-full flex items-end relative overflow-hidden">
                                        <div 
                                            className="w-full bg-slate-600 transition-all duration-75 rounded-t-lg"
                                            style={{ height: `100%` }}
                                        />
                                        <span className="absolute bottom-2 w-full text-center text-xs font-mono font-bold text-white drop-shadow-md z-10">
                                            {energy.total.toFixed(1)} J
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">Cơ năng ($W$)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
        </div>
    );
}
