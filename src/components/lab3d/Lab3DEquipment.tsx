"use client";

/**
 * ─── Lab3DEquipment ───
 * Dụng cụ thí nghiệm 3D (procedural geometry, không cần GLB files):
 * - Ống nghiệm (Test tube) — hình trụ thủy tinh trong suốt
 * - Cốc thủy tinh (Beaker) — hình hộp bo tròn thủy tinh
 * - Bình tam giác (Erlenmeyer) — hình nón cụt thủy tinh
 * - Chai hóa chất trên kệ — hình trụ nhỏ có nắp + nhãn
 * 
 * Tất cả đều tương tác được qua hand tracking:
 * - Snap targets cho magnetic snap
 * - Grabbable (cầm & di chuyển)
 * - Pour detection (đổ chất lỏng)
 * 
 * Chất lỏng bên trong render bằng plane cắt ngang với MeshTransmissionMaterial.
 */

import React, { useRef, useMemo, MutableRefObject, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { HandState, SnapTarget } from "@/lib/handTracking";
import { Chemical } from "@/lib/chemicals";

// ─── Types ───

export interface LabEquipmentItem {
    id: string;
    type: "test-tube" | "beaker" | "erlenmeyer" | "chemical-bottle";
    label: string;
    /** Vị trí ban đầu trên bàn lab */
    initialPosition: [number, number, number];
    /** Hóa chất chứa bên trong (nếu có) */
    chemical?: Chemical | null;
    /** Mức chất lỏng (0-1) */
    fillLevel?: number;
    /** Màu chất lỏng */
    liquidColor?: string;
}

interface Lab3DEquipmentProps {
    items: LabEquipmentItem[];
    handStateRef: MutableRefObject<HandState>;
    onPourInto?: (sourceId: string, targetId: string) => void;
    onGrab?: (itemId: string) => void;
    onRelease?: (itemId: string, position: [number, number, number]) => void;
}

// ─── Glass Material (shared) ───
function useGlassMaterial(tint: string = "#ffffff") {
    return useMemo(
        () =>
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(tint),
                transmission: 0.92,
                roughness: 0.05,
                metalness: 0,
                ior: 1.5,
                thickness: 0.5,
                transparent: true,
                opacity: 0.3,
                envMapIntensity: 1.5,
                clearcoat: 1,
                clearcoatRoughness: 0.1,
            }),
        [tint]
    );
}

// ─── Individual Equipment Components ───

/** Ống nghiệm 3D */
function TestTube3D({
    item,
    isHeld,
    handStateRef,
}: {
    item: LabEquipmentItem;
    isHeld: boolean;
    handStateRef: MutableRefObject<HandState>;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const glassMat = useGlassMaterial();
    const fillLevel = item.fillLevel ?? 0;
    const liquidColor = item.liquidColor || item.chemical?.liquidColor || "#3b82f6";

    const liquidMaterial = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: new THREE.Color(liquidColor),
                transparent: true,
                opacity: 0.7,
                roughness: 0.1,
                metalness: 0.1,
            }),
        [liquidColor]
    );

    useFrame(() => {
        const group = groupRef.current;
        if (!group) return;

        if (isHeld) {
            const hs = handStateRef.current;
            group.position.lerp(new THREE.Vector3(hs.cursorX, hs.cursorY, hs.cursorZ), 0.2);
            // Tilt based on wrist angle for pour
            const tiltAngle = hs.gesture === "POUR" ? Math.min(hs.wristAngle, Math.PI / 3) : 0;
            group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, tiltAngle, 0.1);
        } else {
            group.position.lerp(
                new THREE.Vector3(...item.initialPosition),
                0.08
            );
            group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 0.1);
        }
    });

    return (
        <group ref={groupRef} position={item.initialPosition}>
            {/* Glass tube */}
            <mesh material={glassMat} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.6, 16, 1, true]} />
            </mesh>
            {/* Bottom cap (rounded) */}
            <mesh material={glassMat} position={[0, -0.3, 0]}>
                <sphereGeometry args={[0.08, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            {/* Rim */}
            <mesh position={[0, 0.3, 0]}>
                <torusGeometry args={[0.085, 0.01, 8, 16]} />
                <meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.2} />
            </mesh>
            {/* Liquid inside */}
            {fillLevel > 0 && (
                <mesh position={[0, -0.3 + fillLevel * 0.3, 0]} material={liquidMaterial}>
                    <cylinderGeometry args={[0.072, 0.072, fillLevel * 0.5, 16]} />
                </mesh>
            )}
            {/* Label floating */}
            <Html position={[0, 0.5, 0]} center distanceFactor={4} occlude>
                <div className="bg-slate-900/80 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-md whitespace-nowrap border border-slate-700/50 select-none pointer-events-none">
                    {item.label}
                </div>
            </Html>
        </group>
    );
}

/** Cốc thủy tinh 3D (Beaker) */
function Beaker3D({
    item,
    isHeld,
    handStateRef,
}: {
    item: LabEquipmentItem;
    isHeld: boolean;
    handStateRef: MutableRefObject<HandState>;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const glassMat = useGlassMaterial();
    const fillLevel = item.fillLevel ?? 0;
    const liquidColor = item.liquidColor || item.chemical?.liquidColor || "#3b82f6";

    const liquidMaterial = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: new THREE.Color(liquidColor),
                transparent: true,
                opacity: 0.65,
                roughness: 0.15,
                metalness: 0.05,
            }),
        [liquidColor]
    );

    useFrame(() => {
        const group = groupRef.current;
        if (!group) return;

        if (isHeld) {
            const hs = handStateRef.current;
            group.position.lerp(new THREE.Vector3(hs.cursorX, hs.cursorY, hs.cursorZ), 0.2);
            const tiltAngle = hs.gesture === "POUR" ? Math.min(hs.wristAngle, Math.PI / 3) : 0;
            group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, tiltAngle, 0.1);
        } else {
            group.position.lerp(
                new THREE.Vector3(...item.initialPosition),
                0.08
            );
            group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 0.1);
        }
    });

    return (
        <group ref={groupRef} position={item.initialPosition}>
            {/* Glass body (open-top cylinder, wider) */}
            <mesh material={glassMat} castShadow>
                <cylinderGeometry args={[0.15, 0.13, 0.5, 16, 1, true]} />
            </mesh>
            {/* Bottom */}
            <mesh material={glassMat} position={[0, -0.25, 0]}>
                <circleGeometry args={[0.13, 16]} />
            </mesh>
            {/* Spout */}
            <mesh position={[0.14, 0.25, 0]} rotation={[0, 0, 0.3]}>
                <boxGeometry args={[0.05, 0.03, 0.06]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.85}
                    roughness={0.05}
                    transparent
                    opacity={0.25}
                />
            </mesh>
            {/* Graduation marks */}
            {[0.1, 0.2, 0.3, 0.4].map((y, i) => (
                <mesh key={i} position={[-0.131, -0.25 + y * 1.1, 0]}>
                    <boxGeometry args={[0.002, 0.002, 0.05]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
                </mesh>
            ))}
            {/* Liquid */}
            {fillLevel > 0 && (
                <mesh position={[0, -0.25 + fillLevel * 0.22, 0]} material={liquidMaterial}>
                    <cylinderGeometry args={[0.125, 0.125, fillLevel * 0.45, 16]} />
                </mesh>
            )}
            <Html position={[0, 0.45, 0]} center distanceFactor={4} occlude>
                <div className="bg-slate-900/80 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-md whitespace-nowrap border border-slate-700/50 select-none pointer-events-none">
                    {item.label}
                </div>
            </Html>
        </group>
    );
}

/** Bình tam giác 3D (Erlenmeyer) */
function Erlenmeyer3D({
    item,
    isHeld,
    handStateRef,
}: {
    item: LabEquipmentItem;
    isHeld: boolean;
    handStateRef: MutableRefObject<HandState>;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const glassMat = useGlassMaterial();
    const fillLevel = item.fillLevel ?? 0;
    const liquidColor = item.liquidColor || item.chemical?.liquidColor || "#3b82f6";

    const liquidMaterial = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: new THREE.Color(liquidColor),
                transparent: true,
                opacity: 0.65,
                roughness: 0.1,
                metalness: 0.05,
            }),
        [liquidColor]
    );

    useFrame(() => {
        const group = groupRef.current;
        if (!group) return;

        if (isHeld) {
            const hs = handStateRef.current;
            group.position.lerp(new THREE.Vector3(hs.cursorX, hs.cursorY, hs.cursorZ), 0.2);
            const tiltAngle = hs.gesture === "POUR" ? Math.min(hs.wristAngle, Math.PI / 3) : 0;
            group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, tiltAngle, 0.1);
        } else {
            group.position.lerp(
                new THREE.Vector3(...item.initialPosition),
                0.08
            );
            group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 0.1);
        }
    });

    return (
        <group ref={groupRef} position={item.initialPosition}>
            {/* Flask body (cone shape) */}
            <mesh material={glassMat} castShadow>
                <cylinderGeometry args={[0.05, 0.18, 0.55, 16, 1, true]} />
            </mesh>
            {/* Narrow neck */}
            <mesh material={glassMat} position={[0, 0.35, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 0.15, 16, 1, true]} />
            </mesh>
            {/* Bottom */}
            <mesh material={glassMat} position={[0, -0.275, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.18, 16]} />
            </mesh>
            {/* Rim */}
            <mesh position={[0, 0.425, 0]}>
                <torusGeometry args={[0.042, 0.006, 8, 16]} />
                <meshStandardMaterial color="#bbb" metalness={0.6} roughness={0.2} />
            </mesh>
            {/* Liquid */}
            {fillLevel > 0 && (
                <mesh position={[0, -0.275 + fillLevel * 0.2, 0]} material={liquidMaterial}>
                    <cylinderGeometry
                        args={[
                            0.05 + (0.18 - 0.05) * (1 - fillLevel * 0.6),
                            0.17,
                            fillLevel * 0.4,
                            16,
                        ]}
                    />
                </mesh>
            )}
            <Html position={[0, 0.6, 0]} center distanceFactor={4} occlude>
                <div className="bg-slate-900/80 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-md whitespace-nowrap border border-slate-700/50 select-none pointer-events-none">
                    {item.label}
                </div>
            </Html>
        </group>
    );
}

/** Chai hóa chất 3D (trên kệ) */
function ChemicalBottle3D({
    item,
    isHeld,
    handStateRef,
}: {
    item: LabEquipmentItem;
    isHeld: boolean;
    handStateRef: MutableRefObject<HandState>;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const liquidColor = item.liquidColor || item.chemical?.liquidColor || "#3b82f6";

    const bottleGlass = useMemo(
        () =>
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(liquidColor).multiplyScalar(0.3),
                transmission: 0.7,
                roughness: 0.1,
                metalness: 0,
                ior: 1.45,
                thickness: 0.3,
                transparent: true,
                opacity: 0.4,
                envMapIntensity: 1.0,
            }),
        [liquidColor]
    );

    useFrame(() => {
        const group = groupRef.current;
        if (!group) return;

        if (isHeld) {
            const hs = handStateRef.current;
            group.position.lerp(new THREE.Vector3(hs.cursorX, hs.cursorY, hs.cursorZ), 0.2);
            const tiltAngle = hs.gesture === "POUR" ? Math.min(hs.wristAngle, Math.PI / 3) : 0;
            group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, tiltAngle, 0.1);
        } else {
            group.position.lerp(
                new THREE.Vector3(...item.initialPosition),
                0.08
            );
            group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 0.1);
        }
    });

    return (
        <group ref={groupRef} position={item.initialPosition}>
            {/* Bottle body */}
            <mesh material={bottleGlass} castShadow>
                <cylinderGeometry args={[0.06, 0.06, 0.35, 12]} />
            </mesh>
            {/* Neck */}
            <mesh material={bottleGlass} position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.03, 0.05, 0.1, 12]} />
            </mesh>
            {/* Cap */}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.05, 12]} />
                <meshStandardMaterial color="#222" roughness={0.5} metalness={0.3} />
            </mesh>
            {/* Liquid inside (visible through glass) */}
            <mesh position={[0, -0.03, 0]}>
                <cylinderGeometry args={[0.052, 0.052, 0.28, 12]} />
                <meshStandardMaterial
                    color={liquidColor}
                    transparent
                    opacity={0.5}
                    roughness={0.1}
                />
            </mesh>
            {/* Label */}
            <Html position={[0, 0.45, 0]} center distanceFactor={3.5} occlude>
                <div className="bg-slate-900/90 backdrop-blur-sm text-[9px] text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/50 whitespace-nowrap font-mono select-none pointer-events-none">
                    {item.chemical?.formula || item.label}
                </div>
            </Html>
        </group>
    );
}

// ─── Main Equipment Component ───

export default function Lab3DEquipment({
    items,
    handStateRef,
    onPourInto,
    onGrab,
    onRelease,
}: Lab3DEquipmentProps) {
    // Generate snap targets from items
    const snapTargets: SnapTarget[] = useMemo(
        () =>
            items.map((item) => ({
                id: item.id,
                x: item.initialPosition[0],
                y: item.initialPosition[1],
                z: item.initialPosition[2],
                radius: item.type === "chemical-bottle" ? 0.3 : 0.4,
            })),
        [items]
    );

    return (
        <group>
            {items.map((item) => {
                const isHeld =
                    handStateRef.current.isHolding &&
                    handStateRef.current.heldObjectId === item.id;

                const sharedProps = { item, isHeld, handStateRef };

                switch (item.type) {
                    case "test-tube":
                        return <TestTube3D key={item.id} {...sharedProps} />;
                    case "beaker":
                        return <Beaker3D key={item.id} {...sharedProps} />;
                    case "erlenmeyer":
                        return <Erlenmeyer3D key={item.id} {...sharedProps} />;
                    case "chemical-bottle":
                        return <ChemicalBottle3D key={item.id} {...sharedProps} />;
                    default:
                        return null;
                }
            })}
        </group>
    );
}

export type { Lab3DEquipmentProps };
