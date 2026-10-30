"use client";

/**
 * ─── BioHandOverlay ───
 * Camera Hand Tracking dành cho Không gian Sinh học 3D (Tế bào & Giải phẫu).
 * Tích hợp điều khiển bàn tay tự nhiên:
 * - 👋 Phất tay (Swipe): Vẫy tay trái / phải để chuyển đổi mượt mà giữa Tế bào, Giải phẫu và Nội tạng
 * - ✊ Nắm tay / 👌 Chụm ngón: Kéo thả xoay mô hình 3D 360 độ siêu mượt mà
 * - ☝️ Ngón trỏ: Chỉ định con trỏ ảo, giữ hoặc bấm chọn cơ quan / bào quan
 */

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { HandState, DEFAULT_HAND_STATE } from "@/lib/handTracking";
import { playLabSound } from "@/components/lab3d/ChemistryRealisticModels";
import { BioTabMode } from "@/components/BiologyBench";
import { Camera, Hand } from "lucide-react";

const Lab3DHandTracker = dynamic(() => import("@/components/lab3d/Lab3DHandTracker"), {
    ssr: false,
});

interface BioHandOverlayProps {
    currentTab?: BioTabMode;
    onTabChange?: (tab: BioTabMode) => void;
    externalHandStateRef?: React.MutableRefObject<HandState>;
    hideTracker?: boolean;
    enabled?: boolean;
    onEnabledChange?: (enabled: boolean) => void;
}

export default function BioHandOverlay({
    currentTab = "cell",
    onTabChange,
    externalHandStateRef,
    hideTracker = false,
    enabled: propsEnabled,
    onEnabledChange,
}: BioHandOverlayProps) {
    // MẶC ĐỊNH LUÔN TẮT CAMERA ngoài Lab 3D: chỉ khi người dùng chủ động bấm "Bật Camera Tay" mới mở camera
    const [internalEnabled, setInternalEnabled] = useState(false);
    const enabled = propsEnabled !== undefined ? propsEnabled : internalEnabled;

    const setEnabled = (valOrFn: boolean | ((prev: boolean) => boolean)) => {
        const nextVal = typeof valOrFn === "function" ? valOrFn(enabled) : valOrFn;
        setInternalEnabled(nextVal);
        if (onEnabledChange) onEnabledChange(nextVal);
    };
    const internalHandStateRef = useRef<HandState>({ ...DEFAULT_HAND_STATE });
    const handStateRef = externalHandStateRef || internalHandStateRef;
    const cursorRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });
    const smoothedPosRef = useRef({ x: 0, y: 0 });

    // Swipe detection refs
    const lastRawXRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    const vxRef = useRef(0);
    const swipeCooldownRef = useRef(0);
    const handTrackedFramesRef = useRef(0);

    const [swipeNotice, setSwipeNotice] = useState<string | null>(null);
    const [cursorInfo, setCursorInfo] = useState<{
        x: number;
        y: number;
        gesture: string;
        active: boolean;
        isGrabbing: boolean;
    }>({
        x: 0,
        y: 0,
        gesture: "IDLE",
        active: false,
        isGrabbing: false,
    });

    useEffect(() => {
        if (!enabled || hideTracker) return;

        let animId: number;

        const loop = () => {
            const hs = handStateRef.current;
            const now = performance.now();

            if (hs.detected && hs.landmarks.length > 8) {
                handTrackedFramesRef.current++;
                const tip = hs.landmarks[8]; // Ngón trỏ (INDEX_TIP)
                const wrist = hs.landmarks[0]; // Cổ tay (WRIST)
                const palmCenter = hs.landmarks[9] || tip; // Khớp giữa ngón giữa (Gốc bàn tay)

                // Webcam mirrored: đảo ngược X để cử chỉ tự nhiên như soi gương
                const rawScreenX = (1 - tip.x) * window.innerWidth;
                const rawScreenY = tip.y * window.innerHeight;
                const palmScreenX = (1 - palmCenter.x) * window.innerWidth;

                // 1. Exponential Moving Average (EMA) lerp smoothing: Chống rung giật, lướt êm ru
                if (smoothedPosRef.current.x === 0 && smoothedPosRef.current.y === 0) {
                    smoothedPosRef.current = { x: rawScreenX, y: rawScreenY };
                } else {
                    smoothedPosRef.current.x = THREE.MathUtils.lerp(smoothedPosRef.current.x, rawScreenX, 0.42);
                    smoothedPosRef.current.y = THREE.MathUtils.lerp(smoothedPosRef.current.y, rawScreenY, 0.42);
                }

                const screenX = smoothedPosRef.current.x;
                const screenY = smoothedPosRef.current.y;

                // 2. Cập nhật vị trí con trỏ DOM trực tiếp (GPU hardware accelerated)
                if (cursorRef.current) {
                    cursorRef.current.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
                }

                // 3. Nhận diện PHẤT TAY (SWIPE GESTURE) để chuyển tab
                // Khử hoàn toàn xung đột biến vận tốc khi bàn tay vừa lọt vào webcam
                if (handTrackedFramesRef.current < 10) {
                    lastRawXRef.current = palmScreenX;
                    lastTimeRef.current = now;
                    vxRef.current = 0;
                    animId = requestAnimationFrame(loop);
                    return;
                }

                const dt = Math.max(0.005, Math.min(0.15, (now - lastTimeRef.current) / 1000));
                const currentVx = (palmScreenX - lastRawXRef.current) / dt;
                lastRawXRef.current = palmScreenX;
                lastTimeRef.current = now;

                vxRef.current = THREE.MathUtils.lerp(vxRef.current, currentVx, 0.45);

                const isFist = (hs.gesture === "GRAB" && !hs.isIndexExtended) || (hs.rightHand?.gripStrength || 0) > 0.7;

                // Phất tay tự nhiên thoải mái:
                // 1. Bàn tay ở độ cao nửa trên màn hình (screenY < 75% chiều cao)
                // 2. Xòe bàn tay tự nhiên (>= 3 ngón hoặc OPEN)
                // 3. Vận tốc phất tay vừa phải (> 550 px/s)
                const isComfortableHeight = screenY < (window.innerHeight * 0.75);
                const isOpenHand = (hs.gesture === "OPEN" || (hs.extendedFingersCount ?? 5) >= 3);

                if (isComfortableHeight && isOpenHand && !isFist && now > swipeCooldownRef.current && Math.abs(vxRef.current) > 550) {
                    const isSwipeRight = vxRef.current > 0;
                    swipeCooldownRef.current = now + 1200; // Cooldown 1.2s tránh lặp

                    if (onTabChange) {
                        const tabs: BioTabMode[] = ["cell", "human", "organs"];
                        const curIdx = tabs.indexOf(currentTab);
                        const nextIdx = isSwipeRight
                            ? (curIdx + 1) % tabs.length
                            : (curIdx - 1 + tabs.length) % tabs.length;
                        const nextTab = tabs[nextIdx];
                        onTabChange(nextTab);
                        playLabSound("pick");

                        const tabNames: Record<BioTabMode, string> = {
                            cell: "Tế bào Thực vật 3D",
                            human: "Giải phẫu Toàn thân 14 hệ",
                            organs: "Nội tạng Chuyên sâu",
                        };
                        setSwipeNotice(
                            isSwipeRight
                                ? `Phất tay sang Phải: Chuyển sang ${tabNames[nextTab]}`
                                : `Phất tay sang Trái: Chuyển sang ${tabNames[nextTab]}`
                        );
                        setTimeout(() => setSwipeNotice(null), 2200);
                    }
                }

                setCursorInfo({
                    x: Math.round(screenX),
                    y: Math.round(screenY),
                    gesture: hs.gesture,
                    active: true,
                    isGrabbing: isFist,
                });
            } else {
                handTrackedFramesRef.current = 0;
                vxRef.current = 0;
                smoothedPosRef.current = { x: 0, y: 0 };
                setCursorInfo((prev) => ({ ...prev, active: false }));
            }

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [enabled, hideTracker, currentTab, onTabChange]);

    return (
        <>
            {/* Nút bật/tắt Hand Tracking trên thanh công cụ Sinh học (ẩn khi chạy trong Lab 3D hợp nhất) */}
            {!hideTracker && (
                <button
                    onClick={() => {
                        const next = !enabled;
                        setEnabled(next);
                        playLabSound("pick");
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm cursor-pointer active:scale-95 ${
                        enabled
                            ? "bg-emerald-600/90 text-white border-emerald-400/50 shadow-emerald-500/20"
                            : "bg-slate-900/80 text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-800"
                    }`}
                    title={enabled ? "Tắt nhận diện cử chỉ bàn tay (Tắt camera)" : "Bật camera nhận diện bàn tay để tương tác bằng cử chỉ"}
                >
                    {enabled ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    ) : (
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>{enabled ? "Hand Tracking: Bật" : "Bật Camera Tay"}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono text-emerald-300">
                        AI
                    </span>
                </button>
            )}

            {/* Thông báo cử chỉ phất tay (Swipe) trực quan nổi giữa màn hình */}
            {swipeNotice && (
                <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-emerald-950/95 border border-emerald-400 text-emerald-100 px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
                        <Hand className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
                        <span className="text-xs sm:text-sm font-bold">{swipeNotice}</span>
                    </div>
                </div>
            )}

            {/* Tracker Component & Virtual Hologram Cursor khi bật */}
            {enabled && (
                <>
                    {/* Webcam detector với preview */}
                    {!hideTracker && (
                        <Lab3DHandTracker handStateRef={handStateRef} showPreview={true} autoStart={true} />
                    )}
                    {/* Realistic 3D anatomical hand renders in BioLive3DHandCanvas */}
                </>
            )}
        </>
    );
}
