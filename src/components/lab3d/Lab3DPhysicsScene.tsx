"use client";

/**
 * ─── Lab3DPhysicsScene ───
 * Phòng thí nghiệm Vật Lý 3D Đa Phương Thức (Multi-Input 60+ FPS):
 * - 🖱️ Chuột / Cảm ứng siêu nhạy: Bấm và kéo trực tiếp quả lắc, gạt cầu dao, kéo thấu kính trên ray
 * - 📷 Camera Hand Tracking AI: Bắt dính thông minh (Magnetic Snapping), không lo lệch trục Z
 * - 🎛️ Bảng Điều Khiển Nhanh Trực Quan: Nút bấm & thanh trượt điều chỉnh góc α, điện áp U, điện trở R, vị trí thấu kính
 * - 🎯 Tách biệt hoàn toàn từng bài thí nghiệm, không đè chồng, không dồn cục
 * - ⚡ Hiệu năng 60+ FPS với PhysicsLabRoom chuyên biệt
 */

import React, { useRef, useState, useMemo, MutableRefObject, useCallback, memo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";

import { HandState, DEFAULT_HAND_STATE } from "@/lib/handTracking";
import { playLabSound } from "./ChemistryRealisticModels";
import { deviceSensors } from "@/lib/deviceSensors";
import PhysicsLabRoom from "./PhysicsRoom";
import Lab3DFullHandModel from "./Lab3DFullHandModel";
import Lab3DAITeacher from "./Lab3DAITeacher";
import Lab3DAITutorVoice from "./Lab3DAITutorVoice";
import { Zap, Timer, Search, Globe, Hand, MousePointer, BarChart2, Sliders, Target, Sparkles as SparklesIcon, Ruler } from "lucide-react";

interface Lab3DPhysicsSceneProps {
    handStateRef?: MutableRefObject<HandState>;
}

export type PhysicsExperiment = "pendulum" | "circuit" | "optics" | "all";

// ─────────────────────────────────────────────────────────────
// 1. CON LẮC ĐƠN 3D (Pendulum Component)
// ─────────────────────────────────────────────────────────────
function Pendulum3D({
    position = [0, -0.16, 0],
    handPosRef,
    indexTipRef,
    isHoldingRef,
    onPeriodUpdate,
    manualAngleTrigger,
    setOrbitEnabled,
}: {
    position?: [number, number, number];
    handPosRef: MutableRefObject<[number, number, number]>;
    indexTipRef?: MutableRefObject<[number, number, number]>;
    isHoldingRef: MutableRefObject<boolean>;
    onPeriodUpdate: (t: number, angleDeg: number) => void;
    manualAngleTrigger?: { angleRad: number; timestamp: number } | null;
    setOrbitEnabled: (enabled: boolean) => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const bobRef = useRef<THREE.Mesh>(null);
    const rodRef = useRef<THREE.Mesh>(null);
    const pivotRef = useRef<THREE.Group>(null);
    const auraRef = useRef<THREE.Mesh>(null);
    const lastAngleReportRef = useRef<number>(24.1);
    const unholdFramesRef = useRef<number>(0);

    // Chuột / Touch Dragging State
    const isPointerDragging = useRef(false);

    // Thông số vật lý chuẩn
    const length = 1.35; // Chiều dài dây treo l = 1.35m
    const g = 9.81;
    const omega = Math.sqrt(g / length);
    const period = (2 * Math.PI) / omega; // T ≈ 2.33s

    const state = useRef({
        angle: 0.42, // rad (~24 độ)
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

        // Khoảng cách theo mặt phẳng chiếu 2D (kết hợp cả lòng bàn tay & đầu ngón trỏ)
        const dPalm = Math.hypot(handPos[0] - bobWorldPos.x, handPos[1] - bobWorldPos.y);
        const dTip = Math.hypot(indexTip[0] - bobWorldPos.x, indexTip[1] - bobWorldPos.y);
        const dist2D = Math.min(dPalm, dTip);
        const isHandNear = dist2D < (s.isHeld ? 0.95 : 0.70);
        const isGrabOrTouch = isHolding || dist2D < 0.42;

        // Nếu đang kéo bằng chuột hoặc bằng tay
        if (isPointerDragging.current) {
            // Đang được điều khiển trực tiếp bởi chuột qua con trỏ
            s.time = 0;
            s.velocity = 0;
            s.initialAngle = s.angle;
        } else if (isGrabOrTouch && isHandNear) {
            unholdFramesRef.current = 0;
            if (!s.isHeld) {
                playLabSound("pick");
            }
            s.isHeld = true;
            // Tính góc kéo dựa trên độ lệch so với trục quay
            const deltaX = handPos[0] - pivotWorldPos.x;
            const deltaY = handPos[1] - pivotWorldPos.y;
            const targetAngle = Math.atan2(deltaX, -deltaY);
            s.angle = THREE.MathUtils.lerp(
                s.angle,
                Math.max(-1.15, Math.min(1.15, targetAngle)),
                Math.min(1, delta * 20)
            );
            s.initialAngle = s.angle;
            s.velocity = 0;
            s.time = 0;
        } else if (s.isHeld) {
            // Khi người dùng thả tay / xòe tay ra: buông ngay lập tức, thả tự do dao động điều hòa!
            s.isHeld = false;
            unholdFramesRef.current = 0;
            s.initialAngle = Math.abs(s.angle) < 0.04 ? (s.angle < 0 ? -0.04 : 0.04) : s.angle;
            s.time = 0;
            playLabSound("place");
        } else {
            // Tích hợp Cảm biến Điện thoại: Nghiêng điện thoại trái/phải hoặc lắc để truyền xung lực
            const sensor = deviceSensors.getData();
            if (sensor.isShaking) {
                // Lắc điện thoại -> Truyền xung lực dao động mạnh
                s.initialAngle = s.angle >= 0 ? 0.62 : -0.62;
                s.time = 0;
                s.velocity = 0;
            } else if (Math.abs(sensor.roll) > 12) {
                // Nghiêng điện thoại -> con lắc lệch theo trọng lực góc nghiêng
                const targetRollAngle = (sensor.roll * Math.PI) / 180;
                s.angle = THREE.MathUtils.lerp(s.angle, Math.max(-1.1, Math.min(1.1, targetRollAngle)), delta * 8);
                s.initialAngle = s.angle;
                s.time = 0;
            } else {
                // Dao động điều hòa tắt dần tự nhiên, bảo toàn hướng xuất phát (không bị giật lật dấu)
                s.time += clampedDelta;
                const damping = Math.exp(-0.045 * s.time);
                s.angle = s.initialAngle * Math.cos(omega * s.time) * damping;
                s.velocity = -omega * s.initialAngle * Math.sin(omega * s.time) * damping;
            }
        }

        if (pivotRef.current) {
            pivotRef.current.rotation.z = s.angle;
        }

        if (auraRef.current) {
            auraRef.current.visible = s.isHeld || isHandNear || isPointerDragging.current;
            const mat = auraRef.current.material as THREE.MeshBasicMaterial;
            if (mat) {
                mat.color.set(s.isHeld ? "#22c55e" : "#38bdf8");
                mat.opacity = s.isHeld ? 0.9 : 0.6;
            }
        }

        // Cập nhật UI đo lường mượt mà, tránh re-render giật lag
        const now = performance.now();
        if (now - s.lastReportTime > 120) {
            const curDeg = Number(((s.angle * 180) / Math.PI).toFixed(1));
            if (Math.abs(curDeg - lastAngleReportRef.current) >= 0.2) {
                lastAngleReportRef.current = curDeg;
                s.lastReportTime = now;
                onPeriodUpdate(period, curDeg);
            }
        }
    });

    // ─── Mouse / Touch Handlers for Direct 3D Dragging ───
    const handlePointerDown = (e: any) => {
        e.stopPropagation();
        isPointerDragging.current = true;
        setOrbitEnabled(false);
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
        state.current.angle = Math.max(-1.15, Math.min(1.15, targetAngle));
    };

    const handlePointerUp = (e: any) => {
        if (isPointerDragging.current) {
            e.stopPropagation();
            isPointerDragging.current = false;
            setOrbitEnabled(true);
            state.current.initialAngle =
                Math.abs(state.current.angle) < 0.04
                    ? state.current.angle < 0
                        ? -0.04
                        : 0.04
                    : state.current.angle;
            state.current.time = 0;
            playLabSound("place");
        }
    };

    return (
        <group ref={groupRef} position={position}>
            {/* 1. Chân đế gang đúc nặng vững chắc */}
            <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[0.55, 0.04, 0.45]} />
                <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.35} />
            </mesh>
            {/* Ốc chỉnh thăng bằng chân đế */}
            {[-0.22, 0.22].map((x, xi) =>
                [-0.18, 0.18].map((z, zi) => (
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

            {/* 4. Thước đo góc bán nguyệt (Protractor) gắn cố định tại trục xoay */}
            <group position={[0.42, 1.55, 0]}>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                    <ringGeometry args={[0.18, 0.23, 32, 1, Math.PI * 0.25, Math.PI * 0.5]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
                </mesh>
                <Text position={[0, -0.06, 0.01]} fontSize={0.038} color="#0284c7" anchorX="center">
                    0°
                </Text>
                <Text position={[-0.14, -0.09, 0.01]} fontSize={0.03} color="#64748b" anchorX="center">
                    -30°
                </Text>
                <Text position={[0.14, -0.09, 0.01]} fontSize={0.03} color="#64748b" anchorX="center">
                    +30°
                </Text>
            </group>

            {/* Mặt phẳng tàng hình bắt chuột khi kéo thả quả lắc (Invisible Pointer Drag Plane) */}
            <mesh
                position={[0.42, 0.8, 0]}
                visible={false}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <planeGeometry args={[2.5, 2.5]} />
            </mesh>

            {/* 5. Cụm Trục Xoay & Dây Treo Dao Động */}
            <group ref={pivotRef} position={[0.42, 1.55, 0]}>
                {/* Ốc định vị trục xoay */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.018, 0.018, 0.05, 16]} />
                    <meshStandardMaterial color="#eab308" metalness={0.85} />
                </mesh>

                {/* Sợi dây mảnh chịu lực */}
                <mesh ref={rodRef} position={[0, -length / 2, 0]}>
                    <cylinderGeometry args={[0.003, 0.003, length, 8]} />
                    <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.9} />
                </mesh>

                {/* Quả nặng kim loại đồng thau sáng bóng - BẤM CHUỘT KÉO THẢ TRỰC TIẾP */}
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
                    <sphereGeometry args={[0.12, 32, 32]} />
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
            </group>

            {/* Nhãn mô tả vật lý dưới chân đế */}
            <Text position={[0, 0.06, 0.28]} fontSize={0.045} color="#94a3b8" anchorX="center">
                Con Lắc Đơn (Kéo chuột hoặc tay để thả dao động)
            </Text>
        </group>
    );
}

// ─────────────────────────────────────────────────────────────
// 2. MẠCH ĐIỆN ĐỊNH LUẬT OHM 3D (Circuit Component)
// ─────────────────────────────────────────────────────────────
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
}) {
    const groupRef = useRef<THREE.Group>(null);
    const switchRef = useRef<THREE.Group>(null);
    const switchAuraRef = useRef<THREE.Mesh>(null);
    const ammeterNeedleRef = useRef<THREE.Group>(null);
    const bulbGlowRef = useRef<THREE.PointLight>(null);
    const bulbMeshRef = useRef<THREE.Mesh>(null);
    const lastToggleTimeRef = useRef(0);
    const dwellStartTimeRef = useRef(0);
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
            // Scale từ -0.65 rad (0A) đến 0.65 rad (1.2A)
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

        // Tương tác tay gạt công tắc (Khoảng cách dung sai siêu nhạy)
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
        // Gạt công tắc:
        // Đảm bảo TUYỆT ĐỐI KHÔNG BẬT TẮT LIÊN TỤC:
        // Cần cử chỉ dứt khoát: tay ở gần (< 0.38m) VÀ nắm tay/chụm ngón (isHolding).
        const gestureTrigger = isNear && isHolding;

        if (gestureTrigger) {
            // Khi kích hoạt, khóa chặt (edge-trigger), chỉ gạt 1 lần duy nhất cho mỗi cử chỉ
            if (!hasToggledForCurrentTouchRef.current && now - lastToggleTimeRef.current > 750) {
                hasToggledForCurrentTouchRef.current = true;
                lastToggleTimeRef.current = now;
                onToggle();
                playLabSound("pick");
            }
        } else if (!isHolding && dist2D > 0.45) {
            // Chỉ khi người dùng thực sự xòe tay ra VÀ rút tay ra xa khỏi công tắc mới mở khóa cho lần gạt tiếp theo
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

            {/* ─── 1. Nguồn Pin DC (BẤM ĐỔI VÔN TRỰC TIẾP TRONG 3D) ─── */}
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
                {/* Thân bình ắc quy / nguồn pin */}
                <mesh>
                    <boxGeometry args={[0.26, 0.22, 0.16]} />
                    <meshStandardMaterial color="#dc2626" roughness={0.35} metalness={0.4} />
                </mesh>
                {/* Cực dương (+) đỏ */}
                <mesh position={[0.07, 0.13, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.04, 16]} />
                    <meshStandardMaterial color="#ef4444" metalness={0.9} />
                </mesh>
                <Text position={[0.07, 0.17, 0]} fontSize={0.035} color="#ef4444" anchorX="center">
                    +
                </Text>
                {/* Cực âm (-) đen */}
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

                {/* Nhãn 3D hiển thị rõ ràng trên đầu Pin */}
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

            {/* ─── 2. Cầu Dao Đồng Đảo Mạch (Knife Switch) ─── */}
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
                {/* Đế sứ công tắc */}
                <mesh position={[0, 0.02, 0]}>
                    <boxGeometry args={[0.34, 0.03, 0.18]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.5} />
                </mesh>

                {/* Đèn LED chỉ báo trạng thái BẬT/TẮT trên đế công tắc */}
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

                {/* Ký hiệu công tắc theo chuẩn Sơ đồ Mạch điện Vật Lý */}
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

                {/* Vòng aura phát sáng */}
                <mesh ref={switchAuraRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                    <ringGeometry args={[0.12, 0.22, 24]} />
                    <meshBasicMaterial color={isClosed ? "#22c55e" : "#38bdf8"} transparent opacity={0.65} side={THREE.DoubleSide} />
                </mesh>

                {/* Cọc tiếp điểm tĩnh bên phải */}
                <mesh position={[0.09, 0.05, 0]}>
                    <boxGeometry args={[0.03, 0.045, 0.035]} />
                    <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
                </mesh>

                {/* Cần gạt lưỡi dao đồng xoay quanh trục */}
                <group ref={switchRef} position={[-0.09, 0.05, 0]}>
                    <mesh position={[0.095, 0, 0]}>
                        <boxGeometry args={[0.19, 0.022, 0.025]} />
                        <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.15} />
                    </mesh>
                    {/* Tay cầm cách điện màu đỏ */}
                    <mesh position={[0.2, 0, 0]}>
                        <sphereGeometry args={[0.028, 16, 16]} />
                        <meshStandardMaterial color="#ef4444" roughness={0.4} />
                    </mesh>
                </group>

                {/* Bảng hiệu 3D chỉ báo trạng thái & hướng dẫn gạt */}
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

            {/* ─── 3. Đồng Hồ Ampe Kế (Analog Ammeter Gauge) ─── */}
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
            </group>

            {/* ─── 4. Điện Trở Gốm R (BẤM ĐỔI ĐIỆN TRỞ TRỰC TIẾP TRONG 3D) ─── */}
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

            {/* ─── 5. Bóng Đèn Sợi Đốt (Incandescent Bulb) ─── */}
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
                    {isClosed ? `Đèn Sáng (I = ${currentI}A)` : "Đèn Tắt"}
                </Text>
            </group>

            {/* ─── 6. Dây Dẫn Mạch Điện Khép Kín ─── */}
            <mesh position={[-0.35, 0.035, 0.0]}>
                <boxGeometry args={[0.012, 0.012, 0.48]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0.2, 0.035, 0.22]}>
                <boxGeometry args={[0.55, 0.012, 0.012]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0.55, 0.035, -0.02]}>
                <boxGeometry args={[0.012, 0.012, 0.46]} />
                <meshStandardMaterial color="#eab308" />
            </mesh>
            <mesh position={[0.3, 0.035, -0.26]}>
                <boxGeometry args={[0.42, 0.012, 0.012]} />
                <meshStandardMaterial color="#38bdf8" />
            </mesh>
            <mesh position={[-0.25, 0.035, -0.27]}>
                <boxGeometry args={[0.52, 0.012, 0.012]} />
                <meshStandardMaterial color="#38bdf8" />
            </mesh>
        </group>
    );
}

// ─────────────────────────────────────────────────────────────
// 3. QUANG HỌC & KHÚC XẠ ÁNH SÁNG 3D (Optics Component)
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
}) {
    const groupRef = useRef<THREE.Group>(null);
    const lensRiderRef = useRef<THREE.Group>(null);
    const lensAuraRef = useRef<THREE.Mesh>(null);
    const isDragging = useRef(false);

    // Đồng bộ vị trí thấu kính từ prop bên ngoài
    useEffect(() => {
        if (lensRiderRef.current && !isDragging.current) {
            lensRiderRef.current.position.x = lensOffset;
        }
    }, [lensOffset]);

    useFrame((_, delta) => {
        const handPos = handPosRef.current;
        const indexTip = indexTipRef?.current || handPos;
        const isHolding = isHoldingRef.current;

        // Tọa độ thế giới của thấu kính
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

            const targetX = THREE.MathUtils.clamp(handPos[0] - railWorldPos.x, -0.42, 0.42);
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

    // ─── Mouse Dragging Handlers on Lens Rider ───
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
        const targetX = THREE.MathUtils.clamp(e.point.x - railWorldPos.x, -0.42, 0.42);
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

            {/* Mặt phẳng tàng hình bắt chuột trượt thấu kính */}
            <mesh
                position={[0, 0.2, 0]}
                visible={false}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <planeGeometry args={[2.2, 0.6]} />
            </mesh>

            {/* 2. Hộp Nguồn Laser 3 Tia (BẤM ĐỔI MÀU LASER) */}
            <group
                position={[-0.82, 0.19, 0]}
                onClick={handleCycleLaserColor}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                    document.body.style.cursor = "default";
                }}
            >
                <mesh>
                    <boxGeometry args={[0.16, 0.15, 0.15]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
                </mesh>
                {[-0.04, 0, 0.04].map((zo, i) => (
                    <mesh key={i} position={[0.085, 0, zo]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.012, 0.012, 0.025, 16]} />
                        <meshStandardMaterial color={curColor.hex} emissive={curColor.hex} emissiveIntensity={2.5} />
                    </mesh>
                ))}
                <Text position={[0, 0.12, 0]} fontSize={0.038} color={curColor.glow}>
                    Laser: {curColor.name}
                </Text>
                <Text position={[0, 0.16, 0]} fontSize={0.02} color="#cbd5e1">
                    [Bấm đổi màu]
                </Text>
            </group>

            {/* 3. Giá Trượt Mang Thấu Kính (BẤM ĐỔI LOẠI THẤU KÍNH HOẶC KÉO TRƯỢT) */}
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
                <mesh position={[0, 0.19, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <torusGeometry args={[0.088, 0.008, 16, 32]} />
                    <meshStandardMaterial color={lensType === "converging" ? "#0284c7" : "#9333ea"} metalness={0.7} />
                </mesh>
                {/* Khối thấu kính thủy tinh */}
                <mesh position={[0, 0.19, 0]} rotation={[0, Math.PI / 2, 0]}>
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
                <mesh ref={lensAuraRef} position={[0, 0.19, 0]} visible={false}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshBasicMaterial color={lensType === "converging" ? "#38bdf8" : "#c084fc"} wireframe transparent opacity={0.65} />
                </mesh>
                {/* Nhãn 3D hiển thị rõ ràng */}
                <group position={[0, 0.32, 0]}>
                    <mesh position={[0, 0, -0.005]}>
                        <planeGeometry args={[0.44, 0.075]} />
                        <meshBasicMaterial color="#090d16" transparent opacity={0.9} />
                    </mesh>
                    <Text position={[0, 0.014, 0.002]} fontSize={0.032} color={lensType === "converging" ? "#38bdf8" : "#c084fc"} anchorX="center">
                        {lensType === "converging" ? "Thấu Kính Hội Tụ (f = +35cm)" : "Thấu Kính Phân Kỳ (f = -35cm)"}
                    </Text>
                    <Text position={[0, -0.016, 0.002]} fontSize={0.018} color="#94a3b8" anchorX="center">
                        [Bấm đổi loại | Kéo để trượt]
                    </Text>
                </group>
            </group>

            {/* 4. Màn Hứng Ảnh Màu Trắng (Screen) */}
            <group position={[0.82, 0.19, 0]}>
                <mesh position={[0, -0.13, 0]}>
                    <boxGeometry args={[0.08, 0.05, 0.15]} />
                    <meshStandardMaterial color="#475569" metalness={0.8} />
                </mesh>
                <mesh position={[0, -0.06, 0]}>
                    <cylinderGeometry args={[0.009, 0.009, 0.1, 16]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.015, 0.28, 0.24]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.85} />
                </mesh>
                <mesh position={[-0.008, 0, 0]}>
                    <planeGeometry args={[0.26, 0.22]} />
                    <meshBasicMaterial color="#e2e8f0" />
                </mesh>
                <Text position={[0, 0.17, 0]} fontSize={0.035} color="#94a3b8">
                    Màn Chắn
                </Text>
            </group>

            {/* 5. Các Tia Laser Tới & Khúc Xạ theo Định luật Quang Hình học */}
            {[-0.04, 0, 0.04].map((zOffset, idx) => {
                const incidentLength = Math.max(0.05, curLensX - -0.82);
                const incidentMidX = (-0.82 + curLensX) / 2;

                const dx = 0.82 - curLensX;
                // Nếu Hội Tụ: tia hội tụ về f = 0.35m
                // Nếu Phân Kỳ: tia loe ra với tiêu cự ảo f = -0.35m
                const slope = lensType === "converging" ? -zOffset / focalLength : zOffset / focalLength;
                const targetZ = zOffset + slope * dx;

                const refractedLength = Math.hypot(dx, targetZ - zOffset);
                const refractedMidX = (curLensX + 0.82) / 2;
                const refractedMidZ = (zOffset + targetZ) / 2;
                const angleY = -Math.atan2(targetZ - zOffset, dx);

                return (
                    <group key={idx}>
                        {/* Tia tới (Incident ray) từ Laser -> Thấu kính */}
                        <mesh position={[incidentMidX, 0.19, zOffset]}>
                            <boxGeometry args={[incidentLength, 0.0035, 0.0035]} />
                            <meshBasicMaterial color={curColor.hex} />
                        </mesh>
                        {/* Tia khúc xạ (Refracted ray) từ Thấu kính -> Màn hứng */}
                        <mesh
                            position={[refractedMidX, 0.19, refractedMidZ]}
                            rotation={[0, angleY, 0]}
                        >
                            <boxGeometry args={[refractedLength, 0.0035, 0.0035]} />
                            <meshBasicMaterial color={curColor.glow} />
                        </mesh>
                        {/* Điểm sáng trên màn chắn */}
                        <mesh position={[0.81, 0.19, targetZ]}>
                            <sphereGeometry args={[0.012, 16, 16]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                    </group>
                );
            })}

            {/* Tiêu điểm Laser / Vệt hội tụ trên màn */}
            <pointLight
                position={[0.8, 0.19, 0]}
                color={curColor.hex}
                intensity={lensType === "converging" ? 3.0 : 1.2}
                distance={0.8}
            />
        </group>
    );
}

// ─────────────────────────────────────────────────────────────
// 4. MAIN 3D PHYSICS SCENE CONTENT (Memoized, Smooth 60 FPS)
// ─────────────────────────────────────────────────────────────
const PhysicsSceneContent = memo(function PhysicsSceneContent({
    handStateRef,
    currentExp,
    setCurrentExp,
    onPeriodUpdate,
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
    show3DTeacher = true,
    aiSpeech = "",
}: {
    handStateRef: MutableRefObject<HandState>;
    currentExp: PhysicsExperiment;
    setCurrentExp: (exp: PhysicsExperiment) => void;
    onPeriodUpdate: (t: number, angleDeg: number) => void;
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
    show3DTeacher?: boolean;
    aiSpeech?: string;
}) {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);

    // Refs for 60 FPS hand tracking
    const handPosRef = useRef<[number, number, number]>([0, 0, 0]);
    const indexTipRef = useRef<[number, number, number]>([0, 0, 0]);
    const isHoldingRef = useRef<boolean>(false);
    const handTrackedFramesRef = useRef<number>(0);

    // Swipe gesture detection
    const lastPalmXRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(performance.now());
    const vxRef = useRef<number>(0);
    const swipeCooldownRef = useRef<number>(0);

    // Camera Transition State
    const lastExpRef = useRef<PhysicsExperiment>(currentExp);
    const cameraTransitioningRef = useRef<boolean>(true);
    const prevPhysicsPalmRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (lastExpRef.current !== currentExp) {
            lastExpRef.current = currentExp;
            cameraTransitioningRef.current = true;
        }
    }, [currentExp]);

    // Vị trí Camera tối ưu cho từng bài thí nghiệm
    const cameraTargets: Record<PhysicsExperiment, { pos: [number, number, number]; target: [number, number, number] }> =
        useMemo(
            () => ({
                pendulum: { pos: [0, 0.65, 2.1], target: [0, 0.45, 0] },
                circuit: { pos: [0, 0.62, 1.7], target: [0, -0.05, 0] },
                optics: { pos: [0, 0.65, 1.95], target: [0, 0.08, 0] },
                all: { pos: [0, 1.15, 3.4], target: [0, 0.15, 0] },
            }),
            []
        );

    // Cập nhật trạng thái enabled của OrbitControls (luôn giữ cố định)
    const updateOrbitEnabled = useCallback((enabled: boolean) => {
        if (controlsRef.current) {
            controlsRef.current.enableRotate = false;
            controlsRef.current.enablePan = false;
            controlsRef.current.enableZoom = false;
        }
    }, []);

    // Frame update: Camera Lerp & Hand Interactions
    useFrame((_, delta) => {
        const hs = handStateRef.current;
        const now = performance.now();

        // 1. Camera CỐ ĐỊNH CHUẨN XÁC theo từng bài thí nghiệm (không xoay, không lộn xộn)
        const targetCam = cameraTargets[currentExp];
        const targetPos = new THREE.Vector3(...targetCam.pos);
        const targetTarget = new THREE.Vector3(...targetCam.target);
        camera.position.lerp(targetPos, Math.min(1, delta * 6.0));
        if (controlsRef.current) {
            controlsRef.current.target.lerp(targetTarget, Math.min(1, delta * 6.0));
            controlsRef.current.enableRotate = false;
            controlsRef.current.enablePan = false;
            controlsRef.current.enableZoom = false;
            controlsRef.current.update();
        }

        // 2. Hand State & Interaction: Bắt dính dụng cụ siêu nhạy và tự nhiên
        if (hs && hs.detected) {
            handTrackedFramesRef.current++;
            const rawPalm = hs.palmPos || [hs.cursorX, hs.cursorY, hs.cursorZ];
            const rawTip = [hs.cursorX, hs.cursorY, hs.cursorZ];

            // Ánh xạ 100% khớp với visual model 3D (scaleFactor 1.25, positionOffset [0, -0.05, -0.35])
            const p: [number, number, number] = [
                rawPalm[0] * 1.25,
                rawPalm[1] * 1.25 - 0.05,
                rawPalm[2] * 1.25 - 0.35,
            ];
            handPosRef.current = p;

            const tip: [number, number, number] = [
                rawTip[0] * 1.25,
                rawTip[1] * 1.25 - 0.05,
                rawTip[2] * 1.25 - 0.35,
            ];
            indexTipRef.current = tip;

            const grip = Math.max(
                hs.gripStrength ?? 0,
                hs.rightHand?.gripStrength ?? 0,
                hs.leftHand?.gripStrength ?? 0
            );
            const pinch = Math.min(
                hs.pinchDistance ?? 1,
                hs.rightHand?.pinchDistance ?? 1,
                hs.leftHand?.pinchDistance ?? 1
            );
            const extCount = Math.min(
                hs.extendedFingersCount ?? 5,
                hs.rightHand?.detected ? (hs.rightHand.extendedFingersCount ?? 5) : 5,
                hs.leftHand?.detected ? (hs.leftHand.extendedFingersCount ?? 5) : 5
            );

            // Kiểm tra trạng thái xòe tay, dơ ngón trỏ & ngón áp út
            const isOpeningHand = hs.gesture === "OPEN" || extCount >= 3;
            const isPointing = Boolean(hs.isIndexExtended && !hs.isRingExtended && !hs.isPinkyExtended);
            const isRingGrab = Boolean(hs.isRingExtended && !hs.isIndexExtended);

            // Nhận diện CẦM / NẮM:
            // - Nắm tay (GRAB / Fist), Chụm ngón thật sự (Pinch < 0.16), hoặc ngón áp út (isRingGrab)
            // - TUYỆT ĐỐI KHÔNG CẦM khi đang Xòe tay (isOpeningHand) hoặc Dơ ngón trỏ (isPointing)
            const isGrabbingOrHolding =
                !isOpeningHand &&
                !isPointing &&
                (hs.gesture === "GRAB" || grip > 0.60 || pinch < 0.16 || isRingGrab || (extCount <= 2 && extCount > 0));

            isHoldingRef.current = isGrabbingOrHolding;

            // Chống giật vận tốc khi tay vừa mới lọt vào khung hình webcam
            if (handTrackedFramesRef.current < 8) {
                lastPalmXRef.current = p[0];
                lastTimeRef.current = now;
                vxRef.current = 0;
                return;
            }

            // Đo vận tốc ngang để phát hiện Phất tay (Swipe)
            const currentX = p[0];
            const dt = Math.max(0.005, Math.min(0.1, (now - lastTimeRef.current) / 1000));
            const currentVx = (currentX - lastPalmXRef.current) / dt;
            lastPalmXRef.current = currentX;
            lastTimeRef.current = now;

            vxRef.current = THREE.MathUtils.lerp(vxRef.current, currentVx, Math.min(1, delta * 8));

            // Chỉ chuyển Thí nghiệm khi:
            // - Xòe toàn bộ bàn tay (OPEN và >= 4 ngón)
            // - Không nắm tay
            // - Phất tay thật nhanh (> 2.8 m/s)
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
            <PerspectiveCamera makeDefault position={[0, 0.55, 1.65]} fov={48} />
            <OrbitControls
                ref={controlsRef}
                enablePan={false}
                enableZoom={true}
                enableRotate={true}
                minDistance={0.8}
                maxDistance={3.2}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2 - 0.05}
                minAzimuthAngle={-Math.PI / 3}
                maxAzimuthAngle={Math.PI / 3}
                target={[0, 0.45, 0]}
            />

            {/* Room Environment Chuyên Biệt Cho Vật Lý (Zero Lag) */}
            <PhysicsLabRoom />

            {/* Bàn tay 3D được hiển thị toàn cục ở page.tsx trên layer z-[60] (ở phía trước thanh Tab) */}
            {/* <Lab3DFullHandModel handStateRef={handStateRef} positionOffset={[0, -0.05, -0.35]} scaleFactor={1.25} /> */}

            {/* ─── HIỂN THỊ THÍ NGHIỆM TÁCH BIỆT (KHÔNG BỊ DỒN CỤC) ─── */}
            {/* 1. Con Lắc Đơn */}
            {(currentExp === "pendulum" || currentExp === "all") && (
                <Pendulum3D
                    position={currentExp === "all" ? [-1.8, -0.16, 0] : [-0.42, -0.16, 0]}
                    handPosRef={handPosRef}
                    indexTipRef={indexTipRef}
                    isHoldingRef={isHoldingRef}
                    onPeriodUpdate={onPeriodUpdate}
                    manualAngleTrigger={manualAngleTrigger}
                    setOrbitEnabled={updateOrbitEnabled}
                />
            )}

            {/* 2. Mạch Điện Định Luật Ôm */}
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
                />
            )}

            {/* 3. Quang Học Thấu Kính */}
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
                />
            )}

            {/* Nhân vật Cô Giáo AI Đồng Hành 3D (Đứng trên sàn Y = -1.20 bên phải bàn thí nghiệm) */}
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
export default function Lab3DPhysicsScene({ handStateRef }: Lab3DPhysicsSceneProps) {
    const fallbackRef = useRef<HandState>({ ...DEFAULT_HAND_STATE });
    const actualHandRef = handStateRef || fallbackRef;

    const [currentExp, setCurrentExp] = useState<PhysicsExperiment>("pendulum");
    const [pendulumData, setPendulumData] = useState({ period: 2.33, angleDeg: 24.1 });
    const [isCircuitClosed, setIsCircuitClosed] = useState(false);
    const [voltage, setVoltage] = useState(9); // 9V DC
    const [resistance, setResistance] = useState(20); // 20 Ohm
    const [lensOffset, setLensOffset] = useState(0.0); // 0.0m
    const [lensType, setLensType] = useState<"converging" | "diverging">("converging");
    const [laserColor, setLaserColor] = useState<"red" | "green" | "blue">("red");
    const [manualAngleTrigger, setManualAngleTrigger] = useState<{ angleRad: number; timestamp: number } | null>(null);

    const [aiSpeech, setAiSpeech] = useState<string>(
        "Chào mừng em đến với Lab Vật Lý 3D! Em có thể giơ ngón tay ☝️ hoặc giữ nút Nói để đặt câu hỏi về con lắc, mạch điện hay thấu kính nhé!"
    );
    const [aiMode, setAiMode] = useState<"idle" | "speaking" | "warning" | "success" | "listening">("speaking");
    const [show3DTeacher, setShow3DTeacher] = useState(true);
    const [swipeNotice, setSwipeNotice] = useState<string | null>(null);
    const [orbitEnabled, setOrbitEnabled] = useState(true);

    const currentI = isCircuitClosed ? Number((voltage / resistance).toFixed(2)) : 0;

    const handleToggleCircuit = useCallback(() => {
        setIsCircuitClosed((prev) => {
            const next = !prev;
            if (next) {
                setAiMode("success");
                setAiSpeech(
                    `Mạch kín! Dòng điện I = U / R = ${voltage}V / ${resistance}Ω = ${(voltage / resistance).toFixed(2)}A chạy qua làm bóng đèn phát sáng rực rỡ.`
                );
            } else {
                setAiMode("idle");
                setAiSpeech("Mạch đã ngắt, dòng điện I = 0.00A, bóng đèn tắt.");
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

    const handlePeriodUpdate = useCallback((p: number, angle: number) => {
        setPendulumData({ period: Number(p.toFixed(2)), angleDeg: Number(angle.toFixed(1)) });
    }, []);

    const handleSelectExp = (exp: PhysicsExperiment) => {
        setCurrentExp(exp);
        playLabSound("pick");
        if (exp === "pendulum") {
            setAiSpeech("Con Lắc Đơn: Bấm kéo quả lắc hoặc dùng nút kéo góc để thả dao động điều hòa!");
        } else if (exp === "circuit") {
            setAiSpeech("Mạch Điện 3D: Gạt cầu dao đồng hoặc bấm nút BẬT, bấm Pin để đổi Vôn và Trở!");
        } else if (exp === "optics") {
            setAiSpeech("Quang Học Thấu Kính: Bấm đổi Hội Tụ/Phân Kỳ, đổi màu Laser, hoặc kéo thấu kính trên ray!");
        } else {
            setAiSpeech("Chế độ Toàn Cảnh: Bố trí cả 3 bài thí nghiệm rộng rãi trên bàn thí nghiệm 5.6m.");
        }
    };

    // Điều khiển nhanh con lắc
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
                    onPeriodUpdate={handlePeriodUpdate}
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

            {/* ─── 2D HUD: Bảng Đo Lường Vật Lý 3D (Góc trên trái, độc lập & không đè lấn) ─── */}
            <div className="absolute top-16 left-4 z-20 pointer-events-auto max-w-sm w-full sm:w-80 select-none">
                <div className="bg-slate-950/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-3 shadow-2xl text-white">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" /> Bảng Đo Lường Vật Lý 3D
                        </span>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Chu kỳ T</span>
                            <span className="text-xs sm:text-sm font-black text-amber-400">{pendulumData.period} s</span>
                            <span className="text-[9px] text-slate-500 block">{pendulumData.angleDeg}°</span>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Dòng điện I</span>
                            <span className="text-xs sm:text-sm font-black text-cyan-400">
                                {currentI.toFixed(2)} A
                            </span>
                            <span className="text-[9px] text-slate-500 block">{isCircuitClosed ? `${voltage}V Đóng` : "Mở"}</span>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Tiêu cự f</span>
                            <span className={`text-xs sm:text-sm font-black ${lensType === "converging" ? "text-rose-400" : "text-purple-400"}`}>
                                {lensType === "converging" ? "+35 cm" : "-35 cm"}
                            </span>
                            <span className="text-[9px] text-slate-500 block">
                                {lensType === "converging" ? "Hội tụ (Thật)" : "Phân kỳ (Ảo)"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 2D HUD: THANH ĐIỀU KHIỂN & CHUYỂN BÀI THÍ NGHIỆM HỢP NHẤT (ZERO OVERLAP) ─── */}
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
                            <div className="flex flex-wrap items-center justify-center gap-2 w-full text-xs">
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
                                        {deg === 0 ? "0° Đứng yên" : `${deg > 0 ? "+" : ""}${deg}°`}
                                    </button>
                                ))}
                                <div className="hidden sm:flex items-center gap-2 ml-1 pl-2 border-l border-slate-800">
                                    <span className="text-[11px] text-slate-400">Trượt góc:</span>
                                    <input
                                        type="range"
                                        min="-60"
                                        max="60"
                                        value={pendulumData.angleDeg}
                                        onChange={(e) => handleSetPendulumAngle(Number(e.target.value))}
                                        className="w-24 accent-amber-500 cursor-pointer"
                                    />
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
                                    {/* Chọn Thấu Kính */}
                                    <div className="flex items-center gap-1 bg-sky-950/40 border border-sky-500/30 px-2.5 py-0.5 rounded-xl">
                                        <span className="text-sky-300 font-bold text-[11px] flex items-center gap-1">
                                            <Search className="w-3.5 h-3.5 text-sky-400" />
                                            <span>Thấu kính:</span>
                                        </span>
                                        <button
                                            onClick={() => {
                                                setLensType("converging");
                                                playLabSound("pick");
                                                setAiSpeech("Thấu Kính Hội Tụ (f = +35cm): Tia sáng hội tụ tại Tiêu Điểm F trên màn.");
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
                                                setAiSpeech("Thấu Kính Phân Kỳ (f = -35cm): Chùm tia sáng loe rộng ra ngoài tạo ảnh ảo.");
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

                                    {/* Chọn Màu Laser */}
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
                                            setLensOffset((prev) => Math.max(-0.4, Number((prev - 0.15).toFixed(2))));
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
                                            setLensOffset((prev) => Math.min(0.4, Number((prev + 0.15).toFixed(2))));
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
                                            min="-40"
                                            max="40"
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

                    {/* HÀNG 3: Hướng dẫn cử chỉ chính xác (Không còn hướng dẫn xoay/zoom sai lệch) */}
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-300 border-t border-slate-800/80 pt-1.5 px-1 font-medium w-full">
                        <span className="flex items-center gap-1.5 text-sky-400 font-bold bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                            <Hand className="w-3.5 h-3.5 text-sky-400" />
                            <span>Sát thiết bị + Nắm: Cầm / Kéo / Gạt</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                            <Hand className="w-3.5 h-3.5 text-amber-400" />
                            <span>Phất tay trái/phải: Đổi bài thí nghiệm</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                            <MousePointer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Chuột: Bấm trực tiếp 3D hoặc bấm nút điều khiển</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
