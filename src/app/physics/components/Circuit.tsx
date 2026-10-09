"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export default function Circuit() {
    // Physics Parameters
    const [voltage, setVoltage] = useState(12); // V (Volts)
    const [resistor, setResistor] = useState(10); // R (Ohms)
    const bulbResistance = 5; // Fixed bulb resistance
    const [isClosed, setIsClosed] = useState(false); // Switch state

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const electronOffsetRef = useRef(0);

    // Calculations
    const totalResistance = resistor + bulbResistance;
    const current = isClosed ? voltage / totalResistance : 0; // I = U/R
    const bulbVoltage = current * bulbResistance;
    const bulbPower = current * current * bulbResistance;

    // Animation Loop
    const animate = useCallback(() => {
        if (isClosed && current > 0) {
            // Speed proportional to current
            electronOffsetRef.current += current * 1.5; 
            if (electronOffsetRef.current > 1000) electronOffsetRef.current = 0;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Circuit dimensions
        const startX = 200;
        const startY = 150;
        const width = 400;
        const height = 300;
        const endX = startX + width;
        const endY = startY + height;

        // Draw Wires
        ctx.beginPath();
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 4;
        
        // Top wire (Battery to Switch)
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + 100, startY);
        
        // Switch gap
        ctx.moveTo(startX + 150, startY);
        ctx.lineTo(endX, startY);
        
        // Right wire
        ctx.lineTo(endX, endY);
        
        // Bottom wire (with Resistor gap)
        ctx.lineTo(startX + 250, endY);
        ctx.moveTo(startX + 150, endY);
        ctx.lineTo(startX, endY);
        
        // Left wire (with Bulb gap)
        ctx.lineTo(startX, startY + 200);
        ctx.moveTo(startX, startY + 100);
        ctx.lineTo(startX, startY);
        
        ctx.stroke();

        // Draw Electrons (if closed)
        if (isClosed) {
            ctx.fillStyle = "#ef4444";
            const pathLength = (width * 2) + (height * 2);
            const numElectrons = 15;
            const spacing = pathLength / numElectrons;
            
            for (let i = 0; i < numElectrons; i++) {
                let d = (i * spacing + electronOffsetRef.current) % pathLength;
                let ex = 0, ey = 0;
                
                // Top edge (moving right)
                if (d < width) {
                    ex = startX + d;
                    ey = startY;
                }
                // Right edge (moving down)
                else if (d < width + height) {
                    ex = endX;
                    ey = startY + (d - width);
                }
                // Bottom edge (moving left)
                else if (d < width * 2 + height) {
                    ex = endX - (d - width - height);
                    ey = endY;
                }
                // Left edge (moving up)
                else {
                    ex = startX;
                    ey = endY - (d - width * 2 - height);
                }
                
                ctx.beginPath();
                ctx.arc(ex, ey, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 1. Draw Battery (Top Left Corner area)
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(startX - 20, startY - 20, 40, 40);
        ctx.fillStyle = "#ef4444"; // Positive
        ctx.fillRect(startX, startY - 15, 20, 30);
        ctx.fillStyle = "#3b82f6"; // Negative
        ctx.fillRect(startX - 20, startY - 15, 20, 30);
        
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px monospace";
        ctx.fillText("+", startX + 5, startY + 5);
        ctx.fillText("-", startX - 15, startY + 5);
        
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`${voltage}V`, startX - 15, startY - 25);

        // 2. Draw Switch
        ctx.beginPath();
        ctx.arc(startX + 100, startY, 5, 0, Math.PI * 2);
        ctx.arc(startX + 150, startY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#94a3b8";
        ctx.fill();
        
        ctx.beginPath();
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 4;
        ctx.moveTo(startX + 100, startY);
        if (isClosed) {
            ctx.lineTo(startX + 150, startY);
        } else {
            ctx.lineTo(startX + 140, startY - 30);
        }
        ctx.stroke();
        
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Công tắc", startX + 100, startY - 40);

        // 3. Draw Resistor (Bottom edge)
        ctx.beginPath();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        const rx = startX + 150;
        const ry = endY;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 10, ry - 15);
        ctx.lineTo(rx + 30, ry + 15);
        ctx.lineTo(rx + 50, ry - 15);
        ctx.lineTo(rx + 70, ry + 15);
        ctx.lineTo(rx + 90, ry - 15);
        ctx.lineTo(rx + 100, ry);
        ctx.stroke();
        
        ctx.fillStyle = "#fbbf24";
        ctx.fillText(`R = ${resistor}Ω`, rx + 30, ry + 35);

        // 4. Draw Bulb (Left edge)
        const bx = startX;
        const by = startY + 150;
        
        // Glow effect
        if (isClosed && bulbPower > 0) {
            const glowRadius = Math.min(100, 20 + bulbPower * 2);
            const gradient = ctx.createRadialGradient(bx, by, 10, bx, by, glowRadius);
            gradient.addColorStop(0, "rgba(253, 224, 71, 0.8)"); // yellow-300
            gradient.addColorStop(1, "rgba(253, 224, 71, 0)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bx, by, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Bulb glass
        ctx.beginPath();
        ctx.arc(bx, by, 30, 0, Math.PI * 2);
        ctx.fillStyle = isClosed && bulbPower > 0 ? "#fef08a" : "#334155";
        ctx.fill();
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Filament
        ctx.beginPath();
        ctx.strokeStyle = isClosed && bulbPower > 0 ? "#f97316" : "#cbd5e1";
        ctx.moveTo(bx - 10, by + 10);
        ctx.lineTo(bx - 5, by - 5);
        ctx.lineTo(bx + 5, by - 5);
        ctx.lineTo(bx + 10, by + 10);
        ctx.stroke();
        
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`Bóng đèn (${bulbResistance}Ω)`, bx - 40, by + 50);

        requestRef.current = requestAnimationFrame(animate);
    }, [isClosed, current, voltage, resistor, bulbResistance, bulbPower]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [animate]);

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full w-full">
            {/* Control Panel (Left) */}
            <div className="w-full lg:w-96 bg-slate-800/50 border-r border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto z-10 shadow-2xl">
                <div>
                    <h2 className="font-bold text-lg text-white mb-5 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Bảng Điều Khiển Mạch
                    </h2>
                    
                    <div className="space-y-6">
                        {/* Switch Toggle */}
                        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-bold mb-1">Công tắc (K)</h3>
                                <p className="text-xs text-slate-400">Đóng/mở mạch điện</p>
                            </div>
                            <button 
                                onClick={() => setIsClosed(!isClosed)}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isClosed ? 'bg-emerald-500' : 'bg-slate-600'}`}
                            >
                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isClosed ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Voltage */}
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-sm font-semibold text-slate-300">Nguồn điện (U)</label>
                                <span className="text-lg font-mono font-bold text-amber-400">{voltage.toFixed(1)} V</span>
                            </div>
                            <input 
                                type="range" min="1.5" max="24" step="0.5" 
                                value={voltage} onChange={(e) => setVoltage(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                        </div>

                        {/* Resistor */}
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-sm font-semibold text-slate-300">Điện trở (R)</label>
                                <span className="text-lg font-mono font-bold text-sky-400">{resistor.toFixed(1)} Ω</span>
                            </div>
                            <input 
                                type="range" min="1" max="50" step="1" 
                                value={resistor} onChange={(e) => setResistor(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Dashboard / Meters */}
                <div className="mt-auto space-y-4">
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50 text-emerald-400 font-bold">A</div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold">Ampe kế (I)</p>
                                <p className="text-2xl font-mono font-bold text-white">{current.toFixed(2)} A</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/50 text-rose-400 font-bold">V</div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold">Vôn kế Đèn (U_đèn)</p>
                                <p className="text-2xl font-mono font-bold text-white">{bulbVoltage.toFixed(2)} V</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Công suất Đèn (P)</p>
                        <p className="text-xl font-mono font-bold text-amber-400">{bulbPower.toFixed(2)} W</p>
                        <div className="w-full bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full transition-all" style={{ width: `${Math.min(100, (bulbPower / 50) * 100)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulation Area */}
            <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black overflow-hidden">
                {!isClosed && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600/90 text-white px-6 py-3 rounded-full text-sm font-bold animate-bounce pointer-events-none shadow-lg shadow-blue-500/20 z-20">
                        ⚡ Hãy bật công tắc (K) ở bảng điều khiển để dòng điện chạy qua mạch!
                    </div>
                )}
                
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={600} 
                    className="w-full h-full object-contain z-0"
                />
            </div>
        </div>
    );
}
