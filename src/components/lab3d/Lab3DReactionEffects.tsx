"use client";

/**
 * ─── Lab3DReactionEffects ───
 * Hiệu ứng phản ứng hóa học 3D — tái sử dụng logic từ reactions.ts
 * 
 * Sử dụng components có sẵn của @react-three/drei:
 * - <Sparkles> → bọt khí / tia lửa
 * - <Cloud> → khói bay lên
 * - Color animation → đổi màu dung dịch
 * - Particle system → kết tủa rơi xuống
 * 
 * Kết nối trực tiếp với ReactionResult từ reactions.ts
 */

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sparkles, Cloud } from "@react-three/drei";
import { ReactionEffect, ReactionResult } from "@/lib/reactions";

interface Lab3DReactionEffectsProps {
    /** Kết quả phản ứng từ reactions.ts */
    reaction: ReactionResult | null;
    /** Vị trí xảy ra phản ứng (thường là vị trí glassware) */
    position: [number, number, number];
    /** Đang hoạt động? */
    active: boolean;
}

// ─── Bubble Particles (sủi bọt khí) ───
function BubbleEffect({
    intensity,
    position,
    color = "#ffffff",
}: {
    intensity: "low" | "medium" | "high";
    position: [number, number, number];
    color?: string;
}) {
    const count = intensity === "high" ? 80 : intensity === "medium" ? 40 : 20;
    const speed = intensity === "high" ? 2.5 : intensity === "medium" ? 1.5 : 0.8;

    return (
        <Sparkles
            count={count}
            size={intensity === "high" ? 4 : 2.5}
            speed={speed}
            opacity={0.6}
            scale={[0.3, 0.5, 0.3]}
            position={position}
            color={color}
        />
    );
}

// ─── Smoke Effect (khói bay lên) ───
function SmokeEffect({
    intensity,
    position,
    color = "#888888",
}: {
    intensity: "low" | "medium" | "high";
    position: [number, number, number];
    color?: string;
}) {
    const segments = intensity === "high" ? 12 : intensity === "medium" ? 8 : 5;
    const opacity = intensity === "high" ? 0.4 : intensity === "medium" ? 0.25 : 0.15;

    return (
        <Cloud
            opacity={opacity}
            speed={0.5}
            bounds={[0.5, 0.3, 0.3]}
            scale={0.5}
            segments={segments}
            position={[position[0], position[1] + 0.3, position[2]]}
            color={color}
        />
    );
}

// ─── Flame Effect (lửa/tia lửa) ───
function FlameEffect({
    intensity,
    position,
}: {
    intensity: "low" | "medium" | "high";
    position: [number, number, number];
}) {
    const count = intensity === "high" ? 60 : intensity === "medium" ? 35 : 15;

    return (
        <group position={position}>
            {/* Core flame */}
            <Sparkles
                count={count}
                size={intensity === "high" ? 5 : 3}
                speed={3}
                opacity={0.8}
                scale={[0.15, 0.4, 0.15]}
                color="#ff6600"
            />
            {/* Ember tips */}
            <Sparkles
                count={Math.floor(count / 2)}
                size={2}
                speed={2}
                opacity={0.5}
                scale={[0.2, 0.5, 0.2]}
                position={[0, 0.2, 0]}
                color="#ffdd00"
            />
        </group>
    );
}

// ─── Precipitate Effect (kết tủa rơi xuống) ───
function PrecipitateEffect({
    intensity,
    position,
    color = "#ffffff",
}: {
    intensity: "low" | "medium" | "high";
    position: [number, number, number];
    color?: string;
}) {
    const particleCount = intensity === "high" ? 40 : intensity === "medium" ? 20 : 10;
    const pointsRef = useRef<THREE.Points>(null);

    const { positions, velocities } = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        const vel = Array.from({ length: particleCount }, () => ({
            vy: -0.1 - Math.random() * 0.3,
            vx: (Math.random() - 0.5) * 0.05,
            life: Math.random(),
        }));

        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 0.2;
            pos[i * 3 + 1] = Math.random() * 0.3;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        }

        return { positions: pos, velocities: vel };
    }, [particleCount]);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return geo;
    }, [positions]);

    useFrame((_, delta) => {
        const pts = pointsRef.current;
        if (!pts) return;

        const posAttr = pts.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
            const v = velocities[i];
            v.life -= delta * 0.5;

            if (v.life <= 0) {
                arr[i * 3] = (Math.random() - 0.5) * 0.2;
                arr[i * 3 + 1] = 0.2 + Math.random() * 0.1;
                arr[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
                v.vy = -0.1 - Math.random() * 0.3;
                v.vx = (Math.random() - 0.5) * 0.05;
                v.life = 0.5 + Math.random();
            } else {
                arr[i * 3] += v.vx * delta;
                arr[i * 3 + 1] += v.vy * delta;
            }
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} geometry={geometry} position={position}>
            <pointsMaterial
                color={color}
                size={0.02}
                transparent
                opacity={0.7}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

// ─── Flash Effect (chớp sáng) ───
function FlashEffect({ position }: { position: [number, number, number] }) {
    const lightRef = useRef<THREE.PointLight>(null);
    const flashPhase = useRef(0);

    useFrame((_, delta) => {
        const light = lightRef.current;
        if (!light) return;
        flashPhase.current += delta * 10;
        light.intensity = Math.max(0, 8 * Math.exp(-flashPhase.current * 2));
    });

    useEffect(() => {
        flashPhase.current = 0;
    }, []);

    return <pointLight ref={lightRef} position={position} color="#ffffff" distance={5} decay={2} />;
}

// ─── Main Component ───

export default function Lab3DReactionEffects({
    reaction,
    position,
    active,
}: Lab3DReactionEffectsProps) {
    if (!reaction || !active) return null;

    return (
        <group>
            {reaction.effects.map((effect, i) => {
                const key = `${effect.type}-${i}`;
                const effectPos: [number, number, number] = [
                    position[0],
                    position[1] + 0.1,
                    position[2],
                ];

                switch (effect.type) {
                    case "bubbles":
                        return (
                            <BubbleEffect
                                key={key}
                                intensity={effect.intensity}
                                position={effectPos}
                                color={effect.targetColor}
                            />
                        );
                    case "smoke":
                        return (
                            <SmokeEffect
                                key={key}
                                intensity={effect.intensity}
                                position={[effectPos[0], effectPos[1] + 0.2, effectPos[2]]}
                                color={effect.targetColor || "#999"}
                            />
                        );
                    case "flame":
                        return (
                            <FlameEffect
                                key={key}
                                intensity={effect.intensity}
                                position={effectPos}
                            />
                        );
                    case "precipitate":
                        return (
                            <PrecipitateEffect
                                key={key}
                                intensity={effect.intensity}
                                position={effectPos}
                                color={effect.targetColor || "#fff"}
                            />
                        );
                    case "flash":
                        return <FlashEffect key={key} position={effectPos} />;
                    case "sparkle":
                        return (
                            <Sparkles
                                key={key}
                                count={30}
                                size={3}
                                speed={1.5}
                                opacity={0.7}
                                scale={0.4}
                                position={effectPos}
                                color={effect.targetColor || "#ffd700"}
                            />
                        );
                    default:
                        return null;
                }
            })}
        </group>
    );
}
