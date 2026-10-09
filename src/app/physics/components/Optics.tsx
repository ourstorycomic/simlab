"use client";

import React, { useState, useEffect, useRef } from "react";

export default function Optics() {
    const [focalLength, setFocalLength] = useState(50); // f in cm
    const [objectDistance, setObjectDistance] = useState(100); // d in cm
    const [objectHeight, setObjectHeight] = useState(30); // h in cm
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Lens formula: 1/f = 1/d + 1/d' => d' = (d*f)/(d-f)
    // If d = f, lines are parallel
    let imageDistance = 0;
    let imageHeight = 0;
    let isVirtual = false;

    if (Math.abs(objectDistance - focalLength) > 0.1) {
        imageDistance = (objectDistance * focalLength) / (objectDistance - focalLength);
        // Magnification m = -d'/d = h'/h
        imageHeight = -(imageDistance / objectDistance) * objectHeight;
        isVirtual = imageDistance < 0;
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        
        const scale = 2; // 1cm = 2px on canvas

        // Draw Principal Axis
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(canvas.width, cy);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Convex Lens
        ctx.beginPath();
        ctx.moveTo(cx, cy - 150);
        ctx.quadraticCurveTo(cx - 30, cy, cx, cy + 150);
        ctx.quadraticCurveTo(cx + 30, cy, cx, cy - 150);
        ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Focal points (F and F')
        const F = focalLength * scale;
        ctx.fillStyle = "#ef4444";
        // F
        ctx.beginPath(); ctx.arc(cx - F, cy, 4, 0, 2*Math.PI); ctx.fill();
        ctx.fillText("F", cx - F - 5, cy + 15);
        // F'
        ctx.beginPath(); ctx.arc(cx + F, cy, 4, 0, 2*Math.PI); ctx.fill();
        ctx.fillText("F'", cx + F - 5, cy + 15);
        // O (Optical center)
        ctx.fillText("O", cx + 5, cy + 15);

        // Draw Object
        const objX = cx - objectDistance * scale;
        const objY = cy - objectHeight * scale;
        
        ctx.beginPath();
        ctx.moveTo(objX, cy);
        ctx.lineTo(objX, objY);
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Arrow for object
        ctx.beginPath();
        ctx.moveTo(objX, objY);
        ctx.lineTo(objX - 5, objY + (objectHeight > 0 ? 5 : -5));
        ctx.lineTo(objX + 5, objY + (objectHeight > 0 ? 5 : -5));
        ctx.fillStyle = "#34d399";
        ctx.fill();

        if (Math.abs(objectDistance - focalLength) > 0.1) {
            // Draw Rays
            ctx.lineWidth = 1.5;

            // Ray 1: Parallel to principal axis -> passes through F'
            ctx.beginPath();
            ctx.moveTo(objX, objY);
            ctx.lineTo(cx, objY);
            ctx.strokeStyle = "#fbbf24"; // yellow
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(cx, objY);
            if (isVirtual) {
                // Real part
                ctx.lineTo(cx + canvas.width, objY + (canvas.width / F) * objY);
                // Virtual part
                ctx.strokeStyle = "#fbbf24";
                ctx.setLineDash([5, 5]);
                ctx.lineTo(cx - canvas.width, objY - (canvas.width / F) * objY);
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                // To F' and beyond
                const slope = objY / F;
                ctx.lineTo(cx + canvas.width, objY - slope * canvas.width);
                ctx.strokeStyle = "#fbbf24";
                ctx.stroke();
            }

            // Ray 2: Passes through optical center O -> continues straight
            ctx.beginPath();
            ctx.moveTo(objX, objY);
            ctx.lineTo(cx, cy);
            ctx.strokeStyle = "#f472b6"; // pink
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            if (isVirtual) {
                const slope2 = (cy - objY) / (cx - objX);
                // Real part
                ctx.lineTo(canvas.width, cy + slope2 * (canvas.width - cx));
                // Virtual part
                ctx.setLineDash([5, 5]);
                ctx.lineTo(0, cy - slope2 * cx);
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                const slope2 = (cy - objY) / (cx - objX);
                ctx.lineTo(canvas.width, cy + slope2 * (canvas.width - cx));
                ctx.stroke();
            }

            // Draw Image
            const imgX = cx + imageDistance * scale;
            const imgY = cy - imageHeight * scale;
            
            ctx.beginPath();
            ctx.moveTo(imgX, cy);
            ctx.lineTo(imgX, imgY);
            ctx.strokeStyle = isVirtual ? "#94a3b8" : "#f87171";
            ctx.lineWidth = 3;
            if (isVirtual) ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Arrow for image
            ctx.beginPath();
            ctx.moveTo(imgX, imgY);
            ctx.lineTo(imgX - 5, imgY + (imageHeight > 0 ? 5 : -5));
            ctx.lineTo(imgX + 5, imgY + (imageHeight > 0 ? 5 : -5));
            ctx.fillStyle = isVirtual ? "#94a3b8" : "#f87171";
            ctx.fill();
            
            // Label
            ctx.fillStyle = isVirtual ? "#94a3b8" : "#f87171";
            ctx.font = "bold 14px sans-serif";
            ctx.fillText(isVirtual ? "Ảnh Ảo" : "Ảnh Thật", imgX - 20, imgY + (imageHeight > 0 ? 20 : -10));
        } else {
            // Infinite
            ctx.fillStyle = "#f87171";
            ctx.font = "bold 20px sans-serif";
            ctx.fillText("Ảnh ở vô cực", cx + 50, cy - 50);
        }

    }, [focalLength, objectDistance, objectHeight, isVirtual, imageHeight, imageDistance]);

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full">
            <div className="w-full lg:w-96 bg-slate-800/50 border-r border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto">
                <h2 className="font-bold text-lg text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Quang Học: Thấu Kính Hội Tụ
                </h2>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-300">Tiêu cự (f)</label>
                        <span className="text-lg font-mono font-bold text-sky-400">{focalLength} cm</span>
                    </div>
                    <input 
                        type="range" min="10" max="150" step="1" 
                        value={focalLength} onChange={(e) => setFocalLength(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-300">Khoảng cách vật (d)</label>
                        <span className="text-lg font-mono font-bold text-emerald-400">{objectDistance} cm</span>
                    </div>
                    <input 
                        type="range" min="10" max="300" step="1" 
                        value={objectDistance} onChange={(e) => setObjectDistance(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
                
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-semibold text-slate-300">Chiều cao vật (h)</label>
                        <span className="text-lg font-mono font-bold text-emerald-400">{objectHeight} cm</span>
                    </div>
                    <input 
                        type="range" min="10" max="100" step="1" 
                        value={objectHeight} onChange={(e) => setObjectHeight(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>

                <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700 mt-auto">
                    <h3 className="font-bold text-sm text-slate-300 mb-3">Thông số Ảnh (d&apos;)</h3>
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-slate-400">Khoảng cách (d&apos;):</span>
                        <span className="font-bold font-mono text-rose-400 text-lg">
                            {Math.abs(objectDistance - focalLength) < 0.1 ? "∞" : imageDistance.toFixed(1)} cm
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-slate-400">Độ cao (h&apos;):</span>
                        <span className="font-bold font-mono text-rose-400 text-lg">
                            {Math.abs(objectDistance - focalLength) < 0.1 ? "∞" : imageHeight.toFixed(1)} cm
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Tính chất:</span>
                        <span className={`font-bold ${isVirtual ? "text-slate-400" : "text-rose-400"}`}>
                            {Math.abs(objectDistance - focalLength) < 0.1 ? "-" : isVirtual ? "Ảnh Ảo, Cùng chiều" : "Ảnh Thật, Ngược chiều"}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black flex justify-center items-center relative overflow-hidden">
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={600} 
                    className="bg-transparent max-w-full"
                />
            </div>
        </div>
    );
}
