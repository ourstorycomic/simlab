"use client";

/**
 * ─── Lab3DFloatingUI ───
 * Text floating, bảng thông tin, video popup trong không gian 3D.
 * 
 * Sử dụng <Html> của drei để render React components trong 3D space.
 * Hiển thị:
 * - Phương trình phản ứng (floating + animated)
 * - Thông tin quan sát (observations)
 * - Video mẫu phản ứng thật (popup)
 * - Nhãn các thiết bị
 * - Hướng dẫn cử chỉ tay
 */

import React, { useState, useEffect, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ReactionResult, RealVideoDemo, REACTION_TYPE_LABELS } from "@/lib/reactions";
import { Chemical } from "@/lib/chemicals";
import { Flame, Sparkles, ShieldAlert, Hand, MousePointerClick, RotateCcw } from "lucide-react";

// ─── Equation Card (floating in 3D) ───

interface EquationCardProps {
    reaction: ReactionResult;
    position?: [number, number, number];
}

function EquationCard({ reaction, position = [0, 1.5, 0] }: EquationCardProps) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        const group = groupRef.current;
        if (!group) return;
        group.position.y = position[1] + Math.sin(Date.now() * 0.001) * 0.03;
    });

    const typeLabel = REACTION_TYPE_LABELS[reaction.type] || reaction.type;

    // Determine badge color based on reaction type
    const badgeColor: Record<string, string> = {
        acid_base: "bg-blue-600",
        metal_acid: "bg-orange-600",
        precipitation: "bg-indigo-600",
        color_change: "bg-pink-600",
        redox: "bg-purple-600",
        combustion: "bg-red-600",
        gas_evolution: "bg-green-600",
        complex: "bg-fuchsia-600",
        none: "bg-gray-600",
    };

    return (
        <group ref={groupRef} position={position}>
            <Html center distanceFactor={3} transform>
                <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-2xl p-4 min-w-[300px] max-w-[400px] select-none pointer-events-auto">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold text-white rounded-full ${badgeColor[reaction.type] || "bg-gray-600"}`}>
                            {typeLabel}
                        </span>
                        {reaction.heatChange !== "none" && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full inline-flex items-center gap-1 ${
                                reaction.heatChange === "exothermic"
                                    ? "bg-red-900/50 text-red-300 border border-red-700/30"
                                    : "bg-blue-900/50 text-blue-300 border border-blue-700/30"
                            }`}>
                                {reaction.heatChange === "exothermic" ? (
                                    <>
                                        <Flame className="w-3 h-3 text-red-400" />
                                        <span>Tỏa nhiệt</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3 h-3 text-blue-400" />
                                        <span>Thu nhiệt</span>
                                    </>
                                )}
                            </span>
                        )}
                    </div>

                    {/* Equation */}
                    <div
                        className="text-sm font-mono text-emerald-300 bg-emerald-950/40 rounded-lg px-3 py-2 border border-emerald-800/30 mb-2"
                        dangerouslySetInnerHTML={{ __html: reaction.equationHtml }}
                    />

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed mb-2">
                        {reaction.description}
                    </p>

                    {/* Observations */}
                    {reaction.observations.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                Hiện tượng quan sát
                            </p>
                            {reaction.observations.map((obs, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                    <span className="text-emerald-400 text-xs mt-0.5">•</span>
                                    <span className="text-xs text-slate-300">{obs}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Html>
        </group>
    );
}

// ─── Video Demo Popup ───

interface VideoDemoProps {
    video: RealVideoDemo;
    position?: [number, number, number];
    onClose?: () => void;
}

function VideoDemo({ video, position = [-2, 1.5, 0], onClose }: VideoDemoProps) {
    return (
        <Html position={position} center distanceFactor={3} transform>
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden min-w-[320px] select-none pointer-events-auto">
                {/* Video embed */}
                <div className="relative w-[320px] h-[180px] bg-black">
                    <iframe
                        src={video.url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope"
                        allowFullScreen
                    />
                </div>

                {/* Info */}
                <div className="p-3">
                    <h4 className="text-sm font-semibold text-white mb-1">{video.title}</h4>
                    {video.description && (
                        <p className="text-xs text-slate-400 mb-2">{video.description}</p>
                    )}
                    {video.safetyWarning && (
                        <div className="flex items-start gap-1.5 bg-red-950/30 border border-red-800/30 rounded-lg px-2 py-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="text-[10px] text-red-300">{video.safetyWarning}</span>
                        </div>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="mt-2 w-full py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Đóng
                        </button>
                    )}
                </div>
            </div>
        </Html>
    );
}

// ─── Gesture Guide (hướng dẫn cử chỉ tay) ───

function GestureGuide({ position = [0, 2.2, 0] }: { position?: [number, number, number] }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 10000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <Html position={position} center distanceFactor={4}>
            <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/50 p-3 min-w-[220px] shadow-xl select-none pointer-events-auto animate-in fade-in duration-500">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Hướng dẫn cử chỉ tay
                </p>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Hand className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs text-slate-300">Xòe tay → Di chuyển con trỏ</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MousePointerClick className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="text-xs text-slate-300">Véo ngón cái-trỏ → Cầm đồ vật</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs text-slate-300">Nghiêng tay → Đổ hóa chất</span>
                    </div>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="mt-2 text-[10px] text-slate-500 hover:text-white transition-colors"
                >
                    Ẩn hướng dẫn
                </button>
            </div>
        </Html>
    );
}

// ─── Main Floating UI Component ───

interface Lab3DFloatingUIProps {
    reaction: ReactionResult | null;
    showEquation: boolean;
    showVideo: boolean;
    showGuide: boolean;
    onVideoClose?: () => void;
}

export default function Lab3DFloatingUI({
    reaction,
    showEquation,
    showVideo,
    showGuide,
    onVideoClose,
}: Lab3DFloatingUIProps) {
    return (
        <group>
            {/* Equation card */}
            {showEquation && reaction && (
                <EquationCard reaction={reaction} position={[0, 1.8, 0.5]} />
            )}

            {/* Real video demo */}
            {showVideo && reaction?.realVideo && (
                <VideoDemo
                    video={reaction.realVideo}
                    position={[-2.5, 1.5, 0.5]}
                    onClose={onVideoClose}
                />
            )}

            {/* Gesture guide */}
            {showGuide && <GestureGuide position={[0, 2.5, 1]} />}
        </group>
    );
}
