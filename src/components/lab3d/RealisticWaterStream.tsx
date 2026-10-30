"use client";

/**
 * ─── RealisticWaterStream ───
 * Mô phỏng dòng chảy chất lỏng tự nhiên chuẩn vật lý phòng thí nghiệm (Physical Laboratory Fluid Jet):
 * - Tia nước côn thuôn tự nhiên theo gia tốc rơi trọng lực (Tapered Gravity Arc Jet)
 * - Hiệu ứng gợn sóng lấp lánh dọc dòng chảy thời gian thực (Dynamic Liquid Wave Shimmer 60fps)
 * - 2 lớp chất lỏng: Lõi dung dịch đậm đà bên trong + Vỏ bọc khúc xạ ánh sáng (Dual-layer refractive fluid)
 * - Va chạm mặt thoáng: Bọt sủi, vòng sóng loang nhịp nhàng và giọt bắn tung tóe rơi theo trọng lực
 * - Tự động phát âm thanh sủi bọt/rót nước róc rách chân thật
 */

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { playLabSound, stopLabSound } from "./ChemistryRealisticModels";

interface RealisticWaterStreamProps {
    from: [number, number, number]; // Tọa độ mép miệng bình rót
    to: [number, number, number];   // Tọa độ miệng bình nhận
    color?: string;
    active: boolean;
}

const SEGMENTS = 24;
const RADIAL_SEGS = 12;

export default function RealisticWaterStream({
    from,
    to,
    color = "#38bdf8",
    active,
}: RealisticWaterStreamProps) {
    const streamMeshRef = useRef<THREE.Mesh>(null);
    const coreMeshRef = useRef<THREE.Mesh>(null);
    const ripple1Ref = useRef<THREE.Mesh>(null);
    const ripple2Ref = useRef<THREE.Mesh>(null);
    const splashGroupRef = useRef<THREE.Group>(null);

    // Phát âm thanh rót nước tự nhiên (Chỉ kích hoạt theo trạng thái active, không phụ thuộc tọa độ tránh re-trigger 60Hz)
    useEffect(() => {
        if (active) {
            playLabSound("bubbles", true);
        } else {
            stopLabSound("bubbles");
        }
        return () => {
            stopLabSound("bubbles");
        };
    }, [active]);

    // Tạo BufferGeometry hình ống côn (Tapered Tube) uốn theo đường parabol trọng lực
    const { basePoints, baseTangents } = useMemo(() => {
        const pStart = new THREE.Vector3(...from);
        const pEnd = new THREE.Vector3(...to);

        const pts: THREE.Vector3[] = [];
        const tangents: THREE.Vector3[] = [];

        for (let i = 0; i <= SEGMENTS; i++) {
            const t = i / SEGMENTS;
            // Parabol trọng lực thực tế: Ban đầu dốc thoai thoải, càng xuống dưới càng dốc đứng do gia tốc g
            const x = THREE.MathUtils.lerp(pStart.x, pEnd.x, t);
            const z = THREE.MathUtils.lerp(pStart.z, pEnd.z, t);
            const y = pStart.y - (pStart.y - pEnd.y) * Math.pow(t, 1.32);
            pts.push(new THREE.Vector3(x, y, z));
        }

        for (let i = 0; i <= SEGMENTS; i++) {
            const prev = pts[Math.max(0, i - 1)];
            const next = pts[Math.min(SEGMENTS, i + 1)];
            tangents.push(next.clone().sub(prev).normalize());
        }

        return { basePoints: pts, baseTangents: tangents };
    }, [from, to]);

    // Tạo hình học tia nước thuôn côn
    const { streamGeometry, coreGeometry } = useMemo(() => {
        const buildTaperedGeometry = (radiusScale: number) => {
            const geom = new THREE.BufferGeometry();
            const vertexCount = (SEGMENTS + 1) * RADIAL_SEGS;
            const positions = new Float32Array(vertexCount * 3);
            const uvs = new Float32Array(vertexCount * 2);
            const indices: number[] = [];

            const up = new THREE.Vector3(0, 1, 0);

            for (let i = 0; i <= SEGMENTS; i++) {
                const t = i / SEGMENTS;
                const center = basePoints[i];
                const tan = baseTangents[i];

                // Bán kính tia nước: Miệng bình dày 8.5mm, rơi xuống dưới thuôn lại còn 4.2mm (do gia tốc trọng lực)
                const baseR = (0.0085 - t * 0.0043) * radiusScale;

                // Tạo hệ tọa độ cục bộ vuông góc với tiếp tuyến dòng chảy
                let normal = new THREE.Vector3().crossVectors(tan, up).normalize();
                if (normal.lengthSq() < 0.001) {
                    normal = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 0, 1)).normalize();
                }
                const binormal = new THREE.Vector3().crossVectors(tan, normal).normalize();

                for (let j = 0; j < RADIAL_SEGS; j++) {
                    const phi = (j / RADIAL_SEGS) * Math.PI * 2;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    const vx = center.x + (normal.x * cosPhi + binormal.x * sinPhi) * baseR;
                    const vy = center.y + (normal.y * cosPhi + binormal.y * sinPhi) * baseR;
                    const vz = center.z + (normal.z * cosPhi + binormal.z * sinPhi) * baseR;

                    const idx = (i * RADIAL_SEGS + j) * 3;
                    positions[idx] = vx;
                    positions[idx + 1] = vy;
                    positions[idx + 2] = vz;

                    const uvIdx = (i * RADIAL_SEGS + j) * 2;
                    uvs[uvIdx] = j / RADIAL_SEGS;
                    uvs[uvIdx + 1] = t;
                }
            }

            for (let i = 0; i < SEGMENTS; i++) {
                for (let j = 0; j < RADIAL_SEGS; j++) {
                    const nextJ = (j + 1) % RADIAL_SEGS;
                    const a = i * RADIAL_SEGS + j;
                    const b = i * RADIAL_SEGS + nextJ;
                    const c = (i + 1) * RADIAL_SEGS + nextJ;
                    const d = (i + 1) * RADIAL_SEGS + j;

                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }

            geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
            geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
            geom.setIndex(indices);
            geom.computeVertexNormals();

            return geom;
        };

        return {
            streamGeometry: buildTaperedGeometry(1.0),
            coreGeometry: buildTaperedGeometry(0.68),
        };
    }, [basePoints, baseTangents]);

    // 1. Vật liệu bề mặt nước óng ánh, trong suốt và khúc xạ (Outer Liquid Sheath)
    const streamMaterial = useMemo(() => {
        return new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(color),
            emissive: new THREE.Color(color),
            emissiveIntensity: 0.18,
            roughness: 0.02,
            metalness: 0.04,
            transmission: 0.72,
            ior: 1.333,
            thickness: 0.08,
            transparent: true,
            opacity: 0.88,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            depthWrite: false,
        });
    }, [color]);

    // 2. Lõi dòng nước đậm đà (Inner Fluid Core) tạo cảm giác dòng nước đặc ruột sống động
    const coreMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            emissive: new THREE.Color(color),
            emissiveIntensity: 0.38,
            roughness: 0.15,
            metalness: 0.02,
            transparent: true,
            opacity: 0.94,
            depthWrite: false,
        });
    }, [color]);

    // Giọt nước li ti bắn tung tóe thực tế tại điểm tiếp xúc đáy/mặt thoáng
    const splashDroplets = useMemo(() => {
        return Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2 + (i % 2) * 0.25;
            const spread = 0.012 + (i % 3) * 0.006;
            return {
                id: i,
                vx: Math.cos(angle) * spread,
                vz: Math.sin(angle) * spread,
                speed: 3.5 + (i % 4) * 0.8,
                phase: (i / 8) * Math.PI * 2,
                size: 0.0022 + (i % 3) * 0.0008,
            };
        });
    }, []);

    // Hiệu ứng chuyển động sóng gợn và nước chảy 60fps
    useFrame(({ clock }) => {
        if (!active) return;
        const time = clock.getElapsedTime();

        // 1. Gợn sóng lăn tăn loang dần tại miệng bình nhận
        if (ripple1Ref.current) {
            const progress = (time * 2.2) % 1.0;
            const s = 0.6 + progress * 1.6;
            ripple1Ref.current.scale.set(s, s, s);
            (ripple1Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.75 - progress * 0.75);
        }
        if (ripple2Ref.current) {
            const progress = (time * 2.2 + 0.5) % 1.0;
            const s = 0.6 + progress * 1.6;
            ripple2Ref.current.scale.set(s, s, s);
            (ripple2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.75 - progress * 0.75);
        }

        // 2. Chuyển động giọt nước bắn tung tóe cong nhẹ hình nón
        if (splashGroupRef.current) {
            const children = splashGroupRef.current.children;
            splashDroplets.forEach((d, idx) => {
                const child = children[idx] as THREE.Mesh;
                if (child) {
                    const cycle = ((time * d.speed + d.phase) % (Math.PI * 2));
                    const sinVal = Math.sin(cycle);
                    if (sinVal > 0) {
                        child.visible = true;
                        child.position.set(
                            to[0] + d.vx * sinVal * 1.8,
                            to[1] + 0.008 + sinVal * 0.028,
                            to[2] + d.vz * sinVal * 1.8
                        );
                    } else {
                        child.visible = false;
                    }
                }
            });
        }
    });

    // Chỉ hiển thị tia nước khi đang rót VÀ miệng bình rót (from) cao hơn miệng bình nhận (to)
    if (!active || from[1] <= to[1] + 0.015) return null;

    return (
        <group>
            {/* Lõi nước đậm đà bên trong */}
            <mesh ref={coreMeshRef} geometry={coreGeometry} material={coreMaterial} renderOrder={3} />

            {/* Vỏ khúc xạ ánh sáng trong suốt bóng bẩy bên ngoài */}
            <mesh ref={streamMeshRef} geometry={streamGeometry} material={streamMaterial} renderOrder={4} />

            {/* Vòng sóng nước loang 1 */}
            <mesh
                ref={ripple1Ref}
                position={[to[0], to[1] + 0.004, to[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={5}
            >
                <ringGeometry args={[0.008, 0.024, 24]} />
                <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>

            {/* Vòng sóng nước loang 2 */}
            <mesh
                ref={ripple2Ref}
                position={[to[0], to[1] + 0.004, to[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={5}
            >
                <ringGeometry args={[0.008, 0.032, 24]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>

            {/* Giọt nước li ti bắn tung tóe quanh điểm rơi */}
            <group ref={splashGroupRef}>
                {splashDroplets.map((d) => (
                    <mesh key={d.id} material={streamMaterial} renderOrder={6}>
                        <sphereGeometry args={[d.size, 8, 8]} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}
