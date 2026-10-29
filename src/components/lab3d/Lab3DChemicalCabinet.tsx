"use client";

/**
 * ─── Lab3DChemicalCabinet ───
 * Tủ Kính Lưu Trữ Hóa Chất Phòng Thí Nghiệm Đẳng Cấp & Chân Thật (Interactive Smart Cabinet):
 * - Tủ kính 2 cánh mở ra/đóng vào cực êm ái khi dùng tay ấn hoặc click chuột
 * - Hệ thống đèn LED hắt sáng bên trong tủ làm nổi bật 107 lọ hóa chất tinh xảo
 * - Bộ lọc danh mục ngay trên nóc tủ: [Tất cả] [Axit] [Bazơ] [Muối] [Kim loại] [Chỉ thị] [Hữu cơ]
 * - Lấy hóa chất: Chạm tay hoặc click lọ bất kỳ để lấy ra bàn thí nghiệm thao tác
 * - Giữ bàn thí nghiệm gọn gàng, rộng rãi, dễ dàng cầm nắm không lo vướng víu!
 */

import React, { useState, useEffect, useMemo, useRef, MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Chemical, chemicals as allChemicals } from "@/lib/chemicals";
import { normalizeChemicalFormula } from "@/components/ChemicalSelector";
import { getDisplayLiquidColor } from "./Lab3DScene";
import { playLabSound } from "./ChemistryRealisticModels";
import { HandState } from "@/lib/handTracking";
import { getReaction } from "@/lib/reactions";

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

interface Lab3DChemicalCabinetProps {
    onSelectChemical: (chemical: Chemical) => void;
    activeChemicalId?: string | null;
    isCabinetOpen?: boolean;
    onToggleCabinet?: () => void;
    handStateRef?: MutableRefObject<HandState>;
    onOpenCabinetGui?: () => void;
    isCabinetModalOpen?: boolean;
    refChemical?: Chemical | null;
}

export default function Lab3DChemicalCabinet({
    onSelectChemical,
    activeChemicalId,
    isCabinetOpen = true,
    onToggleCabinet,
    handStateRef,
    onOpenCabinetGui,
    isCabinetModalOpen = false,
    refChemical,
}: Lab3DChemicalCabinetProps) {
    const [selectedCategory, setSelectedCategory] = useState<ChemCategory>("all");
    const [page, setPage] = useState(0);
    const [internalOpen, setInternalOpen] = useState(isCabinetOpen);
    const [hoveredChemId, setHoveredChemId] = useState<string | null>(null);
    const [isHandNearCabinet, setIsHandNearCabinet] = useState(false);
    const lastToggleTimeRef = useRef<number>(0);
    const lastBottleSelectRef = useRef<number>(0);
    const pinkyWasActiveRef = useRef<boolean>(false);
    const pointingSignStartTimeRef = useRef<number | null>(null);


    // Đồng bộ trạng thái mở/đóng tủ
    const isOpen = onToggleCabinet ? isCabinetOpen : internalOpen;
    const toggleCabinet = () => {
        const now = performance.now();
        // Chống spam tuyệt đối: Bỏ qua nếu các lượt click cách nhau dưới 650ms
        if (now - lastToggleTimeRef.current < 650) {
            return;
        }
        lastToggleTimeRef.current = now;
        playLabSound("pick");
        if (onToggleCabinet) {
            onToggleCabinet();
        } else {
            setInternalOpen((v) => !v);
        }
    };

    // Ref cho 2 cánh cửa kính mở xoay êm ái
    const leftDoorPivotRef = useRef<THREE.Group>(null);
    const rightDoorPivotRef = useRef<THREE.Group>(null);
    const currentAngle = useRef({ left: 0, right: 0 });

    useFrame((_, delta) => {
        const targetLeft = isOpen ? -Math.PI * 0.65 : 0; // Mở ra -117 độ
        const targetRight = isOpen ? Math.PI * 0.65 : 0; // Mở ra +117 độ

        currentAngle.current.left = THREE.MathUtils.lerp(currentAngle.current.left, targetLeft, delta * 7);
        currentAngle.current.right = THREE.MathUtils.lerp(currentAngle.current.right, targetRight, delta * 7);

        if (leftDoorPivotRef.current) {
            leftDoorPivotRef.current.rotation.y = currentAngle.current.left;
        }
        if (rightDoorPivotRef.current) {
            rightDoorPivotRef.current.rotation.y = currentAngle.current.right;
        }

        // KHI GIAO DIỆN GUI MODAL VR ĐANG MỞ: Dành trọn 100% cử chỉ tay cho màn hình ảo!
        // Mute hoàn toàn cử chỉ ở tủ 3D phía sau để không bao giờ bị kích hoạt nhầm lấy chất ở tủ 3D!
        if (isCabinetModalOpen) return;

        // Tương tác bàn tay (Hand Tracking) với tủ hóa chất 3D & Biển hiệu mở Modal 107 chất
        if (handStateRef?.current) {
            const hs = handStateRef.current;
            const hand = hs.rightHand?.detected ? hs.rightHand : hs.leftHand?.detected ? hs.leftHand : hs.detected ? hs : null;
            if (hand && hand.palmPos) {
                const now = performance.now();
                const [hx, hy] = hand.palmPos;

                // 1. DƠ NGÓN ÚT (PINKY UP): MỞ TỦ HÓA CHẤT NGAY LẬP TỨC (Bất kể vị trí tay)
                const isPinkyOnly = Boolean(hand.isPinkyExtended && !hand.isMiddleExtended && !hand.isIndexExtended);
                if (isPinkyOnly && !pinkyWasActiveRef.current && now - lastToggleTimeRef.current > 500) {
                    lastToggleTimeRef.current = now;
                    pinkyWasActiveRef.current = true;
                    playLabSound("pick");
                    if (onOpenCabinetGui) {
                        onOpenCabinetGui();
                    } else {
                        toggleCabinet();
                    }
                    return;
                } else if (!isPinkyOnly) {
                    pinkyWasActiveRef.current = false;
                }

                // 2. Nhận diện bàn tay đưa lên khu vực Tủ Hóa Chất (Bên trái: X < -0.38 VÀ Nhấc cao: Y >= 0.26)
                const isNear = ((hand.cursorX !== undefined && hand.cursorX < -0.38) || hx < -0.38) &&
                               ((hand.cursorY !== undefined && hand.cursorY >= 0.22) || hy >= 0.26);

                if (isHandNearCabinet !== isNear) {
                    setIsHandNearCabinet(isNear);
                }

                if (isNear) {
                    // A. Khi giơ tay cao lên biển hiệu trên nóc tủ (hy >= 0.44 hoặc cursorY >= 0.38) HOẶC khi tủ chưa mở:
                    // Dơ ngón út (🤙) hoặc giữ ngón trỏ chỉ biển hiệu > 1000ms sẽ MỞ TỦ (Modal GUI 107 chất)!
                    const isAimingSign = hy >= 0.44 || (hand.cursorY !== undefined && hand.cursorY >= 0.38) || !isOpen;

                    if (isAimingSign) {
                        if (pointingSignStartTimeRef.current === null) {
                            pointingSignStartTimeRef.current = now;
                        }
                        const dwellTime = now - pointingSignStartTimeRef.current;
                        // Mở khi Dơ ngón út hoặc giữ ngón trỏ chỉ biển hiệu > 1000ms
                        if ((hand.isPinkyExtended || dwellTime > 1000) && now - lastToggleTimeRef.current > 1000) {
                            lastToggleTimeRef.current = now;
                            pointingSignStartTimeRef.current = null;
                            playLabSound("pick");
                            if (onOpenCabinetGui) {
                                onOpenCabinetGui();
                            } else {
                                toggleCabinet();
                            }
                            return;
                        }
                    } else {
                        pointingSignStartTimeRef.current = null;
                    }

                    // B. Khi giơ ngón trỏ (☝️) vào các kệ hóa chất 3D (hy trong khoảng 0.26 -> 0.46):
                    // Ngón trỏ ngắm & chọn lọ hóa chất trên kệ để lấy ra bàn! Nắm tay (Fist) tuyệt đối không lấy!
                    if (isOpen && hy < 0.46) {
                        const localX = hx + 1.35;
                        const localY = hy - 0.44;

                        let detectedBottle: string | null = null;
                        let detectedChem: Chemical | null = null;
                        let minBottleDist = 0.22;

                        cabinetBottles.forEach((chem, idx) => {
                            const isTopRow = idx < 6;
                            const colIdx = idx % 6;
                            const spacingX = 0.26;
                            const startX = -((Math.min(cabinetBottles.length, 6) - 1) * spacingX) / 2;
                            const bx = startX + colIdx * spacingX;
                            const by = isTopRow ? 0.25 : -0.05;

                            const d = Math.hypot(localX - bx, localY - by);
                            if (d < minBottleDist) {
                                minBottleDist = d;
                                detectedBottle = chem.id;
                                detectedChem = chem;
                            }
                        });

                        if (hoveredChemId !== detectedBottle) {
                            setHoveredChemId(detectedBottle);
                        }

                        // CHỈ CHỌN KHI GIƠ NGÓN GIỮA (🖕) HOẶC CHỤM NGÓN
                        const isMiddleSelect = Boolean(hand.isMiddleExtended);
                        if (detectedChem && isMiddleSelect && now - lastBottleSelectRef.current > 1000) {
                            lastBottleSelectRef.current = now;
                            playLabSound("pick");
                            onSelectChemical(detectedChem);
                        }
                    } else if (hoveredChemId) {
                        setHoveredChemId(null);
                    }
                } else {
                    pointingSignStartTimeRef.current = null;
                    if (hoveredChemId) setHoveredChemId(null);
                }
            }
        }
    });

    // Lọc danh sách 107 hóa chất
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

    const BOTTLES_PER_PAGE = 12; // 2 hàng x 6 lọ
    const totalPages = Math.max(1, Math.ceil(displayedChemicals.length / BOTTLES_PER_PAGE));
    const safePage = Math.min(page, totalPages - 1);

    const cabinetBottles = useMemo(() => {
        const start = safePage * BOTTLES_PER_PAGE;
        return displayedChemicals.slice(start, start + BOTTLES_PER_PAGE);
    }, [displayedChemicals, safePage]);

    return (
        <group
            position={[-1.35, 0.44, -0.42]}
        >
            {/* Lớp cảm ứng Click mở tủ: CHỈ KÍCH HOẠT KHI TỦ ĐANG ĐÓNG!
                Khi tủ đang MỞ, tuyệt đối không được chặn raycast hay tự động đóng cánh cửa! */}
            {!isOpen && (
                <mesh
                    position={[0, 0.08, 0.08]}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenCabinetGui) onOpenCabinetGui();
                        else if (onToggleCabinet) onToggleCabinet();
                        else setInternalOpen(true);
                    }}
                    onPointerOver={() => { document.body.style.cursor = "pointer"; }}
                    onPointerOut={() => { document.body.style.cursor = "default"; }}
                >
                    <boxGeometry args={[1.85, 1.25, 0.12]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
            )}

            {/* ─── 1. KHUNG TỦ KÍNH CHUYÊN NGHIỆP RỖNG BÊN TRONG ─── */}
            {/* Tấm lưng tủ (Backboard) mỏng nằm ở tận cùng phía sau (Z = -0.35), KHÔNG làm khối đặc để lộ các kệ & lọ */}
            <mesh position={[0, 0, -0.35]} receiveShadow>
                <boxGeometry args={[1.72, 0.88, 0.02]} />
                <meshStandardMaterial color="#0b1329" roughness={0.4} metalness={0.3} />
            </mesh>

            {/* Nóc tủ có vòm LED hắt sáng */}
            <mesh position={[0, 0.45, -0.16]}>
                <boxGeometry args={[1.76, 0.05, 0.40]} />
                <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.5} />
            </mesh>

            {/* Đáy tủ gắn vững lên bệ sau bàn */}
            <mesh position={[0, -0.45, -0.16]}>
                <boxGeometry args={[1.76, 0.05, 0.40]} />
                <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.5} />
            </mesh>

            {/* 2 Vách hồi 2 bên tủ */}
            <mesh position={[-0.85, 0, -0.16]}>
                <boxGeometry args={[0.04, 0.88, 0.38]} />
                <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh position={[0.85, 0, -0.16]}>
                <boxGeometry args={[0.04, 0.88, 0.38]} />
                <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.5} />
            </mesh>

            {/* Tấm kính lưng phản chiếu ánh sáng */}
            <mesh position={[0, 0, -0.33]}>
                <planeGeometry args={[1.66, 0.84]} />
                <meshStandardMaterial color="#1e293b" roughness={0.15} metalness={0.6} />
            </mesh>

            {/* Đèn LED chiếu sáng rực rỡ bên trong tủ */}
            <pointLight position={[0, 0.38, -0.10]} intensity={2.4} color="#f8fafc" distance={3.0} />
            <pointLight position={[-0.5, 0.05, -0.10]} intensity={1.8} color="#bae6fd" distance={2.5} />
            <pointLight position={[0.5, 0.05, -0.10]} intensity={1.8} color="#bae6fd" distance={2.5} />

            {/* ─── 2. CÁC ĐỢT KỆ THỦY TINH TRONG SUỐT BÊN TRONG ─── */}
            {/* Đợt kệ tầng 1 */}
            <mesh position={[0, -0.14, -0.16]}>
                <boxGeometry args={[1.65, 0.016, 0.32]} />
                <meshPhysicalMaterial color="#ffffff" roughness={0.05} transmission={0.9} transparent opacity={0.6} />
            </mesh>
            {/* Đợt kệ tầng 2 */}
            <mesh position={[0, 0.16, -0.16]}>
                <boxGeometry args={[1.65, 0.016, 0.32]} />
                <meshPhysicalMaterial color="#ffffff" roughness={0.05} transmission={0.9} transparent opacity={0.6} />
            </mesh>

            {/* ─── 3. BIỂN HIỆU NỔI BẬT TRÊN NÓC TỦ: CLICK HOẶC CHẠM TAY LÀ MỞ NGAY ─── */}
            <group
                position={[0, 0.58, 0.04]}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenCabinetGui) onOpenCabinetGui();
                    else if (onToggleCabinet) onToggleCabinet();
                    else setInternalOpen(true);
                }}
                onPointerOver={() => { document.body.style.cursor = "pointer"; }}
                onPointerOut={() => { document.body.style.cursor = "default"; }}
            >
                {/* Bảng tên tủ phát sáng */}
                <mesh>
                    <boxGeometry args={[1.65, 0.18, 0.06]} />
                    <meshStandardMaterial
                        color="#0284c7"
                        emissive="#0369a1"
                        emissiveIntensity={0.5}
                        roughness={0.2}
                    />
                </mesh>
                <Text position={[0, 0.03, 0.035]} fontSize={0.048} color="#ffffff" anchorX="center" anchorY="middle">
                    TỦ HÓA CHẤT (107 CHẤT)
                </Text>
                <Text position={[0, -0.045, 0.035]} fontSize={0.026} color={isHandNearCabinet ? "#4ade80" : "#bae6fd"} anchorX="center" anchorY="middle">
                    {isHandNearCabinet ? "Ngón út: Mở Tủ • Ngón trỏ: Chọn lọ • Ngón giữa: Cầm" : "Ngón út: Mở tủ • Ngón trỏ: Chọn lọ • Click để Mở"}
                </Text>
            </group>

            {/* Nút chuyển trang & đổi danh mục khi tủ mở */}
            {isOpen && (
                <group position={[0, -0.42, 0.04]}>
                    {/* Nút lùi trang */}
                    <group
                        position={[-0.65, 0, 0]}
                        onClick={(e) => {
                            e.stopPropagation();
                            playLabSound("pick");
                            setPage((p) => Math.max(0, p - 1));
                        }}
                    >
                        <mesh>
                            <boxGeometry args={[0.18, 0.05, 0.02]} />
                            <meshStandardMaterial color="#334155" roughness={0.3} />
                        </mesh>
                        <Text position={[0, 0, 0.012]} fontSize={0.028} color="#ffffff" anchorX="center" anchorY="middle">
                            ◀ Trước
                        </Text>
                    </group>

                    {/* Hiển thị số trang */}
                    <Text position={[0, 0, 0.01]} fontSize={0.028} color="#38bdf8" anchorX="center" anchorY="middle">
                        Trang {safePage + 1} / {totalPages}
                    </Text>

                    {/* Nút tiến trang */}
                    <group
                        position={[0.65, 0, 0]}
                        onClick={(e) => {
                            e.stopPropagation();
                            playLabSound("pick");
                            setPage((p) => Math.min(totalPages - 1, p + 1));
                        }}
                    >
                        <mesh>
                            <boxGeometry args={[0.18, 0.05, 0.02]} />
                            <meshStandardMaterial color="#334155" roughness={0.3} />
                        </mesh>
                        <Text position={[0, 0, 0.012]} fontSize={0.028} color="#ffffff" anchorX="center" anchorY="middle">
                            Sau ▶
                        </Text>
                    </group>
                </group>
            )}

            {/* ─── 4. CÁC LỌ HÓA CHẤT TRONG TỦ (2 HÀNG X 6 LỌ) ─── */}
            {cabinetBottles.map((chem, idx) => {
                const isTopRow = idx < 6;
                const colIdx = idx % 6;
                const spacingX = 0.26;
                const startX = -((Math.min(cabinetBottles.length, 6) - 1) * spacingX) / 2;

                const posX = startX + colIdx * spacingX;
                const posY = isTopRow ? 0.25 : -0.05;
                const posZ = -0.15;

                const isActive = activeChemicalId === chem.id;
                const canReactWithRef = Boolean(refChemical && (getReaction(refChemical, chem) || getReaction(chem, refChemical)));
                const liquidColor = getDisplayLiquidColor(chem, "#38bdf8");

                return (
                    <group
                        key={chem.id}
                        position={[posX, posY, posZ]}
                        onClick={(e) => {
                            e.stopPropagation();
                            playLabSound("pick");
                            onSelectChemical(chem);
                        }}
                    >
                        {/* 1. Dung dịch bên trong lọ */}
                        <group position={[0, -0.015, 0]}>
                            <mesh renderOrder={1}>
                                <cylinderGeometry args={[0.045, 0.048, 0.11, 20]} />
                                <meshStandardMaterial
                                    color={liquidColor}
                                    emissive={liquidColor}
                                    emissiveIntensity={0.25}
                                    roughness={0.1}
                                    transparent
                                    opacity={0.92}
                                />
                            </mesh>
                        </group>

                        {/* 2. Vỏ chai thủy tinh trong suốt */}
                        <mesh position={[0, 0, 0]} renderOrder={2}>
                            <cylinderGeometry args={[0.048, 0.052, 0.15, 20]} />
                            <meshPhysicalMaterial
                                color="#ffffff"
                                roughness={0.08}
                                metalness={0.05}
                                transparent
                                opacity={0.4}
                                clearcoat={1.0}
                                depthWrite={false}
                            />
                        </mesh>

                        {/* Nắp chai xanh */}
                        <mesh position={[0, 0.10, 0]}>
                            <cylinderGeometry args={[0.03, 0.03, 0.03, 14]} />
                            <meshStandardMaterial color="#0284c7" roughness={0.3} />
                        </mesh>

                        {/* Nhãn dán công thức hóa học */}
                        <mesh position={[0, -0.01, 0.052]}>
                            <planeGeometry args={[0.09, 0.06]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                        <Text
                            position={[0, -0.01, 0.055]}
                            fontSize={0.024}
                            color="#0f172a"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {normalizeChemicalFormula(chem.formula)}
                        </Text>

                        {/* Vòng hào quang phát sáng khi đang là hóa chất được chọn */}
                        {isActive && (
                            <mesh position={[0, -0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[0.055, 0.075, 20]} />
                                <meshBasicMaterial color="#00ffa3" side={THREE.DoubleSide} />
                            </mesh>
                        )}

                        {/* Vòng sáng xanh ngọc khi có phản ứng với chất trên bàn */}
                        {canReactWithRef && !isActive && (
                            <group position={[0, -0.075, 0]}>
                                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                    <ringGeometry args={[0.055, 0.082, 24]} />
                                    <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
                                </mesh>
                                <Text position={[0, 0.20, 0]} fontSize={0.024} color="#10b981" anchorX="center" anchorY="bottom">
                                    Có p/ứ
                                </Text>
                            </group>
                        )}

                        {/* Chỉ báo hover khi tay hoặc chuột đưa lại gần lọ hóa chất */}
                        {hoveredChemId === chem.id && (
                            <group position={[0, 0.16, 0]}>
                                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                    <ringGeometry args={[0.055, 0.08, 24]} />
                                    <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
                                </mesh>
                                <Text position={[0, 0.035, 0]} fontSize={0.022} color="#38bdf8" anchorX="center" anchorY="bottom">
                                    Click hoặc Dơ tay lấy
                                </Text>
                            </group>
                        )}

                        {/* Hitbox cảm ứng & click chuột diện rộng 100% nhạy bén */}
                        <mesh
                            visible={false}
                            onClick={(e) => {
                                e.stopPropagation();
                                playLabSound("pick");
                                onSelectChemical(chem);
                            }}
                            onPointerOver={(e) => {
                                e.stopPropagation();
                                document.body.style.cursor = "pointer";
                                setHoveredChemId(chem.id);
                            }}
                            onPointerOut={() => {
                                document.body.style.cursor = "default";
                                setHoveredChemId(null);
                            }}
                        >
                            <boxGeometry args={[0.24, 0.28, 0.26]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                    </group>
                );
            })}

            {/* ─── 5. HAI CÁNH CỬA KÍNH MỞ TỰ NHIÊN TRÊN BẢN LỀ ─── */}
            {/* Cánh cửa Trái (Hinge tại x = -0.83) */}
            <group
                ref={leftDoorPivotRef}
                position={[-0.83, 0, 0.02]}
            >
                {/* Khi tủ ĐÓNG: Toàn bộ cánh cửa là vùng click để MỞ TỦ! Khi tủ MỞ: không chặn raycast */}
                <mesh
                    position={[0.41, 0, 0]}
                    onClick={(e) => {
                        if (!isOpen) {
                            e.stopPropagation();
                            if (onOpenCabinetGui) onOpenCabinetGui();
                            else if (onToggleCabinet) onToggleCabinet();
                            else setInternalOpen(true);
                        }
                    }}
                    onPointerOver={() => {
                        if (!isOpen) document.body.style.cursor = "pointer";
                    }}
                    onPointerOut={() => {
                        if (!isOpen) document.body.style.cursor = "default";
                    }}
                >
                    <boxGeometry args={[0.82, 0.85, 0.012]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        roughness={0.05}
                        metalness={0.1}
                        transmission={0.88}
                        transparent
                        opacity={0.35}
                        clearcoat={1.0}
                        reflectivity={0.9}
                    />
                </mesh>
                {/* Tay nắm inox dọc cánh cửa trái */}
                <group
                    position={[0.76, 0, 0.02]}
                    onClick={(e) => {
                        if (!isOpen) {
                            e.stopPropagation();
                            if (onOpenCabinetGui) onOpenCabinetGui();
                            else if (onToggleCabinet) onToggleCabinet();
                            else setInternalOpen(true);
                        }
                    }}
                    onPointerOver={() => { if (!isOpen) document.body.style.cursor = "pointer"; }}
                    onPointerOut={() => { if (!isOpen) document.body.style.cursor = "default"; }}
                >
                    <mesh>
                        <cylinderGeometry args={[0.015, 0.015, 0.22, 12]} />
                        <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.1} />
                    </mesh>
                </group>
            </group>

            {/* Cánh cửa Phải (Hinge tại x = +0.83) */}
            <group
                ref={rightDoorPivotRef}
                position={[0.83, 0, 0.02]}
            >
                {/* Khi tủ ĐÓNG: Toàn bộ cánh cửa là vùng click để MỞ TỦ! Khi tủ MỞ: không chặn raycast */}
                <mesh
                    position={[-0.41, 0, 0]}
                    onClick={(e) => {
                        if (!isOpen) {
                            e.stopPropagation();
                            if (onOpenCabinetGui) onOpenCabinetGui();
                            else if (onToggleCabinet) onToggleCabinet();
                            else setInternalOpen(true);
                        }
                    }}
                    onPointerOver={() => {
                        if (!isOpen) document.body.style.cursor = "pointer";
                    }}
                    onPointerOut={() => {
                        if (!isOpen) document.body.style.cursor = "default";
                    }}
                >
                    <boxGeometry args={[0.82, 0.85, 0.012]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        roughness={0.05}
                        metalness={0.1}
                        transmission={0.88}
                        transparent
                        opacity={0.35}
                        clearcoat={1.0}
                        reflectivity={0.9}
                    />
                </mesh>
                {/* Tay nắm inox dọc cánh cửa phải */}
                <group
                    position={[-0.76, 0, 0.02]}
                    onClick={(e) => {
                        if (!isOpen) {
                            e.stopPropagation();
                            if (onOpenCabinetGui) onOpenCabinetGui();
                            else if (onToggleCabinet) onToggleCabinet();
                            else setInternalOpen(true);
                        }
                    }}
                    onPointerOver={() => { if (!isOpen) document.body.style.cursor = "pointer"; }}
                    onPointerOut={() => { if (!isOpen) document.body.style.cursor = "default"; }}
                >
                    <mesh>
                        <cylinderGeometry args={[0.015, 0.015, 0.22, 12]} />
                        <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.1} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}
