"use client";

/**
 * ─── ChemistryRealisticModels ───
 * Module nạp & tái sử dụng các 3D Model chuyên nghiệp từ dự án Unity Chemistry-Lab-master:
 * - Dụng cụ thí nghiệm (flask.fbx): Beaker (flask_7), Erlenmeyer (flask_1), Test Tube (flask_10), Lọ hóa chất (flask_5, flask_2)
 * - Dung dịch bên trong (solution_1, solution_7, solution_10, solution_5) mô phỏng chất lỏng chính xác theo hình dáng bình
 * - Đạo cụ phòng thí nghiệm (laboratory_props.fbx): Kính hiển vi (microscope), Chân kiềng (tripod), Cân điện tử (weight), Lò nung (stove)
 * - Bảng tuần hoàn hóa học treo tường (periodic_table.png)
 * - Âm thanh chân thực: tiếng bọt sôi (bubbles.wav), tiếng nhặt đồ (pickItem.wav), tiếng đặt đồ (itemPlaced.wav)
 */

import React, { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFBX, useTexture } from "@react-three/drei";

// ─── Sound Effects Utility ───
let bubbleAudio: HTMLAudioElement | null = null;
let pickAudio: HTMLAudioElement | null = null;
let placeAudio: HTMLAudioElement | null = null;

export function playLabSound(type: "bubbles" | "pick" | "place", loop: boolean = false) {
    if (typeof window === "undefined") return;
    try {
        if (type === "bubbles") {
            if (!bubbleAudio) {
                bubbleAudio = new Audio("/models/chemistry/bubbles.wav");
                bubbleAudio.volume = 0.45;
            }
            bubbleAudio.loop = loop;
            if (bubbleAudio.paused) {
                bubbleAudio.currentTime = 0;
                bubbleAudio.play().catch(() => {});
            }
        } else if (type === "pick") {
            if (!pickAudio) {
                pickAudio = new Audio("/models/chemistry/pickItem.wav");
                pickAudio.volume = 0.5;
            }
            pickAudio.currentTime = 0;
            pickAudio.play().catch(() => {});
        } else if (type === "place") {
            if (!placeAudio) {
                placeAudio = new Audio("/models/chemistry/itemPlaced.wav");
                placeAudio.volume = 0.5;
            }
            placeAudio.currentTime = 0;
            placeAudio.play().catch(() => {});
        }
    } catch {
        // Audio might be blocked by browser autoplay policy until user gesture
    }
}

export function stopLabSound(type: "bubbles") {
    if (type === "bubbles" && bubbleAudio) {
        bubbleAudio.pause();
        bubbleAudio.currentTime = 0;
    }
}

// ─── Geometry Cache Hook ───
export function useChemistryGeometries() {
    const flaskFbx = useFBX("/models/chemistry/flask.fbx");

    return useMemo(() => {
        const geometries: Record<string, THREE.BufferGeometry> = {};

        flaskFbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (!geometries[mesh.name]) {
                    geometries[mesh.name] = mesh.geometry.clone();
                }
            }
        });

        return geometries;
    }, [flaskFbx]);
}

// ─── Shared Glass & Liquid Materials Hook ───
export function useRealisticMaterials() {
    return useMemo(() => {
        // Thủy tinh phòng thí nghiệm cao cấp trong suốt, phản xạ sáng bóng mà KHÔNG tốn WebGL transmission buffer
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#f8fafc"),
            roughness: 0.06,
            metalness: 0.08,
            transparent: true,
            opacity: 0.32,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
            reflectivity: 0.9,
            depthWrite: false,
        });

        return { glassMaterial };
    }, []);
}

export type GlasswareType = "erlenmeyer" | "beaker" | "test-tube" | "reagent-bottle" | "round-flask";

interface RealisticGlasswareMeshProps {
    type: GlasswareType;
    fillLevel?: number; // 0.0 -> 1.0
    liquidColor?: string;
    scale?: number | [number, number, number];
    renderGlass?: boolean;
    tiltAngle?: number; // Góc nghiêng của bình để mô phỏng mặt nước cân bằng trọng lực
}

/**
 * Component hiển thị một bình thí nghiệm chuẩn 3D với hình dáng thực tế từ Chemistry-Lab-master
 */
export function RealisticGlasswareMesh({
    type,
    fillLevel = 0.35,
    liquidColor = "#38bdf8",
    scale = 1.0,
    renderGlass = true,
    tiltAngle = 0,
}: RealisticGlasswareMeshProps) {
    const geometries = useChemistryGeometries();
    const { glassMaterial } = useRealisticMaterials();

    // Map loại bình sang submesh tương ứng trong flask.fbx
    const { flaskGeomName, solutionGeomName, defaultScale, yOffset, maxSolutionScaleY, isCylindricalBeaker } = useMemo(() => {
        switch (type) {
            case "beaker":
                return {
                    flaskGeomName: "flask_7",
                    solutionGeomName: "solution_7",
                    defaultScale: 1.0,
                    yOffset: 0.0,
                    maxSolutionScaleY: 1.0,
                    isCylindricalBeaker: true,
                };
            case "erlenmeyer":
                return {
                    flaskGeomName: "flask_1",
                    solutionGeomName: "solution_1",
                    defaultScale: 1.35,
                    yOffset: 0.0,
                    maxSolutionScaleY: 1.8,
                    isCylindricalBeaker: false,
                };
            case "test-tube":
                return {
                    flaskGeomName: "flask_10",
                    solutionGeomName: "solution_10",
                    defaultScale: 1.5,
                    yOffset: 0.0,
                    maxSolutionScaleY: 2.2,
                    isCylindricalBeaker: false,
                };
            case "reagent-bottle":
                return {
                    flaskGeomName: "flask_5",
                    solutionGeomName: "solution_5",
                    defaultScale: 1.05,
                    yOffset: 0.0,
                    maxSolutionScaleY: 1.7,
                    isCylindricalBeaker: false,
                };
            case "round-flask":
            default:
                return {
                    flaskGeomName: "flask_2",
                    solutionGeomName: "solution_2",
                    defaultScale: 1.45,
                    yOffset: 0.0,
                    maxSolutionScaleY: 1.8,
                    isCylindricalBeaker: false,
                };
        }
    }, [type]);

    const flaskGeom = geometries[flaskGeomName];
    const solutionGeom = geometries[solutionGeomName];

    // Scale tổng thể
    const finalScale: [number, number, number] = useMemo(() => {
        if (Array.isArray(scale)) return scale;
        const s = scale * defaultScale;
        return [s, s, s];
    }, [scale, defaultScale]);

    // Material dung dịch bên trong: Màu sắc đậm đà rõ ràng, phản xạ mặt thoáng nước
    const liquidMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(liquidColor),
            emissive: new THREE.Color(liquidColor),
            emissiveIntensity: 0.25,
            roughness: 0.1,
            metalness: 0.05,
            transparent: true,
            opacity: 0.92,
            depthWrite: true,
        });
    }, [liquidColor]);

    const liquidScaleY = Math.max(0.05, Math.min(1.0, fillLevel)) * maxSolutionScaleY;

    // Cốc thủy tinh mỏ vát tiêu chuẩn phòng thí nghiệm (Classic Graduated Lab Beaker)
    if (isCylindricalBeaker) {
        const beakerH = 0.24 * (typeof scale === "number" ? scale : 1.0);
        const beakerR = 0.075 * (typeof scale === "number" ? scale : 1.0);
        const liquidH = Math.max(0.015, fillLevel * (beakerH - 0.03));

        return (
            <group position={[0, yOffset, 0]}>
                {/* 1. Dung dịch bên trong cốc */}
                {fillLevel > 0.03 && (
                    <group position={[0, liquidH / 2 + 0.004, 0]}>
                        <mesh material={liquidMaterial} renderOrder={0}>
                            <cylinderGeometry args={[beakerR - 0.004, beakerR - 0.005, liquidH, 24]} />
                        </mesh>
                        {/* Mặt thoáng chất lỏng */}
                        <mesh position={[0, liquidH / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <circleGeometry args={[beakerR - 0.004, 24]} />
                            <meshStandardMaterial
                                color={liquidColor}
                                emissive={liquidColor}
                                emissiveIntensity={0.25}
                                roughness={0.05}
                                transparent
                                opacity={0.9}
                            />
                        </mesh>
                    </group>
                )}

                {/* 2. Vỏ cốc thủy tinh trong suốt */}
                {renderGlass && (
                    <>
                        <mesh position={[0, beakerH / 2, 0]} material={glassMaterial} renderOrder={1}>
                            <cylinderGeometry args={[beakerR, beakerR - 0.003, beakerH, 32, 1, true]} />
                        </mesh>
                        {/* Đáy cốc dày */}
                        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glassMaterial} renderOrder={1}>
                            <circleGeometry args={[beakerR - 0.003, 32]} />
                        </mesh>
                        {/* Vành miệng bo tròn */}
                        <mesh position={[0, beakerH, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glassMaterial} renderOrder={1}>
                            <torusGeometry args={[beakerR, 0.005, 12, 32]} />
                        </mesh>
                        {/* Vạch chia độ ml màu trắng trên thân cốc */}
                        {[0.25, 0.5, 0.75].map((pct, idx) => (
                            <mesh key={idx} position={[0, beakerH * pct, beakerR]} rotation={[0, 0, 0]}>
                                <planeGeometry args={[0.025, 0.002]} />
                                <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
                            </mesh>
                        ))}
                    </>
                )}
            </group>
        );
    }

    return (
        <group position={[0, yOffset, 0]}>
            {/* 1. Dung dịch bên trong từ FBX hoặc hình trụ cho ống nghiệm (Khớp khít 100% trong lòng bình) */}
            {fillLevel > 0.03 && (
                type === "test-tube" ? (
                    <group position={[0, (fillLevel * 0.18) / 2 + 0.005, 0]}>
                        <mesh material={liquidMaterial} renderOrder={0}>
                            <cylinderGeometry args={[0.024, 0.024, fillLevel * 0.18, 20]} />
                        </mesh>
                        <mesh position={[0, (fillLevel * 0.18) / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} material={liquidMaterial} renderOrder={0}>
                            <circleGeometry args={[0.024, 20]} />
                        </mesh>
                    </group>
                ) : solutionGeom ? (
                    <mesh
                        geometry={solutionGeom}
                        material={liquidMaterial}
                        scale={[finalScale[0] * 0.99, finalScale[1] * liquidScaleY, finalScale[2] * 0.99]}
                        renderOrder={0}
                    />
                ) : null
            )}

            {/* 2. Vỏ thủy tinh thực tế từ FBX (Render sau) */}
            {renderGlass && flaskGeom && (
                <mesh
                    geometry={flaskGeom}
                    material={glassMaterial}
                    scale={finalScale}
                    renderOrder={1}
                />
            )}
        </group>
    );
}

// ─── Đạo Cụ Phòng Thí Nghiệm (Microscope, Tripod, Weight Scale, Stove) ───
export function RealisticLabProps() {
    const propsFbx = useFBX("/models/chemistry/laboratory_props.fbx");
    const texture = useTexture("/models/chemistry/laboratory_props_AlbedoTransparency.png");

    useEffect(() => {
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
    }, [texture]);

    const propsGeometries = useMemo(() => {
        const geoms: Record<string, THREE.BufferGeometry> = {};
        propsFbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (!geoms[mesh.name]) {
                    geoms[mesh.name] = mesh.geometry.clone();
                }
            }
        });
        return geoms;
    }, [propsFbx]);

    const propMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.45,
            metalness: 0.25,
        });
    }, [texture]);

    return (
        <group>
            {/* 1. Kính Hiển Vi Chuyên Nghiệp (Optical Microscope) đặt ở bàn bên trái */}
            {propsGeometries["microscope"] && (
                <mesh
                    geometry={propsGeometries["microscope"]}
                    material={propMaterial}
                    position={[-1.75, -0.06, 0.2]}
                    rotation={[0, Math.PI / 4, 0]}
                    scale={[1.35, 1.35, 1.35]}
                    castShadow
                />
            )}

            {/* 2. Cân Điện Tử / Cân Phân Tích (Analytical Weight Scale) bên trái bàn */}
            {propsGeometries["weight"] && (
                <mesh
                    geometry={propsGeometries["weight"]}
                    material={propMaterial}
                    position={[-1.25, -0.06, 0.45]}
                    rotation={[0, 0.2, 0]}
                    scale={[1.25, 1.25, 1.25]}
                    castShadow
                />
            )}

            {/* 3. Giá Đỡ / Chân Kiềng Thí Nghiệm (Burner Tripod Stand) bên phải bàn */}
            {propsGeometries["tripod"] && (
                <group position={[1.5, -0.06, 0.15]} scale={[1.15, 1.15, 1.15]}>
                    <mesh geometry={propsGeometries["tripod"]} material={propMaterial} castShadow />
                    {propsGeometries["tripod2"] && (
                        <mesh geometry={propsGeometries["tripod2"]} material={propMaterial} />
                    )}
                    {propsGeometries["tripod001"] && (
                        <mesh geometry={propsGeometries["tripod001"]} material={propMaterial} />
                    )}
                </group>
            )}

            {/* 4. Giá Để Ống Nghiệm Cổ Điển (Test Tube Rack / Stand) */}
            {propsGeometries["stand"] && (
                <mesh
                    geometry={propsGeometries["stand"]}
                    material={propMaterial}
                    position={[1.1, -0.06, 0.52]}
                    scale={[1.5, 1.5, 1.5]}
                    castShadow
                />
            )}

            {/* 5. Lò Nung Thí Nghiệm (Laboratory Stove / Incubator) trên kệ phía sau */}
            {propsGeometries["stove"] && (
                <group position={[3.2, 0.6, -2.2]} scale={[1.1, 1.1, 1.1]}>
                    <mesh geometry={propsGeometries["stove"]} material={propMaterial} castShadow />
                    {propsGeometries["stove_door"] && (
                        <mesh geometry={propsGeometries["stove_door"]} material={propMaterial} />
                    )}
                </group>
            )}
        </group>
    );
}

// ─── Bảng Tuần Hoàn Treo Tường (Periodic Table Wall Chart) ───
export function RealisticPeriodicTable() {
    const texture = useTexture("/models/chemistry/periodic_table.png");

    useEffect(() => {
        texture.colorSpace = THREE.SRGBColorSpace;
    }, [texture]);

    return (
        <group position={[-3.6, 2.3, -3.12]}>
            {/* Khung gỗ viền quanh bảng tuần hoàn */}
            <mesh position={[0, 0, -0.015]}>
                <boxGeometry args={[2.74, 1.58, 0.04]} />
                <meshStandardMaterial color="#451a03" roughness={0.6} />
            </mesh>

            {/* Mặt tranh Bảng Tuần Hoàn Các Nguyên Tố Hóa Học (tỷ lệ 16:9) */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[2.64, 1.48]} />
                <meshBasicMaterial map={texture} />
            </mesh>
        </group>
    );
}

// ─── Tủ Đựng Hóa Chất Cao Cấp Bằng FBX từ Unity (Laboratory Chemical Cupboard) ───
export function RealisticLabCupboard({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
}: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
}) {
    const cupboardFbx = useFBX("/models/chemistry/lab_cupboard.fbx");
    const texture = useTexture("/models/chemistry/lab_cupboard_AlbedoTransparency.png");

    useEffect(() => {
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
    }, [texture]);

    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.38,
            metalness: 0.22,
        });
    }, [texture]);

    const geometry = useMemo(() => {
        let geom: THREE.BufferGeometry | null = null;
        cupboardFbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && !geom) {
                geom = (child as THREE.Mesh).geometry.clone();
            }
        });
        return geom;
    }, [cupboardFbx]);

    if (!geometry) return null;

    return (
        <mesh
            geometry={geometry}
            material={material}
            position={position}
            rotation={rotation}
            scale={scale}
            castShadow
            receiveShadow
        />
    );
}

// ─── Ghế Thí Nghiệm Xoay Bằng FBX từ Unity (Laboratory Chair) ───
export function RealisticLabChair({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
}: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
}) {
    const chairFbx = useFBX("/models/chemistry/chair.fbx");
    const texture = useTexture("/models/chemistry/chair_Albedo.png");

    useEffect(() => {
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
    }, [texture]);

    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.42,
            metalness: 0.28,
        });
    }, [texture]);

    const geometry = useMemo(() => {
        let geom: THREE.BufferGeometry | null = null;
        chairFbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && !geom) {
                geom = (child as THREE.Mesh).geometry.clone();
            }
        });
        return geom;
    }, [chairFbx]);

    if (!geometry) return null;

    return (
        <mesh
            geometry={geometry}
            material={material}
            position={position}
            rotation={rotation}
            scale={scale}
            castShadow
        />
    );
}

