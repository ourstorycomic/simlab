"use client";

/**
 * ─── Lab3DPhysicsScene ───
 * Phòng thí nghiệm Vật Lý 3D Đa Phương Thức Sư Phạm Chuẩn GDPT 2018 (Multi-Input 60+ FPS):
 * - 🎯 Con Lắc Đơn Động Học & Động Lực Học:
 *    + Thước đo góc bán nguyệt định hướng (Protractor) độ nét cao phía sau quỹ đạo, vạch chia 5° & nhãn 10°
 *    + Cung quỹ đạo phát sáng giữa hai biên dao động ±α₀ & cung quét góc động α(t)
 *    + Hệ véc-tơ lực 3D: Trọng lực P⃗ = mg (đỏ), Lực căng dây T⃗ (xanh lam), Vận tốc v⃗ (xanh lục)
 *    + Chống giật & chống rớt tay: Grace period 7 frames debounce & EMA filter làm mượt góc
 *    + Bảo toàn cơ năng: Biểu đồ thanh năng lượng thời gian thực (Động năng W_đ, Thế năng W_t, Cơ năng W)
 *    + Thay đổi môi trường Trọng trường (Trái Đất, Mặt Trăng, Sao Hỏa, Sao Mộc), chiều dài l, khối lượng m
 * - ⚡ Mạch Điện Định Luật Ôm 3D:
 *    + Dòng electron (e⁻) phát sáng chuyển dời có hướng theo chu trình mạch kín tỉ lệ với I = U/R
 *    + Vôn kế số 3D (Digital Voltmeter) mắc song song đo U_R & Ampe kế kim đo dòng I
 *    + Phân tích định luật Ôm I = U/R, Công suất P = U*I, Định luật Jun - Len-xơ Q = I²*R*t
 * - 🔍 Quang Học Thấu Kính 3D:
 *    + Vật sáng AB ngọn nến, màn hứng ảnh A'B' tự động theo công thức thấu kính 1/f = 1/d + 1/d'
 *    + 3 Tia sáng đặc biệt chuẩn SGK Vật Lý 11: // Trục chính → Qua F', Qua O → Truyền thẳng, Qua F → // Trục chính
 *    + Đánh dấu rõ ràng quang tâm O, tiêu điểm F, F' trên ray quang học
 * - 📊 Deep Physics Educational HUD:
 *    + Bảng phân tích công thức kèm bước thế số thời gian thực (Step-by-step live substitution)
 */

import React, { useRef, useState, useMemo, MutableRefObject, useCallback, memo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";

import { HandState, DEFAULT_HAND_STATE } from "@/lib/handTracking";
import { playLabSound } from "./ChemistryRealisticModels";
import { deviceSensors } from "@/lib/deviceSensors";
import PhysicsLabRoom from "./PhysicsRoom";
import Lab3DAITeacher from "./Lab3DAITeacher";
import Lab3DAITutorVoice from "./Lab3DAITutorVoice";
import {
    Zap,
    Timer,
    Search,
    Globe,
    Hand,
    MousePointer,
    BarChart2,
    Sliders,
    Target,
    Sparkles as SparklesIcon,
    Ruler,
    Compass,
    Activity,
    Eye,
    ChevronDown,
    ChevronUp,
    RefreshCw,
} from "lucide-react";

export type PhysicsExperiment = "pendulum" | "circuit" | "optics" | "all";

// Môi trường trọng lực các thiên thể chuẩn Vật Lý Thiên Văn
export const PLANET_GRAVITY: Record<string, { name: string; g: number; desc: string }> = {
    earth: { name: "Trái Đất", g: 9.81, desc: "Trọng trường tiêu chuẩn (9.81 m/s²)" },
    moon: { name: "Mặt Trăng", g: 1.62, desc: "Trọng lực yếu (~1/6 Trái Đất, dao động cực chậm)" },
    mars: { name: "Sao Hỏa", g: 3.71, desc: "Trọng trường Sao Hỏa (~0.38g)" },
    jupiter: { name: "Sao Mộc", g: 24.79, desc: "Trọng trường cực mạnh (~2.5g, dao động dồn dập)" },
};

export interface PendulumMetrics {
    angleDeg: number;
    angleRad: number;
    maxAngleDeg: number;
    period: number;
    velocity: number;
    tangentialAcc: number;
    tension: number;
    gravityForce: number;
    potentialEnergy: number;
    kineticEnergy: number;
    totalEnergy: number;
    isHeld: boolean;
}

// ─────────────────────────────────────────────────────────────
// 0. SUBCOMPONENT: 3D VECTOR ARROW (Mũi Tên Véc-tơ Động Lực Học)
// ─────────────────────────────────────────────────────────────
function VectorArrow3D({
    start,
    direction,
    magnitude,
    color,
    label,
    shaftRadius = 0.007,
    headLength = 0.05,
    headRadius = 0.022,
    visible = true,
}: {
    start: [number, number, number];
    direction: [number, number, number];
    magnitude: number;
    color: string;
    label: string;
    shaftRadius?: number;
    headLength?: number;
    headRadius?: number;
    visible?: boolean;
}) {
    if (!visible || magnitude <= 0.005) return null;
    const clampedMag = Math.max(0.08, Math.min(0.9, magnitude));
    const shaftLen = Math.max(0.01, clampedMag - headLength);
    const dirVec = new THREE.Vector3(...direction).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dirVec);

    const shaftPos = dirVec.clone().multiplyScalar(shaftLen / 2).add(new THREE.Vector3(...start));
    const headPos = dirVec.clone().multiplyScalar(shaftLen + headLength / 2).add(new THREE.Vector3(...start));
    const textPos = dirVec.clone().multiplyScalar(clampedMag + 0.05).add(new THREE.Vector3(...start));

    return (
        <group>
            {/* Thân mũi tên (Shaft) */}
            <mesh position={[shaftPos.x, shaftPos.y, shaftPos.z]} quaternion={quat}>
                <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLen, 12]} />
                <meshBasicMaterial color={color} />
            </mesh>
            {/* Đầu nón mũi tên (Cone Head) */}
            <mesh position={[headPos.x, headPos.y, headPos.z]} quaternion={quat}>
                <coneGeometry args={[headRadius, headLength, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>
            {/* Nhãn ký hiệu véc-tơ và độ lớn 3D */}
            <Text
                position={[textPos.x, textPos.y, textPos.z]}
                fontSize={0.032}
                color={color}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.004}
                outlineColor="#020617"
            >
                {label}
            </Text>
        </group>
    );
}

// ─────────────────────────────────────────────────────────────
// 1. CON LẮC ĐƠN: THƯỚC ĐO GÓC ĐỊNH HƯỚNG BÁN NGUYỆT PHÍA SAU
// ─────────────────────────────────────────────────────────────
function PendulumProtractor({
    length,
    currentAngle,
    maxAngle,
    visible = true,
}: {
    length: number;
    currentAngle: number; // rad
    maxAngle: number; // rad
    visible?: boolean;
}) {
    // 1. Tấm quạt bán nguyệt mờ sang trọng phía sau (Sector Backing Plate)
    const sectorGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        const rIn = 0.22;
        const rOut = length + 0.16;
        const minDeg = -65;
        const maxDeg = 65;
        const steps = 48;

        for (let i = 0; i <= steps; i++) {
            const deg = minDeg + (maxDeg - minDeg) * (i / steps);
            const rad = (deg * Math.PI) / 180;
            const x = rIn * Math.sin(rad);
            const y = -rIn * Math.cos(rad);
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        for (let i = steps; i >= 0; i--) {
            const deg = minDeg + (maxDeg - minDeg) * (i / steps);
            const rad = (deg * Math.PI) / 180;
            const x = rOut * Math.sin(rad);
            const y = -rOut * Math.cos(rad);
            shape.lineTo(x, y);
        }
        shape.closePath();
        return new THREE.ShapeGeometry(shape);
    }, [length]);

    // 2. Cung tròn quỹ đạo phát sáng giữa hai biên [-alpha0, +alpha0]
    const currentAmp = Math.max(0.04, Math.abs(maxAngle));
    const trajectoryArcGeom = useMemo(() => {
        const shape = new THREE.Shape();
        const rIn = length - 0.008;
        const rOut = length + 0.008;
        const steps = 36;
        const minA = -currentAmp;
        const maxA = currentAmp;

        for (let i = 0; i <= steps; i++) {
            const a = minA + (maxA - minA) * (i / steps);
            const x = rIn * Math.sin(a);
            const y = -rIn * Math.cos(a);
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        for (let i = steps; i >= 0; i--) {
            const a = minA + (maxA - minA) * (i / steps);
            const x = rOut * Math.sin(a);
            const y = -rOut * Math.cos(a);
            shape.lineTo(x, y);
        }
        shape.closePath();
        return new THREE.ShapeGeometry(shape);
    }, [length, currentAmp]);

    // 3. Quạt quét góc tức thời giữa VTCB (0 rad) và currentAngle
    const sweepWedgeGeom = useMemo(() => {
        const absA = Math.abs(currentAngle);
        if (absA < 0.01) return null;
        const shape = new THREE.Shape();
        const rIn = 0.15;
        const rOut = length + 0.04;
        const steps = 24;
        const sign = currentAngle >= 0 ? 1 : -1;

        shape.moveTo(0, -rIn);
        for (let i = 0; i <= steps; i++) {
            const a = sign * absA * (i / steps);
            const x = rOut * Math.sin(a);
            const y = -rOut * Math.cos(a);
            shape.lineTo(x, y);
        }
        shape.lineTo(0, -rIn);
        shape.closePath();
        return new THREE.ShapeGeometry(shape);
    }, [length, currentAngle]);

    if (!visible) return null;

    // Vạch độ định hướng: mỗi 5 độ có vạch phụ, mỗi 10 độ có vạch chính kèm số
    const degreeTicks = [-60, -50, -45, -40, -30, -20, -15, -10, 0, 10, 15, 20, 30, 40, 45, 50, 60];
    const minorTicks = [-55, -35, -25, -5, 5, 25, 35, 55];

    return (
        <group position={[0, 0, -0.055]}>
            {/* Tấm nền bảng thước đo góc bán nguyệt (Frosted Glass Acrylic Backing) */}
            <mesh geometry={sectorGeometry}>
                <meshStandardMaterial
                    color="#090f1d"
                    transparent
                    opacity={0.88}
                    roughness={0.4}
                    metalness={0.2}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Viền sáng cung ngoài cùng (Outer Arc Rim) */}
            <mesh position={[0, 0, 0.002]}>
                <ringGeometry args={[length + 0.155, length + 0.162, 64, 1, Math.PI * 1.5 - 1.134, 2.268]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            {/* Viền sáng cung đo lường chính (Measurement Arc Rim) */}
            <mesh position={[0, 0, 0.002]}>
                <ringGeometry args={[length - 0.002, length + 0.002, 64, 1, Math.PI * 1.5 - 1.134, 2.268]} />
                <meshBasicMaterial color="#64748b" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>

            {/* Quạt quét góc tức thời sống động (Dynamic Angle Sweep Wedge) */}
            {sweepWedgeGeom && (
                <mesh geometry={sweepWedgeGeom} position={[0, 0, 0.004]}>
                    <meshBasicMaterial
                        color={currentAngle >= 0 ? "#f59e0b" : "#38bdf8"}
                        transparent
                        opacity={0.18}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {/* Cung quỹ đạo dao động phát sáng giữa 2 biên (Glowing Oscillation Trajectory) */}
            <mesh geometry={trajectoryArcGeom} position={[0, 0, 0.006]}>
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} side={THREE.DoubleSide} />
            </mesh>

            {/* Điểm mốc biên âm (-α₀) và biên dương (+α₀) */}
            {[-currentAmp, currentAmp].map((amp, idx) => (
                <group key={`turning-point-${idx}`} position={[length * Math.sin(amp), -length * Math.cos(amp), 0.008]}>
                    <mesh>
                        <circleGeometry args={[0.018, 16]} />
                        <meshBasicMaterial color="#f59e0b" />
                    </mesh>
                    <Text
                        position={[amp >= 0 ? 0.06 : -0.06, 0.03, 0.002]}
                        fontSize={0.032}
                        color="#fbbf24"
                        anchorX={amp >= 0 ? "left" : "right"}
                        anchorY="middle"
                        outlineWidth={0.003}
                        outlineColor="#0f172a"
                    >
                        {amp >= 0 ? `+α₀ (${((amp * 180) / Math.PI).toFixed(1)}°)` : `-α₀ (-${((Math.abs(amp) * 180) / Math.PI).toFixed(1)}°)`}
                    </Text>
                </group>
            ))}

            {/* Đường gióng chuẩn Vị Trí Cân Bằng 0° (VTCB) */}
            <mesh position={[0, -(length + 0.02) / 2, 0.004]}>
                <boxGeometry args={[0.003, length + 0.02, 0.001]} />
                <meshBasicMaterial color="#22c55e" transparent opacity={0.85} />
            </mesh>

            {/* Các tia bán kính hướng tâm chính (Radial Guide Rays) */}
            {[-60, -45, -30, -15, 15, 30, 45, 60].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const rMid = (0.24 + length + 0.14) / 2;
                const rayLen = length + 0.14 - 0.24;
                return (
                    <group key={`ray-${deg}`} rotation={[0, 0, -rad]} position={[0, 0, 0.003]}>
                        <mesh position={[0, -rMid, 0]}>
                            <boxGeometry args={[0.0012, rayLen, 0.001]} />
                            <meshBasicMaterial color="#334155" transparent opacity={0.4} />
                        </mesh>
                    </group>
                );
            })}

            {/* Vạch chia độ chính & nhãn số góc 3D */}
            {degreeTicks.map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const isZero = deg === 0;
                const isMajor = Math.abs(deg) % 15 === 0 || Math.abs(deg) % 10 === 0;
                const tickLen = isZero ? 0.10 : isMajor ? 0.07 : 0.045;
                const tickR = length;
                const textR = length + 0.095;

                return (
                    <group key={`tick-${deg}`}>
                        {/* Vạch chia thước */}
                        <group rotation={[0, 0, -rad]} position={[0, 0, 0.005]}>
                            <mesh position={[0, -tickR, 0]}>
                                <boxGeometry args={[isZero ? 0.004 : 0.0022, tickLen, 0.001]} />
                                <meshBasicMaterial color={isZero ? "#22c55e" : isMajor ? "#cbd5e1" : "#64748b"} />
                            </mesh>
                        </group>

                        {/* Nhãn số đo góc */}
                        <Text
                            position={[textR * Math.sin(rad), -textR * Math.cos(rad), 0.008]}
                            fontSize={isZero ? 0.042 : 0.03}
                            color={isZero ? "#4ade80" : isMajor ? "#e2e8f0" : "#94a3b8"}
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.004}
                            outlineColor="#020617"
                        >
                            {isZero ? "0° VTCB" : `${deg > 0 ? "+" : ""}${deg}°`}
                        </Text>
                    </group>
                );
            })}

            {/* Vạch chia độ phụ (Minor 5° ticks) */}
            {minorTicks.map((deg) => {
                const rad = (deg * Math.PI) / 180;
                return (
                    <group key={`minor-tick-${deg}`} rotation={[0, 0, -rad]} position={[0, 0, 0.005]}>
                        <mesh position={[0, -length, 0]}>
                            <boxGeometry args={[0.0014, 0.03, 0.001]} />
                            <meshBasicMaterial color="#475569" />
                        </mesh>
                    </group>
                );
            })}

            {/* Tiêu đề & Hướng dẫn đọc trên bảng thước */}
            <Text position={[0, -0.16, 0.006]} fontSize={0.038} color="#38bdf8" anchorX="center">
                THƯỚC ĐO GÓC ĐỊNH HƯỚNG QUỸ ĐẠO
            </Text>
            <Text position={[0, -0.21, 0.006]} fontSize={0.022} color="#94a3b8" anchorX="center">
                Vạch chia 5° • Cung dao động ±α₀ • Tia VTCB 0°
            </Text>
        </group>
    );
}

// ─────────────────────────────────────────────────────────────
// 1. CON LẮC ĐƠN 3D CHUẨN SƯ PHẠM (Pendulum Component)
// ─────────────────────────────────────────────────────────────
function Pendulum3D({
    position = [0, -0.16, 0],
    handPosRef,
    indexTipRef,
    isHoldingRef,
    onMetricsUpdate,
    manualAngleTrigger,
    setOrbitEnabled,
    length = 1.35,
    mass = 0.5,
    gravity = 9.81,
    showProtractor = true,
    showVectors = true,
    showTrajectory = true,
}: {
    position?: [number, number, number];
    handPosRef: MutableRefObject<[number, number, number]>;
    indexTipRef?: MutableRefObject<[number, number, number]>;
    isHoldingRef: MutableRefObject<boolean>;
    onMetricsUpdate?: (m: PendulumMetrics) => void;
    manualAngleTrigger?: { angleRad: number; timestamp: number } | null;
    setOrbitEnabled: (enabled: boolean) => void;
    length?: number;
    mass?: number;
    gravity?: number;
    showProtractor?: boolean;
    showVectors?: boolean;
    showTrajectory?: boolean;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const bobRef = useRef<THREE.Mesh>(null);
    const rodRef = useRef<THREE.Mesh>(null);
    const pivotRef = useRef<THREE.Group>(null);
    const auraRef = useRef<THREE.Mesh>(null);
    const lastAngleReportRef = useRef<number>(24.1);

    // Chống rung nháy camera & mất kết nối tay (Hold Grace Debounce Counter)
    const unholdFramesRef = useRef<number>(0);
    const justReleasedTimeRef = useRef<number>(0);

    // Chuột / Touch Dragging State
    const isPointerDragging = useRef(false);

    // Tần số góc & chu kỳ lý thuyết: ω = √(g/l), T = 2π/ω
    const omega = Math.sqrt(gravity / Math.max(0.1, length));
    const period = (2 * Math.PI) / omega;

    const state = useRef({
        angle: 0.42, // rad (~24.1 độ)
        initialAngle: 0.42,
        velocity: 0,
        isHeld: false,
        time: 0,
        lastReportTime: 0,
    });

    // Lắng nghe lệnh kéo góc từ nút bấm / slider bên ngoài UI
    useEffect(() => {
        if (manualAngleTrigger) {
            state.current.angle = manualAngleTrigger.angleRad;
            state.current.initialAngle = manualAngleTrigger.angleRad;
            state.current.time = 0;
            state.current.velocity = 0;
            state.current.isHeld = false;
            playLabSound("place");
        }
    }, [manualAngleTrigger]);

    useFrame((_, delta) => {
        const s = state.current;
        const clampedDelta = Math.min(delta, 0.05);
        const handPos = handPosRef.current;
        const indexTip = indexTipRef?.current || handPos;
        const isHolding = isHoldingRef.current;

        // Vị trí thế giới của quả nặng kim loại
        const bobWorldPos = new THREE.Vector3();
        if (bobRef.current) bobRef.current.getWorldPosition(bobWorldPos);

        // Lấy tọa độ thế giới của trục quay
        const pivotWorldPos = new THREE.Vector3();
        if (pivotRef.current) pivotRef.current.getWorldPosition(pivotWorldPos);

        // Khoảng cách theo mặt phẳng chiếu 2D
        const dPalm = Math.hypot(handPos[0] - bobWorldPos.x, handPos[1] - bobWorldPos.y);
        const dTip = Math.hypot(indexTip[0] - bobWorldPos.x, indexTip[1] - bobWorldPos.y);
        const dist2D = Math.min(dPalm, dTip);

        // Bán kính tiếp cận mở rộng: 45cm khi bắt đầu chạm, 90cm khi đang cầm kéo
        const isHandNear = dist2D < (s.isHeld ? 0.90 : 0.45);
        const canGrab = isHolding && isHandNear;

        if (isPointerDragging.current) {
            // Đang điều khiển trực tiếp bằng chuột qua màn phẳng tàng hình
            s.time = 0;
            s.velocity = 0;
            s.initialAngle = s.angle;
        } else if (s.isHeld) {
            // ─── ĐANG ĐƯỢC CẦM BỞI BÀN TAY AI (ĐÃ CÓ DEBOUNCE CHỐNG GIẬT / RỚT) ───
            if (isHolding && dist2D < 0.90) {
                unholdFramesRef.current = 0;
                const deltaX = handPos[0] - pivotWorldPos.x;
                const deltaY = handPos[1] - pivotWorldPos.y;
                const rawTargetAngle = Math.atan2(deltaX, -deltaY);
                const clampedTarget = THREE.MathUtils.clamp(rawTargetAngle, -1.15, 1.15);

                // Bộ lọc làm mượt hàm mũ (EMA Filter) khử nhiễu rung webcam
                s.angle = THREE.MathUtils.lerp(s.angle, clampedTarget, Math.min(1, delta * 14));
                s.initialAngle = s.angle;
                s.velocity = 0;
                s.time = 0;
            } else if (dist2D < 0.90 && unholdFramesRef.current < 12) {
                // Vùng đệm 12 frame (~200ms): Bỏ qua hiện tượng nháy nhận diện bàn tay tạm thời, chống rớt giữa chừng
                unholdFramesRef.current++;
                s.time = 0;
                s.velocity = 0;
            } else {
                // Người dùng thực sự xòe tay ra hoặc rút tay ra xa -> THẢ DAO ĐỘNG ĐIỀU HÒA TỰ DO!
                s.isHeld = false;
                unholdFramesRef.current = 0;
                s.initialAngle = Math.abs(s.angle) < 0.04 ? (s.angle < 0 ? -0.04 : 0.04) : s.angle;
                s.time = 0;
                s.velocity = 0;
                justReleasedTimeRef.current = performance.now() + 3500;
                playLabSound("place");
            }
        } else if (canGrab) {
            // Bắt đầu nhấc quả lắc
            unholdFramesRef.current = 0;
            s.isHeld = true;
            playLabSound("pick");
            const deltaX = handPos[0] - pivotWorldPos.x;
            const deltaY = handPos[1] - pivotWorldPos.y;
            const targetAngle = Math.atan2(deltaX, -deltaY);
            s.angle = THREE.MathUtils.clamp(targetAngle, -1.15, 1.15);
            s.initialAngle = s.angle;
            s.velocity = 0;
            s.time = 0;
        } else {
            // ─── DAO ĐỘNG TỰ DO DƯỚI TÁC DỤNG TRỌNG LỰC CỦA THIÊN THỂ ───
            const now = performance.now();
            const sensor = deviceSensors.getData();
            const isFreeOscillating = now < justReleasedTimeRef.current;

            if (!isFreeOscillating && sensor.isShaking) {
                // Lắc điện thoại -> truyền xung dao động
                s.initialAngle = s.angle >= 0 ? 0.62 : -0.62;
                s.time = 0;
                s.velocity = 0;
            } else if (!isFreeOscillating && Math.abs(sensor.roll) > 16 && (Date.now() - sensor.lastUpdated < 350)) {
                // Nghiêng điện thoại -> lệch theo trọng lực góc nghiêng
                const targetRollAngle = -(sensor.roll * Math.PI) / 180;
                s.angle = THREE.MathUtils.lerp(s.angle, THREE.MathUtils.clamp(targetRollAngle, -1.1, 1.1), delta * 8);
                s.initialAngle = s.angle;
                s.time = 0;
            } else {
                // Dao động điều hòa tắt dần tự nhiên
                s.time += clampedDelta;
                const damping = Math.exp(-0.025 * s.time);
                s.angle = s.initialAngle * Math.cos(omega * s.time) * damping;
                s.velocity = -omega * s.initialAngle * Math.sin(omega * s.time) * damping;
            }
        }

        // Cập nhật góc quay của thanh treo
        if (pivotRef.current) {
            pivotRef.current.rotation.z = s.angle;
        }

        // Vòng hào quang bắt dính (Magnetic Grab Halo)
        if (auraRef.current) {
            auraRef.current.visible = s.isHeld || isHandNear || isPointerDragging.current;
            const mat = auraRef.current.material as THREE.MeshBasicMaterial;
            if (mat) {
                mat.color.set(s.isHeld || isPointerDragging.current ? "#22c55e" : "#38bdf8");
                mat.opacity = s.isHeld || isPointerDragging.current ? 0.85 : 0.5;
            }
        }

        // ─── TÍNH TOÁN CÁC THÔNG SỐ VẬT LÝ CHUẨN SƯ PHẠM (KINEMATICS & DYNAMICS) ───
        const alpha = s.angle;
        const alpha0 = Math.max(0.01, Math.abs(s.initialAngle));
        // Vận tốc dài v = l * dα/dt (m/s)
        const v = s.isHeld || isPointerDragging.current ? 0 : s.velocity * length;
        // Gia tốc tiếp tuyến a_t = -g * sin(α)
        const a_t = -gravity * Math.sin(alpha);
        // Trọng lực P = mg (N)
        const P_gravity = mass * gravity;
        // Lực căng dây: T = m * (g*(3cosα - 2cosα0))
        const T_tension = mass * Math.max(0, gravity * (3 * Math.cos(alpha) - 2 * Math.cos(alpha0)));
        // Thế năng trọng trường (mốc thế năng tại VTCB): W_t = mgl(1 - cosα)
        const W_t = Math.max(0, mass * gravity * length * (1 - Math.cos(alpha)));
        // Cơ năng toàn phần: W = mgl(1 - cosα0)
        const W_total = Math.max(0.001, mass * gravity * length * (1 - Math.cos(alpha0)));
        // Động năng: W_đ = W - W_t = 1/2 * m * v²
        const W_d = Math.max(0, W_total - W_t);

        // Báo cáo số liệu về HUD sau mỗi 75ms
        const now = performance.now();
        if (now - s.lastReportTime > 75) {
            s.lastReportTime = now;
            const curDeg = Number(((alpha * 180) / Math.PI).toFixed(1));
            lastAngleReportRef.current = curDeg;

            onMetricsUpdate?.({
                angleDeg: curDeg,
                angleRad: alpha,
                maxAngleDeg: Number(((alpha0 * 180) / Math.PI).toFixed(1)),
                period: Number(period.toFixed(2)),
                velocity: Number(v.toFixed(2)),
                tangentialAcc: Number(a_t.toFixed(2)),
                tension: Number(T_tension.toFixed(2)),
                gravityForce: Number(P_gravity.toFixed(2)),
                potentialEnergy: Number(W_t.toFixed(3)),
                kineticEnergy: Number(W_d.toFixed(3)),
                totalEnergy: Number(W_total.toFixed(3)),
                isHeld: s.isHeld || isPointerDragging.current,
            });
        }
    });

    // ─── Mouse / Touch Handlers for Direct 3D Dragging ───
    const handlePointerDown = (e: any) => {
        e.stopPropagation();
        try {
            e.target.setPointerCapture(e.pointerId);
        } catch {}
        isPointerDragging.current = true;
        setOrbitEnabled(false);
        justReleasedTimeRef.current = performance.now() + 3500;
        playLabSound("pick");
    };

    const handlePointerMove = (e: any) => {
        if (!isPointerDragging.current) return;
        e.stopPropagation();
        const pivotWorldPos = new THREE.Vector3();
        if (pivotRef.current) pivotRef.current.getWorldPosition(pivotWorldPos);
        const deltaX = e.point.x - pivotWorldPos.x;
        const deltaY = e.point.y - pivotWorldPos.y;
        const targetAngle = Math.atan2(deltaX, -deltaY);
        state.current.angle = THREE.MathUtils.clamp(targetAngle, -1.15, 1.15);
    };

    const handlePointerUp = (e: any) => {
        if (isPointerDragging.current) {
            e.stopPropagation();
            try {
                e.target.releasePointerCapture(e.pointerId);
            } catch {}
            isPointerDragging.current = false;
            setOrbitEnabled(true);
            state.current.initialAngle =
                Math.abs(state.current.angle) < 0.04
                    ? state.current.angle < 0
                        ? -0.04
                        : 0.04
                    : state.current.angle;
            state.current.time = 0;
            state.current.velocity = 0;
            justReleasedTimeRef.current = performance.now() + 3500;
            playLabSound("place");
        }
    };

    // Bắt sự kiện nhả chuột toàn cục
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (isPointerDragging.current) {
                isPointerDragging.current = false;
                setOrbitEnabled(true);
                state.current.initialAngle =
                    Math.abs(state.current.angle) < 0.04
                        ? state.current.angle < 0
                            ? -0.04
                            : 0.04
                        : state.current.angle;
                state.current.time = 0;
                state.current.velocity = 0;
                justReleasedTimeRef.current = performance.now() + 3500;
                playLabSound("place");
            }
        };
        window.addEventListener("pointerup", handleGlobalPointerUp);
        return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
    }, [setOrbitEnabled]);

    // Tọa độ quả nặng cục bộ so với pivot: x = l*sin(α), y = -l*cos(α)
    const curA = state.current.angle;
    const curA0 = state.current.initialAngle;
    const bobLocalPos: [number, number, number] = [length * Math.sin(curA), -length * Math.cos(curA), 0];
    const P_mag = mass * gravity;
    const T_mag = mass * Math.max(0, gravity * (3 * Math.cos(curA) - 2 * Math.cos(curA0)));
    const v_curr = state.current.velocity * length;

    return (
        <group ref={groupRef} position={position}>
            {/* 1. Chân đế gang đúc nặng vững chắc */}
            <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[0.58, 0.04, 0.48]} />
                <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.35} />
            </mesh>
            {[-0.24, 0.24].map((x, xi) =>
                [-0.19, 0.19].map((z, zi) => (
                    <mesh key={`foot-${xi}-${zi}`} position={[x, 0.01, z]}>
                        <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
                        <meshStandardMaterial color="#64748b" metalness={0.9} />
                    </mesh>
                ))
            )}

            {/* 2. Cột đứng hợp kim mạ crom */}
            <mesh position={[0, 0.88, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 1.72, 24]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
            </mesh>

            {/* Khóa siết cữ điều chỉnh độ cao */}
            <mesh position={[0, 1.55, 0]}>
                <cylinderGeometry args={[0.038, 0.038, 0.07, 16]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>

            {/* 3. Cần ngang treo con lắc */}
            <mesh position={[0.22, 1.55, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.016, 0.016, 0.46, 16]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
            </mesh>

            {/* 4. THƯỚC ĐO GÓC ĐỊNH HƯỚNG BÁN NGUYỆT PHÍA SAU QUỸ ĐẠO (PROTRACTOR) */}
            <group position={[0.42, 1.55, 0]}>
                <PendulumProtractor
                    length={length}
                    currentAngle={state.current.angle}
                    maxAngle={state.current.initialAngle}
                    visible={showProtractor}
                />
            </group>

            {/* Mặt phẳng tàng hình bắt chuột khi kéo thả quả lắc */}
            <mesh
                position={[0.42, 0.8, 0]}
                visible={false}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <planeGeometry args={[2.8, 2.8]} />
            </mesh>

            {/* 5. Cụm Trục Xoay & Dây Treo Dao Động */}
            <group ref={pivotRef} position={[0.42, 1.55, 0]}>
                {/* Ốc định vị trục xoay */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.06, 16]} />
                    <meshStandardMaterial color="#eab308" metalness={0.85} />
                </mesh>

                {/* Sợi dây mảnh chịu lực có thể co giãn theo chiều dài l */}
                <mesh ref={rodRef} position={[0, -length / 2, 0]}>
                    <cylinderGeometry args={[0.003, 0.003, length, 8]} />
                    <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.9} />
                </mesh>

                {/* Quả nặng kim loại đồng thau sáng bóng - BẤM CHUỘT HOẶC NẮM TAY KÉO */}
                <mesh
                    ref={bobRef}
                    position={[0, -length, 0]}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        document.body.style.cursor = "grab";
                    }}
                    onPointerOut={() => {
                        document.body.style.cursor = "default";
                    }}
                >
                    <sphereGeometry args={[0.11 + Math.min(0.04, mass * 0.03), 32, 32]} />
                    <meshStandardMaterial
                        color="#f59e0b"
                        metalness={0.95}
                        roughness={0.12}
                    />
                </mesh>

                {/* Vòng hào quang tương tác tay & chuột (Grab Halo) */}
                <mesh ref={auraRef} position={[0, -length, 0]} visible={false}>
                    <sphereGeometry args={[0.22, 16, 16]} />
                    <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.65} />
                </mesh>

                {/* Vạch định tâm quả lắc */}
                <mesh position={[0, -length, 0]}>
                    <cylinderGeometry args={[0.002, 0.002, 0.16, 8]} />
                    <meshBasicMaterial color="#0f172a" />
                </mesh>
            </group>

            {/* 6. HỆ VÉC-TƠ LỰC 3D TRÊN QUẢ LẮC (TRỌNG LỰC P, LỰC CĂNG T, VẬN TỐC v) */}
            {showVectors && (
                <group position={[0.42, 1.55, 0]}>
                    {/* Véc-tơ Trọng lực P⃗ = mg (Màu đỏ, luôn hướng thẳng đứng xuống) */}
                    <VectorArrow3D
                        start={bobLocalPos}
                        direction={[0, -1, 0]}
                        magnitude={0.24 * (P_mag / 4.905)}
                        color="#ef4444"
                        label={`P⃗ = ${(P_mag).toFixed(2)}N`}
                        visible={showVectors}
                    />

                    {/* Véc-tơ Lực căng dây T⃗ (Màu xanh lam, hướng dọc theo dây về trục treo) */}
                    <VectorArrow3D
                        start={bobLocalPos}
                        direction={[-Math.sin(curA), Math.cos(curA), 0]}
                        magnitude={0.24 * (T_mag / 4.905)}
                        color="#38bdf8"
                        label={`T⃗ = ${(T_mag).toFixed(2)}N`}
                        visible={showVectors}
                    />

                    {/* Véc-tơ Vận tốc tức thời v⃗ (Màu xanh lục neon, tiếp tuyến quỹ đạo) */}
                    {Math.abs(v_curr) > 0.04 && (
                        <VectorArrow3D
                            start={bobLocalPos}
                            direction={[
                                Math.cos(curA) * (v_curr > 0 ? 1 : -1),
                                Math.sin(curA) * (v_curr > 0 ? 1 : -1),
                                0,
                            ]}
                            magnitude={0.22 * Math.min(2.5, Math.abs(v_curr) / 0.75)}
                            color="#22c55e"
                            label={`v⃗ = ${Math.abs(v_curr).toFixed(2)}m/s`}
                            visible={showVectors}
                        />
                    )}
                </group>
            )}

            {/* Nhãn mô tả vật lý dưới chân đế */}
            <Text position={[0, 0.06, 0.28]} fontSize={0.042} color="#94a3b8" anchorX="center">
                Con Lắc Đơn (l = {length}m • m = {mass}kg • {gravity} m/s²)
            </Text>
        </group>
    );
}

// ─────────────────────────────────────────────────────────────
// 2. MẠCH ĐIỆN 3D: DÒNG ELECTRON PHÁT SÁNG & ĐỒNG HỒ ĐO SỐ
// ─────────────────────────────────────────────────────────────

// Hàm ánh xạ quãng đường d trên chu vi vòng dây 2.76m ra tọa độ 3D
function getWireLoopPos(distance: number): [number, number, number] {
    const d = ((distance % 2.76) + 2.76) % 2.76;
    const y = 0.048;
    if (d < 0.48) {
        // Dây 1: Từ Nguồn Pin (-) [-0.35, 0.048, -0.26] đến Cầu dao [-0.35, 0.048, 0.22]
        return [-0.35, y, -0.26 + d];
    } else if (d < 1.38) {
        // Dây 2: Từ Cầu dao [-0.35, 0.048, 0.22] đến Điện trở [0.55, 0.048, 0.22]
        return [-0.35 + (d - 0.48), y, 0.22];
    } else if (d < 1.86) {
        // Dây 3: Từ Điện trở [0.55, 0.048, 0.22] đến Bóng đèn [0.55, 0.048, -0.26]
        return [0.55, y, 0.22 - (d - 1.38)];
    } else {
        // Dây 4: Từ Bóng đèn [0.55, 0.048, -0.26] về Nguồn Pin (+) [-0.35, 0.048, -0.26]
        return [0.55 - (d - 1.86), y, -0.26];
    }
}

function AnimatedElectrons({ isClosed, currentI }: { isClosed: boolean; currentI: number }) {
    const driftOffsetRef = useRef<number>(0);
    const particlesRef = useRef<THREE.Group>(null);
    const count = 22; // 22 hạt electron phân bố đều quanh chu vi

    useFrame((_, delta) => {
        if (isClosed && currentI > 0) {
            // Vận tốc trôi v_drift tỉ lệ với dòng điện I = U/R
            const speed = currentI * 0.35; // m/s
            driftOffsetRef.current = (driftOffsetRef.current + speed * delta) % 2.76;
        }

        if (particlesRef.current) {
            const children = particlesRef.current.children;
            for (let i = 0; i < count; i++) {
                const child = children[i] as THREE.Mesh;
                if (child) {
                    const dist = (driftOffsetRef.current + (i / count) * 2.76) % 2.76;
                    const [px, py, pz] = getWireLoopPos(dist);
                    child.position.set(px, py, pz);
                }
            }
        }
    });

    return (
        <group ref={particlesRef}>
            {Array.from({ length: count }).map((_, i) => (
                <mesh key={`electron-${i}`} position={[0, 0, 0]}>
                    <sphereGeometry args={[0.016, 12, 12]} />
                    <meshBasicMaterial
                        color={isClosed ? "#38bdf8" : "#64748b"}
                        transparent
                        opacity={isClosed ? 0.95 : 0.45}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Vôn Kế Số 3D (3D Digital Multimeter)
function DigitalVoltmeter3D({ voltage, isClosed }: { voltage: number; isClosed: boolean }) {
    const measuredU = isClosed ? voltage : 0.0;
    return (
        <group position={[0.15, 0.05, 0.04]}>
            {/* Vỏ vôn kế số màu vàng công nghiệp */}
            <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[0.24, 0.04, 0.16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.022, 0]}>
                <boxGeometry args={[0.22, 0.041, 0.14]} />
                <meshStandardMaterial color="#ca8a04" roughness={0.4} />
            </mesh>
            {/* Màn hình LCD kỹ thuật số */}
            <mesh position={[0, 0.043, -0.02]} rotation={[-0.3, 0, 0]}>
                <planeGeometry args={[0.16, 0.065]} />
                <meshBasicMaterial color="#090d16" />
            </mesh>
            {/* Giá trị đo điện áp LED 7 đoạn */}
            <Text
                position={[0, 0.046, -0.018]}
                rotation={[-0.3, 0, 0]}
                fontSize={0.038}
                color={isClosed ? "#22c55e" : "#64748b"}
                anchorX="center"
                anchorY="middle"
            >
                {measuredU.toFixed(2)} V
            </Text>
            <Text position={[0, 0.045, 0.035]} fontSize={0.02} color="#fef08a" anchorX="center">
                VÔN KẾ (U_R)
            </Text>

            {/* Dây đo que đỏ (cực dương) nối vào đầu điện trở */}
            <mesh position={[0.14, 0.02, 0.06]}>
                <cylinderGeometry args={[0.003, 0.003, 0.14, 8]} />
                <meshBasicMaterial color="#ef4444" />
            </mesh>
            {/* Dây đo que đen (cực âm) */}
            <mesh position={[-0.14, 0.02, 0.06]}>
                <cylinderGeometry args={[0.003, 0.003, 0.14, 8]} />
                <meshBasicMaterial color="#1e293b" />
            </mesh>
        </group>
    );
}

function Circuit3D({
    position = [0, -0.16, 0],
    handPosRef,
    indexTipRef,
    isHoldingRef,
    isClosed,
    onToggle,
    voltage = 9,
    onVoltageChange,
    resistance = 20,
    onResistanceChange,
    showElectrons = true,
}: {
    position?: [number, number, number];
    handPosRef: MutableRefObject<[number, number, number]>;
    indexTipRef?: MutableRefObject<[number, number, number]>;
    isHoldingRef: MutableRefObject<boolean>;
    isClosed: boolean;
    onToggle: () => void;
    voltage?: number;
    onVoltageChange?: (v: number) => void;
    resistance?: number;
    onResistanceChange?: (r: number) => void;
    showElectrons?: boolean;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const switchRef = useRef<THREE.Group>(null);
    const switchAuraRef = useRef<THREE.Mesh>(null);
    const ammeterNeedleRef = useRef<THREE.Group>(null);
    const bulbGlowRef = useRef<THREE.PointLight>(null);
    const bulbMeshRef = useRef<THREE.Mesh>(null);
    const lastToggleTimeRef = useRef(0);
    const hasToggledForCurrentTouchRef = useRef(false);

    // Tính dòng điện I = U / R theo định luật Ôm
    const currentI = isClosed ? Number((voltage / resistance).toFixed(2)) : 0;

    useFrame((_, delta) => {
        // Cần gạt xoay đóng/mở
        if (switchRef.current) {
            const targetRot = isClosed ? 0 : 0.65;
            switchRef.current.rotation.z = THREE.MathUtils.lerp(
                switchRef.current.rotation.z,
                targetRot,
                Math.min(1, delta * 15)
            );
        }

        // Kim Ampe kế quay mượt mà tỉ lệ với dòng điện I
        if (ammeterNeedleRef.current) {
            const targetNeedleAngle = isClosed
                ? -0.65 + Math.min(1.3, (currentI / 1.0) * 1.3)
                : -0.65;
            ammeterNeedleRef.current.rotation.z = THREE.MathUtils.lerp(
                ammeterNeedleRef.current.rotation.z,
                targetNeedleAngle,
                Math.min(1, delta * 12)
            );
        }

        // Bóng đèn phát sáng rực rỡ tỉ lệ với công suất P = U * I
        const brightnessFactor = Math.min(2.0, currentI / 0.45);
        if (bulbGlowRef.current) {
            bulbGlowRef.current.intensity = THREE.MathUtils.lerp(
                bulbGlowRef.current.intensity,
                isClosed ? 3.8 * brightnessFactor : 0,
                Math.min(1, delta * 14)
            );
        }
        if (bulbMeshRef.current) {
            const mat = bulbMeshRef.current.material as THREE.MeshStandardMaterial;
            if (mat) {
                mat.emissiveIntensity = THREE.MathUtils.lerp(
                    mat.emissiveIntensity,
                    isClosed ? 2.8 * brightnessFactor : 0.05,
                    Math.min(1, delta * 14)
                );
            }
        }

        // Tương tác tay gạt công tắc
        const handPos = handPosRef.current;
        const indexTip = indexTipRef?.current || handPos;
        const isHolding = isHoldingRef.current;

        const switchWorldPos = new THREE.Vector3();
        if (switchRef.current) switchRef.current.getWorldPosition(switchWorldPos);

        const dPalm = Math.hypot(handPos[0] - switchWorldPos.x, (handPos[1] - switchWorldPos.y) * 0.7);
        const dTip = Math.hypot(indexTip[0] - switchWorldPos.x, (indexTip[1] - switchWorldPos.y) * 0.7);
        const dist2D = Math.min(dPalm, dTip);
        const isNear = dist2D < 0.45;

        if (switchAuraRef.current) {
            switchAuraRef.current.visible = isNear;
            const mat = switchAuraRef.current.material as THREE.MeshBasicMaterial;
            if (mat) {
                mat.color.set(isClosed ? "#22c55e" : "#38bdf8");
            }
        }

        const now = performance.now();
        const gestureTrigger = isNear && isHolding;

        if (gestureTrigger) {
            if (!hasToggledForCurrentTouchRef.current && now - lastToggleTimeRef.current > 750) {
                hasToggledForCurrentTouchRef.current = true;
                lastToggleTimeRef.current = now;
                onToggle();
                playLabSound("pick");
            }
        } else if (!isHolding && dist2D > 0.45) {
            hasToggledForCurrentTouchRef.current = false;
        }
    });

    const handleSwitchClick = (e: any) => {
        e.stopPropagation();
        onToggle();
        playLabSound("pick");
    };

    const handleBatteryClick = (e: any) => {
        e.stopPropagation();
        const vList = [3, 6, 9, 12, 24];
        const curIdx = vList.indexOf(voltage);
        const nextV = vList[(curIdx + 1) % vList.length];
        onVoltageChange?.(nextV);
        playLabSound("pick");
    };

    const handleResistanceClick = (e: any) => {
        e.stopPropagation();
        const rList = [10, 20, 30, 50, 100];
        const curIdx = rList.indexOf(resistance);
        const nextR = rList[(curIdx + 1) % rList.length];
        onResistanceChange?.(nextR);
        playLabSound("pick");
    };

    return (
        <group ref={groupRef} position={position}>
            {/* Khay đế lắp ráp mạch điện bakelite màu gỗ mun */}
            <mesh position={[0, 0.015, 0]}>
                <boxGeometry args={[1.7, 0.03, 1.05]} />
                <meshStandardMaterial color="#1e1b4b" roughness={0.4} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.031, 0]}>
                <boxGeometry args={[1.65, 0.002, 1.0]} />
                <meshStandardMaterial color="#0f172a" roughness={0.6} />
            </mesh>

            {/* ─── 1. Nguồn Pin DC ─── */}
            <group
                position={[-0.55, 0.12, -0.28]}
                onClick={handleBatteryClick}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                    document.body.style.cursor = "default";
                }}
            >
                <mesh>
                    <boxGeometry args={[0.26, 0.22, 0.16]} />
                    <meshStandardMaterial color="#dc2626" roughness={0.35} metalness={0.4} />
                </mesh>
                <mesh position={[0.07, 0.13, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.04, 16]} />
                    <meshStandardMaterial color="#ef4444" metalness={0.9} />
                </mesh>
                <Text position={[0.07, 0.17, 0]} fontSize={0.035} color="#ef4444" anchorX="center">
                    +
                </Text>
                <mesh position={[-0.07, 0.13, 0]}>
                    <cylinderGeometry args={[0.022, 0.022, 0.04, 16]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
                <Text position={[-0.07, 0.17, 0]} fontSize={0.035} color="#ffffff" anchorX="center">
                    -
                </Text>
                <Text position={[0, 0.02, 0.085]} fontSize={0.065} color="#ffffff">
                    {voltage}V DC
                </Text>
                <Text position={[0, -0.055, 0.085]} fontSize={0.022} color="#fecaca">
                    BẤM ĐỔI VÔN
                </Text>

                <group position={[0, 0.22, 0]}>
                    <mesh>
                        <planeGeometry args={[0.38, 0.075]} />
                        <meshBasicMaterial color="#090d16" transparent opacity={0.92} />
                    </mesh>
                    <Text position={[0, 0.014, 0.005]} fontSize={0.032} color="#f87171" anchorX="center">
                        NGUỒN ĐIỆN: {voltage}V
                    </Text>
                    <Text position={[0, -0.018, 0.005]} fontSize={0.018} color="#fca5a5" anchorX="center">
                        [Bấm đổi: 3V → 6V → 9V → 12V → 24V]
                    </Text>
                </group>
            </group>

            {/* ─── 2. Cầu Dao Đồng Đảo Mạch ─── */}
            <group
                position={[-0.15, 0.03, 0.22]}
                onClick={handleSwitchClick}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                    document.body.style.cursor = "default";
                }}
            >
                <mesh position={[0, 0.02, 0]}>
                    <boxGeometry args={[0.34, 0.03, 0.18]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.5} />
                </mesh>
                <mesh position={[-0.12, 0.042, 0.06]}>
                    <cylinderGeometry args={[0.018, 0.018, 0.015, 16]} />
                    <meshStandardMaterial
                        color={isClosed ? "#22c55e" : "#ef4444"}
                        emissive={isClosed ? "#22c55e" : "#ef4444"}
                        emissiveIntensity={isClosed ? 2.5 : 1.2}
                    />
                </mesh>
                <pointLight
                    position={[-0.12, 0.06, 0.06]}
                    color={isClosed ? "#22c55e" : "#ef4444"}
                    intensity={isClosed ? 1.5 : 0.4}
                    distance={0.3}
                />

                <group position={[0, 0.042, 0.055]} rotation={[-Math.PI / 2, 0, 0]}>
                    <mesh position={[0, 0, -0.001]}>
                        <planeGeometry args={[0.26, 0.05]} />
                        <meshBasicMaterial color="#0b132b" />
                    </mesh>
                    <Text position={[0, 0.008, 0.002]} fontSize={0.022} color={isClosed ? "#4ade80" : "#f87171"} anchorX="center">
                        {isClosed ? "──●─────●── [ KÍN ]" : "──●  /  ●── [ HỞ ]"}
                    </Text>
                    <Text position={[0, -0.014, 0.002]} fontSize={0.014} color={isClosed ? "#86efac" : "#fca5a5"} anchorX="center">
                        {isClosed ? `I = ${currentI.toFixed(2)}A (DẪN ĐIỆN)` : "I = 0.00A (NGẮT ĐIỆN)"}
                    </Text>
                </group>

                <mesh ref={switchAuraRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                    <ringGeometry args={[0.12, 0.22, 24]} />
                    <meshBasicMaterial color={isClosed ? "#22c55e" : "#38bdf8"} transparent opacity={0.65} side={THREE.DoubleSide} />
                </mesh>

                <mesh position={[0.09, 0.05, 0]}>
                    <boxGeometry args={[0.03, 0.045, 0.035]} />
                    <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
                </mesh>

                <group ref={switchRef} position={[-0.09, 0.05, 0]}>
                    <mesh position={[0.095, 0, 0]}>
                        <boxGeometry args={[0.19, 0.022, 0.025]} />
                        <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.15} />
                    </mesh>
                    <mesh position={[0.2, 0, 0]}>
                        <sphereGeometry args={[0.028, 16, 16]} />
                        <meshStandardMaterial color="#ef4444" roughness={0.4} />
                    </mesh>
                </group>

                <group position={[0, 0.18, 0]}>
                    <mesh position={[0, 0, -0.005]}>
                        <planeGeometry args={[0.42, 0.075]} />
                        <meshBasicMaterial color="#090d16" transparent opacity={0.92} />
                    </mesh>
                    <Text position={[0, 0.015, 0.002]} fontSize={0.032} color={isClosed ? "#4ade80" : "#f87171"} anchorX="center">
                        {isClosed ? "● CẦU DAO: ĐÓNG (BẬT)" : "○ CẦU DAO: NGẮT (TẮT)"}
                    </Text>
                    <Text position={[0, -0.018, 0.002]} fontSize={0.019} color="#94a3b8" anchorX="center">
                        [Bấm chuột hoặc Nắm tay để Gạt]
                    </Text>
                </group>
            </group>

            {/* ─── 3. Đồng Hồ Ampe Kế (Mắc Nối Tiếp Đo I) ─── */}
            <group position={[0.05, 0.08, -0.26]}>
                <mesh rotation={[0.4, 0, 0]}>
                    <cylinderGeometry args={[0.16, 0.16, 0.09, 32]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
                </mesh>
                <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2 + 0.4, 0, 0]}>
                    <circleGeometry args={[0.14, 32]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.4} />
                </mesh>
                <Text
                    position={[0, 0.05, 0.02]}
                    rotation={[-Math.PI / 2 + 0.4, 0, 0]}
                    fontSize={0.065}
                    color="#0284c7"
                    anchorX="center"
                >
                    A
                </Text>
                <group ref={ammeterNeedleRef} position={[0, 0.047, -0.01]} rotation={[-Math.PI / 2 + 0.4, 0, -0.65]}>
                    <mesh position={[0, 0.06, 0]}>
                        <boxGeometry args={[0.005, 0.11, 0.003]} />
                        <meshBasicMaterial color="#ef4444" />
                    </mesh>
                    <mesh>
                        <circleGeometry args={[0.012, 16]} />
                        <meshBasicMaterial color="#0f172a" />
                    </mesh>
                </group>
                <Text position={[-0.08, 0.05, -0.06]} rotation={[-Math.PI / 2 + 0.4, 0, 0]} fontSize={0.03} color="#475569">
                    0
                </Text>
                <Text position={[0, 0.05, -0.08]} rotation={[-Math.PI / 2 + 0.4, 0, 0]} fontSize={0.03} color="#475569">
                    0.5
                </Text>
                <Text position={[0.08, 0.05, -0.06]} rotation={[-Math.PI / 2 + 0.4, 0, 0]} fontSize={0.03} color="#475569">
                    1.0
                </Text>
                <Text position={[0, 0.14, 0]} fontSize={0.022} color="#38bdf8">
                    AMPE KẾ (Mắc nối tiếp)
                </Text>
            </group>

            {/* ─── 4. Vôn Kế Số 3D (Mắc Song Song Đo U_R) ─── */}
            <DigitalVoltmeter3D voltage={voltage} isClosed={isClosed} />

            {/* ─── 5. Điện Trở Gốm R ─── */}
            <group
                position={[0.55, 0.05, 0.22]}
                onClick={handleResistanceClick}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                    document.body.style.cursor = "default";
                }}
            >
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.032, 0.032, 0.22, 16]} />
                    <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
                </mesh>
                <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.033, 0.033, 0.02, 16]} />
                    <meshBasicMaterial color="#dc2626" />
                </mesh>
                <mesh position={[-0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.033, 0.033, 0.02, 16]} />
                    <meshBasicMaterial color="#0f172a" />
                </mesh>
                <mesh position={[0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.033, 0.033, 0.02, 16]} />
                    <meshBasicMaterial color="#0f172a" />
                </mesh>
                <mesh position={[0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.033, 0.033, 0.015, 16]} />
                    <meshBasicMaterial color="#eab308" />
                </mesh>
                <Text position={[0, 0.08, 0]} fontSize={0.042} color="#f59e0b">
                    R = {resistance} Ω
                </Text>
                <Text position={[0, 0.12, 0]} fontSize={0.022} color="#fde68a">
                    BẤM ĐỔI TRỞ (10-100Ω)
                </Text>
            </group>

            {/* ─── 6. Bóng Đèn Sợi Đốt ─── */}
            <group
                position={[0.55, 0.1, -0.26]}
                onClick={handleSwitchClick}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                    document.body.style.cursor = "default";
                }}
            >
                <mesh position={[0, -0.06, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
                    <meshStandardMaterial color="#334155" metalness={0.7} />
                </mesh>
                <mesh ref={bulbMeshRef} position={[0, 0.08, 0]}>
                    <sphereGeometry args={[0.095, 32, 32]} />
                    <meshStandardMaterial
                        color={isClosed ? "#fef08a" : "#f1f5f9"}
                        emissive={isClosed ? "#eab308" : "#000000"}
                        emissiveIntensity={isClosed ? 2.8 : 0.05}
                        transparent
                        opacity={0.88}
                        roughness={0.1}
                    />
                </mesh>
                <mesh position={[0, 0.07, 0]}>
                    <boxGeometry args={[0.03, 0.04, 0.005]} />
                    <meshBasicMaterial color={isClosed ? "#ffffff" : "#475569"} />
                </mesh>
                <pointLight
                    ref={bulbGlowRef}
                    position={[0, 0.12, 0]}
                    color="#facc15"
                    intensity={0}
                    distance={3.2}
                />
                {isClosed && (
                    <Sparkles count={16} scale={0.4} size={3} speed={1.2} color="#fde047" position={[0, 0.08, 0]} />
                )}
                <Text position={[0, 0.22, 0]} fontSize={0.04} color={isClosed ? "#fde047" : "#94a3b8"}>
                    {isClosed ? `Đèn Sáng (P = ${(voltage * currentI).toFixed(2)}W)` : "Đèn Tắt"}
                </Text>
            </group>

            {/* ─── 7. Dây Dẫn Mạch Điện Khép Kín ─── */}
            <mesh position={[-0.35, 0.035, -0.02]}>
                <boxGeometry args={[0.012, 0.012, 0.48]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0.2, 0.035, 0.22]}>
                <boxGeometry args={[0.7, 0.012, 0.012]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0.55, 0.035, -0.02]}>
                <boxGeometry args={[0.012, 0.012, 0.48]} />
                <meshStandardMaterial color="#eab308" />
            </mesh>
            <mesh position={[0.3, 0.035, -0.26]}>
                <boxGeometry args={[0.5, 0.012, 0.012]} />
                <meshStandardMaterial color="#38bdf8" />
            </mesh>
            <mesh position={[-0.25, 0.035, -0.26]}>
                <boxGeometry args={[0.2, 0.012, 0.012]} />
                <meshStandardMaterial color="#38bdf8" />
            </mesh>

            {/* ─── 8. DÒNG ELECTRON (e⁻) CHUYỂN DỜI CÓ HƯỚNG ─── */}
            {showElectrons && <AnimatedElectrons isClosed={isClosed} currentI={currentI} />}

            {/* Nhãn mô tả dòng electron */}
            <Text position={[0, 0.045, -0.42]} fontSize={0.032} color="#38bdf8" anchorX="center">
                Dòng electron tự do (e⁻) chuyển dời có hướng trong kim loại
            </Text>
        </group>
    );
}

// ─────────────────────────────────────────────────────────────
// 3. QUANG HỌC THẤU KÍNH: 3 TIA SÁNG ĐẶC BIỆT CHUẨN SGK VẬT LÝ 11
// ─────────────────────────────────────────────────────────────
const LASER_COLOR_CONFIG: Record<"red" | "green" | "blue", { hex: string; glow: string; name: string }> = {
    red: { hex: "#ef4444", glow: "#f87171", name: "Đỏ (650nm)" },
    green: { hex: "#22c55e", glow: "#86efac", name: "Lục (532nm)" },
    blue: { hex: "#3b82f6", glow: "#93c5fd", name: "Lam (450nm)" },
};

function Optics3D({
    position = [0, -0.16, 0],
    handPosRef,
    indexTipRef,
    isHoldingRef,
    lensOffset = 0.0,
    onLensOffsetChange,
    setOrbitEnabled,
    lensType = "converging",
    onLensTypeChange,
    laserColor = "red",
    onLaserColorChange,
    focalLength = 0.35,
    showSpecialRays = true,
}: {
    position?: [number, number, number];
    handPosRef: MutableRefObject<[number, number, number]>;
    indexTipRef?: MutableRefObject<[number, number, number]>;
    isHoldingRef: MutableRefObject<boolean>;
    lensOffset?: number;
    onLensOffsetChange?: (offset: number) => void;
    setOrbitEnabled: (enabled: boolean) => void;
    lensType?: "converging" | "diverging";
    onLensTypeChange?: (t: "converging" | "diverging") => void;
    laserColor?: "red" | "green" | "blue";
    onLaserColorChange?: (c: "red" | "green" | "blue") => void;
    focalLength?: number;
    showSpecialRays?: boolean;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const lensRiderRef = useRef<THREE.Group>(null);
    const lensAuraRef = useRef<THREE.Mesh>(null);
    const isDragging = useRef(false);

    useEffect(() => {
        if (lensRiderRef.current && !isDragging.current) {
            lensRiderRef.current.position.x = lensOffset;
        }
    }, [lensOffset]);

    useFrame((_, delta) => {
        const handPos = handPosRef.current;
        const indexTip = indexTipRef?.current || handPos;
        const isHolding = isHoldingRef.current;

        const lensWorldPos = new THREE.Vector3();
        if (lensRiderRef.current) lensRiderRef.current.getWorldPosition(lensWorldPos);

        const dPalm = Math.hypot(handPos[0] - lensWorldPos.x, (handPos[1] - lensWorldPos.y) * 0.7);
        const dTip = Math.hypot(indexTip[0] - lensWorldPos.x, (indexTip[1] - lensWorldPos.y) * 0.7);
        const dist2D = Math.min(dPalm, dTip);
        const isNear = dist2D < (isHolding ? 0.60 : 0.45);

        if (lensAuraRef.current) {
            lensAuraRef.current.visible = isNear || isDragging.current;
            const mat = lensAuraRef.current.material as THREE.MeshBasicMaterial;
            if (mat) {
                mat.color.set(isHolding ? "#22c55e" : "#38bdf8");
            }
        }

        if (isHolding && isNear && !isDragging.current) {
            const railWorldPos = new THREE.Vector3();
            if (groupRef.current) groupRef.current.getWorldPosition(railWorldPos);

            const targetX = THREE.MathUtils.clamp(handPos[0] - railWorldPos.x, -0.38, 0.38);
            if (lensRiderRef.current) {
                lensRiderRef.current.position.x = THREE.MathUtils.lerp(
                    lensRiderRef.current.position.x,
                    targetX,
                    Math.min(1, delta * 20)
                );
                onLensOffsetChange?.(lensRiderRef.current.position.x);
            }
        }
    });

    const handlePointerDown = (e: any) => {
        e.stopPropagation();
        isDragging.current = true;
        setOrbitEnabled(false);
        playLabSound("pick");
    };

    const handlePointerMove = (e: any) => {
        if (!isDragging.current) return;
        e.stopPropagation();
        const railWorldPos = new THREE.Vector3();
        if (groupRef.current) groupRef.current.getWorldPosition(railWorldPos);
        const targetX = THREE.MathUtils.clamp(e.point.x - railWorldPos.x, -0.38, 0.38);
        if (lensRiderRef.current) {
            lensRiderRef.current.position.x = targetX;
        }
        onLensOffsetChange?.(targetX);
    };

    const handlePointerUp = (e: any) => {
        if (isDragging.current) {
            e.stopPropagation();
            isDragging.current = false;
            setOrbitEnabled(true);
            playLabSound("place");
        }
    };

    const handleToggleLensType = (e: any) => {
        e.stopPropagation();
        const next = lensType === "converging" ? "diverging" : "converging";
        onLensTypeChange?.(next);
        playLabSound("pick");
    };

    const handleCycleLaserColor = (e: any) => {
        e.stopPropagation();
        const colors: Array<"red" | "green" | "blue"> = ["red", "green", "blue"];
        const curIdx = colors.indexOf(laserColor);
        const next = colors[(curIdx + 1) % colors.length];
        onLaserColorChange?.(next);
        playLabSound("pick");
    };

    const curLensX = lensRiderRef.current?.position.x ?? lensOffset;
    const curColor = LASER_COLOR_CONFIG[laserColor];

    // ─── TÍNH TOÁN QUANG HÌNH HỌC THEO CÔNG THỨC THẤU KÍNH MỎNG ───
    // Vật sáng AB đặt cố định tại X_obj = -0.65m trên ray quang học
    const X_obj = -0.65;
    const objHeight = 0.11; // Chiều cao ngọn nến / mũi tên h = 11cm
    const optY = 0.19; // Độ cao trục chính quang học Delta

    // Khoảng cách từ vật đến thấu kính: d = curLensX - X_obj
    const d = Math.max(0.1, curLensX - X_obj);
    const f = lensType === "converging" ? focalLength : -focalLength;

    // Công thức thấu kính: 1/f = 1/d + 1/d' => d' = (d * f) / (d - f)
    const dPrime = (d - f === 0) ? 999 : (d * f) / (d - f);
    const X_image = curLensX + dPrime;
    const magK = -dPrime / d;
    const imgHeight = objHeight * magK;

    // Vị trí tiêu điểm F và F' trên ray quang học
    const X_F = curLensX - f; // Tiêu điểm vật
    const X_Fprime = curLensX + f; // Tiêu điểm ảnh

    // Màn hứng ảnh: Đặt tại vị trí ảnh thật d' > 0 (giới hạn từ thấu kính + 0.15 đến cuối ray 0.82)
    const screenX = lensType === "converging" && dPrime > 0
        ? Math.min(0.85, Math.max(curLensX + 0.18, X_image))
        : 0.82;

    return (
        <group ref={groupRef} position={position}>
            {/* 1. Băng Quang Học Hợp Kim Nhôm (2.0m Optical Rail) */}
            <mesh position={[0, 0.025, 0]}>
                <boxGeometry args={[1.9, 0.04, 0.12]} />
                <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.047, 0]}>
                <boxGeometry args={[1.82, 0.004, 0.02]} />
                <meshBasicMaterial color="#cbd5e1" />
            </mesh>
            {[-0.8, 0, 0.8].map((rx, idx) => (
                <mesh key={idx} position={[rx, 0.01, 0]}>
                    <boxGeometry args={[0.16, 0.02, 0.22]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.7} />
                </mesh>
            ))}

            {/* Trục chính quang học Δ nét đứt thanh mảnh */}
            <mesh position={[0, optY, 0]}>
                <cylinderGeometry args={[0.001, 0.001, 1.82, 8]} />
                <meshBasicMaterial color="#64748b" transparent opacity={0.6} />
            </mesh>

            {/* Mặt phẳng tàng hình bắt chuột trượt thấu kính */}
            <mesh
                position={[0, 0.2, 0]}
                visible={false}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <planeGeometry args={[2.2, 0.6]} />
            </mesh>

            {/* 2. VẬT SÁNG AB (NGỌN NẾN SÁNG CHUẨN SGK VẬT LÝ) */}
            <group position={[X_obj, 0, 0]}>
                {/* Chân đế trượt mang vật */}
                <mesh position={[0, 0.055, 0]}>
                    <boxGeometry args={[0.08, 0.06, 0.12]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.8} />
                </mesh>
                <mesh position={[0, 0.12, 0]}>
                    <cylinderGeometry args={[0.008, 0.008, 0.08, 16]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                </mesh>
                {/* Thân nến màu trắng */}
                <mesh position={[0, optY + objHeight / 2 - 0.02, 0]}>
                    <cylinderGeometry args={[0.012, 0.012, objHeight - 0.02, 16]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.5} />
                </mesh>
                {/* Ngọn lửa phát sáng rực rỡ tại đỉnh B */}
                <mesh position={[0, optY + objHeight, 0]}>
                    <sphereGeometry args={[0.016, 16, 16]} />
                    <meshBasicMaterial color="#f59e0b" />
                </mesh>
                <pointLight position={[0, optY + objHeight, 0]} color="#fbbf24" intensity={2.5} distance={1.2} />
                <Text position={[0, optY + objHeight + 0.05, 0]} fontSize={0.032} color="#fbbf24" anchorX="center">
                    B (Đỉnh nến)
                </Text>
                <Text position={[0, optY - 0.03, 0]} fontSize={0.024} color="#94a3b8" anchorX="center">
                    A (Gốc)
                </Text>
                <Text position={[0, 0.03, 0.09]} fontSize={0.022} color="#cbd5e1" anchorX="center">
                    Vật AB (h = 11cm)
                </Text>
            </group>

            {/* 3. Giá Trượt Mang Thấu Kính */}
            <group
                ref={lensRiderRef}
                position={[curLensX, 0, 0]}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={handleToggleLensType}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = "ew-resize";
                }}
                onPointerOut={() => {
                    document.body.style.cursor = "default";
                }}
            >
                <mesh position={[0, 0.06, 0]}>
                    <boxGeometry args={[0.1, 0.07, 0.15]} />
                    <meshStandardMaterial color="#475569" metalness={0.8} />
                </mesh>
                <mesh position={[0, 0.13, 0]}>
                    <cylinderGeometry args={[0.009, 0.009, 0.12, 16]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                </mesh>
                {/* Vành gá thấu kính */}
                <mesh position={[0, optY, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <torusGeometry args={[0.088, 0.008, 16, 32]} />
                    <meshStandardMaterial color={lensType === "converging" ? "#0284c7" : "#9333ea"} metalness={0.7} />
                </mesh>
                {/* Khối thấu kính thủy tinh */}
                <mesh position={[0, optY, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <sphereGeometry args={[0.084, 32, 16, 0, Math.PI * 2, 0, lensType === "converging" ? Math.PI : Math.PI * 0.7]} />
                    <meshPhysicalMaterial
                        transmission={0.95}
                        roughness={0.04}
                        ior={1.52}
                        thickness={lensType === "converging" ? 0.06 : 0.02}
                        color={lensType === "converging" ? "#e0f2fe" : "#f3e8ff"}
                        transparent
                        opacity={0.88}
                    />
                </mesh>
                <mesh ref={lensAuraRef} position={[0, optY, 0]} visible={false}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshBasicMaterial color={lensType === "converging" ? "#38bdf8" : "#c084fc"} wireframe transparent opacity={0.65} />
                </mesh>
                {/* Đánh dấu Quang tâm O */}
                <mesh position={[0, optY, 0]}>
                    <sphereGeometry args={[0.008, 12, 12]} />
                    <meshBasicMaterial color="#38bdf8" />
                </mesh>
                <Text position={[0, optY - 0.03, 0.04]} fontSize={0.032} color="#38bdf8" anchorX="center">
                    O
                </Text>

                {/* Nhãn 3D hiển thị rõ ràng */}
                <group position={[0, 0.33, 0]}>
                    <mesh position={[0, 0, -0.005]}>
                        <planeGeometry args={[0.48, 0.075]} />
                        <meshBasicMaterial color="#090d16" transparent opacity={0.92} />
                    </mesh>
                    <Text position={[0, 0.014, 0.002]} fontSize={0.03} color={lensType === "converging" ? "#38bdf8" : "#c084fc"} anchorX="center">
                        {lensType === "converging" ? "Thấu Kính Hội Tụ (f = +35cm)" : "Thấu Kính Phân Kỳ (f = -35cm)"}
                    </Text>
                    <Text position={[0, -0.016, 0.002]} fontSize={0.018} color="#94a3b8" anchorX="center">
                        [Bấm đổi loại | Kéo để trượt ray]
                    </Text>
                </group>
            </group>

            {/* Đánh dấu Tiêu điểm vật F và Tiêu điểm ảnh F' trên ray */}
            <group position={[X_F, optY, 0]}>
                <mesh>
                    <sphereGeometry args={[0.008, 12, 12]} />
                    <meshBasicMaterial color="#f59e0b" />
                </mesh>
                <Text position={[0, -0.035, 0.03]} fontSize={0.028} color="#f59e0b" anchorX="center">
                    F
                </Text>
            </group>
            <group position={[X_Fprime, optY, 0]}>
                <mesh>
                    <sphereGeometry args={[0.008, 12, 12]} />
                    <meshBasicMaterial color="#38bdf8" />
                </mesh>
                <Text position={[0, -0.035, 0.03]} fontSize={0.028} color="#38bdf8" anchorX="center">
                    {"F'"}
                </Text>
            </group>

            {/* 4. Màn Hứng Ảnh (Screen) */}
            <group position={[screenX, 0, 0]}>
                <mesh position={[0, 0.055, 0]}>
                    <boxGeometry args={[0.08, 0.06, 0.15]} />
                    <meshStandardMaterial color="#475569" metalness={0.8} />
                </mesh>
                <mesh position={[0, 0.12, 0]}>
                    <cylinderGeometry args={[0.009, 0.009, 0.08, 16]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                </mesh>
                <mesh position={[0, optY, 0]}>
                    <boxGeometry args={[0.015, 0.28, 0.24]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.85} />
                </mesh>
                <mesh position={[-0.009, optY, 0]}>
                    <planeGeometry args={[0.26, 0.22]} />
                    <meshBasicMaterial color="#0f172a" />
                </mesh>

                {/* Nếu ảnh thật (d' > 0): Chiếu ảnh ngọn nến ngược chiều rõ nét trên màn hứng */}
                {lensType === "converging" && dPrime > 0 && Math.abs(screenX - X_image) < 0.25 && (
                    <group position={[-0.01, optY + imgHeight / 2, 0]}>
                        <mesh>
                            <cylinderGeometry args={[0.008, 0.008, Math.abs(imgHeight), 16]} />
                            <meshBasicMaterial color="#f1f5f9" />
                        </mesh>
                        <mesh position={[0, imgHeight / 2, 0]}>
                            <sphereGeometry args={[0.014, 16, 16]} />
                            <meshBasicMaterial color="#f59e0b" />
                        </mesh>
                        <Text position={[0, imgHeight + (imgHeight < 0 ? -0.04 : 0.04), 0]} fontSize={0.025} color="#38bdf8">
                            {"Ảnh A'B' (Ngược chiều)"}
                        </Text>
                    </group>
                )}

                <Text position={[0, optY + 0.16, 0]} fontSize={0.03} color="#94a3b8">
                    Màn Chắn
                </Text>
            </group>

            {/* 5. 3 TIA SÁNG ĐẶC BIỆT CHUẨN SGK VẬT LÝ 11 */}
            {showSpecialRays && (
                <group>
                    {/* TIA 1 (Màu Vàng): Đi song song trục chính -> Khúc xạ qua tiêu điểm ảnh F' */}
                    {(() => {
                        const hitY = optY + objHeight;
                        const dx1 = curLensX - X_obj;
                        const len1 = dx1;
                        const midX1 = (X_obj + curLensX) / 2;

                        const dx2 = screenX - curLensX;
                        // Độ dốc qua tiêu điểm ảnh F'
                        const slope = (optY - hitY) / Math.max(0.01, focalLength);
                        const targetY = hitY + slope * dx2;
                        const len2 = Math.hypot(dx2, targetY - hitY);
                        const midX2 = (curLensX + screenX) / 2;
                        const midY2 = (hitY + targetY) / 2;
                        const rotZ = Math.atan2(targetY - hitY, dx2);

                        return (
                            <group>
                                <mesh position={[midX1, hitY, 0]}>
                                    <boxGeometry args={[len1, 0.0035, 0.0035]} />
                                    <meshBasicMaterial color="#f59e0b" />
                                </mesh>
                                <mesh position={[midX2, midY2, 0]} rotation={[0, 0, rotZ]}>
                                    <boxGeometry args={[len2, 0.0035, 0.0035]} />
                                    <meshBasicMaterial color="#fbbf24" />
                                </mesh>
                            </group>
                        );
                    })()}

                    {/* TIA 2 (Màu Xanh Lục): Đi qua quang tâm O -> Truyền thẳng không đổi hướng */}
                    {(() => {
                        const startY = optY + objHeight;
                        const dx = screenX - X_obj;
                        const slope = (optY - startY) / (curLensX - X_obj);
                        const endY = startY + slope * dx;
                        const len = Math.hypot(dx, endY - startY);
                        const midX = (X_obj + screenX) / 2;
                        const midY = (startY + endY) / 2;
                        const rotZ = Math.atan2(endY - startY, dx);

                        return (
                            <mesh position={[midX, midY, 0]} rotation={[0, 0, rotZ]}>
                                <boxGeometry args={[len, 0.0035, 0.0035]} />
                                <meshBasicMaterial color="#22c55e" />
                            </mesh>
                        );
                    })()}

                    {/* TIA 3 (Màu Xanh Lam): Đi qua tiêu điểm vật F -> Khúc xạ song song trục chính */}
                    {(() => {
                        const startY = optY + objHeight;
                        const slope1 = (optY - startY) / (X_F - X_obj);
                        const hitY = startY + slope1 * (curLensX - X_obj);
                        const dx1 = curLensX - X_obj;
                        const len1 = Math.hypot(dx1, hitY - startY);
                        const midX1 = (X_obj + curLensX) / 2;
                        const midY1 = (startY + hitY) / 2;
                        const rotZ1 = Math.atan2(hitY - startY, dx1);

                        const dx2 = screenX - curLensX;
                        const midX2 = (curLensX + screenX) / 2;

                        return (
                            <group>
                                <mesh position={[midX1, midY1, 0]} rotation={[0, 0, rotZ1]}>
                                    <boxGeometry args={[len1, 0.0035, 0.0035]} />
                                    <meshBasicMaterial color="#38bdf8" />
                                </mesh>
                                <mesh position={[midX2, hitY, 0]}>
                                    <boxGeometry args={[dx2, 0.0035, 0.0035]} />
                                    <meshBasicMaterial color="#0284c7" />
                                </mesh>
                            </group>
                        );
                    })()}
                </group>
            )}

            {/* Hướng dẫn 3 tia sáng đặc biệt SGK */}
            <Text position={[0, 0.06, 0.28]} fontSize={0.038} color="#94a3b8" anchorX="center">
                Quang Hình Học: 3 Tia Sáng Đặc Biệt (Vàng: // Trục chính • Lục: Qua O • Lam: Qua F)
            </Text>
        </group>
    );
}

// ─────────────────────────────────────────────────────────────
// 4. MAIN 3D PHYSICS SCENE CONTENT
// ─────────────────────────────────────────────────────────────
const PhysicsSceneContent = memo(function PhysicsSceneContent({
    handStateRef,
    currentExp,
    setCurrentExp,
    onPendulumMetrics,
    isCircuitClosed,
    onToggleCircuit,
    aiMode,
    setSwipeNotice,
    manualAngleTrigger,
    voltage,
    onVoltageChange,
    resistance,
    onResistanceChange,
    lensOffset,
    onLensOffsetChange,
    setOrbitEnabled,
    lensType,
    onLensTypeChange,
    laserColor,
    onLaserColorChange,
    pendulumLength,
    pendulumMass,
    pendulumGravity,
    showProtractor,
    showVectors,
    showTrajectory,
    showElectrons,
    showSpecialRays,
    show3DTeacher = true,
    aiSpeech = "",
}: {
    handStateRef: MutableRefObject<HandState>;
    currentExp: PhysicsExperiment;
    setCurrentExp: (exp: PhysicsExperiment) => void;
    onPendulumMetrics: (m: PendulumMetrics) => void;
    isCircuitClosed: boolean;
    onToggleCircuit: () => void;
    aiMode: "idle" | "speaking" | "warning" | "success" | "listening";
    setSwipeNotice: (msg: string | null) => void;
    manualAngleTrigger?: { angleRad: number; timestamp: number } | null;
    voltage: number;
    onVoltageChange?: (v: number) => void;
    resistance: number;
    onResistanceChange?: (r: number) => void;
    lensOffset: number;
    onLensOffsetChange: (offset: number) => void;
    setOrbitEnabled: (enabled: boolean) => void;
    lensType?: "converging" | "diverging";
    onLensTypeChange?: (t: "converging" | "diverging") => void;
    laserColor?: "red" | "green" | "blue";
    onLaserColorChange?: (c: "red" | "green" | "blue") => void;
    pendulumLength: number;
    pendulumMass: number;
    pendulumGravity: number;
    showProtractor: boolean;
    showVectors: boolean;
    showTrajectory: boolean;
    showElectrons: boolean;
    showSpecialRays: boolean;
    show3DTeacher?: boolean;
    aiSpeech?: string;
}) {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);

    const handPosRef = useRef<[number, number, number]>([0, 0, 0]);
    const indexTipRef = useRef<[number, number, number]>([0, 0, 0]);
    const isHoldingRef = useRef<boolean>(false);
    const handTrackedFramesRef = useRef<number>(0);

    const lastPalmXRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(performance.now());
    const vxRef = useRef<number>(0);
    const swipeCooldownRef = useRef<number>(0);

    // Vị trí Camera tối ưu
    const cameraTargets: Record<PhysicsExperiment, { pos: [number, number, number]; target: [number, number, number] }> =
        useMemo(
            () => ({
                pendulum: { pos: [0, 0.72, 2.15], target: [0, 0.45, 0] },
                circuit: { pos: [0, 0.65, 1.75], target: [0, -0.05, 0] },
                optics: { pos: [0, 0.68, 2.05], target: [0, 0.08, 0] },
                all: { pos: [0, 1.25, 3.6], target: [0, 0.15, 0] },
            }),
            []
        );

    const updateOrbitEnabled = useCallback((enabled: boolean) => {
        if (controlsRef.current) {
            controlsRef.current.enableRotate = false;
            controlsRef.current.enablePan = false;
            controlsRef.current.enableZoom = false;
        }
    }, []);

    useFrame((_, delta) => {
        const hs = handStateRef.current;
        const now = performance.now();

        // 1. Camera cố định chuẩn góc nhìn sư phạm
        const targetCam = cameraTargets[currentExp];
        const targetPos = new THREE.Vector3(...targetCam.pos);
        const targetTarget = new THREE.Vector3(...targetCam.target);
        camera.position.lerp(targetPos, Math.min(1, delta * 6.0));
        if (controlsRef.current) {
            controlsRef.current.target.lerp(targetTarget, Math.min(1, delta * 6.0));
            controlsRef.current.update();
        }

        // 2. Hand State Mapping & Debouncing
        if (hs && hs.detected) {
            handTrackedFramesRef.current++;
            const rawPalm = hs.palmPos || [hs.cursorX, hs.cursorY, hs.cursorZ];
            const rawTip = [hs.cursorX, hs.cursorY, hs.cursorZ];

            const p: [number, number, number] = [
                rawPalm[0] * 1.15,
                rawPalm[1] * 1.15 - 0.12,
                rawPalm[2] * 1.15 - 0.15,
            ];
            handPosRef.current = p;

            const tip: [number, number, number] = [
                rawTip[0] * 1.15,
                rawTip[1] * 1.15 - 0.12,
                rawTip[2] * 1.15 - 0.15,
            ];
            indexTipRef.current = tip;

            const activeHand = hs.rightHand?.detected ? hs.rightHand : hs.leftHand?.detected ? hs.leftHand : hs;
            const grip = activeHand.gripStrength ?? 0;
            const pinch = activeHand.pinchDistance ?? 1;
            const extCount = activeHand.extendedFingersCount ?? 5;

            const isPointing = Boolean(activeHand.isIndexExtended && !activeHand.isRingExtended && !activeHand.isPinkyExtended && extCount >= 2);
            const isRingGrab = Boolean(activeHand.isRingExtended && !activeHand.isIndexExtended);

            // Cơ chế khóa trạng thái chống rung giật (Hysteresis Grip Lock):
            // - Khi đang cầm: Chỉ nhả khi người dùng thực sự xòe rộng cả bàn tay (OPEN)
            // - Khi chưa cầm: Nhạy bén bắt lấy ngay khi nắm tay hoặc chụm ngón nhẹ
            const prevHolding = isHoldingRef.current;
            let isGrabbingOrHolding = false;

            if (prevHolding) {
                const isRealOpenHand = activeHand.gesture === "OPEN" && (extCount >= 4 || grip < 0.22);
                isGrabbingOrHolding = !isRealOpenHand;
            } else {
                const isGrabGesture =
                    activeHand.gesture === "GRAB" ||
                    grip > 0.36 ||
                    pinch < 0.35 ||
                    isRingGrab ||
                    (extCount <= 2 && extCount > 0);
                isGrabbingOrHolding = isGrabGesture && !isPointing;
            }

            isHoldingRef.current = isGrabbingOrHolding;

            if (handTrackedFramesRef.current < 8) {
                lastPalmXRef.current = p[0];
                lastTimeRef.current = now;
                vxRef.current = 0;
                return;
            }

            const currentX = p[0];
            const dt = Math.max(0.005, Math.min(0.1, (now - lastTimeRef.current) / 1000));
            const currentVx = (currentX - lastPalmXRef.current) / dt;
            lastPalmXRef.current = currentX;
            lastTimeRef.current = now;

            vxRef.current = THREE.MathUtils.lerp(vxRef.current, currentVx, Math.min(1, delta * 8));

            // Chuyển bài thí nghiệm bằng phất tay
            const isOpenHand = hs.gesture === "OPEN" && hs.extendedFingersCount >= 4;
            if (isOpenHand && !isGrabbingOrHolding && now > swipeCooldownRef.current && Math.abs(vxRef.current) > 2.8) {
                swipeCooldownRef.current = now + 1800;
                const isSwipeRight = vxRef.current > 0;
                const expList: PhysicsExperiment[] = ["pendulum", "circuit", "optics", "all"];
                const curIdx = expList.indexOf(currentExp);
                const nextIdx = isSwipeRight
                    ? (curIdx + 1) % expList.length
                    : (curIdx - 1 + expList.length) % expList.length;
                const nextExp = expList[nextIdx];
                setCurrentExp(nextExp);
                playLabSound("pick");

                const expNames: Record<PhysicsExperiment, string> = {
                    pendulum: "Con lắc đơn",
                    circuit: "Mạch điện 3D",
                    optics: "Quang hình học",
                    all: "Toàn cảnh 3D",
                };
                setSwipeNotice(
                    isSwipeRight
                        ? `Phất tay sang Phải: Chuyển sang ${expNames[nextExp]}`
                        : `Phất tay sang Trái: Chuyển sang ${expNames[nextExp]}`
                );
                setTimeout(() => setSwipeNotice(null), 2000);
            }
        } else {
            handTrackedFramesRef.current = 0;
            vxRef.current = 0;
            isHoldingRef.current = false;
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0.65, 1.85]} fov={48} />
            <OrbitControls
                ref={controlsRef}
                enablePan={false}
                enableZoom={false}
                enableRotate={false}
                target={[0, 0.45, 0]}
            />

            <PhysicsLabRoom />

            {/* 1. Con Lắc Đơn Sư Phạm */}
            {(currentExp === "pendulum" || currentExp === "all") && (
                <Pendulum3D
                    position={currentExp === "all" ? [-1.8, -0.16, 0] : [-0.42, -0.16, 0]}
                    handPosRef={handPosRef}
                    indexTipRef={indexTipRef}
                    isHoldingRef={isHoldingRef}
                    onMetricsUpdate={onPendulumMetrics}
                    manualAngleTrigger={manualAngleTrigger}
                    setOrbitEnabled={updateOrbitEnabled}
                    length={pendulumLength}
                    mass={pendulumMass}
                    gravity={pendulumGravity}
                    showProtractor={showProtractor}
                    showVectors={showVectors}
                    showTrajectory={showTrajectory}
                />
            )}

            {/* 2. Mạch Điện Định Luật Ôm 3D */}
            {(currentExp === "circuit" || currentExp === "all") && (
                <Circuit3D
                    position={currentExp === "all" ? [0, -0.16, 0] : [0, -0.16, 0]}
                    handPosRef={handPosRef}
                    indexTipRef={indexTipRef}
                    isHoldingRef={isHoldingRef}
                    isClosed={isCircuitClosed}
                    onToggle={onToggleCircuit}
                    voltage={voltage}
                    onVoltageChange={onVoltageChange}
                    resistance={resistance}
                    onResistanceChange={onResistanceChange}
                    showElectrons={showElectrons}
                />
            )}

            {/* 3. Quang Học Thấu Kính 3D */}
            {(currentExp === "optics" || currentExp === "all") && (
                <Optics3D
                    position={currentExp === "all" ? [1.85, -0.16, 0] : [0, -0.16, 0]}
                    handPosRef={handPosRef}
                    indexTipRef={indexTipRef}
                    isHoldingRef={isHoldingRef}
                    lensOffset={lensOffset}
                    onLensOffsetChange={onLensOffsetChange}
                    setOrbitEnabled={updateOrbitEnabled}
                    lensType={lensType}
                    onLensTypeChange={onLensTypeChange}
                    laserColor={laserColor}
                    onLaserColorChange={onLaserColorChange}
                    showSpecialRays={showSpecialRays}
                />
            )}

            {/* Nhân vật Cô Giáo AI Đồng Hành 3D */}
            {show3DTeacher && (
                <Lab3DAITeacher
                    position={[2.95, -0.48, 0.45]}
                    rotation={[0, -0.58, 0]}
                    scale={1.12}
                    mode={aiMode}
                    message={aiSpeech}
                />
            )}
        </>
    );
});

// ─────────────────────────────────────────────────────────────
// 5. EXPORTED DEFAULT SCENE
// ─────────────────────────────────────────────────────────────
export default function Lab3DPhysicsScene({ handStateRef }: { handStateRef?: MutableRefObject<HandState> }) {
    const fallbackRef = useRef<HandState>({ ...DEFAULT_HAND_STATE });
    const actualHandRef = handStateRef || fallbackRef;

    const [currentExp, setCurrentExp] = useState<PhysicsExperiment>("pendulum");
    const [selectedPlanet, setSelectedPlanet] = useState<string>("earth");
    const [pendulumLength, setPendulumLength] = useState<number>(1.35); // l = 1.35m
    const [pendulumMass, setPendulumMass] = useState<number>(0.5); // m = 0.5kg
    const [pendulumMetrics, setPendulumMetrics] = useState<PendulumMetrics>({
        angleDeg: 24.1,
        angleRad: 0.42,
        maxAngleDeg: 24.1,
        period: 2.33,
        velocity: 0,
        tangentialAcc: 0,
        tension: 4.9,
        gravityForce: 4.9,
        potentialEnergy: 0.58,
        kineticEnergy: 0,
        totalEnergy: 0.58,
        isHeld: false,
    });

    // Mạch điện
    const [isCircuitClosed, setIsCircuitClosed] = useState(false);
    const [voltage, setVoltage] = useState(9); // 9V DC
    const [resistance, setResistance] = useState(20); // 20 Ohm

    // Quang học
    const [lensOffset, setLensOffset] = useState(0.0);
    const [lensType, setLensType] = useState<"converging" | "diverging">("converging");
    const [laserColor, setLaserColor] = useState<"red" | "green" | "blue">("red");
    const [manualAngleTrigger, setManualAngleTrigger] = useState<{ angleRad: number; timestamp: number } | null>(null);

    // Bật/tắt các lớp giáo dục trực quan
    const [showProtractor, setShowProtractor] = useState(true);
    const [showVectors, setShowVectors] = useState(true);
    const [showTrajectory, setShowTrajectory] = useState(true);
    const [showElectrons, setShowElectrons] = useState(true);
    const [showSpecialRays, setShowSpecialRays] = useState(true);
    const [isInspectorExpanded, setIsInspectorExpanded] = useState(true);

    const [aiSpeech, setAiSpeech] = useState<string>(
        "Chào mừng em đến với Lab Vật Lý 3D! Thầy cô đã bổ sung thước đo góc bán nguyệt, véc-tơ lực và thanh năng lượng để em đối chiếu với SGK nhé!"
    );
    const [aiMode, setAiMode] = useState<"idle" | "speaking" | "warning" | "success" | "listening">("speaking");
    const [show3DTeacher, setShow3DTeacher] = useState(true);
    const [swipeNotice, setSwipeNotice] = useState<string | null>(null);
    const [orbitEnabled, setOrbitEnabled] = useState(true);

    const currentGravity = PLANET_GRAVITY[selectedPlanet]?.g ?? 9.81;
    const currentI = isCircuitClosed ? Number((voltage / resistance).toFixed(2)) : 0;

    const handleToggleCircuit = useCallback(() => {
        setIsCircuitClosed((prev) => {
            const next = !prev;
            if (next) {
                setAiMode("success");
                setAiSpeech(
                    `Mạch kín! Dòng điện I = U / R = ${voltage}V / ${resistance}Ω = ${(voltage / resistance).toFixed(2)}A. Các electron tự do dịch chuyển làm bóng đèn phát sáng rực rỡ.`
                );
            } else {
                setAiMode("idle");
                setAiSpeech("Mạch đã ngắt, dòng điện I = 0.00A, các electron dừng lại và bóng đèn tắt.");
            }
            return next;
        });
    }, [voltage, resistance]);

    const handleVoltageChange = useCallback((newV: number) => {
        setVoltage(newV);
        playLabSound("pick");
        if (isCircuitClosed) {
            setAiSpeech(`Đã chỉnh nguồn U = ${newV}V. Dòng điện I = ${(newV / resistance).toFixed(2)}A.`);
        }
    }, [isCircuitClosed, resistance]);

    const handleResistanceChange = useCallback((newR: number) => {
        setResistance(newR);
        playLabSound("pick");
        if (isCircuitClosed) {
            setAiSpeech(`Đã chỉnh điện trở R = ${newR}Ω. Dòng điện I = ${(voltage / newR).toFixed(2)}A.`);
        }
    }, [isCircuitClosed, voltage]);

    const handleSelectExp = (exp: PhysicsExperiment) => {
        setCurrentExp(exp);
        playLabSound("pick");
        if (exp === "pendulum") {
            setAiSpeech("Con Lắc Đơn: Quan sát thước đo độ, véc-tơ P, T, v và bảo toàn cơ năng khi dao động!");
        } else if (exp === "circuit") {
            setAiSpeech("Mạch Điện 3D: Quan sát dòng hạt electron chạy trong dây dẫn và đối chiếu định luật Ôm I = U/R.");
        } else if (exp === "optics") {
            setAiSpeech("Quang Học: Quan sát 3 tia sáng đặc biệt xuất phát từ vật sáng AB gặp nhau tại ảnh A'B'.");
        } else {
            setAiSpeech("Chế độ Toàn Cảnh: Bố trí cả 3 bài thí nghiệm rộng rãi trên bàn thí nghiệm 5.6m.");
        }
    };

    const handleSetPendulumAngle = (deg: number) => {
        const rad = (deg * Math.PI) / 180;
        setManualAngleTrigger({ angleRad: rad, timestamp: performance.now() });
        playLabSound("pick");
    };

    return (
        <div className="w-full h-full relative select-none">
            {/* 3D WebGL Canvas */}
            <Canvas
                gl={{
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance",
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.1,
                }}
            >
                <color attach="background" args={["#0c1424"]} />
                <PhysicsSceneContent
                    handStateRef={actualHandRef}
                    currentExp={currentExp}
                    setCurrentExp={setCurrentExp}
                    onPendulumMetrics={setPendulumMetrics}
                    isCircuitClosed={isCircuitClosed}
                    onToggleCircuit={handleToggleCircuit}
                    aiMode={aiMode}
                    setSwipeNotice={setSwipeNotice}
                    manualAngleTrigger={manualAngleTrigger}
                    voltage={voltage}
                    onVoltageChange={handleVoltageChange}
                    resistance={resistance}
                    onResistanceChange={handleResistanceChange}
                    lensOffset={lensOffset}
                    onLensOffsetChange={setLensOffset}
                    setOrbitEnabled={setOrbitEnabled}
                    lensType={lensType}
                    onLensTypeChange={setLensType}
                    laserColor={laserColor}
                    onLaserColorChange={setLaserColor}
                    pendulumLength={pendulumLength}
                    pendulumMass={pendulumMass}
                    pendulumGravity={currentGravity}
                    showProtractor={showProtractor}
                    showVectors={showVectors}
                    showTrajectory={showTrajectory}
                    showElectrons={showElectrons}
                    showSpecialRays={showSpecialRays}
                    show3DTeacher={show3DTeacher}
                    aiSpeech={aiSpeech}
                />
            </Canvas>

            {/* ─── 2D HUD: Swipe Notice Toast ─── */}
            {swipeNotice && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-indigo-950/95 border border-indigo-400 text-indigo-100 px-6 py-2.5 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center gap-3">
                        <Hand className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" />
                        <span className="text-xs sm:text-sm font-bold">{swipeNotice}</span>
                    </div>
                </div>
            )}

            {/* ─── 2D HUD: TRỢ LÝ SƯ PHẠM CÔ GIÁO MAI AI (VOICE PUSH-TO-TALK & CỬ CHỈ TAY ☝️ GÓC TRÊN PHẢI) ─── */}
            <Lab3DAITutorVoice
                subject="physics"
                handStateRef={actualHandRef}
                onTeacherModeChange={(mode) => setAiMode(mode)}
                onTeacherMessageChange={(msg) => setAiSpeech(msg)}
                show3DTeacher={show3DTeacher}
                onToggle3DTeacher={() => setShow3DTeacher((v) => !v)}
            />

            {/* ─── 2D HUD: BẢNG ĐO LƯỜNG & HỖ TRỢ HỌC TẬP VẬT LÝ GDPT 2018 (Góc trên trái) ─── */}
            <div className="absolute top-16 left-3 sm:left-4 z-20 pointer-events-auto max-w-sm sm:max-w-md w-full select-none">
                <div className="bg-slate-950/92 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-3 shadow-2xl text-white">
                    {/* Header: Tiêu đề + Nút Thu gọn/Mở rộng */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                                <BarChart2 className="w-4 h-4" />
                            </span>
                            <div>
                                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                                    Góc Học Tập Vật Lý 3D
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                    Thông số thực nghiệm • Công thức thế số SGK
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setIsInspectorExpanded(!isInspectorExpanded)}
                                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                                title={isInspectorExpanded ? "Thu gọn" : "Mở rộng"}
                            >
                                {isInspectorExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* HÀNG TỔNG QUAN NHANH (Always Visible) */}
                    <div className="grid grid-cols-3 gap-1.5 text-center mb-2">
                        <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Chu kỳ T</span>
                            <span className="text-xs sm:text-sm font-black text-amber-400">{pendulumMetrics.period} s</span>
                            <span className="text-[9px] text-slate-500 block">α: {pendulumMetrics.angleDeg}°</span>
                        </div>
                        <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Dòng điện I</span>
                            <span className="text-xs sm:text-sm font-black text-cyan-400">
                                {currentI.toFixed(2)} A
                            </span>
                            <span className="text-[9px] text-slate-500 block">{isCircuitClosed ? `${voltage}V Đóng` : "Mở"}</span>
                        </div>
                        <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Tiêu cự f</span>
                            <span className={`text-xs sm:text-sm font-black ${lensType === "converging" ? "text-rose-400" : "text-purple-400"}`}>
                                {lensType === "converging" ? "+35 cm" : "-35 cm"}
                            </span>
                            <span className="text-[9px] text-slate-500 block">
                                {lensType === "converging" ? "Hội tụ (Thật)" : "Phân kỳ (Ảo)"}
                            </span>
                        </div>
                    </div>

                    {/* NỘI DUNG MỞ RỘNG CHI TIẾT (Collapsible) */}
                    {isInspectorExpanded && (
                        <div className="flex flex-col gap-2.5 pt-1 border-t border-slate-800/80 text-xs animate-in fade-in duration-200">
                            {/* ─── PHÂN TÍCH CON LẮC ĐƠN ─── */}
                            {(currentExp === "pendulum" || currentExp === "all") && (
                                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/20 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                                            <Activity className="w-3.5 h-3.5 text-amber-400" />
                                            Bảo Toàn Cơ Năng: W = W_đ + W_t
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            W = {pendulumMetrics.totalEnergy.toFixed(3)} J
                                        </span>
                                    </div>

                                    {/* Live Animated Energy Bars */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-emerald-400 font-semibold">Động năng W_đ:</span>
                                            <span className="text-emerald-300 font-mono font-bold">
                                                {pendulumMetrics.kineticEnergy.toFixed(3)} J
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-full transition-all duration-75"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, (pendulumMetrics.kineticEnergy / Math.max(0.001, pendulumMetrics.totalEnergy)) * 100))}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                                            <span className="text-sky-400 font-semibold">Thế năng W_t:</span>
                                            <span className="text-sky-300 font-mono font-bold">
                                                {pendulumMetrics.potentialEnergy.toFixed(3)} J
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-sky-500 h-full transition-all duration-75"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, (pendulumMetrics.potentialEnergy / Math.max(0.001, pendulumMetrics.totalEnergy)) * 100))}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Bảng thế số thời gian thực */}
                                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] font-mono">
                                        <div className="bg-slate-950/70 p-1.5 rounded-lg">
                                            <span className="text-slate-400 block">Vận tốc tức thời v:</span>
                                            <span className="text-emerald-300 font-bold">{Math.abs(pendulumMetrics.velocity).toFixed(2)} m/s</span>
                                        </div>
                                        <div className="bg-slate-950/70 p-1.5 rounded-lg">
                                            <span className="text-slate-400 block">Lực căng dây T:</span>
                                            <span className="text-sky-300 font-bold">{pendulumMetrics.tension.toFixed(2)} N</span>
                                        </div>
                                        <div className="bg-slate-950/70 p-1.5 rounded-lg">
                                            <span className="text-slate-400 block">Trọng lực P = mg:</span>
                                            <span className="text-rose-400 font-bold">{pendulumMetrics.gravityForce.toFixed(2)} N</span>
                                        </div>
                                        <div className="bg-slate-950/70 p-1.5 rounded-lg">
                                            <span className="text-slate-400 block">Gia tốc tiếp tuyến:</span>
                                            <span className="text-amber-300 font-bold">{pendulumMetrics.tangentialAcc.toFixed(2)} m/s²</span>
                                        </div>
                                    </div>

                                    {/* Chọn Trọng trường Thiên thể */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                                        <span className="text-slate-300 font-semibold flex items-center gap-1">
                                            <Globe className="w-3 h-3 text-indigo-400" /> Thiên thể (g):
                                        </span>
                                        <div className="flex gap-1">
                                            {Object.keys(PLANET_GRAVITY).map((key) => (
                                                <button
                                                    key={key}
                                                    onClick={() => {
                                                        setSelectedPlanet(key);
                                                        playLabSound("pick");
                                                    }}
                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                                                        selectedPlanet === key
                                                            ? "bg-indigo-600 text-white shadow"
                                                            : "bg-slate-800 text-slate-400 hover:text-white"
                                                    }`}
                                                >
                                                    {PLANET_GRAVITY[key].name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Toggles hiển thị giáo dục con lắc */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-300">
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showProtractor}
                                                onChange={(e) => setShowProtractor(e.target.checked)}
                                                className="rounded accent-indigo-500"
                                            />
                                            <span>Thước đo độ</span>
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showVectors}
                                                onChange={(e) => setShowVectors(e.target.checked)}
                                                className="rounded accent-rose-500"
                                            />
                                            <span>Véc-tơ lực (P,T,v)</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* ─── PHÂN TÍCH MẠCH ĐIỆN ĐỊNH LUẬT ÔM ─── */}
                            {(currentExp === "circuit" || currentExp === "all") && (
                                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-cyan-500/20 flex flex-col gap-1.5">
                                    <span className="font-bold text-cyan-300 text-[11px] flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                        Định Luật Ôm: I = U / R & Công Suất P = U*I
                                    </span>
                                    <div className="bg-slate-950/70 p-2 rounded-lg font-mono text-[10px] space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Cường độ dòng điện:</span>
                                            <span className="text-cyan-300 font-bold">
                                                I = {voltage}V / {resistance}Ω = {currentI.toFixed(2)} A
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Công suất tiêu thụ:</span>
                                            <span className="text-amber-300 font-bold">
                                                P = U * I = {(voltage * currentI).toFixed(2)} W
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Nhiệt lượng tỏa ra (10s):</span>
                                            <span className="text-rose-400 font-bold">
                                                Q = I²Rt = {(currentI * currentI * resistance * 10).toFixed(1)} J
                                            </span>
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 pt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={showElectrons}
                                            onChange={(e) => setShowElectrons(e.target.checked)}
                                            className="rounded accent-cyan-500"
                                        />
                                        <span>Hiển thị dòng hạt electron (e⁻) dịch chuyển trong dây</span>
                                    </label>
                                </div>
                            )}

                            {/* ─── PHÂN TÍCH QUANG HỌC THẤU KÍNH ─── */}
                            {(currentExp === "optics" || currentExp === "all") && (
                                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-rose-500/20 flex flex-col gap-1.5">
                                    <span className="font-bold text-rose-300 text-[11px] flex items-center gap-1">
                                        <Search className="w-3.5 h-3.5 text-rose-400" />
                                        {"Công Thức Thấu Kính: 1/f = 1/d + 1/d'"}
                                    </span>
                                    {(() => {
                                        const d_cm = Math.round((lensOffset + 0.65) * 100);
                                        const f_cm = lensType === "converging" ? 35 : -35;
                                        const dPrime_cm = d_cm === f_cm ? 999 : (d_cm * f_cm) / (d_cm - f_cm);
                                        const k_mag = -dPrime_cm / d_cm;

                                        return (
                                            <div className="bg-slate-950/70 p-2 rounded-lg font-mono text-[10px] space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Khoảng cách vật d:</span>
                                                    <span className="text-amber-300 font-bold">{d_cm} cm</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">{"Khoảng cách ảnh d':"}</span>
                                                    <span className="text-sky-300 font-bold">
                                                        {dPrime_cm === 999 ? "∞ (Vô cực)" : `${dPrime_cm.toFixed(1)} cm (${dPrime_cm > 0 ? "Ảnh thật" : "Ảnh ảo"})`}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">{"Độ phóng đại k = -d'/d:"}</span>
                                                    <span className="text-rose-300 font-bold">
                                                        {k_mag.toFixed(2)} ({k_mag < 0 ? "Ngược chiều" : "Cùng chiều"})
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 pt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={showSpecialRays}
                                            onChange={(e) => setShowSpecialRays(e.target.checked)}
                                            className="rounded accent-rose-500"
                                        />
                                        <span>Hiển thị 3 tia sáng đặc biệt chuẩn SGK Vật Lý 11</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── 2D HUD: THANH ĐIỀU KHIỂN & CHUYỂN BÀI THÍ NGHIỆM HỢP NHẤT (Bottom Toolbar) ─── */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto select-none max-w-2xl w-[96%] sm:w-auto">
                <div className="bg-slate-950/95 backdrop-blur-2xl border border-indigo-500/40 rounded-2xl shadow-2xl p-2.5 text-white flex flex-col items-center gap-2">
                    {/* HÀNG 1: Nút chuyển bài thí nghiệm */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full justify-center pb-1.5 border-b border-slate-800/80">
                        <button
                            id="btn-exp-pendulum"
                            onClick={() => handleSelectExp("pendulum")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                currentExp === "pendulum"
                                    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30 scale-105"
                                    : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800"
                            }`}
                        >
                            <Timer className="w-3.5 h-3.5 text-amber-300" />
                            <span>Con Lắc Đơn</span>
                        </button>

                        <button
                            id="btn-exp-circuit"
                            onClick={() => handleSelectExp("circuit")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                currentExp === "circuit"
                                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-105"
                                    : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800"
                            }`}
                        >
                            <Zap className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Mạch Điện 3D</span>
                        </button>

                        <button
                            id="btn-exp-optics"
                            onClick={() => handleSelectExp("optics")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                currentExp === "optics"
                                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105"
                                    : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800"
                            }`}
                        >
                            <Search className="w-3.5 h-3.5 text-rose-300" />
                            <span>Quang Học Thấu Kính</span>
                        </button>

                        <button
                            id="btn-exp-all"
                            onClick={() => handleSelectExp("all")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                currentExp === "all"
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                                    : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800"
                            }`}
                        >
                            <Globe className="w-3.5 h-3.5 text-indigo-300" />
                            <span>Toàn Cảnh</span>
                        </button>
                    </div>

                    {/* HÀNG 2: Bảng điều khiển riêng của bài đang chọn */}
                    <div className="w-full flex justify-center">
                        {/* BẢNG ĐIỀU KHIỂN CHO CON LẮC ĐƠN */}
                        {(currentExp === "pendulum" || currentExp === "all") && (
                            <div className="flex flex-col gap-1.5 w-full text-xs">
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <span className="font-semibold text-amber-400 flex items-center gap-1">
                                        <Timer className="w-3.5 h-3.5" />
                                        <span>Kéo góc α:</span>
                                    </span>
                                    {[-45, -30, 0, 30, 45].map((deg) => (
                                        <button
                                            key={deg}
                                            onClick={() => handleSetPendulumAngle(deg)}
                                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                                deg === 0
                                                    ? "bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400"
                                                    : "bg-slate-900 hover:bg-amber-600/80 border border-slate-700 text-slate-200"
                                            }`}
                                        >
                                            {deg === 0 ? "0° VTCB" : `${deg > 0 ? "+" : ""}${deg}°`}
                                        </button>
                                    ))}
                                    <div className="hidden sm:flex items-center gap-2 ml-1 pl-2 border-l border-slate-800">
                                        <span className="text-[11px] text-slate-400">Trượt góc:</span>
                                        <input
                                            type="range"
                                            min="-60"
                                            max="60"
                                            value={pendulumMetrics.angleDeg}
                                            onChange={(e) => handleSetPendulumAngle(Number(e.target.value))}
                                            className="w-24 accent-amber-500 cursor-pointer"
                                        />
                                        <span className="text-[11px] font-mono text-amber-300 w-12 text-right">
                                            {pendulumMetrics.angleDeg}°
                                        </span>
                                    </div>
                                </div>

                                {/* Chỉnh Chiều dài dây l và Khối lượng m */}
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-1 border-t border-slate-800/80 text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-slate-400">Chiều dài dây l:</span>
                                        {[0.8, 1.0, 1.35, 1.6].map((l) => (
                                            <button
                                                key={l}
                                                onClick={() => {
                                                    setPendulumLength(l);
                                                    playLabSound("pick");
                                                }}
                                                className={`px-2 py-0.5 rounded font-bold transition-all ${
                                                    pendulumLength === l
                                                        ? "bg-amber-500 text-slate-950 font-extrabold"
                                                        : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                                                }`}
                                            >
                                                {l}m
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <span className="text-slate-400">Khối lượng m:</span>
                                        {[0.2, 0.5, 1.0, 1.5].map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => {
                                                    setPendulumMass(m);
                                                    playLabSound("pick");
                                                }}
                                                className={`px-2 py-0.5 rounded font-bold transition-all ${
                                                    pendulumMass === m
                                                        ? "bg-amber-500 text-slate-950 font-extrabold"
                                                        : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                                                }`}
                                            >
                                                {m}kg
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BẢNG ĐIỀU KHIỂN CHO MẠCH ĐIỆN 3D */}
                        {(currentExp === "circuit" || currentExp === "all") && (
                            <div className="flex flex-col gap-2 w-full text-xs">
                                <div className="flex flex-wrap items-center justify-center gap-2.5">
                                    <button
                                        id="btn-toggle-circuit-hud"
                                        onClick={handleToggleCircuit}
                                        className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 border ${
                                            isCircuitClosed
                                                ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30 ring-1 ring-emerald-400/50"
                                                : "bg-rose-700 hover:bg-rose-600 text-white border-rose-500 shadow-rose-700/30"
                                        }`}
                                    >
                                        <span className="font-mono text-xs bg-black/40 px-1.5 py-0.5 rounded font-black tracking-wider">
                                            {isCircuitClosed ? "──●─────●──" : "──●  /  ●──"}
                                        </span>
                                        <span>
                                            {isCircuitClosed ? "● CẦU DAO: ĐÓNG (BẬT)" : "○ CẦU DAO: NGẮT (TẮT)"}
                                        </span>
                                    </button>

                                    <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5">
                                        <span className="text-cyan-400 font-bold">I = U/R =</span>
                                        <span>{voltage}V / {resistance}Ω =</span>
                                        <span className={`font-bold ${isCircuitClosed ? "text-cyan-300 font-black animate-pulse" : "text-slate-500"}`}>
                                            {currentI.toFixed(2)} A
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 border-t border-slate-800/80">
                                    <div className="flex items-center gap-1 bg-red-950/40 border border-red-500/30 px-2.5 py-0.5 rounded-xl">
                                        <span className="text-red-300 font-bold text-[11px] flex items-center gap-1">
                                            <Zap className="w-3.5 h-3.5 text-red-400" />
                                            <span>VÔN (U):</span>
                                        </span>
                                        {[3, 6, 9, 12, 24].map((v) => (
                                            <button
                                                key={v}
                                                onClick={() => handleVoltageChange(v)}
                                                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                                    voltage === v
                                                        ? "bg-red-500 text-white shadow-md shadow-red-500/50 scale-105 ring-1 ring-white"
                                                        : "bg-slate-900 text-red-200 hover:bg-red-900/60 hover:text-white"
                                                }`}
                                            >
                                                {v}V
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 px-2.5 py-0.5 rounded-xl">
                                        <span className="text-amber-300 font-bold text-[11px] flex items-center gap-1">
                                            <Sliders className="w-3.5 h-3.5 text-amber-400" />
                                            <span>TRỞ (R):</span>
                                        </span>
                                        {[10, 20, 30, 50, 100].map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => handleResistanceChange(r)}
                                                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                                    resistance === r
                                                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/50 scale-105 ring-1 ring-white font-extrabold"
                                                        : "bg-slate-900 text-amber-200 hover:bg-amber-900/60 hover:text-white"
                                                }`}
                                            >
                                                {r}Ω
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BẢNG ĐIỀU KHIỂN CHO QUANG HỌC THẤU KÍNH */}
                        {(currentExp === "optics" || currentExp === "all") && (
                            <div className="flex flex-col gap-2 w-full text-xs">
                                <div className="flex flex-wrap items-center justify-center gap-2.5">
                                    <div className="flex items-center gap-1 bg-sky-950/40 border border-sky-500/30 px-2.5 py-0.5 rounded-xl">
                                        <span className="text-sky-300 font-bold text-[11px] flex items-center gap-1">
                                            <Search className="w-3.5 h-3.5 text-sky-400" />
                                            <span>Thấu kính:</span>
                                        </span>
                                        <button
                                            onClick={() => {
                                                setLensType("converging");
                                                playLabSound("pick");
                                                setAiSpeech("Thấu Kính Hội Tụ (f = +35cm): Chùm tia khúc xạ hội tụ tại Tiêu Điểm F' tạo ảnh thật ngược chiều trên màn.");
                                            }}
                                            className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                                lensType === "converging"
                                                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/50 scale-105"
                                                    : "bg-slate-900 text-sky-200 hover:bg-slate-800"
                                            }`}
                                        >
                                            Hội tụ (+35cm)
                                        </button>
                                        <button
                                            onClick={() => {
                                                setLensType("diverging");
                                                playLabSound("pick");
                                                setAiSpeech("Thấu Kính Phân Kỳ (f = -35cm): Chùm tia loe rộng ra ngoài tạo ảnh ảo cùng chiều.");
                                            }}
                                            className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                                lensType === "diverging"
                                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/50 scale-105"
                                                    : "bg-slate-900 text-purple-200 hover:bg-slate-800"
                                            }`}
                                        >
                                            Phân kỳ (-35cm)
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 px-2.5 py-0.5 rounded-xl">
                                        <span className="text-slate-300 font-bold text-[11px] flex items-center gap-1">
                                            <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Laser:</span>
                                        </span>
                                        {(["red", "green", "blue"] as const).map((c) => {
                                            const names = { red: "Đỏ", green: "Lục", blue: "Lam" };
                                            return (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        setLaserColor(c);
                                                        playLabSound("pick");
                                                    }}
                                                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                                        laserColor === c
                                                            ? c === "red"
                                                                ? "bg-red-600 text-white ring-1 ring-white"
                                                                : c === "green"
                                                                ? "bg-emerald-600 text-white ring-1 ring-white"
                                                                : "bg-blue-600 text-white ring-1 ring-white"
                                                            : "bg-slate-900/90 text-slate-400 hover:text-white"
                                                    }`}
                                                >
                                                    {names[c]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-slate-800/80">
                                    <span className="font-semibold text-rose-300 flex items-center gap-1 text-[11px]">
                                        <Ruler className="w-3.5 h-3.5 text-rose-400" />
                                        <span>Vị trí thấu kính:</span>
                                    </span>
                                    <button
                                        onClick={() => {
                                            setLensOffset((prev) => Math.max(-0.35, Number((prev - 0.15).toFixed(2))));
                                            playLabSound("pick");
                                        }}
                                        className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-rose-600/80 border border-slate-700 text-slate-200 transition-all font-bold"
                                    >
                                        ◀ -15 cm
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLensOffset(0.0);
                                            playLabSound("pick");
                                        }}
                                        className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-400 transition-all flex items-center gap-1"
                                    >
                                        <Target className="w-3 h-3 text-slate-400" />
                                        <span>Căn giữa (0 cm)</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLensOffset((prev) => Math.min(0.35, Number((prev + 0.15).toFixed(2))));
                                            playLabSound("pick");
                                        }}
                                        className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-rose-600/80 border border-slate-700 text-slate-200 transition-all font-bold"
                                    >
                                        ▶ +15 cm
                                    </button>
                                    <div className="hidden sm:flex items-center gap-2 ml-1 pl-2 border-l border-slate-800">
                                        <span className="text-[11px] text-slate-400">Trượt ray:</span>
                                        <input
                                            type="range"
                                            min="-35"
                                            max="35"
                                            value={Math.round(lensOffset * 100)}
                                            onChange={(e) => setLensOffset(Number(e.target.value) / 100)}
                                            className="w-24 accent-rose-500 cursor-pointer"
                                        />
                                        <span className="text-[11px] text-rose-300 font-mono w-12 text-right">
                                            {(lensOffset * 100).toFixed(0)} cm
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* HÀNG 3: Hướng dẫn thao tác chính xác */}
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-300 border-t border-slate-800/80 pt-1.5 px-1 font-medium w-full">
                        <span className="flex items-center gap-1.5 text-sky-400 font-bold bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                            <Hand className="w-3.5 h-3.5 text-sky-400" />
                            <span>Sát thiết bị + Nắm: Cầm / Kéo / Gạt (Đã khử rung 7-frame)</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                            <Compass className="w-3.5 h-3.5 text-amber-400" />
                            <span>Thước đo độ & Véc-tơ lực: Hỗ trợ học tập SGK GDPT 2018</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                            <MousePointer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Chuột: Bấm trực tiếp 3D hoặc dùng thanh trượt</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
