"use client";

/**
 * ─── Lab3DHoldingHand ───
 * Mô hình 3D bàn tay áo Blouse nhà khoa học chân thực đang cầm nắm bình hóa chất:
 * - Ống tay áo blouse trắng tiêu chuẩn phòng thí nghiệm với viền xanh cyan
 * - Cổ tay và lòng bàn tay giải phẫu mềm mại
 * - Ngón cái đối xứng kẹp chặt thân bình phía trước
 * - 4 ngón tay (trỏ, giữa, áp út, út) ôm quanh thân bình với các đốt ngón tay tự nhiên
 * - Gắn trực tiếp vào tâm cầm của bình (xoay và di chuyển đồng bộ 100% khi nghiêng / rót)
 */

import React, { useMemo } from "react";
import * as THREE from "three";

interface Lab3DHoldingHandProps {
    visible?: boolean;
    scale?: number;
}

export default function Lab3DHoldingHand({
    visible = true,
    scale = 1.0,
}: Lab3DHoldingHandProps) {
    // Vật liệu da người ấm áp & vải áo blouse phòng thí nghiệm
    const materials = useMemo(() => {
        return {
            skin: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f1c2b0"), // Màu da tự nhiên
                roughness: 0.44,
                metalness: 0.02,
            }),
            skinPalm: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f5ccbe"),
                roughness: 0.48,
                metalness: 0.02,
            }),
            fingernail: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#fbcfe8"),
                roughness: 0.28,
                metalness: 0.05,
            }),
            labCoatSleeve: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f8fafc"), // Áo blouse trắng
                roughness: 0.72,
                metalness: 0.04,
            }),
            labCoatCuff: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0284c7"), // Viền cổ tay áo xanh cyan
                roughness: 0.38,
                metalness: 0.15,
            }),
            gripGlow: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#38bdf8"),
                transparent: true,
                opacity: 0.25,
            }),
        };
    }, []);

    if (!visible) return null;

    return (
        <group scale={[scale, scale, scale]}>
            {/* ── 1. ỐNG TAY ÁO BLOUSE TRẮNG (Lab Coat Sleeve) ── */}
            <group position={[0.18, -0.06, 0.12]} rotation={[0.22, 0.42, -0.58]}>
                {/* Ống tay áo blouse chính */}
                <mesh position={[0, -0.08, 0]}>
                    <cylinderGeometry args={[0.046, 0.056, 0.18, 24]} />
                    <primitive object={materials.labCoatSleeve} attach="material" />
                </mesh>

                {/* Viền cổ tay áo blouse màu xanh phòng thí nghiệm */}
                <mesh position={[0, 0.012, 0]}>
                    <cylinderGeometry args={[0.047, 0.047, 0.016, 24]} />
                    <primitive object={materials.labCoatCuff} attach="material" />
                </mesh>
            </group>

            {/* ── 2. CỔ TAY (Wrist Joint) ── */}
            <mesh position={[0.10, -0.025, 0.065]} rotation={[0.22, 0.42, -0.58]}>
                <cylinderGeometry args={[0.034, 0.038, 0.065, 18]} />
                <primitive object={materials.skin} attach="material" />
            </mesh>

            {/* ── 3. LÒNG BÀN TAY (Palm) ── */}
            {/* Ôm sát mạn phải thân bình thủy tinh */}
            <mesh position={[0.054, -0.005, 0.012]} rotation={[0.08, 0.32, -0.15]}>
                <boxGeometry args={[0.032, 0.076, 0.062]} />
                <primitive object={materials.skinPalm} attach="material" />
            </mesh>

            {/* ── 4. NGÓN CÁI (Thumb) - Kẹp chắc ở phía trước thân bình ── */}
            <group position={[0.036, 0.016, 0.038]} rotation={[-0.2, 0.65, 0.45]}>
                {/* Đốt gốc ngón cái */}
                <mesh position={[0, 0.018, 0]}>
                    <capsuleGeometry args={[0.0125, 0.032, 8, 16]} />
                    <primitive object={materials.skin} attach="material" />
                </mesh>
                {/* Đốt đầu ngón cái ôm cong vào mặt trước chai */}
                <mesh position={[-0.016, 0.034, -0.012]} rotation={[0.3, -0.4, 0.2]}>
                    <capsuleGeometry args={[0.011, 0.025, 8, 16]} />
                    <primitive object={materials.skin} attach="material" />
                </mesh>
                {/* Móng tay ngón cái */}
                <mesh position={[-0.019, 0.045, -0.008]} rotation={[0.3, -0.4, 0.2]}>
                    <boxGeometry args={[0.006, 0.008, 0.002]} />
                    <primitive object={materials.fingernail} attach="material" />
                </mesh>
            </group>

            {/* ── 5. BỐN NGÓN TAY (Fingers) - Ôm vòng quanh thân chai từ sau ra hông ── */}
            {/* Ngón trỏ (Index Finger) */}
            <group position={[0.038, 0.026, -0.024]} rotation={[0.2, -0.55, 0.15]}>
                <mesh position={[-0.022, 0, -0.015]} rotation={[0, 0.6, 0]}>
                    <capsuleGeometry args={[0.0105, 0.034, 8, 16]} />
                    <primitive object={materials.skin} attach="material" />
                </mesh>
                <mesh position={[-0.044, 0, -0.006]} rotation={[0, 1.2, 0]}>
                    <capsuleGeometry args={[0.0095, 0.024, 8, 16]} />
                    <primitive object={materials.skin} attach="material" />
                </mesh>
                <mesh position={[-0.052, 0, -0.002]}>
                    <boxGeometry args={[0.006, 0.006, 0.002]} />
                    <primitive object={materials.fingernail} attach="material" />
                </mesh>
            </group>

            {/* Ngón giữa (Middle Finger) */}
            <group position={[0.040, 0.008, -0.022]} rotation={[0.1, -0.55, 0.1]}>
                <mesh position={[-0.024, 0, -0.015]} rotation={[0, 0.6, 0]}>
                    <capsuleGeometry args={[0.011, 0.036, 8, 16]} />
                    <primitive object={materials.skin} attach="material" />
                </mesh>
                <mesh position={[-0.047, 0, -0.006]} rotation={[0, 1.2, 0]}>
                    <capsuleGeometry args={[0.010, 0.026, 8, 16]} />
                    <primitive object={materials.skin} attach="material" />
                </mesh>
                <mesh position={[-0.056, 0, -0.002]}>
                    <boxGeometry args={[0.006, 0.007, 0.002]} />
                    <primitive object={materials.fingernail} attach="material" />
                </mesh>
            </group>

            {/* Ngón áp út (Ring Finger) */}
            <group position={[0.038, -0.010, -0.018]} rotation={[0.0, -0.55, 0.05]}>
                <mesh position={[-0.023, 0, -0.014]} rotation={[0, 0.6, 0]}>
                    <capsuleGeometry args={[0.010, 0.032, 8, 16]} />
                    <primitive object={materials.skin} attach="material" />
                </mesh>
                <mesh position={[-0.045, 0, -0.005]} rotation={[0, 1.2, 0]}>
                    <capsuleGeometry args={[0.009, 0.022, 8, 16]} />
                    <primitive object={materials.skin} attach="material" />
                </mesh>
                <mesh position={[-0.052, 0, -0.002]}>
                    <boxGeometry args={[0.005, 0.006, 0.002]} />
                    <primitive object={materials.fingernail} attach="material" />
                </mesh>
            </group>

            {/* Ngón út (Pinky Finger) */}
            <group position={[0.034, -0.026, -0.014]} rotation={[-0.1, -0.55, 0.0]}>
                <mesh position={[-0.020, 0, -0.012]} rotation={[0, 0.6, 0]}>
                    <capsuleGeometry args={[0.009, 0.026, 8, 16]} />
                    <primitive object={materials.skin} attach="material" />
                </mesh>
                <mesh position={[-0.038, 0, -0.004]} rotation={[0, 1.2, 0]}>
                    <capsuleGeometry args={[0.008, 0.018, 8, 16]} />
                    <primitive object={materials.skin} attach="material" />
                </mesh>
                <mesh position={[-0.044, 0, -0.001]}>
                    <boxGeometry args={[0.005, 0.005, 0.002]} />
                    <primitive object={materials.fingernail} attach="material" />
                </mesh>
            </group>

            {/* Vòng hào quang tiếp xúc cầm nắm (Chỉ hiệu ứng nhẹ báo hiệu đang giữ chắc) */}
            <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.058, 0.058, 0.08, 24]} />
                <primitive object={materials.gripGlow} attach="material" />
            </mesh>
        </group>
    );
}
