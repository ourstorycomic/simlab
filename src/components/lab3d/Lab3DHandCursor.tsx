"use client";

/**
 * ─── Lab3DHandCursor ───
 * Bàn tay ảo 3D hiển thị trong Three.js scene.
 * 
 * Đọc trực tiếp từ handStateRef.current qua useFrame() — KHÔNG re-render React.
 * 
 * Hiển thị:
 * - Orb phát sáng tại vị trí ngón trỏ (OPEN)
 * - Tay nắm khi GRAB (orb co lại + đổi màu)
 * - Hiệu ứng đổ khi POUR (particles chảy xuống)
 * - Vòng tròn magnetic snap khi gần đồ vật
 */

import React, { useRef, useMemo, MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HandState, applyMagneticSnap, SnapTarget } from "@/lib/handTracking";

interface Lab3DHandCursorProps {
    handStateRef: MutableRefObject<HandState>;
    snapTargets: SnapTarget[];
}

export default function Lab3DHandCursor({ handStateRef, snapTargets }: Lab3DHandCursorProps) {
    const groupRef = useRef<THREE.Group>(null);
    const outerRingRef = useRef<THREE.Mesh>(null);
    const innerOrbRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.PointLight>(null);
    const pourParticlesRef = useRef<THREE.Points>(null);

    // Pour particles geometry
    const pourParticleCount = 30;
    const pourPositions = useMemo(() => {
        const arr = new Float32Array(pourParticleCount * 3);
        return arr;
    }, []);
    const pourGeometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pourPositions, 3));
        return geo;
    }, [pourPositions]);

    // Animation state (not React state!)
    const animState = useRef({
        scale: 0,
        opacity: 0,
        ringRotation: 0,
        pourTimer: 0,
        particleVelocities: Array.from({ length: pourParticleCount }, () => ({
            vy: 0, vx: 0, life: 0,
        })),
    });

    // Color materials
    const orbMaterial = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: new THREE.Color("#00ffa3"),
                emissive: new THREE.Color("#00ffa3"),
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.8,
                roughness: 0.1,
                metalness: 0.3,
            }),
        []
    );

    const ringMaterial = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: new THREE.Color("#00bfff"),
                emissive: new THREE.Color("#0077ff"),
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.4,
                wireframe: true,
                roughness: 0.2,
            }),
        []
    );

    const pourMaterial = useMemo(
        () =>
            new THREE.PointsMaterial({
                color: new THREE.Color("#00ffa3"),
                size: 0.03,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        []
    );

    // ─── useFrame: 60 FPS update without React re-render ───
    useFrame((_, delta) => {
        const state = handStateRef.current;
        const group = groupRef.current;
        const outerRing = outerRingRef.current;
        const innerOrb = innerOrbRef.current;
        const glow = glowRef.current;
        const anim = animState.current;

        if (!group || !outerRing || !innerOrb || !glow) return;

        // ─── Visibility & Position ───
        if (state.detected) {
            // Apply magnetic snap
            const snapped = applyMagneticSnap(
                state.cursorX,
                state.cursorY,
                state.cursorZ,
                snapTargets
            );

            // Smooth movement
            group.position.lerp(
                new THREE.Vector3(snapped.x, snapped.y, snapped.z),
                0.3
            );

            // Fade in
            anim.opacity = Math.min(1, anim.opacity + delta * 4);
        } else {
            // Fade out
            anim.opacity = Math.max(0, anim.opacity - delta * 3);
        }

        group.visible = anim.opacity > 0.01;

        // ─── Gesture-based appearance ───
        const isGrab = state.gesture === "GRAB";
        const isPour = state.gesture === "POUR";

        // Target scale
        const targetScale = isGrab || isPour ? 0.06 : 0.1;
        anim.scale += (targetScale - anim.scale) * 0.15;
        innerOrb.scale.setScalar(anim.scale);

        // Orb color
        if (isPour) {
            orbMaterial.color.lerp(new THREE.Color("#ff6600"), 0.1);
            orbMaterial.emissive.lerp(new THREE.Color("#ff4400"), 0.1);
            orbMaterial.emissiveIntensity = 1.0;
        } else if (isGrab) {
            orbMaterial.color.lerp(new THREE.Color("#ffaa00"), 0.1);
            orbMaterial.emissive.lerp(new THREE.Color("#ff8800"), 0.1);
            orbMaterial.emissiveIntensity = 0.8;
        } else {
            orbMaterial.color.lerp(new THREE.Color("#00ffa3"), 0.1);
            orbMaterial.emissive.lerp(new THREE.Color("#00ffa3"), 0.1);
            orbMaterial.emissiveIntensity = 0.6;
        }

        orbMaterial.opacity = anim.opacity * 0.8;
        ringMaterial.opacity = anim.opacity * 0.4;

        // Ring rotation
        anim.ringRotation += delta * 1.5;
        outerRing.rotation.z = anim.ringRotation;
        outerRing.rotation.x = Math.sin(anim.ringRotation * 0.5) * 0.3;
        outerRing.scale.setScalar(anim.scale * 2.5);

        // Glow light
        glow.intensity = anim.opacity * (isPour ? 3 : isGrab ? 2 : 1.5);
        glow.color.copy(orbMaterial.color);

        // ─── Pour particles ───
        const pourPoints = pourParticlesRef.current;
        if (pourPoints) {
            pourPoints.visible = isPour && anim.opacity > 0.3;

            if (isPour) {
                const posAttr = pourPoints.geometry.attributes.position as THREE.BufferAttribute;
                const positions = posAttr.array as Float32Array;

                for (let i = 0; i < pourParticleCount; i++) {
                    const pv = anim.particleVelocities[i];
                    pv.life -= delta;

                    if (pv.life <= 0) {
                        // Reset particle
                        positions[i * 3] = (Math.random() - 0.5) * 0.05;
                        positions[i * 3 + 1] = 0;
                        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
                        pv.vy = -0.5 - Math.random() * 0.5;
                        pv.vx = (Math.random() - 0.5) * 0.1;
                        pv.life = 0.5 + Math.random() * 0.5;
                    } else {
                        positions[i * 3] += pv.vx * delta;
                        positions[i * 3 + 1] += pv.vy * delta;
                        pv.vy -= delta * 2; // gravity
                    }
                }
                posAttr.needsUpdate = true;
            }
        }
    });

    return (
        <group ref={groupRef} visible={false}>
            {/* Inner orb */}
            <mesh ref={innerOrbRef} material={orbMaterial}>
                <sphereGeometry args={[1, 16, 16]} />
            </mesh>

            {/* Outer ring */}
            <mesh ref={outerRingRef} material={ringMaterial}>
                <torusGeometry args={[1, 0.02, 8, 32]} />
            </mesh>

            {/* Glow light */}
            <pointLight ref={glowRef} intensity={1.5} distance={3} decay={2} />

            {/* Pour particles */}
            <points ref={pourParticlesRef} geometry={pourGeometry} material={pourMaterial} visible={false} />
        </group>
    );
}
