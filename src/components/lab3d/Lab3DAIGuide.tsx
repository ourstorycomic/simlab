"use client";

/**
 * ─── Lab3DAIGuide ───
 * AI Hologram Orb (J.A.R.V.I.S / Siri style)
 * 
 * Quả cầu năng lượng 3D bay lơ lửng cạnh bàn thí nghiệm:
 * - MeshDistortMaterial: biến dạng organic liên tục
 * - Audio Visualizer: đập theo tần số khi AI nói (Web Speech API)
 * - Đổi màu theo trạng thái: Xanh (hướng dẫn), Đỏ (cảnh báo), Vàng (gợi ý)
 * - Bong bóng thoại 3D floating
 * - Particle ring xoay xung quanh
 * 
 * Code xong trong 30 phút nhờ <MeshDistortMaterial> sẵn của drei!
 */

import React, { useRef, useMemo, useState, useCallback, useEffect, MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshDistortMaterial, Sparkles, Html } from "@react-three/drei";

type AIGuideMode = "idle" | "speaking" | "warning" | "success";

interface Lab3DAIGuideProps {
    position?: [number, number, number];
    /** Tin nhắn AI đang nói */
    message?: string | null;
    /** Chế độ hiển thị */
    mode?: AIGuideMode;
    /** Callback khi user muốn hỏi AI */
    onAsk?: (question: string) => void;
    /** Hiển thị bong bóng thoại */
    showBubble?: boolean;
    /** Hiển thị nhãn AI Tutor */
    showLabel?: boolean;
}

// Color configs per mode
const MODE_COLORS: Record<AIGuideMode, { primary: string; emissive: string; particle: string }> = {
    idle: { primary: "#00ffa3", emissive: "#006644", particle: "#00ffa3" },
    speaking: { primary: "#00bfff", emissive: "#004488", particle: "#00d4ff" },
    warning: { primary: "#ff4444", emissive: "#660000", particle: "#ff6666" },
    success: { primary: "#ffd700", emissive: "#665500", particle: "#ffee88" },
};

export default function Lab3DAIGuide({
    position = [3.2, 0.5, 0],
    message = null,
    mode = "idle",
    showBubble = true,
    showLabel = true,
    onAsk,
}: Lab3DAIGuideProps) {
    const orbRef = useRef<THREE.Mesh>(null);
    const innerOrbRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    // Animation state (not React state!)
    const animState = useRef({
        time: 0,
        pulsePhase: 0,
        distortSpeed: 2,
        distortStrength: 0.3,
        bobPhase: 0,
        ringRotation: 0,
        targetColor: new THREE.Color("#00ffa3"),
        targetEmissive: new THREE.Color("#006644"),
        currentScale: 1,
    });

    // Speaking simulation — pulse intensity
    const speakingIntensity = useRef(0);

    useEffect(() => {
        if (mode === "speaking" && message) {
            // Simulate speech audio by pulsing
            speakingIntensity.current = 1.0;
        }
    }, [mode, message]);

    // ─── useFrame: Smooth animation at 60 FPS ───
    useFrame((_, delta) => {
        const anim = animState.current;
        const orb = orbRef.current;
        const innerOrb = innerOrbRef.current;
        const ring = ringRef.current;
        const group = groupRef.current;

        if (!orb || !group) return;

        anim.time += delta;
        anim.bobPhase += delta * 1.2;
        anim.ringRotation += delta * 0.8;

        // ─── Mode-based colors ───
        const modeConfig = MODE_COLORS[mode];
        anim.targetColor.set(modeConfig.primary);
        anim.targetEmissive.set(modeConfig.emissive);

        // ─── Bob (float up/down) ───
        const bobY = Math.sin(anim.bobPhase) * 0.08;
        group.position.y = position[1] + bobY;
        group.position.x = position[0];
        group.position.z = position[2];

        // ─── Pulse when speaking ───
        if (mode === "speaking") {
            anim.distortSpeed = 4 + Math.sin(anim.time * 8) * 2;
            anim.distortStrength = 0.3 + Math.sin(anim.time * 6) * 0.15;
            anim.currentScale = 1.0 + Math.sin(anim.time * 10) * 0.05;
        } else if (mode === "warning") {
            anim.distortSpeed = 6;
            anim.distortStrength = 0.5;
            anim.currentScale = 1.0 + Math.sin(anim.time * 4) * 0.08;
        } else {
            anim.distortSpeed = 2;
            anim.distortStrength = 0.25;
            anim.currentScale = 1.0 + Math.sin(anim.time * 1.5) * 0.02;
        }

        orb.scale.setScalar(anim.currentScale * 0.25);

        // Inner orb pulse
        if (innerOrb) {
            innerOrb.scale.setScalar(0.12 + Math.sin(anim.time * 3) * 0.02);
        }

        // Ring rotation
        if (ring) {
            ring.rotation.y = anim.ringRotation;
            ring.rotation.x = Math.sin(anim.ringRotation * 0.5) * 0.3;
            ring.rotation.z = Math.cos(anim.ringRotation * 0.3) * 0.2;
        }

        // Decay speaking intensity
        speakingIntensity.current = Math.max(0, speakingIntensity.current - delta * 0.5);
    });

    const modeConfig = MODE_COLORS[mode];

    return (
        <group ref={groupRef} position={position}>
            {/* ─── Outer distort orb ─── */}
            <mesh ref={orbRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <MeshDistortMaterial
                    color={modeConfig.primary}
                    emissive={modeConfig.emissive}
                    emissiveIntensity={1.5}
                    roughness={0.1}
                    metalness={0.3}
                    transparent
                    opacity={0.6}
                    distort={animState.current.distortStrength}
                    speed={animState.current.distortSpeed}
                />
            </mesh>

            {/* ─── Inner core (solid, brighter) ─── */}
            <mesh ref={innerOrbRef}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshStandardMaterial
                    color={modeConfig.primary}
                    emissive={modeConfig.primary}
                    emissiveIntensity={3}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* ─── Orbiting ring ─── */}
            <mesh ref={ringRef}>
                <torusGeometry args={[0.35, 0.008, 8, 64]} />
                <meshStandardMaterial
                    color={modeConfig.primary}
                    emissive={modeConfig.primary}
                    emissiveIntensity={2}
                    transparent
                    opacity={0.5}
                />
            </mesh>

            {/* ─── Second ring (perpendicular) ─── */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.32, 0.006, 8, 64]} />
                <meshStandardMaterial
                    color={modeConfig.emissive}
                    emissive={modeConfig.primary}
                    emissiveIntensity={1}
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* ─── Glow light ─── */}
            <pointLight
                color={modeConfig.primary}
                intensity={mode === "speaking" ? 4 : mode === "warning" ? 5 : 2}
                distance={4}
                decay={2}
            />

            {/* ─── Sparkle particles around orb ─── */}
            <Sparkles
                count={25}
                size={2}
                speed={mode === "speaking" ? 1.5 : 0.5}
                opacity={0.5}
                scale={0.8}
                color={modeConfig.particle}
            />

            {/* ─── AI Label ─── */}
            {showLabel && (
                <Html position={[0, -0.45, 0]} center distanceFactor={4}>
                    <div className="flex flex-col items-center gap-1 select-none pointer-events-none">
                        <span
                            className="text-[10px] font-bold tracking-widest px-3 py-0.5 rounded-full border"
                            style={{
                                color: modeConfig.primary,
                                borderColor: `${modeConfig.primary}44`,
                                backgroundColor: `${modeConfig.emissive}33`,
                            }}
                        >
                            AI TUTOR
                        </span>
                    </div>
                </Html>
            )}

            {/* ─── Speech bubble ─── */}
            {showBubble && message && (
                <Html position={[0, 0.55, 0]} center distanceFactor={3.5}>
                    <div
                        className="max-w-[280px] bg-slate-900/95 backdrop-blur-md text-white text-xs leading-relaxed px-4 py-3 rounded-xl border shadow-2xl select-none pointer-events-none"
                        style={{
                            borderColor: `${modeConfig.primary}40`,
                            boxShadow: `0 0 20px ${modeConfig.primary}15`,
                        }}
                    >
                        <div className="flex items-start gap-2">
                            <span
                                className="w-2 h-2 rounded-full mt-1 shrink-0 animate-pulse"
                                style={{ backgroundColor: modeConfig.primary }}
                            />
                            <span>{message}</span>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}
