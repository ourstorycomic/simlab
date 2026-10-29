"use client";

/**
 * ─── Lab3DRoom ───
 * Không gian Phòng Thí Nghiệm Hóa Học Hiện Đại, Tươi Sáng & Chuẩn Quốc Tế:
 * 1. Tông màu tươi sáng phòng sạch ISO (Bright Science Cleanroom):
 *    - Tường trắng sứ tinh khôi (#f8fafc) kết hợp ốp lamri chống bám bẩn pastel lam nhạt (#e0f2fe)
 *    - Tuyệt đối loại bỏ gạch nung tối tăm để không gian tràn ngập ánh sáng khoa học.
 * 2. Hệ thống đèn treo thả phòng lab trực quan (Visible Hanging Pendant Lights):
 *    - 2 dải đèn LED tuyến tính công nghiệp thả từ trần nhà Y=4.3 xuống ngay trên bàn thí nghiệm
 *    - Cáp treo thép mảnh chịu lực, hộp đèn nhôm phay xước trắng, mặt tán quang LED tỏa sáng rực rỡ
 *    - Ánh sáng rọi hội tụ thẳng xuống các lọ hóa chất và dụng cụ thủy tinh
 * 3. Bàn ghế và thiết bị tiếp đất chuẩn xác 100%:
 *    - Sàn nhà phản chiếu ở Y = -1.20
 *    - Ghế xoay phòng lab (RealisticLabChair) đặt chuẩn trên mặt sàn Y = -1.20
 *    - Mặt bàn thí nghiệm ở Y = -0.06
 */

import React, { useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial, Text } from "@react-three/drei";
import {
    RealisticLabProps,
    RealisticPeriodicTable,
    RealisticLabCupboard,
    RealisticLabChair,
} from "./ChemistryRealisticModels";

export default function Lab3DRoom() {
    // ─── Materials ───
    const materials = useMemo(() => {
        return {
            // Mặt bàn đá epoxy xám than chuyên dụng chống ăn mòn hóa chất
            counterTop: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#1e293b"),
                roughness: 0.22,
                metalness: 0.12,
            }),
            // Viền nẹp nhôm bo cạnh chống va đập
            edgeTrim: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#94a3b8"),
                metalness: 0.85,
                roughness: 0.25,
            }),
            // Thân tủ thép phòng lab sơn tĩnh điện màu ghi sáng thanh lịch
            cabinetSteel: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f1f5f9"),
                roughness: 0.35,
                metalness: 0.15,
            }),
            // Tay nắm ngăn kéo nhôm phay xước
            drawerHandle: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#475569"),
                metalness: 0.9,
                roughness: 0.15,
            }),
            // Đế chân bàn màu tối chống ẩm
            cabinetBase: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0f172a"),
                roughness: 0.6,
                metalness: 0.1,
            }),
            // Tường chính phòng lab: Trắng sứ sạch bóng, tươi sáng rực rỡ
            wallMain: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f8fafc"),
                roughness: 0.28,
                metalness: 0.04,
            }),
            // Ốp lamri chân tường: Xanh pastel ngọc lam nhạt thanh nhã
            wallWainscot: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#e0f2fe"),
                roughness: 0.32,
                metalness: 0.06,
            }),
            // Nẹp nhôm trang trí bo viền lamri
            wallTrim: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#0284c7"),
                roughness: 0.3,
                metalness: 0.45,
            }),
            // Chân len tường chống ẩm màu ghi sẫm
            baseboard: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#334155"),
                roughness: 0.5,
                metalness: 0.2,
            }),
            // Trần nhà thạch cao tiêu âm
            ceiling: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#ffffff"),
                roughness: 0.75,
            }),
            // Đèn trần panel LED & Mặt tán quang đèn thả
            lampGlow: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#ffffff"),
            }),
            // Khung đèn treo hợp kim nhôm
            pendantHousing: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#f8fafc"),
                roughness: 0.2,
                metalness: 0.2,
            }),
            // Cáp treo inox sáng bóng
            steelCable: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#94a3b8"),
                metalness: 0.9,
                roughness: 0.2,
            }),
            windowFrame: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#475569"),
                roughness: 0.3,
                metalness: 0.5,
            }),
            sky: new THREE.MeshBasicMaterial({
                color: new THREE.Color("#bae6fd"),
            }),
            boardFrame: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#573010"),
                roughness: 0.65,
            }),
            greenboard: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#134e4a"),
                roughness: 0.75,
            }),
        };
    }, []);

    return (
        <group>
            {/* ─── 1. HỆ THỐNG ÁNH SÁNG PHÒNG LAB CHUẨN KHOA HỌC & TƯƠI SÁNG ─── */}
            <ambientLight intensity={1.35} color="#f8fafc" />
            {/* Ánh sáng mặt trời tự nhiên từ cửa sổ chiếu vào */}
            <directionalLight
                position={[5, 8, 4]}
                intensity={2.0}
                color="#ffffff"
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />
            {/* Đèn trần lan tỏa tổng thể */}
            <pointLight position={[0, 3.8, 0.5]} intensity={1.8} color="#ffffff" distance={10} />
            <pointLight position={[-3.5, 2.5, -0.5]} intensity={1.2} color="#e0f2fe" distance={8} />
            <pointLight position={[3.5, 2.5, -0.5]} intensity={1.2} color="#fef3c7" distance={8} />

            {/* ─── 2. HỆ THỐNG ĐÈN TREO THẢ PENDANT HIỆN DIỆN TRỰC QUAN TRÊN BÀN LAB ─── */}
            {[-1.2, 1.2].map((xOffset, idx) => (
                <group key={`pendant-${idx}`} position={[xOffset, 1.72, 0.25]}>
                    {/* 2 Dây cáp treo inox thả từ trần nhà Y = 4.3 xuống Y = 1.72 (dài 2.58m) */}
                    <mesh position={[-0.55, 1.29, 0]}>
                        <cylinderGeometry args={[0.003, 0.003, 2.58, 8]} />
                        <primitive object={materials.steelCable} />
                    </mesh>
                    <mesh position={[0.55, 1.29, 0]}>
                        <cylinderGeometry args={[0.003, 0.003, 2.58, 8]} />
                        <primitive object={materials.steelCable} />
                    </mesh>

                    {/* Khung đèn LED hộp dài công nghiệp màu trắng phòng sạch */}
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[1.5, 0.09, 0.24]} />
                        <primitive object={materials.pendantHousing} />
                    </mesh>
                    {/* Đầu bịt kim loại hai bên */}
                    <mesh position={[-0.755, 0, 0]}>
                        <boxGeometry args={[0.015, 0.092, 0.242]} />
                        <primitive object={materials.edgeTrim} />
                    </mesh>
                    <mesh position={[0.755, 0, 0]}>
                        <boxGeometry args={[0.015, 0.092, 0.242]} />
                        <primitive object={materials.edgeTrim} />
                    </mesh>

                    {/* Mặt đèn tán quang LED phát sáng trắng rực rỡ */}
                    <mesh position={[0, -0.046, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[1.44, 0.2]} />
                        <primitive object={materials.lampGlow} />
                    </mesh>

                    {/* Luồng sáng hội tụ thẳng xuống bàn thí nghiệm */}
                    <spotLight
                        position={[0, -0.05, 0]}
                        intensity={3.5}
                        angle={0.8}
                        penumbra={0.5}
                        color="#ffffff"
                        distance={4.5}
                        castShadow
                    />
                </group>
            ))}

            {/* ─── 3. SÀN NHÀ PHÒNG LAB GẠCH MEN PHẢN CHIẾU CAO CẤP (Y = -1.20) ─── */}
            <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[26, 26]} />
                <MeshReflectorMaterial
                    blur={[300, 100]}
                    resolution={512}
                    mirror={0.25}
                    mixBlur={0.85}
                    mixStrength={0.45}
                    roughness={0.25}
                    depthScale={0.8}
                    minDepthThreshold={0.4}
                    maxDepthThreshold={1.4}
                    color="#f1f5f9"
                    metalness={0.08}
                />
            </mesh>

            {/* ─── 4. TRẦN NHÀ TÍCH HỢP HỘP ĐÈN PANEL LED (Ceiling Y = 4.3) ─── */}
            <group position={[0, 4.3, 0]}>
                {/* Tấm trần thạch cao */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[26, 26]} />
                    <primitive object={materials.ceiling} />
                </mesh>

                {/* 6 Hộp đèn Panel LED âm trần */}
                {[-3.5, 0, 3.5].map((x, xi) =>
                    [-1.5, 2.0].map((z, zi) => (
                        <group key={`${xi}-${zi}`} position={[x, -0.02, z]}>
                            {/* Khung đèn */}
                            <mesh rotation={[Math.PI / 2, 0, 0]}>
                                <boxGeometry args={[1.5, 0.9, 0.04]} />
                                <primitive object={materials.edgeTrim} />
                            </mesh>
                            {/* Mặt phát sáng */}
                            <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                <planeGeometry args={[1.38, 0.78]} />
                                <primitive object={materials.lampGlow} />
                            </mesh>
                        </group>
                    ))
                )}
            </group>

            {/* ─── 5. TƯỜNG TRÁI (LEFT WALL X = -6.8) - TƯƠI SÁNG & TỦ HÓA CHẤT ─── */}
            <group position={[-6.8, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
                {/* Tường chính phần trên trắng sáng */}
                <mesh position={[0, 0.5, 0]}>
                    <planeGeometry args={[24, 5.0]} />
                    <primitive object={materials.wallMain} />
                </mesh>
                {/* Ốp lamri pastel xanh nhạt chống bám bẩn */}
                <mesh position={[0, -2.1, 0.01]}>
                    <planeGeometry args={[24, 1.8]} />
                    <primitive object={materials.wallWainscot} />
                </mesh>
                {/* Nẹp viền trang trí */}
                <mesh position={[0, -1.2, 0.02]}>
                    <boxGeometry args={[24, 0.04, 0.02]} />
                    <primitive object={materials.wallTrim} />
                </mesh>
                {/* Chân len tường */}
                <mesh position={[0, -2.75, 0.03]}>
                    <boxGeometry args={[24, 0.16, 0.05]} />
                    <primitive object={materials.baseboard} />
                </mesh>

                {/* Bảng Nội quy An toàn Phòng Thí nghiệm (Lab Safety Poster) */}
                <group position={[1.5, 0.6, 0.05]}>
                    <mesh>
                        <boxGeometry args={[1.6, 2.2, 0.03]} />
                        <meshStandardMaterial color="#0284c7" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0, 0.02]}>
                        <planeGeometry args={[1.48, 2.08]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <Text position={[0, 0.8, 0.03]} fontSize={0.11} color="#0369a1" anchorX="center">
                        LAB SAFETY RULES
                    </Text>
                    <Text position={[0, 0.55, 0.03]} fontSize={0.07} color="#0f172a" anchorX="center">
                        1. Đeo kính & găng tay
                    </Text>
                    <Text position={[0, 0.35, 0.03]} fontSize={0.07} color="#0f172a" anchorX="center">
                        2. Không nếm, ngửi trực tiếp
                    </Text>
                    <Text position={[0, 0.15, 0.03]} fontSize={0.07} color="#0f172a" anchorX="center">
                        3. Rót axit vào nước, không làm ngược lại
                    </Text>
                    <Text position={[0, -0.05, 0.03]} fontSize={0.07} color="#0f172a" anchorX="center">
                        4. Rửa sạch dụng cụ sau khi dùng
                    </Text>
                    <Text position={[0, -0.3, 0.03]} fontSize={0.08} color="#b91c1c" anchorX="center">
                        AN TOÀN LÀ TRÊN HẾT
                    </Text>
                </group>

                {/* Biểu tượng kim cương nguy hại hóa chất (NFPA 704 Diamond) */}
                <group position={[-2.2, 0.8, 0.06]} rotation={[0, 0, Math.PI / 4]}>
                    <mesh position={[-0.22, 0.22, 0]}>
                        <boxGeometry args={[0.38, 0.38, 0.02]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                    <mesh position={[0.22, 0.22, 0]}>
                        <boxGeometry args={[0.38, 0.38, 0.02]} />
                        <meshStandardMaterial color="#2563eb" />
                    </mesh>
                    <mesh position={[0.22, -0.22, 0]}>
                        <boxGeometry args={[0.38, 0.38, 0.02]} />
                        <meshStandardMaterial color="#eab308" />
                    </mesh>
                    <mesh position={[-0.22, -0.22, 0]}>
                        <boxGeometry args={[0.38, 0.38, 0.02]} />
                        <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                </group>
            </group>

            {/* 2 Tủ Đựng Hóa Chất Cao Cấp bằng FBX kê dọc Tường Trái (đặt sát sàn) */}
            <RealisticLabCupboard
                position={[-6.1, -1.05, -1.4]}
                rotation={[0, Math.PI / 2, 0]}
                scale={[1.15, 1.15, 1.15]}
            />
            <RealisticLabCupboard
                position={[-6.1, -1.05, 0.4]}
                rotation={[0, Math.PI / 2, 0]}
                scale={[1.15, 1.15, 1.15]}
            />

            {/* ─── 6. TƯỜNG PHẢI (RIGHT WALL X = 6.8) - THIẾT BỊ Y TẾ & THÔNG GIÓ ─── */}
            <group position={[6.8, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <mesh position={[0, 0.5, 0]}>
                    <planeGeometry args={[24, 5.0]} />
                    <primitive object={materials.wallMain} />
                </mesh>
                <mesh position={[0, -2.1, 0.01]}>
                    <planeGeometry args={[24, 1.8]} />
                    <primitive object={materials.wallWainscot} />
                </mesh>
                <mesh position={[0, -1.2, 0.02]}>
                    <boxGeometry args={[24, 0.04, 0.02]} />
                    <primitive object={materials.wallTrim} />
                </mesh>
                <mesh position={[0, -2.75, 0.03]}>
                    <boxGeometry args={[24, 0.16, 0.05]} />
                    <primitive object={materials.baseboard} />
                </mesh>

                {/* Hộp Cấp Cứu Y Tế (First Aid Box) */}
                <group position={[-1.2, 0.5, 0.08]}>
                    <mesh>
                        <boxGeometry args={[0.5, 0.6, 0.16]} />
                        <meshStandardMaterial color="#ffffff" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0, 0.09]}>
                        <boxGeometry args={[0.22, 0.07, 0.01]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                    <mesh position={[0, 0, 0.09]}>
                        <boxGeometry args={[0.07, 0.22, 0.01]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                </group>

                {/* Bình Chữa Cháy Treo Tường (Fire Extinguisher) */}
                <group position={[1.4, 0.1, 0.12]}>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.09, 0.09, 0.55, 20]} />
                        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.32, 0]}>
                        <cylinderGeometry args={[0.03, 0.04, 0.08, 12]} />
                        <meshStandardMaterial color="#0f172a" metalness={0.8} />
                    </mesh>
                    <mesh position={[0.08, 0.24, 0]} rotation={[0, 0, 0.5]}>
                        <cylinderGeometry args={[0.012, 0.012, 0.3, 10]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.8} />
                    </mesh>
                </group>

                {/* ─── KỆ TREO TƯỜNG MỞ CHỨA HÓA CHẤT BỔ SUNG (Wall-Mounted Open Shelves) ─── */}
                {/* Kệ 1 */}
                <group position={[3.0, 0.2, 0.15]}>
                    {/* Giá đỡ L sắt */}
                    <mesh position={[-0.55, -0.02, -0.06]}>
                        <boxGeometry args={[0.04, 0.04, 0.12]} />
                        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.25} />
                    </mesh>
                    <mesh position={[0.55, -0.02, -0.06]}>
                        <boxGeometry args={[0.04, 0.04, 0.12]} />
                        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.25} />
                    </mesh>
                    {/* Tấm kệ gỗ */}
                    <mesh>
                        <boxGeometry args={[1.2, 0.04, 0.28]} />
                        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.15} />
                    </mesh>
                    {/* 4 Lọ hóa chất trên kệ */}
                    {["#ef4444", "#fbbf24", "#22c55e", "#6366f1"].map((col, i) => (
                        <group key={`shelf-bottle-r1-${i}`} position={[-0.35 + i * 0.24, 0.12, 0]}>
                            <mesh>
                                <cylinderGeometry args={[0.04, 0.045, 0.18, 14]} />
                                <meshStandardMaterial color="#ffffff" transparent opacity={0.35} roughness={0.1} />
                            </mesh>
                            <mesh position={[0, -0.02, 0]}>
                                <cylinderGeometry args={[0.035, 0.04, 0.12, 14]} />
                                <meshStandardMaterial color={col} roughness={0.15} transparent opacity={0.85} />
                            </mesh>
                            <mesh position={[0, 0.11, 0]}>
                                <cylinderGeometry args={[0.025, 0.03, 0.04, 12]} />
                                <meshStandardMaterial color="#64748b" metalness={0.5} />
                            </mesh>
                        </group>
                    ))}
                </group>

                {/* Kệ 2 cao hơn */}
                <group position={[3.0, 0.8, 0.15]}>
                    <mesh position={[-0.55, -0.02, -0.06]}>
                        <boxGeometry args={[0.04, 0.04, 0.12]} />
                        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.25} />
                    </mesh>
                    <mesh position={[0.55, -0.02, -0.06]}>
                        <boxGeometry args={[0.04, 0.04, 0.12]} />
                        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.25} />
                    </mesh>
                    <mesh>
                        <boxGeometry args={[1.2, 0.04, 0.28]} />
                        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.15} />
                    </mesh>
                    {/* 3 Lọ thuốc thử lớn */}
                    {["#0ea5e9", "#a855f7", "#f97316"].map((col, i) => (
                        <group key={`shelf-bottle-r2-${i}`} position={[-0.25 + i * 0.25, 0.14, 0]}>
                            <mesh>
                                <cylinderGeometry args={[0.05, 0.055, 0.22, 14]} />
                                <meshStandardMaterial color="#ffffff" transparent opacity={0.35} roughness={0.1} />
                            </mesh>
                            <mesh position={[0, -0.02, 0]}>
                                <cylinderGeometry args={[0.045, 0.05, 0.15, 14]} />
                                <meshStandardMaterial color={col} roughness={0.15} transparent opacity={0.82} />
                            </mesh>
                            <mesh position={[0, 0.13, 0]}>
                                <cylinderGeometry args={[0.03, 0.035, 0.04, 12]} />
                                <meshStandardMaterial color="#334155" metalness={0.5} />
                            </mesh>
                        </group>
                    ))}
                </group>

                {/* Poster Cấu trúc phân tử DNA */}
                <group position={[-3.5, 0.6, 0.04]}>
                    <mesh>
                        <boxGeometry args={[1.4, 1.8, 0.02]} />
                        <meshStandardMaterial color="#0369a1" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0, 0.015]}>
                        <planeGeometry args={[1.3, 1.7]} />
                        <meshBasicMaterial color="#e0f2fe" />
                    </mesh>
                    <Text position={[0, 0.7, 0.02]} fontSize={0.09} color="#0c4a6e" anchorX="center">
                        CẤU TRÚC PHÂN TỬ
                    </Text>
                    <Text position={[0, 0.52, 0.02]} fontSize={0.065} color="#0369a1" anchorX="center">
                        H₂O • CO₂ • NaCl
                    </Text>
                    {/* Mô hình phân tử H2O đơn giản */}
                    <mesh position={[0, 0, 0.04]}>
                        <sphereGeometry args={[0.12, 16, 16]} />
                        <meshStandardMaterial color="#ef4444" roughness={0.3} />
                    </mesh>
                    <mesh position={[-0.15, -0.12, 0.04]}>
                        <sphereGeometry args={[0.08, 14, 14]} />
                        <meshStandardMaterial color="#ffffff" roughness={0.3} />
                    </mesh>
                    <mesh position={[0.15, -0.12, 0.04]}>
                        <sphereGeometry args={[0.08, 14, 14]} />
                        <meshStandardMaterial color="#ffffff" roughness={0.3} />
                    </mesh>
                </group>
            </group>

            {/* Tủ lưu trữ thiết bị bên tường phải (đặt sát sàn) */}
            <RealisticLabCupboard
                position={[6.1, -1.05, -0.8]}
                rotation={[0, -Math.PI / 2, 0]}
                scale={[1.15, 1.15, 1.15]}
            />
            {/* Thêm 1 tủ nữa bên tường phải */}
            <RealisticLabCupboard
                position={[6.1, -1.05, 1.8]}
                rotation={[0, -Math.PI / 2, 0]}
                scale={[1.15, 1.15, 1.15]}
            />

            {/* ─── 7. TƯỜNG TRƯỚC PHÍA SAU LƯNG NGƯỜI DÙNG (FRONT WALL Z = 6.8) ─── */}
            <group position={[0, 1.6, 6.8]} rotation={[0, Math.PI, 0]}>
                <mesh position={[0, 0.5, 0]}>
                    <planeGeometry args={[24, 5.0]} />
                    <primitive object={materials.wallMain} />
                </mesh>
                <mesh position={[0, -2.1, 0.01]}>
                    <planeGeometry args={[24, 1.8]} />
                    <primitive object={materials.wallWainscot} />
                </mesh>
                <mesh position={[0, -1.2, 0.02]}>
                    <boxGeometry args={[24, 0.04, 0.02]} />
                    <primitive object={materials.wallTrim} />
                </mesh>
                <mesh position={[0, -2.75, 0.03]}>
                    <boxGeometry args={[24, 0.16, 0.05]} />
                    <primitive object={materials.baseboard} />
                </mesh>

                {/* Bảng trắng phía sau lưng (Whiteboard) */}
                <group position={[-3.0, 0.4, 0.05]}>
                    <mesh>
                        <boxGeometry args={[2.4, 1.6, 0.04]} />
                        <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.05} />
                    </mesh>
                    <mesh position={[0, 0, 0.025]}>
                        <planeGeometry args={[2.28, 1.48]} />
                        <meshStandardMaterial color="#ffffff" roughness={0.12} metalness={0.02} />
                    </mesh>
                    {/* Khay đựng bút vẽ */}
                    <mesh position={[0, -0.88, 0.06]}>
                        <boxGeometry args={[0.8, 0.05, 0.08]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.25} />
                    </mesh>
                </group>

                {/* Móc treo áo lab (Coat Hooks) */}
                <group position={[3.5, -0.5, 0.06]}>
                    {[0, 0.3, 0.6].map((dx, i) => (
                        <group key={`hook-${i}`} position={[dx, 0, 0]}>
                            <mesh>
                                <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
                                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
                            </mesh>
                            {/* Áo lab treo */}
                            {i === 0 && (
                                <mesh position={[0, -0.18, 0.02]}>
                                    <boxGeometry args={[0.18, 0.32, 0.02]} />
                                    <meshStandardMaterial color="#ffffff" roughness={0.4} />
                                </mesh>
                            )}
                        </group>
                    ))}
                </group>
            </group>

            {/* ─── 8. BỨC TƯỜNG CHÍNH PHÍA SAU (BACK WALL Z = -3.8) ─── */}
            <group position={[0, 1.8, -3.8]}>
                {/* Tường chính phần trên trắng sáng */}
                <mesh position={[0, 0.5, 0]}>
                    <planeGeometry args={[24, 5.5]} />
                    <primitive object={materials.wallMain} />
                </mesh>
                {/* Ốp lamri pastel xanh nhạt chân tường */}
                <mesh position={[0, -2.3, 0.01]}>
                    <planeGeometry args={[24, 1.8]} />
                    <primitive object={materials.wallWainscot} />
                </mesh>
                {/* Nẹp viền trang trí */}
                <mesh position={[0, -1.4, 0.02]}>
                    <boxGeometry args={[24, 0.04, 0.02]} />
                    <primitive object={materials.wallTrim} />
                </mesh>
                {/* Chân len tường */}
                <mesh position={[0, -2.9, 0.03]}>
                    <boxGeometry args={[24, 0.18, 0.05]} />
                    <primitive object={materials.baseboard} />
                </mesh>

                {/* Cửa sổ lớn nhìn ra bầu trời hoạt hình tươi sáng */}
                <group position={[-4.0, 0.6, 0.05]}>
                    {/* Bầu trời xanh biếc */}
                    <mesh position={[0, 0, -0.05]}>
                        <planeGeometry args={[2.8, 2.6]} />
                        <primitive object={materials.sky} />
                    </mesh>
                    {/* Khung cửa sổ nhôm xám công nghiệp */}
                    <mesh position={[0, 0, 0.05]}>
                        <boxGeometry args={[2.9, 0.08, 0.1]} />
                        <primitive object={materials.windowFrame} />
                    </mesh>
                    <mesh position={[0, 0, 0.05]}>
                        <boxGeometry args={[0.08, 2.7, 0.1]} />
                        <primitive object={materials.windowFrame} />
                    </mesh>
                    <mesh position={[-1.4, 0, 0.05]}>
                        <boxGeometry args={[0.08, 2.7, 0.1]} />
                        <primitive object={materials.windowFrame} />
                    </mesh>
                    <mesh position={[1.4, 0, 0.05]}>
                        <boxGeometry args={[0.08, 2.7, 0.1]} />
                        <primitive object={materials.windowFrame} />
                    </mesh>
                </group>

                {/* Cửa sổ thứ 2 bên phải */}
                <group position={[4.5, 0.6, 0.05]}>
                    <mesh position={[0, 0, -0.05]}>
                        <planeGeometry args={[2.0, 2.2]} />
                        <primitive object={materials.sky} />
                    </mesh>
                    <mesh position={[0, 0, 0.05]}>
                        <boxGeometry args={[2.1, 0.08, 0.1]} />
                        <primitive object={materials.windowFrame} />
                    </mesh>
                    <mesh position={[0, 0, 0.05]}>
                        <boxGeometry args={[0.08, 2.3, 0.1]} />
                        <primitive object={materials.windowFrame} />
                    </mesh>
                    <mesh position={[-1.0, 0, 0.05]}>
                        <boxGeometry args={[0.08, 2.3, 0.1]} />
                        <primitive object={materials.windowFrame} />
                    </mesh>
                    <mesh position={[1.0, 0, 0.05]}>
                        <boxGeometry args={[0.08, 2.3, 0.1]} />
                        <primitive object={materials.windowFrame} />
                    </mesh>
                </group>

                {/* Bảng Xanh Khoa Học (Science Blackboard) ở giữa tường - hạ thấp vừa tầm mắt */}
                <group position={[0.2, -0.42, 0.05]}>
                    {/* Khung gỗ sang trọng */}
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[4.2, 2.3, 0.06]} />
                        <primitive object={materials.boardFrame} />
                    </mesh>
                    {/* Mặt bảng xanh ngọc */}
                    <mesh position={[0, 0, 0.035]}>
                        <planeGeometry args={[4.0, 2.1]} />
                        <primitive object={materials.greenboard} />
                    </mesh>

                    {/* Tiêu đề thanh lịch & công thức cân đối hai bên */}
                    <Text position={[-1.2, 0.5, 0.05]} fontSize={0.13} color="#a7f3d0" anchorX="center">
                        2H2 + O2 → 2H2O
                    </Text>
                    <Text position={[-1.2, 0.15, 0.05]} fontSize={0.11} color="#fef08a" anchorX="center">
                        Fe + CuSO4 → FeSO4 + Cu
                    </Text>
                    <Text position={[1.2, 0.5, 0.05]} fontSize={0.13} color="#67e8f9" anchorX="center">
                        HCl + NaOH → NaCl + H2O
                    </Text>
                    <Text position={[1.2, 0.15, 0.05]} fontSize={0.11} color="#f472b6" anchorX="center">
                        E = mc² • PV = nRT
                    </Text>
                </group>

                {/* Bảng Tuần Hoàn Hóa Học Chuyên Nghiệp */}
                <group position={[4.2, 0.6, 0.05]}>
                    <RealisticPeriodicTable />
                </group>
            </group>

            {/* ─── 9. BÀN THÍ NGHIỆM TRUNG TÂM CAO CẤP (CHEMISTRY LAB ISLAND) ─── */}
            <group position={[0, -0.4, 0.25]}>
                {/* 1. Mặt bàn đá Epoxy xám graphite (Y = -0.06 tuyệt đối) */}
                <mesh position={[0, 0.30, 0]} receiveShadow castShadow>
                    <boxGeometry args={[4.4, 0.08, 1.8]} />
                    <primitive object={materials.counterTop} />
                </mesh>

                {/* Gờ nẹp nhôm bo viền mặt bàn */}
                <mesh position={[0, 0.342, 0.89]}>
                    <boxGeometry args={[4.42, 0.035, 0.03]} />
                    <primitive object={materials.edgeTrim} />
                </mesh>
                <mesh position={[0, 0.342, -0.89]}>
                    <boxGeometry args={[4.42, 0.035, 0.03]} />
                    <primitive object={materials.edgeTrim} />
                </mesh>
                <mesh position={[-2.19, 0.342, 0]}>
                    <boxGeometry args={[0.03, 0.035, 1.8]} />
                    <primitive object={materials.edgeTrim} />
                </mesh>
                <mesh position={[2.19, 0.342, 0]}>
                    <boxGeometry args={[0.03, 0.035, 1.8]} />
                    <primitive object={materials.edgeTrim} />
                </mesh>

                {/* 2. Thân tủ kỹ thuật phòng lab */}
                <mesh position={[0, -0.19, 0]} receiveShadow>
                    <boxGeometry args={[4.1, 0.86, 1.6]} />
                    <primitive object={materials.cabinetSteel} />
                </mesh>

                {/* Các rãnh chia ngăn kéo và hộc tủ phía trước */}
                {[-1.5, -0.5, 0.5, 1.5].map((x, idx) => (
                    <group key={idx} position={[x, 0, 0.81]}>
                        <mesh position={[0, 0.12, 0]}>
                            <boxGeometry args={[0.88, 0.22, 0.02]} />
                            <primitive object={materials.cabinetSteel} />
                        </mesh>
                        <mesh position={[0, 0.12, 0.02]}>
                            <boxGeometry args={[0.26, 0.024, 0.02]} />
                            <primitive object={materials.drawerHandle} />
                        </mesh>
                        <mesh position={[0, -0.22, 0]}>
                            <boxGeometry args={[0.88, 0.42, 0.02]} />
                            <primitive object={materials.cabinetSteel} />
                        </mesh>
                        <mesh position={[0.3, -0.22, 0.02]}>
                            <boxGeometry args={[0.024, 0.18, 0.02]} />
                            <primitive object={materials.drawerHandle} />
                        </mesh>
                    </group>
                ))}

                {/* 3. Chân đế chống ẩm (Toe-kick) */}
                <mesh position={[0, -0.68, 0]}>
                    <boxGeometry args={[3.85, 0.14, 1.4]} />
                    <primitive object={materials.cabinetBase} />
                </mesh>
            </group>

            {/* ─── 10. BÀN PHỤ TƯỜNG TRÁI VỚI BỒN RỬA (SIDE COUNTER & SINK) ─── */}
            <group position={[-5.5, -0.4, 3.0]}>
                {/* Mặt bàn đá */}
                <mesh position={[0, 0.30, 0]} castShadow receiveShadow>
                    <boxGeometry args={[2.0, 0.07, 0.8]} />
                    <primitive object={materials.counterTop} />
                </mesh>
                {/* Thân tủ bên dưới */}
                <mesh position={[0, -0.19, 0]}>
                    <boxGeometry args={[1.8, 0.85, 0.7]} />
                    <primitive object={materials.cabinetSteel} />
                </mesh>
                <mesh position={[0, -0.68, 0]}>
                    <boxGeometry args={[1.6, 0.14, 0.55]} />
                    <primitive object={materials.cabinetBase} />
                </mesh>
                {/* Bồn rửa (Sink basin) */}
                <mesh position={[0.3, 0.28, 0]}>
                    <boxGeometry args={[0.5, 0.06, 0.38]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.15} />
                </mesh>
                {/* Vòi nước hình cổ ngỗng */}
                <mesh position={[0.3, 0.42, -0.12]}>
                    <cylinderGeometry args={[0.012, 0.012, 0.15, 8]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} />
                </mesh>
                <mesh position={[0.3, 0.48, -0.06]} rotation={[0, 0, 0.5]}>
                    <cylinderGeometry args={[0.012, 0.012, 0.14, 8]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} />
                </mesh>
                {/* Bình xà phòng rửa tay */}
                <mesh position={[-0.35, 0.36, 0.15]}>
                    <boxGeometry args={[0.07, 0.1, 0.05]} />
                    <meshStandardMaterial color="#22c55e" roughness={0.3} />
                </mesh>
            </group>

            {/* ─── 11. GHẾ XOAY PHÒNG LAB ĐẶT CHUẨN TRÊN MẶT SÀN ─── */}
            <RealisticLabChair
                position={[-1.6, -1.35, 1.45]}
                rotation={[0, 0.3, 0]}
                scale={[1.1, 1.1, 1.1]}
            />
            <RealisticLabChair
                position={[1.6, -1.35, 1.45]}
                rotation={[0, -0.3, 0]}
                scale={[1.1, 1.1, 1.1]}
            />
            {/* Thêm 1 ghế phụ bên bồn rửa */}
            <RealisticLabChair
                position={[-4.8, -1.35, 3.6]}
                rotation={[0, -1.2, 0]}
                scale={[1.0, 1.0, 1.0]}
            />

            {/* ─── 12. ĐẠO CỤ PHÒNG LAB CHUYÊN NGHIỆP TỪ UNITY ─── */}
            <RealisticLabProps />

            {/* Giá để ống nghiệm màu sắc trên bàn (đặt chuẩn tại Y = -0.06) */}
            <group position={[1.7, -0.06, -0.1]}>
                <mesh position={[0, 0.08, 0]}>
                    <boxGeometry args={[0.55, 0.16, 0.16]} />
                    <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.4} />
                </mesh>
                {["#ef4444", "#3b82f6", "#10b981", "#8b5cf6"].map((col, idx) => (
                    <mesh key={idx} position={[-0.18 + idx * 0.12, 0.14, 0]}>
                        <cylinderGeometry args={[0.022, 0.022, 0.26, 12]} />
                        <meshStandardMaterial color={col} roughness={0.1} transparent opacity={0.9} />
                    </mesh>
                ))}
            </group>

            {/* ─── 13. THÙNG RÁC PHÂN LOẠI PHÒNG LAB (Waste Bins) ─── */}
            <group position={[2.8, -1.2, 1.2]}>
                {/* Thùng rác y tế đỏ */}
                <mesh position={[0, 0.22, 0]}>
                    <cylinderGeometry args={[0.14, 0.12, 0.44, 16]} />
                    <meshStandardMaterial color="#dc2626" roughness={0.35} />
                </mesh>
                <mesh position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.14, 16]} />
                    <meshStandardMaterial color="#b91c1c" roughness={0.3} />
                </mesh>
                <Text position={[0, 0.28, 0.145]} fontSize={0.035} color="#ffffff" anchorX="center">
                    RÁC ĐỘC HẠI
                </Text>
            </group>
            <group position={[3.2, -1.2, 1.2]}>
                {/* Thùng rác thường xanh lá */}
                <mesh position={[0, 0.22, 0]}>
                    <cylinderGeometry args={[0.14, 0.12, 0.44, 16]} />
                    <meshStandardMaterial color="#16a34a" roughness={0.35} />
                </mesh>
                <mesh position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.14, 16]} />
                    <meshStandardMaterial color="#15803d" roughness={0.3} />
                </mesh>
                <Text position={[0, 0.28, 0.145]} fontSize={0.035} color="#ffffff" anchorX="center">
                    RÁC TÁI CHẾ
                </Text>
            </group>

            {/* ─── 14. CHẬU CÂY XANH TRANG TRÍ PHÒNG LAB (Potted Plant) ─── */}
            <group position={[-5.8, -1.2, -2.5]}>
                {/* Chậu gốm */}
                <mesh position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.18, 0.14, 0.4, 16]} />
                    <meshStandardMaterial color="#78350f" roughness={0.7} />
                </mesh>
                {/* Đất trồng */}
                <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.17, 16]} />
                    <meshStandardMaterial color="#451a03" roughness={0.8} />
                </mesh>
                {/* Thân cây */}
                <mesh position={[0, 0.62, 0]}>
                    <cylinderGeometry args={[0.02, 0.025, 0.42, 8]} />
                    <meshStandardMaterial color="#166534" roughness={0.6} />
                </mesh>
                {/* Tán lá tròn */}
                <mesh position={[-0.08, 0.82, 0.05]}>
                    <sphereGeometry args={[0.18, 12, 12]} />
                    <meshStandardMaterial color="#22c55e" roughness={0.55} />
                </mesh>
                <mesh position={[0.1, 0.88, -0.05]}>
                    <sphereGeometry args={[0.15, 12, 12]} />
                    <meshStandardMaterial color="#16a34a" roughness={0.55} />
                </mesh>
                <mesh position={[0, 0.95, 0]}>
                    <sphereGeometry args={[0.14, 12, 12]} />
                    <meshStandardMaterial color="#4ade80" roughness={0.55} />
                </mesh>
            </group>

            {/* ─── 15. KỆ SÁCH TƯỜNG SAU BÊN CẠNH BẢNG XANH ─── */}
            <group position={[-6.5, 0.4, -3.6]} rotation={[0, Math.PI / 2, 0]}>
                {/* Khung kệ */}
                <mesh>
                    <boxGeometry args={[1.0, 0.04, 0.24]} />
                    <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.2} />
                </mesh>
                {/* Sách giáo trình Hóa học */}
                {[
                    { c: "#1d4ed8", w: 0.06 }, { c: "#0891b2", w: 0.05 }, { c: "#dc2626", w: 0.07 },
                    { c: "#059669", w: 0.05 }, { c: "#7c3aed", w: 0.06 }, { c: "#ea580c", w: 0.04 },
                    { c: "#0284c7", w: 0.07 }, { c: "#be123c", w: 0.05 },
                ].map((book, i) => (
                    <mesh key={`book-${i}`} position={[-0.4 + i * 0.11, 0.1, 0]}>
                        <boxGeometry args={[book.w, 0.18, 0.16]} />
                        <meshStandardMaterial color={book.c} roughness={0.55} />
                    </mesh>
                ))}
            </group>
            {/* Kệ sách thứ 2 cao hơn */}
            <group position={[-6.5, 0.9, -3.6]} rotation={[0, Math.PI / 2, 0]}>
                <mesh>
                    <boxGeometry args={[1.0, 0.04, 0.24]} />
                    <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.2} />
                </mesh>
                {[
                    { c: "#0f766e", w: 0.07 }, { c: "#9333ea", w: 0.05 }, { c: "#b45309", w: 0.06 },
                    { c: "#1e40af", w: 0.05 }, { c: "#be185d", w: 0.06 },
                ].map((book, i) => (
                    <mesh key={`book2-${i}`} position={[-0.3 + i * 0.13, 0.1, 0]}>
                        <boxGeometry args={[book.w, 0.16, 0.14]} />
                        <meshStandardMaterial color={book.c} roughness={0.55} />
                    </mesh>
                ))}
            </group>

            {/* ─── 16. MÔ HÌNH PHÂN TỬ 3D TRÊN BÀN PHỤ (Molecule Display Model) ─── */}
            <group position={[-5.8, -0.06, 3.2]}>
                {/* Đế trưng bày acrylic */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.12, 0.14, 0.04, 16]} />
                    <meshStandardMaterial color="#e2e8f0" transparent opacity={0.6} roughness={0.1} />
                </mesh>
                {/* Mô hình phân tử NaCl */}
                <mesh position={[0, 0.1, 0]}>
                    <sphereGeometry args={[0.05, 12, 12]} />
                    <meshStandardMaterial color="#6366f1" roughness={0.3} />
                </mesh>
                <mesh position={[0.08, 0.1, 0]}>
                    <sphereGeometry args={[0.04, 12, 12]} />
                    <meshStandardMaterial color="#22c55e" roughness={0.3} />
                </mesh>
                {/* Liên kết */}
                <mesh position={[0.04, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.006, 0.006, 0.06, 6]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.5} />
                </mesh>
            </group>
        </group>
    );
}

