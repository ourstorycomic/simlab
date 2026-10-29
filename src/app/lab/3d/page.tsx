"use client";

/**
 * ─── Unified Multi-Disciplinary 3D Lab Hub ───
 * Route: /lab/3d
 * 
 * Không gian Thực hành 3D Tích hợp Đa bộ môn:
 * 1. ⚗️ Hóa Học 3D (Phản ứng hóa học, pha trộn, đổ bình bằng cử chỉ tay)
 * 2. ⚡ Vật Lý 3D (Con lắc đơn dao động, Mạch điện Ohm, Khúc xạ lăng kính)
 * 3. 🧬 Sinh Học 3D (Tế bào thực vật, Giải phẫu 14 hệ cơ thể, 9 Nội tạng)
 * 
 * Tính năng thông minh:
 * - Tab switcher hợp nhất trên đỉnh màn hình
 * - Phất tay (Horizontal Swipe) vẫy tay trái/phải để chuyển đổi bộ môn
 * - Camera AI Hand Tracking hiển thị trực quan ở góc dưới trái với khung hình sống động
 * - Tự động đồng bộ URL query ?subject=chemistry|physics|biology
 */

import React, { useRef, useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { HandState, DEFAULT_HAND_STATE } from "@/lib/handTracking";
import { chemicals } from "@/lib/chemicals";
import { playLabSound } from "@/components/lab3d/ChemistryRealisticModels";
import WebGLErrorBoundary from "@/components/lab3d/WebGLErrorBoundary";
import type { IndexTipInfo } from "@/components/lab3d/Lab3DFullHandModel";
import { FlaskConical, Atom, Dna, Hand } from "lucide-react";

export type LabSubject = "chemistry" | "physics" | "biology";

// Dynamic imports to optimize bundle and isolate WebGL contexts
const Lab3DScene = dynamic(() => import("@/components/lab3d/Lab3DScene"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#060a10]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-500/30 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-slate-300 mt-4 font-semibold">Đang nạp Phòng Thí Nghiệm Hóa Học 3D...</p>
            <p className="text-xs text-slate-500 mt-1">Phản ứng & Dụng cụ thủy tinh thực tế</p>
        </div>
    ),
});

const Lab3DPhysicsScene = dynamic(() => import("@/components/lab3d/Lab3DPhysicsScene"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#060a10]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-500/30 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-slate-300 mt-4 font-semibold">Đang nạp Phòng Thí Nghiệm Vật Lý 3D...</p>
            <p className="text-xs text-slate-500 mt-1">Mô phỏng Cơ học • Điện từ • Quang học</p>
        </div>
    ),
});

const BiologyBench = dynamic(() => import("@/components/BiologyBench"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#060a10]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-teal-500/30 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-slate-300 mt-4 font-semibold">Đang nạp Phòng Thí Nghiệm Sinh Học 3D...</p>
            <p className="text-xs text-slate-500 mt-1">Tế bào Thực vật • Giải phẫu cơ thể người</p>
        </div>
    ),
});

const Lab3DHandTracker = dynamic(() => import("@/components/lab3d/Lab3DHandTracker"), {
    ssr: false,
});

const Global3DHandOverlay = dynamic(() => import("@/components/lab3d/Global3DHandOverlay"), {
    ssr: false,
});

const DeviceMotionControlBar = dynamic(() => import("@/components/lab3d/DeviceMotionControlBar"), {
    ssr: false,
});

function Lab3DContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const paramSubject = searchParams.get("subject") as LabSubject | null;
    const initialSubject: LabSubject =
        paramSubject === "physics" || paramSubject === "biology" || paramSubject === "chemistry"
            ? paramSubject
            : "chemistry";

    const [subject, setSubject] = useState<LabSubject>(initialSubject);
    const [swipeNotice, setSwipeNotice] = useState<string | null>(null);
    const [swipeEnabled, setSwipeEnabled] = useState(false);

    // Shared hand state between camera tracker and active 3D scenes
    const handStateRef = useRef<HandState>({ ...DEFAULT_HAND_STATE });

    // Swipe velocity detector
    const lastRawXRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    const vxRef = useRef(0);
    const swipeCooldownRef = useRef(0);
    const handTrackedFramesRef = useRef(0);

    // Global Top Hologram Virtual Finger Reticle & Air Dwell Tap (Floats at z-[70] IN FRONT of tabs)
    const topReticleRef = useRef<HTMLDivElement>(null);
    const progressCircleRef = useRef<SVGCircleElement | null>(null);
    const hoveredBtnRef = useRef<HTMLElement | null>(null);
    const hoverStartTimeRef = useRef<number>(0);
    const clickCooldownRef = useRef<number>(0);
    const [hoverButtonName, setHoverButtonName] = useState<string | null>(null);
    const lastTipInfoRef = useRef<IndexTipInfo | null>(null);

    const handleIndexTipUpdate = useCallback((info: IndexTipInfo | null) => {
        lastTipInfoRef.current = info;
        if (subject === "biology" && info) {
            window.dispatchEvent(
                new CustomEvent("bio-hand-point", {
                    detail: {
                        screenX: info.screenX,
                        screenY: info.screenY,
                        normalizedX: info.ndcX,
                        normalizedY: info.ndcY,
                    },
                })
            );
        }
    }, [subject]);

    // Sync state if URL changes externally
    useEffect(() => {
        if (paramSubject && (paramSubject === "chemistry" || paramSubject === "physics" || paramSubject === "biology")) {
            setSubject(paramSubject);
        }
    }, [paramSubject]);

    // Handle tab change
    const switchSubject = useCallback((newSubject: LabSubject, fromSwipe: boolean = false) => {
        setSubject((prev) => {
            if (prev === newSubject) return prev;
            return newSubject;
        });

        const now = performance.now();
        // KHÓA TOÀN BỘ CHUYỂN MÔN TRONG 2.4 GIÂY ĐỂ TRÁNH NHẢY LIÊN HOÀN
        swipeCooldownRef.current = now + 2400;
        clickCooldownRef.current = now + 2000;
        hoverStartTimeRef.current = now + 2000;
        hoveredBtnRef.current = null;
        setHoverButtonName(null);
        vxRef.current = 0;

        if (progressCircleRef.current) {
            const circumference = 2 * Math.PI * 16;
            progressCircleRef.current.style.strokeDashoffset = `${circumference}`;
        }

        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("subject", newSubject);
            window.history.replaceState(null, "", url.toString());
        }
        try {
            playLabSound("pick");
        } catch {}

        const name =
            newSubject === "chemistry"
                ? "Hóa Học 3D"
                : newSubject === "physics"
                ? "Vật Lý 3D"
                : "Sinh Học 3D";
        setSwipeNotice(fromSwipe ? `Phất tay: Đã chuyển ${name}` : `Đã chuyển sang ${name}`);
        setTimeout(() => setSwipeNotice(null), 2000);
    }, []);

    // Swipe detection loop across subject tabs
    useEffect(() => {
        let animId: number;

        const loop = () => {
            const now = performance.now();
            const dt = (now - lastTimeRef.current) / 1000;
            lastTimeRef.current = now;

            const hand = handStateRef.current;
            if (hand && (hand.detected || (hand.landmarks && hand.landmarks.length > 0))) {
                handTrackedFramesRef.current++;
                const normX = hand.landmarks[9]?.x ?? hand.landmarks[0]?.x ?? 0.5;
                const normY = hand.landmarks[9]?.y ?? hand.landmarks[0]?.y ?? 0.5;
                // Webcam mirrored: đảo ngược X để cử chỉ phất tay tự nhiên theo hình ảnh phản chiếu
                const mirroredNormX = 1 - normX;
                const currentRawX = mirroredNormX * (typeof window !== "undefined" ? window.innerWidth : 1200);

                // Khử hoàn toàn xung đột biến vận tốc khi bàn tay vừa lọt vào webcam
                if (handTrackedFramesRef.current < 10) {
                    lastRawXRef.current = currentRawX;
                    vxRef.current = 0;
                    animId = requestAnimationFrame(loop);
                    return;
                }

                if (dt > 0.005 && dt < 0.15) {
                    const instVx = (currentRawX - lastRawXRef.current) / dt;
                    vxRef.current = vxRef.current * 0.60 + instVx * 0.40;
                }
                lastRawXRef.current = currentRawX;

                // VỊ TRÍ CON TRỎ GẮN CHẶT 100% VÀO ĐẦU NGÓN TAY 3D:
                // Sử dụng tọa độ 2D được Three.js chiếu trực tiếp từ chóp ngón trỏ (Index Fingertip)
                // Tuyệt đối không tính toán 2D tách rời gây lệch "dấu chấm 1 nơi tay 1 nơi"!
                const tipInfo = lastTipInfoRef.current;

                if (tipInfo && tipInfo.isPointing) {
                    const screenX = tipInfo.screenX;
                    const screenY = tipInfo.screenY;

                    // Cập nhật vị trí con trỏ ngón tay ảo dính chính xác vào đầu ngón tay 3D (z-[70])
                    if (topReticleRef.current) {
                        topReticleRef.current.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
                        topReticleRef.current.style.display = "flex";
                    }

                    // Air Dwell Tap: CHỈ KÍCH HOẠT KHI CHỈ VÀO THANH ĐIỀU HƯỚNG TRÊN CÙNG (screenY <= 58)
                    // TUYỆT ĐỐI KHÔNG BẤM NHẦM KHI TAY ĐANG Ở VÙNG THÍ NGHIỆM 3D!
                    const isOverNav = screenY <= 58;
                    const el = isOverNav && typeof document !== "undefined" ? document.elementFromPoint(screenX, screenY) : null;
                    const btn = (el?.closest("#top-unified-nav button") as HTMLElement) || null;

                    if (btn && !btn.hasAttribute("disabled") && now > clickCooldownRef.current) {
                        if (hoveredBtnRef.current === btn) {
                            const elapsed = now - hoverStartTimeRef.current;
                            const DWELL_TIME = 800; // Giữ 800ms có chủ đích để kích hoạt
                            const progress = Math.min(1, elapsed / DWELL_TIME);

                            if (progressCircleRef.current) {
                                const circumference = 2 * Math.PI * 16;
                                const offset = circumference * (1 - progress);
                                progressCircleRef.current.style.strokeDashoffset = `${offset}`;
                            }

                            if (progress >= 1) {
                                clickCooldownRef.current = now + 2000;
                                hoverStartTimeRef.current = now + 999999;
                                hoveredBtnRef.current = null;
                                btn.click();
                                try { playLabSound("pick"); } catch {}
                                if (progressCircleRef.current) {
                                    const circumference = 2 * Math.PI * 16;
                                    progressCircleRef.current.style.strokeDashoffset = `${circumference}`;
                                }
                            }
                        } else {
                            hoveredBtnRef.current = btn;
                            hoverStartTimeRef.current = now;
                            const btnText = btn.innerText || btn.getAttribute("title") || btn.getAttribute("aria-label");
                            if (btnText && btnText.trim().length > 0 && btnText.length < 32) {
                                setHoverButtonName(btnText.trim().replace(/\n/g, " "));
                            } else {
                                setHoverButtonName(null);
                            }
                        }
                    } else {
                        hoveredBtnRef.current = null;
                        setHoverButtonName(null);
                        if (progressCircleRef.current) {
                            const circumference = 2 * Math.PI * 16;
                            progressCircleRef.current.style.strokeDashoffset = `${circumference}`;
                        }
                    }
                } else {
                    hoveredBtnRef.current = null;
                    setHoverButtonName(null);
                    if (topReticleRef.current) {
                        topReticleRef.current.style.display = "none";
                    }
                    if (progressCircleRef.current) {
                        const circumference = 2 * Math.PI * 16;
                        progressCircleRef.current.style.strokeDashoffset = `${circumference}`;
                    }
                }

                // CỬ CHỈ PHẤT TAY ĐỔI MÔN (SWIPE TO SWITCH SUBJECT):
                if (swipeEnabled) {
                    const isPointing = tipInfo?.isPointing;
                    const isFullOpenHand = (hand.gesture === "OPEN" || (hand.extendedFingersCount ?? 5) >= 4) && !isPointing;
                    const isComfortableHeight = normY <= 0.80 && normY >= 0.15;

                    if (
                        isComfortableHeight &&
                        isFullOpenHand &&
                        now > swipeCooldownRef.current &&
                        Math.abs(vxRef.current) > 1800
                    ) {
                        const isRightSwipe = vxRef.current > 0;
                        swipeCooldownRef.current = now + 2800;
                        clickCooldownRef.current = now + 2400;
                        hoverStartTimeRef.current = now + 2400;
                        hoveredBtnRef.current = null;
                        vxRef.current = 0;

                        const order: LabSubject[] = ["chemistry", "physics", "biology"];
                        const curIdx = order.indexOf(subject);

                        if (isRightSwipe) {
                            switchSubject(order[(curIdx + 1) % order.length], true);
                        } else {
                            switchSubject(order[(curIdx - 1 + order.length) % order.length], true);
                        }
                    }
                }
            } else {
                handTrackedFramesRef.current = 0;
                vxRef.current = 0;
                if (topReticleRef.current) {
                    topReticleRef.current.style.display = "none";
                }
                hoveredBtnRef.current = null;
                setHoverButtonName(null);
            }

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [subject, switchSubject, swipeEnabled]);

    // Filter chemicals for chemistry
    const labChemicals = chemicals.filter(
        (c) => c.id !== "microscope" && c.id !== "onion" && c.id !== "lens"
    );

    // 2D route mapping
    const back2DRoute =
        subject === "chemistry" ? "/lab" : subject === "physics" ? "/physics" : "/biology";

    return (
        <div className="relative w-full h-screen bg-[#060a10] overflow-hidden text-slate-100 select-none">
            {/* ─── Top Unified Navigation Bar (Fixed Header at top-0, h-14, Zero Overlap) ─── */}
            <header
                id="top-unified-nav"
                className="fixed top-0 left-0 right-0 h-14 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 z-[70] pointer-events-auto px-3 sm:px-6 flex items-center justify-between select-none shadow-lg"
            >
                {/* Left: Back to 2D Mode */}
                <div className="flex items-center gap-3">
                    <Link
                        href={back2DRoute}
                        className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700/60 transition-all text-xs font-semibold shadow-md active:scale-95"
                    >
                        <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        <span>Về Lab 2D</span>
                    </Link>
                </div>

                {/* Center: 3 Unified Lab Subject Tabs */}
                <nav className="flex items-center bg-slate-900/95 backdrop-blur-xl p-1 rounded-xl border border-slate-800 shadow-xl gap-1">
                    {/* Prev Subject Button */}
                    <button
                        onClick={() => {
                            const order: LabSubject[] = ["chemistry", "physics", "biology"];
                            const curIdx = order.indexOf(subject);
                            switchSubject(order[(curIdx - 1 + order.length) % order.length]);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-all active:scale-90"
                        title="Chuyển môn trước (◀)"
                        aria-label="Môn trước"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    {/* Chemistry Tab */}
                    <button
                        onClick={() => switchSubject("chemistry")}
                        className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                            subject === "chemistry"
                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                    >
                        <FlaskConical className="w-4 h-4 text-emerald-400" />
                        <span>Hóa Học 3D</span>
                        {subject === "chemistry" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse hidden sm:inline-block" />
                        )}
                    </button>

                    {/* Physics Tab */}
                    <button
                        onClick={() => switchSubject("physics")}
                        className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                            subject === "physics"
                                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                    >
                        <Atom className="w-4 h-4 text-indigo-400" />
                        <span>Vật Lý 3D</span>
                        {subject === "physics" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse hidden sm:inline-block" />
                        )}
                    </button>

                    {/* Biology Tab */}
                    <button
                        onClick={() => switchSubject("biology")}
                        className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                            subject === "biology"
                                ? "bg-gradient-to-r from-rose-600 to-teal-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400/50"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                    >
                        <Dna className="w-4 h-4 text-rose-400" />
                        <span>Sinh Học 3D</span>
                        {subject === "biology" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse hidden sm:inline-block" />
                        )}
                    </button>

                    {/* Next Subject Button */}
                    <button
                        onClick={() => {
                            const order: LabSubject[] = ["chemistry", "physics", "biology"];
                            const curIdx = order.indexOf(subject);
                            switchSubject(order[(curIdx + 1) % order.length]);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-all active:scale-90"
                        title="Chuyển môn tiếp theo (▶)"
                        aria-label="Môn tiếp theo"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </nav>

                {/* Right: Swipe Toggle & 2D/3D switcher */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSwipeEnabled(!swipeEnabled)}
                        className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            swipeEnabled
                                ? "bg-slate-900 border-emerald-500/40 text-emerald-300 hover:bg-slate-800"
                                : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white"
                        }`}
                        title="Bật hoặc tắt cử chỉ phất tay để đổi môn"
                    >
                        <Hand className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden md:inline">Phất tay:</span>
                        <span className={swipeEnabled ? "text-emerald-400 font-bold" : "text-slate-500 font-bold"}>
                            {swipeEnabled ? "Bật" : "Tắt"}
                        </span>
                    </button>

                    {/* 2D / 3D pill */}
                    <div className="flex items-center gap-1 bg-slate-900/90 rounded-xl border border-slate-700/60 p-0.5 shadow-md">
                        <Link
                            href={back2DRoute}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
                        >
                            2D
                        </Link>
                        <span className="px-2.5 py-1 text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg shadow-sm">
                            3D
                        </span>
                    </div>
                </div>
            </header>

            {/* ─── Horizontal Swipe Toast Notification ─── */}
            {swipeNotice && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-950/95 border-2 border-emerald-400 text-emerald-200 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center gap-3 ring-4 ring-emerald-500/20">
                        <Hand className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
                        <span className="text-sm font-bold tracking-wide">{swipeNotice}</span>
                    </div>
                </div>
            )}

            {/* ─── Main 3D Scenes Display ─── */}
            <div className="w-full h-full relative overflow-hidden">
                {subject === "chemistry" && (
                    <WebGLErrorBoundary key="chem-3d">
                        <Lab3DScene
                            handStateRef={handStateRef}
                            chemicals={labChemicals}
                            subject="chemistry"
                        />
                    </WebGLErrorBoundary>
                )}

                {subject === "physics" && (
                    <WebGLErrorBoundary key="phys-3d">
                        <Lab3DPhysicsScene handStateRef={handStateRef} />
                    </WebGLErrorBoundary>
                )}

                {subject === "biology" && (
                    <div key="bio-3d" className="w-full h-full relative overflow-hidden pt-14">
                        <BiologyBench
                            externalHandStateRef={handStateRef}
                            hideHandTracker={true}
                        />
                    </div>
                )}
            </div>

            {/* ─── Persistent Live Camera PIP in Bottom-Left Corner ─── */}
            <Lab3DHandTracker
                handStateRef={handStateRef}
                showPreview={true}
                autoStart={true}
            />

            {/* ─── Global 3D Virtual Hand Overlay (Floats IN FRONT of Tab Bar & all UI at z-[60]) ─── */}
            <Global3DHandOverlay
                handStateRef={handStateRef}
                subject={subject}
                onIndexTipUpdate={handleIndexTipUpdate}
            />

            {/* ─── Unified Mobile & PC Motion Controller Bar (Cảm biến Đa Nền Tảng) ─── */}
            <DeviceMotionControlBar subject={subject} />

            {/* ─── Hologram Virtual Finger Reticle (Always IN FRONT of all Tab Bars & UI at z-[70]) ─── */}
            <div
                ref={topReticleRef}
                className="fixed top-0 left-0 pointer-events-none z-[70] -translate-x-1/2 -translate-y-1/2 will-change-transform"
                style={{ display: "none" }}
            >
                <div className="relative flex items-center justify-center">
                    {/* Circular Dwell Progress Ring around fingertip */}
                    <svg className="absolute w-12 h-12 -rotate-90 pointer-events-none">
                        <circle
                            cx="24"
                            cy="24"
                            r="16"
                            className="stroke-slate-900/80 fill-none"
                            strokeWidth="3.5"
                        />
                        <circle
                            ref={progressCircleRef}
                            cx="24"
                            cy="24"
                            r="16"
                            className="stroke-emerald-400 fill-none shadow-[0_0_12px_#10b981]"
                            strokeWidth="3.5"
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={2 * Math.PI * 16}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Outer pulse aura */}
                    <span className="absolute w-8 h-8 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />

                    {/* Inner Solid Hologram Fingertip Touchpoint (Floats IN FRONT of Tab Bar) */}
                    <span className="w-5 h-5 rounded-full border-2 border-white bg-gradient-to-tr from-emerald-500 to-cyan-400 shadow-[0_0_15px_#10b981,0_0_25px_#06b6d4] flex items-center justify-center pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                    </span>

                    {/* Hovered Button Name Pill */}
                    {hoverButtonName && (
                        <div className="absolute left-9 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-950/95 border border-sky-400/90 shadow-2xl text-white flex items-center gap-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap ring-2 ring-sky-500/20">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                            <span className="text-xs font-bold text-sky-200">
                                Chạm giữ: {hoverButtonName}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UnifiedLab3DPage() {
    return (
        <Suspense
            fallback={
                <div className="w-full h-screen flex flex-col items-center justify-center bg-[#060a10] text-slate-300">
                    <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-base font-bold">Đang tải Không Gian Lab 3D...</p>
                    <p className="text-xs text-slate-500 mt-1">Chuẩn bị MediaPipe Hand Tracking & WebGL 3D</p>
                </div>
            }
        >
            <Lab3DContent />
        </Suspense>
    );
}
