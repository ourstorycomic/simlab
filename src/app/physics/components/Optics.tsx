"use client";

import React, { useState, useEffect, useRef } from "react";
import { Eye, SlidersHorizontal, Maximize2, Minimize2, Tv, MousePointer } from "lucide-react";

export default function Optics() {
    const [focalLength, setFocalLength] = useState(50); // f in cm
    const [objectDistance, setObjectDistance] = useState(100); // d in cm
    const [objectHeight, setObjectHeight] = useState(30); // h in cm
    const [mobileTab, setMobileTab] = useState<"sim" | "controls">("sim");
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isDraggingObj, setIsDraggingObj] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDraggingRef = useRef(false);

    // Coordinate conversion helper
    const getCanvasCoords = (clientX: number, clientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const scaleX = 800 / rect.width;
        const scaleY = 600 / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    const handleStartDrag = (clientX: number, clientY: number) => {
        const coords = getCanvasCoords(clientX, clientY);
        if (!coords) return;
        const cx = 400;
        const cy = 300;
        const scale = 2;
        const objX = cx - objectDistance * scale;
        const objY = cy - objectHeight * scale;

        // Check distance to object arrow
        const dx = Math.abs(coords.x - objX);
        const isNearHeight = coords.y >= Math.min(cy, objY) - 30 && coords.y <= Math.max(cy, objY) + 30;

        if (dx <= 50 && isNearHeight) {
            isDraggingRef.current = true;
            setIsDraggingObj(true);
            if (typeof window !== "undefined" && navigator.vibrate) {
                navigator.vibrate(25);
            }
        }
    };

    const handleMoveDrag = (clientX: number, clientY: number) => {
        if (!isDraggingRef.current) return;
        const coords = getCanvasCoords(clientX, clientY);
        if (!coords) return;
        const cx = 400;
        const cy = 300;
        const scale = 2;

        // Calculate new object distance d
        const newDist = Math.round((cx - coords.x) / scale);
        setObjectDistance(Math.max(20, Math.min(180, newDist)));

        // Calculate new object height h
        const newHeight = Math.round((cy - coords.y) / scale);
        setObjectHeight(Math.max(10, Math.min(60, newHeight)));
    };

    const handleEndDrag = () => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            setIsDraggingObj(false);
        }
    };

    // Window listeners while dragging
    useEffect(() => {
        if (!isDraggingObj) return;

        const onWinTouchMove = (e: TouchEvent) => {
            if (!isDraggingRef.current || e.touches.length === 0) return;
            if (e.cancelable) e.preventDefault();
            handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
        };

        const onWinTouchEnd = () => handleEndDrag();

        const onWinMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            handleMoveDrag(e.clientX, e.clientY);
        };

        const onWinMouseUp = () => handleEndDrag();

        window.addEventListener("touchmove", onWinTouchMove, { passive: false });
        window.addEventListener("touchend", onWinTouchEnd);
        window.addEventListener("touchcancel", onWinTouchEnd);
        window.addEventListener("mousemove", onWinMouseMove);
        window.addEventListener("mouseup", onWinMouseUp);

        return () => {
            window.removeEventListener("touchmove", onWinTouchMove);
            window.removeEventListener("touchend", onWinTouchEnd);
            window.removeEventListener("touchcancel", onWinTouchEnd);
            window.removeEventListener("mousemove", onWinMouseMove);
            window.removeEventListener("mouseup", onWinMouseUp);
        };
    }, [isDraggingObj]);

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

        // Grab handle at top of object arrow for touch & drag
        ctx.beginPath();
        ctx.arc(objX, objY, 7, 0, 2 * Math.PI);
        ctx.fillStyle = isDraggingObj ? "#10b981" : "#34d399";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = "#34d399";
        ctx.fillText("Vật AB (Kéo)", objX - 30, objY - 12);

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
        <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden">
            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex items-center justify-around bg-slate-800/95 border-b border-slate-700/80 p-1.5 z-20 shrink-0">
                <button
                    onClick={() => setMobileTab("sim")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center transition-all ${
                        mobileTab === "sim"
                            ? "bg-sky-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-white"
                    }`}
                >
                    <span className="inline-flex items-center justify-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Thấu kính
                    </span>
                </button>
                <button
                    onClick={() => setMobileTab("controls")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center transition-all ${
                        mobileTab === "controls"
                            ? "bg-sky-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-white"
                    }`}
                >
                    <span className="inline-flex items-center justify-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Bảng điều khiển & Kết quả
                    </span>
                </button>
            </div>

            {/* Control Panel (Left on Desktop, Tab on Mobile) */}
            <div
                className={`w-full lg:w-96 bg-slate-800/50 border-r border-slate-700 p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto z-10 shadow-2xl transition-all duration-300 ${
                    mobileTab === "controls" ? "flex flex-1" : isTheaterMode ? "hidden" : "hidden lg:flex"
                }`}
            >
                <h2 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Quang Học: Thấu Kính Hội Tụ
                </h2>

                <div className="bg-slate-800/80 p-3.5 sm:p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-xs sm:text-sm font-semibold text-slate-300">Tiêu cự (f)</label>
                        <span className="text-base sm:text-lg font-mono font-bold text-sky-400">{focalLength} cm</span>
                    </div>
                    <input 
                        type="range" min="10" max="150" step="1" 
                        value={focalLength} onChange={(e) => setFocalLength(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                </div>

                <div className="bg-slate-800/80 p-3.5 sm:p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-xs sm:text-sm font-semibold text-slate-300">Khoảng cách vật (d)</label>
                        <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">{objectDistance} cm</span>
                    </div>
                    <input 
                        type="range" min="10" max="300" step="1" 
                        value={objectDistance} onChange={(e) => setObjectDistance(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
                
                <div className="bg-slate-800/80 p-3.5 sm:p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-xs sm:text-sm font-semibold text-slate-300">Chiều cao vật (h)</label>
                        <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">{objectHeight} cm</span>
                    </div>
                    <input 
                        type="range" min="10" max="100" step="1" 
                        value={objectHeight} onChange={(e) => setObjectHeight(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>

                <div className="bg-slate-900/80 p-4 sm:p-5 rounded-xl border border-slate-700 mt-auto">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-300 mb-2 sm:mb-3">Thông số Ảnh (d&apos;)</h3>
                    <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
                        <span className="text-slate-400">Khoảng cách (d&apos;):</span>
                        <span className="font-bold font-mono text-rose-400 text-base sm:text-lg">
                            {Math.abs(objectDistance - focalLength) < 0.1 ? "∞" : imageDistance.toFixed(1)} cm
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
                        <span className="text-slate-400">Độ cao (h&apos;):</span>
                        <span className="font-bold font-mono text-rose-400 text-base sm:text-lg">
                            {Math.abs(objectDistance - focalLength) < 0.1 ? "∞" : imageHeight.toFixed(1)} cm
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-slate-400">Tính chất:</span>
                        <span className={`font-bold ${isVirtual ? "text-slate-400" : "text-rose-400"}`}>
                            {Math.abs(objectDistance - focalLength) < 0.1 ? "-" : isVirtual ? "Ảnh Ảo, Cùng chiều" : "Ảnh Thật, Ngược chiều"}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Simulation Area */}
            <div
                className={`flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black flex flex-col justify-center items-center relative overflow-hidden ${
                    mobileTab === "sim" ? "flex" : "hidden lg:flex"
                }`}
            >
                {/* Top Bar for Theater Mode & Quick Results */}
                <div className="absolute top-2.5 right-2.5 sm:top-5 sm:right-5 z-20 flex items-center gap-2">
                    <button
                        onClick={() => setIsTheaterMode(!isTheaterMode)}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur transition-all active:scale-95 border ${
                            isTheaterMode 
                                ? "bg-sky-600 border-sky-400 text-white shadow-sky-600/30 ring-2 ring-sky-400/30"
                                : "bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-sky-300"
                        }`}
                        title={isTheaterMode ? "Thu nhỏ lại chế độ tiêu chuẩn" : "Phóng to toàn màn hình thí nghiệm cho khán giả"}
                    >
                        {isTheaterMode ? (
                            <>
                                <Minimize2 className="w-3.5 h-3.5 text-sky-400" />
                                <span>Thu nhỏ</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                                <span>Phóng to Trình chiếu</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Theater Mode Settings Pill Trigger on Left */}
                {isTheaterMode && (
                    <div className="hidden lg:flex absolute top-5 left-5 z-20 items-center gap-2">
                        <button
                            onClick={() => setIsTheaterMode(false)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800/95 hover:bg-slate-700 border border-slate-600 text-sky-300 text-xs font-semibold flex items-center gap-1.5 shadow-xl backdrop-blur transition-all"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                            <span>Hiện bảng chỉnh (f = {focalLength}cm)</span>
                        </button>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                            <Tv className="w-3 h-3 text-sky-400" />
                            Trình chiếu Quang học
                        </span>
                    </div>
                )}

                {/* Mobile Result Pill */}
                <div className="lg:hidden p-2 bg-slate-900/90 border-b border-slate-800 w-full flex items-center justify-around text-center text-xs shrink-0">
                    <div>
                        <span className="text-[10px] text-slate-400 block">Tiêu cự f</span>
                        <span className="font-mono font-bold text-sky-400">{focalLength} cm</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 block">Vật d</span>
                        <span className="font-mono font-bold text-emerald-400">{objectDistance} cm</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 block">Ảnh d&apos;</span>
                        <span className="font-mono font-bold text-rose-400">
                            {Math.abs(objectDistance - focalLength) < 0.1 ? "∞" : imageDistance.toFixed(1)} cm
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 block">Loại ảnh</span>
                        <span className={`font-bold text-[11px] ${isVirtual ? "text-slate-400" : "text-rose-400"}`}>
                            {Math.abs(objectDistance - focalLength) < 0.1 ? "Vô cực" : isVirtual ? "Ảo" : "Thật"}
                        </span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-2 overflow-hidden w-full relative">
                    {/* Interactive hint */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-900/80 backdrop-blur border border-slate-700 text-emerald-300 shadow-md">
                            <MousePointer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Chạm & kéo mũi tên xanh (vật AB) để chỉnh d và h</span>
                        </span>
                    </div>

                    <canvas 
                        ref={canvasRef} 
                        width={800} 
                        height={600} 
                        className="w-full max-w-[500px] sm:max-w-none h-auto sm:h-full object-contain z-0 cursor-grab active:cursor-grabbing touch-none select-none"
                        onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY)}
                        onMouseMove={(e) => handleMoveDrag(e.clientX, e.clientY)}
                        onMouseUp={handleEndDrag}
                        onMouseLeave={handleEndDrag}
                        onTouchStart={(e) => {
                            if (e.touches.length > 0) {
                                handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
                            }
                        }}
                        onTouchMove={(e) => {
                            if (isDraggingRef.current && e.touches.length > 0) {
                                if (e.cancelable) e.preventDefault();
                                handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
                            }
                        }}
                        onTouchEnd={handleEndDrag}
                        onTouchCancel={handleEndDrag}
                    />
                </div>

                {/* Mobile Action Bar */}
                <div className="lg:hidden p-2.5 bg-slate-900/95 border-t border-slate-800 w-full flex items-center justify-center shrink-0">
                    <button
                        onClick={() => setMobileTab("controls")}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-600 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Thay đổi tiêu cự (f) & khoảng cách (d)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
