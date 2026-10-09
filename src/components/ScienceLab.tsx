"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Experiment, QuizQuestion } from "@/lib/experiments";
import { Assignment, Submission } from "@/lib/storage";
import confetti from "canvas-confetti";

// Dynamically import ModelViewer to prevent SSR issues with Three.js
const ModelViewer = dynamic(() => import("./ModelViewer"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-96 flex flex-col items-center justify-center bg-slate-900 text-slate-400 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium">Đang tải không gian mô phỏng 3D...</p>
        </div>
    ),
});

export interface ScienceLabProps {
    experiment: Experiment;
    assignment?: Assignment | null;
    studentId?: string | null;
    submitted?: Submission | null;
    onSubmit?: (score: number, answers: number[], log: string[]) => void;
}

// ─── Biology Organ Definitions with Hotspots ───
interface OrganInfo {
    id: string;
    name: string;
    file: string;
    system: string;
    summary: string;
    hotspots: Array<{ id: string; label: string; description: string; position: [number, number, number] }>;
}

const BIO_ORGANS: OrganInfo[] = [
    {
        id: "brain",
        name: "Não bộ (Brain)",
        file: "/models/brain.glb",
        system: "Hệ thần kinh",
        summary: "Trung tâm điều khiển tối cao với 86 tỷ nơ-ron, phân chia thành thùy trán, thùy đỉnh, thùy thái dương và tiểu não.",
        hotspots: [
            { id: "frontal", label: "Thùy trán", description: "Điều hành tư duy logic, ra quyết định và vận động chủ động.", position: [-0.7, 0.65, 0.8] },
            { id: "temporal", label: "Thùy thái dương", description: "Xử lý thính giác, ngôn ngữ Wernicke và ghi nhớ ký ức (hồi hải mã).", position: [0.75, -0.1, 0.82] },
            { id: "cerebellum", label: "Tiểu não", description: "Điều hòa thăng bằng và phối hợp nhịp nhàng các động tác cơ bắp phức tạp.", position: [0.72, -0.9, 0.55] }
        ]
    },
    {
        id: "heart",
        name: "Trái tim (Heart)",
        file: "/models/heart.glb",
        system: "Hệ tuần hoàn",
        summary: "Cơ quan cơ rỗng gồm 4 buồng hoạt động như máy bơm máu liên tục đi khắp cơ thể với 100.000 nhịp/ngày.",
        hotspots: [
            { id: "aorta", label: "Động mạch chủ", description: "Ống dẫn máu lớn nhất đưa máu giàu O₂ từ tâm thất trái đi nuôi toàn bộ cơ thể.", position: [-0.35, 1.65, 0.55] },
            { id: "left-ventricle", label: "Tâm thất trái", description: "Buồng cơ dày nhất tạo áp lực tống máu vào vòng đại tuần hoàn.", position: [0.7, -0.75, 0.65] },
            { id: "right-atrium", label: "Tâm nhĩ phải", description: "Nhận máu nghèo O₂ từ các tĩnh mạch chủ trên và dưới trở về tim.", position: [-0.9, 0.35, 0.55] }
        ]
    },
    {
        id: "lungs",
        name: "Phổi (Lungs)",
        file: "/models/lungs.glb",
        system: "Hệ hô hấp",
        summary: "Cơ quan xốp đàn hồi chứa hơn 300 triệu phế nang thực hiện trao đổi khí O₂ và CO₂ qua màng mao mạch.",
        hotspots: [
            { id: "trachea", label: "Khí quản", description: "Ống sụn hình chữ C dẫn khí và có lớp biểu mô lông chuyển lọc bụi bẩn.", position: [0, 1.6, 0.2] },
            { id: "bronchus", label: "Cây phế quản", description: "Hệ thống phân nhánh dẫn khí đi sâu vào từng tiểu thùy phổi.", position: [-0.03, 0.3, 0.35] }
        ]
    },
    {
        id: "kidneys",
        name: "Thận (Kidneys)",
        file: "/models/kidneys.glb",
        system: "Hệ bài tiết",
        summary: "Cặp cơ quan hình hạt đậu lọc khoảng 180 lít dịch lọc mỗi ngày qua 2 triệu nephron để tạo ra 1.5L nước tiểu.",
        hotspots: [
            { id: "cortex", label: "Vỏ thận", description: "Chứa các cầu thận lọc máu dưới áp lực lớn.", position: [-0.9, 0.55, 0.7] },
            { id: "ureter", label: "Niệu quản", description: "Ống cơ trơn co bóp nhu động dẫn nước tiểu xuống bàng quang.", position: [0.4, -1.1, 0.5] }
        ]
    },
    {
        id: "eyeball",
        name: "Nhãn cầu (Eye)",
        file: "/models/eyeball.glb",
        system: "Hệ giác quan",
        summary: "Hệ thống quang học sinh học hoàn chỉnh gồm giác mạc, thủy tinh thể và võng mạc cảm thụ ánh sáng.",
        hotspots: [
            { id: "cornea", label: "Giác mạc", description: "Thấu kính trong suốt phía trước chiếm 70% khả năng hội tụ quang học.", position: [-0.94, 0.05, 1.47] },
            { id: "optic", label: "Dây thần kinh thị giác", description: "Dẫn truyền xung điện từ tế bào nón/que về vùng thị giác thùy chẩm.", position: [1.61, -0.18, 0.54] }
        ]
    }
];

// ─── Physics Sim 1: Con lắc đơn (Pendulum) ───
function PendulumSimulation({ onStepComplete }: { onStepComplete?: (idx: number) => void }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [length, setLength] = useState<number>(1.0); // m
    const [mass, setMass] = useState<number>(0.5); // kg
    const [gravity, setGravity] = useState<number>(9.8); // m/s^2
    const [initialAngle, setInitialAngle] = useState<number>(5); // deg
    const [isAttached, setIsAttached] = useState<boolean>(false);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [calculatedG, setCalculatedG] = useState<string>("");
    const [feedback, setFeedback] = useState<{ text: string, type: "success" | "error" } | null>(null);

    const [visitedL, setVisitedL] = useState<number[]>([]);

    useEffect(() => {
        setVisitedL((prev) => prev.includes(length) ? prev : [...prev, length]);
    }, [length]);

    useEffect(() => {
        if (onStepComplete) {
            if (isAttached) onStepComplete(0); // Buộc chặt đầu dây
            if (length === 0.5) onStepComplete(1); // Đo chính xác L=50cm
            if (isRunning) onStepComplete(2); // Kéo quả nặng
            if (elapsedTime > 5) {
                onStepComplete(3); // Dùng đồng hồ đo
                onStepComplete(4); // Tính chu kỳ
            }
            if (visitedL.length >= 3) onStepComplete(5); // Thay đổi chiều dài dây
            
            if (calculatedG.trim() !== "") {
                const gValue = parseFloat(calculatedG);
                if (!isNaN(gValue) && Math.abs(gValue - gravity) < 0.5) {
                    onStepComplete(6);
                }
            }
        }
    }, [isAttached, length, isRunning, elapsedTime, visitedL, calculatedG, gravity, onStepComplete]);

    const theoreticalPeriod = useMemo(() => {
        return (2 * Math.PI * Math.sqrt(length / gravity)).toFixed(3);
    }, [length, gravity]);

    useEffect(() => {
        let animId: number;
        let lastTime = performance.now();
        let angleRad = (initialAngle * Math.PI) / 180;
        let angleVel = 0;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const originX = canvas.width / 2;
        const originY = 60;
        const pixelScale = 140; // px per meter

        const render = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            if (isRunning) {
                setElapsedTime((prev) => prev + dt);
                // Simple pendulum equation of motion with small air damping
                const angleAcc = -(gravity / length) * Math.sin(angleRad) - 0.02 * angleVel;
                angleVel += angleAcc * dt;
                angleRad += angleVel * dt;
            }

            const bobX = originX + length * pixelScale * Math.sin(angleRad);
            const bobY = originY + length * pixelScale * Math.cos(angleRad);

            // Draw Canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Grid background
            ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 30) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 30) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Pivot support
            ctx.fillStyle = "#475569";
            ctx.fillRect(originX - 40, originY - 14, 80, 10);
            ctx.beginPath();
            ctx.arc(originX, originY, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#94a3b8";
            ctx.fill();

            if (isAttached) {
                // Center vertical dashed reference
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
                ctx.beginPath();
                ctx.moveTo(originX, originY);
                ctx.lineTo(originX, originY + length * pixelScale + 30);
                ctx.stroke();
                ctx.setLineDash([]);

                // Angle arc
                ctx.beginPath();
                ctx.arc(originX, originY, 40, Math.PI / 2, Math.PI / 2 + angleRad, angleRad < 0);
                ctx.strokeStyle = "#38bdf8";
                ctx.lineWidth = 2;
                ctx.stroke();

                // Rod / String
                ctx.strokeStyle = "#e2e8f0";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(originX, originY);
                ctx.lineTo(bobX, bobY);
                ctx.stroke();

                // Bob shadow & Bob
                const bobRadius = 14 + mass * 8;
                ctx.beginPath();
                ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
                const gradient = ctx.createRadialGradient(bobX - bobRadius / 3, bobY - bobRadius / 3, 2, bobX, bobY, bobRadius);
                gradient.addColorStop(0, "#38bdf8");
                gradient.addColorStop(0.7, "#0284c7");
                gradient.addColorStop(1, "#0369a1");
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.strokeStyle = "#bae6fd";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Real-time speed vector
                const vTangent = length * angleVel * 15;
                const vx = vTangent * Math.cos(angleRad);
                const vy = -vTangent * Math.sin(angleRad);
                ctx.beginPath();
                ctx.moveTo(bobX, bobY);
                ctx.lineTo(bobX + vx, bobY + vy);
                ctx.strokeStyle = "#f43f5e";
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }

            animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [isAttached, length, mass, gravity, initialAngle, isRunning]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100 shadow-xl">
            {/* Canvas View */}
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/80 rounded-xl p-4 border border-slate-800 relative">
                <canvas ref={canvasRef} width={500} height={360} className="w-full max-w-[500px] h-[360px] rounded-lg" />
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-mono text-cyan-400">
                        t = {elapsedTime.toFixed(1)}s
                    </span>
                    <span className="px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400">
                        T (lý thuyết) = {theoreticalPeriod}s
                    </span>
                </div>
            </div>

            {/* Controls Panel */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    Thông số điều khiển mô phỏng
                </h3>

                <div className="space-y-3 text-sm">
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Chiều dài dây (l):</span>
                            <span className="font-mono text-cyan-300 font-bold">{length.toFixed(2)} m</span>
                        </div>
                        <input
                            type="range"
                            min="0.3"
                            max="1.8"
                            step="0.05"
                            value={length}
                            onChange={(e) => setLength(parseFloat(e.target.value))}
                            className="w-full accent-cyan-500 cursor-pointer"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Khối lượng quả nặng (m):</span>
                            <span className="font-mono text-cyan-300 font-bold">{mass.toFixed(2)} kg</span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="1.5"
                            step="0.1"
                            value={mass}
                            onChange={(e) => setMass(parseFloat(e.target.value))}
                            className="w-full accent-cyan-500 cursor-pointer"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Gia tốc trọng trường (g):</span>
                            <span className="font-mono text-cyan-300 font-bold">{gravity} m/s²</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-xs">
                            {[
                                { name: "Trái Đất", g: 9.8 },
                                { name: "Mặt Trăng", g: 1.62 },
                                { name: "Sao Mộc", g: 24.8 },
                            ].map((env) => (
                                <button
                                    key={env.name}
                                    onClick={() => setGravity(env.g)}
                                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                                        gravity === env.g ? "bg-cyan-600 border-cyan-400 text-white font-bold" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                    }`}
                                >
                                    {env.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Góc thả ban đầu (α):</span>
                            <span className="font-mono text-cyan-300 font-bold">{initialAngle}°</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="60"
                            step="1"
                            value={initialAngle}
                            onChange={(e) => setInitialAngle(parseFloat(e.target.value))}
                            disabled={isRunning || !isAttached}
                            className={`w-full accent-cyan-500 cursor-pointer ${isRunning || !isAttached ? "opacity-50" : ""}`}
                        />
                    </div>
                </div>

                {/* Simulation Control Buttons */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                    {!isAttached ? (
                        <button
                            onClick={() => setIsAttached(true)}
                            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-sm text-white shadow-md transition-all"
                        >
                            🔗 Buộc dây vào giá đỡ
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsRunning(!isRunning)}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                                    isRunning ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                }`}
                            >
                                {isRunning ? "Tạm dừng" : (elapsedTime === 0 ? "Thả con lắc" : "Tiếp tục")}
                            </button>
                            <button
                                onClick={() => {
                                    setElapsedTime(0);
                                    setIsRunning(false);
                                    setIsAttached(false);
                                }}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm text-slate-200"
                            >
                                Đặt lại
                            </button>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-slate-800">
                    <div className="text-xs text-slate-400 mb-2">Tính toán gia tốc rơi tự do (g):</div>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            step="0.1"
                            placeholder="Ví dụ: 9.8"
                            value={calculatedG}
                            onChange={(e) => setCalculatedG(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                            onClick={() => {
                                const gValue = parseFloat(calculatedG);
                                if (!isNaN(gValue) && Math.abs(gValue - gravity) < 0.5) {
                                    setFeedback({ text: "Chính xác! Đã tính đúng gia tốc g.", type: "success" });
                                    setTimeout(() => setFeedback(null), 3000);
                                    if (onStepComplete) onStepComplete(6);
                                } else {
                                    setFeedback({ text: "Chưa chính xác. Tính lại dựa trên T nhé!", type: "error" });
                                    setTimeout(() => setFeedback(null), 3000);
                                }
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg border border-slate-700"
                        >
                            Kiểm tra
                        </button>
                    </div>
                    {feedback && (
                        <div className={`mt-2 p-2 rounded-lg text-xs text-center font-bold animate-fadeIn ${feedback.type === "success" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}>
                            {feedback.text}
                        </div>
                    )}
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-cyan-400">💡 Ghi chú khoa học:</p>
                    <p>Chu kỳ dao động điều hòa của con lắc đơn phụ thuộc vào chiều dài l và gia tốc trọng trường g, không phụ thuộc vào khối lượng m của vật nặng!</p>
                </div>
            </div>
        </div>
    );
}

// ─── Physics Sim 2: Định luật Ôm & Mạch điện (Ohm's Law) ───
function OhmSimulation({ onStepComplete }: { onStepComplete?: (idx: number) => void }) {
    const [voltage, setVoltage] = useState<number>(12); // V
    const [resistance, setResistance] = useState<number>(20); // Ohm
    const [measurements, setMeasurements] = useState<{ u: number; r: number; i: number }[]>([]);

    useEffect(() => {
        if (onStepComplete) {
            onStepComplete(0); // Lắp mạch điện
            onStepComplete(1); // Mắc vôn kế
            if (voltage === 2) onStepComplete(2); // Đặt hiệu điện thế U = 2V
            if (measurements.length >= 4) {
                onStepComplete(3);
                onStepComplete(4);
                onStepComplete(5); // Vẽ đồ thị (tự động tick)
            }
            if (resistance === 20 && measurements.some(m => m.r === 20)) {
                onStepComplete(6); // Thay điện trở R=20
            }
        }
    }, [voltage, measurements, onStepComplete]);

    const current = useMemo(() => {
        return resistance > 0 ? (voltage / resistance).toFixed(3) : "0.000";
    }, [voltage, resistance]);

    const power = useMemo(() => {
        return (voltage * parseFloat(current)).toFixed(2);
    }, [voltage, current]);

    const handleRecord = () => {
        setMeasurements((prev) => [
            ...prev,
            { u: voltage, r: resistance, i: parseFloat(current) },
        ]);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100 shadow-xl">
            {/* Interactive Schematic Diagram */}
            <div className="flex-1 flex flex-col items-center justify-between bg-slate-900/90 rounded-xl p-6 border border-slate-800">
                <div className="w-full flex justify-between items-center pb-4 border-b border-slate-800">
                    <span className="text-xs uppercase tracking-wider font-bold text-amber-400">Sơ đồ mạch điện ảo chuẩn thí nghiệm</span>
                    <span className="text-xs font-mono text-slate-400">Định luật Ôm: I = U / R</span>
                </div>

                {/* SVG Circuit Schematic */}
                <div className="w-full max-w-md py-6 flex items-center justify-center">
                    <svg viewBox="0 0 400 240" className="w-full h-auto drop-shadow-md">
                        {/* Wires */}
                        <path d="M 60 120 L 60 40 L 340 40 L 340 120" fill="none" stroke="#64748b" strokeWidth="4" />
                        <path d="M 60 120 L 60 200 L 340 200 L 340 120" fill="none" stroke="#64748b" strokeWidth="4" />

                        {/* Power Source (DC) */}
                        <g transform="translate(60, 120)">
                            <line x1="-20" y1="-15" x2="20" y2="-15" stroke="#38bdf8" strokeWidth="4" />
                            <line x1="-10" y1="15" x2="10" y2="15" stroke="#38bdf8" strokeWidth="2.5" />
                            <text x="-40" y="-10" fill="#38bdf8" fontSize="12" fontWeight="bold">+</text>
                            <text x="-40" y="20" fill="#94a3b8" fontSize="12" fontWeight="bold">-</text>
                            <text x="-50" y="5" fill="#f8fafc" fontSize="11" fontWeight="bold">{voltage}V</text>
                        </g>

                        {/* Ammeter (A) */}
                        <g transform="translate(200, 40)">
                            <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
                            <text x="0" y="5" fill="#38bdf8" fontSize="14" fontWeight="bold" textAnchor="middle">A</text>
                            <text x="0" y="-24" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">{current} A</text>
                        </g>

                        {/* Resistor (R) */}
                        <g transform="translate(340, 120)">
                            <rect x="-14" y="-30" width="28" height="60" fill="#334155" stroke="#f59e0b" strokeWidth="3" rx="4" />
                            <text x="24" y="5" fill="#f59e0b" fontSize="12" fontWeight="bold">{resistance} Ω</text>
                        </g>

                        {/* Voltmeter in parallel with Resistor */}
                        <path d="M 300 90 L 260 90 L 260 150 L 300 150" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
                        <g transform="translate(260, 120)">
                            <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                            <text x="0" y="5" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">V</text>
                        </g>

                        {/* Electron Flow animation dots */}
                        <circle cx="120" cy="40" r="3" fill="#38bdf8" className="animate-ping" />
                        <circle cx="280" cy="40" r="3" fill="#38bdf8" className="animate-ping" />
                    </svg>
                </div>

                {/* Live Readout Meters */}
                <div className="w-full grid grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Hiệu điện thế (U)</div>
                        <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{voltage} V</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Cường độ dòng (I)</div>
                        <div className="text-xl font-bold font-mono text-amber-400 mt-1">{current} A</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Công suất tỏa nhiệt (P)</div>
                        <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{power} W</div>
                    </div>
                </div>
            </div>

            {/* Controls & Measurement Log */}
            <div className="w-full lg:w-84 flex flex-col gap-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    Biến trở & Nguồn phát
                </h3>

                <div className="space-y-4 text-sm bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Điện áp nguồn (U):</span>
                            <span className="font-mono text-cyan-300 font-bold">{voltage} V</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="36"
                            step="1"
                            value={voltage}
                            onChange={(e) => setVoltage(parseInt(e.target.value, 10))}
                            className="w-full accent-cyan-500 cursor-pointer"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Điện trở tải (R):</span>
                            <span className="font-mono text-amber-300 font-bold">{resistance} Ω</span>
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="100"
                            step="2"
                            value={resistance}
                            onChange={(e) => setResistance(parseInt(e.target.value, 10))}
                            className="w-full accent-amber-500 cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={handleRecord}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        <span>📥</span> Ghi lại số liệu thực nghiệm
                    </button>
                </div>

                {/* Data Points Table */}
                <div className="flex-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase text-slate-300">Bảng đo số liệu ({measurements.length})</span>
                        {measurements.length > 0 && (
                            <button onClick={() => setMeasurements([])} className="text-[11px] text-rose-400 hover:underline">
                                Xóa bảng
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-40 border border-slate-800 rounded-lg">
                        <table className="w-full text-xs text-left text-slate-300">
                            <thead className="bg-slate-800 text-slate-400 sticky top-0">
                                <tr>
                                    <th className="p-2">Lần</th>
                                    <th className="p-2">U (V)</th>
                                    <th className="p-2">R (Ω)</th>
                                    <th className="p-2">I đo (A)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {measurements.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-slate-500 italic">
                                            Chưa ghi số liệu nào. Bấm nút phía trên để ghi!
                                        </td>
                                    </tr>
                                ) : (
                                    measurements.map((m, idx) => (
                                        <tr key={idx} className="border-t border-slate-800 font-mono">
                                            <td className="p-2 text-slate-400">#{idx + 1}</td>
                                            <td className="p-2 text-cyan-300">{m.u}</td>
                                            <td className="p-2 text-amber-300">{m.r}</td>
                                            <td className="p-2 text-emerald-400 font-bold">{m.i}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Physics Sim 3: Quang học / Thấu kính (Optics Lens) ───
function OpticsSimulation({ onStepComplete }: { onStepComplete?: (idx: number) => void }) {
    const [d, setD] = useState<number>(30); // khoảng cách vật cm
    const [f, setF] = useState<number>(10); // tiêu cự cm
    const [h, setH] = useState<number>(4); // chiều cao vật cm

    const [visitedD, setVisitedD] = useState<number[]>([]);
    const [calculatedF, setCalculatedF] = useState<string>("");
    const [opticsFeedback, setOpticsFeedback] = useState<{ text: string, type: "success" | "error" } | null>(null);

    useEffect(() => {
        setVisitedD((prev) => prev.includes(d) ? prev : [...prev, d]);
    }, [d]);

    useEffect(() => {
        if (onStepComplete) {
            onStepComplete(0);
            if (d === 30) onStepComplete(1);
            if (visitedD.length > 1) {
                onStepComplete(2);
                onStepComplete(3);
            }
            if (calculatedF.trim() !== "") {
                const fValue = parseFloat(calculatedF);
                if (!isNaN(fValue) && Math.abs(fValue - f) < 0.5) {
                    onStepComplete(4);
                }
            }
            if (visitedD.includes(25) && visitedD.includes(20) && visitedD.includes(15)) {
                onStepComplete(5);
            }
        }
    }, [d, f, h, visitedD, calculatedF, onStepComplete]);

    // 1/f = 1/d + 1/d' => d' = (d * f) / (d - f)
    const dPrime = useMemo(() => {
        if (d === f) return Infinity;
        return (d * f) / (d - f);
    }, [d, f]);

    const k = useMemo(() => {
        if (d === 0) return 1;
        return -dPrime / d;
    }, [dPrime, d]);

    const isReal = dPrime > 0;

    return (
        <div className="flex flex-col lg:flex-row gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-100 shadow-xl">
            {/* Visual Ray Bench */}
            <div className="flex-1 flex flex-col items-center justify-between bg-slate-900/90 rounded-xl p-6 border border-slate-800">
                <div className="w-full flex justify-between items-center pb-3 border-b border-slate-800">
                    <span className="text-xs uppercase tracking-wider font-bold text-sky-400">Quang hình học: Mô phỏng tia sáng qua thấu kính mỏng</span>
                    <span className="text-xs font-mono text-emerald-400">
                        {isReal ? "Ảnh thật, hứng được trên màn" : "Ảnh ảo, cùng chiều"}
                    </span>
                </div>

                <div className="w-full py-8 flex items-center justify-center overflow-x-auto">
                    <svg viewBox="0 0 500 240" className="w-full max-w-lg">
                        {/* Optical Axis */}
                        <line x1="20" y1="120" x2="480" y2="120" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" />

                        {/* Converging Lens at center X = 250 */}
                        <g transform="translate(250, 120)">
                            <line x1="0" y1="-90" x2="0" y2="90" stroke="#38bdf8" strokeWidth="3" />
                            {/* Lens arrows indicating converging */}
                            <path d="M -8 -80 L 0 -90 L 8 -80" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                            <path d="M -8 80 L 0 90 L 8 80" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                            <text x="8" y="10" fill="#38bdf8" fontSize="11" fontWeight="bold">O</text>
                        </g>

                        {/* Focus points F and F' */}
                        {/* X_O = 250. Scale: 1cm = 4px */}
                        <circle cx={250 - f * 5} cy={120} r="3" fill="#f59e0b" />
                        <text x={250 - f * 5 - 6} y={135} fill="#f59e0b" fontSize="10" fontWeight="bold">F</text>
                        <circle cx={250 + f * 5} cy={120} r="3" fill="#f59e0b" />
                        <text x={250 + f * 5 - 6} y={135} fill="#f59e0b" fontSize="10" fontWeight="bold">F&apos;</text>

                        {/* Object Arrow AB */}
                        {/* X_A = 250 - d * 5 */}
                        <g transform={`translate(${250 - Math.min(d * 5, 220)}, 120)`}>
                            <line x1="0" y1="0" x2="0" y2={-h * 8} stroke="#ef4444" strokeWidth="3" />
                            <polygon points={`0,${-h * 8 - 6} -4,${-h * 8} 4,${-h * 8}`} fill="#ef4444" />
                            <text x="-12" y="14" fill="#ef4444" fontSize="11" fontWeight="bold">A</text>
                            <text x="-12" y={-h * 8 - 4} fill="#ef4444" fontSize="11" fontWeight="bold">B</text>
                        </g>

                        {/* Rays from object tip B */}
                        {/* Ray 1: Parallel to axis, refracts through F' */}
                        <line x1={250 - Math.min(d * 5, 220)} y1={120 - h * 8} x2={250} y2={120 - h * 8} stroke="#eab308" strokeWidth="1.5" />
                        <line x1={250} y1={120 - h * 8} x2={460} y2={120 - h * 8 + (460 - 250) * ((h * 8) / (f * 5))} stroke="#eab308" strokeWidth="1.5" />
                        {!isReal && Number.isFinite(dPrime) && (
                            <line x1={250} y1={120 - h * 8} x2={250 + dPrime * 5} y2={120 - k * h * 8} stroke="#eab308" strokeWidth="1.5" strokeDasharray="4 4" />
                        )}

                        {/* Ray 2: Passes through Optical Center O */}
                        <line x1={250 - Math.min(d * 5, 220)} y1={120 - h * 8} x2={460} y2={120 + ((460 - 250) * (h * 8)) / (d * 5)} stroke="#38bdf8" strokeWidth="1.5" />
                        {!isReal && Number.isFinite(dPrime) && (
                            <line x1={250} y1={120} x2={250 + dPrime * 5} y2={120 - k * h * 8} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
                        )}

                        {/* Image Arrow A'B' */}
                        {Number.isFinite(dPrime) && Math.abs(dPrime * 5) < 220 && (
                            <g transform={`translate(${250 + dPrime * 5}, 120)`}>
                                <line x1="0" y1="0" x2="0" y2={-k * h * 8} stroke="#10b981" strokeWidth="3" strokeDasharray={isReal ? undefined : "4 4"} />
                                <polygon points={`0,${-k * h * 8 + (k > 0 ? -6 : 6)} -4,${-k * h * 8} 4,${-k * h * 8}`} fill="#10b981" />
                                <text x="6" y="14" fill="#10b981" fontSize="11" fontWeight="bold">A&apos;</text>
                                <text x="6" y={-k * h * 8 + (k > 0 ? -10 : 16)} fill="#10b981" fontSize="11" fontWeight="bold">B&apos;</text>
                            </g>
                        )}
                    </svg>
                </div>

                {/* Readout stats */}
                <div className="w-full grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400">Khoảng cách d</span>
                        <div className="text-sm font-mono font-bold text-rose-400 mt-1">{d} cm</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400">Tiêu cự f</span>
                        <div className="text-sm font-mono font-bold text-amber-400 mt-1">{f} cm</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400">Khoảng ảnh d&apos;</span>
                        <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                            {Number.isFinite(dPrime) ? `${dPrime.toFixed(1)} cm` : "Vô cực (∞)"}
                        </div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400">Độ phóng đại k</span>
                        <div className="text-sm font-mono font-bold text-cyan-400 mt-1">
                            {Number.isFinite(k) ? k.toFixed(2) : "∞"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sliders */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    Điều chỉnh vị trí thấu kính
                </h3>

                <div className="space-y-4 text-sm bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Vị trí vật (d):</span>
                            <span className="font-mono text-rose-400 font-bold">{d} cm</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="45"
                            step="1"
                            value={d}
                            onChange={(e) => setD(parseInt(e.target.value, 10))}
                            className="w-full accent-rose-500 cursor-pointer"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Tiêu cự thấu kính (f):</span>
                            <span className="font-mono text-amber-400 font-bold">{f} cm</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="20"
                            step="1"
                            value={f}
                            onChange={(e) => setF(parseInt(e.target.value, 10))}
                            className="w-full accent-amber-500 cursor-pointer"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Chiều cao vật (h):</span>
                            <span className="font-mono text-sky-400 font-bold">{h} cm</span>
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="8"
                            step="0.5"
                            value={h}
                            onChange={(e) => setH(parseFloat(e.target.value))}
                            className="w-full accent-sky-500 cursor-pointer"
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                    <div className="font-bold text-sky-400">Quy tắc xác định ảnh:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>d &gt; 2f: Ảnh thật, ngược chiều, nhỏ hơn vật.</li>
                        <li>d = 2f: Ảnh thật, ngược chiều, bằng vật (k = -1).</li>
                        <li>f &lt; d &lt; 2f: Ảnh thật, ngược chiều, lớn hơn vật.</li>
                        <li>d &lt; f: Ảnh ảo, cùng chiều, lớn hơn vật.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

// ─── Main ScienceLab Component ───
export default function ScienceLab({
    experiment,
    assignment,
    studentId,
    submitted,
    onSubmit,
}: ScienceLabProps) {
    const isPhysics = experiment.subject === "physics";
    const isBiology = experiment.subject === "biology";

    // Navigation Tabs
    const [activeTab, setActiveTab] = useState<"theory" | "experiment" | "quiz">("experiment");

    // Biology 3D State
    const [selectedOrganId, setSelectedOrganId] = useState<string>("brain");
    const [activeHotspotDesc, setActiveHotspotDesc] = useState<string | null>(null);

    const currentOrgan = useMemo(() => {
        return BIO_ORGANS.find((o) => o.id === selectedOrganId) || BIO_ORGANS[0];
    }, [selectedOrganId]);

    // Step-by-step checklist
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const completeStep = useCallback((idx: number) => {
        setCompletedSteps((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
    }, []);

    // Bio checklist completion logic
    useEffect(() => {
        if (isBiology) {
            completeStep(0); // Khởi động mô hình
            if (selectedOrganId !== "brain") completeStep(1); // Chọn cơ quan khác
            if (activeHotspotDesc) completeStep(2); // Xem chi tiết
        }
    }, [isBiology, selectedOrganId, activeHotspotDesc, completeStep]);

    // Quiz State
    const quizList = assignment?.customQuiz || experiment.quiz || [];
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState<boolean>(!!submitted);
    const [score, setScore] = useState<number>(() => {
        if (submitted) {
            return Math.round((submitted.correctCount / Math.max(1, submitted.totalQuestions)) * 10);
        }
        return 0;
    });

    const handleSelectOption = (qIdx: number, optIdx: number) => {
        if (quizSubmitted) return;
        setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
    };

    const handleQuizSubmit = () => {
        if (quizList.length === 0) return;
        let correct = 0;
        const answerArr: number[] = [];
        quizList.forEach((q, idx) => {
            const chosen = selectedAnswers[idx] ?? -1;
            answerArr.push(chosen);
            if (chosen === q.correctIndex) correct++;
        });

        const calculatedScore = Math.round((correct / quizList.length) * 10);
        setScore(calculatedScore);
        setQuizSubmitted(true);

        if (calculatedScore >= 8) {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
            });
        }

        if (onSubmit) {
            const log = [
                `Bắt đầu nghiên cứu thí nghiệm: ${experiment.name}`,
                `Hoàn thành ${completedSteps.length}/${experiment.steps?.length || 0} bước thao tác thực nghiệm`,
                `Hoàn tất bài kiểm tra đánh giá: đạt ${correct}/${quizList.length} câu (${calculatedScore}/10 điểm)`,
            ];
            onSubmit(calculatedScore, answerArr, log);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* Top Workspace Header */}
            <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-lg">
                <div className="flex items-center gap-3">
                    <Link
                        href={studentId ? "/dashboard/student" : "/"}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
                        title="Trở về"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </Link>

                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                                    isPhysics
                                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                }`}
                            >
                                {isPhysics ? "Vật Lý" : "Sinh Học"} • Lớp {experiment.grade}
                            </span>
                            <span className="text-xs text-slate-400">{experiment.chapter}</span>
                        </div>
                        <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                            <span>{experiment.emoji}</span>
                            <span>{experiment.name}</span>
                        </h1>
                    </div>
                </div>

                {/* Primary Mode Tabs */}
                <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
                    <button
                        onClick={() => setActiveTab("theory")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === "theory"
                                ? "bg-indigo-600 text-white shadow-md"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        📘 Lý thuyết & Mục tiêu
                    </button>
                    <button
                        onClick={() => setActiveTab("experiment")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === "experiment"
                                ? isPhysics
                                    ? "bg-cyan-600 text-white shadow-md"
                                    : "bg-emerald-600 text-white shadow-md"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        🔬 Thí nghiệm tương tác
                    </button>
                    <button
                        onClick={() => setActiveTab("quiz")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === "quiz"
                                ? "bg-amber-600 text-white shadow-md"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        📝 Đánh giá kiểm tra ({quizList.length})
                    </button>
                </div>

                {/* Right Status Badge */}
                <div className="flex items-center gap-3">
                    {submitted || quizSubmitted ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Đã nộp bài: {score}/10 điểm</span>
                        </div>
                    ) : assignment ? (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                            Hạn nộp: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString("vi-VN") : "Không thời hạn"}
                        </div>
                    ) : null}
                </div>
            </header>

            {/* Main Interactive Workstation Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
                {/* ─── TAB 1: THEORY & OBJECTIVES ─── */}
                {activeTab === "theory" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <span className="text-indigo-400">📖</span> Bản chất khoa học & Cơ sở lý thuyết
                                </h2>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                    {experiment.theory}
                                </p>
                            </div>

                            {experiment.equations && experiment.equations.length > 0 && (
                                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                                    <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="text-amber-400">⚡</span> Công thức & Phương trình trọng tâm
                                    </h2>
                                    <div className="space-y-2">
                                        {experiment.equations.map((eq, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-sm text-cyan-300 flex items-center gap-2"
                                            >
                                                <span className="text-slate-500 text-xs">#{idx + 1}</span>
                                                <span>{eq}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                                    <span className="text-emerald-400">🎯</span> Mục tiêu cần đạt (GDPT 2018)
                                </h2>
                                <ul className="space-y-2.5 text-xs text-slate-300">
                                    {experiment.objectives?.map((obj, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                                            <span>{obj}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                                <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="text-rose-400">⚠️</span> Lưu ý an toàn & Dụng cụ
                                </h2>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {experiment.note || "Thực hiện theo đúng hướng dẫn của giáo viên và quy tắc an toàn phòng thí nghiệm."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 2: INTERACTIVE EXPERIMENT BENCH ─── */}
                {activeTab === "experiment" && (
                    <div className="flex flex-col gap-6 animate-fadeIn">
                        {/* Simulation Viewport */}
                        {isBiology ? (
                            /* Biology 3D Organ / Anatomy Viewer */
                            <div className="flex flex-col lg:flex-row gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
                                <div className="w-full lg:w-72 flex flex-col gap-3">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
                                        Mô hình giải phẫu 3D
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {BIO_ORGANS.map((organ) => (
                                            <button
                                                key={organ.id}
                                                onClick={() => {
                                                    setSelectedOrganId(organ.id);
                                                    setActiveHotspotDesc(null);
                                                }}
                                                className={`text-left p-3 rounded-xl border transition-all text-xs ${
                                                    selectedOrganId === organ.id
                                                        ? "bg-emerald-600/20 border-emerald-500 text-white font-bold"
                                                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                                                }`}
                                            >
                                                <div className="font-semibold text-slate-200">{organ.name}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">{organ.system}</div>
                                            </button>
                                        ))}
                                    </div>

                                    {activeHotspotDesc && (
                                        <div className="mt-2 p-3 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs text-slate-300 space-y-1">
                                            <div className="font-bold text-emerald-400">Chi tiết giải phẫu:</div>
                                            <p className="leading-relaxed">{activeHotspotDesc}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 h-[460px] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative">
                                    <ModelViewer
                                        modelUrl={currentOrgan.file}
                                        hotspots={currentOrgan.hotspots}
                                        onHotspotClick={(h) => setActiveHotspotDesc(h.description || h.label)}
                                    />
                                    <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
                                        Đang hiển thị: <span className="font-bold text-emerald-400">{currentOrgan.name}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Physics Simulations */
                            <div>
                                {experiment.id === "exp-pendulum" ? (
                                    <PendulumSimulation onStepComplete={completeStep} />
                                ) : experiment.id === "exp-ohm-law" ? (
                                    <OhmSimulation onStepComplete={completeStep} />
                                ) : experiment.id === "exp-optics-lens" ? (
                                    <OpticsSimulation onStepComplete={completeStep} />
                                ) : (
                                    /* Fallback / General Physics simulation */
                                    <PendulumSimulation onStepComplete={completeStep} />
                                )}
                            </div>
                        )}

                        {/* Step-by-Step Procedure Checklist */}
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <span className="text-cyan-400">📋</span> Quy trình thao tác thực nghiệm từng bước
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Đánh dấu từng bước sau khi đã hoàn thành để ghi nhận quy trình an toàn
                                    </p>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 font-bold">
                                    Tiến độ: {completedSteps.length}/{experiment.steps?.length || 0} bước
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {experiment.steps?.map((stepText, idx) => {
                                    const isDone = completedSteps.includes(idx);
                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 select-none ${
                                                isDone
                                                    ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-200"
                                                    : "bg-slate-950 border-slate-800/80 text-slate-300"
                                            }`}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold mt-0.5 transition-all ${
                                                    isDone
                                                        ? "bg-emerald-600 text-white"
                                                        : "border border-slate-600 text-slate-500"
                                                }`}
                                            >
                                                {isDone ? "✓" : idx + 1}
                                            </div>
                                            <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                                                <span className="font-semibold text-slate-400 mr-2">Bước {idx + 1}:</span>
                                                <span className={isDone ? "line-through text-slate-400" : ""}>{stepText}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: QUIZ EVALUATION & SUBMISSION ─── */}
                {activeTab === "quiz" && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto w-full animate-fadeIn">
                        <div className="border-b border-slate-800 pb-4 mb-6 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span>📝</span> Bài kiểm tra đánh giá kiến thức thí nghiệm
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Trả lời các câu hỏi trắc nghiệm dưới đây để hoàn thành chỉ tiêu bài tập.
                                </p>
                            </div>
                            {quizSubmitted && (
                                <div className="px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-bold text-sm">
                                    Điểm số: {score} / 10
                                </div>
                            )}
                        </div>

                        {quizList.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 text-sm">
                                Thí nghiệm này chưa có câu hỏi trắc nghiệm đính kèm.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {quizList.map((q: QuizQuestion, qIdx: number) => {
                                    const selected = selectedAnswers[qIdx];
                                    const isCorrect = selected === q.correctIndex;
                                    return (
                                        <div
                                            key={qIdx}
                                            className={`p-5 rounded-xl border transition-all ${
                                                quizSubmitted
                                                    ? isCorrect
                                                        ? "bg-emerald-950/20 border-emerald-800/80"
                                                        : "bg-rose-950/20 border-rose-800/80"
                                                    : "bg-slate-950 border-slate-800"
                                            }`}
                                        >
                                            <div className="flex items-start gap-2.5 mb-3">
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-xs font-bold">
                                                    Câu {qIdx + 1}
                                                </span>
                                                <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                                                    {q.question}
                                                </h4>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                {q.options.map((opt: string, optIdx: number) => {
                                                    const isChecked = selected === optIdx;
                                                    let btnStyle = "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800";
                                                    if (quizSubmitted) {
                                                        if (optIdx === q.correctIndex) {
                                                            btnStyle = "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold";
                                                        } else if (isChecked && !isCorrect) {
                                                            btnStyle = "bg-rose-600/30 border-rose-500 text-rose-200";
                                                        }
                                                    } else if (isChecked) {
                                                        btnStyle = "bg-cyan-600 border-cyan-400 text-white font-bold";
                                                    }

                                                    return (
                                                        <button
                                                            key={optIdx}
                                                            type="button"
                                                            disabled={quizSubmitted}
                                                            onClick={() => handleSelectOption(qIdx, optIdx)}
                                                            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${btnStyle}`}
                                                        >
                                                            <span className="w-5 h-5 rounded-full bg-slate-800/80 flex items-center justify-center font-bold text-[10px]">
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </span>
                                                            <span className="flex-1">{opt}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {quizSubmitted && q.explanation && (
                                                <div className="mt-3 p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-400">
                                                    <span className="font-bold text-amber-400">💡 Giải thích chi tiết: </span>
                                                    <span>{q.explanation}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {!quizSubmitted && (
                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={handleQuizSubmit}
                                            disabled={Object.keys(selectedAnswers).length < quizList.length}
                                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {Object.keys(selectedAnswers).length < quizList.length ? `Trả lời ${Object.keys(selectedAnswers).length}/${quizList.length}` : "Nộp bài thí nghiệm"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
