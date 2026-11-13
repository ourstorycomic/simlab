"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    FlaskConical,
    Atom,
    Dna,
    Box,
    RotateCcw,
    ArrowRight,
    Sliders,
    Info,
    CheckCircle2,
    Smartphone,
} from "lucide-react";

type LabTab = "chemistry" | "physics" | "biology" | "3d";

export default function EnterpriseLabShowcase() {
    const [activeTab, setActiveTab] = useState<LabTab>("chemistry");

    // Chemistry interactive state
    const [chemPoured, setChemPoured] = useState(true);
    const [chemConcentration, setChemConcentration] = useState(1.0); // M

    // Physics optics interactive state
    const [objDistance, setObjDistance] = useState(24); // d in cm
    const focalLength = 12; // f in cm
    // 1/f = 1/d + 1/d' => d' = (d * f) / (d - f)
    const imgDistance = useMemo(() => {
        if (objDistance === focalLength) return 999;
        return (objDistance * focalLength) / (objDistance - focalLength);
    }, [objDistance, focalLength]);
    const magnification = useMemo(() => {
        return -imgDistance / objDistance;
    }, [imgDistance, objDistance]);

    // Biology interactive state
    const [selectedOrganelle, setSelectedOrganelle] = useState<"chloroplast" | "nucleus" | "mitochondria" | "vacuole">("chloroplast");

    // 3D VR interactive state
    const [phoneTilt, setPhoneTilt] = useState(38); // degrees

    return (
        <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xl overflow-hidden transition-all">
            {/* Header: Tab Navigation Switcher */}
            <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setActiveTab("chemistry")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeTab === "chemistry"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                        }`}
                    >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Hóa Học 3D</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("physics")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeTab === "physics"
                                ? "bg-sky-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                        }`}
                    >
                        <Atom className="w-3.5 h-3.5" />
                        <span>Vật Lý 3D</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("biology")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeTab === "biology"
                                ? "bg-purple-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                        }`}
                    >
                        <Dna className="w-3.5 h-3.5" />
                        <span>Sinh Học 3D</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("3d")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeTab === "3d"
                                ? "bg-amber-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                        }`}
                    >
                        <Box className="w-3.5 h-3.5" />
                        <span>Lab 3D VR</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {activeTab === "chemistry" && "Hóa Học 11 • Phản Ứng Trao Đổi"}
                        {activeTab === "physics" && "Vật Lý 11 • Quang Hình Học"}
                        {activeTab === "biology" && "Sinh Học 10 • Tế Bào Học"}
                        {activeTab === "3d" && "Công Nghệ • Gyroscope & VR"}
                    </span>
                </div>
            </div>

            {/* Main Interactive Stage Body */}
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60 min-h-[360px] flex flex-col justify-between">
                {/* ─── TAB 1: HÓA HỌC ─── */}
                {activeTab === "chemistry" && (
                    <div className="space-y-4">
                        {/* Simulation Visual Workbench */}
                        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                                {/* Bình đựng CuSO4 */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`relative w-20 h-28 border-2 border-slate-400 dark:border-slate-600 rounded-b-2xl rounded-t-lg bg-sky-500/10 dark:bg-sky-950/30 overflow-hidden flex flex-col justify-end transition-transform duration-300 ${
                                            chemPoured ? "rotate-[-18deg] translate-x-2" : "rotate-0"
                                        }`}
                                    >
                                        {/* Cổ bình */}
                                        <div className="absolute top-0 inset-x-5 h-4 border-b-2 border-slate-400 dark:border-slate-600 bg-slate-200 dark:bg-slate-800" />
                                        {/* Dung dịch bên trong */}
                                        <div
                                            className="w-full bg-gradient-to-t from-sky-600 to-sky-400 transition-all duration-300"
                                            style={{ height: chemPoured ? "40%" : "70%" }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white shadow-sm">
                                                CuSO₄ {chemConcentration.toFixed(1)}M
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-2">
                                        Lọ hóa chất CuSO₄
                                    </span>
                                </div>

                                {/* Dòng chảy dung dịch khi rót */}
                                {chemPoured && (
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-1.5 h-16 bg-gradient-to-b from-sky-400 to-sky-600 rounded-full animate-pulse shadow-sm" />
                                        <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 mt-1">
                                            Rót vào NaOH...
                                        </span>
                                    </div>
                                )}

                                {/* Cốc phản ứng Beaker */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-28 h-32 border-2 border-slate-400 dark:border-slate-600 rounded-b-xl rounded-t-sm bg-slate-100 dark:bg-slate-900/50 overflow-hidden flex flex-col justify-end">
                                        {/* Vạch chia độ */}
                                        <div className="absolute inset-y-2 left-2 flex flex-col justify-between text-[8px] font-mono text-slate-400 select-none">
                                            <span>100ml</span>
                                            <span>75ml</span>
                                            <span>50ml</span>
                                            <span>25ml</span>
                                        </div>

                                        {/* Dung dịch trong cốc phản ứng */}
                                        <div
                                            className={`w-full transition-all duration-500 flex flex-col justify-end ${
                                                chemPoured
                                                    ? "bg-gradient-to-t from-blue-700 via-sky-600 to-sky-400"
                                                    : "bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700"
                                            }`}
                                            style={{ height: chemPoured ? "75%" : "35%" }}
                                        >
                                            {/* Lớp kết tủa keo Cu(OH)2 dưới đáy */}
                                            {chemPoured && (
                                                <div className="h-6 w-full bg-blue-900/80 border-t border-sky-300/40 flex items-center justify-center">
                                                    <span className="text-[9px] font-bold text-white font-mono">
                                                        Cu(OH)₂ ↓ (kết tủa)
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute top-2 right-2">
                                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                                Cốc 100ml
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-2">
                                        Cốc phản ứng NaOH
                                    </span>
                                </div>
                            </div>

                            {/* Điều khiển tương tác */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setChemPoured(!chemPoured)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            chemPoured
                                                ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                                                : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                                        }`}
                                    >
                                        {chemPoured ? "↺ Đặt bình xuống bàn" : "🧪 Nghiêng bình rót hóa chất"}
                                    </button>

                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <Sliders className="w-3.5 h-3.5" />
                                        <span>Nồng độ:</span>
                                        <input
                                            type="range"
                                            min="0.2"
                                            max="2.0"
                                            step="0.2"
                                            value={chemConcentration}
                                            onChange={(e) => setChemConcentration(parseFloat(e.target.value))}
                                            className="w-20 accent-emerald-600 cursor-pointer"
                                        />
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                                            {chemConcentration.toFixed(1)}M
                                        </span>
                                    </div>
                                </div>

                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {chemPoured ? "✓ Phản ứng hoàn tất" : "• Sẵn sàng dốc rót"}
                                </span>
                            </div>
                        </div>

                        {/* Bảng Dữ Liệu Khoa Học GDPT 2018 */}
                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span className="font-semibold">Phương trình phân tử:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span className="font-semibold">Phương trình ion thu gọn:</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                    Cu²⁺ + 2OH⁻ → Cu(OH)₂↓
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                                <span>Hiện tượng quan sát:</span>
                                <span className="text-slate-800 dark:text-slate-200">
                                    Xuất hiện kết tủa dạng keo màu xanh lam đặc trưng
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 2: VẬT LÝ ─── */}
                {activeTab === "physics" && (
                    <div className="space-y-4">
                        {/* Simulation Visual Workbench */}
                        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <div className="relative h-44 border-b-2 border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                {/* Trục chính quang học */}
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-400 dark:bg-slate-600 border-dashed" />

                                {/* Thấu kính hội tụ ở giữa */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                    <div className="w-4 h-36 rounded-full border-2 border-sky-400 bg-sky-200/50 dark:bg-sky-500/20 backdrop-blur-sm shadow-sm" />
                                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 font-bold">
                                        O (Thấu kính)
                                    </span>
                                </div>

                                {/* Tiêu điểm F và F' */}
                                <div className="absolute top-1/2 left-[30%] -translate-y-1/2 flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 mt-1">
                                        F
                                    </span>
                                </div>
                                <div className="absolute top-1/2 left-[70%] -translate-y-1/2 flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 mt-1">
                                        F&apos;
                                    </span>
                                </div>

                                {/* Vật sáng AB ở bên trái */}
                                <div
                                    className="absolute bottom-1/2 flex flex-col items-center transition-all duration-150"
                                    style={{
                                        left: `${Math.max(8, 50 - (objDistance / 48) * 40)}%`,
                                    }}
                                >
                                    <div className="w-1.5 h-16 bg-emerald-600 dark:bg-emerald-400 rounded-t-sm relative">
                                        <div className="absolute -top-2 -left-1 w-3.5 h-2 bg-emerald-600 dark:bg-emerald-400 clip-triangle" />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        Vật AB
                                    </span>
                                </div>

                                {/* Ảnh thật A'B' ngược chiều ở bên phải */}
                                {imgDistance > 0 && imgDistance < 100 && (
                                    <div
                                        className="absolute top-1/2 flex flex-col items-center transition-all duration-150"
                                        style={{
                                            left: `${Math.min(92, 50 + (imgDistance / 48) * 40)}%`,
                                        }}
                                    >
                                        <div
                                            className="w-1.5 bg-purple-600 dark:bg-purple-400 rounded-b-sm"
                                            style={{
                                                height: `${Math.min(80, Math.max(16, 64 * Math.abs(magnification)))}px`,
                                            }}
                                        />
                                        <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 mt-1">
                                            Ảnh A&apos;B&apos;
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Điều khiển khoảng cách vật AB */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                                    <Sliders className="w-3.5 h-3.5 text-sky-600" />
                                    <span>Khoảng cách vật d:</span>
                                    <input
                                        type="range"
                                        min="14"
                                        max="40"
                                        step="1"
                                        value={objDistance}
                                        onChange={(e) => setObjDistance(parseInt(e.target.value, 10))}
                                        className="w-28 accent-sky-600 cursor-pointer"
                                    />
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                                        {objDistance} cm
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setObjDistance(24)}
                                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Đặt lại (d = 2f)</span>
                                </button>
                            </div>
                        </div>

                        {/* Bảng Dữ Liệu Quang Học */}
                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-mono">
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span>Tiêu cự thấu kính:</span>
                                <span className="font-bold text-slate-900 dark:text-white">f = +{focalLength} cm</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span>Vị trí ảnh thật d&apos;:</span>
                                <span className="font-bold text-sky-600 dark:text-sky-400">
                                    d&apos; = {imgDistance.toFixed(1)} cm
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span>Độ phóng đại ảnh k:</span>
                                <span className="font-bold text-purple-600 dark:text-purple-400">
                                    k = {magnification.toFixed(2)} ({magnification < 0 ? "Ảnh ngược chiều" : "Ảnh cùng chiều"})
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: SINH HỌC ─── */}
                {activeTab === "biology" && (
                    <div className="space-y-4">
                        {/* Simulation Visual Workbench */}
                        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                {/* Sơ đồ tế bào thực vật đa tầng */}
                                <div className="sm:col-span-7 flex justify-center">
                                    <div className="relative w-56 h-44 rounded-2xl border-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 p-3 shadow-inner flex flex-wrap items-center justify-around gap-2">
                                        <div className="absolute top-1 left-2 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                                            Vách tế bào (Cell Wall)
                                        </div>

                                        {/* Nhân tế bào */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOrganelle("nucleus")}
                                            className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                                                selectedOrganelle === "nucleus"
                                                    ? "bg-purple-600 text-white border-purple-300 scale-105 shadow-md"
                                                    : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-400"
                                            }`}
                                        >
                                            <span className="text-[10px] font-bold">Nhân</span>
                                            <span className="text-[8px] opacity-80">ADN</span>
                                        </button>

                                        {/* Lục lạp */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOrganelle("chloroplast")}
                                            className={`w-14 h-10 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                                                selectedOrganelle === "chloroplast"
                                                    ? "bg-emerald-600 text-white border-emerald-300 scale-105 shadow-md"
                                                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-400"
                                            }`}
                                        >
                                            <span className="text-[9px] font-bold">Lục Lạp</span>
                                        </button>

                                        {/* Ti thể */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOrganelle("mitochondria")}
                                            className={`w-14 h-10 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                                                selectedOrganelle === "mitochondria"
                                                    ? "bg-amber-600 text-white border-amber-300 scale-105 shadow-md"
                                                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-400"
                                            }`}
                                        >
                                            <span className="text-[9px] font-bold">Ti Thể</span>
                                        </button>

                                        {/* Không bào */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOrganelle("vacuole")}
                                            className={`w-28 h-10 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                                                selectedOrganelle === "vacuole"
                                                    ? "bg-sky-600 text-white border-sky-300 scale-105 shadow-md"
                                                    : "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-400"
                                            }`}
                                        >
                                            <span className="text-[9px] font-bold">Không Bào Trung Tâm</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Chi tiết cơ quan sinh học được chọn */}
                                <div className="sm:col-span-5 space-y-2 text-xs">
                                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                            {selectedOrganelle === "chloroplast" && "Lục lạp (Chloroplast)"}
                                            {selectedOrganelle === "nucleus" && "Nhân tế bào (Nucleus)"}
                                            {selectedOrganelle === "mitochondria" && "Ti thể (Mitochondria)"}
                                            {selectedOrganelle === "vacuole" && "Không bào trung tâm"}
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {selectedOrganelle === "chloroplast" && "Chứa diệp lục tố, thực hiện quá trình quang hợp hấp thu ánh sáng mặt trời tạo hợp chất hữu cơ và O₂."}
                                            {selectedOrganelle === "nucleus" && "Trung tâm điều khiển mọi hoạt động sống của tế bào, lưu trữ thông tin di truyền ADN và NST."}
                                            {selectedOrganelle === "mitochondria" && "Nhà máy năng lượng của tế bào, thực hiện hô hấp tế bào để tổng hợp phân tử ATP."}
                                            {selectedOrganelle === "vacuole" && "Chứa dịch tế bào điều hòa áp suất thẩm thấu, dự trữ chất dinh dưỡng và sắc tố hoa quả."}
                                        </p>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium">
                                        * Nhấp vào từng bào quan để xem cấu trúc và chức năng.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 4: LAB 3D VR & GYRO CONTROLLER ─── */}
                {activeTab === "3d" && (
                    <div className="space-y-4">
                        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                                {/* Khung mô phỏng 3D di động kết nối Gyroscope */}
                                <div className="sm:col-span-7 flex flex-col items-center justify-center p-5 rounded-xl bg-slate-950 text-white border border-slate-800 relative overflow-hidden min-h-[220px]">
                                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 opacity-90" />
                                    <div className="absolute inset-x-0 bottom-0 h-14 bg-slate-900/90 border-t border-slate-800" />

                                    <div className="relative z-10 flex items-center justify-around w-full max-w-xs py-2">
                                        {/* Điện thoại mô phỏng xoay theo phoneTilt */}
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div
                                                className="w-14 h-24 rounded-xl border-2 border-emerald-400 bg-slate-900 p-1 flex flex-col items-center justify-between shadow-xl transition-transform duration-150"
                                                style={{ transform: `rotate(${phoneTilt * 0.75}deg)` }}
                                            >
                                                <div className="w-5 h-1 rounded-full bg-slate-700" />
                                                <div className="text-[9px] font-mono text-emerald-400 font-bold text-center leading-tight">
                                                    Điện thoại<br />{phoneTilt}°
                                                </div>
                                                <div className="w-2.5 h-2.5 rounded-full border border-slate-600" />
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-semibold">Cảm biến xoay</span>
                                        </div>

                                        {/* Dòng chất lỏng rót khi góc > 25 */}
                                        {phoneTilt > 25 && (
                                            <div className="w-1.5 h-14 bg-gradient-to-b from-sky-400 to-sky-600 rounded-full animate-pulse shadow-sm" />
                                        )}

                                        {/* Bình hóa chất 3D xoay đồng bộ */}
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div
                                                className="w-16 h-22 border-2 border-sky-400 rounded-b-xl rounded-t-md bg-sky-950/40 p-1 flex flex-col justify-end transition-transform duration-150 shadow-lg"
                                                style={{ transform: `rotate(${phoneTilt}deg)` }}
                                            >
                                                <div
                                                    className="w-full bg-gradient-to-t from-sky-600 to-sky-400 rounded-b-lg transition-all"
                                                    style={{ height: `${Math.max(12, 70 - phoneTilt * 0.65)}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-semibold">Bình trên máy tính</span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 text-[10px] font-mono text-emerald-400 mt-2 flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                                        <span>Đồng bộ 2 chiều WebRTC 60Hz • Góc dốc: {phoneTilt}°</span>
                                    </div>
                                </div>

                                {/* Thông tin & Thanh kéo thử nghiệm góc nghiêng */}
                                <div className="sm:col-span-5 space-y-3 text-xs">
                                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Điều Khiển Bằng Điện Thoại Thật</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                            Chỉ cần quét mã QR bằng camera điện thoại, con quay hồi chuyển trên điện thoại sẽ điều khiển góc dốc bình và lắc trộn phản ứng tức thì trên màn hình máy tính.
                                        </p>
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-600 dark:text-slate-400">Thử góc nghiêng:</span>
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="70"
                                                    value={phoneTilt}
                                                    onChange={(e) => setPhoneTilt(parseInt(e.target.value, 10))}
                                                    className="w-24 accent-emerald-600 cursor-pointer"
                                                />
                                                <span className="font-mono font-bold text-slate-900 dark:text-white w-7 text-right">
                                                    {phoneTilt}°
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span>Tương thích mọi trình duyệt iOS Safari & Android Chrome</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Link vào phòng lab 3D thực tế */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {activeTab === "chemistry" && "Đầy đủ 107 hóa chất trong phòng Lab 3D"}
                        {activeTab === "physics" && "Thực hành mạch điện & con lắc trong Lab Vật lý"}
                        {activeTab === "biology" && "Mô hình giải phẫu người 360° trong Lab Sinh học"}
                        {activeTab === "3d" && "Trải nghiệm không gian phòng lab ảo toàn cảnh 360°"}
                    </span>
                    <Link
                        href={activeTab === "chemistry" ? "/lab" : activeTab === "physics" ? "/physics" : activeTab === "biology" ? "/biology" : "/lab/3d"}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        <span>Mở phân hệ {activeTab === "chemistry" ? "Hóa" : activeTab === "physics" ? "Lý" : activeTab === "biology" ? "Sinh" : "3D VR"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
