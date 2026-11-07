"use client";

/**
 * ─── Lab3DScene ───
 * Phòng Thí Nghiệm Hóa Học 3D Chuẩn Quốc Tế (Realistic Physics & Fluid Simulation):
 * 1. Không còn chữ & nút đè chằng chịt lên nhau trong không gian 3D:
 *    - Toàn bộ dụng cụ thí nghiệm hiển thị 3D thuần túy, sạch sẽ, chân thật.
 *    - Click trực tiếp vào bất kỳ dụng cụ nào trong không gian 3D hoặc bấm thanh Dock bên dưới để chọn.
 * 2. Dock Điều Khiển Ngữ Cảnh (Contextual Action Dock) ở đáy màn hình:
 *    - Hiển thị rõ ràng dụng cụ đang chọn, chất bên trong, mức dung dịch (%).
 *    - Nút bấm trực quan: Cầm lên / Đặt xuống, Rót vào bình gần nhất, Rửa sạch, Đặt lại vị trí.
 * 3. Hệ thống Cầm Nắm & Rót Đa Vật Thể (Dual Hand Tracking & Mouse):
 *    - Webcam nhận diện 2 bàn tay: Nắm tay (GRAB) để nhặt bình, Mở tay (OPEN) để đặt xuống mặt bàn (chống xuyên bàn).
 *    - Rót nước cong theo trọng lực (RealisticWaterStream) kèm phản ứng hóa học tự động.
 */

import React, { useRef, useState, useCallback, useMemo, MutableRefObject, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import * as THREE from "three";

import { HandState, DEFAULT_HAND_STATE, SingleHandData } from "@/lib/handTracking";
import { Chemical, getChemicalById, chemicals as allChemicals } from "@/lib/chemicals";
import { normalizeChemicalFormula } from "@/components/ChemicalSelector";
import { getReaction, ReactionResult } from "@/lib/reactions";
import ReactionInfo from "@/components/ReactionInfo";
import { deviceSensors } from "@/lib/deviceSensors";
import { useDeviceSensors } from "@/hooks/useDeviceSensors";

import Lab3DRoom from "./Lab3DRoom";
import Lab3DFullHandModel from "./Lab3DFullHandModel";
import Lab3DAITeacher from "./Lab3DAITeacher";
import Lab3DAITutorVoice from "./Lab3DAITutorVoice";
import Lab3DChemicalCabinet from "./Lab3DChemicalCabinet";
import Lab3DReactionEffects from "./Lab3DReactionEffects";
import RealisticWaterStream from "./RealisticWaterStream";
import WebGLErrorBoundary from "./WebGLErrorBoundary";
import Lab3DChemicalCabinetModal from "./Lab3DChemicalCabinetModal";
import { 
    FlaskConical, 
    FlaskRound, 
    TestTube, 
    Lock, 
    Layers, 
    GraduationCap, 
    X, 
    DoorOpen, 
    DoorClosed, 
    ArrowDown, 
    Hand, 
    Droplets, 
    RotateCcw,
    ZoomIn,
    Maximize2,
    Smartphone 
} from "lucide-react";
import {
    RealisticGlasswareMesh,
    GlasswareType,
    playLabSound,
    stopLabSound,
} from "./ChemistryRealisticModels";

interface Lab3DSceneProps {
    handStateRef: MutableRefObject<HandState>;
    chemicals?: Chemical[];
    subject?: string;
}

export interface InteractiveWorkbenchItem {
    id: string;
    type: GlasswareType;
    label: string;
    chemical: Chemical | null;
    liquidColor: string;
    fillLevel: number; // 0.0 to 1.0
    position: [number, number, number];
    defaultPosition: [number, number, number];
    heldBy: "left" | "right" | "user" | "phone" | null;
    tiltAngle: number;
    pitchAngle?: number;
    solidChemical?: Chemical | null; // Chất rắn dạng cục / thỏi kim loại / tinh thể nếu có
}

// ─── Lấy màu hiển thị thực tế cho chất lỏng trong suốt ───
export function getDisplayLiquidColor(chem: Chemical | null | undefined, fallback: string = "#38bdf8"): string {
    if (!chem) return fallback;

    const id = chem.id.toLowerCase();
    // Các chất có màu sắc đặc trưng trong phòng thí nghiệm
    if (id === "cuso4" || id.includes("dong") || id.includes("copper")) return "#2563eb"; // Xanh lam rực rỡ đặc trưng của Đồng Sunfat
    if (id.includes("kmno4")) return "#9333ea"; // Tím đậm thuốc tím
    if (id.includes("fecl3")) return "#b45309"; // Vàng nâu hổ phách sắt (III)
    if (id.includes("feso4") || id === "fecl2") return "#10b981"; // Xanh lục nhạt sắt (II)
    if (id.includes("k2cr2o7")) return "#ea580c"; // Cam rực đicromat
    if (id.includes("k2cro4")) return "#eab308"; // Vàng tươi cromat
    if (id.includes("phenol")) return "#ec4899"; // Hồng cánh sen Phenolphthalein
    if (id.includes("c2h5oh")) return "#38bdf8"; // Xanh ngọc nhạt cồn
    if (id === "br2") return "#b91c1c"; // Đỏ nâu Brom
    if (id === "i2") return "#7e22ce"; // Tím Iot
    if (id === "fe") return "#64748b"; // Màu xám kim loại sắt

    // Kiểm tra màu khai báo có phải trắng/trong suốt không
    const rawColor = chem.liquidColor || chem.color || "";
    const isWhiteOrClear =
        !rawColor ||
        rawColor === "transparent" ||
        rawColor === "#ffffff" ||
        rawColor.includes("255,255,255") ||
        rawColor.includes("255, 255, 255");

    if (!isWhiteOrClear) {
        return rawColor;
    }

    // Với dung dịch không màu trong suốt: Áp dụng ánh màu thí nghiệm sắc nét giúp học sinh quan sát rõ mực chất lỏng và phản ứng
    if (chem.category === "acid") return "#38bdf8"; // Xanh dương trong vắt cho Axit (HCl, H2SO4, HNO3, CH3COOH)
    if (chem.category === "base") return "#2dd4bf"; // Xanh ngọc biển thanh dịu cho Bazơ (NaOH, Ba(OH)2, Ca(OH)2, NH3)
    if (chem.category === "indicator") return "#f43f5e"; // Đỏ hồng chỉ thị
    if (chem.category === "salt") return "#60a5fa"; // Xanh da trời muối tan

    return fallback;
}

// ─── Chiều cao miệng bình theo từng loại ───
export function getVesselMouthHeight(type: GlasswareType): number {
    switch (type) {
        case "beaker": return 0.24;
        case "test-tube": return 0.26;
        case "round-flask": return 0.24;
        case "erlenmeyer": return 0.26;
        case "reagent-bottle": return 0.28;
        default: return 0.25;
    }
}

// ─── Biểu tượng dụng cụ trực quan ───
export function getVesselIcon(type: GlasswareType): React.ReactNode {
    switch (type) {
        case "reagent-bottle": return <FlaskConical className="w-3.5 h-3.5 text-sky-400" />;
        case "beaker": return <FlaskRound className="w-3.5 h-3.5 text-emerald-400" />;
        case "test-tube": return <TestTube className="w-3.5 h-3.5 text-indigo-400" />;
        case "round-flask": return <FlaskRound className="w-3.5 h-3.5 text-amber-400" />;
        case "erlenmeyer": return <FlaskConical className="w-3.5 h-3.5 text-teal-400" />;
        default: return <FlaskConical className="w-3.5 h-3.5 text-sky-400" />;
    }
}

// ─── 1. Dụng Cụ Thí Nghiệm Đồ Họa 3D Thuần Túy Kèm Hiệu Ứng Định Vị Hover / Grip Của Bàn Tay ───
// ─── 1. Dụng Cụ Thí Nghiệm Đồ Họa 3D Thuần Túy Kèm Hiệu Ứng Định Vị Hover / Grip Của Bàn Tay ───
function InteractiveVessel({
    item,
    isSelected,
    isTarget,
    isHovered,
    onSelect,
}: {
    item: InteractiveWorkbenchItem;
    isSelected: boolean;
    isTarget: boolean;
    isHovered: boolean;
    onSelect: () => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const shadowRef = useRef<THREE.Mesh>(null);
    const isReagent = item.type === "reagent-bottle";
    const mouthH = getVesselMouthHeight(item.type);
    const gripY = 0.10; // Tâm eo bình (nơi bàn tay cầm nắm chuẩn ngoài đời)

    // Cập nhật vị trí và góc quay trực tiếp lên Three.js Object3D mỗi frame (60fps mượt mà)
    useFrame(() => {
        if (groupRef.current) {
            // Khi quay quanh tâm eo bình [x, y + gripY, z], bình xoay chuẩn xác ngay trong lòng bàn tay
            groupRef.current.position.set(item.position[0], item.position[1] + gripY, item.position[2]);
            groupRef.current.rotation.set(item.pitchAngle || 0, 0, item.tiltAngle);
        }
        if (shadowRef.current) {
            // Bóng đổ tiếp xúc luôn nằm phẳng ngay ngắn trên mặt bàn (-0.058)
            shadowRef.current.position.set(item.position[0], -0.058, item.position[2]);
        }
    });

    return (
        <>
            <group
                ref={groupRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
            >
                {/* Toàn bộ mô hình được dịch xuống -gripY để đáy bình nằm đúng item.position[1] */}
                <group position={[0, -gripY, 0]}>
                    {/* 1. Model 3D thủy tinh & chất lỏng/rắn chuẩn vật lý với mặt nước cân bằng trọng lực */}
                    <RealisticGlasswareMesh
                        type={item.type}
                        fillLevel={item.fillLevel}
                        liquidColor={item.liquidColor}
                        tiltAngle={item.tiltAngle || 0}
                        scale={1.22}
                        isSolid={item.chemical?.state === "solid" || !!item.solidChemical}
                        solidColor={
                            item.chemical?.solidColor ||
                            item.solidChemical?.solidColor ||
                            (item.chemical?.id === "fe" || item.solidChemical?.id === "fe"
                                ? "#64748b"
                                : item.chemical?.id === "cu" || item.solidChemical?.id === "cu"
                                ? "#b45309"
                                : item.chemical?.id === "zn" || item.solidChemical?.id === "zn"
                                ? "#94a3b8"
                                : "#94a3b8")
                        }
                        solidType={item.chemical?.solidType || item.solidChemical?.solidType || "metal"}
                    />

                    {/* 2. Vòng tròn chỉ thị khi là đích rót dung dịch vào */}
                    {isTarget && (
                        <mesh position={[0, mouthH + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0.08, 0.12, 24]} />
                            <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} />
                        </mesh>
                    )}

                    {/* 3. Chỉ báo trực quan Hover Target: Tay đang đưa tới gần bình */}
                    {isHovered && !item.heldBy && (
                        <mesh position={[0, mouthH + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0.07, 0.10, 24]} />
                            <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} side={THREE.DoubleSide} />
                        </mesh>
                    )}

                    {/* 4. Vòng hào quang phát sáng ở đế khi đang được chọn, đang cầm hoặc đang hover */}
                    {(isSelected || item.heldBy || isHovered) && (
                        <mesh position={[0, -0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0.075, 0.115, 32]} />
                            <meshBasicMaterial
                                color={item.heldBy ? "#f59e0b" : isHovered ? "#38bdf8" : "#0284c7"}
                                transparent
                                opacity={0.85}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    )}

                    {/* 5. Tem nhãn dán hóa chất chuẩn thực tế dán trực tiếp trên thân lọ (Không bay lơ lửng che tầm nhìn) */}
                    {isReagent && (
                        <group position={[0, 0.08, 0.082]}>
                            {/* Nền tem giấy dán trắng ngà */}
                            <mesh>
                                <planeGeometry args={[0.076, 0.046]} />
                                <meshStandardMaterial color="#f8fafc" roughness={0.6} />
                            </mesh>
                            {/* Viền chỉ thanh lịch */}
                            <mesh position={[0, 0, 0.0005]}>
                                <planeGeometry args={[0.072, 0.042]} />
                                <meshBasicMaterial color="#94a3b8" wireframe />
                            </mesh>
                            {/* Công thức hóa học */}
                            <Text
                                position={[0, 0.007, 0.001]}
                                fontSize={0.015}
                                color="#0f172a"
                                anchorX="center"
                                anchorY="middle"
                            >
                                {item.chemical
                                    ? normalizeChemicalFormula(item.chemical.formula)
                                    : "LỌ TRỐNG"}
                            </Text>
                            {/* Tên hóa học / trạng thái */}
                            <Text
                                position={[0, -0.009, 0.001]}
                                fontSize={0.007}
                                color="#64748b"
                                anchorX="center"
                                anchorY="middle"
                            >
                                {item.chemical
                                    ? item.chemical.name.length > 14
                                        ? item.chemical.name.slice(0, 13) + "..."
                                        : item.chemical.name
                                    : "(Đã đổ hết)"}
                            </Text>
                        </group>
                    )}

                    {/* Nhãn ghi chú sắc nét in trên thân cốc trộn (Beaker) */}
                    {item.type === "beaker" && (item.chemical || item.solidChemical) && (
                        <group position={[0, 0.065, 0.065]}>
                            <Text
                                position={[0, 0, 0]}
                                fontSize={0.013}
                                color="#ffffff"
                                anchorX="center"
                                anchorY="middle"
                                fillOpacity={0.9}
                            >
                                {item.chemical
                                    ? normalizeChemicalFormula(item.chemical.formula)
                                    : item.solidChemical
                                    ? normalizeChemicalFormula(item.solidChemical.formula)
                                    : ""}
                            </Text>
                        </group>
                    )}
                </group>
            </group>

            {/* 6. Bóng đổ tiếp xúc mặt bàn (Drop Shadow) độc lập không bị nghiêng theo chai */}
            {item.heldBy && (
                <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.085, 24]} />
                    <meshBasicMaterial
                        color="#020617"
                        transparent
                        opacity={Math.max(0.18, 0.48 - Math.max(0, item.position[1] + 0.06) * 0.8)}
                    />
                </mesh>
            )}
        </>
    );
}

// ─── 2. Main 3D Canvas Content Orchestrator ───
interface SceneContentProps {
    handStateRef: MutableRefObject<HandState>;
    activeChemical: Chemical;
    setActiveChemical: (c: Chemical) => void;
    teacherMessage: string;
    setTeacherMessage: (msg: string) => void;
    teacherMode: "idle" | "speaking" | "warning" | "success" | "listening";
    setTeacherMode: (mode: "idle" | "speaking" | "warning" | "success" | "listening") => void;
    items: InteractiveWorkbenchItem[];
    setItems: React.Dispatch<React.SetStateAction<InteractiveWorkbenchItem[]>>;
    itemsRef: MutableRefObject<InteractiveWorkbenchItem[]>;
    selectedItemId: string;
    setSelectedItemId: (id: string) => void;
    pourState: {
        active: boolean;
        sourceId: string;
        targetId: string;
        from: [number, number, number];
        to: [number, number, number];
        color: string;
    } | null;
    setPourState: React.Dispatch<React.SetStateAction<any>>;
    activeReaction: ReactionResult | null;
    setActiveReaction: (r: ReactionResult | null) => void;
    handleExecutePour: (sourceId: string, targetId?: string) => void;
    show3DTeacher?: boolean;
    isFixedCamera: boolean;
    isCabinetOpen: boolean;
    setIsCabinetOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isCabinetModalOpen: boolean;
    setIsCabinetModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onOpenCabinetGui: () => void;
    onSelectCabinetChemical: (chem: Chemical) => void;
    releaseCooldownRef: MutableRefObject<{ itemId: string | null; until: number }>;
    cabinetCooldownRef: MutableRefObject<number>;
    refChemical?: Chemical | null;
    reactionPosition: [number, number, number];
    setReactionPosition: React.Dispatch<React.SetStateAction<[number, number, number]>>;
    cameraPreset?: "closeup" | "pour" | "overview";
}

function SceneContent({
    handStateRef,
    activeChemical,
    setActiveChemical,
    teacherMessage,
    setTeacherMessage,
    teacherMode,
    setTeacherMode,
    items,
    setItems,
    itemsRef,
    selectedItemId,
    setSelectedItemId,
    pourState,
    setPourState,
    activeReaction,
    setActiveReaction,
    handleExecutePour,
    show3DTeacher = false,
    isFixedCamera = true,
    isCabinetOpen,
    setIsCabinetOpen,
    isCabinetModalOpen,
    setIsCabinetModalOpen,
    onOpenCabinetGui,
    onSelectCabinetChemical,
    releaseCooldownRef,
    cabinetCooldownRef,
    refChemical,
    reactionPosition,
    setReactionPosition,
    cameraPreset = "overview",
}: SceneContentProps) {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);
    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
    const handWasOpenBeforeGrabRef = useRef<boolean>(true);
    const ungrabStartTimeRef = useRef<number | null>(null);
    const pinkyCabinetToggleRef = useRef<number>(0);
    const pinkyWasActiveRef = useRef<boolean>(false);
    const isUserOrbitingRef = useRef(false);
    const lastShakeTimeRef = useRef<number>(0);

    // Tính toán góc nhìn tối ưu cho từng Preset (Mặc định ở xa xa bao quát đủ xem mọi thứ)
    const getPresetTarget = useCallback((preset: "closeup" | "pour" | "overview") => {
        switch (preset) {
            case "closeup":
                return {
                    pos: new THREE.Vector3(0, 0.52, 2.25),
                    look: new THREE.Vector3(0.05, 0.10, 0.30),
                };
            case "pour":
                return {
                    pos: new THREE.Vector3(-0.16, 0.50, 2.05),
                    look: new THREE.Vector3(-0.10, 0.10, 0.30),
                };
            case "overview":
            default:
                return {
                    pos: new THREE.Vector3(0, 0.65, 2.95),
                    look: new THREE.Vector3(0.15, 0.10, 0.25),
                };
        }
    }, []);

    // Cập nhật camera ngay khi người dùng chọn Preset
    useEffect(() => {
        const { pos, look } = getPresetTarget(cameraPreset);
        camera.position.copy(pos);
        if (controlsRef.current) {
            controlsRef.current.target.copy(look);
            controlsRef.current.update();
        } else {
            camera.lookAt(look);
        }
    }, [cameraPreset, getPresetTarget, camera]);

    // ─── Frame Update: Cầm Nắm Chuẩn Xác, Đặt Xuống & Rót Của 2 Bàn Tay (Camera Cố Định) ───
    useFrame((_, delta) => {
        if (isCabinetModalOpen) {
            // Khi đang mở Tủ Hóa Chất VR: Dành trọn vẹn cử chỉ bàn tay cho GUI Thực Tế Ảo (Chỉ ngón, Ấn ngón, Phẩy tay cuộn)
            return;
        }

        const hs = handStateRef.current;
        const handsToCheck: { side: "right" | "left"; data: SingleHandData }[] = [];

        if (hs.rightHand?.detected) handsToCheck.push({ side: "right", data: hs.rightHand });
        if (hs.leftHand?.detected) handsToCheck.push({ side: "left", data: hs.leftHand });
        if (handsToCheck.length === 0 && hs.detected) {
            handsToCheck.push({ side: "right", data: hs });
        }

        const currentList = [...itemsRef.current];
        let stateChanged = false;
        let closestHoverItem: string | null = null;
        let minHoverDist = 0.40; // Tầm nhận diện hover rộng và mượt trên màn hình

        // 1. KIỂM TRA ĐIỆN THOẠI DI ĐỘNG CẢM BIẾN CON QUAY HỒI CHUYỂN
        const sensorData = deviceSensors.getData();
        const isPhoneActive = Boolean(sensorData.lastUpdated && Date.now() - sensorData.lastUpdated < 3500);

        const bottle = currentList.find((it) => it.id === "bottle-reagent");
        const beaker = currentList.find((it) => it.id === "beaker-1");

        if (bottle && beaker) {
            const mouthHTarget = getVesselMouthHeight(beaker.type);
            const restX = bottle.defaultPosition[0]; // -0.32
            const restY = bottle.defaultPosition[1]; // -0.06
            const restZ = bottle.defaultPosition[2]; // 0.36

            if (isPhoneActive) {
                bottle.heldBy = "phone";
                const roll = sensorData.roll || 0; // Đã được hiệu chuẩn qua calibrateZero() (-90° đến +90°)
                const pitch = sensorData.pitch || 0; // Độ chúc trước/sau
                const isPourTilted = sensorData.isPourTilted;
                const pourIntensity = sensorData.pourIntensity || 0;
                const absRoll = Math.abs(roll);
                const absPitch = Math.abs(pitch);

                // 1. NHẤC LÊN: Cầm điện thoại nhấc lên thì cái chai nhấc theo lên khỏi mặt bàn
                // Khi người dùng cầm điện thoại trên tay (có độ nghiêng nhẹ hoặc đang dốc hoặc chuyển động)
                const isHeldInHand = absRoll > 4 || absPitch > 8 || isPourTilted || pourIntensity > 0;
                const liftFactor = isHeldInHand
                    ? THREE.MathUtils.clamp(Math.max((absRoll - 4) / 14, (absPitch - 8) / 18, pourIntensity), 0.35, 1)
                    : 0;

                // 2. DỐC HƯỚNG NÀO THÌ ĐỔ HƯỚNG ĐÓ:
                // - Nghiêng sang PHẢI (roll > 10°): Chai dốc sang phải, di chuyển tới miệng cốc hứng ở bên phải
                // - Nghiêng sang TRÁI (roll < -10°): Chai dốc sang trái, di chuyển dốc sang bên trái
                // - Dốc chúc xuống (pitch < -14° hoặc pitch > 24°): Dốc về phía trước vào cốc
                const isTiltingRight = roll > 10;
                const isTiltingLeft = roll < -10;
                const isTiltingForward = pitch < -14 || pitch > 24 || (isPourTilted && absRoll <= 10);
                const isIntentionalTilt = isTiltingRight || isTiltingLeft || isTiltingForward || isPourTilted;

                if (isIntentionalTilt) {
                    // Cường độ dốc thực tế từ cảm biến điện thoại (tỷ lệ chuẩn từ 10° tới 45°)
                    const tiltAmount = THREE.MathUtils.clamp(
                        Math.max((absRoll - 10) / 25, (Math.abs(pitch) - 14) / 25, pourIntensity),
                        0.15,
                        1
                    );

                    let targetX = restX;
                    let targetY = restY + 0.12 + liftFactor * 0.08;
                    let targetZ = restZ;
                    let targetTilt = 0;
                    let targetPitch = 0;

                    if (isTiltingRight || (isPourTilted && roll >= -10)) {
                        // 👉 DỐC SANG PHẢI (Hướng về phía cốc hứng)
                        // Trong Three.js, quay quanh trục Z góc âm (-) làm miệng bình dốc sang phải (CW)
                        targetTilt = -tiltAmount * 0.95;
                        targetX = THREE.MathUtils.lerp(restX, beaker.position[0] - 0.11, tiltAmount);
                        targetY = THREE.MathUtils.lerp(restY + 0.14, beaker.position[1] + mouthHTarget + 0.12, tiltAmount);
                        targetZ = THREE.MathUtils.lerp(restZ, beaker.position[2], tiltAmount);
                    } else if (isTiltingLeft) {
                        // 👈 DỐC SANG TRÁI (Hướng ra phía ngoài bên trái)
                        // Quay quanh trục Z góc dương (+) làm miệng bình dốc sang trái (CCW)
                        targetTilt = tiltAmount * 0.95;
                        targetX = THREE.MathUtils.lerp(restX, restX - 0.10, tiltAmount);
                        targetY = restY + 0.14 + tiltAmount * 0.06;
                        targetZ = restZ;
                    } else if (isTiltingForward) {
                        // 👆 DỐC CHÚC PHÍA TRƯỚC (Pitch forward)
                        targetPitch = -tiltAmount * 0.75;
                        targetTilt = -tiltAmount * 0.40;
                        targetX = THREE.MathUtils.lerp(restX, beaker.position[0] - 0.08, tiltAmount);
                        targetY = THREE.MathUtils.lerp(restY + 0.14, beaker.position[1] + mouthHTarget + 0.10, tiltAmount);
                        targetZ = THREE.MathUtils.lerp(restZ, beaker.position[2] + 0.04, tiltAmount);
                    }

                    // Lerp vị trí và góc nghiêng mượt mà theo thời gian thực (60fps)
                    bottle.position[0] = THREE.MathUtils.lerp(bottle.position[0], targetX, Math.min(1, delta * 14));
                    bottle.position[1] = THREE.MathUtils.lerp(bottle.position[1], targetY, Math.min(1, delta * 14));
                    bottle.position[2] = THREE.MathUtils.lerp(bottle.position[2], targetZ, Math.min(1, delta * 14));
                    bottle.tiltAngle = THREE.MathUtils.lerp(bottle.tiltAngle, targetTilt, Math.min(1, delta * 14));
                    bottle.pitchAngle = THREE.MathUtils.lerp(bottle.pitchAngle || 0, targetPitch, Math.min(1, delta * 14));
                    stateChanged = true;

                    // 3. TIẾN HÀNH RÓT CHẤT LỎNG KHI ĐỘ DỐC ĐỦ LỚN (tiltAmount >= 0.35)
                    const hasChemical = Boolean(bottle.chemical && bottle.fillLevel > 0.005);
                    if (tiltAmount >= 0.35 && hasChemical) {
                        const spoutOffsetSign = isTiltingLeft ? -0.08 : 0.08;
                        const streamFrom: [number, number, number] = [
                            bottle.position[0] + spoutOffsetSign,
                            bottle.position[1] + 0.08,
                            bottle.position[2],
                        ];
                        const streamTo: [number, number, number] = isTiltingLeft
                            ? [bottle.position[0] - 0.18, -0.06, bottle.position[2]]
                            : [beaker.position[0], beaker.position[1] + mouthHTarget, beaker.position[2]];
                        const streamColor = bottle.liquidColor || bottle.chemical?.color || "#38bdf8";

                        if (!pourState || !pourState.active) {
                            setPourState({
                                active: true,
                                sourceId: bottle.id,
                                targetId: isTiltingLeft ? "" : beaker.id,
                                from: streamFrom,
                                to: streamTo,
                                color: streamColor,
                            });
                            playLabSound("bubbles");
                        } else {
                            pourState.from = streamFrom;
                            pourState.to = streamTo;
                        }

                        const flow = delta * 0.28;
                        bottle.fillLevel = Math.max(0, bottle.fillLevel - flow);

                        // Nếu dốc sang phải (vào cốc hứng): cốc hứng nhận dung dịch
                        if (!isTiltingLeft) {
                            beaker.fillLevel = Math.min(0.85, (beaker.fillLevel || 0) + flow);
                            if (bottle.chemical) {
                                if (!beaker.chemical) {
                                    beaker.chemical = bottle.chemical;
                                    beaker.liquidColor = bottle.liquidColor;
                                    beaker.label = beaker.chemical.name;
                                } else if (beaker.chemical.id !== bottle.chemical.id && !beaker.solidChemical) {
                                    beaker.solidChemical = bottle.chemical;
                                    beaker.label = `${beaker.chemical.name} + ${bottle.chemical.name}`;
                                }
                            }
                        }

                        if (bottle.fillLevel <= 0.005 && bottle.chemical) {
                            bottle.chemical = null;
                            bottle.fillLevel = 0;
                            bottle.label = "Lọ rỗng (Đã đổ hết)";
                            if (pourState) setPourState(null);
                            setTeacherMode("speaking");
                            setTeacherMessage("Đã đổ hết hóa chất vào cốc! Em có thể chọn thêm chất từ tủ hóa chất hoặc lắc điện thoại để hòa trộn nhé!");
                        }
                    } else if (pourState) {
                        setPourState(null);
                    }
                } else {
                    // KHI CẦM ĐIỆN THOẠI THẲNG ĐỨNG HOẶC ĐỂ NẰM YÊN:
                    const targetY = isHeldInHand ? restY + 0.08 : restY;
                    bottle.position[0] = THREE.MathUtils.lerp(bottle.position[0], restX, Math.min(1, delta * 12));
                    bottle.position[1] = THREE.MathUtils.lerp(bottle.position[1], targetY, Math.min(1, delta * 12));
                    bottle.position[2] = THREE.MathUtils.lerp(bottle.position[2], restZ, Math.min(1, delta * 12));
                    bottle.tiltAngle = THREE.MathUtils.lerp(bottle.tiltAngle, 0, Math.min(1, delta * 12));
                    bottle.pitchAngle = THREE.MathUtils.lerp(bottle.pitchAngle || 0, 0, Math.min(1, delta * 12));
                    stateChanged = true;
                    if (pourState) setPourState(null);
                }

                // Lắc điện thoại -> Hòa trộn phản ứng
                if (sensorData.isShaking) {
                    const now = performance.now();
                    if (now - lastShakeTimeRef.current > 1800) {
                        lastShakeTimeRef.current = now;
                        deviceSensors.triggerHaptic([40, 60, 40]);
                        playLabSound("bubbles");

                        const c1 = beaker.chemical;
                        const c2 = beaker.solidChemical;
                        if (c1 && c2) {
                            const rx = getReaction(c1, c2) || getReaction(c2, c1);
                            if (rx) {
                                setActiveReaction(rx);
                                setReactionPosition([beaker.position[0], beaker.position[1], beaker.position[2]]);
                                const effectColor = rx.effects.find((e) => e.targetColor)?.targetColor;
                                if (effectColor) beaker.liquidColor = effectColor;
                                beaker.label = `Sản phẩm: ${rx.equation}`;
                                setTeacherMode(rx.type === "combustion" ? "warning" : "success");
                                setTeacherMessage(`🎉 Phản ứng hóa học xảy ra khi lắc trộn!\n${rx.equation}\nHiện tượng: ${rx.description}`);
                            } else {
                                setTeacherMode("speaking");
                                setTeacherMessage(`Đã lắc đều dung dịch trong ${beaker.label}.`);
                            }
                        } else if (c1) {
                            setTeacherMode("speaking");
                            setTeacherMessage(`Đã lắc đều dung dịch ${c1.name} trong cốc.`);
                        }
                    }
                }
            } else {
                // KHI CHƯA KẾT NỐI ĐIỆN THOẠI:
                // Bình LUÔN LUÔN đứng cố định 100% trên mặt bàn đá tại vị trí mặc định!
                // Tuyệt đối không cho phép tay hay chuột bốc bình bay lơ lửng!
                bottle.heldBy = null;
                bottle.position[0] = THREE.MathUtils.lerp(bottle.position[0], restX, Math.min(1, delta * 12));
                bottle.position[1] = THREE.MathUtils.lerp(bottle.position[1], restY, Math.min(1, delta * 12));
                bottle.position[2] = THREE.MathUtils.lerp(bottle.position[2], restZ, Math.min(1, delta * 12));
                bottle.tiltAngle = THREE.MathUtils.lerp(bottle.tiltAngle, 0, Math.min(1, delta * 12));
                bottle.pitchAngle = THREE.MathUtils.lerp(bottle.pitchAngle || 0, 0, Math.min(1, delta * 12));
                if (pourState) setPourState(null);
            }
        }

        // 2. CAMERA HAND AI:
        // Chuyên trách cử chỉ điều khiển phòng Lab:
        // - Dơ 3 ngón tay: Bật mic nói chuyện với Cô giáo Mai AI
        // - Dơ ngón út: Đóng / mở Tủ hóa chất
        // - Chỉ ngón trỏ: Chiếu tia laser trỏ chọn hóa chất
        // TUYỆT ĐỐI KHÔNG BỐC / CẦM BÌNH BẰNG TAY WEBCAM (Chai chỉ tương tác khi quét QR cầm điện thoại nhấc và dốc)
        handsToCheck.forEach(({ side, data }) => {
            const now = performance.now();

            // 1. DƠ NGÓN ÚT (PINKY UP): MỞ / ĐÓNG TỦ HÓA CHẤT NGAY LẬP TỨC
            const isPinkyOnly = Boolean(data.isPinkyExtended && !data.isMiddleExtended && !data.isIndexExtended);
            if (isPinkyOnly && !pinkyWasActiveRef.current && now - pinkyCabinetToggleRef.current > 500) {
                pinkyCabinetToggleRef.current = now;
                pinkyWasActiveRef.current = true;
                playLabSound("pick");
                setIsCabinetOpen(true);
                setIsCabinetModalOpen(true);
            } else if (!isPinkyOnly) {
                pinkyWasActiveRef.current = false;
            }
        });

        // BẢO ĐẢM AN TOÀN: Dụng cụ trên bàn không bao giờ bị dơ tay webcam bốc bay lơ lửng
        currentList.forEach((it) => {
            if (it.heldBy === "left" || it.heldBy === "right") {
                it.heldBy = null;
                it.position = [...it.defaultPosition] as [number, number, number];
                it.tiltAngle = 0;
                it.pitchAngle = 0;
                stateChanged = true;
            }
        });

        if (hoveredItemId !== closestHoverItem) {
            setHoveredItemId(closestHoverItem);
        }

        if (stateChanged) {
            setItems([...currentList]);
        }
    });

    return (
        <>
            <PerspectiveCamera
                makeDefault
                position={[0, 0.65, 2.95]}
                fov={48}
            />
            <OrbitControls
                ref={controlsRef}
                enablePan={false}
                enableZoom={false}
                enableRotate={false}
                target={[0.15, 0.10, 0.25]}
            />

            {/* Phòng thí nghiệm hoạt hình Pixar tươi sáng & Đạo cụ từ Unity */}
            <Lab3DRoom />

            {/* Tủ Kính Hóa Chất 3D 107 chất có 2 cánh mở/đóng chân thật & tương tác tay + chuột */}
            <Lab3DChemicalCabinet
                onSelectChemical={onSelectCabinetChemical}
                activeChemicalId={activeChemical.id}
                isCabinetOpen={isCabinetOpen}
                onToggleCabinet={() => setIsCabinetOpen(true)}
                handStateRef={handStateRef}
                onOpenCabinetGui={onOpenCabinetGui}
                isCabinetModalOpen={isCabinetModalOpen}
                refChemical={refChemical}
            />

            {/* 5 Dụng cụ thí nghiệm trên bàn: Kèm hiệu ứng Hover & Proximity Guidance */}
            {items.map((it) => (
                <InteractiveVessel
                    key={it.id}
                    item={it}
                    isSelected={selectedItemId === it.id}
                    isTarget={pourState?.targetId === it.id}
                    isHovered={hoveredItemId === it.id}
                    onSelect={() => setSelectedItemId(it.id)}
                />
            ))}

            {/* Dòng nước chảy thực tế cong trọng lực từ miệng bình này sang bình khác */}
            {pourState && (
                <RealisticWaterStream
                    from={pourState.from}
                    to={pourState.to}
                    color={pourState.color}
                    active={pourState.active}
                />
            )}

            {/* Bàn tay 3D được hiển thị toàn cục ở page.tsx trên layer z-[60] (ở phía trước thanh Tab) */}
            {/* <Lab3DFullHandModel handStateRef={handStateRef} /> */}

            {/* Nhân vật Cô Giáo AI Đồng Hành 3D (Đứng bên phải bàn thí nghiệm Y = -0.48 trên sàn, đối diện học sinh) */}
            {show3DTeacher && (
                <Lab3DAITeacher
                    position={[2.35, -0.48, 0.35]}
                    rotation={[0, -0.62, 0]}
                    scale={1.15}
                    mode={teacherMode}
                    message={teacherMessage}
                />
            )}

            {/* Hiệu ứng khói, tia lửa, kết tủa khi có phản ứng */}
            <Lab3DReactionEffects
                reaction={activeReaction}
                position={reactionPosition}
                active={!!activeReaction}
            />
        </>
    );
}

// ─── Danh mục hóa chất ───
const CATEGORY_NAMES: Record<string, string> = {
    all: "Tất cả",
    acid: "Axit",
    base: "Bazơ",
    salt: "Muối",
    metal: "Kim loại",
    indicator: "Chỉ thị",
    organic: "Hữu cơ",
};

// ─── Exported Default Scene ───
export default function Lab3DScene({ handStateRef, chemicals = [] }: Lab3DSceneProps) {
    const fallbackRef = useRef<HandState>({ ...DEFAULT_HAND_STATE });
    const actualHandRef = handStateRef || fallbackRef;
    const glRef = useRef<THREE.WebGLRenderer | null>(null);

    // Giải phóng bộ nhớ WebGL context ngay khi unmount (tránh cạn kiệt 16 contexts của trình duyệt)
    useEffect(() => {
        return () => {
            if (glRef.current) {
                try {
                    glRef.current.dispose();
                    glRef.current.forceContextLoss();
                } catch {
                    // Ignore
                }
            }
        };
    }, []);

    const [activeChemical, setActiveChemical] = useState<Chemical>(() => {
        return getChemicalById("cuso4") || allChemicals[0];
    });

    const [teacherMode, setTeacherMode] = useState<"idle" | "speaking" | "warning" | "success" | "listening">("speaking");
    const [teacherMessage, setTeacherMessage] = useState(
        "Xin chào! Cô là Cô Giáo Mai SimLab. Bàn thí nghiệm có 1 lọ hóa chất lấy từ tủ và 1 cốc phản ứng rỗng. Em hãy quét mã QR kết nối điện thoại để cầm nghiêng rót & lắc trộn (hoặc bấm nút Rót bên dưới) nhé!"
    );
    const [isTeacherGuideOpen, setIsTeacherGuideOpen] = useState(false);
    const [show3DTeacher, setShow3DTeacher] = useState(true);
    const [isFixedCamera, setIsFixedCamera] = useState(true);
    const [cameraPreset, setCameraPreset] = useState<"closeup" | "pour" | "overview">("overview");

    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCabinetOpen, setIsCabinetOpen] = useState(true);
    const [isCabinetModalOpen, setIsCabinetModalOpen] = useState(false);
    const releaseCooldownRef = useRef<{ itemId: string | null; until: number }>({ itemId: null, until: 0 });
    const cabinetCooldownRef = useRef<number>(0);

    const [selectedItemId, setSelectedItemId] = useState<string>("bottle-reagent");

    const { lastUpdated: phoneLastUpdated } = useDeviceSensors();
    const isPhoneConnected = Boolean(phoneLastUpdated && Date.now() - phoneLastUpdated < 4000);

    const naoh = useMemo(() => getChemicalById("naoh"), []);
    const fe = useMemo(() => getChemicalById("fe"), []);
    const baoh2 = useMemo(() => getChemicalById("ba(oh)2"), []);
    const hcl = useMemo(() => getChemicalById("hcl"), []);

    // ─── Đúng 2 dụng cụ trên bàn: 1 lọ/dụng cụ lấy từ tủ ra (trái) + 1 cốc trộn phản ứng rỗng (phải) ───
    const [items, setItems] = useState<InteractiveWorkbenchItem[]>([
        {
            id: "bottle-reagent",
            type: "reagent-bottle",
            label: "Lọ rỗng (Chọn chất từ tủ)",
            chemical: null,
            liquidColor: "transparent",
            fillLevel: 0,
            position: [-0.32, -0.06, 0.36],
            defaultPosition: [-0.32, -0.06, 0.36],
            heldBy: null,
            tiltAngle: 0,
        },
        {
            id: "beaker-1",
            type: "beaker",
            label: "Cốc Trộn Phản Ứng (Rỗng)",
            chemical: null, // Ban đầu LUÔN RỖNG 100% để sẵn sàng nhận chất hòa trộn
            solidChemical: null,
            liquidColor: "transparent",
            fillLevel: 0, // 0% rỗng hoàn toàn
            position: [0.32, -0.06, 0.36],
            defaultPosition: [0.32, -0.06, 0.36],
            heldBy: null,
            tiltAngle: 0,
        },
    ]);

    const itemsRef = useRef<InteractiveWorkbenchItem[]>(items);
    itemsRef.current = items;

    // ─── Xác định hóa chất tham chiếu (chỉ khi có chất đang nằm trong cốc/bình trên bàn hoặc đang cầm trên tay) ───
    const refChemical = useMemo(() => {
        // Chỉ lấy chất khi Cốc thủy tinh hoặc Bình tam giác đã có hóa chất (fillLevel > 0)
        const tableItemWithChem = items.find((it) => it.type !== "reagent-bottle" && it.chemical && it.fillLevel > 0);
        if (tableItemWithChem?.chemical) return tableItemWithChem.chemical;
        // Hoặc đang cầm trên tay 1 bình có chứa hóa chất
        const heldItem = items.find((it) => it.heldBy !== null && it.chemical && it.fillLevel > 0);
        if (heldItem?.chemical) return heldItem.chemical;
        return null;
    }, [items]);

    // Handler chọn hóa chất từ Tủ Hóa Chất (GUI hoặc kệ 3D) -> Đặt ngay lên bàn thí nghiệm
    const handleSelectChemicalFromCabinet = useCallback((chem: Chemical) => {
        cabinetCooldownRef.current = performance.now() + 3500;
        playLabSound("pick");
        setActiveChemical(chem);

        // Hóa chất lấy từ tủ LUÔN nạp vào bình bên trái (bottle-reagent), KHÔNG bao giờ nạp vào cốc trộn (beaker-1)
        const targetId = "bottle-reagent";

        setSelectedItemId(targetId);
        setTeacherMode("speaking");
        setTeacherMessage(
            `Em đã lấy ${chem.name} (${chem.formula}) từ tủ hóa chất ra lọ. Hãy cầm điện thoại nghiêng rót (hoặc bấm nút Rót bên dưới) để đổ vào Cốc phản ứng nhé!`
        );
        setItems((prev) =>
            prev.map((it) =>
                it.id === targetId
                    ? {
                          ...it,
                          chemical: chem,
                          liquidColor: getDisplayLiquidColor(chem, "#2563eb"),
                          label: chem.name,
                          fillLevel: chem.state === "solid" ? 0.35 : 0.65,
                          position: [...it.defaultPosition] as [number, number, number],
                          heldBy: null,
                          tiltAngle: 0,
                          pitchAngle: 0,
                      }
                    : it
            )
        );
    }, [selectedItemId]);

    // Đồng bộ chọn hóa chất từ màn hình điều khiển điện thoại di động
    useEffect(() => {
        const handleRemoteSelect = (e: Event) => {
            const detail = (e as CustomEvent<{ chemicalId?: string; chemicalName?: string }>).detail;
            if (!detail?.chemicalId) return;
            const chem = allChemicals.find((c) => c.id === detail.chemicalId) || getChemicalById(detail.chemicalId);
            if (chem) {
                handleSelectChemicalFromCabinet(chem);
            }
        };
        window.addEventListener("remote-select-chemical", handleRemoteSelect);
        return () => window.removeEventListener("remote-select-chemical", handleRemoteSelect);
    }, [handleSelectChemicalFromCabinet]);

    // Trạng thái dòng chảy rót nước (Realistic Water Stream)
    const [pourState, setPourState] = useState<{
        active: boolean;
        sourceId: string;
        targetId: string;
        from: [number, number, number];
        to: [number, number, number];
        color: string;
    } | null>(null);

    // Bật/tắt âm thanh rót nước
    useEffect(() => {
        if (pourState?.active) {
            playLabSound("bubbles", true);
        } else {
            stopLabSound("bubbles");
        }
    }, [pourState?.active]);

    const [activeReaction, setActiveReaction] = useState<ReactionResult | null>(null);
    const [reactionPosition, setReactionPosition] = useState<[number, number, number]>([0.0, -0.06, 0.25]);

    // ─── Thao tác Rót từ nguồn sang đích (Tự động di chuyển & nghiêng rót như thật) ───
    const handleExecutePour = useCallback(
        (sourceId: string, targetId?: string) => {
            const currentList = itemsRef.current;
            const source = currentList.find((it) => it.id === sourceId);
            if (!source || source.fillLevel <= 0.05) return;

            let target = targetId ? currentList.find((it) => it.id === targetId) : null;
            if (!target) {
                const others = currentList.filter((it) => it.id !== sourceId);
                let minDist = Infinity;
                others.forEach((o) => {
                    const d = Math.hypot(source.position[0] - o.position[0], source.position[2] - o.position[2]);
                    if (d < minDist) {
                        minDist = d;
                        target = o;
                    }
                });
            }

            if (!target || target.id === source.id) return;

            const mouthHSource = getVesselMouthHeight(source.type);
            const mouthHTarget = getVesselMouthHeight(target.type);

            // 1. Tự động nâng và di chuyển bình rót tới bên trái ngay trên miệng bình nhận kèm góc nghiêng -44 độ
            const pourPos: [number, number, number] = [
                target.position[0] - 0.18,
                target.position[1] + mouthHTarget + 0.08,
                target.position[2],
            ];
            const pourTilt = -0.76; // ~-44 độ nghiêng rót hướng sang phải (+X) vào lòng cốc

            setItems((prev) =>
                prev.map((it) =>
                    it.id === source.id
                        ? {
                              ...it,
                              position: pourPos,
                              tiltAngle: pourTilt,
                              heldBy: "user",
                          }
                        : it
                )
            );

            // 2. Dòng nước/chất chảy từ mép miệng bình nguồn vào miệng bình đích
            const streamFrom: [number, number, number] = [
                pourPos[0] + 0.14,
                pourPos[1] + mouthHSource - 0.08,
                pourPos[2],
            ];
            const streamTo: [number, number, number] = [
                target.position[0],
                target.position[1] + mouthHTarget,
                target.position[2],
            ];

            const streamColor = source.liquidColor || source.chemical?.color || "#94a3b8";
            setPourState({
                active: true,
                sourceId: source.id,
                targetId: target.id,
                from: streamFrom,
                to: streamTo,
                color: streamColor,
            });

            // 3. Sau 1.4s: Thực thi phản ứng hóa học hoặc trộn dung dịch, sau đó trả bình về bàn
            setTimeout(() => {
                const sChem = source.chemical;
                const tLiquid = target!.chemical;
                const tSolid = target!.solidChemical;
                const tChem = tLiquid || tSolid;
                let reactionResult: ReactionResult | null = null;

                if (sChem && tChem) {
                    reactionResult = getReaction(sChem, tChem) || getReaction(tChem, sChem);
                }

                if (reactionResult) {
                    setActiveReaction(reactionResult);
                    setReactionPosition([target!.position[0], target!.position[1], target!.position[2]]);
                    setTeacherMode(reactionResult.type === "combustion" ? "warning" : "success");
                    setTeacherMessage(`Phản ứng hóa học xảy ra!\n${reactionResult.equation}\nHiện tượng: ${reactionResult.description}`);

                    const effectColor = reactionResult.effects.find((e) => e.targetColor)?.targetColor;

                    setItems((prev) =>
                        prev.map((it) => {
                            if (it.id === target!.id) {
                                return {
                                    ...it,
                                    chemical: sChem?.state !== "solid" ? sChem : it.chemical,
                                    solidChemical: sChem?.state === "solid" ? sChem : it.solidChemical,
                                    fillLevel: Math.min(1.0, (it.fillLevel || 0) + 0.35),
                                    liquidColor: effectColor || it.liquidColor,
                                };
                            }
                            if (it.id === source.id) {
                                return {
                                    ...it,
                                    chemical: null,
                                    solidChemical: null,
                                    fillLevel: 0,
                                    liquidColor: "transparent",
                                    label: "Lọ rỗng (Đã đổ hết)",
                                    position: [...it.defaultPosition] as [number, number, number],
                                    tiltAngle: 0,
                                    heldBy: null,
                                };
                            }
                            return it;
                        })
                    );
                } else if (!tChem && sChem) {
                    // Rót vào cốc rỗng: Chuyển toàn bộ chất từ lọ vào cốc, lọ trở thành rỗng để lấy chất tiếp theo
                    setTeacherMode("speaking");
                    setTeacherMessage(
                        sChem.state === "solid"
                            ? `Đã cho chất rắn ${sChem.name} vào ${target!.label}. Lọ đã rỗng, hãy mở Tủ Hóa Chất để chọn chất thứ hai tạo phản ứng nhé!`
                            : `Đã rót dung dịch ${sChem.name} vào ${target!.label}. Lọ đã rỗng, hãy mở Tủ Hóa Chất để chọn chất thứ hai tạo phản ứng nhé!`
                    );

                    setItems((prev) =>
                        prev.map((it) => {
                            if (it.id === target!.id) {
                                return {
                                    ...it,
                                    chemical: sChem.state !== "solid" ? sChem : null,
                                    solidChemical: sChem.state === "solid" ? sChem : null,
                                    fillLevel: sChem.state === "solid" ? 0.35 : 0.60,
                                    liquidColor: source.liquidColor || sChem.color || "#38bdf8",
                                };
                            }
                            if (it.id === source.id) {
                                return {
                                    ...it,
                                    chemical: null,
                                    solidChemical: null,
                                    fillLevel: 0,
                                    liquidColor: "transparent",
                                    label: "Lọ rỗng (Đã đổ hết)",
                                    position: [...it.defaultPosition] as [number, number, number],
                                    tiltAngle: 0,
                                    heldBy: null,
                                };
                            }
                            return it;
                        })
                    );
                } else {
                    const tName = tChem?.name || target!.label;
                    setTeacherMode("speaking");
                    setTeacherMessage(`Đã hòa trộn ${sChem?.name || source.label} vào ${target!.label} (chứa ${tName}). Hai chất này không có phản ứng hóa học trong điều kiện thường.`);

                    setItems((prev) =>
                        prev.map((it) => {
                            if (it.id === target!.id) {
                                return {
                                    ...it,
                                    chemical: sChem?.state !== "solid" ? sChem : it.chemical,
                                    solidChemical: sChem?.state === "solid" ? sChem : it.solidChemical,
                                    fillLevel: Math.min(1.0, (it.fillLevel || 0) + 0.3),
                                };
                            }
                            if (it.id === source.id) {
                                return {
                                    ...it,
                                    chemical: null,
                                    solidChemical: null,
                                    fillLevel: 0,
                                    liquidColor: "transparent",
                                    label: "Lọ rỗng (Đã đổ hết)",
                                    position: [...it.defaultPosition] as [number, number, number],
                                    tiltAngle: 0,
                                    heldBy: null,
                                };
                            }
                            return it;
                        })
                    );
                }

                setPourState(null);
            }, 1400);
        },
        [setTeacherMessage, setTeacherMode]
    );

    // ─── Tích hợp Cảm biến Con quay hồi chuyển & Cảm biến Gia tốc Điện thoại ───
    // ─── Lắng nghe phản hồi rung & âm thanh nền từ cảm biến điện thoại ───
    useEffect(() => {
        let lastShakeTime = 0;

        const unsubscribe = deviceSensors.subscribe((sensor) => {
            const now = Date.now();
            if (sensor.isShaking && now - lastShakeTime > 2000) {
                lastShakeTime = now;
                playLabSound("bubbles");
                deviceSensors.triggerHaptic([40, 60, 40]);
            }
        });

        return () => unsubscribe();
    }, []);

    // Rửa sạch 1 dụng cụ
    const handleCleanItem = useCallback((id: string) => {
        playLabSound("place");
        setItems((prev) =>
            prev.map((it) => (it.id === id ? {
                ...it,
                fillLevel: 0,
                chemical: null,
                solidChemical: null,
                liquidColor: "transparent",
                label: it.id === "bottle-reagent" ? "Lọ rỗng (Chọn chất từ tủ)" : "Cốc Trộn Phản Ứng (Rỗng)",
            } : it))
        );
        setActiveReaction(null);
    }, []);

    // Rửa sạch toàn bộ cốc phản ứng & làm mới trộn lại từ đầu
    const handleResetWorkbench = useCallback(() => {
        playLabSound("place");
        setActiveReaction(null);
        setPourState(null);
        setSelectedItemId("bottle-reagent");
        setItems((prev) =>
            prev.map((it) => {
                if (it.id === "beaker-1") {
                    return {
                        ...it,
                        chemical: null,
                        solidChemical: null,
                        fillLevel: 0,
                        liquidColor: "#38bdf8",
                        heldBy: null,
                        tiltAngle: 0,
                        pitchAngle: 0,
                        position: [...it.defaultPosition] as [number, number, number],
                    };
                }
                return {
                    ...it,
                    heldBy: null,
                    tiltAngle: 0,
                    pitchAngle: 0,
                    position: [...it.defaultPosition] as [number, number, number],
                };
            })
        );
        setTeacherMode("speaking");
        setTeacherMessage("Đã rửa sạch cốc phản ứng! Em có thể chọn chất mới từ tủ để bắt đầu thí nghiệm tiếp theo.");
    }, [setTeacherMessage, setTeacherMode]);

    // Lắng nghe sự kiện toàn cục reset bàn thí nghiệm
    useEffect(() => {
        const handleCleanEvent = () => handleResetWorkbench();
        window.addEventListener("clean-workbench", handleCleanEvent);
        return () => window.removeEventListener("clean-workbench", handleCleanEvent);
    }, [handleResetWorkbench]);

    // Cầm 1 dụng cụ lên (bằng nút hoặc tay)
    const handleGrabItem = useCallback((id: string) => {
        if (id === "bottle-reagent") {
            // Chai hóa chất chỉ cầm và tương tác khi quét QR điều khiển bằng điện thoại
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("open-remote-pairing"));
            }
            return;
        }
        // QUY TẮC AN TOÀN: Nếu đã có bất kỳ dụng cụ nào đang cầm, không cho cầm thêm!
        const currentList = itemsRef.current;
        if (currentList.some((it) => it.heldBy !== null)) {
            return;
        }
        playLabSound("pick");
        setSelectedItemId(id);
    }, []);

    // Đặt 1 dụng cụ xuống mặt bàn
    const handleReleaseItem = useCallback((id: string) => {
        playLabSound("place");
        releaseCooldownRef.current = { itemId: id, until: performance.now() + 800 };
        setItems((prev) =>
            prev.map((it) =>
                it.id === id
                    ? {
                          ...it,
                          heldBy: null,
                          position: [...it.defaultPosition] as [number, number, number],
                          tiltAngle: 0,
                          pitchAngle: 0,
                      }
                    : it
            )
        );
        setPourState(null);
    }, []);

    // Đặt lại vị trí ban đầu
    const handleResetPosition = useCallback((id: string) => {
        playLabSound("place");
        setItems((prev) =>
            prev.map((it) =>
                it.id === id
                    ? {
                          ...it,
                          heldBy: null,
                          position: [...it.defaultPosition] as [number, number, number],
                          tiltAngle: 0,
                      }
                    : it
            )
        );
    }, []);

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
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(
                (c) => c.name.toLowerCase().includes(q) || c.formula.toLowerCase().includes(q)
            );
        }
        return list;
    }, [validChemicals, selectedCategory, searchQuery]);

    const selectedItem = items.find((it) => it.id === selectedItemId) || items[0];

    return (
        <div className="w-full h-full relative">
            <WebGLErrorBoundary>
                <Canvas
                    shadows
                    gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: "default",
                        preserveDrawingBuffer: false,
                        failIfMajorPerformanceCaveat: false,
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1.15,
                    }}
                    onCreated={({ gl }) => {
                        glRef.current = gl;
                        gl.domElement.addEventListener("webglcontextlost", (e) => {
                            e.preventDefault();
                            console.warn("WebGL Context Lost, attempting recovery...");
                        });
                    }}
                >
                    <color attach="background" args={["#e2e8f0"]} />
                    <React.Suspense fallback={null}>
                        <SceneContent
                            handStateRef={actualHandRef}
                            activeChemical={activeChemical}
                            setActiveChemical={setActiveChemical}
                            teacherMessage={teacherMessage}
                            setTeacherMessage={setTeacherMessage}
                            teacherMode={teacherMode}
                            setTeacherMode={setTeacherMode}
                            items={items}
                            setItems={setItems}
                            itemsRef={itemsRef}
                            selectedItemId={selectedItemId}
                            setSelectedItemId={setSelectedItemId}
                            pourState={pourState}
                            setPourState={setPourState}
                            activeReaction={activeReaction}
                            setActiveReaction={setActiveReaction}
                            handleExecutePour={handleExecutePour}
                            show3DTeacher={show3DTeacher}
                            isFixedCamera={isFixedCamera}
                            isCabinetOpen={isCabinetOpen}
                            setIsCabinetOpen={setIsCabinetOpen}
                            isCabinetModalOpen={isCabinetModalOpen}
                            setIsCabinetModalOpen={setIsCabinetModalOpen}
                            onOpenCabinetGui={() => {
                                setIsCabinetOpen(true);
                                setIsCabinetModalOpen(true);
                            }}
                            onSelectCabinetChemical={handleSelectChemicalFromCabinet}
                            releaseCooldownRef={releaseCooldownRef}
                            cabinetCooldownRef={cabinetCooldownRef}
                            refChemical={refChemical}
                            reactionPosition={reactionPosition}
                            setReactionPosition={setReactionPosition}
                            cameraPreset={cameraPreset}
                        />
                    </React.Suspense>
                </Canvas>
            </WebGLErrorBoundary>

            {/* ─── THANH ĐIỀU KHIỂN GÓC NHÌN & CAMERA THAO TÁC ─── */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto select-none">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl backdrop-blur-xl border border-sky-400/30 bg-slate-900/90 text-white shadow-2xl shadow-sky-500/10">
                    <button
                        onClick={() => setCameraPreset("closeup")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            cameraPreset === "closeup"
                                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                                : "text-slate-300 hover:text-white hover:bg-slate-800"
                        }`}
                        title="Góc nhìn cận cảnh bàn thí nghiệm - Rõ nét nhất"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Cận Cảnh</span>
                    </button>

                    <button
                        onClick={() => setCameraPreset("pour")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            cameraPreset === "pour"
                                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                                : "text-slate-300 hover:text-white hover:bg-slate-800"
                        }`}
                        title="Góc nhìn tập trung vào cốc đong để quan sát rót dung dịch"
                    >
                        <Droplets className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Góc Rót</span>
                    </button>

                    <button
                        onClick={() => setCameraPreset("overview")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            cameraPreset === "overview"
                                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                                : "text-slate-300 hover:text-white hover:bg-slate-800"
                        }`}
                        title="Góc nhìn bao quát toàn bộ phòng thí nghiệm"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Toàn Cảnh</span>
                    </button>

                    <div className="h-4 w-px bg-slate-700/60 mx-0.5" />

                    <div className="flex items-center gap-1 px-1.5 text-[10px] text-emerald-400 font-medium">
                        <Lock className="w-3 h-3" />
                        <span>Camera cố định</span>
                    </div>
                </div>
            </div>

            {/* ─── 1. TOP-LEFT CHEMICAL SELECTION DRAWER (KHÔNG BAO GIỜ CHE BÀN THÍ NGHIỆM) ─── */}
            <div className="absolute top-16 left-4 z-20 pointer-events-auto select-none">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-sky-500/40 rounded-2xl shadow-2xl text-white transition-all overflow-hidden max-w-sm sm:max-w-md">
                    {/* Collapsed Pill Header */}
                    <div className="flex items-center justify-between gap-2.5 px-3 py-2">
                        <div
                            onClick={() => setIsCabinetModalOpen(true)}
                            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                            title="Bấm để mở Tủ Hóa Chất 107 chất"
                        >
                            <FlaskConical className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/40 truncate max-w-[150px]">
                                {activeChemical.name} ({activeChemical.formula})
                            </span>
                        </div>

                        <button
                            onClick={() => setIsCabinetModalOpen(true)}
                            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-700 hover:bg-sky-600 text-white border border-sky-500/50 transition-all flex items-center gap-1.5 shrink-0 shadow cursor-pointer"
                            title="Mở giao diện Tủ Hóa Chất 107 chất đầy đủ theo danh mục"
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Đổi chất (107)</span>
                        </button>

                        <button
                            onClick={handleResetWorkbench}
                            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/50 transition-all flex items-center gap-1.5 shrink-0 shadow cursor-pointer active:scale-95"
                            title="Đổ sạch và rửa cốc phản ứng để làm lại thí nghiệm"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                            <span className="hidden sm:inline">Rửa cốc / Trộn lại</span>
                            <span className="sm:hidden">Rửa cốc</span>
                        </button>
                    </div>

                    {/* Nội dung khi mở rộng danh sách 107 chất: Mở dọc bên trái, không đè lên bàn thí nghiệm */}
                    {isDrawerOpen && (
                        <div className="p-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
                            <div className="flex flex-col gap-2 mb-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm (HCl, NaOH, CuSO4, KMnO4...)"
                                    className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500 w-full"
                                />

                                <div className="flex items-center gap-1 flex-wrap">
                                    {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedCategory(key)}
                                            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                                                selectedCategory === key
                                                    ? "bg-sky-600 text-white shadow-sm"
                                                    : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
                                            }`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-h-36 flex-wrap">
                                {displayedChemicals.map((chem) => (
                                    <button
                                        key={chem.id}
                                        onClick={() => {
                                            setActiveChemical(chem);
                                            setIsDrawerOpen(false);
                                        }}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                                            activeChemical.id === chem.id
                                                ? "bg-emerald-600 text-white border-emerald-400 shadow-md scale-102"
                                                : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700/60"
                                        }`}
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full inline-block border border-white/20"
                                            style={{ backgroundColor: getDisplayLiquidColor(chem) }}
                                        />
                                        <span>{chem.name}</span>
                                        <span className="font-mono text-[10px] text-slate-400">
                                            ({chem.formula})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── 2. TRỢ LÝ SƯ PHẠM CÔ GIÁO MAI AI (VOICE PUSH-TO-TALK & CỬ CHỈ TAY ☝️) ─── */}
            <Lab3DAITutorVoice
                subject="chemistry"
                activeChemical={activeChemical}
                reactionBeakerChemical={items.find((it) => it.id === "beaker-1")?.chemical}
                reactionBeakerSolid={items.find((it) => it.id === "beaker-1")?.solidChemical}
                activeReaction={activeReaction}
                handStateRef={actualHandRef}
                onTeacherModeChange={(mode) => setTeacherMode(mode)}
                onTeacherMessageChange={(msg) => setTeacherMessage(msg)}
                show3DTeacher={show3DTeacher}
                onToggle3DTeacher={() => setShow3DTeacher((v) => !v)}
            />

            {/* ─── 3. DOCK ĐIỀU KHIỂN DỤNG CỤ THÍ NGHIỆM GỌN GÀNG (CONTEXTUAL ACTION DOCK) ─── */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto select-none max-w-xl w-[95%] sm:w-full">
                <div className="bg-slate-950/90 backdrop-blur-2xl border border-slate-700/70 rounded-2xl shadow-2xl p-2.5 text-white transition-all">
                    {/* Hàng 1: Tabs chọn dụng cụ trên bàn & Nút mở Tủ Hóa Chất */}
                    <div className="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-slate-800/80 overflow-x-auto">
                        <div className="flex items-center gap-1">
                            {items.map((it) => {
                                const isSel = it.id === selectedItemId;
                                const isHeld = it.heldBy !== null;
                                return (
                                    <button
                                        key={it.id}
                                        onClick={() => setSelectedItemId(it.id)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                                            isSel
                                                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30 scale-102"
                                                : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800"
                                        }`}
                                    >
                                        <span>{getVesselIcon(it.type)}</span>
                                        <span className="whitespace-nowrap">{it.label}</span>
                                        {isHeld && (it.heldBy === "phone" ? <Smartphone className="w-3 h-3 text-emerald-400 inline ml-1" /> : <Hand className="w-3 h-3 text-amber-400 inline ml-1" />)}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => setIsCabinetModalOpen(true)}
                                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-600/90 hover:bg-sky-500 text-white border border-sky-400/50 shadow transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Mở giao diện Tủ Hóa Chất 107 chất (GUI)"
                            >
                                <Layers className="w-3.5 h-3.5" />
                                <span>Tủ Hóa Chất (107)</span>
                            </button>

                            <button
                                onClick={() => setIsCabinetOpen((v) => !v)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border shadow transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isCabinetOpen
                                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600"
                                        : "bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400/50"
                                }`}
                                title="Mở hoặc đóng 2 cánh cửa kính tủ 3D"
                            >
                                {isCabinetOpen ? (
                                    <>
                                        <DoorClosed className="w-3.5 h-3.5" />
                                        <span>Đóng Cửa Tủ</span>
                                    </>
                                ) : (
                                    <>
                                        <DoorOpen className="w-3.5 h-3.5" />
                                        <span>Mở Cửa Tủ</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Hàng 2: Chi tiết dụng cụ đang chọn & Nút thao tác trực tiếp */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        {/* Chi tiết dung dịch */}
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-base border border-white/10 shrink-0 shadow-inner"
                                style={{
                                    backgroundColor: selectedItem.chemical
                                        ? `${selectedItem.liquidColor}44`
                                        : "rgba(30, 41, 59, 0.6)",
                                }}
                            >
                                {getVesselIcon(selectedItem.type)}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white truncate">{selectedItem.label}</span>
                                    <span
                                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold border ${
                                            selectedItem.heldBy
                                                ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                                : "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                        }`}
                                    >
                                        {selectedItem.heldBy === "phone" ? "📱 Cầm bằng điện thoại" : selectedItem.heldBy ? "Đang cầm" : "Trên bàn"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-300 truncate">
                                    {selectedItem.chemical ? (
                                        <>
                                            Chứa: <span className="text-emerald-400 font-semibold">{selectedItem.chemical.name}</span>{" "}
                                            <span className="font-mono text-slate-400">({selectedItem.chemical.formula})</span>
                                            {" • "}
                                            <span className="text-sky-300 font-bold">{Math.round(selectedItem.fillLevel * 100)}%</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-400">Bình trống (0%)</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Nút hành động */}
                        <div className="flex items-center gap-1.5 justify-end shrink-0">
                            {selectedItem.id === "bottle-reagent" ? (
                                isPhoneConnected ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow">
                                        <Smartphone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                        <span>Cầm điện thoại nhấc & dốc để rót</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (typeof window !== "undefined") {
                                                window.dispatchEvent(new CustomEvent("open-remote-pairing"));
                                            }
                                        }}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-emerald-400/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                        title="Quét mã QR bằng điện thoại để cầm và dốc bình bằng cảm biến thật"
                                    >
                                        <Smartphone className="w-3.5 h-3.5" />
                                        <span>Quét QR để cầm bình</span>
                                    </button>
                                )
                            ) : (
                                selectedItem.heldBy ? (
                                    <button
                                        onClick={() => handleReleaseItem(selectedItem.id)}
                                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow border border-amber-400/50 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                        title="Đặt dụng cụ này xuống bàn"
                                    >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                        <span>Đặt xuống</span>
                                    </button>
                                ) : null
                            )}

                            {/* Nút Rửa sạch dụng cụ */}
                            {selectedItem.fillLevel > 0 && (
                                <button
                                    onClick={() => handleCleanItem(selectedItem.id)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 shadow transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Rửa sạch dung dịch trong bình này"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Rửa bình</span>
                                </button>
                            )}

                            {/* Nút Làm sạch toàn bộ bàn thí nghiệm */}
                            <button
                                onClick={handleResetWorkbench}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 shadow flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                title="Rửa sạch cốc và làm mới bàn thí nghiệm"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                <span>Làm sạch bàn</span>
                            </button>

                            <button
                                onClick={() => handleResetPosition(selectedItem.id)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs p-1.5 rounded-xl border border-slate-700 flex items-center justify-center cursor-pointer"
                                title="Đặt lại vị trí ban đầu"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Hướng dẫn tương tác tự nhiên như ngoài đời thật */}
                    <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 text-center">
                        <span className="text-[10px] text-sky-300 font-medium flex items-center justify-center gap-1.5 flex-wrap">
                            <span className="text-amber-300 font-semibold">📱 Cầm điện thoại nghiêng để dốc rót bình • Lắc điện thoại để trộn phản ứng</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-sky-300 font-semibold">🤟 Giơ 3 ngón tay để hỏi Cô giáo AI</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── BẢNG KẾT QUẢ PHẢN ỨNG NỔI (FLOATING REACTION INFO) GIỐNG 2D ─── */}
            {activeReaction && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full px-4 animate-in fade-in zoom-in-95 pointer-events-auto">
                    <div className="relative">
                        <button
                            onClick={() => setActiveReaction(null)}
                            className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-slate-800/90 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center text-sm shadow-md transition-colors cursor-pointer"
                            title="Đóng bảng phản ứng"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <ReactionInfo
                            reaction={activeReaction}
                            onReset={() => {
                                setActiveReaction(null);
                                // Dọn sạch các bình trên bàn về rỗng để làm thí nghiệm mới
                                setItems((prev) =>
                                    prev.map((it) =>
                                        it.type !== "reagent-bottle"
                                            ? { ...it, chemical: null, fillLevel: 0, liquidColor: "#38bdf8" }
                                            : it
                                    )
                                );
                                playLabSound("place");
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ─── MODAL GUI TỦ HÓA CHẤT TOÀN DIỆN 107 CHẤT (PHÂN LOẠI CATEGORY & ĐẶT LÊN BÀN) ─── */}
            <Lab3DChemicalCabinetModal
                isOpen={isCabinetModalOpen}
                onClose={() => {
                    setIsCabinetModalOpen(false);
                    cabinetCooldownRef.current = performance.now() + 3500;
                }}
                onSelectChemical={handleSelectChemicalFromCabinet}
                activeChemicalId={activeChemical.id}
                handStateRef={actualHandRef}
                refChemical={refChemical}
            />
        </div>
    );
}
