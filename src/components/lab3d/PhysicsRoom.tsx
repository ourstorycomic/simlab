"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";

/**
 * ─── PhysicsLabRoom ───
 * Không gian phòng thí nghiệm Vật Lý chuyên biệt, hiệu năng cao (60+ FPS):
 * - Loại bỏ MeshReflectorMaterial gây tụt FPS và lag
 * - Bàn thí nghiệm chống tĩnh điện, rộng rãi, sạch sẽ
 * - Bảng xanh Vật Lý tiêu chuẩn với các công thức kinh điển
 * - Ánh sáng studio chân thực, tối ưu cho WebGL
 */
export default function PhysicsLabRoom() {
    // ─── Reusable Standard Materials (Tối ưu GPU Draw Calls) ───
    const materials = useMemo(() => {
        return {
            // Mặt bàn thí nghiệm đá graphite chống tĩnh điện màu xám than sang trọng
            benchTop: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#1e293b"),
                roughness: 0.35,
                metalness: 0.15,
            }),
            // Nẹp nhôm bo viền bàn
            aluminumTrim: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#64748b"),
                metalness: 0.85,
                roughness: 0.2,
            }),
            // Chân bàn thép sơn tĩnh điện đen mờ
            steelLegs: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0f172a"),
                roughness: 0.6,
                metalness: 0.2,
            }),
            // Sàn nhà phòng lab vinyl cao cấp
            floorTile: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0f172a"),
                roughness: 0.45,
                metalness: 0.08,
            }),
            // Tường chính phía sau
            wallMain: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f1f5f9"),
                roughness: 0.35,
                metalness: 0.05,
            }),
            // Ốp lamri tường chống bẩn màu ghi lam
            wallWainscot: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#e2e8f0"),
                roughness: 0.4,
                metalness: 0.05,
            }),
            // Bảng đen/xanh viết phấn
            chalkboard: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#063e2c"),
                roughness: 0.75,
                metalness: 0.05,
            }),
            // Khung gỗ/nhôm bảng
            boardFrame: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#94a3b8"),
                metalness: 0.8,
                roughness: 0.25,
            }),
            // Đèn trần LED panel
            ledGlow: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#ffffff"),
            }),
            // Khay phấn nhôm
            chalkTray: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#475569"),
                metalness: 0.8,
                roughness: 0.3,
            }),
        };
    }, []);

    return (
        <group>
            {/* ─── 1. HỆ THỐNG ÁNH SÁNG PHÒNG THÍ NGHIỆP ─── */}
            <ambientLight intensity={0.7} />
            <directionalLight
                position={[4, 6, 4]}
                intensity={1.2}
                castShadow={false}
            />
            {/* Đèn rọi hội tụ từ trần xuống mặt bàn */}
            <pointLight position={[0, 3.2, 0.4]} intensity={1.5} distance={8} color="#ffffff" />
            {/* Đèn rọi thẳng vào bảng xanh cho công thức sắc nét */}
            <pointLight position={[0, 2.0, -1.2]} intensity={2.2} distance={4.5} color="#ffffff" />
            {/* Đèn hắt viền xanh công nghệ (Blue Rim Light) tạo chiều sâu 3D */}
            <pointLight position={[-3, 2.5, -2]} intensity={0.8} distance={7} color="#38bdf8" />
            <pointLight position={[3, 2.5, -2]} intensity={0.8} distance={7} color="#818cf8" />

            {/* ─── 2. SÀN NHÀ PHÒNG LAB HIỆU NĂNG CAO (Smooth, 0ms lag) ─── */}
            <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[22, 22]} />
                <primitive object={materials.floorTile} />
            </mesh>

            {/* Vạch kẻ an toàn sàn nhà màu vàng xám */}
            <mesh position={[0, -1.195, 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[8, 0.06]} />
                <meshStandardMaterial color="#eab308" roughness={0.5} />
            </mesh>

            {/* ─── 3. TƯỜNG SAU (BACK WALL) ─── */}
            <group position={[0, 1.6, -2.8]}>
                {/* Tường trắng kem */}
                <mesh position={[0, 0.6, 0]}>
                    <planeGeometry args={[20, 4.4]} />
                    <primitive object={materials.wallMain} />
                </mesh>
                {/* Lamri ốp chân tường */}
                <mesh position={[0, -2.1, 0.01]}>
                    <planeGeometry args={[20, 1.8]} />
                    <primitive object={materials.wallWainscot} />
                </mesh>
                {/* Nẹp viền phân chia */}
                <mesh position={[0, -1.2, 0.02]}>
                    <boxGeometry args={[20, 0.04, 0.02]} />
                    <primitive object={materials.aluminumTrim} />
                </mesh>
            </group>

            {/* ─── 4. BẢNG XANH VẬT LÝ VỚI CÔNG THỨC CHUẨN ─── */}
            <group position={[0, 1.45, -2.75]}>
                {/* Khung viền nhôm bảng */}
                <mesh>
                    <boxGeometry args={[5.2, 1.7, 0.04]} />
                    <primitive object={materials.boardFrame} />
                </mesh>
                {/* Mặt bảng xanh */}
                <mesh position={[0, 0, 0.025]}>
                    <planeGeometry args={[5.06, 1.56]} />
                    <primitive object={materials.chalkboard} />
                </mesh>

                {/* Tiêu đề bảng */}
                <Text
                    position={[0, 0.62, 0.03]}
                    fontSize={0.09}
                    color="#f8fafc"
                    anchorX="center"
                    anchorY="middle"
                >
                    PHÒNG THỰC HÀNH VẬT LÝ ĐẠI CƯƠNG
                </Text>

                {/* Phân vùng công thức 1: Con lắc đơn */}
                <Text
                    position={[-1.7, 0.35, 0.03]}
                    fontSize={0.075}
                    color="#fef08a"
                    anchorX="center"
                    anchorY="middle"
                >
                    DAO ĐỘNG CƠ HỌC
                </Text>
                <Text
                    position={[-1.7, 0.16, 0.03]}
                    fontSize={0.062}
                    color="#e2e8f0"
                    anchorX="center"
                    anchorY="middle"
                >
                    T = 2π √(l / g)
                </Text>
                <Text
                    position={[-1.7, -0.02, 0.03]}
                    fontSize={0.048}
                    color="#94a3b8"
                    anchorX="center"
                    anchorY="middle"
                >
                    g = 9.81 m/s² • s = s₀ cos(ωt)
                </Text>
                <Text
                    position={[-1.7, -0.22, 0.03]}
                    fontSize={0.052}
                    color="#38bdf8"
                    anchorX="center"
                    anchorY="middle"
                >
                    F_hp = - m g sin(α)
                </Text>

                {/* Phân vùng công thức 2: Điện học */}
                <Text
                    position={[0, 0.35, 0.03]}
                    fontSize={0.075}
                    color="#67e8f9"
                    anchorX="center"
                    anchorY="middle"
                >
                    ĐỊNH LUẬT ÔM & ĐIỆN NĂNG
                </Text>
                <Text
                    position={[0, 0.16, 0.03]}
                    fontSize={0.065}
                    color="#e2e8f0"
                    anchorX="center"
                    anchorY="middle"
                >
                    I = U / R  •  P = U · I
                </Text>
                <Text
                    position={[0, -0.02, 0.03]}
                    fontSize={0.048}
                    color="#94a3b8"
                    anchorX="center"
                    anchorY="middle"
                >
                    Q = I² R t  (Joule - Lenz)
                </Text>
                <Text
                    position={[0, -0.22, 0.03]}
                    fontSize={0.052}
                    color="#f59e0b"
                    anchorX="center"
                    anchorY="middle"
                >
                    U = 9V DC  •  R = 20 Ω
                </Text>

                {/* Phân vùng công thức 3: Quang học */}
                <Text
                    position={[1.7, 0.35, 0.03]}
                    fontSize={0.075}
                    color="#fda4af"
                    anchorX="center"
                    anchorY="middle"
                >
                    QUANG HỌC THẤU KÍNH
                </Text>
                <Text
                    position={[1.7, 0.16, 0.03]}
                    fontSize={0.065}
                    color="#e2e8f0"
                    anchorX="center"
                    anchorY="middle"
                >
                    1/f = 1/d + 1/d&apos;
                </Text>
                <Text
                    position={[1.7, -0.02, 0.03]}
                    fontSize={0.048}
                    color="#94a3b8"
                    anchorX="center"
                    anchorY="middle"
                >
                    k = - d&apos; / d  •  D = 1 / f
                </Text>
                <Text
                    position={[1.7, -0.22, 0.03]}
                    fontSize={0.052}
                    color="#a78bfa"
                    anchorX="center"
                    anchorY="middle"
                >
                    f = +35 cm (Hội tụ)
                </Text>

                {/* Khay phấn ở đáy bảng */}
                <mesh position={[0, -0.83, 0.06]}>
                    <boxGeometry args={[5.0, 0.04, 0.09]} />
                    <primitive object={materials.chalkTray} />
                </mesh>
                {/* Vài viên phấn trắng & vàng trên khay */}
                <mesh position={[-0.4, -0.8, 0.07]} rotation={[0, 0.2, Math.PI / 2]}>
                    <cylinderGeometry args={[0.007, 0.007, 0.06, 8]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[-0.2, -0.8, 0.07]} rotation={[0, -0.1, Math.PI / 2]}>
                    <cylinderGeometry args={[0.007, 0.007, 0.05, 8]} />
                    <meshBasicMaterial color="#fef08a" />
                </mesh>
                <mesh position={[0.2, -0.8, 0.07]} rotation={[0, 0.05, Math.PI / 2]}>
                    <cylinderGeometry args={[0.007, 0.007, 0.06, 8]} />
                    <meshBasicMaterial color="#67e8f9" />
                </mesh>
            </group>

            {/* ─── 5. BÀN THÍ NGHIỆM VẬT LÝ RỘNG RÃI (Main Physics Workbench) ─── */}
            <group position={[0, -0.16, 0]}>
                {/* Mặt bàn chống tĩnh điện (Dài 5.6m, Rộng 1.7m, Dày 8cm) */}
                <mesh position={[0, -0.04, 0]}>
                    <boxGeometry args={[5.6, 0.08, 1.7]} />
                    <primitive object={materials.benchTop} />
                </mesh>

                {/* Nẹp viền hợp kim nhôm bo cạnh bàn */}
                <mesh position={[0, -0.04, 0.85]}>
                    <boxGeometry args={[5.62, 0.085, 0.02]} />
                    <primitive object={materials.aluminumTrim} />
                </mesh>
                <mesh position={[0, -0.04, -0.85]}>
                    <boxGeometry args={[5.62, 0.085, 0.02]} />
                    <primitive object={materials.aluminumTrim} />
                </mesh>
                <mesh position={[-2.8, -0.04, 0]}>
                    <boxGeometry args={[0.02, 0.085, 1.72]} />
                    <primitive object={materials.aluminumTrim} />
                </mesh>
                <mesh position={[2.8, -0.04, 0]}>
                    <boxGeometry args={[0.02, 0.085, 1.72]} />
                    <primitive object={materials.aluminumTrim} />
                </mesh>

                {/* Vạch căn chỉnh milimet dọc theo mép bàn */}
                <mesh position={[0, 0.001, 0.72]}>
                    <boxGeometry args={[5.2, 0.002, 0.02]} />
                    <meshBasicMaterial color="#475569" />
                </mesh>

                {/* Khung chân bàn thép công nghiệp chịu lực */}
                {[-2.5, 2.5].map((x, xi) =>
                    [-0.68, 0.68].map((z, zi) => (
                        <mesh key={`leg-${xi}-${zi}`} position={[x, -0.56, z]}>
                            <boxGeometry args={[0.08, 0.96, 0.08]} />
                            <primitive object={materials.steelLegs} />
                        </mesh>
                    ))
                )}
                {/* Thanh giằng ngang gia cố chân bàn */}
                <mesh position={[-2.5, -0.85, 0]}>
                    <boxGeometry args={[0.06, 0.06, 1.36]} />
                    <primitive object={materials.steelLegs} />
                </mesh>
                <mesh position={[2.5, -0.85, 0]}>
                    <boxGeometry args={[0.06, 0.06, 1.36]} />
                    <primitive object={materials.steelLegs} />
                </mesh>
                <mesh position={[0, -0.85, -0.68]}>
                    <boxGeometry args={[5.0, 0.06, 0.06]} />
                    <primitive object={materials.steelLegs} />
                </mesh>

                {/* Hộp ổ cắm điện thí nghiệm chống giật gắn sau bàn */}
                <group position={[-1.8, 0.08, -0.72]}>
                    <mesh>
                        <boxGeometry args={[0.4, 0.12, 0.08]} />
                        <meshStandardMaterial color="#334155" metalness={0.6} />
                    </mesh>
                    {/* Đèn báo nguồn 220V xanh */}
                    <mesh position={[0.14, 0.02, 0.042]}>
                        <cylinderGeometry args={[0.01, 0.01, 0.01, 8]} />
                        <meshBasicMaterial color="#22c55e" />
                    </mesh>
                </group>
                <group position={[1.8, 0.08, -0.72]}>
                    <mesh>
                        <boxGeometry args={[0.4, 0.12, 0.08]} />
                        <meshStandardMaterial color="#334155" metalness={0.6} />
                    </mesh>
                    <mesh position={[0.14, 0.02, 0.042]}>
                        <cylinderGeometry args={[0.01, 0.01, 0.01, 8]} />
                        <meshBasicMaterial color="#22c55e" />
                    </mesh>
                </group>
            </group>

            {/* ─── 6. HỆ THỐNG ĐÈN LED CHIẾU SÁNG TRẦN (Pendant Studio Lights) ─── */}
            <group position={[0, 3.4, 0]}>
                {/* Máng đèn nhôm dài treo song song bàn */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[4.8, 0.08, 0.35]} />
                    <primitive object={materials.aluminumTrim} />
                </mesh>
                {/* Tấm tán quang LED */}
                <mesh position={[0, -0.042, 0]}>
                    <planeGeometry args={[4.7, 0.3]} />
                    <primitive object={materials.ledGlow} />
                </mesh>
                {/* Cáp treo thép lên trần */}
                {[-1.8, 1.8].map((cx, i) => (
                    <mesh key={i} position={[cx, 0.45, 0]}>
                        <cylinderGeometry args={[0.004, 0.004, 0.9, 8]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.9} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}
