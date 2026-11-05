"use client";

/**
 * ─── Lab3DReactionEffects ───
 * Hệ thống hiệu ứng phản ứng hóa học 3D chi tiết & chân thực:
 * 1. Khói bốc (Volumetric Billowing Smoke / Vapor / Fumes):
 *    - Khói cuộn nở rộng hình nón khi bay lên, trôi dạt uốn lượn tự nhiên.
 *    - Màu sắc hóa học chuẩn xác (khói trắng NH4Cl, khí nâu đỏ NO2, hơi nước bốc lên từ phản ứng tỏa nhiệt, khói đen muội than).
 * 2. Biến đổi màu & Trộn xoáy (Liquid Color Transition & Swirling Vortex):
 *    - Các dải xoáy dung dịch mô phỏng chất tan khuấy trộn và phản ứng bên trong lòng bình.
 *    - Ánh sáng tỏa nhiệt rực rỡ từ tâm phản ứng (Exothermic Core Glow).
 * 3. Sủi bọt & Bọt tuyết mặt thoáng (Effervescence Bubbles, Popping Droplets & Meniscus Foam):
 *    - Bọt khí sinh ra từ đáy/chất rắn, tăng tốc theo lực đẩy Ác-si-mét, lắc lư hình sin.
 *    - Vỡ bọt ở mặt thoáng bắn ra các giọt li ti (meniscus splash droplets).
 *    - Lớp màng bọt xốp (foam cap) nở phồng nhịp nhàng ở mặt nước.
 * 4. Cháy nổ, Lửa & Tia lửa (Combustion, Shockwave Blast, Flame Core & Ballistic Embers):
 *    - Vòng sóng xung kích (Blast Shockwave Ring) quét rộng ngang mặt bàn khi nổ.
 *    - Cột lửa bập bùng với lõi trắng nóng, vỏ cam rực và chóp đỏ bốc cao.
 *    - Mưa tia lửa văng đạn đạo rơi đập mặt bàn nảy lên theo trọng lực (Ballistic Gravity Sparks).
 *    - Ánh sáng chớp rực (PointLight Flash & Flame Flicker) hắt sáng bàn thí nghiệm và không gian.
 * 5. Kết tủa lắng đọng (Precipitate Crystal Flakes & Sediment Cake):
 *    - Tinh thể kết tủa lơ lửng xoáy nhẹ rồi chìm dần theo định luật Stokes.
 *    - Lớp cặn kết tủa (sediment layer) lắng đọng dày dần ở đáy cốc.
 * 6. Âm thanh phản ứng đồng bộ qua Web Audio API & Audio Elements.
 */

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ReactionResult } from "@/lib/reactions";
import { playLabSound } from "./ChemistryRealisticModels";

interface Lab3DReactionEffectsProps {
    /** Kết quả phản ứng từ reactions.ts */
    reaction: ReactionResult | null;
    /** Vị trí xảy ra phản ứng (thường là vị trí glassware) */
    position: [number, number, number];
    /** Đang hoạt động? */
    active: boolean;
    /** Bán kính cốc thí nghiệm (mặc định 0.075m) */
    vesselRadius?: number;
    /** Chiều cao cột chất lỏng trong cốc (mặc định 0.11m) */
    liquidHeight?: number;
}

// ══════════════════════════════════════════════════════════════
// 1. VOLUMETRIC BILLOWING SMOKE & VAPOR (Khói bốc cuộn nở rộng)
// ══════════════════════════════════════════════════════════════

interface SmokeParticle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    scale: number;
    age: number;
    maxAge: number;
    seed: number;
}

function VolumetricSmokeVFX({
    position,
    color = "#f1f5f9",
    intensity = "medium",
    duration = 5.0,
}: {
    position: [number, number, number];
    color?: string;
    intensity: "low" | "medium" | "high";
    duration?: number;
}) {
    const pointsRef = useRef<THREE.Points>(null);
    const particleCount = intensity === "high" ? 75 : intensity === "medium" ? 50 : 30;

    const { particles, positions, sizes, opacities } = useMemo(() => {
        const parts: SmokeParticle[] = [];
        const pos = new Float32Array(particleCount * 3);
        const sz = new Float32Array(particleCount);
        const op = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const maxAge = 2.2 + Math.random() * 2.0;
            const age = Math.random() * maxAge; // Phân bổ tuổi ngẫu nhiên tránh xuất hiện cùng lúc
            const seed = Math.random() * Math.PI * 2;
            const vy = 0.18 + Math.random() * 0.22;

            parts.push({
                x: (Math.random() - 0.5) * 0.04,
                y: 0.12 + Math.random() * 0.05,
                z: (Math.random() - 0.5) * 0.04,
                vx: (Math.random() - 0.5) * 0.02,
                vy,
                vz: (Math.random() - 0.5) * 0.02,
                scale: 0.04 + Math.random() * 0.03,
                age,
                maxAge,
                seed,
            });

            pos[i * 3] = parts[i].x;
            pos[i * 3 + 1] = parts[i].y;
            pos[i * 3 + 2] = parts[i].z;
            sz[i] = parts[i].scale;
            op[i] = 0.0;
        }

        return { particles: parts, positions: pos, sizes: sz, opacities: op };
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
            const p = particles[i];
            p.age += delta;

            if (p.age >= p.maxAge) {
                // Tái sinh luồng khói mới từ miệng bình
                p.age = 0;
                p.x = (Math.random() - 0.5) * 0.035;
                p.y = 0.12 + (Math.random() - 0.5) * 0.02;
                p.z = (Math.random() - 0.5) * 0.035;
                p.vx = (Math.random() - 0.5) * 0.02;
                p.vy = 0.18 + Math.random() * 0.22;
                p.vz = (Math.random() - 0.5) * 0.02;
            } else {
                const lifeRatio = p.age / p.maxAge;
                // Khói bay lên chậm dần do cản khí, cuộn xoáy tự nhiên
                p.vy = Math.max(0.06, p.vy - delta * 0.04);
                p.y += p.vy * delta;

                // Độ trôi hình nón nở rộng (billow expansion)
                const turbulence = Math.sin(p.y * 12 + p.seed) * 0.025;
                p.x += (p.vx + turbulence) * delta;
                p.z += (p.vz + Math.cos(p.y * 10 + p.seed) * 0.025) * delta;

                arr[i * 3] = p.x;
                arr[i * 3 + 1] = p.y;
                arr[i * 3 + 2] = p.z;
            }
        }
        posAttr.needsUpdate = true;
    });

    return (
        <group position={position}>
            <points ref={pointsRef} geometry={geometry}>
                <pointsMaterial
                    color={color}
                    size={intensity === "high" ? 0.09 : 0.065}
                    transparent
                    opacity={intensity === "high" ? 0.55 : 0.38}
                    depthWrite={false}
                    blending={THREE.NormalBlending}
                />
            </points>
        </group>
    );
}

// ══════════════════════════════════════════════════════════════
// 2. EFFERVESCENCE BUBBLES & SURFACE FOAM (Sủi bọt khí & bọt tuyết)
// ══════════════════════════════════════════════════════════════

interface BubbleParticle {
    x: number;
    y: number;
    z: number;
    vy: number;
    wobblePhase: number;
    radius: number;
    isLarge: boolean;
}

interface SplashDroplet {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
}

function EffervescenceBubblesAndFoamVFX({
    position,
    intensity = "medium",
    color = "#ffffff",
    vesselRadius = 0.068,
    liquidHeight = 0.11,
}: {
    position: [number, number, number];
    intensity: "low" | "medium" | "high";
    color?: string;
    vesselRadius?: number;
    liquidHeight?: number;
}) {
    const bubblePointsRef = useRef<THREE.Points>(null);
    const splashPointsRef = useRef<THREE.Points>(null);
    const foamMeshRef = useRef<THREE.Mesh>(null);

    const bubbleCount = intensity === "high" ? 110 : intensity === "medium" ? 65 : 35;
    const splashCount = intensity === "high" ? 35 : intensity === "medium" ? 20 : 10;

    // Khởi tạo các bọt khí nổi lên từ đáy cốc
    const { bubbles, bubblePositions } = useMemo(() => {
        const bList: BubbleParticle[] = [];
        const pos = new Float32Array(bubbleCount * 3);

        for (let i = 0; i < bubbleCount; i++) {
            const rad = Math.random() * (vesselRadius - 0.012);
            const ang = Math.random() * Math.PI * 2;
            const x = Math.cos(ang) * rad;
            const z = Math.sin(ang) * rad;
            const y = 0.01 + Math.random() * (liquidHeight - 0.02);

            bList.push({
                x,
                y,
                z,
                vy: 0.12 + Math.random() * 0.18,
                wobblePhase: Math.random() * Math.PI * 2,
                radius: rad,
                isLarge: Math.random() > 0.75,
            });

            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
        }

        return { bubbles: bList, bubblePositions: pos };
    }, [bubbleCount, vesselRadius, liquidHeight]);

    // Khởi tạo các hạt bắn li ti khi bọt vỡ ở mặt thoáng
    const { splashes, splashPositions } = useMemo(() => {
        const sList: SplashDroplet[] = [];
        const pos = new Float32Array(splashCount * 3);

        for (let i = 0; i < splashCount; i++) {
            sList.push({
                x: 0,
                y: liquidHeight,
                z: 0,
                vx: (Math.random() - 0.5) * 0.1,
                vy: 0.15 + Math.random() * 0.25,
                vz: (Math.random() - 0.5) * 0.1,
                life: Math.random() * 0.4,
                maxLife: 0.35 + Math.random() * 0.25,
            });
            pos[i * 3] = 0;
            pos[i * 3 + 1] = -100;
            pos[i * 3 + 2] = 0;
        }

        return { splashes: sList, splashPositions: pos };
    }, [splashCount, liquidHeight]);

    const bubbleGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(bubblePositions, 3));
        return geo;
    }, [bubblePositions]);

    const splashGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(splashPositions, 3));
        return geo;
    }, [splashPositions]);

    useFrame((_, delta) => {
        // 1. Cập nhật bọt khí dâng lên & lắc lư
        if (bubblePointsRef.current) {
            const posAttr = bubblePointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
            const arr = posAttr.array as Float32Array;

            for (let i = 0; i < bubbleCount; i++) {
                const b = bubbles[i];
                // Lực đẩy Ác-si-mét gia tốc nhẹ khi nổi lên
                b.y += (b.vy + b.y * 0.6) * delta;
                b.wobblePhase += delta * 12;

                const wobble = Math.sin(b.wobblePhase) * 0.003;
                arr[i * 3] = b.x + wobble;
                arr[i * 3 + 1] = b.y;
                arr[i * 3 + 2] = b.z + Math.cos(b.wobblePhase) * 0.003;

                // Khi bọt chạm mặt thoáng (meniscus surface) -> Nổ vỡ và tái sinh ở đáy
                if (b.y >= liquidHeight) {
                    b.y = 0.01 + Math.random() * 0.015;
                    const rad = Math.random() * (vesselRadius - 0.01);
                    const ang = Math.random() * Math.PI * 2;
                    b.x = Math.cos(ang) * rad;
                    b.z = Math.sin(ang) * rad;
                }
            }
            posAttr.needsUpdate = true;
        }

        // 2. Cập nhật hạt bắn nổ li ti trên mặt nước (Meniscus Splash Droplets)
        if (splashPointsRef.current) {
            const posAttr = splashPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
            const arr = posAttr.array as Float32Array;

            for (let i = 0; i < splashCount; i++) {
                const s = splashes[i];
                s.life += delta;

                if (s.life >= s.maxLife) {
                    // Tạo giọt bắn mới từ vị trí vỡ bọt ngẫu nhiên trên mặt nước
                    s.life = 0;
                    const rad = Math.random() * (vesselRadius - 0.015);
                    const ang = Math.random() * Math.PI * 2;
                    s.x = Math.cos(ang) * rad;
                    s.y = liquidHeight;
                    s.z = Math.sin(ang) * rad;
                    s.vx = (Math.random() - 0.5) * 0.12;
                    s.vy = 0.18 + Math.random() * 0.28;
                    s.vz = (Math.random() - 0.5) * 0.12;
                } else {
                    // Trọng lực kéo giọt bắn rơi lại vào cốc
                    s.vy -= delta * 3.8;
                    s.x += s.vx * delta;
                    s.y += s.vy * delta;
                    s.z += s.vz * delta;
                }

                arr[i * 3] = s.x;
                arr[i * 3 + 1] = Math.max(liquidHeight - 0.005, s.y);
                arr[i * 3 + 2] = s.z;
            }
            posAttr.needsUpdate = true;
        }

        // 3. Lớp màng bọt xốp nhấp nhô ở mặt nước (Foam Cap Pulsation)
        if (foamMeshRef.current) {
            const t = performance.now() * 0.005;
            const s = 1.0 + Math.sin(t) * 0.06;
            foamMeshRef.current.scale.set(s, s, s);
        }
    });

    return (
        <group position={position}>
            {/* Các bọt khí trong lòng dung dịch */}
            <points ref={bubblePointsRef} geometry={bubbleGeo}>
                <pointsMaterial
                    color={color}
                    size={intensity === "high" ? 0.018 : 0.013}
                    transparent
                    opacity={0.85}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Các giọt nước li ti bắn lên khi bọt nổ */}
            <points ref={splashPointsRef} geometry={splashGeo}>
                <pointsMaterial
                    color={color}
                    size={0.011}
                    transparent
                    opacity={0.7}
                    depthWrite={false}
                />
            </points>

            {/* Màng bọt tuyết xốp ở mặt thoáng (Surface Foam Layer) */}
            <mesh
                ref={foamMeshRef}
                position={[0, liquidHeight + 0.002, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <circleGeometry args={[vesselRadius - 0.006, 24]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={0.2}
                    transparent
                    opacity={intensity === "high" ? 0.65 : 0.45}
                    roughness={0.8}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

// ══════════════════════════════════════════════════════════════
// 3. COMBUSTION, EXPLOSION, FLAME & SPARKS (Cháy nổ & Cột lửa)
// ══════════════════════════════════════════════════════════════

interface BallisticSpark {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    color: THREE.Color;
}

interface FlameParticle {
    x: number;
    y: number;
    z: number;
    vy: number;
    phase: number;
    scale: number;
}

function CombustionExplosionVFX({
    position,
    intensity = "high",
    targetColor = "#f97316",
    startTime,
}: {
    position: [number, number, number];
    intensity: "low" | "medium" | "high";
    targetColor?: string;
    startTime: number;
}) {
    const shockwaveRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);
    const sparksRef = useRef<THREE.Points>(null);
    const flamesRef = useRef<THREE.Points>(null);

    const sparkCount = intensity === "high" ? 95 : intensity === "medium" ? 55 : 30;
    const flameCount = intensity === "high" ? 65 : intensity === "medium" ? 40 : 25;

    // Khởi tạo các tia lửa bắn đạn đạo
    const { sparks, sparkPositions, sparkColors } = useMemo(() => {
        const sList: BallisticSpark[] = [];
        const pos = new Float32Array(sparkCount * 3);
        const col = new Float32Array(sparkCount * 3);

        const baseColor = new THREE.Color(targetColor || "#f97316");
        const hotColor = new THREE.Color("#fef08a"); // Vàng kim chói lóa

        for (let i = 0; i < sparkCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * (Math.PI / 2.2); // Bắn lên trên bán cầu
            const speed = 0.8 + Math.random() * 1.6;

            const c = hotColor.clone().lerp(baseColor, Math.random() * 0.7);

            sList.push({
                x: 0,
                y: 0.12,
                z: 0,
                vx: Math.sin(phi) * Math.cos(theta) * speed,
                vy: Math.cos(phi) * speed + 0.3,
                vz: Math.sin(phi) * Math.sin(theta) * speed,
                life: Math.random() * 0.3,
                maxLife: 0.8 + Math.random() * 1.4,
                color: c,
            });

            pos[i * 3] = 0;
            pos[i * 3 + 1] = 0.12;
            pos[i * 3 + 2] = 0;

            col[i * 3] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }

        return { sparks: sList, sparkPositions: pos, sparkColors: col };
    }, [sparkCount, targetColor]);

    // Khởi tạo các điểm lửa bập bùng ở miệng bình
    const { flames, flamePositions } = useMemo(() => {
        const fList: FlameParticle[] = [];
        const pos = new Float32Array(flameCount * 3);

        for (let i = 0; i < flameCount; i++) {
            fList.push({
                x: (Math.random() - 0.5) * 0.05,
                y: 0.06 + Math.random() * 0.18,
                z: (Math.random() - 0.5) * 0.05,
                vy: 0.45 + Math.random() * 0.65,
                phase: Math.random() * Math.PI * 2,
                scale: 0.03 + Math.random() * 0.04,
            });

            pos[i * 3] = fList[i].x;
            pos[i * 3 + 1] = fList[i].y;
            pos[i * 3 + 2] = fList[i].z;
        }

        return { flames: fList, flamePositions: pos };
    }, [flameCount]);

    const sparkGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(sparkColors, 3));
        return geo;
    }, [sparkPositions, sparkColors]);

    const flameGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(flamePositions, 3));
        return geo;
    }, [flamePositions]);

    useFrame((_, delta) => {
        const elapsed = (performance.now() - startTime) / 1000;

        // 1. Sóng xung kích nổ quét rộng (Blast Shockwave Ring)
        if (shockwaveRef.current) {
            if (elapsed < 0.65) {
                const t = elapsed / 0.65;
                const scale = 0.2 + t * 4.8;
                shockwaveRef.current.scale.set(scale, scale, 1);
                const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;
                mat.opacity = Math.max(0, 0.85 * (1 - t));
                shockwaveRef.current.visible = true;
            } else {
                shockwaveRef.current.visible = false;
            }
        }

        // 2. Ánh chớp chói lòa ban đầu + bập bùng ngọn lửa (Flash & Dynamic Flame Light)
        if (lightRef.current) {
            if (elapsed < 0.25) {
                // Chớp bùng nổ cực mạnh ban đầu
                const t = elapsed / 0.25;
                lightRef.current.intensity = 14.0 * (1 - t * 0.7);
            } else if (elapsed < 4.2) {
                // Ánh lửa bập bùng chiếu sáng bàn thí nghiệm và mặt cô giáo AI
                const flicker =
                    Math.sin(elapsed * 28) * 0.6 +
                    Math.sin(elapsed * 45) * 0.4 +
                    Math.cos(elapsed * 17) * 0.5;
                lightRef.current.intensity = Math.max(0.8, 3.2 + flicker);
            } else {
                // Tàn dần
                lightRef.current.intensity = Math.max(0, lightRef.current.intensity - delta * 3);
            }
        }

        // 3. Cập nhật tia lửa bắn văng rơi theo trọng lực (Ballistic Embers)
        if (sparksRef.current) {
            const posAttr = sparksRef.current.geometry.attributes.position as THREE.BufferAttribute;
            const arr = posAttr.array as Float32Array;

            for (let i = 0; i < sparkCount; i++) {
                const s = sparks[i];
                s.life += delta;

                if (s.life < s.maxLife && elapsed < 4.5) {
                    // Gia tốc trọng lực
                    s.vy -= delta * 4.6;
                    s.x += s.vx * delta;
                    s.y += s.vy * delta;
                    s.z += s.vz * delta;

                    // Chạm mặt bàn (Y = 0m) -> Nảy lên nhẹ (rebound bounce)
                    if (s.y <= 0.0) {
                        s.y = 0.0;
                        s.vy = -s.vy * 0.35;
                        s.vx *= 0.65;
                        s.vz *= 0.65;
                    }

                    arr[i * 3] = s.x;
                    arr[i * 3 + 1] = s.y;
                    arr[i * 3 + 2] = s.z;
                } else if (elapsed < 3.5) {
                    // Tái sinh một số tia lửa duy trì ngọn lửa
                    s.life = 0;
                    s.x = (Math.random() - 0.5) * 0.04;
                    s.y = 0.12;
                    s.z = (Math.random() - 0.5) * 0.04;
                    s.vx = (Math.random() - 0.5) * 0.6;
                    s.vy = 0.6 + Math.random() * 0.9;
                    s.vz = (Math.random() - 0.5) * 0.6;
                } else {
                    // Tắt tia lửa
                    arr[i * 3 + 1] = -100;
                }
            }
            posAttr.needsUpdate = true;
        }

        // 4. Cột lửa bập bùng (Flame Tongues)
        if (flamesRef.current) {
            const posAttr = flamesRef.current.geometry.attributes.position as THREE.BufferAttribute;
            const arr = posAttr.array as Float32Array;

            for (let i = 0; i < flameCount; i++) {
                const f = flames[i];
                f.phase += delta * 15;

                if (elapsed < 4.0) {
                    f.y += f.vy * delta;
                    // Lửa thót ngọn ở trên cao
                    const wave = Math.sin(f.phase) * 0.015;
                    arr[i * 3] = f.x + wave;
                    arr[i * 3 + 1] = f.y;
                    arr[i * 3 + 2] = f.z + Math.cos(f.phase) * 0.015;

                    if (f.y > 0.38) {
                        f.y = 0.08 + Math.random() * 0.04;
                        f.x = (Math.random() - 0.5) * 0.05;
                        f.z = (Math.random() - 0.5) * 0.05;
                    }
                } else {
                    arr[i * 3 + 1] = -100;
                }
            }
            posAttr.needsUpdate = true;
        }
    });

    return (
        <group position={position}>
            {/* Vòng sóng xung kích tỏa ngang mặt bàn */}
            <mesh
                ref={shockwaveRef}
                position={[0, 0.02, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                visible={false}
            >
                <ringGeometry args={[0.03, 0.09, 36]} />
                <meshBasicMaterial
                    color={targetColor || "#fbbf24"}
                    transparent
                    opacity={0.8}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Ánh sáng chớp & bập bùng của ngọn lửa */}
            <pointLight
                ref={lightRef}
                position={[0, 0.22, 0]}
                color={targetColor || "#f97316"}
                distance={4.5}
                decay={2}
                intensity={0}
            />

            {/* Cột lửa bốc cuồn cuộn */}
            <points ref={flamesRef} geometry={flameGeo}>
                <pointsMaterial
                    color={targetColor || "#f97316"}
                    size={intensity === "high" ? 0.055 : 0.04}
                    transparent
                    opacity={0.85}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>

            {/* Mưa tia lửa đạn đạo bay văng nảy mặt bàn */}
            <points ref={sparksRef} geometry={sparkGeo}>
                <pointsMaterial
                    vertexColors
                    size={0.016}
                    transparent
                    opacity={0.9}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>
        </group>
    );
}

// ══════════════════════════════════════════════════════════════
// 4. PRECIPITATE CRYSTALS & SEDIMENT CAKE (Hiện tượng kết tủa lắng đọng)
// ══════════════════════════════════════════════════════════════

interface PrecipitateFlake {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    settled: boolean;
    spin: number;
}

function PrecipitateSettlingVFX({
    position,
    color = "#ffffff",
    intensity = "medium",
    vesselRadius = 0.068,
    liquidHeight = 0.11,
}: {
    position: [number, number, number];
    color?: string;
    intensity: "low" | "medium" | "high";
    vesselRadius?: number;
    liquidHeight?: number;
}) {
    const pointsRef = useRef<THREE.Points>(null);
    const sedimentMeshRef = useRef<THREE.Mesh>(null);
    const flakeCount = intensity === "high" ? 120 : intensity === "medium" ? 75 : 40;

    const { flakes, positions } = useMemo(() => {
        const fList: PrecipitateFlake[] = [];
        const pos = new Float32Array(flakeCount * 3);

        for (let i = 0; i < flakeCount; i++) {
            const rad = Math.random() * (vesselRadius - 0.01);
            const ang = Math.random() * Math.PI * 2;
            const x = Math.cos(ang) * rad;
            const z = Math.sin(ang) * rad;
            const y = 0.03 + Math.random() * (liquidHeight - 0.04);

            fList.push({
                x,
                y,
                z,
                vx: (Math.random() - 0.5) * 0.01,
                vy: -0.018 - Math.random() * 0.025, // Tốc độ lắng chậm rãi theo định luật Stokes
                vz: (Math.random() - 0.5) * 0.01,
                settled: false,
                spin: Math.random() * Math.PI * 2,
            });

            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
        }

        return { flakes: fList, positions: pos };
    }, [flakeCount, vesselRadius, liquidHeight]);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return geo;
    }, [positions]);

    useFrame((_, delta) => {
        if (pointsRef.current) {
            const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
            const arr = posAttr.array as Float32Array;

            let settledCount = 0;

            for (let i = 0; i < flakeCount; i++) {
                const f = flakes[i];
                if (!f.settled) {
                    f.y += f.vy * delta;
                    f.spin += delta * 2;
                    // Lắc lư nhẹ khi rơi trong lòng chất lỏng sánh
                    f.x += Math.sin(f.spin) * 0.0008;
                    f.z += Math.cos(f.spin) * 0.0008;

                    if (f.y <= 0.012) {
                        f.y = 0.008 + Math.random() * 0.004;
                        f.settled = true;
                    }
                } else {
                    settledCount++;
                }

                arr[i * 3] = f.x;
                arr[i * 3 + 1] = f.y;
                arr[i * 3 + 2] = f.z;
            }
            posAttr.needsUpdate = true;

            // Lớp cặn kết tủa dày dần ở đáy cốc
            if (sedimentMeshRef.current) {
                const ratio = Math.min(1.0, settledCount / flakeCount);
                const mat = sedimentMeshRef.current.material as THREE.MeshStandardMaterial;
                mat.opacity = 0.25 + ratio * 0.65;
            }
        }
    });

    return (
        <group position={position}>
            {/* Hạt tinh thể kết tủa lơ lửng chìm dần */}
            <points ref={pointsRef} geometry={geometry}>
                <pointsMaterial
                    color={color}
                    size={0.016}
                    transparent
                    opacity={0.88}
                    depthWrite={false}
                />
            </points>

            {/* Bánh cặn kết tủa đọng ở đáy cốc (Sediment Layer) */}
            <mesh
                ref={sedimentMeshRef}
                position={[0, 0.008, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <circleGeometry args={[vesselRadius - 0.008, 24]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.25}
                    roughness={0.7}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

// ══════════════════════════════════════════════════════════════
// 5. LIQUID SWIRL MIXING VORTEX (Xoáy chất lỏng phản ứng khuấy trộn)
// ══════════════════════════════════════════════════════════════

function LiquidSwirlMixingVFX({
    position,
    color = "#38bdf8",
    vesselRadius = 0.065,
    liquidHeight = 0.11,
}: {
    position: [number, number, number];
    color?: string;
    vesselRadius?: number;
    liquidHeight?: number;
}) {
    const vortexRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (vortexRef.current) {
            vortexRef.current.rotation.y += delta * 4.5;
        }
    });

    return (
        <group position={position}>
            <group ref={vortexRef}>
                {[0.25, 0.5, 0.75].map((hRatio, i) => (
                    <mesh
                        key={i}
                        position={[0, liquidHeight * hRatio, 0]}
                        rotation={[-Math.PI / 2, 0, (i * Math.PI) / 3]}
                    >
                        <ringGeometry args={[vesselRadius * 0.35, vesselRadius * 0.75, 16]} />
                        <meshBasicMaterial
                            color={color}
                            transparent
                            opacity={0.22}
                            blending={THREE.AdditiveBlending}
                            side={THREE.DoubleSide}
                            depthWrite={false}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT: LAB 3D REACTION EFFECTS ORCHESTRATOR
// ══════════════════════════════════════════════════════════════

export default function Lab3DReactionEffects({
    reaction,
    position,
    active,
    vesselRadius = 0.072,
    liquidHeight = 0.115,
}: Lab3DReactionEffectsProps) {
    const reactionStartRef = useRef<number>(performance.now());
    const lastReactionEqRef = useRef<string>("");

    // Đồng bộ âm thanh tự động theo tính chất phản ứng hóa học
    useEffect(() => {
        if (!reaction || !active) return;

        if (reaction.equation !== lastReactionEqRef.current) {
            lastReactionEqRef.current = reaction.equation;
            reactionStartRef.current = performance.now();

            const isCombustion =
                reaction.type === "combustion" ||
                reaction.effects.some((e) => e.type === "flame" || e.type === "flash");
            const hasBubbles =
                reaction.type === "gas_evolution" ||
                reaction.type === "metal_acid" ||
                reaction.effects.some((e) => e.type === "bubbles");
            const hasSmokeOrAcid =
                reaction.type === "acid_base" ||
                reaction.effects.some((e) => e.type === "smoke");

            if (isCombustion) {
                playLabSound("explosion");
                setTimeout(() => playLabSound("crackle"), 200);
            } else if (hasBubbles) {
                playLabSound("bubbles");
            } else if (hasSmokeOrAcid) {
                playLabSound("hiss");
            }
        }
    }, [reaction, active]);

    if (!reaction || !active) return null;

    const effectPos: [number, number, number] = [position[0], position[1], position[2]];

    // Phân tích các loại hiệu ứng cấu thành phản ứng
    const hasCombustion =
        reaction.type === "combustion" ||
        reaction.effects.some((e) => e.type === "flame" || e.type === "flash");
    const hasBubbles =
        reaction.type === "gas_evolution" ||
        reaction.type === "metal_acid" ||
        reaction.effects.some((e) => e.type === "bubbles");
    const hasPrecipitate =
        reaction.type === "precipitation" ||
        reaction.effects.some((e) => e.type === "precipitate");
    const hasSmoke =
        reaction.effects.some((e) => e.type === "smoke") ||
        (hasCombustion && !reaction.effects.some((e) => e.type === "smoke"));

    // Lấy màu sắc đặc trưng của hiệu ứng hoặc sản phẩm
    const flameEffect = reaction.effects.find((e) => e.type === "flame" || e.type === "flash");
    const flameColor = flameEffect?.targetColor || "#f97316";

    const smokeEffect = reaction.effects.find((e) => e.type === "smoke");
    // Khí NO2 đặc trưng màu nâu đỏ; NH4Cl khói trắng dày; H2SO4 đặc tỏa khói/hơi nước
    const smokeColor =
        smokeEffect?.targetColor ||
        (reaction.equation.includes("NO2") ? "#9a3412" : "#f1f5f9");

    const precipitateEffect = reaction.effects.find((e) => e.type === "precipitate");
    const precipitateColor = precipitateEffect?.targetColor || "#ffffff";

    const colorChangeEffect = reaction.effects.find((e) => e.type === "color_change");
    const swirlColor = colorChangeEffect?.targetColor || flameColor || "#38bdf8";

    return (
        <group>
            {/* 1. Xoáy trộn phản ứng bên trong dung dịch (Luôn hiện để mô phỏng dòng chất lỏng tương tác) */}
            <LiquidSwirlMixingVFX
                position={effectPos}
                color={swirlColor}
                vesselRadius={vesselRadius}
                liquidHeight={liquidHeight}
            />

            {/* 2. Hiệu ứng sủi bọt khí & bọt tuyết mặt thoáng */}
            {hasBubbles && (
                <EffervescenceBubblesAndFoamVFX
                    position={effectPos}
                    intensity={reaction.effects.find((e) => e.type === "bubbles")?.intensity || "medium"}
                    color="#ffffff"
                    vesselRadius={vesselRadius}
                    liquidHeight={liquidHeight}
                />
            )}

            {/* 3. Hiệu ứng tạo kết tủa & lắng đọng đáy cốc */}
            {hasPrecipitate && (
                <PrecipitateSettlingVFX
                    position={effectPos}
                    color={precipitateColor}
                    intensity={precipitateEffect?.intensity || "medium"}
                    vesselRadius={vesselRadius}
                    liquidHeight={liquidHeight}
                />
            )}

            {/* 4. Hiệu ứng khói cuộn nở rộng hình nón */}
            {hasSmoke && (
                <VolumetricSmokeVFX
                    position={effectPos}
                    color={smokeColor}
                    intensity={smokeEffect?.intensity || "medium"}
                    duration={smokeEffect?.duration ? smokeEffect.duration / 1000 : 5.0}
                />
            )}

            {/* 5. Hiệu ứng cháy nổ, bùng lửa, tia lửa đạn đạo & sóng xung kích */}
            {hasCombustion && (
                <CombustionExplosionVFX
                    position={effectPos}
                    intensity={flameEffect?.intensity || "high"}
                    targetColor={flameColor}
                    startTime={reactionStartRef.current}
                />
            )}
        </group>
    );
}
