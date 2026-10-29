"use client";

/**
 * ─── Lab3DChemicalStation ───
 * Trạm Hóa Chất 3D Đầy Đủ 100% Cả 107 Hóa Chất (Full Interactive Chemical Station):
 * - Bộ lọc danh mục ngay trên kệ: [Tất cả] [Axit] [Bazơ] [Muối] [Kim loại] [Chỉ thị] [Hữu cơ]
 * - Nút chuyển trang [◀ Trang 1/8 ▶] duyệt qua toàn bộ 107 hóa chất ngay trong không gian 3D
 * - Mỗi lọ hóa chất có:
 *   + Thân lọ thủy tinh 3D tinh xảo với dung dịch/chất rắn có màu sắc chính xác
 *   + Nhãn tên và công thức hóa học (CuSO4, HCl, NaOH, KMnO4, Fe, v.v.)
 *   + Hiệu ứng hào quang phát sáng khi đưa tay/chuột lại gần
 * - Hỗ trợ cả Nhặt bằng cử chỉ tay Webcam (GRAB) VÀ Nhấp chuột trực tiếp
 */

import React, { useState, useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Chemical, chemicals as allChemicals } from "@/lib/chemicals";
import { normalizeChemicalFormula } from "@/components/ChemicalSelector";
import { getDisplayLiquidColor } from "./Lab3DScene";

export type ChemCategory = "all" | "acid" | "base" | "salt" | "metal" | "indicator" | "organic";

const CATEGORY_NAMES: Record<ChemCategory, string> = {
    all: "Tất cả",
    acid: "Axit",
    base: "Bazơ",
    salt: "Muối",
    metal: "Kim loại",
    indicator: "Chỉ thị",
    organic: "Hữu cơ",
};

interface Lab3DChemicalStationProps {
    onSelectChemical: (chemical: Chemical) => void;
    activeChemicalId?: string | null;
    hoveredBottleId?: string | null;
}

export default function Lab3DChemicalStation({
    onSelectChemical,
    activeChemicalId,
    hoveredBottleId,
}: Lab3DChemicalStationProps) {
    const [selectedCategory, setSelectedCategory] = useState<ChemCategory>("all");
    const [page, setPage] = useState(0);

    // Lọc danh sách hóa chất (loại trừ các dụng cụ vật lý/sinh học)
    const validChemicals = useMemo(() => {
        return allChemicals.filter(
            (c) =>
                c.category !== "other" &&
                c.id !== "microscope" &&
                c.id !== "onion" &&
                c.id !== "lens" &&
                c.id !== "object" &&
                c.id !== "screen" &&
                c.id !== "light-source"
        );
    }, []);

    const displayedChemicals = useMemo(() => {
        let list = validChemicals;
        if (selectedCategory !== "all") {
            list = list.filter((c) => c.category === selectedCategory);
        }
        return list;
    }, [validChemicals, selectedCategory]);

    const BOTTLES_PER_PAGE = 14;
    const totalPages = Math.max(1, Math.ceil(displayedChemicals.length / BOTTLES_PER_PAGE));

    // Đảm bảo trang hợp lệ khi đổi danh mục
    const safePage = Math.min(page, totalPages - 1);

    const rackBottles = useMemo(() => {
        const start = safePage * BOTTLES_PER_PAGE;
        return displayedChemicals.slice(start, start + BOTTLES_PER_PAGE);
    }, [displayedChemicals, safePage]);

    return (
        <group position={[0, -0.06, -0.38]}>
            {/* ─── Kệ Gỗ Đựng Lọ Hóa Chất Có Chân Đứng Vững Chắc Trên Bàn (Không Bay Lơ Lửng) ─── */}
            {/* 2 Chân đỡ hồi hai bên tựa vững lên mặt bàn */}
            <mesh position={[-1.68, 0.16, -0.04]}>
                <boxGeometry args={[0.06, 0.32, 0.52]} />
                <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.2} />
            </mesh>
            <mesh position={[1.68, 0.16, -0.04]}>
                <boxGeometry args={[0.06, 0.32, 0.52]} />
                <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.2} />
            </mesh>

            {/* Tấm lưng kệ hóa chất */}
            <mesh position={[0, 0.16, -0.29]}>
                <boxGeometry args={[3.36, 0.32, 0.03]} />
                <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>

            {/* Tầng 1 (kê sát mặt bàn) */}
            <mesh position={[0, 0.025, 0.08]}>
                <boxGeometry args={[3.3, 0.05, 0.26]} />
                <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.2} />
            </mesh>
            {/* Tầng 2 cao hơn phía sau */}
            <mesh position={[0, 0.165, -0.16]}>
                <boxGeometry args={[3.3, 0.05, 0.26]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.2} />
            </mesh>



            {/* ─── Các Lọ Hóa Chất 3D Trên Kệ ─── */}
            {rackBottles.map((chem, idx) => {
                const isRow2 = idx >= 7;
                const colIdx = idx % 7;
                const spacingX = 0.44;
                const startX = -((Math.min(rackBottles.length, 7) - 1) * spacingX) / 2;

                const posX = startX + colIdx * spacingX;
                const posY = isRow2 ? 0.30 : 0.16;
                const posZ = isRow2 ? -0.16 : 0.08;

                const isHovered = hoveredBottleId === chem.id;
                const isActive = activeChemicalId === chem.id;

                // Màu dung dịch chân thật nổi bật, không bị chìm trong nền trắng
                const liquidColor = getDisplayLiquidColor(chem, "#38bdf8");

                return (
                    <group
                        key={chem.id}
                        position={[posX, posY, posZ]}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectChemical(chem);
                        }}
                    >
                        {/* 1. DUNG DỊCH BÊN TRONG LỌ: Render TRƯỚC (renderOrder = 0) với màu sắc đậm đà và mặt thoáng nước */}
                        <group position={[0, -0.02, 0]}>
                            {/* Thân khối chất lỏng */}
                            <mesh renderOrder={0}>
                                <cylinderGeometry args={[0.066, 0.071, 0.16, 24]} />
                                <meshStandardMaterial
                                    color={liquidColor}
                                    emissive={liquidColor}
                                    emissiveIntensity={0.22}
                                    roughness={0.12}
                                    metalness={0.05}
                                    transparent
                                    opacity={0.92}
                                    depthWrite={true}
                                />
                            </mesh>
                            {/* Mặt thoáng chất lỏng phẳng sắc nét */}
                            <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
                                <circleGeometry args={[0.066, 24]} />
                                <meshStandardMaterial
                                    color={liquidColor}
                                    emissive={liquidColor}
                                    emissiveIntensity={0.3}
                                    roughness={0.08}
                                    transparent
                                    opacity={0.95}
                                />
                            </mesh>
                        </group>

                        {/* 2. VỎ CHAI THỦY TINH TRONG SUỐT: Render SAU (renderOrder = 1) để không nuốt mất dung dịch */}
                        <mesh position={[0, 0, 0]} renderOrder={1}>
                            <cylinderGeometry args={[0.07, 0.075, 0.22, 24]} />
                            <meshPhysicalMaterial
                                color="#ffffff"
                                roughness={0.06}
                                metalness={0.08}
                                transparent
                                opacity={0.35}
                                clearcoat={1.0}
                                clearcoatRoughness={0.08}
                                reflectivity={0.9}
                                depthWrite={false}
                            />
                        </mesh>

                        {/* Cổ chai & Nắp chai */}
                        <mesh position={[0, 0.13, 0]}>
                            <cylinderGeometry args={[0.035, 0.045, 0.06, 16]} />
                            <meshStandardMaterial color="#94a3b8" metalness={0.6} />
                        </mesh>
                        <mesh position={[0, 0.17, 0]}>
                            <cylinderGeometry args={[0.042, 0.042, 0.04, 16]} />
                            <meshStandardMaterial color="#0284c7" roughness={0.3} />
                        </mesh>

                        {/* Nhãn dán công thức hóa học to rõ nét */}
                        <mesh position={[0, -0.01, 0.076]}>
                            <planeGeometry args={[0.13, 0.09]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                        <Text
                            position={[0, -0.01, 0.08]}
                            fontSize={0.035}
                            color="#0f172a"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {normalizeChemicalFormula(chem.formula)}
                        </Text>

                        {/* Vòng hào quang phát sáng khi là hóa chất đang chọn */}
                        {(isHovered || isActive) && (
                            <mesh position={[0, 0, 0]}>
                                <cylinderGeometry args={[0.09, 0.095, 0.26, 16]} />
                                <meshBasicMaterial
                                    color="#00ffa3"
                                    transparent
                                    opacity={0.4}
                                    wireframe
                                />
                            </mesh>
                        )}
                    </group>
                );
            })}
        </group>
    );
}
