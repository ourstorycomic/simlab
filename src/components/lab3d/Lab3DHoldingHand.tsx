"use client";

/**
 * ─── Lab3DHoldingHand ───
 * Mô hình 3D bàn tay áo Blouse và găng tay phòng thí nghiệm (Nitrile Lab Glove):
 * - Găng tay bảo hộ phòng thí nghiệm tiêu chuẩn chuẩn quốc tế (Nitrile Cyan / Blue chuyên dụng)
 * - Giải phẫu bàn tay học sinh/nhà khoa học tự nhiên, cầm chặt thân bình hóa chất
 * - Ngón cái ôm mặt trước, 4 ngón tay (trỏ, giữa, áp út, út) ôm vòng quanh thân bình
 * - CƠ CHẾ CHỐNG TẬT / GÃY TAY (Counter-Rotation):
 *   Khi dốc bình nghiêng/rót (tiltAngle, pitchAngle), cổ tay tự động gập uốn tự nhiên
 *   và cẳng tay (forearm + áo blouse) luôn giữ hướng cắm xuống phía dưới-phải màn hình
 *   (vị trí người đứng trước bàn), KHÔNG BAO GIỜ bị vểnh ngược lên trời!
 */

import React, { useMemo } from "react";
import * as THREE from "three";

interface Lab3DHoldingHandProps {
    visible?: boolean;
    scale?: number;
    tiltAngle?: number;
    pitchAngle?: number;
    variant?: "nitrile-cyan" | "latex-white";
}

export default function Lab3DHoldingHand({
    visible = true,
    scale = 1.0,
    tiltAngle = 0,
    pitchAngle = 0,
    variant = "nitrile-cyan",
}: Lab3DHoldingHandProps) {
    // Vật liệu găng tay Nitrile & vải áo blouse phòng thí nghiệm chuẩn y tế/hóa học
    const materials = useMemo(() => {
        const isCyan = variant === "nitrile-cyan";
        return {
            glove: new THREE.MeshStandardMaterial({
                color: new THREE.Color(isCyan ? "#0284c7" : "#f1f5f9"), // Xanh Nitrile phòng lab hoặc trắng Latex
                roughness: 0.38,
                metalness: 0.08,
            }),
            glovePalm: new THREE.MeshStandardMaterial({
                color: new THREE.Color(isCyan ? "#0369a1" : "#e2e8f0"),
                roughness: 0.44,
                metalness: 0.05,
            }),
            gloveCuff: new THREE.MeshStandardMaterial({
                color: new THREE.Color(isCyan ? "#075985" : "#cbd5e1"),
                roughness: 0.32,
                metalness: 0.12,
            }),
            labCoatSleeve: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f8fafc"), // Vải áo blouse trắng
                roughness: 0.76,
                metalness: 0.02,
            }),
            labCoatCuffTrim: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0284c7"), // Viền cổ tay áo blouse xanh cyan
                roughness: 0.40,
                metalness: 0.10,
            }),
            sleeveInterior: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0f172a"), // Mặt trong tối của ống tay áo
                roughness: 0.90,
            }),
            gripAura: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#38bdf8"),
                transparent: true,
                opacity: 0.22,
            }),
        };
    }, [variant]);

    if (!visible) return null;

    // Hệ số chống xoay ngược: Forearm uốn ngược lại 82% góc nghiêng của bình
    // Giúp cẳng tay luôn hướng xuống phía bàn học và học sinh, không bị chúc ngược lên trần
    const counterTilt = -tiltAngle * 0.82;
    const counterPitch = -pitchAngle * 0.82;

    return (
        <group scale={[scale, scale, scale]}>
            {/* ── A. NHÓM BÀN TAY & CÁC NGÓN (Ôm chặt và xoay cùng thân bình) ── */}
            <group position={[0, 0, 0]}>
                {/* 1. Lòng bàn tay & Mu bàn tay (Palmar & Dorsal Arch) */}
                <group position={[0.046, -0.005, 0.015]} rotation={[0.05, 0.35, -0.12]}>
                    {/* Khối chính bàn tay (Metacarpus) */}
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[0.024, 0.068, 0.052]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>

                    {/* Gò mô cái (Thenar eminence - cơ gốc ngón cái) */}
                    <mesh position={[-0.004, 0.016, 0.018]} rotation={[0.2, 0.4, 0]}>
                        <sphereGeometry args={[0.017, 16, 16]} />
                        <primitive object={materials.glovePalm} attach="material" />
                    </mesh>

                    {/* Gò mô út (Hypothenar eminence) */}
                    <mesh position={[0.003, -0.022, 0.014]}>
                        <sphereGeometry args={[0.014, 14, 14]} />
                        <primitive object={materials.glovePalm} attach="material" />
                    </mesh>

                    {/* Khớp các đốt bàn tay (Knuckle pads) */}
                    <mesh position={[-0.010, 0.002, -0.018]}>
                        <cylinderGeometry args={[0.007, 0.007, 0.062, 12]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                </group>

                {/* 2. NGÓN CÁI (Thumb) - Ôm vững mặt trước thân bình thủy tinh */}
                <group position={[0.038, 0.014, 0.036]} rotation={[-0.22, 0.55, 0.38]}>
                    {/* Đốt gốc ngón cái (Proximal Phalanx) */}
                    <mesh position={[-0.014, 0.012, 0.004]} rotation={[0.1, -0.3, 0.3]}>
                        <capsuleGeometry args={[0.0105, 0.026, 8, 16]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                    {/* Đốt đầu & Đầu ngón cái áp sát mặt kính trước */}
                    <mesh position={[-0.032, 0.022, -0.002]} rotation={[0.2, -0.7, 0.4]}>
                        <capsuleGeometry args={[0.0095, 0.022, 8, 16]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                </group>

                {/* 3. BỐN NGÓN TAY ÔM QUANH THÂN BÌNH (Curved Finger Phalanges) */}
                {/* ── Ngón trỏ (Index Finger - Đốt trên cùng) ── */}
                <group position={[0.036, 0.024, -0.018]} rotation={[0.15, -0.45, 0.12]}>
                    {/* Đốt 1 (Proximal) */}
                    <mesh position={[-0.018, 0, -0.016]} rotation={[0, 0.65, 0]}>
                        <capsuleGeometry args={[0.0095, 0.028, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                    {/* Đốt 2 & 3 (Intermediate & Distal ôm cong quanh bán kính bình) */}
                    <mesh position={[-0.040, 0, -0.024]} rotation={[0, 1.45, 0]}>
                        <capsuleGeometry args={[0.0085, 0.026, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                    <mesh position={[-0.055, 0, -0.016]} rotation={[0, 2.1, 0]}>
                        <capsuleGeometry args={[0.0075, 0.018, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                </group>

                {/* ── Ngón giữa (Middle Finger - Dài nhất, giữ chắc eo bình) ── */}
                <group position={[0.038, 0.007, -0.017]} rotation={[0.08, -0.45, 0.08]}>
                    <mesh position={[-0.020, 0, -0.017]} rotation={[0, 0.65, 0]}>
                        <capsuleGeometry args={[0.010, 0.030, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                    <mesh position={[-0.044, 0, -0.026]} rotation={[0, 1.45, 0]}>
                        <capsuleGeometry args={[0.009, 0.028, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                    <mesh position={[-0.060, 0, -0.017]} rotation={[0, 2.1, 0]}>
                        <capsuleGeometry args={[0.008, 0.020, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                </group>

                {/* ── Ngón áp út (Ring Finger) ── */}
                <group position={[0.036, -0.010, -0.015]} rotation={[0.0, -0.45, 0.04]}>
                    <mesh position={[-0.019, 0, -0.016]} rotation={[0, 0.65, 0]}>
                        <capsuleGeometry args={[0.0095, 0.027, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                    <mesh position={[-0.042, 0, -0.024]} rotation={[0, 1.45, 0]}>
                        <capsuleGeometry args={[0.0085, 0.025, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                    <mesh position={[-0.057, 0, -0.016]} rotation={[0, 2.1, 0]}>
                        <capsuleGeometry args={[0.0075, 0.018, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                </group>

                {/* ── Ngón út (Pinky Finger) ── */}
                <group position={[0.033, -0.026, -0.012]} rotation={[-0.08, -0.45, 0.0]}>
                    <mesh position={[-0.017, 0, -0.014]} rotation={[0, 0.65, 0]}>
                        <capsuleGeometry args={[0.0085, 0.023, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                    <mesh position={[-0.036, 0, -0.021]} rotation={[0, 1.45, 0]}>
                        <capsuleGeometry args={[0.0075, 0.021, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                    <mesh position={[-0.048, 0, -0.014]} rotation={[0, 2.1, 0]}>
                        <capsuleGeometry args={[0.0065, 0.015, 8, 14]} />
                        <primitive object={materials.glove} attach="material" />
                    </mesh>
                </group>

                {/* Khớp cổ tay linh hoạt (Carpal Wrist Joint) kết nối giữa bàn tay và cẳng tay */}
                <mesh position={[0.068, -0.012, 0.028]} rotation={[0.1, 0.35, -0.2]}>
                    <capsuleGeometry args={[0.026, 0.035, 12, 16]} />
                    <primitive object={materials.glove} attach="material" />
                </mesh>

                {/* Vòng viền co giãn của găng tay (Glove Rolled Cuff) */}
                <mesh position={[0.088, -0.022, 0.042]} rotation={[0.3, 0.5, -0.4]}>
                    <torusGeometry args={[0.029, 0.004, 12, 24]} />
                    <primitive object={materials.gloveCuff} attach="material" />
                </mesh>

                {/* Chỉ báo hào quang nhẹ báo hiệu tay đang nắm chắc bình */}
                <mesh position={[0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.052, 0.052, 0.075, 20]} />
                    <primitive object={materials.gripAura} attach="material" />
                </mesh>
            </group>

            {/* ── B. CẲNG TAY & ÁO BLOUSE PHÒNG LAB (Có Counter-Rotation chống vểnh ngược) ── */}
            {/* Điểm tựa cổ tay: [0.088, -0.022, 0.042] */}
            <group
                position={[0.088, -0.022, 0.042]}
                rotation={[counterPitch, 0, counterTilt]}
            >
                {/* Nhóm ống tay áo hướng tự nhiên từ dưới bàn lên (Vector: +X, -Y, +Z) */}
                <group rotation={[0.42, 0.45, -0.68]}>
                    {/* Viền cổ tay áo blouse màu xanh phòng thí nghiệm */}
                    <mesh position={[0, -0.018, 0]}>
                        <cylinderGeometry args={[0.042, 0.044, 0.020, 24]} />
                        <primitive object={materials.labCoatCuffTrim} attach="material" />
                    </mesh>

                    {/* Đoạn ống tay áo blouse trắng vươn dài tự nhiên xuống phía dưới-phải màn hình */}
                    <mesh position={[0, -0.18, 0]}>
                        <cylinderGeometry args={[0.044, 0.068, 0.32, 28]} />
                        <primitive object={materials.labCoatSleeve} attach="material" />
                    </mesh>

                    {/* Nếp gấp vải tự nhiên quanh cổ tay */}
                    <mesh position={[0, -0.042, 0]}>
                        <torusGeometry args={[0.044, 0.0035, 8, 24]} />
                        <primitive object={materials.labCoatSleeve} attach="material" />
                    </mesh>
                    <mesh position={[0, -0.070, 0]}>
                        <torusGeometry args={[0.047, 0.0038, 8, 24]} />
                        <primitive object={materials.labCoatSleeve} attach="material" />
                    </mesh>

                    {/* Nắp đáy trong ống tay để không bao giờ thấy lỗ hổng rỗng */}
                    <mesh position={[0, -0.33, 0]}>
                        <cylinderGeometry args={[0.065, 0.065, 0.015, 24]} />
                        <primitive object={materials.sleeveInterior} attach="material" />
                    </mesh>
                </group>
            </group>
        </group>
    );
}
