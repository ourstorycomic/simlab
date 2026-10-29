"use client";

/**
 * ─── Lab3DFullHandModel ───
 * Mô hình 3D Bàn Tay Sinh Viên/Nhà Khoa Học Đầy Đủ Khối Cơ & Ống Tay Áo Lab:
 * - Thay thế hoàn toàn "mấy cái que" bằng BÀN TAY NGƯỜI ĐẦY ĐỦ THỂ TÍCH (Solid Anatomical Human Hand)
 * - Lòng bàn tay dày dặn, các cơ thenar/hypothenar nối liền cổ tay với 5 khớp ngón tay
 * - Các đốt ngón tay có độ dày tự nhiên (14mm-18mm) với đầu ngón tay mềm mại bo tròn
 * - Cổ tay có Ống tay áo blouse trắng (Lab Coat Sleeve Cuff) tạo cảm giác như nhà khoa học trong phòng lab
 * - Vật liệu da người ấm áp tự nhiên (#f2c1b2) với độ bóng nhẹ, mượt mà 60fps
 * - Hỗ trợ cả 2 bàn tay (Trái & Phải) độc lập
 */

import React, { useRef, useMemo, MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HandState, SingleHandData } from "@/lib/handTracking";

export interface IndexTipInfo {
    screenX: number;
    screenY: number;
    ndcX: number;
    ndcY: number;
    worldPos: THREE.Vector3;
    isPointing: boolean;
}

export interface Lab3DFullHandModelProps {
    handStateRef: MutableRefObject<HandState>;
    positionOffset?: [number, number, number];
    scaleFactor?: number;
    onIndexTipUpdate?: (info: IndexTipInfo | null) => void;
}

// 21 Joint connections for 5 fingers
// Each bone has [startIndex, endIndex, boneType]
type BoneDef = [number, number, "metacarpal" | "proximal" | "middle" | "distal" | "palm_bridge"];

const HAND_BONES: BoneDef[] = [
    // Ngón cái (Thumb)
    [0, 1, "metacarpal"],
    [1, 2, "proximal"],
    [2, 3, "middle"],
    [3, 4, "distal"],

    // Ngón trỏ (Index)
    [0, 5, "metacarpal"],
    [5, 6, "proximal"],
    [6, 7, "middle"],
    [7, 8, "distal"],

    // Ngón giữa (Middle)
    [0, 9, "metacarpal"],
    [9, 10, "proximal"],
    [10, 11, "middle"],
    [11, 12, "distal"],

    // Ngón áp út (Ring)
    [0, 13, "metacarpal"],
    [13, 14, "proximal"],
    [14, 15, "middle"],
    [15, 16, "distal"],

    // Ngón út (Pinky)
    [0, 17, "metacarpal"],
    [17, 18, "proximal"],
    [18, 19, "middle"],
    [19, 20, "distal"],

    // Cầu nối ngang chân các khớp đốt bàn tay (Palm Arch Bridges) - tạo độ liền khối cho lòng bàn tay
    [5, 9, "palm_bridge"],
    [9, 13, "palm_bridge"],
    [13, 17, "palm_bridge"],
    [1, 5, "palm_bridge"], // Màng giữa ngón cái và ngón trỏ
];

function SingleHandMesh({
    getHandData,
    isLeft = false,
    onIndexTipUpdate,
    hasRightHand = false,
}: {
    getHandData: () => SingleHandData;
    isLeft?: boolean;
    onIndexTipUpdate?: (info: IndexTipInfo | null) => void;
    hasRightHand?: boolean;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const sleeveGroupRef = useRef<THREE.Group>(null);
    const palmPadRef = useRef<THREE.Mesh>(null);

    const jointMeshesRef = useRef<(THREE.Mesh | null)[]>([]);
    const boneMeshesRef = useRef<(THREE.Mesh | null)[]>([]);

    // Realistic Human Skin & Lab Coat Materials
    const materials = useMemo(() => {
        return {
            skin: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f1c2b0"), // Màu da người ấm áp tự nhiên
                roughness: 0.42,
                metalness: 0.02,
            }),
            skinPalm: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f5ccbe"), // Lòng bàn tay sáng hơn một chút
                roughness: 0.48,
                metalness: 0.02,
            }),
            joint: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#e9b5a4"),
                roughness: 0.45,
                metalness: 0.02,
            }),
            fingertipOpen: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f4a99b"), // Đầu ngón tay ửng hồng tự nhiên
                roughness: 0.38,
                metalness: 0.02,
            }),
            fingertipGrab: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f59e0b"), // Đầu ngón sáng cam hổ phách khi nắm vật
                emissive: new THREE.Color("#d97706"),
                emissiveIntensity: 0.45,
                roughness: 0.25,
            }),
            // Ống tay áo blouse trắng của nhà khoa học
            labCoatSleeve: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f8fafc"),
                roughness: 0.65,
                metalness: 0.05,
            }),
            labCoatTrim: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0284c7"), // Viền xanh pastel ở cổ tay áo
                roughness: 0.35,
                metalness: 0.2,
            }),
        };
    }, []);

    // Geometries với độ dày giải phẫu chuẩn bàn tay người (không còn que nhỏ)
    const geometries = useMemo(() => {
        return {
            // Đốt ngón gốc (Metacarpal - mu bàn tay): dày và vững
            metacarpal: new THREE.CylinderGeometry(0.015, 0.018, 1, 14),
            // Đốt ngón 1 (Proximal): dày 14-16mm
            proximal: new THREE.CylinderGeometry(0.0125, 0.0145, 1, 14),
            // Đốt ngón 2 (Middle): dày 11-13mm
            middle: new THREE.CylinderGeometry(0.0105, 0.0125, 1, 14),
            // Đốt ngón 3 (Distal): thon về đầu ngón
            distal: new THREE.CylinderGeometry(0.009, 0.0108, 1, 14),
            // Màng nối cơ lòng bàn tay
            palm_bridge: new THREE.CylinderGeometry(0.011, 0.012, 1, 12),

            // Khớp cổ tay to đầy
            wristJoint: new THREE.SphereGeometry(0.026, 16, 16),
            // Khớp gốc ngón tay
            knuckleJoint: new THREE.SphereGeometry(0.0145, 14, 14),
            // Khớp giữa ngón
            midJoint: new THREE.SphereGeometry(0.012, 12, 12),
            // Đầu ngón tay bo tròn mềm mại
            fingertip: new THREE.SphereGeometry(0.0115, 14, 14),

            // Đệm thịt lòng bàn tay (Palm Cushion Pad)
            palmPad: new THREE.SphereGeometry(0.038, 16, 16),

            // Ống tay áo Lab Coat
            sleeve: new THREE.CylinderGeometry(0.046, 0.052, 0.12, 20),
            sleeveCuff: new THREE.CylinderGeometry(0.047, 0.047, 0.018, 20),
        };
    }, []);

    const vA = useMemo(() => new THREE.Vector3(), []);
    const vB = useMemo(() => new THREE.Vector3(), []);
    const vMid = useMemo(() => new THREE.Vector3(), []);
    const vDir = useMemo(() => new THREE.Vector3(), []);
    const upVec = useMemo(() => new THREE.Vector3(0, 1, 0), []);
    const quaternion = useMemo(() => new THREE.Quaternion(), []);

    const smoothedLandmarks = useRef<THREE.Vector3[]>(
        Array.from({ length: 21 }, () => new THREE.Vector3(0, 0, 0))
    );
    const smoothedWrist = useRef(new THREE.Vector3(0, 0, 0.45));
    const smoothedNormScale = useRef(0.5);

    useFrame((state, delta) => {
        const data = getHandData();
        if (!groupRef.current) return;

        if (!data || !data.detected || data.landmarks.length < 21) {
            groupRef.current.visible = false;
            if (onIndexTipUpdate && (!isLeft || !hasRightHand)) {
                onIndexTipUpdate(null);
            }
            return;
        }

        groupRef.current.visible = true;

        const currentVecs: THREE.Vector3[] = [];

        // ─── Chuẩn hóa kích thước bàn tay theo giải phẫu người thực tế (~18cm) ───
        const wristLm = data.landmarks[0];
        const middleMcpLm = data.landmarks[9];
        const rawHandSpan = Math.max(0.04, Math.hypot(middleMcpLm.x - wristLm.x, middleMcpLm.y - wristLm.y));
        const rawNormScale = 0.095 / rawHandSpan;

        // Tọa độ gốc cổ tay trong thế giới 3D
        const rawWristX = -(wristLm.x - 0.5) * 1.8;
        const rawWristY = (1.0 - wristLm.y) * 1.05 - 0.05;
        const rawWristZ = 0.35 + (wristLm.z || 0) * 0.95;

        // Lọc thông thấp (EMA Low-Pass Filter) khử rung giật webcam cực mượt
        const wristLerp = Math.min(1, delta * 18);
        smoothedWrist.current.x = THREE.MathUtils.lerp(smoothedWrist.current.x, rawWristX, wristLerp);
        smoothedWrist.current.y = THREE.MathUtils.lerp(smoothedWrist.current.y, rawWristY, wristLerp);
        smoothedWrist.current.z = THREE.MathUtils.lerp(smoothedWrist.current.z, rawWristZ, wristLerp);

        const scaleLerp = Math.min(1, delta * 14);
        smoothedNormScale.current = THREE.MathUtils.lerp(smoothedNormScale.current, rawNormScale, scaleLerp);

        const wristWorldX = smoothedWrist.current.x;
        const wristWorldY = smoothedWrist.current.y;
        const wristWorldZ = smoothedWrist.current.z;
        const normScale = smoothedNormScale.current;

        for (let i = 0; i < 21; i++) {
            const lm = data.landmarks[i];

            // Tọa độ 3D của từng khớp ngón tay: Cổ tay + độ lệch ngón chuẩn hóa
            const wx = wristWorldX - (lm.x - wristLm.x) * normScale;
            const wy = wristWorldY - (lm.y - wristLm.y) * normScale;
            const wz = wristWorldZ + ((lm.z || 0) - (wristLm.z || 0)) * normScale;

            const target = new THREE.Vector3(wx, wy, wz);
            // Nội suy liên tục không có deadband, triệt tiêu 100% hiện tượng khựng giật
            smoothedLandmarks.current[i].lerp(target, Math.min(1, delta * 20));
            currentVecs.push(smoothedLandmarks.current[i]);
        }

        const isGrabbing = data.gesture === "GRAB" || data.gesture === "POUR";

        // 1. Cập nhật các khớp ngón tay (Joints)
        for (let i = 0; i < 21; i++) {
            const mesh = jointMeshesRef.current[i];
            if (mesh) {
                mesh.position.copy(currentVecs[i]);
                const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
                if (isTip) {
                    mesh.material = isGrabbing ? materials.fingertipGrab : materials.fingertipOpen;
                }
            }
        }

        // Cập nhật vị trí đầu ngón trỏ chính xác tuyệt đối trên màn hình
        if (onIndexTipUpdate && (!isLeft || !hasRightHand)) {
            const tipMesh = jointMeshesRef.current[8];
            if (tipMesh && groupRef.current) {
                tipMesh.updateWorldMatrix(true, false);
                const worldPos = new THREE.Vector3();
                tipMesh.getWorldPosition(worldPos);

                // Thêm độ lệch nhẹ ~1.2cm theo hướng ngón trỏ để điểm chấm rơi chuẩn xác vào chóp đầu ngón tay
                if (currentVecs[8] && currentVecs[7]) {
                    const tipDir = vA.subVectors(currentVecs[8], currentVecs[7]).normalize();
                    const scaledOffset = tipDir.multiplyScalar(0.012);
                    scaledOffset.applyQuaternion(groupRef.current.quaternion);
                    worldPos.add(scaledOffset);
                }

                const ndc = worldPos.clone().project(state.camera);
                const rect = state.gl.domElement.getBoundingClientRect();
                const screenX = rect.left + ((ndc.x + 1) * state.size.width) / 2;
                const screenY = rect.top + ((-ndc.y + 1) * state.size.height) / 2;
                onIndexTipUpdate({
                    screenX,
                    screenY,
                    ndcX: ndc.x,
                    ndcY: ndc.y,
                    worldPos,
                    isPointing: !!data.isIndexExtended,
                });
            }
        }

        // 2. Cập nhật các khối xương và màng nối lòng bàn tay (Hand Bones & Palm Bridges)
        for (let b = 0; b < HAND_BONES.length; b++) {
            const [idxA, idxB] = HAND_BONES[b];
            const mesh = boneMeshesRef.current[b];
            if (!mesh) continue;

            vA.copy(currentVecs[idxA]);
            vB.copy(currentVecs[idxB]);

            vMid.addVectors(vA, vB).multiplyScalar(0.5);
            mesh.position.copy(vMid);

            const boneLen = vA.distanceTo(vB);
            mesh.scale.set(1, Math.max(0.001, boneLen), 1);

            vDir.subVectors(vB, vA).normalize();
            quaternion.setFromUnitVectors(upVec, vDir);
            mesh.quaternion.copy(quaternion);
        }

        // 3. Đệm thịt lòng bàn tay (Palm Pad Center)
        if (palmPadRef.current) {
            // Trọng tâm lòng bàn tay = trung bình giữa cổ tay (0) và các khớp gốc (5, 9, 13, 17)
            const palmCenterX = (currentVecs[0].x + currentVecs[5].x + currentVecs[9].x + currentVecs[13].x + currentVecs[17].x) * 0.2;
            const palmCenterY = (currentVecs[0].y + currentVecs[5].y + currentVecs[9].y + currentVecs[13].y + currentVecs[17].y) * 0.2;
            const palmCenterZ = (currentVecs[0].z + currentVecs[5].z + currentVecs[9].z + currentVecs[13].z + currentVecs[17].z) * 0.2;
            palmPadRef.current.position.set(palmCenterX, palmCenterY, palmCenterZ);
            // Dẹp nhẹ theo trục Z để tạo hình dẹt tự nhiên của mu bàn tay
            palmPadRef.current.scale.set(1.25, 1.15, 0.65);
        }

        // 4. Ống tay áo Lab Coat vươn ra từ cổ tay lùi về sau
        if (sleeveGroupRef.current) {
            const wrist = currentVecs[0];
            const middleKnuckle = currentVecs[9];

            // Hướng cánh tay: từ ngón giữa về cổ tay và kéo dài ra sau
            vDir.subVectors(wrist, middleKnuckle).normalize();
            // Đặt gốc ống tay áo cách cổ tay 6cm về phía sau
            const sleevePos = wrist.clone().addScaledVector(vDir, 0.07);
            sleeveGroupRef.current.position.copy(sleevePos);

            quaternion.setFromUnitVectors(upVec, vDir);
            sleeveGroupRef.current.quaternion.copy(quaternion);
        }
    });

    return (
        <group ref={groupRef}>
            {/* ─── ỐNG TAY ÁO LAB COAT TRẮNG TẠI CỔ TAY ─── */}
            <group ref={sleeveGroupRef}>
                {/* Ống tay vải trắng */}
                <mesh geometry={geometries.sleeve} material={materials.labCoatSleeve} />
                {/* Bo viền xanh ở cổ tay áo */}
                <mesh position={[0, -0.05, 0]} geometry={geometries.sleeveCuff} material={materials.labCoatTrim} />
            </group>

            {/* ─── ĐỆM THỊT LÒNG BÀN TAY (PALM CUSHION) ─── */}
            <mesh ref={palmPadRef} geometry={geometries.palmPad} material={materials.skinPalm} />

            {/* ─── 21 KHỚP XƯƠNG ĐẦY ĐẶN ─── */}
            {Array.from({ length: 21 }).map((_, i) => {
                const isWrist = i === 0;
                const isKnuckle = i === 1 || i === 5 || i === 9 || i === 13 || i === 17;
                const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;

                const geo = isWrist
                    ? geometries.wristJoint
                    : isTip
                    ? geometries.fingertip
                    : isKnuckle
                    ? geometries.knuckleJoint
                    : geometries.midJoint;

                const mat = isTip
                    ? materials.fingertipOpen
                    : isWrist
                    ? materials.skin
                    : materials.joint;

                return (
                    <mesh
                        key={`joint-${i}`}
                        ref={(el) => {
                            jointMeshesRef.current[i] = el;
                        }}
                        geometry={geo}
                        material={mat}
                    />
                );
            })}

            {/* ─── CÁC ĐOẠN XƯƠNG VÀ CẦU NỐI CƠ LÒNG BÀN TAY ─── */}
            {HAND_BONES.map(([_, __, boneType], b) => (
                <mesh
                    key={`bone-${b}`}
                    ref={(el) => {
                        boneMeshesRef.current[b] = el;
                    }}
                    geometry={geometries[boneType]}
                    material={boneType === "palm_bridge" || boneType === "metacarpal" ? materials.skinPalm : materials.skin}
                />
            ))}
        </group>
    );
}

// ─── Main Exported Dual-Hand Model Component ───
export default function Lab3DFullHandModel({
    handStateRef,
    positionOffset = [0, 0, 0],
    scaleFactor = 1.0,
    onIndexTipUpdate,
}: Lab3DFullHandModelProps) {
    const hasRightHand = !!(handStateRef.current.rightHand && handStateRef.current.rightHand.detected);

    return (
        <group position={positionOffset} scale={scaleFactor}>
            {/* Bàn tay Phải (Right Hand) */}
            <SingleHandMesh
                getHandData={() => {
                    const hs = handStateRef.current;
                    if (hs.rightHand && hs.rightHand.detected) {
                        return hs.rightHand;
                    }
                    if (hs.detected && (!hs.leftHand || !hs.leftHand.detected)) {
                        return hs;
                    }
                    return hs.rightHand;
                }}
                isLeft={false}
                onIndexTipUpdate={onIndexTipUpdate}
            />

            {/* Bàn tay Trái (Left Hand) */}
            <SingleHandMesh
                getHandData={() => {
                    const hs = handStateRef.current;
                    return hs.leftHand;
                }}
                isLeft={true}
                onIndexTipUpdate={onIndexTipUpdate}
                hasRightHand={hasRightHand}
            />
        </group>
    );
}
